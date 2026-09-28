#!/usr/bin/env python
# Cascade tang 2 (Chrominance + Geometry) — noi len SCRFD hits, do FPR thuc te.
# Input : data/scrfd-hits.json
# Output: data/cascade-t2-report.json + cap nhat phan-he-status.json (PH1 missing)
# Chay: python scripts/cascade_t2_run.py
from __future__ import annotations
import json
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from faceless_cascade import is_true_face  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parents[1]
HITS = ROOT / "data" / "scrfd-hits.json"
OUT = ROOT / "data" / "cascade-t2-report.json"
STATUS = ROOT / "data" / "phan-he-status.json"
IMG_DIR = ROOT / "assets" / "raw-kenh"

MIN_SCORE = 0.45  # dung mac dinh cua faceless_cascade

def main():
    hits = json.loads(HITS.read_text(encoding="utf-8"))
    results = []
    kept_total = 0
    filtered_total = 0
    err = 0
    t0 = time.time()
    for r in hits["records"]:
        faces = r.get("faces") or []
        if not faces:
            results.append({"id": r["id"], "faces": 0, "kept": 0, "filtered": 0})
            continue
        img_path = IMG_DIR / (r.get("file") or "")
        if not img_path.exists():
            results.append({"id": r["id"], "faces": len(faces), "kept": len(faces), "filtered": 0, "error": "img-missing"})
            kept_total += len(faces)
            continue
        try:
            res = is_true_face(faces, str(img_path), min_score=MIN_SCORE)
        except Exception as e:  # noqa: BLE001
            results.append({"id": r["id"], "faces": len(faces), "kept": len(faces), "filtered": 0, "error": str(e)[:80]})
            err += 1
            kept_total += len(faces)
            continue
        k, f = res.get("kept", 0), res.get("filtered", 0)
        kept_total += k
        filtered_total += f
        results.append({"id": r["id"], "faces": len(faces), "kept": k, "filtered": f,
                        "chrominance": res.get("chrominance")})
    total_boxes = kept_total + filtered_total
    report = {
        "schema": "h2dev.cascade-t2.v1",
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "minScore": MIN_SCORE,
        "images": len(hits["records"]),
        "boxesTotal": total_boxes,
        "boxesKept": kept_total,
        "boxesFiltered": filtered_total,
        "filteredRatio": round(filtered_total / total_boxes, 4) if total_boxes else 0.0,
        "imagesKeptWithFace": sum(1 for r in results if r.get("kept", 0) > 0),
        "errors": err,
        "results": results,
        "note": "Tang 2 Chrominance+Geometry. Tang 3 ArcFace optional chua noi.",
    }
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=1, default=float), encoding="utf-8")

    # Cap nhat phan-he-status.json — PH1 cascade t1+t2 da chay that
    if STATUS.exists():
        st = json.loads(STATUS.read_text(encoding="utf-8"))
        ph1 = st.get("PH1") or {}
        ph1["status"] = "partial"
        ph1["missing"] = ["Tang 3 ArcFace (optional) — chua noi; can insightface embedding neu can"]
        ph1["progress"] = {
            "scrfdHits": "data/scrfd-hits.json",
            "cascadeT2Report": "data/cascade-t2-report.json",
            "imagesScanned": len(hits["records"]),
            "boxesKept": kept_total,
            "boxesFiltered": filtered_total,
            "runAt": report["generatedAt"],
        }
        st["PH1"] = ph1
        STATUS.write_text(json.dumps(st, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"CASCADE T2 DONE: images={len(hits['records'])} boxes={total_boxes} kept={kept_total} "
          f"filtered={filtered_total} ratio={report['filteredRatio']} time={time.time() - t0:.1f}s -> {OUT}")

if __name__ == "__main__":
    main()
