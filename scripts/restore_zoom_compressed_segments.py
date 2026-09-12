# -*- coding: utf-8 -*-
"""
KHÔI PHỤC PHỤ ĐỀ 4 BUỔI ZOOM BỊ "NÉN CHỮ"
--------------------------------------------------
Nguyên nhân: Whisper-large-v3 bóc nhanh làm rớt nguyên âm ở các đoạn nói nhanh
=> phụ đề thành chuỗi vô nghĩa (vd: "m ch nha m ng").

Giải pháp: trích lại audio đúng khoảng thời gian của từng segment lỗi,
bóc lại bằng whisper-large-v3 kèm PROMPT ngữ cảnh tiếng Việt chuyên ngành
=> khôi phục nguyên âm + thuật ngữ chính xác, giữ nguyên timestamp gốc.

Xuất đồng bộ: transcript.srt / transcript.txt / transcript.json
"""

import os
import re
import json
import time
import subprocess
import urllib.request
import urllib.error
from pathlib import Path

PROJECT = Path("H2DEV-Project")
LINLY = Path("D:/Linly-Dubbing")
FFMPEG = str(LINLY / "bin" / "ffmpeg.exe")
GROQ_CFG = LINLY / "config" / "groq_config.json"
USER_AGENT = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

ZOOMS = [
    "ZOOM-01-Nen-tang-moi-truong",
    "ZOOM-02-Chien-luoc-kenh-san-xuat",
    "ZOOM-03-Quy-trinh-tool-toi-uu",
    "ZOOM-04-Adsense-khang-loi",
]

VI_PROMPT = (
    "Đây là bản ghi buổi Zoom hướng dẫn xây kênh YouTube faceless bằng tiếng Việt. "
    "Thuật ngữ thường gặp: kênh, ngách, key, view, prompt, kịch bản, thumbnail, "
    "CapCut, AdSense, Gmail, proxy, GPM, VOTP, ngâm kênh, bán content, reup, "
    "doanh thu, RPM, AVD, đề xuất, đối thủ, tool, ChatGPT, Gemini, video, nội dung."
)


# ------------------------- Groq keys -------------------------
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
    print(f"[Keys] {len(valid)}/{len(raw)} hợp lệ")
    return valid


KEYS = load_valid_keys()
_idx = {"i": 0}


def next_key():
    k = KEYS[_idx["i"] % len(KEYS)]
    _idx["i"] += 1
    return k


# ------------------------- Audio + Whisper -------------------------
def extract_audio(video, start, dur, out_mp3):
    cmd = [FFMPEG, "-y", "-ss", str(round(start, 3)), "-t", str(round(dur, 3)),
           "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k",
           "-f", "mp3", str(out_mp3)]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return out_mp3.exists() and out_mp3.stat().st_size > 0


def whisper(path, prompt, retries=10):
    boundary = "----WebKitFormBoundaryH2DevZoom"
    with open(path, "rb") as f:
        audio = f.read()
    parts = [
        f'--{boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n'.encode(),
        f'--{boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n'.encode(),
        f'--{boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nvi\r\n'.encode(),
        f'--{boundary}\r\nContent-Disposition: form-data; name="temperature"\r\n\r\n0\r\n'.encode(),
        f'--{boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n{prompt}\r\n'.encode("utf-8"),
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
                time.sleep(3 + attempt * 1.5)
                continue
            elif e.code in (500, 502, 503, 504):
                time.sleep(2)
                continue
            else:
                time.sleep(1)
        except Exception:
            time.sleep(1)
    raise RuntimeError("whisper failed")


# ------------------------- Detection -------------------------
def is_compressed(text):
    """Phát hiện câu bị nén chữ: tỷ lệ token ngắn (<=2 ký tự) quá cao."""
    toks = [t for t in re.split(r"\s+", text.strip()) if t]
    if len(toks) < 6:
        return False
    shorts = sum(1 for t in toks if len(t) <= 2)
    return (shorts / len(toks)) >= 0.75


def is_junk(text):
    """Câu vô nghĩa: nhiều token 1 ký tự hoặc ký tự lạ."""
    t = text.strip()
    if not t:
        return True
    if re.fullmatch(r"(?:à\s*)+", t):
        return True
    toks = t.split()
    if len(toks) >= 4:
        singles = sum(1 for x in toks if len(x) == 1)
        if singles / len(toks) > 0.6:
            return True
    return False


# ------------------------- Main -------------------------
def main():
    # Thư mục tạm nằm trong dự án, dùng lại 1 tên file duy nhất để tránh rác
    tmp = PROJECT / "_tmp_audio"
    tmp.mkdir(exist_ok=True)
    work_mp3 = tmp / "chunk.mp3"

    total_fixed = 0
    report = []

    for sku in ZOOMS:
        jp = PROJECT / "video" / sku / "transcript.json"
        with open(jp, "r", encoding="utf-8") as f:
            d = json.load(f)

        video = PROJECT / "video" / sku / f"{sku}.webm"
        fixed_here = 0

        for s in d["segments"]:
            txt = s.get("text", "")
            if not (is_compressed(txt) or is_junk(txt)):
                continue

            start = float(s["start"])
            end = float(s["end"])
            dur = max(1.0, end - start)
            out = work_mp3
            try:
                extract_audio(video, max(0.0, start - 0.8), dur + 1.6, out)
                res = whisper(out, VI_PROMPT)
                new_text = (res.get("text") or "").strip()
                # Chuẩn hóa khoảng trắng
                new_text = re.sub(r"\s{2,}", " ", new_text).strip()
                # Chặn ảo giác Whisper quay lại
                HALL = ["subscribe cho kênh", "Ghiền Mì Gõ", "La La School",
                        "Cảm ơn các bạn đã theo dõi", "Hãy subscribe", "quảng cáo sau"]
                is_hall = any(h.lower() in new_text.lower() for h in HALL)
                if (new_text and not is_compressed(new_text) and not is_junk(new_text)
                        and not is_hall):
                    report.append((sku, s["id"], txt[:70], new_text[:110]))
                    s["text"] = new_text
                    fixed_here += 1
                else:
                    report.append((sku, s["id"], txt[:70], "[GIỮ NGUYÊN] " + new_text[:60]))
            except Exception as e:
                report.append((sku, s["id"], txt[:70], "[LỖI] " + str(e)[:60]))

        if fixed_here:
            d["full_text"] = " ".join(x["text"] for x in d["segments"])
            with open(jp, "w", encoding="utf-8") as f:
                json.dump(d, f, ensure_ascii=False, indent=2)

            # Rebuild srt
            srt_lines = []
            for i, x in enumerate(d["segments"], 1):
                srt_lines.append(f"{i}\n")
                srt_lines.append(f"{x['start_time']} --> {x['end_time']}\n")
                srt_lines.append(x["text"] + "\n\n")
            with open(PROJECT / "video" / sku / "transcript.srt", "w", encoding="utf-8") as f:
                f.writelines(srt_lines)

            # Rebuild txt
            with open(PROJECT / "video" / sku / "transcript.txt", "w", encoding="utf-8") as f:
                f.write("\n".join(x["text"] for x in d["segments"]) + "\n")

        print(f"[{sku}] khôi phục {fixed_here} segment")
        total_fixed += fixed_here

    print("\n" + "=" * 70)
    print("BÁO CÁO KHÔI PHỤC")
    print("=" * 70)
    for sku, sid, old, new in report:
        print(f"\n[{sku} #{sid}]")
        print(f"   CŨ : {old}")
        print(f"   MỚI: {new}")

    print(f"\nTỔNG SEGMENT ĐÃ KHÔI PHỤC: {total_fixed}")


if __name__ == "__main__":
    main()
