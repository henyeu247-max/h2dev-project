# -*- coding: utf-8 -*-
"""
BOC LAI PHU DE VUNG HONG — H2DEV (khong bia)
===========================================
2 video co vung transcript hong (lo hong lon / duoi khong co segment):
  - VIDEO-f59aa7: vung 1723s -> 2588s
  - VIDEO-c1bd51: vung  925s -> 981s
Cat dung vung audio bang ffmpeg -> bóc lai bang faster-whisper ->
xuat JSON de NGUOI doi chieu truoc khi ghep vao transcript.

Chay: python scripts/recover_broken_regions.py
Xuat: _audit/20260917-recover-regions/<sku>.json  (+ .txt de doc bang mat)
"""
import os
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VID = ROOT / "video"
FFMPEG = r"D:\Linly-Dubbing\bin\ffmpeg.exe"
OUT = ROOT / "_audit" / "20260917-recover-regions"
OUT.mkdir(parents=True, exist_ok=True)

JOBS = {
    "VIDEO-f59aa7": (1720.0, 2588.5),
    "VIDEO-c1bd51": (922.0, 981.5),
}


def cut_audio(src, start, end, dst):
    # seek SAU -i (accurate) + -t = do dai chinh xac (tranh loi -to truoc -i cat sai)
    subprocess.run([FFMPEG, "-y", "-i", str(src),
                    "-ss", f"{start}", "-t", f"{end - start}",
                    "-vn", "-ac", "1", "-ar", "16000",
                    "-c:a", "pcm_s16le", str(dst)],
                   capture_output=True, text=True, check=True)


def main():
    from faster_whisper import WhisperModel
    model = WhisperModel("small", device="cpu", compute_type="int8")
    for sku, (a, b) in JOBS.items():
        d = VID / sku
        media = [f for f in os.listdir(d) if f.lower().endswith((".mp4", ".webm"))][0]
        wav = OUT / f"{sku}.wav"
        print(f"[{sku}] cat audio {a}-{b}s ...")
        cut_audio(d / media, a, b, wav)
        print(f"[{sku}] transcribe ...")
        # KHONG dung initial_prompt: model se 'doc lai' prompt thanh phu de ao giac
        segs, info = model.transcribe(
            str(wav), language="vi", temperature=0.0, beam_size=5,
            vad_filter=True,
            condition_on_previous_text=False,
        )
        rows = []
        for s in segs:
            rows.append({"start": round(s.start + a, 2), "end": round(s.end + a, 2),
                         "text": s.text.strip()})
        (OUT / f"{sku}.json").write_text(json.dumps(
            {"sku": sku, "region": [a, b], "language": info.language,
             "duration_audio": info.duration, "segments": rows},
            ensure_ascii=False, indent=2), encoding="utf-8")
        (OUT / f"{sku}.txt").write_text(
            "".join(f"[{r['start']:.1f}-{r['end']:.1f}] {r['text']}\n" for r in rows),
            encoding="utf-8")
        print(f"[{sku}] {len(rows)} segment -> {OUT/sku}.json")


if __name__ == "__main__":
    main()
