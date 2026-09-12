# -*- coding: utf-8 -*-
"""
PHÂN LOẠI 160 SEGMENT ĐÃ THAY CHÚ THÍCH
=======================================
Đọc notes_vol.json (đã đo âm lượng) + backup (text gốc), phân loại:
  (1) AO_GIAC_CHANNEL : gốc chứa 'La La School' / 'Ghiền Mì Gõ' -> ảo giác chắc chắn
  (2) NEN_CHU         : gốc là chuỗi rớt nguyên âm (short_ratio cao)
  (3) CAU_THAT        : gốc là tiếng Việt mạch lạc -> khả năng cao là CÂU THẬT
  (4) ZOOM_NOTE       : gốc đã là chú thích (Zoom đã annotate từ trước)
Xuất md.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
rows = json.load(open(ROOT / "_tmp_audio" / "notes_vol.json", encoding="utf-8"))

CHANNEL = ["la la school", "ghiền mì gõ"]


def short_ratio(text):
    toks = [t for t in re.split(r"\s+", text.strip()) if t]
    if len(toks) < 6:
        return 0.0
    return sum(1 for t in toks if len(t) <= 2) / len(toks)


def classify(r):
    o = r["orig"]
    ol = o.lower()
    if o.startswith("[Khoảng lặng") or o.startswith("[Đoạn nói nhanh"):
        return "ZOOM_NOTE"
    if any(c in ol for c in CHANNEL):
        return "AO_GIAC_CHANNEL"
    if short_ratio(o) >= 0.55:
        return "NEN_CHU"
    return "CAU_THAT"


groups = {}
for r in rows:
    g = classify(r)
    r["group"] = g
    groups.setdefault(g, []).append(r)

lines = []
for g in ["AO_GIAC_CHANNEL", "NEN_CHU", "CAU_THAT", "ZOOM_NOTE"]:
    lst = groups.get(g, [])
    lines.append(f"### {g}: {len(lst)} segment")
    for r in lst:
        lines.append(f"  {r['sku']} #{r['id']} @ {r['start_time']} dur={r['dur']}s mean={r['mean']} | {r['orig'][:80]}")
    lines.append("")

open(ROOT / "scripts" / "_classify.md", "w", encoding="utf-8").write("\n".join(lines))
json.dump(rows, open(ROOT / "_tmp_audio" / "notes_classified.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
for g in ["AO_GIAC_CHANNEL", "NEN_CHU", "CAU_THAT", "ZOOM_NOTE"]:
    print(g, len(groups.get(g, [])))
