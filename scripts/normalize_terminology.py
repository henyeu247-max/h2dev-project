# -*- coding: utf-8 -*-
"""
CHUẨN HOÁ THUẬT NGỮ BỊ WHISPER NGHE SAI (đợt bổ sung)
=====================================================
Chỉ xử lý các trường hợp RÕ RÀNG, không gây nhập nhằng:
  'sức khỉ' / 'xuất khỉ' / 'xuất khế' / 'sức khế'  -> 'sức khỏe'
  'cây sức khỏe' -> 'cái sức khỏe'
  'kỳ sức khỏe' / 'ký sức khỏe' -> 'key sức khỏe'
Đồng bộ transcript.json / .srt / .txt. In bảng diff để hậu kiểm.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

REPL = [
    ("xuất khế", "sức khỏe"),
    ("xuất khỉ", "sức khỏe"),
    ("sức khế", "sức khỏe"),
    ("sức khỉ", "sức khỏe"),
    ("cây sức khỏe", "cái sức khỏe"),
    ("kỳ sức khỏe", "key sức khỏe"),
    ("ký sức khỏe", "key sức khỏe"),
]


def apply_repl(t):
    orig = t
    for a, b in REPL:
        t = t.replace(a, b)
    return t


def main():
    total_seg = 0
    total_hits = 0
    touched = []
    samples = []
    for vd in sorted((ROOT / "video").iterdir()):
        if not vd.is_dir():
            continue
        jp = vd / "transcript.json"
        if not jp.exists():
            continue
        d = json.load(open(jp, encoding="utf-8"))
        segs = d.get("segments") or []
        changed = 0
        for s in segs:
            old = s.get("text", "")
            new = apply_repl(old)
            if new != old:
                if len(samples) < 25:
                    samples.append((vd.name, s.get("id"), old, new))
                s["text"] = new
                changed += 1
                total_hits += sum(old.count(a) for a, _ in REPL)
        if changed:
            total_seg += changed
            touched.append((vd.name, changed))
            d["full_text"] = " ".join(x.get("text", "") for x in segs)
            json.dump(d, open(jp, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
            lines = []
            for i, x in enumerate(segs, 1):
                lines.append(str(i) + "\n")
                lines.append(x["start_time"] + " --> " + x["end_time"] + "\n")
                lines.append(x.get("text", "") + "\n\n")
            open(vd / "transcript.srt", "w", encoding="utf-8").writelines(lines)
            open(vd / "transcript.txt", "w", encoding="utf-8").write(
                "\n".join(x.get("text", "") for x in segs) + "\n")

    print(f"Video sua: {len(touched)} | segment sua: {total_seg} | luot thay: {total_hits}")
    print("\n=== MAU DIFF ===")
    for sku, sid, o, n in samples:
        print(f"  {sku} #{sid}: {o[:80]}")
        print(f"       -> {n[:80]}")


if __name__ == "__main__":
    main()
