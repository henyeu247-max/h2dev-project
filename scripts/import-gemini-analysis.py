"""Validate and register an AI Studio/Gemini video analysis result.

The raw response is kept under _audit (blocked from the project server). Only a
small approved summary reaches data/video_analysis_public.json. Existing source
video and transcripts are never changed.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import re
import shutil
import subprocess
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "h2dev.gemini.video-analysis.v1"


def fail(message: str) -> None:
    raise SystemExit(f"INVALID: {message}")


def number(value, name: str, minimum: float = 0) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or value < minimum:
        fail(f"{name} phải là số >= {minimum}")
    return float(value)


def string_list(value, name: str) -> list[str]:
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        fail(f"{name} phải là mảng chuỗi")
    return value


def write_json_atomic(path: pathlib.Path, value: dict) -> None:
    """Write derived JSON without leaving a half-written public record."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".part")
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def media_probe(path: pathlib.Path) -> tuple[float, int, int]:
    ffprobe = shutil.which("ffprobe") or "ffprobe"
    try:
        raw = subprocess.check_output([ffprobe, "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)], text=True, encoding="utf-8")
        payload = json.loads(raw)
        streams = payload.get("streams", [])
        return (float(payload.get("format", {}).get("duration") or 0),
                sum(s.get("codec_type") == "video" for s in streams),
                sum(s.get("codec_type") == "audio" for s in streams))
    except (OSError, subprocess.SubprocessError, json.JSONDecodeError, ValueError, TypeError) as exc:
        fail(f"không giải mã được source.path: {exc}")


def validate(data: dict) -> tuple[str, float]:
    if not isinstance(data, dict) or data.get("schema_version") != SCHEMA_VERSION:
        fail("schema_version không đúng")
    sku = data.get("sku", "")
    if not isinstance(sku, str) or not re.fullmatch(r"VIDEO-[A-Za-z0-9]+", sku):
        fail("sku không hợp lệ")
    source = data.get("source")
    analysis = data.get("analysis")
    if not isinstance(source, dict) or not isinstance(analysis, dict):
        fail("thiếu source hoặc analysis")
    if not isinstance(source.get("path"), str) or not source["path"].strip() or number(source.get("duration_sec"), "duration_sec") < 0:
        fail("source không hợp lệ")
    if not isinstance(source.get("size_bytes"), int) or source["size_bytes"] <= 0:
        fail("size_bytes phải > 0")
    if source["path"].startswith(("/", "\\")) or re.match(r"^[A-Za-z]:[\\/]", source["path"]):
        fail("source.path phải là đường dẫn tương đối trong kho")
    normalized_source = source["path"].replace("\\", "/")
    expected_source = f"video/{sku}/{sku}.mp4"
    if normalized_source != expected_source:
        fail(f"source.path không khớp SKU: cần {expected_source}")
    try:
        source_path = (ROOT / pathlib.PurePosixPath(normalized_source)).resolve()
        source_path.relative_to(ROOT.resolve())
    except (ValueError, OSError):
        fail("source.path nằm ngoài kho")
    if not source_path.is_file():
        fail(f"source.path không tồn tại: {source['path']}")
    actual_size = source_path.stat().st_size
    if actual_size != source["size_bytes"]:
        fail(f"source.size_bytes không khớp: khai báo {source['size_bytes']} != thực tế {actual_size}")
    actual_duration, video_streams, audio_streams = media_probe(source_path)
    declared_duration = float(source["duration_sec"])
    if not video_streams:
        fail("source.path không có luồng hình")
    if declared_duration and abs(actual_duration - declared_duration) > 1.0:
        fail(f"source.duration_sec không khớp: khai báo {declared_duration:.3f} != thực tế {actual_duration:.3f}")
    if "sha256" in source and (not isinstance(source["sha256"], str) or not re.fullmatch(r"[a-f0-9]{64}", source["sha256"])):
        fail("source.sha256 phải là 64 ký tự hex thường")
    if analysis.get("interface") not in {"AI Studio web", "Gemini API", "unknown"}:
        fail("analysis.interface không hợp lệ")
    if not isinstance(analysis.get("model"), str) or not analysis["model"].strip():
        fail("analysis.model bắt buộc")
    if analysis.get("processing") not in {"static", "agentic", "segmented", "unknown"}:
        fail("analysis.processing không hợp lệ")
    for key in ("prompt_sha256",):
        if key in analysis and (not isinstance(analysis[key], str) or not re.fullmatch(r"[a-f0-9]{64}", analysis[key])):
            fail(f"analysis.{key} phải là 64 ký tự hex thường")
    duration = declared_duration or actual_duration
    coverage = analysis.get("coverage")
    if not isinstance(coverage, list):
        fail("coverage phải là mảng")
    for idx, row in enumerate(coverage):
        if not isinstance(row, dict): fail(f"coverage[{idx}] không phải object")
        start, end = number(row.get("start_sec"), f"coverage[{idx}].start_sec"), number(row.get("end_sec"), f"coverage[{idx}].end_sec")
        if end <= start or (duration and end > duration + 1): fail(f"coverage[{idx}] vượt thời lượng hoặc ngược")
        if row.get("status") not in {"complete", "partial", "failed", "not_processed"}: fail(f"coverage[{idx}].status")
    for idx, row in enumerate(analysis.get("observations", [])):
        if not isinstance(row, dict): fail(f"observations[{idx}] không phải object")
        start, end = number(row.get("start_sec"), f"observations[{idx}].start_sec"), number(row.get("end_sec"), f"observations[{idx}].end_sec")
        if end <= start or (duration and end > duration + 1): fail(f"observations[{idx}] vượt thời lượng hoặc ngược")
        for field in ("spoken", "visual", "on_screen_text"):
            if not isinstance(row.get(field), str): fail(f"observations[{idx}].{field}")
        if row.get("confidence") not in {"high", "medium", "low", "unclear"}: fail(f"observations[{idx}].confidence")
    claims = analysis.get("claims")
    if not isinstance(claims, list) or not isinstance(analysis.get("limitations"), list):
        fail("claims/limitations phải là mảng")
    string_list(analysis["limitations"], "analysis.limitations")
    for idx, claim in enumerate(claims):
        if not isinstance(claim, dict):
            fail(f"claims[{idx}] không phải object")
        if not isinstance(claim.get("claim"), str) or not claim["claim"].strip():
            fail(f"claims[{idx}].claim bắt buộc")
        timestamps = claim.get("evidence_timestamps")
        if not isinstance(timestamps, list):
            fail(f"claims[{idx}].evidence_timestamps phải là mảng")
        for ts in timestamps:
            number(ts, f"claims[{idx}].evidence_timestamps")
            if duration and float(ts) > duration + 1:
                fail(f"claims[{idx}] có timestamp vượt thời lượng")
        if claim.get("verification_status") not in {"pending", "verified", "rejected", "unverified"}:
            fail(f"claims[{idx}].verification_status không hợp lệ")
        string_list(claim.get("verification_sources"), f"claims[{idx}].verification_sources")
    if "approved_for_ui" in data and not isinstance(data["approved_for_ui"], bool):
        fail("approved_for_ui phải là boolean")
    return sku, duration


def coverage_percent(coverage: list[dict], duration: float) -> float:
    if not duration or not coverage:
        return 0.0
    intervals = sorted((float(x["start_sec"]), float(x["end_sec"])) for x in coverage if x.get("status") in {"complete", "partial"})
    total = 0.0; end = -1.0
    for start, stop in intervals:
        if start > end: total += stop - start
        else: total += max(0.0, stop - max(start, end))
        end = max(end, stop)
    return round(min(100.0, max(0.0, total / duration * 100)), 2)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("--approve-ui", action="store_true", help="cho phép đưa observations đã kiểm sạch vào giao diện")
    args = parser.parse_args()
    source = pathlib.Path(args.input)
    if not source.is_file(): fail(f"không tìm thấy {source}")
    try:
        data = json.loads(source.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"JSON không đọc được: {exc}")
    sku, duration = validate(data)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    raw_dir = ROOT / "_audit" / "20260908-gemini" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    raw_target = raw_dir / f"{sku}-{stamp}-{digest[:12]}.json"
    shutil.copy2(source, raw_target)

    analysis = data["analysis"]
    public = {"status": "approved" if args.approve_ui else "validated_pending_review",
              "analysis_source": analysis["interface"], "model": analysis["model"],
              "processing": analysis["processing"], "coverage_percent": coverage_percent(analysis["coverage"], duration),
              "coverage": analysis["coverage"], "observations": analysis["observations"] if args.approve_ui else [],
              "claims_pending": sum(1 for c in analysis["claims"] if c.get("verification_status") != "verified"),
              "limitations": analysis["limitations"], "raw_sha256": digest}
    public_path = ROOT / "data" / "video_analysis_public.json"
    existing = json.loads(public_path.read_text(encoding="utf-8")) if public_path.exists() else {"schema_version": "h2dev.gemini.public.v1", "videos": {}}
    existing.setdefault("videos", {})[sku] = public
    manifest_path = ROOT / "data" / "video_analysis_manifest.json"
    if manifest_path.exists():
        pre_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        if not any(row.get("sku") == sku for row in pre_manifest.get("videos", [])):
            fail(f"SKU {sku} không có trong video_analysis_manifest.json")
    snapshot_dir = ROOT / "_audit" / "20260908-gemini" / "snapshots" / stamp
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    for output_path in (public_path, manifest_path):
        if output_path.exists():
            shutil.copy2(output_path, snapshot_dir / output_path.name)
    write_json_atomic(public_path, existing)
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        found = False
        for row in manifest.get("videos", []):
            if row.get("sku") == sku:
                row["analysis_status"] = public["status"]
                row["source_size_bytes"] = source["size_bytes"]
                row["coverage_percent"] = public["coverage_percent"]
                row["review_status"] = "approved_for_ui" if args.approve_ui else "pending_review"
                row["accuracy_status"] = "pending_claim_verification"
                row["issues"] = list(analysis["limitations"])
                found = True
                break
        if not found:
            fail(f"SKU {sku} không có trong video_analysis_manifest.json")
        manifest["summary"]["analysis_done"] = sum(x.get("analysis_status") in {"validated_pending_review", "approved"} for x in manifest.get("videos", []))
        write_json_atomic(manifest_path, manifest)
    print(json.dumps({"sku": sku, "coverage_percent": public["coverage_percent"], "status": public["status"], "raw": str(raw_target)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
