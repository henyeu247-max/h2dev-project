# -*- coding: utf-8 -*-
"""
KHÔI PHỤC CÁC SEGMENT BỊ CHÚ THÍCH OAN
======================================
Với mọi segment đang là chú thích [Khoảng lặng...] / [Đoạn nói nhanh...]:
  - Bỏ qua nhóm ZOOM_NOTE (đã annotate từ trước) và nhóm im lặng tuyệt đối
    (La La School / Ghiền Mì Gõ với mean < -50 dB).
  - Còn lại: trích audio đúng khoảng + whisper prompt + temp=0 -> text mới.
  - Quyết định:
      * nếu text mới MẠCH LẠC & KHÔNG phải mẫu ảo giác -> dùng text mới
      * elif text gốc MẠCH LẠC & không phải mẫu ảo giác -> khôi phục text gốc
      * else -> giữ chú thích
Xuất JSON quyết định để review trước khi ghi.
"""
import json
import re
import subprocess
from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = str(Path("D:/Linly-Dubbing") / "bin" / "ffmpeg.exe")
BK = ROOT / "_backup" / "20260912-pre-full-fix" / "transcripts"

spec = importlib.util.spec_from_file_location(
    "batch", ROOT / "scripts" / "batch_restore_all_videos.py")
batch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(batch)

# Mẫu ảo giác (template) — chỉ khớp cụm đặc trưng, KHÔNG khớp từ khoá chung
HALL_TEMPLATES = [
    "la la school", "ghiền mì gõ", "subscribe cho kênh",
    "cảm ơn các bạn đã theo dõi và hẹn gặp lại",
    "các bạn có thể nhận thêm", "nhận thêm bản ghi", "nhận thêm nhiều thông tin",
    "bản ghi của mình trong phần bình luận", "bản ghi bản thân của mình",
    "tìm hiểu về các bài content của mình", "các mục tiêu của youtube",
    "hãy xem video này", "xem video này nhé",
    "nhớ like, share và đăng ký kênh", "nhớ like và share video này",
    "hãy đăng ký kênh để ủng hộ kênh của mình nhé",
    "tìm ra những cái mẫu này trong phần bình luận",
    "tìm hiểu về các bản ghi của mình", "tìm ra những kênh khác để tìm hiểu",
    "các bạn có thể tìm ra", "các bạn có thể xem video này",
    "điều này có thể dùng để tạo ra nhiều thông tin",
    "các bạn có thể nhìn thấy những bản ghi này",
]


def is_hall(t):
    low = t.lower()
    if any(h in low for h in HALL_TEMPLATES):
        return True
    # lặp câu
    toks = low.split()
    if len(toks) > 8:
        half = len(toks) // 2
        if toks[:half] == toks[half:half * 2]:
            return True
    return False


def short_ratio(text):
    toks = [t for t in re.split(r"\s+", text.strip()) if t]
    if len(toks) < 6:
        return 0.0
    return sum(1 for t in toks if len(t) <= 2) / len(toks)


def coherent(t):
    """Tiếng Việt mạch lạc: đủ dài, không rớt nguyên âm, có dấu."""
    if not t or len(t) < 8:
        return False
    if short_ratio(t) >= 0.55:
        return False
    return True


def main():
    batch.KEYS = batch.load_valid_keys()
    work = ROOT / "_tmp_audio" / "restore_over.mp3"

    rows = json.load(open(ROOT / "_tmp_audio" / "notes_classified.json", encoding="utf-8"))
    todo = []
    for r in rows:
        if r["group"] == "ZOOM_NOTE":
            continue
        if r["group"] == "AO_GIAC_CHANNEL" and (r["mean"] is None or r["mean"] < -50):
            continue  # im lặng tuyệt đối -> giữ chú thích
        todo.append(r)

    out = []
    for i, r in enumerate(todo, 1):
        sku, sid = r["sku"], r["id"]
        cur = json.load(open(ROOT / "video" / sku / "transcript.json", encoding="utf-8"))
        seg = [s for s in cur["segments"] if s["id"] == sid][0]
        vpath = None
        for ext in (".mp4", ".webm", ".mkv"):
            if (ROOT / "video" / sku / f"{sku}{ext}").exists():
                vpath = ROOT / "video" / sku / f"{sku}{ext}"
                break
        if vpath is None:
            continue
        start = float(seg["start"])
        dur = min(28.0, float(seg["end"]) - start)
        try:
            subprocess.run([FFMPEG, "-y", "-ss", str(round(start, 3)), "-t", str(round(dur, 3)),
                            "-i", str(vpath), "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k",
                            "-f", "mp3", str(work)],
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            res = batch.whisper(work)
            new = re.sub(r"\s{2,}", " ", (res.get("text") or "").strip())
        except Exception as e:
            print("ERR", sku, sid, str(e)[:40], flush=True)
            new = ""

        orig = r["orig"]
        if coherent(new) and not is_hall(new):
            decision, final = "DUNG_MOI", new
        elif coherent(orig) and not is_hall(orig):
            decision, final = "KHOI_PHUC_GOC", orig
        else:
            decision, final = "GIU_CHU_THICH", None

        out.append({"sku": sku, "id": sid, "start_time": r["start_time"],
                    "mean": r["mean"], "group": r["group"],
                    "orig": orig, "relisten": new,
                    "decision": decision, "final": final})
        print(f"[{i}/{len(todo)}] {sku} #{sid} -> {decision}", flush=True)

    json.dump(out, open(ROOT / "_tmp_audio" / "restore_decisions.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    lines = []
    from collections import Counter
    cnt = Counter(x["decision"] for x in out)
    lines.append("THONG KE: " + str(dict(cnt)))
    lines.append("")
    for x in out:
        lines.append(f"--- {x['sku']} #{x['id']} @ {x['start_time']} mean={x['mean']} [{x['decision']}]")
        lines.append(f"    GOC    : {x['orig'][:150]}")
        lines.append(f"    BOCLAI : {x['relisten'][:200]}")
        if x["final"]:
            lines.append(f"    => DUNG : {x['final'][:200]}")
    open(ROOT / "scripts" / "_restore_decisions.md", "w", encoding="utf-8").write("\n".join(lines))
    print("DONE", dict(cnt))


if __name__ == "__main__":
    main()
