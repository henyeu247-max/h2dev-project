#!/usr/bin/env python3
"""Ghi quyet dinh kiem tay (co bang chung) vao data/manual-review-evidence.json.

Dung chung ham source_fingerprint() voi audit_videos_v2.py -> dau van tay khop tuyet doi.
Khi du lieu nguon doi (takeaway/thumbnail/method), fingerprint doi -> audit tu BAT LAI co.

    py -3 scripts/record_review_evidence.py --sku VIDEO-x --code S9 --decision verified_ok \
        --evidence "..." --by "..."
    py -3 scripts/record_review_evidence.py --batch file.json   # [{sku,code,decision,evidence,by}]
"""
import argparse
import json
import os
import sys
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from audit_videos_v2 import ROOT, REVIEW_CLOSING_DECISIONS, source_fingerprint, load_json  # noqa: E402

OUT = os.path.join(ROOT, "data", "manual-review-evidence.json")
VALID = REVIEW_CLOSING_DECISIONS | {"needs_owner_decision"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sku")
    ap.add_argument("--code", choices=["A10", "S6", "S9"])
    ap.add_argument("--decision", choices=sorted(VALID))
    ap.add_argument("--evidence")
    ap.add_argument("--by", default="manual")
    ap.add_argument("--batch")
    a = ap.parse_args()
    items = json.load(open(a.batch, encoding="utf-8")) if a.batch else [
        {"sku": a.sku, "code": a.code, "decision": a.decision, "evidence": a.evidence, "by": a.by}]
    insights = load_json(os.path.join(ROOT, "data", "video_insights.json")) or {}
    data = load_json(OUT) or {"schema": "h2dev.manual-review-evidence.v1", "videos": {}}
    for it in items:
        if it["decision"] not in VALID or not it.get("evidence"):
            raise SystemExit("thieu decision hop le / evidence: %r" % it)
        fp = source_fingerprint(it["code"], it["sku"], insights.get(it["sku"]) or {})
        data["videos"].setdefault(it["sku"], {})[it["code"]] = {
            "decision": it["decision"], "evidence": it["evidence"], "by": it.get("by", "manual"),
            "fingerprint": fp, "recorded_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        }
        print("%s %s %s fp=%s" % (it["sku"], it["code"], it["decision"], fp))
    data["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%S%z")
    json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("ghi %d muc -> %s" % (len(items), os.path.relpath(OUT, ROOT)))


if __name__ == "__main__":
    main()
