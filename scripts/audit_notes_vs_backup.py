# -*- coding: utf-8 -*-
"""
Đối chiếu backup <-> hiện tại: liệt kê MỌI segment bị thay bằng chú thích
"[Khoảng lặng thao tác..." và in ra TEXT GỐC để hậu kiểm (đảm bảo không xoá nhầm câu thật).
Xuất ra file md để đọc.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BK = ROOT / "_backup" / "20260912-pre-full-fix" / "transcripts"

rows = []
for sku_dir in sorted(BK.iterdir()):
    if not sku_dir.is_dir():
        continue
    sku = sku_dir.name
    cur_p = ROOT / "video" / sku / "transcript.json"
    bk_p = sku_dir / "transcript.json"
    if not cur_p.exists() or not bk_p.exists():
        continue
    cur = json.load(open(cur_p, encoding="utf-8")).get("segments", [])
    bk = {s["id"]: s.get("text", "") for s in json.load(open(bk_p, encoding="utf-8")).get("segments", [])}
    for s in cur:
        t = s.get("text", "")
        if t.startswith("[Khoảng lặng") or t.startswith("[Đoạn nói nhanh"):
            rows.append((sku, s["id"], bk.get(s["id"], "?"), t[:40]))

lines = []
lines.append(f"TONG SO SEGMENT DA THAY BANG CHU THICH: {len(rows)}")
lines.append("")
for sku, sid, orig, note in rows:
    lines.append(f"{sku} #{sid} | GOC: {orig}")
open(ROOT / "scripts" / "_notes_audit.md", "w", encoding="utf-8").write("\n".join(lines))
print("TOTAL", len(rows))
