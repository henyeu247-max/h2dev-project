# -*- coding: utf-8 -*-
"""Kiểm tra các segment bị thay chú thích mà text gốc CÓ VẺ là câu thật.
In ngữ cảnh hiện tại (3 segment trước/sau) để xác định có lệch id không."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

CASES = [
    ("VIDEO-3df94e", 59),
    ("VIDEO-5d54d0", 1285),
    ("VIDEO-199f44", 6),
    ("VIDEO-199f44", 15),
    ("VIDEO-199f44", 32),
    ("VIDEO-2de9e4", 89),
    ("VIDEO-9f9fbc", 407),
    ("VIDEO-bdfa54", 416),
    ("VIDEO-bdfa54", 454),
    ("VIDEO-c1bd51", 116),
    ("VIDEO-3ae732", 67),
]

lines = []
for sku, sid in CASES:
    p = ROOT / "video" / sku / "transcript.json"
    d = json.load(open(p, encoding="utf-8"))
    segs = d["segments"]
    pos = [i for i, s in enumerate(segs) if s["id"] == sid]
    lines.append("=" * 72)
    lines.append(f"{sku} #{sid}   (tong {len(segs)} segment)")
    if not pos:
        lines.append("  KHONG TIM THAY id nay!")
        continue
    pos = pos[0]
    for j in range(max(0, pos - 2), min(len(segs), pos + 3)):
        mark = ">>>" if j == pos else "   "
        lines.append(f"{mark} #{segs[j]['id']} [{segs[j].get('start_time','?')}] {segs[j]['text']}")

open(ROOT / "scripts" / "_cases_audit.md", "w", encoding="utf-8").write("\n".join(lines))
print("WROTE", len(lines))
