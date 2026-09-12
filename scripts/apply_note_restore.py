# -*- coding: utf-8 -*-
"""
ÁP DỤNG QUYẾT ĐỊNH KHÔI PHỤC (sau khi đã rà tay)
=================================================
- DÙNG_MỚI  : thay text bằng bản bóc lại (trừ các ca bị chặn tay)
- DÙNG_GỐC  : khôi phục text gốc trong backup
- GIỮ_CHÚ_THÍCH: giữ nguyên chú thích (nhưng sửa nhãn cho đúng bản chất:
                 có tiếng nói -> "Đoạn nói nhanh"; im lặng -> "Khoảng lặng")
Đồng bộ transcript.json / .srt / .txt
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BK = ROOT / "_backup" / "20260912-pre-full-fix" / "transcripts"

NOTE_FAST = "[Đoạn nói nhanh — phụ đề không bóc tách được rõ nghĩa, mời nghe trực tiếp]"
NOTE_SILENT = "[Khoảng lặng thao tác — tác giả thao tác trên màn hình]"

# --- chặn tay: các bản bóc lại vẫn là ảo giác -> giữ chú thích ---
REJECT = {
    ("VIDEO-61ad94", 179), ("VIDEO-83a28e", 89), ("VIDEO-9ea5e3", 145),
    ("VIDEO-af606d", 64), ("VIDEO-ba3904", 66), ("VIDEO-1a7f58", 50),
    ("VIDEO-d2cd90", 155), ("VIDEO-c1bd51", 116), ("VIDEO-c1bd51", 83),
}
# --- khôi phục text gốc (câu thật ngắn) ---
USE_GOC = {("VIDEO-199f44", 32), ("VIDEO-3df94e", 59), ("VIDEO-5d54d0", 1285)}
# --- dùng bản bóc lại (bị bộ lọc chặn nhầm) ---
EXTRA_NEW = {
    ("VIDEO-2de9e4", 89): "Các bạn có thể tìm ra những cách để tìm hiểu thêm nhiều về các thị trường ngoại.",
}


def write_outputs(sku, segs):
    vp = ROOT / "video" / sku
    jp = vp / "transcript.json"
    d = json.load(open(jp, encoding="utf-8"))
    d["segments"] = segs
    d["full_text"] = " ".join(s.get("text", "") for s in segs)
    with open(jp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    lines = []
    for i, s in enumerate(segs, 1):
        lines.append(str(i) + "\n")
        lines.append(s["start_time"] + " --> " + s["end_time"] + "\n")
        lines.append(s.get("text", "") + "\n\n")
    with open(vp / "transcript.srt", "w", encoding="utf-8") as f:
        f.writelines(lines)
    with open(vp / "transcript.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(s.get("text", "") for s in segs) + "\n")


def main():
    dec = json.load(open(ROOT / "_tmp_audio" / "restore_decisions.json", encoding="utf-8"))
    by_sku = {}
    for x in dec:
        by_sku.setdefault(x["sku"], []).append(x)

    stat = {"DUNG_MOI": 0, "DUNG_GOC": 0, "GIU_NOTE": 0, "EXTRA": 0}
    for sku, items in by_sku.items():
        cur = json.load(open(ROOT / "video" / sku / "transcript.json", encoding="utf-8"))
        segs = cur["segments"]
        byid = {s["id"]: s for s in segs}
        bk = {s["id"]: s.get("text", "") for s in
              json.load(open(BK / sku / "transcript.json", encoding="utf-8"))["segments"]}

        for x in items:
            sid = x["id"]
            s = byid.get(sid)
            if s is None:
                continue
            key = (sku, sid)
            if key in REJECT:
                s["text"] = NOTE_FAST if (x["mean"] or -99) > -45 else NOTE_SILENT
                stat["GIU_NOTE"] += 1
            elif key in EXTRA_NEW:
                s["text"] = EXTRA_NEW[key]
                stat["EXTRA"] += 1
            elif x["decision"] == "DUNG_MOI":
                s["text"] = x["final"]
                stat["DUNG_MOI"] += 1
            elif x["decision"] == "KHOI_PHUC_GOC":
                s["text"] = x["orig"]
                stat["DUNG_GOC"] += 1
            else:  # GIU_CHU_THICH
                if key in USE_GOC:
                    s["text"] = x["orig"]
                    stat["DUNG_GOC"] += 1
                else:
                    s["text"] = NOTE_FAST if (x["mean"] or -99) > -45 else NOTE_SILENT
                    stat["GIU_NOTE"] += 1

        write_outputs(sku, segs)
        print(f"{sku}: cap nhat {len(items)} segment")

    print()
    print("THONG KE:", stat)


if __name__ == "__main__":
    main()
