# -*- coding: utf-8 -*-
"""
FIX TRANSCRIPT VUOT THOI LUONG — H2DEV
=====================================
2 lop loi phat hien qua audit doc lap:
  1) field `duration` trong transcript.json LECH so voi ffprobe that (>1s)
     -> cap nhat theo ffprobe (nguon chan ly).
  2) segment co `end` VUOT thoi luong video that (thuong la segment chu thich
     cuoi "[Khoang lang thao tac ...]" keo dai qua moc ket thuc video)
     -> cap `end` = real_duration - margin, tinh lai end_time.

Giu nguyen noi dung text (cam bia). Ghi lai 3 dinh dang dong bo 1-1
(transcript.json / .srt / .txt) dung CRLF nhu ban goc.

Chay: python scripts/fix_transcript_duration_overflow.py           (dry-run)
      python scripts/fix_transcript_duration_overflow.py --apply   (ghi file)
"""
import os
import sys
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VID = ROOT / "video"
FFPROBE = r"D:\Linly-Dubbing\bin\ffprobe.exe"
DUR_TOL = 1.0          # lech > 1s moi coi la sai
MARGIN = 0.05          # lui end lai 0.05s so voi duration cho an toan
APPLY = "--apply" in sys.argv
STAMP = "20260916-transcript-duration-fix"
BKDIR = ROOT / "_backup" / STAMP


def ffprobe_duration(p):
    try:
        out = subprocess.check_output(
            [FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(p)],
            timeout=60).decode().strip()
        return float(out)
    except Exception:
        return None


def fmt_ts(sec):
    if sec < 0:
        sec = 0.0
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def build_srt(segs):
    out = []
    for i, s in enumerate(segs, 1):
        st = s.get("start_time") or fmt_ts(s.get("start", 0))
        en = s.get("end_time") or fmt_ts(s.get("end", 0))
        out.append(f"{i}\r\n{st} --> {en}\r\n{s['text']}\r\n\r\n")
    return "".join(out)


def main():
    media = {}
    for d in sorted(os.listdir(VID)):
        dd = VID / d
        m = [f for f in os.listdir(dd) if f.lower().endswith((".mp4", ".webm"))]
        if m:
            media[d] = dd / m[0]

    dur_fix, seg_fix, touched = [], [], []
    for sku, mpath in media.items():
        jp = VID / sku / "transcript.json"
        if not jp.exists():
            continue
        real = ffprobe_duration(mpath)
        if not real:
            continue
        j = json.loads(jp.read_text(encoding="utf-8"))
        segs = j.get("segments") or []
        changed = False

        # --- lop 2: segment vuot duration (dung moc ffprobe that) ---
        n_over = 0
        for s in segs:
            if s.get("end", 0) > real + 1e-6:
                new_end = round(real - MARGIN, 2)
                if new_end <= s.get("start", 0):
                    new_end = round(max(s.get("start", 0) + 0.01, real - MARGIN), 2)
                s["end"] = new_end
                s["end_time"] = fmt_ts(new_end)
                n_over += 1
                changed = True
        if n_over:
            seg_fix.append((sku, n_over, round(real, 2)))

        # --- lop 1: field duration ---
        #   cap nhat khi lech > nguong HOAC dang nho hon segment cuoi (vi pham integrity)
        jd = j.get("duration")
        max_end = max((s.get("end", 0) for s in segs), default=0.0)
        if jd is None or abs(jd - real) > DUR_TOL or jd + 0.01 < max_end:
            dur_fix.append((sku, None if jd is None else round(jd, 2), round(real, 2)))
            j["duration"] = round(real, 6)
            changed = True

        if changed:
            touched.append(sku)
            if APPLY:
                BKDIR.mkdir(parents=True, exist_ok=True)
                shutil.copy2(jp, BKDIR / f"{sku}.transcript.json")
                shutil.copy2(VID / sku / "transcript.srt", BKDIR / f"{sku}.transcript.srt")
                shutil.copy2(VID / sku / "transcript.txt", BKDIR / f"{sku}.transcript.txt")
                # ghi lai json
                jp.write_text(json.dumps(j, ensure_ascii=False, indent=2).replace("\n", "\r\n"),
                              encoding="utf-8", newline="")
                # chi rebuild srt + txt khi transcript theo schema chuan
                # (co start_time/end_time; KHONG dung cho transcript 'doc-style' cu)
                doc_style = any(("start_time" not in s) for s in segs)
                if not doc_style:
                    (VID / sku / "transcript.srt").write_text(build_srt(segs),
                                                              encoding="utf-8", newline="")
                    (VID / sku / "transcript.txt").write_text(
                        "".join(f"{s['text']}\r\n" for s in segs), encoding="utf-8", newline="")

    print(f"[{'APPLY' if APPLY else 'DRY-RUN'}] duration sai: {len(dur_fix)} | segment vuot: {len(seg_fix)} | video cham: {len(touched)}")
    for x in dur_fix:
        print(f"  DUR  {x[0]}: {x[1]} -> {x[2]}")
    print("  --- segment vuot ---")
    for x in seg_fix:
        print(f"  SEG  {x[0]}: cap {x[1]} segment ve <= {x[2]}s")
    if APPLY:
        print(f"  backup -> {BKDIR}")


if __name__ == "__main__":
    main()
