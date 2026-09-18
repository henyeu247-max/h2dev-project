# -*- coding: utf-8 -*-
"""
speech_density.py — Do MAT DO LOI NOI that (ASR probe) cho cac SKU nghi van.

Phuong phap (evidence-first, khong suy doan):
  Chia video thanh cac cua so W giay, lay mau deu N cua so.
  Voi moi cua so: trich audio -> goi Groq Whisper -> dem so tu THAT.
  - Cua so co >= MIN_WORDS tu  => co loi giang that.
  - Cua so < MIN_WORDS          => im lang / nhac nen (khong co loi giang).
  => Ty le cua so "co loi giang that" = mat do loi noi.

Dung de phan dinh 2 tinh huong KHAC NHAU ve ban chat:
  (a) video im lang/nhac that su -> phu de chi co annotation => DUNG, khong sua.
  (b) video co loi giang that ma phu de thieu  => LOI THAT, phai boc lai.

Chay: py scripts/speech_density.py VIDEO-f59aa7 --window 180 --samples 5
      py scripts/speech_density.py VIDEO-f59aa7 VIDEO-b559c8 --json report.json
Output (khong --json): in bang + ghi _audit/20260918-full-136-audit/speech_density.json
"""
import argparse
import json
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from transcribe_sku import (GroqKeyManager, GROQ_CONFIG_PATH, call_groq_whisper,
                            extract_audio_chunk, get_video_duration, VIDEO_DIR)  # noqa: E402
from pathlib import Path  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "_audit", "20260918-full-136-audit")
TMP = os.path.join(OUT_DIR, "_asr_probe")

HALL = ["subscribe cho kênh", "Ghiền Mì Gõ", "La La School",
        "Cảm ơn các bạn đã theo dõi", "nhận thêm bản ghi", "nhận thêm nhiều thông tin",
        "bản ghi của mình trong phần bình luận"]

# Nguong am luong: duoi muc nay coi la audio RONG (khong the co loi giang).
# Do that: VIDEO-8e0275 = -91.0 dB (im lang tuyet doi) vs video binh thuong ~ -18.7 dB.
SILENT_MEAN_DB = -60.0

VOWELS = set("aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩị"
             "oòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ")


def volumedetect(media):
    """Do am luong trung binh THUC cua ca file (khong phai suy doan tu file size)."""
    try:
        proc = subprocess.run(
            [r"D:\Linly-Dubbing\bin\ffmpeg.exe", "-hide_banner", "-i", str(media),
             "-vn", "-af", "volumedetect", "-f", "null", "-"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=1800)
        text = proc.stderr.decode("utf-8", "ignore")
    except Exception:  # noqa: BLE001
        return {}
    out = {}
    m = re.search(r"mean_volume:\s*(-?[\d.]+)\s*dB", text)
    if m:
        out["mean_volume_db"] = float(m.group(1))
    m = re.search(r"max_volume:\s*(-?[\d.]+)\s*dB", text)
    if m:
        out["max_volume_db"] = float(m.group(1))
    return out


def looks_like_hallucination(text):
    """Phat hien van ban ẢO GIÁC (khong phai loi giang that):

    1. Cau bi lap lien tuc >= 3 lan (vong lap Whisper tren nhac/im lang).
    2. Rớt nguyên âm nang (vd 'C c b theo d v h g l') — dau hieu model bam
       theo nhac nen/silence ma khong co loi noi that.
    """
    low = text.lower()
    if any(h in low for h in HALL):
        return True
    # 1. lap vong
    words = low.split()
    if len(words) >= 12:
        for n in (3, 4, 5, 6):
            chunk = words[:n]
            if chunk and all(words[i:i + n] == chunk
                             for i in range(0, min(len(words), n * 4), n)):
                return True
    # 2. rớt nguyên âm
    toks = [t for t in re.split(r"\s+", text.strip()) if t]
    if len(toks) >= 8:
        novowel = sum(1 for t in toks if not any(c in VOWELS for c in t.lower()))
        if novowel / len(toks) >= 0.40:
            return True
    return False


def media_path(sku):
    for ext in (".mp4", ".webm"):
        p = Path(VIDEO_DIR) / sku / (sku + ext)
        if p.exists():
            return p
    return None


def probe_window(key_mgr, media, sku, start, dur, idx):
    out = Path(TMP) / ("%s_%03d.mp3" % (sku, idx))
    if not extract_audio_chunk(media, start, dur, out):
        return {"start": start, "error": "extract-fail"}
    try:
        resp = call_groq_whisper(key_mgr, out)
    except Exception as exc:  # noqa: BLE001
        return {"start": start, "error": str(exc)[:120]}
    finally:
        try:
            out.unlink()
        except OSError:
            pass
    segs = resp.get("segments") or []
    kept, dropped = [], 0
    for s in segs:
        t = (s.get("text") or "").strip()
        if not t:
            continue
        if looks_like_hallucination(t):
            dropped += 1
            continue
        kept.append(t)
    text = " ".join(kept)
    words = [w for w in re.split(r"\s+", text) if w]
    return {
        "start": round(start, 1),
        "end": round(start + dur, 1),
        "segments": len(segs),
        "segments_dropped_as_hallucination": dropped,
        "words": len(words),
        "sample": text[:180],
    }


def audit_sku(key_mgr, sku, window, samples):
    media = media_path(sku)
    if not media:
        return sku, {"error": "missing media"}
    total = get_video_duration(media)
    if not total:
        return sku, {"error": "no duration"}
    vol = volumedetect(media)
    if vol.get("mean_volume_db") is not None and vol["mean_volume_db"] <= SILENT_MEAN_DB:
        return sku, {
            "duration_sec": round(total, 1),
            "window_sec": window,
            "audio": vol,
            "verdict": "audio-rong-tuyet-doi",
            "note": ("mean_volume %.1f dB <= %.0f dB: luong audio khong co noi dung. "
                     "Moi phu de/annotation hien co la dung, KHONG boc lai."
                     % (vol["mean_volume_db"], SILENT_MEAN_DB)),
            "windows": [],
            "windows_with_speech": 0,
            "speech_density": 0.0,
        }
    if samples <= 1:
        starts = [max(0.0, (total - window) / 2)]
    elif total <= window:
        # Video ngan hon cua so: probe DUNG 1 lan ca video, khong lap lai cung doan
        # (da gap o VIDEO-2553da khi test 18/09: 3 cua so deu clamp ve 0).
        starts = [0.0]
        window = total
    else:
        max_start = total - window
        starts = [max_start * i / (samples - 1) for i in range(samples)]
    windows = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for res in pool.map(lambda a: probe_window(key_mgr, media, sku, a[1], window, a[0]),
                            list(enumerate(starts))):
            windows.append(res)
    ok = [w for w in windows if not w.get("error")]
    with_speech = [w for w in ok if w.get("words", 0) >= 12]
    return sku, {
        "duration_sec": round(total, 1),
        "window_sec": window,
        "samples": len(windows),
        "audio": vol,
        "windows": windows,
        "windows_with_speech": len(with_speech),
        "speech_density": round(len(with_speech) / len(ok), 2) if ok else None,
        "verdict": ("co-loi-giang-that" if ok and len(with_speech) > len(ok) / 2
                    else ("im-lang-nhac-nen" if ok and not with_speech else "hon-hop")),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("skus", nargs="+")
    ap.add_argument("--window", type=int, default=180)
    ap.add_argument("--samples", type=int, default=5)
    ap.add_argument("--json", default="")
    args = ap.parse_args()

    os.makedirs(TMP, exist_ok=True)
    key_mgr = GroqKeyManager(GROQ_CONFIG_PATH)
    result = {}
    for sku in args.skus:
        name, data = audit_sku(key_mgr, sku, args.window, args.samples)
        result[name] = data
        if data.get("error"):
            print("%-42s ERR %s" % (name, data["error"]))
            continue
        print("%-42s dur=%.0fs | am luong TB=%s dB | cua so co loi giang: %d/%d | mat do=%s -> %s"
              % (name, data["duration_sec"],
                 (data.get("audio") or {}).get("mean_volume_db", "?"),
                 data["windows_with_speech"], data.get("samples", len(data.get("windows") or [])),
                 data["speech_density"], data["verdict"]))
        if data.get("note"):
            print("    NOTE: %s" % data["note"])
        for w in data["windows"]:
            if w.get("error"):
                print("    @%-7s ERR %s" % (w["start"], w["error"]))
            else:
                print("    @%-7s %3ds / %3d tu (bo %d ao giac) | %s"
                      % (w["start"], args.window, w.get("words", 0),
                         w.get("segments_dropped_as_hallucination", 0),
                         w.get("sample", "")[:80]))

    out_path = args.json or os.path.join(OUT_DIR, "speech_density.json")
    merged = {}
    if os.path.exists(out_path):
        try:
            merged = json.load(open(out_path, encoding="utf-8")).get("videos", {})
        except Exception:  # noqa: BLE001
            merged = {}
    merged.update(result)
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump({"schema": "h2dev.speech-density.v1", "window_sec": args.window,
                   "samples": args.samples, "videos": merged}, fh, ensure_ascii=False, indent=1)
    print("\n-> %s" % out_path)


if __name__ == "__main__":
    main()
