# -*- coding: utf-8 -*-
"""
GIAI ĐOẠN 3B — XỬ LÝ 36 SEGMENT "CỨNG ĐẦU" CÒN LẠI
=====================================================
Các segment này Whisper bóc 2 lần vẫn rớt nguyên âm (tác giả nói quá nhanh).
Kỹ thuật mới: LÀM CHẬM AUDIO (atempo=0.80) trước khi gửi Whisper
-> giúp model bắt kịp từng âm tiết, khôi phục nguyên âm chính xác.
"""

import re
import json
import time
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

HALL = ["subscribe cho kênh", "Ghiền Mì Gõ", "La La School",
        "Cảm ơn các bạn đã theo dõi", "Hãy subscribe", "quảng cáo sau",
        "đăng ký kênh để ủng hộ", "nhớ đăng ký kênh"]


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
print(f"[Keys] {len(KEYS)} hop le")
_i = {"n": 0}


def nk():
    k = KEYS[_i["n"] % len(KEYS)]
    _i["n"] += 1
    return k


def short_ratio(t):
    toks = [x for x in re.split(r"\s+", t.strip()) if x]
    if len(toks) < 6:
        return 0.0
    return sum(1 for x in toks if len(x) <= 2) / len(toks)


def extract_slow(video, start, dur, out):
    """Trích audio + làm chậm 0.8x để Whisper bắt kịp âm tiết."""
    af = "atempo=0.8"
    cmd = [FFMPEG, "-y", "-ss", str(round(start, 3)), "-t", str(round(dur, 3)),
           "-i", str(video), "-vn", "-af", af, "-ac", "1", "-ar", "16000",
           "-b:a", "48k", "-f", "mp3", str(out)]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return out.exists() and out.stat().st_size > 0


def whisper(path, retries=8):
    b = "----WebKitFormBoundaryH2DevSlow"
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
    work = tmp / "slow.mp3"

    fixed = 0
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
            start = float(s.get("start", 0))
            end = float(s.get("end", 0))
            dur = max(1.0, end - start)
            try:
                extract_slow(video, max(0.0, start - 0.8), dur + 1.6, work)
                res = whisper(work)
                new = re.sub(r"\s{2,}", " ", (res.get("text") or "").strip())
                ok = (new and short_ratio(new) < 0.75
                      and not any(h.lower() in new.lower() for h in HALL)
                      and not re.fullmatch(r"(?:à\s*)+", new))
                if ok:
                    print(f"  [OK] {sku} #{s['id']}: {s['text'][:45]} -> {new[:70]}", flush=True)
                    s["text"] = new
                    changed = True
                    fixed += 1
                else:
                    failed.append((sku, s["id"], new[:60]))
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
    print(f"KHOI PHUC THEM: {fixed} segment")
    print(f"Van that bai: {len(failed)} segment")
    if failed:
        out = ROOT / "_audit" / "20260912-full-136-audit" / "stubborn_segments.json"
        with open(out, "w", encoding="utf-8") as f:
            json.dump(failed, f, ensure_ascii=False, indent=2)
        print(f"Danh sach: {out}")


if __name__ == "__main__":
    main()
