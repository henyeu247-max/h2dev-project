# -*- coding: utf-8 -*-
"""Nhóm các segment ảo giác liên tiếp thành từng cụm (block) để xử lý."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HALL = ["La La School", "Ghiền Mì Gõ", "H subscribe cho k"]


def analyze(sku):
    p = ROOT / "video" / sku / "transcript.json"
    with open(p, "r", encoding="utf-8") as f:
        d = json.load(f)
    segs = d.get("segments") or []

    groups = []
    cur = None
    for i, s in enumerate(segs):
        ish = any(h.lower() in s.get("text", "").lower() for h in HALL)
        if ish:
            if cur is None:
                cur = [i, i]
            else:
                cur[1] = i
        else:
            if cur:
                groups.append(cur)
                cur = None
    if cur:
        groups.append(cur)

    print("=== " + sku + " ===")
    print("Tong segment:", len(segs), "| So cum ao giac:", len(groups))
    for g in groups:
        a = segs[g[0]]
        b = segs[g[1]]
        print("  #" + str(g[0] + 1) + "-" + str(g[1] + 1) +
              " | " + str(a.get("start_time")) + " -> " + str(b.get("end_time")) +
              " | " + str(g[1] - g[0] + 1) + " seg")
    print()
    # In doan that cuoi cung
    real = [s for s in segs if not any(h.lower() in s.get("text", "").lower() for h in HALL)]
    if real:
        last = real[-1]
        print("  Doan that cuoi: [" + str(last.get("start_time")) + "] " + last.get("text", "")[:80])
    print()


if __name__ == "__main__":
    for sku in ["VIDEO-ed1be9", "VIDEO-b559c8"]:
        analyze(sku)
