# -*- coding: utf-8 -*-
"""
GIAI ĐOẠN 4 — CHUẨN HÓA ĐỊNH DẠNG transcript.txt
==================================================
Hiện trạng: 130 video có transcript.txt gộp toàn bộ nội dung thành 1 dòng dài,
trong khi transcript.srt và transcript.json tách theo từng segment.

Chuẩn hóa: transcript.txt = 1 dòng / 1 segment (khớp tuyệt đối với srt & json).

An toàn: kiểm chứng nội dung (bỏ khoảng trắng) TRƯỚC và SAU khi chuyển phải khớp 100%.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def norm(s):
    """Chuẩn hóa để so khớp nội dung (bỏ mọi khoảng trắng thừa)."""
    return re.sub(r"\s+", " ", s).strip()


def main():
    vids = sorted([p.name for p in (ROOT / "video").iterdir() if p.is_dir()])
    converted = 0
    skipped = 0
    mismatch = []

    for sku in vids:
        vp = ROOT / "video" / sku
        jp = vp / "transcript.json"
        tp = vp / "transcript.txt"
        if not (jp.exists() and tp.exists()):
            continue

        with open(jp, "r", encoding="utf-8") as f:
            d = json.load(f)
        segs = d.get("segments") or []
        if not segs:
            continue

        old = tp.read_text(encoding="utf-8", errors="ignore")
        lines = [l for l in old.split("\n") if l.strip()]
        if len(lines) == len(segs):
            skipped += 1
            continue

        # Kiem chung noi dung truoc khi chuyen
        old_norm = norm(old)
        json_norm = norm(" ".join(s.get("text", "") for s in segs))
        if old_norm != json_norm:
            mismatch.append(sku)
            continue

        with open(tp, "w", encoding="utf-8") as f:
            f.write("\n".join(s.get("text", "") for s in segs) + "\n")
        converted += 1

    print("=" * 60)
    print(f"Da chuan hoa TXT: {converted} video")
    print(f"Da dung chuan san (bo qua): {skipped} video")
    print(f"Lech noi dung (khong chuyen): {len(mismatch)} video")
    if mismatch:
        for m in mismatch[:20]:
            print("   [!] " + m)


if __name__ == "__main__":
    main()
