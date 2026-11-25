# -*- coding: utf-8 -*-
"""
Sync video folders to VPS with resume capability and progress logging.
Reads VPS connection config from environment variables / local .env.
"""
import os
import re
import shlex
import sys
import time
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VIDEO_DIR = ROOT / "video"
LOG_FILE = ROOT / "_internal" / "video_sync.log"
SAFE_SKU_RE = re.compile(r"^[A-Za-z0-9_-]+$")


def _load_dotenv(env_path: Path) -> None:
    if not env_path.is_file():
        return
    try:
        for raw_line in env_path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip()
            if len(val) >= 2 and ((val[0] == val[-1] == '"') or (val[0] == val[-1] == "'")):
                val = val[1:-1]
            if key and key not in os.environ:
                os.environ[key] = val
    except OSError:
        pass


_load_dotenv(ROOT / ".env")


def _get_strict_host_key() -> str:
    val = (os.environ.get("H2DEV_SSH_STRICT_HOST_KEY") or "yes").strip().lower()
    if val not in ("yes", "accept-new"):
        raise ValueError(f"Disallowed H2DEV_SSH_STRICT_HOST_KEY value (allowed: 'yes', 'accept-new'): {val!r}")
    return val


def _resolve_config():
    host = (os.environ.get("H2DEV_VPS_HOST") or os.environ.get("VPS_HOST") or "").strip()
    port = (os.environ.get("H2DEV_VPS_PORT") or os.environ.get("VPS_PORT") or "22").strip()
    user = (os.environ.get("H2DEV_VPS_USER") or os.environ.get("VPS_USER") or "root").strip()
    ssh_key_raw = (os.environ.get("H2DEV_VPS_SSH_KEY") or os.environ.get("VPS_SSH_KEY") or "").strip()
    ssh_key = Path(os.path.expanduser(ssh_key_raw)) if ssh_key_raw else None
    remote_dest = (
        os.environ.get("H2DEV_VPS_VIDEO_DEST")
        or os.environ.get("VPS_REMOTE_DEST")
        or os.environ.get("REMOTE_DEST")
        or ""
    ).strip()
    if not remote_dest:
        app_dir = (os.environ.get("H2DEV_VPS_APP_DIR") or os.environ.get("VPS_APP_DIR") or "").strip()
        if app_dir:
            remote_dest = app_dir.rstrip("/") + "/video/"
    strict_host_key = _get_strict_host_key()
    return host, port, user, ssh_key, remote_dest, strict_host_key


HOST, PORT, SSH_USER, SSH_KEY, REMOTE_DEST, STRICT_HOST_KEY = _resolve_config()


def _target_host() -> str:
    return HOST if "@" in HOST else f"{SSH_USER}@{HOST}"


def _ssh_base_args(port_flag: str):
    args = []
    if SSH_KEY and SSH_KEY.exists():
        args.extend(["-i", str(SSH_KEY)])
    args.extend([
        port_flag, PORT,
        "-o", "BatchMode=yes",
        "-o", f"StrictHostKeyChecking={STRICT_HOST_KEY}",
    ])
    return args


def log(msg):
    ts = time.strftime("[%Y-%m-%d %H:%M:%S]")
    line = f"{ts} {msg}"
    print(line, flush=True)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def get_remote_skus():
    try:
        res = subprocess.run(
            ["ssh", *_ssh_base_args("-p"), _target_host(), f"ls -1 -- {shlex.quote(REMOTE_DEST)}"],
            capture_output=True, text=True, timeout=15
        )
        if res.returncode == 0:
            return {s.strip() for s in res.stdout.splitlines() if SAFE_SKU_RE.fullmatch(s.strip())}
    except Exception as e:
        log(f"Error checking remote SKUs: {e}")
    return set()


def main():
    if not HOST:
        raise SystemExit("ERROR: H2DEV_VPS_HOST (or VPS_HOST) must be set in environment or .env")
    if not REMOTE_DEST:
        raise SystemExit("ERROR: H2DEV_VPS_VIDEO_DEST / REMOTE_DEST (or H2DEV_VPS_APP_DIR) must be set in environment or .env")

    log("=== STARTING VIDEO SYNC TO VPS ===")
    local_folders = sorted([
        f for f in VIDEO_DIR.iterdir()
        if f.is_dir() and f.name.startswith("VIDEO-") and SAFE_SKU_RE.fullmatch(f.name)
    ])
    total = len(local_folders)
    log(f"Total local video folders: {total}")

    remote_skus = get_remote_skus()
    log(f"Already on VPS: {len(remote_skus)}/{total}")

    completed = len(remote_skus)
    remote_target = f"{_target_host()}:{REMOTE_DEST}"
    for idx, folder in enumerate(local_folders, 1):
        sku = folder.name
        if not SAFE_SKU_RE.fullmatch(sku):
            log(f"Skipping invalid SKU folder name: {sku!r}")
            continue
        if sku in remote_skus:
            continue

        size_mb = sum(f.stat().st_size for f in folder.glob("*") if f.is_file()) / (1024 * 1024)
        log(f"[{idx}/{total}] Uploading {sku} ({size_mb:.1f} MB)...")
        t0 = time.time()

        cmd = [
            "scp",
            *_ssh_base_args("-P"),
            "-o", "ConnectTimeout=10",
            "-r", "--", str(folder),
            remote_target,
        ]

        success = False
        for attempt in range(3):
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode == 0:
                success = True
                break
            log(f"  Attempt {attempt+1} failed: {res.stderr.strip()[:100]}. Retrying in 3s...")
            time.sleep(3)

        dur = time.time() - t0
        if success:
            speed = size_mb / dur if dur > 0 else 0
            completed += 1
            pct = (completed / total) * 100
            log(f"  Done {sku} in {dur:.1f}s ({speed:.2f} MB/s) - Total progress: {completed}/{total} ({pct:.1f}%)")
        else:
            log(f"  FAILED {sku} after 3 attempts.")

    log(f"=== SYNC FINISHED: {completed}/{total} videos uploaded ===")


if __name__ == "__main__":
    main()
