# -*- coding: utf-8 -*-
"""
Sync 132 video folders to VPS with resume capability and progress logging.
"""
import os
import sys
import time
import subprocess
from pathlib import Path

ROOT = Path(r"D:\YTB\H2DEV-Project")
VIDEO_DIR = ROOT / "video"
SSH_KEY = Path(os.path.expanduser("~/.ssh/id_rsa_vps"))
HOST = "103.249.201.164"
REMOTE_DEST = "/www/wwwroot/h2dev-learn.tonymmo.com/app/video/"
LOG_FILE = ROOT / "_internal" / "video_sync.log"

def log(msg):
    ts = time.strftime("[%Y-%m-%d %H:%M:%S]")
    line = f"{ts} {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def get_remote_skus():
    try:
        res = subprocess.run(
            ["ssh", "-i", str(SSH_KEY), "-o", "StrictHostKeyChecking=no", f"root@{HOST}", f"ls -1 {REMOTE_DEST}"],
            capture_output=True, text=True, timeout=15
        )
        if res.returncode == 0:
            return set(res.stdout.splitlines())
    except Exception as e:
        log(f"Error checking remote SKUs: {e}")
    return set()

def main():
    log("=== STARTING VIDEO SYNC TO VPS ===")
    local_folders = sorted([f for f in VIDEO_DIR.iterdir() if f.is_dir() and f.name.startswith("VIDEO-")])
    total = len(local_folders)
    log(f"Total local video folders: {total}")

    remote_skus = get_remote_skus()
    log(f"Already on VPS: {len(remote_skus)}/{total}")

    completed = len(remote_skus)
    for idx, folder in enumerate(local_folders, 1):
        sku = folder.name
        if sku in remote_skus:
            continue

        size_mb = sum(f.stat().st_size for f in folder.glob("*") if f.is_file()) / (1024 * 1024)
        log(f"[{idx}/{total}] Uploading {sku} ({size_mb:.1f} MB)...")
        t0 = time.time()
        
        # scp upload
        cmd = [
            "scp", "-i", str(SSH_KEY),
            "-o", "StrictHostKeyChecking=no",
            "-o", "ConnectTimeout=10",
            "-r", str(folder),
            f"root@{HOST}:{REMOTE_DEST}"
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
