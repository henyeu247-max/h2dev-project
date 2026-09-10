"""Read-only validation for the Gemini analysis manifest and imported records."""
from __future__ import annotations
import argparse, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "h2dev.gemini.video-analysis.v1"

def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--manifest", default="data/video_analysis_manifest.json"); args = parser.parse_args()
    manifest_path = ROOT / args.manifest
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    catalog = json.loads((ROOT / "data/catalog_full.json").read_text(encoding="utf-8"))
    expected = {x["sku"] for x in catalog}; entries = manifest.get("videos", [])
    actual = {x.get("sku") for x in entries}; errors=[]
    if manifest.get("schema_version") != "h2dev.gemini.manifest.v1": errors.append("manifest schema_version")
    summary = manifest.get("summary", {})
    if summary.get("videos") != len(entries): errors.append("manifest summary.videos")
    if summary.get("file_ok") != sum(bool(x.get("file_ok")) for x in entries): errors.append("manifest summary.file_ok")
    if summary.get("audio_ok") != sum(bool(x.get("audio_ok")) for x in entries): errors.append("manifest summary.audio_ok")
    if summary.get("analysis_done") != sum(x.get("analysis_status") in {"validated_pending_review", "approved"} for x in entries): errors.append("manifest summary.analysis_done")
    batches_path = ROOT / "data/video_analysis_batches.json"
    if not batches_path.exists():
        errors.append("missing data/video_analysis_batches.json")
    else:
        batches = json.loads(batches_path.read_text(encoding="utf-8"))
        batch_items = [item for batch in batches.get("batches", []) for item in batch.get("items", [])]
        batch_skus = [item.get("sku") for item in batch_items]
        if batches.get("schema_version") != "h2dev.gemini.batch-manifest.v1": errors.append("batch manifest schema_version")
        if len(batch_items) != len(expected) or set(batch_skus) != expected or len(set(batch_skus)) != len(batch_skus):
            errors.append("batch manifest must contain each catalog SKU exactly once")
        if batches.get("summary", {}).get("videos") != len(expected): errors.append("batch summary.videos")
        for item in batch_items:
            if item.get("status") == "ready_for_manual_upload" and not item.get("segments"):
                errors.append(f"{item.get('sku')}: ready batch has no segments")
    if expected != actual: errors.append(f"SKU mismatch expected={len(expected)} actual={len(actual)}")
    for row in entries:
        if row.get("analysis_status") not in {"not_started", "validated_pending_review", "approved", "blocked"}: errors.append(f"{row.get('sku')}: analysis_status")
        if not 0 <= float(row.get("coverage_percent", 0)) <= 100: errors.append(f"{row.get('sku')}: coverage")
        if not isinstance(row.get("file_ok"), bool) or not isinstance(row.get("audio_ok"), bool): errors.append(f"{row.get('sku')}: media flags")
        if not isinstance(row.get("source_size_bytes"), int) or row.get("source_size_bytes", 0) < 0: errors.append(f"{row.get('sku')}: source_size_bytes")
        if row.get("accuracy_status") not in {"unverified", "pending_claim_verification", "verified", "rejected"}: errors.append(f"{row.get('sku')}: accuracy_status")
        if row.get("review_status") not in {"not_reviewed", "pending_review", "approved_for_ui"}: errors.append(f"{row.get('sku')}: review_status")
    public_path = ROOT / "data/video_analysis_public.json"
    public = json.loads(public_path.read_text(encoding="utf-8")) if public_path.exists() else {"videos": {}}
    manifest_by_sku = {row.get("sku"): row for row in entries}
    for sku, row in public.get("videos", {}).items():
        if sku not in expected: errors.append(f"public unknown SKU {sku}")
        if row.get("status") not in {"validated_pending_review", "approved"}: errors.append(f"public {sku}: status")
        if not isinstance(row.get("coverage_percent"), (int, float)) or not 0 <= float(row["coverage_percent"]) <= 100: errors.append(f"public {sku}: coverage")
        if sku in manifest_by_sku and manifest_by_sku[sku].get("analysis_status") != row.get("status"): errors.append(f"public {sku}: status drift from manifest")
    result = {"manifest_videos": len(entries), "catalog_videos": len(expected), "public_records": len(public.get("videos", {})), "errors": errors, "pass": not errors}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(1 if errors else 0)

if __name__ == "__main__": main()
