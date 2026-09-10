"""Build the public, status-only manifest for all catalog videos."""
from __future__ import annotations
import json, pathlib, shutil, subprocess
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
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
    try:
        data = json.loads(subprocess.check_output([ffprobe, "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)], text=True, encoding="utf-8"))
        streams = data.get("streams", [])
        return {"file_ok": True, "duration_sec": round(float(data.get("format", {}).get("duration") or 0), 3),
                "video_streams": sum(s.get("codec_type") == "video" for s in streams),
                "audio_streams": sum(s.get("codec_type") == "audio" for s in streams)}
    except (OSError, ValueError, TypeError, subprocess.CalledProcessError):
        return {"file_ok": False, "duration_sec": 0, "video_streams": 0, "audio_streams": 0}

def main():
    catalog = json.loads((ROOT / "data/catalog_full.json").read_text(encoding="utf-8"))
    out = ROOT / "data/video_analysis_manifest.json"
    previous = {}
    if out.exists():
        try:
            previous = {row.get("sku"): row for row in json.loads(out.read_text(encoding="utf-8")).get("videos", [])}
        except (OSError, json.JSONDecodeError, TypeError):
            previous = {}
    videos=[]
    for item in catalog:
        sku=item["sku"]; path=ROOT / "video" / sku / f"{sku}.mp4"
        info=probe(path) if path.is_file() and path.stat().st_size > 0 else {"file_ok": False, "duration_sec": 0, "video_streams": 0, "audio_streams": 0}
        source_rel = str(path.relative_to(ROOT)).replace("\\", "/")
        row = {"sku": sku, "title": item.get("title", ""), "source_path": source_rel, "source_size_bytes": path.stat().st_size if path.is_file() else 0,
                       "file_ok": bool(info["file_ok"] and info["video_streams"]), "audio_ok": bool(info["audio_streams"]),
                       "duration_sec": info["duration_sec"], "video_streams": info["video_streams"], "audio_streams": info["audio_streams"],
                       "analysis_status": "blocked" if not info["file_ok"] or not info["video_streams"] else "not_started",
                       "coverage_percent": 0.0, "accuracy_status": "unverified", "review_status": "not_reviewed", "issues": []}
        old = previous.get(sku)
        if old and old.get("source_path") == source_rel and old.get("analysis_status") in {"validated_pending_review", "approved"}:
            if not old.get("source_size_bytes") or old.get("source_size_bytes") == row["source_size_bytes"]:
                for key in ("analysis_status", "coverage_percent", "accuracy_status", "review_status", "issues"):
                    if key in old:
                        row[key] = old[key]
        if sku in PILOT_PRIORITY:
            row["pilot_priority"] = 1
            row["pilot_reason"] = PILOT_PRIORITY[sku]
        videos.append(row)
    result={"schema_version":"h2dev.gemini.manifest.v1","generated_at":datetime.now(timezone.utc).isoformat(),
            "policy":{"interface":"AI Studio web","uploads":False,"paid_calls":False},"summary":{"videos":len(videos),
            "file_ok":sum(v["file_ok"] for v in videos),"audio_ok":sum(v["audio_ok"] for v in videos),
            "analysis_done":0,"pilot_videos":sum(v.get("pilot_priority") == 1 for v in videos)},"videos":videos}
    if out.exists():
        snapshot = ROOT / "_audit" / "20260908-gemini" / "snapshots" / ("manifest-build-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"))
        snapshot.mkdir(parents=True, exist_ok=True)
        shutil.copy2(out, snapshot / out.name)
    tmp=out.with_suffix(out.suffix + ".part")
    tmp.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    tmp.replace(out)
    print(json.dumps(result["summary"],ensure_ascii=False))

if __name__ == "__main__": main()
