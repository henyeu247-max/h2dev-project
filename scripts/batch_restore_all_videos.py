# -*- coding: utf-8 -*-
"""
GIAI ĐOẠN 2+3 — CHUẨN HÓA PHỤ ĐỀ TOÀN BỘ 136 VIDEO
=====================================================
Xử lý 2 loại lỗi trên mọi video:

  (1) SEGMENT "NÉN CHỮ" — Whisper rớt nguyên âm
      -> Trích audio đúng khoảng thời gian + bóc lại bằng whisper-large-v3
         kèm PROMPT ngữ cảnh tiếng Việt chuyên ngành + temperature=0
      -> Giữ nguyên timestamp gốc, chỉ thay text

  (2) SEGMENT ẢO GIÁC — vòng lặp subscribe / La La School / Ghiền Mì Gõ
      -> Xuất danh sách kèm mốc thời gian để trích frame + chú thích trung thực
         (script riêng: annotate_hallucinations.py)

Chạy theo lô để tránh rate-limit Groq.
Xuất đồng bộ: transcript.json / transcript.srt / transcript.txt
"""

import os
import re
import json
import time
import argparse
import subprocess
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINLY = Path("D:/Linly-Dubbing")
FFMPEG = str(LINLY / "bin" / "ffmpeg.exe")
GROQ_CFG = LINLY / "config" / "groq_config.json"
USER_AGENT = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

VI_PROMPT = (
    "Đây là bản ghi video hướng dẫn xây kênh YouTube faceless bằng tiếng Việt. "
    "Thuật ngữ thường gặp: kênh, ngách, key, view, prompt, kịch bản, thumbnail, "
    "CapCut, AdSense, Gmail, proxy, GPM, VOTP, ngâm kênh, bán content, reup, "
    "doanh thu, RPM, AVD, đề xuất, đối thủ, tool, ChatGPT, Gemini, video, nội dung."
)

HALL_PATTERNS = [
    "subscribe cho kênh", "Ghiền Mì Gõ", "La La School",
    "Cảm ơn các bạn đã theo dõi", "Hãy subscribe", "quảng cáo sau",
    "đăng ký kênh để ủng hộ", "nhớ đăng ký kênh", "like và chia sẻ",
    "hãy đăng ký", "ủng hộ kênh",
]

# ------------------------------------------------------------------ keys
def _test_key(key):
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/models",
        headers={"Authorization": f"Bearer {key}", "User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return r.status == 200
    except Exception:
        return False


def load_valid_keys():
    with open(GROQ_CFG, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    raw = [k["key"] for k in cfg.get("groq_api_keys", []) if k.get("key")]
    valid = [k for k in raw if _test_key(k)]
    print(f"[Keys] {len(valid)}/{len(raw)} hợp lệ", flush=True)
    return valid


KEYS = []
_idx = {"i": 0}


def next_key():
    k = KEYS[_idx["i"] % len(KEYS)]
    _idx["i"] += 1
    return k


# ------------------------------------------------------------------ audio + whisper
def extract_audio(video, start, dur, out_mp3):
    cmd = [FFMPEG, "-y", "-ss", str(round(start, 3)), "-t", str(round(dur, 3)),
           "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k",
           "-f", "mp3", str(out_mp3)]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return out_mp3.exists() and out_mp3.stat().st_size > 0


def whisper(path, retries=8):
    boundary = "----WebKitFormBoundaryH2DevBatch"
    with open(path, "rb") as f:
        audio = f.read()
    parts = [
        f'--{boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n'.encode(),
        f'--{boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n'.encode(),
        f'--{boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nvi\r\n'.encode(),
        f'--{boundary}\r\nContent-Disposition: form-data; name="temperature"\r\n\r\n0\r\n'.encode(),
        f'--{boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n{VI_PROMPT}\r\n'.encode("utf-8"),
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{path.name}"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode(),
        audio,
        f'\r\n--{boundary}--\r\n'.encode(),
    ]
    body = b"".join(parts)
    for attempt in range(retries):
        key = next_key()
        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {key}",
                     "Content-Type": f"multipart/form-data; boundary={boundary}",
                     "User-Agent": USER_AGENT},
            data=body, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=150) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(3 + attempt * 2)
                continue
            elif e.code in (500, 502, 503, 504):
                time.sleep(2)
                continue
            else:
                time.sleep(1)
        except Exception:
            time.sleep(1)
    raise RuntimeError("whisper failed")


# ------------------------------------------------------------------ detection
def short_ratio(text):
    toks = [t for t in re.split(r"\s+", text.strip()) if t]
    if len(toks) < 6:
        return 0.0
    return sum(1 for t in toks if len(t) <= 2) / len(toks)


def is_compressed(t):
    return short_ratio(t) >= 0.75


def is_hallucination(t):
    low = t.lower()
    return any(h.lower() in low for h in HALL_PATTERNS)


# ------------------------------------------------------------------ output
def fmt_time(seconds):
    """Chuyển giây -> HH:MM:SS,mmm (chuẩn SRT)."""
    seconds = max(0.0, float(seconds))
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    sec = int(seconds % 60)
    ms = int(round((seconds - int(seconds)) * 1000))
    if ms >= 1000:
        ms = 999
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"


def ensure_times(seg):
    """Đảm bảo segment luôn có đủ start/end (số) và start_time/end_time (chuỗi)."""
    if "start" not in seg or seg.get("start") is None:
        seg["start"] = 0.0
    if "end" not in seg or seg.get("end") is None:
        seg["end"] = float(seg["start"]) + 1.0
    if not seg.get("start_time"):
        seg["start_time"] = fmt_time(seg["start"])
    if not seg.get("end_time"):
        seg["end_time"] = fmt_time(seg["end"])
    return seg


def write_outputs(sku, segments):
    vp = ROOT / "video" / sku
    jp = vp / "transcript.json"
    for s in segments:
        ensure_times(s)
    with open(jp, "r", encoding="utf-8") as f:
        d = json.load(f)
    d["segments"] = segments
    d["full_text"] = " ".join(s["text"] for s in segments)
    with open(jp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    lines = []
    for i, s in enumerate(segments, 1):
        lines.append(str(i) + "\n")
        lines.append(s["start_time"] + " --> " + s["end_time"] + "\n")
        lines.append(s["text"] + "\n\n")
    with open(vp / "transcript.srt", "w", encoding="utf-8") as f:
        f.writelines(lines)
    with open(vp / "transcript.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(s["text"] for s in segments) + "\n")


# ------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", type=int, default=0, help="index video bat dau")
    ap.add_argument("--limit", type=int, default=0, help="so video xu ly (0=het)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    global KEYS
    KEYS = load_valid_keys()
    if not KEYS:
        print("KHONG CO KEY HOP LE — dung.")
        return

    vids = sorted([p.name for p in (ROOT / "video").iterdir() if p.is_dir()])
    # chi lay video co transcript.json
    vids = [v for v in vids if (ROOT / "video" / v / "transcript.json").exists()]
    if args.limit:
        vids = vids[args.start:args.start + args.limit]
    else:
        vids = vids[args.start:]

    tmp = ROOT / "_tmp_audio"
    tmp.mkdir(exist_ok=True)
    work = tmp / "chunk.mp3"

    total_fixed = 0
    total_hall = 0
    hall_list = []
    processed = 0

    for sku in vids:
        jp = ROOT / "video" / sku / "transcript.json"
        with open(jp, "r", encoding="utf-8") as f:
            d = json.load(f)
        segs = d.get("segments") or []
        if not segs:
            continue

        # Tim file video
        video = None
        for ext in [".mp4", ".webm"]:
            cand = ROOT / "video" / sku / f"{sku}{ext}"
            if cand.exists():
                video = cand
                break
        if not video:
            print(f"[{sku}] khong co file video — bo qua", flush=True)
            continue

        fixed_here = 0
        changed = False
        for s in segs:
            t = s.get("text", "")

            if is_hallucination(t):
                total_hall += 1
                hall_list.append({"sku": sku, "id": s["id"],
                                  "start_time": s["start_time"],
                                  "start": s["start"], "end": s["end"],
                                  "text": t[:100]})
                continue

            if not is_compressed(t):
                continue

            if args.dry_run:
                fixed_here += 1
                continue

            start = float(s["start"])
            end = float(s["end"])
            dur = max(1.0, end - start)
            try:
                extract_audio(video, max(0.0, start - 0.8), dur + 1.6, work)
                res = whisper(work)
                new_text = re.sub(r"\s{2,}", " ", (res.get("text") or "").strip())
                if (new_text and not is_compressed(new_text)
                        and not is_hallucination(new_text)
                        and not re.fullmatch(r"(?:à\s*)+", new_text)):
                    s["text"] = new_text
                    fixed_here += 1
                    changed = True
            except Exception as e:
                print(f"   [LOI] {sku} #{s['id']}: {str(e)[:50]}", flush=True)

        if changed:
            write_outputs(sku, segs)

        processed += 1
        total_fixed += fixed_here
        if fixed_here or (processed % 10 == 0):
            print(f"[{processed}/{len(vids)}] {sku}: khoi phuc {fixed_here} segment", flush=True)

    # Luu danh sach ao giac
    out = ROOT / "_audit" / "20260912-full-136-audit" / "hallucination_list.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(hall_list, f, ensure_ascii=False, indent=2)

    print()
    print("=" * 60)
    print(f"TONG KHOI PHUC: {total_fixed} segment nen chu")
    print(f"TONG AO GIAC PHAT HIEN: {total_hall} segment")
    print(f"Danh sach ao giac: {out}")


if __name__ == "__main__":
    main()
