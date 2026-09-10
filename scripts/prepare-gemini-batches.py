"""Create deterministic Gemini/AI Studio video-analysis batches.

This script only inspects local files and writes a manifest. It never uploads a
video, calls Gemini, or changes the original media.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import shutil
import subprocess
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "_audit" / "20260908-gemini"
PILOT_PRIORITY = {
    "VIDEO-3a38f9": "transcript_missing",
    "VIDEO-61ad94": "transcript_missing",
    "VIDEO-8e0275": "asr_weak",
    "VIDEO-a348a5": "asr_weak",
    "VIDEO-b559c8": "asr_weak",
    "VIDEO-b96929": "asr_weak",
    "VIDEO-ed1be9": "asr_weak",
}


def probe(path: pathlib.Path) -> dict:
    fallback = pathlib.Path("D:/Linly-Dubbing/bin/ffprobe.exe")
    ffprobe = shutil.which("ffprobe") or (str(fallback) if fallback.exists() else "ffprobe")
    cmd = [ffprobe, "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)]
    try:
        raw = subprocess.check_output(cmd, text=True, encoding="utf-8")
        data = json.loads(raw)
        streams = data.get("streams", [])
        return {
            "duration_sec": float(data.get("format", {}).get("duration") or 0),
            "video_streams": sum(1 for s in streams if s.get("codec_type") == "video"),
            "audio_streams": sum(1 for s in streams if s.get("codec_type") == "audio"),
            "format_name": data.get("format", {}).get("format_name", ""),
            "probe_status": "ok",
        }
    except (OSError, subprocess.CalledProcessError, ValueError, TypeError) as exc:
        return {"duration_sec": 0, "video_streams": 0, "audio_streams": 0,
                "format_name": "", "probe_status": "failed", "probe_error": str(exc)}


def source_path(sku: str) -> pathlib.Path:
    return ROOT / "video" / sku / f"{sku}.mp4"


def ranges(duration: float, max_seconds: float, overlap: float) -> list[dict]:
    if duration <= 0:
        return []
    result, start, index = [], 0.0, 1
    while start < duration:
        end = min(duration, start + max_seconds)
        result.append({"segment": index, "start_sec": round(start, 3), "end_sec": round(end, 3),
                       "overlap_with_previous_sec": round(overlap if index > 1 else 0, 3)})
        if end >= duration:
            break
        start = max(start + max_seconds - overlap, start + 0.001)
        index += 1
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch-size", type=int, default=7)
    parser.add_argument("--max-seconds", type=float, default=300)
    parser.add_argument("--overlap", type=float, default=10)
    parser.add_argument("--out", default=str(OUT / "batches.json"))
    args = parser.parse_args()
    if args.batch_size < 1 or args.max_seconds <= 0 or args.overlap < 0 or args.overlap >= args.max_seconds:
        raise SystemExit("batch-size/max-seconds phải dương; overlap phải nhỏ hơn max-seconds")

    catalog = json.loads((ROOT / "data" / "catalog_full.json").read_text(encoding="utf-8"))
    entries = []
    for item in catalog:
        sku = str(item.get("sku", ""))
        path = source_path(sku)
        info = {"sku": sku, "title": item.get("title", ""), "path": str(path.relative_to(ROOT)).replace("\\", "/"),
                "exists": path.is_file(), "size_bytes": path.stat().st_size if path.is_file() else 0}
        if sku in PILOT_PRIORITY:
            info["pilot_priority"] = 1
            info["pilot_reason"] = PILOT_PRIORITY[sku]
        info.update(probe(path) if path.is_file() else {"duration_sec": 0, "video_streams": 0,
                    "audio_streams": 0, "format_name": "", "probe_status": "missing"})
        info["segments"] = ranges(info["duration_sec"], args.max_seconds, args.overlap)
        info["status"] = "ready_for_manual_upload" if info["probe_status"] == "ok" and info["video_streams"] else "blocked"
        entries.append(info)

    batches = [{"batch": i // args.batch_size + 1, "items": entries[i:i + args.batch_size]}
               for i in range(0, len(entries), args.batch_size)]
    result = {"schema_version": "h2dev.gemini.batch-manifest.v1", "generated_at": datetime.now(timezone.utc).isoformat(),
              "policy": {"interface": "AI Studio web", "uploads": False, "paid_calls": False,
                         "max_segment_sec": args.max_seconds, "overlap_sec": args.overlap},
              "summary": {"videos": len(entries), "batches": len(batches),
                          "ready": sum(x["status"] == "ready_for_manual_upload" for x in entries),
                          "blocked": sum(x["status"] == "blocked" for x in entries),
                          "pilot_videos": sum(x.get("pilot_priority") == 1 for x in entries)},
              "batches": batches}
    out = pathlib.Path(args.out)
    if not out.is_absolute():
        out = ROOT / out
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(out.suffix + ".part")
    tmp.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(out)
    print(json.dumps(result["summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()
