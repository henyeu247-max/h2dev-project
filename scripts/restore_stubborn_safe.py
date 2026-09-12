# -*- coding: utf-8 -*-
"""
GIAI ĐOẠN 3B (bản an toàn) — XỬ LÝ SEGMENT "CỨNG ĐẦU"
======================================================
Bài học từ lần chạy trước: làm chậm audio (atempo) giúp Whisper bắt nguyên âm
NHƯNG cũng dễ sinh ẢO GIÁC MỚI dạng "Cảm ơn các bạn / like và share / nhận thêm
thông tin / phần bình luận...".

Bản này bổ sung 2 lớp bảo vệ:
  (1) Bộ lọc ảo giác mở rộng (nhận diện cả các mẫu mới)
  (2) KIỂM CHỨNG CHÉO: bản mới phải "tương đồng nội dung" với bản gốc
      (đo bằng tỷ lệ ký tự/ký tự đặc trưng trùng khớp) — nếu khác hoàn toàn
      thì coi là ảo giác và TỪ CHỐI, giữ nguyên bản gốc.
  (3) Nếu vẫn thất bại -> ghi chú trung thực thay vì để text vô nghĩa.
"""

import re
import json
import time
import unicodedata
import subprocess
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINLY = Path("D:/Linly-Dubbing")
FFMPEG = str(LINLY / "bin" / "ffmpeg.exe")
GROQ_CFG = LINLY / "config" / "groq_config.json"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

VI_PROMPT = (
    "Đây là bản ghi video hướng dẫn xây kênh YouTube faceless bằng tiếng Việt. "
    "Thuật ngữ thường gặp: kênh, ngách, key, view, prompt, kịch bản, thumbnail, "
    "CapCut, AdSense, Gmail, proxy, ngâm kênh, bán content, reup, doanh thu, "
    "RPM, AVD, đề xuất, đối thủ, tool, ChatGPT, Gemini."
)

# Bộ lọc ảo giác MỞ RỘNG (gồm cả các mẫu mới phát hiện ở lần chạy trước)
HALL = [
    "subscribe cho kênh", "ghiền mì gõ", "la la school",
    "cảm ơn các bạn đã theo dõi", "hãy subscribe", "quảng cáo sau",
    "đăng ký kênh", "ủng hộ kênh", "like và share", "like và chia sẻ",
    "hãy xem video này", "xem video này nhé",
    "nhận thêm bản ghi", "nhận thêm nhiều thông tin", "nhận thêm thông tin",
    "thông tin về các kênh", "trong phần bình luận",
    "bản ghi của mình", "các mục tiêu của youtube",
    "tham gia thử thách", "thông tin của mình",
    "hãy đăng ký kênh", "nhận thêm nhiều video mới",
    "các bạn có thể nhận thêm", "các bạn có thể tham gia thử",
    "các bạn có thể nhớ like",
]


def is_hall(t):
    low = t.lower()
    return any(h in low for h in HALL)


def strip_accents(s):
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn").lower()


def char_overlap(a, b):
    """Tỷ lệ ký tự đặc trưng của bản mới xuất hiện trong bản gốc (bỏ dấu, bỏ space)."""
    ca = set(strip_accents(a).replace(" ", ""))
    cb = set(strip_accents(b).replace(" ", ""))
    if not cb:
        return 0.0
    return len(ca & cb) / len(cb)


def short_ratio(t):
    toks = [x for x in re.split(r"\s+", t.strip()) if x]
    if len(toks) < 6:
        return 0.0
    return sum(1 for x in toks if len(x) <= 2) / len(toks)


def test_key(k):
    req = urllib.request.Request("https://api.groq.com/openai/v1/models",
                                 headers={"Authorization": f"Bearer {k}", "User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return r.status == 200
    except Exception:
        return False


with open(GROQ_CFG, "r", encoding="utf-8") as f:
    _cfg = json.load(f)
KEYS = [k["key"] for k in _cfg.get("groq_api_keys", []) if k.get("key") and test_key(k["key"])]
print(f"[Keys] {len(KEYS)} hop le", flush=True)
_i = {"n": 0}


def nk():
    k = KEYS[_i["n"] % len(KEYS)]
    _i["n"] += 1
    return k


def extract_slow(video, start, dur, out):
    cmd = [FFMPEG, "-y", "-ss", str(round(start, 3)), "-t", str(round(dur, 3)),
           "-i", str(video), "-vn", "-af", "atempo=0.8", "-ac", "1", "-ar", "16000",
           "-b:a", "48k", "-f", "mp3", str(out)]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return out.exists() and out.stat().st_size > 0


def whisper(path, retries=8):
    b = "----WebKitFormBoundaryH2DevSafe"
    with open(path, "rb") as f:
        audio = f.read()
    parts = [
        f'--{b}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n'.encode(),
        f'--{b}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n'.encode(),
        f'--{b}\r\nContent-Disposition: form-data; name="language"\r\n\r\nvi\r\n'.encode(),
        f'--{b}\r\nContent-Disposition: form-data; name="temperature"\r\n\r\n0\r\n'.encode(),
        f'--{b}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n{VI_PROMPT}\r\n'.encode("utf-8"),
        f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="{path.name}"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode(),
        audio,
        f'\r\n--{b}--\r\n'.encode(),
    ]
    body = b"".join(parts)
    for a in range(retries):
        key = nk()
        req = urllib.request.Request("https://api.groq.com/openai/v1/audio/transcriptions",
                                     headers={"Authorization": f"Bearer {key}",
                                              "Content-Type": f"multipart/form-data; boundary={b}",
                                              "User-Agent": UA},
                                     data=body, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=150) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(4 + a * 2)
                continue
            time.sleep(2)
        except Exception:
            time.sleep(2)
    raise RuntimeError("whisper failed")


def main():
    tmp = ROOT / "_tmp_audio"
    tmp.mkdir(exist_ok=True)
    work = tmp / "safe.mp3"

    fixed = 0
    rejected = 0
    failed = []
    vids = sorted([p.name for p in (ROOT / "video").iterdir() if p.is_dir()])

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

        video = None
        for ext in [".mp4", ".webm"]:
            cand = ROOT / "video" / sku / f"{sku}{ext}"
            if cand.exists():
                video = cand
                break
        if not video:
            continue

        changed = False
        for s in bad:
            old = s.get("text", "")
            start = float(s.get("start", 0))
            end = float(s.get("end", 0))
            dur = max(1.0, end - start)
            try:
                extract_slow(video, max(0.0, start - 0.8), dur + 1.6, work)
                res = whisper(work)
                new = re.sub(r"\s{2,}", " ", (res.get("text") or "").strip())

                # --- 3 lớp kiểm tra ---
                if not new:
                    failed.append((sku, s["id"], "empty"))
                    continue
                if is_hall(new):
                    rejected += 1
                    failed.append((sku, s["id"], "HALLUCINATION: " + new[:60]))
                    continue
                if short_ratio(new) >= 0.75:
                    failed.append((sku, s["id"], "still compressed"))
                    continue
                ov = char_overlap(new, old)
                if ov < 0.75:
                    rejected += 1
                    failed.append((sku, s["id"], f"LOW_OVERLAP {ov:.2f}: " + new[:60]))
                    continue

                s["text"] = new
                changed = True
                fixed += 1
                print(f"  [OK] {sku} #{s['id']} (ov={ov:.2f}): {new[:80]}", flush=True)
            except Exception as e:
                failed.append((sku, s["id"], "ERR " + str(e)[:40]))

        if changed:
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

    print()
    print("=" * 60)
    print(f"KHOI PHUC (da kiem chung): {fixed} segment")
    print(f"TU CHOI (nghi ao giac/lech noi dung): {rejected} segment")
    out = ROOT / "_audit" / "20260912-full-136-audit" / "stubborn_final.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(failed, f, ensure_ascii=False, indent=2)
    print(f"Chi tiet: {out}")


if __name__ == "__main__":
    main()
