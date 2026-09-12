# -*- coding: utf-8 -*-
"""
GIAI ĐOẠN 3C — CHÚ THÍCH TRUNG THỰC CHO SEGMENT "CỨNG ĐẦU"
===========================================================
Sau khi đã khôi phục ~90% segment nén chữ bằng Whisper + prompt chuyên ngành,
một số ít segment còn lại có audio quá nhanh/không rõ khiến model không bóc
tách được chính xác (thử cả 3 cách: bóc thường, bóc lại, làm chậm audio).

NGUYÊN TẮC: KHÔNG bịa nội dung. Thay text vô nghĩa bằng CHÚ THÍCH TRUNG THỰC
ghi rõ đoạn này không bóc tách được rõ nghĩa, kèm mốc thời gian để người xem
tự nghe lại nếu cần.
"""

import re
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NOTE_SHORT = "[Đoạn nói nhanh — phụ đề không bóc tách được rõ nghĩa, mời nghe trực tiếp]"


def short_ratio(t):
    toks = [x for x in re.split(r"\s+", t.strip()) if x]
    if len(toks) < 6:
        return 0.0
    return sum(1 for x in toks if len(x) <= 2) / len(toks)


def main():
    vids = sorted([p.name for p in (ROOT / "video").iterdir() if p.is_dir()])
    total = 0
    touched = []

    for sku in vids:
        jp = ROOT / "video" / sku / "transcript.json"
        if not jp.exists():
            continue
        with open(jp, "r", encoding="utf-8") as f:
            d = json.load(f)
        segs = d.get("segments") or []
        bad = [s for s in segs if short_ratio(s.get("text", "")) >= 0.75]
        if not bad:
            continue

        for s in bad:
            s["text"] = NOTE_SHORT

        d["full_text"] = " ".join(x["text"] for x in segs)
        with open(jp, "w", encoding="utf-8") as f:
            json.dump(d, f, ensure_ascii=False, indent=2)

        lines = []
        for i, s in enumerate(segs, 1):
            lines.append(str(i) + "\n")
            lines.append(s["start_time"] + " --> " + s["end_time"] + "\n")
            lines.append(s["text"] + "\n\n")
        with open(ROOT / "video" / sku / "transcript.srt", "w", encoding="utf-8") as f:
            f.writelines(lines)
        with open(ROOT / "video" / sku / "transcript.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(x["text"] for x in segs) + "\n")

        total += len(bad)
        touched.append((sku, len(bad)))
        print(f"{sku}: chu thich {len(bad)} segment", flush=True)

    print()
    print("=" * 60)
    print(f"TONG: {total} segment duoc chu thich trung thuc")
    print(f"So video: {len(touched)}")


if __name__ == "__main__":
    main()
