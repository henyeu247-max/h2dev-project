#!/usr/bin/env python3
"""
Merge all generated video clips into a single final animation.

Reads shot order from shots.json, finds ./clips/{shot_id}.mp4 for each shot,
and merges them in narrative order using FFmpeg (stream copy — no re-encoding).

Output: ./final_animation.mp4

Usage:
  cd /path/to/your/project
  python ~/.claude/skills/generating-composite-and-video/scripts/merge_clips.py

Requirements:
  FFmpeg installed and in PATH.
    Windows : winget install ffmpeg
    Mac     : brew install ffmpeg
    Linux   : sudo apt install ffmpeg
"""

import json
import re
import shutil
import subprocess
from pathlib import Path

SAFE_ID_RE = re.compile(r"^[A-Za-z0-9_-]+$")


def assert_safe_id(val: str, label: str = "shot_id") -> str:
    s = str(val or "").strip()
    if not SAFE_ID_RE.fullmatch(s):
        raise ValueError(f"Invalid {label} (must match ^[A-Za-z0-9_-]+$): {val!r}")
    return s


def format_concat_line(clip_path: Path) -> str:
    abs_path = clip_path.resolve().as_posix()
    if "\r" in abs_path or "\n" in abs_path:
        raise ValueError(f"Illegal newline in concat path: {abs_path!r}")
    escaped = abs_path.replace("'", "'\\''")
    return f"file '{escaped}'\n"


# ── Helpers ───────────────────────────────────────────────────────────────────

def check_ffmpeg() -> bool:
    """Return True if ffmpeg is available in PATH."""
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True, text=True,
        )
        return result.returncode == 0
    except FileNotFoundError:
        return False


def valid_clip(path: Path) -> bool:
    """A clip must be non-empty and decodable; exists() is not sufficient."""
    if not path.is_file() or path.stat().st_size < 1024:
        return False
    try:
        subprocess.run([
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=codec_name,duration", "-of", "json", str(path)
        ], capture_output=True, text=True, check=True, timeout=30)
        return True
    except (FileNotFoundError, subprocess.SubprocessError):
        return False


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("\n=== Story-to-Animation: Merge Clips → final_animation.mp4 ===\n")

    # ── Check FFmpeg ──────────────────────────────────────────────────────────
    if not check_ffmpeg():
        print("ERROR: FFmpeg not found in PATH.")
        print("  Windows : winget install ffmpeg   (then restart terminal)")
        print("  Mac     : brew install ffmpeg")
        print("  Linux   : sudo apt install ffmpeg")
        raise SystemExit(1)

    # ── Load shot order ───────────────────────────────────────────────────────
    if not Path("shots.json").exists():
        print("ERROR: shots.json not found in current directory")
        raise SystemExit(1)

    shots_data = json.loads(Path("shots.json").read_text(encoding="utf-8"))
    all_shots  = shots_data.get("shots", [])

    if not all_shots:
        print("ERROR: No shots found in shots.json")
        raise SystemExit(1)

    # ── Collect clips in narrative order ──────────────────────────────────────
    clips_dir = Path("clips")
    available = []
    missing   = []

    for shot in all_shots:
        sid       = assert_safe_id(shot.get("shot_id"), "shot_id")
        clip_path = clips_dir / f"{sid}.mp4"
        if valid_clip(clip_path):
            available.append((sid, clip_path))
        else:
            missing.append(sid)

    print(f"  Shots in order : {len(all_shots)}")
    print(f"  Clips found    : {len(available)}")
    if missing:
        print(f"  Missing/invalid clips : {', '.join(missing)}")
    print()

    if missing:
        print("ERROR: Refusing to merge with missing or invalid clips. Generate every shot first.")
        raise SystemExit(1)
    if not available:
        print("ERROR: No valid clips found in ./clips/ — run generate_videos.py first.")
        raise SystemExit(1)

    if len(available) == 1:
        print("Only one clip found — copying directly to final_animation.mp4")
        shutil.copy2(available[0][1], "final_animation.mp4")
        print("✅ Done → ./final_animation.mp4")
        return

    # ── Write FFmpeg concat list ──────────────────────────────────────────────
    concat_path = Path("concat.txt")
    with open(concat_path, "w", encoding="utf-8") as f:
        for sid, clip_path in available:
            f.write(format_concat_line(clip_path))

    print(f"Merging {len(available)} clips in order:")
    for sid, _ in available:
        print(f"  {sid}.mp4")
    print()

    output_path = Path("final_animation.mp4")

    # ── Run FFmpeg ────────────────────────────────────────────────────────────
    cmd = [
        "ffmpeg",
        "-y",               # overwrite output if it already exists
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_path),
        "-c", "copy",       # stream copy — no re-encoding, very fast
        str(output_path),
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print("Stream copy failed; retrying with H.264/AAC re-encode...")
        fallback = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_path),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
            str(output_path),
        ]
        result = subprocess.run(fallback, capture_output=True, text=True)

    # Always clean up concat file
    concat_path.unlink(missing_ok=True)

    if result.returncode != 0:
        print("ERROR: FFmpeg failed:")
        # Show last 3000 chars of stderr (ffmpeg is verbose)
        print(result.stderr[-3000:] if result.stderr else "(no output)")
        raise SystemExit(1)
    if not valid_clip(output_path):
        raise SystemExit("ERROR: final_animation.mp4 was created but is not decodable")

    # ── Summary ───────────────────────────────────────────────────────────────
    size_mb = output_path.stat().st_size / (1024 * 1024)

    print(f"{'='*50}")
    print(f"  ✅ Output   : ./final_animation.mp4")
    print(f"     Size     : {size_mb:.1f} MB")
    print(f"     Merged   : {len(available)} clips")
    if missing:
        print(f"     Missing  : {len(missing)} ({', '.join(missing)})")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
