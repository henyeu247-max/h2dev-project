#!/usr/bin/env python3
"""
Generate composite images and video clips for each shot — fully parallelized.

Both phases use the same kie.ai Jobs API (taskId-based polling), so ALL shots
run concurrently in both phases:

  Phase 1 — ALL composite images IN PARALLEL (flux-2/pro-image-to-image)
    • Submits all shots simultaneously → each gets a unique taskId
    • Polls all tasks concurrently → total time ≈ slowest single composite
    • Downloads composites to ./composites/{shot_id}.png

  Phase 2 — ALL video clips IN PARALLEL (grok-imagine/image-to-video)
    • Submits all shots simultaneously → each gets a unique taskId
    • Polls all tasks concurrently → total time ≈ slowest single video
    • Downloads clips to ./clips/{shot_id}.mp4

Config — create a .env file in your project directory:
  KIE_API_TOKEN=your_kie_api_key_here
  IMGBB_API_KEY=your_imgbb_api_key_here

  On first run the script auto-creates a .env template if one is not found.

Usage:
  cd /path/to/your/project
  python ~/.claude/skills/generating-composite-and-video/scripts/generate_videos.py

Requirements:
  pip install requests
  characters.json and backgrounds.json must have image_url fields
  (populated by generate_images.py from Step 3 of the pipeline).
"""

import os
import sys
import json
import time
import threading
import argparse
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import requests

# Force UTF-8 stdout on Windows (cp1252 console can't render →, ✓, etc.)
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


# ── Config loading (.env) ─────────────────────────────────────────────────────

_ENV_TEMPLATE = """\
# Story-to-Animation — API Keys
# Get your kie.ai key from: https://kie.ai -> Dashboard -> API Keys
# Get your imgbb key from:  https://api.imgbb.com (free account)

KIE_API_TOKEN=your_kie_api_key_here
IMGBB_API_KEY=your_imgbb_api_key_here
"""

def load_env() -> None:
    """Load .env from the project directory into os.environ.
    Auto-creates a template .env and exits cleanly if none is found.
    Real environment variables always take precedence.
    """
    env_path = Path(".env")
    if not env_path.exists():
        env_path.write_text(_ENV_TEMPLATE, encoding="utf-8")
        print("\n  .env file created in your project directory.")
        print("  -> Open .env, fill in your API keys, then re-run this script.\n")
        raise SystemExit(0)

    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip()
        if key and key not in os.environ:
            os.environ[key] = val

    print("  Loaded API keys from .env")

def get_key(name: str) -> str:
    """Return a required key from os.environ (populated by load_env)."""
    val = os.environ.get(name, "").strip()
    placeholder = f"your_{name.lower()}_here"
    if not val or val == placeholder:
        print(f"\nERROR: '{name}' is not set in .env")
        print(f"  Open .env in your project directory and set:  {name}=your_actual_key")
        raise SystemExit(1)
    return val

load_env()
KIE_API_TOKEN = get_key("KIE_API_TOKEN")


# ── API endpoints (both phases use the same kie.ai Jobs API) ──────────────────

JOBS_CREATE_URL = "https://api.kie.ai/api/v1/jobs/createTask"
JOBS_STATUS_URL = "https://api.kie.ai/api/v1/jobs/recordInfo"

POST_HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {KIE_API_TOKEN}",
}
GET_HEADERS = {"Authorization": f"Bearer {KIE_API_TOKEN}"}


# ── Tunable settings ──────────────────────────────────────────────────────────

COMPOSITE_MAX_WORKERS = 5    # parallel composite jobs (Phase 1)
VIDEO_MAX_WORKERS     = 5    # parallel video jobs (Phase 2)

POLL_INTERVAL         = 5    # seconds between polls
MAX_POLLS             = 120  # max wait: 120 × 5s = 10 minutes per task

# grok-imagine/image-to-video settings (per docs.kie.ai v1.0+)
VIDEO_ASPECT_RATIO  = "16:9"     # "16:9", "9:16", "1:1"
VIDEO_DURATION      = 8          # seconds (6-30)
VIDEO_RESOLUTION    = "720p"     # "480p" or "720p"
VIDEO_MODE          = "normal"   # "fun" | "normal" | "spicy"


# ── Thread-safe print ─────────────────────────────────────────────────────────

_print_lock = threading.Lock()

def tprint(*args, **kwargs):
    with _print_lock:
        print(*args, **kwargs)

def fmt_elapsed(start: float) -> str:
    s = int(time.time() - start)
    return f"{s // 60}m{s % 60:02d}s" if s >= 60 else f"{s}s"


def valid_media(path: Path, kind: str) -> bool:
    """Validate a generated asset; a path existing alone is not success."""
    if not path.is_file() or path.stat().st_size < 32:
        return False
    try:
        with path.open("rb") as fh:
            head = fh.read(128)
        if kind == "image":
            if not (head.startswith(b"\x89PNG\r\n\x1a\n") or head.startswith(b"\xff\xd8\xff")):
                return False
            subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", str(path)], check=True, capture_output=True, text=True, timeout=30)
            return True
        if b"ftyp" not in head[:64] and not head.startswith(b"\x1a\x45\xdf\xa3"):
            return False
        subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)], check=True, capture_output=True, text=True, timeout=30)
        return True
    except (OSError, subprocess.SubprocessError):
        return False


# ── Shared Jobs API helpers ───────────────────────────────────────────────────

def submit_job(model: str, input_payload: dict) -> tuple:
    """Submit any kie.ai job. Returns (task_id, None) or (None, error_str)."""
    payload = {"model": model, "input": input_payload}
    try:
        resp   = requests.post(JOBS_CREATE_URL, headers=POST_HEADERS, json=payload, timeout=30)
        resp.raise_for_status()
        result = resp.json()
        if result.get("code") != 200:
            return None, result.get("msg", "Unknown API error")
        return result["data"]["taskId"], None
    except Exception as e:
        return None, str(e)


def poll_job(task_id: str, label: str) -> tuple:
    """Poll a Jobs API task by taskId until done. Returns (result_url, None) or (None, error_str).

    Used for Phase 1 composite images (flux-2/pro-image-to-image).
    """
    params = {"taskId": task_id}
    for attempt in range(1, MAX_POLLS + 1):
        time.sleep(POLL_INTERVAL)
        try:
            resp  = requests.get(JOBS_STATUS_URL, headers=GET_HEADERS, params=params, timeout=30)
            resp.raise_for_status()
            data  = resp.json().get("data", {})
            state = data.get("state", "").lower()

            if state == "success":
                result = data.get("resultJson", {})
                if isinstance(result, str):
                    result = json.loads(result)
                urls = result.get("resultUrls", [])
                if urls:
                    return urls[0], None
                return None, "state=success but no resultUrls in response"

            elif state == "fail":
                return None, data.get("failMsg", "Job failed (no reason given)")

            else:
                # Log progress every 30 seconds
                elapsed_s = attempt * POLL_INTERVAL
                if elapsed_s % 30 == 0:
                    tprint(f"    [{label}] {state or 'waiting'} — {elapsed_s}s elapsed...")

        except Exception as e:
            tprint(f"    [{label}] poll error: {e}")

    timeout_s = MAX_POLLS * POLL_INTERVAL
    return None, f"Timed out after {timeout_s // 60}m{timeout_s % 60:02d}s"


def download_file(url: str, output_path: Path) -> bool:
    try:
        resp = requests.get(url, timeout=120)
        resp.raise_for_status()
        kind = "image" if output_path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"} else "video"
        partial = output_path.with_suffix(output_path.suffix + ".part")
        partial.write_bytes(resp.content)
        if not valid_media(partial, kind):
            partial.unlink(missing_ok=True)
            return False
        partial.replace(output_path)
        return True
    except Exception as e:
        tprint(f"    Download failed: {e}")
        return False


# ── Phase 1 worker: composite image ──────────────────────────────────────────

def run_composite(shot: dict, bg_map: dict, char_map: dict,
                  composite_path: Path) -> tuple:
    """Generate one composite image. Returns (shot_id, url, None) or (shot_id, None, error)."""
    sid = shot["shot_id"]
    t0  = time.time()
    if composite_path.exists() and valid_media(composite_path, "image"):
        return sid, None, "valid composite exists; refusing to overwrite without a recorded job URL"

    # Build input_urls: background first, then characters
    bg         = bg_map.get(shot.get("background", ""), {})
    input_urls = []
    if bg.get("image_url"):
        input_urls.append(bg["image_url"])
    for cid in shot.get("characters", []):
        c = char_map.get(cid, {})
        if c.get("image_url"):
            input_urls.append(c["image_url"])

    if not input_urls:
        return sid, None, "No image_urls found for this shot"

    prompt = (
        f"Composited animation scene: {shot.get('action', 'characters in location')}. "
        f"Pixar-style 3D animation, cinematic 16:9 composition, "
        f"high quality render, no text, no UI elements."
    )

    task_id, err = submit_job("flux-2/pro-image-to-image", {
        "input_urls":   input_urls,
        "prompt":       prompt,
        "aspect_ratio": "16:9",
        "resolution":   "1K",
    })
    if not task_id:
        return sid, None, f"Submit failed: {err}"

    tprint(f"  [{sid}] composite submitted → taskId: {task_id[:16]}...")

    url, err = poll_job(task_id, f"{sid}/composite")
    if not url:
        return sid, None, err

    if not download_file(url, composite_path):
        return sid, None, "Composite download failed"
    tprint(f"  [{sid}] composite done ({fmt_elapsed(t0)}) → composites/{sid}.png")
    return sid, url, None


# ── Phase 2 worker: grok-imagine/image-to-video (parallel — taskId-based) ────────

def run_video(shot: dict, composite_url: str, clip_path: Path) -> tuple:
    """Generate one video clip. Returns (shot_id, True, None) or (shot_id, False, error)."""
    sid = shot["shot_id"]
    t0  = time.time()
    if valid_media(clip_path, "video"):
        return sid, True, None

    task_id, err = submit_job("grok-imagine/image-to-video", {
        "prompt":       shot.get("veo_prompt", shot.get("action", "")),
        "image_urls":   [composite_url],
        "aspect_ratio": VIDEO_ASPECT_RATIO,
        "duration":     VIDEO_DURATION,
        "resolution":   VIDEO_RESOLUTION,
        "mode":         VIDEO_MODE,
    })
    if not task_id:
        return sid, False, f"Submit failed: {err}"

    tprint(f"  [{sid}] video submitted   → taskId: {task_id[:16]}...")

    url, err = poll_job(task_id, f"{sid}/video")
    if not url:
        return sid, False, err

    if download_file(url, clip_path):
        tprint(f"  [{sid}] video done ({fmt_elapsed(t0)}) → clips/{sid}.mp4")
        return sid, True, None

    return sid, False, "Download failed"


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate composite images and video clips.")
    parser.add_argument(
        "--shot", metavar="SHOT_ID",
        help="Process a single shot only (e.g. --shot shot_001). "
             "Claude uses this for per-shot approval workflow. "
             "Omit to process all pending shots at once.",
    )
    args = parser.parse_args()

    run_start = time.time()
    print("\n=== Story-to-Animation: Step 5 — Composite + Video Generation ===\n")

    # ── Load data ─────────────────────────────────────────────────────────────
    for fname in ["shots.json", "characters.json", "backgrounds.json"]:
        if not Path(fname).exists():
            print(f"ERROR: {fname} not found in current directory")
            raise SystemExit(1)

    shots_data = json.loads(Path("shots.json").read_text(encoding="utf-8"))
    chars_data = json.loads(Path("characters.json").read_text(encoding="utf-8"))
    bgs_data   = json.loads(Path("backgrounds.json").read_text(encoding="utf-8"))

    char_map = {c["character_id"]: c for c in chars_data["characters"]}
    bg_map   = {b["bg_id"]:        b for b in bgs_data["backgrounds"]}

    # Verify image_url fields (set by generate_images.py, Step 3)
    missing = []
    for c in chars_data["characters"]:
        if not c.get("image_url"):
            missing.append(f"  characters/{c['character_id']} — missing image_url")
    for b in bgs_data["backgrounds"]:
        if not b.get("image_url"):
            missing.append(f"  backgrounds/{b['bg_id']} — missing image_url")
    if missing:
        print("ERROR: image_url fields missing. Run generate_images.py (Step 3) first.")
        for m in missing:
            print(m)
        raise SystemExit(1)

    all_shots = shots_data.get("shots", [])

    # ── Build pending list ─────────────────────────────────────────────────────
    if args.shot:
        # Single-shot mode — Claude calls this once per shot for approval workflow
        target = next((s for s in all_shots if s["shot_id"] == args.shot), None)
        if not target:
            print(f"ERROR: shot_id '{args.shot}' not found in shots.json")
            raise SystemExit(1)
        clip_path = Path("clips") / f"{args.shot}.mp4"
        if valid_media(clip_path, "video"):
            print(f"[{args.shot}] valid clip already exists — nothing to do.")
            return
        pending = [target]
        skipped = []
        print(f"  Mode    : single-shot  ({args.shot})")
    else:
        # Bulk mode — process all pending shots without pausing
        pending = [s for s in all_shots if not valid_media(Path("clips") / f"{s['shot_id']}.mp4", "video")]
        skipped = [s["shot_id"] for s in all_shots if s not in pending]
        print(f"  Mode    : bulk  ({len(pending)} pending, {len(skipped)} already done)")

    print(f"  Video   : grok-imagine/image-to-video  (duration: {VIDEO_DURATION}s, {VIDEO_RESOLUTION}, {VIDEO_ASPECT_RATIO}, mode: {VIDEO_MODE})\n")

    if skipped:
        print(f"Skipping {len(skipped)} shot(s) with existing clips: {', '.join(skipped)}")
    if not pending:
        print("All clips already exist. Nothing to do.")
        return

    Path("composites").mkdir(exist_ok=True)
    Path("clips").mkdir(exist_ok=True)

    results        = {"success": [], "failed": [], "skipped": skipped}
    composite_index_path = Path("composites") / "manifest.json"
    try:
        composite_index = json.loads(composite_index_path.read_text(encoding="utf-8")) if composite_index_path.exists() else {}
    except (OSError, json.JSONDecodeError):
        composite_index = {}
    composite_urls = {}   # shot_id → composite_url (filled in Phase 1)
    for shot in pending:
        sid = shot["shot_id"]
        saved_url = composite_index.get(sid)
        if saved_url and valid_media(Path("composites") / f"{sid}.png", "image"):
            composite_urls[sid] = saved_url
    composite_pending = [s for s in pending if s["shot_id"] not in composite_urls]

    # ── Phase 1: Composites ────────────────────────────────────────────────────
    p1_start = time.time()

    if args.shot and composite_pending:
        # Single shot — run directly, no thread pool needed
        print(f"Phase 1 — Composite: generating {args.shot}...\n")
        sid, url, err = run_composite(
            composite_pending[0], bg_map, char_map,
            Path("composites") / f"{args.shot}.png",
        )
        if url:
            composite_urls[sid] = url
            composite_index[sid] = url
        else:
            print(f"  [{sid}] composite FAILED: {err}")
            results["failed"].append(sid)
    elif not args.shot and composite_pending:
        # Bulk — all composites in parallel
        print(f"Phase 1 — Composites: submitting {len(composite_pending)} jobs in parallel...\n")
        with ThreadPoolExecutor(max_workers=COMPOSITE_MAX_WORKERS) as ex:
            futures = {
                ex.submit(
                    run_composite,
                    shot, bg_map, char_map,
                    Path("composites") / f"{shot['shot_id']}.png"
                ): shot["shot_id"]
                for shot in composite_pending
            }
            for future in as_completed(futures):
                sid, url, err = future.result()
                if url:
                    composite_urls[sid] = url
                    composite_index[sid] = url
                else:
                    tprint(f"  [{sid}] composite FAILED: {err}")
                    results["failed"].append(sid)

    if composite_pending:
        composite_index_tmp = composite_index_path.with_suffix(composite_index_path.suffix + ".part")
        composite_index_tmp.write_text(json.dumps(composite_index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        composite_index_tmp.replace(composite_index_path)
    else:
        print("Phase 1 — all valid composites reused from composites/manifest.json.\n")
    print(f"\nPhase 1 done in {fmt_elapsed(p1_start)}: "
          f"{len(composite_urls)}/{len(pending)} composites ready.\n")

    # ── Phase 2: All videos in parallel ───────────────────────────────────────
    # Only shots whose composite succeeded
    video_shots = [s for s in pending if s["shot_id"] in composite_urls]

    if not video_shots:
        print("No composites succeeded — cannot generate any videos.")
    else:
        p2_start = time.time()

        if args.shot:
            # Single shot — run directly
            print(f"Phase 2 — Video: generating {args.shot}...\n")
            sid, ok, err = run_video(
                video_shots[0],
                composite_urls[video_shots[0]["shot_id"]],
                Path("clips") / f"{video_shots[0]['shot_id']}.mp4",
            )
            if ok:
                results["success"].append(sid)
            else:
                print(f"  [{sid}] video FAILED: {err}")
                results["failed"].append(sid)
        else:
            # Bulk — all videos in parallel
            print(f"Phase 2 — Videos: submitting {len(video_shots)} jobs in parallel "
                  f"(grok-imagine/image-to-video)...\n")
            with ThreadPoolExecutor(max_workers=VIDEO_MAX_WORKERS) as ex:
                futures = {
                    ex.submit(
                        run_video,
                        shot,
                        composite_urls[shot["shot_id"]],
                        Path("clips") / f"{shot['shot_id']}.mp4"
                    ): shot["shot_id"]
                    for shot in video_shots
                }
                for future in as_completed(futures):
                    sid, ok, err = future.result()
                    if ok:
                        results["success"].append(sid)
                    else:
                        tprint(f"  [{sid}] video FAILED: {err}")
                        results["failed"].append(sid)

        print(f"\nPhase 2 done in {fmt_elapsed(p2_start)}: "
              f"{len(results['success'])}/{len(video_shots)} videos ready.")

    # ── Summary ───────────────────────────────────────────────────────────────
    total_run_time = fmt_elapsed(run_start)

    print(f"\n{'='*55}")
    print(f"  Total run time : {total_run_time}")
    print(f"  Generated      : {len(results['success'])} clips")
    print(f"  Skipped        : {len(results['skipped'])} (clips already existed)")
    print(f"  Failed         : {len(results['failed'])}")
    print(f"{'='*55}")
    print(f"  Composites → ./composites/")
    print(f"  Clips      → ./clips/")

    if results["failed"]:
        print("\nFailed shots (delete composite + clip file then re-run):")
        for sid in results["failed"]:
            print(f"  - {sid}")
        raise SystemExit(1)
    else:
        print("\nAll done! The Story-to-Animation pipeline is complete.")


if __name__ == "__main__":
    main()
