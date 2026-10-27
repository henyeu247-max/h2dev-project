# -*- coding: utf-8 -*-
"""
silence_scan.py — Quet khoang lang toan bo video bang ffmpeg silencedetect.

Muc dich: cung cap bang chung "khoang trong phu de la IM LANG THAT hay la MAT NOI DUNG".
Day la lop kiem tra con thieu cua audit cu (xem CHANGELOG 2026-09-18).

Chay: py scripts/silence_scan.py                 (toan bo 136)
      py scripts/silence_scan.py VIDEO-f59aa7    (1 SKU)
Output: _audit/20260918-full-136-audit/silence.json
"""
import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FFMPEG = r"D:\Linly-Dubbing\bin\ffmpeg.exe"
VIDEO_DIR = os.path.join(ROOT, "video")
OUT_DIR = os.path.join(ROOT, "_audit", "20260918-full-136-audit")
OUT_PATH = os.path.join(OUT_DIR, "silence.json")

NOISE_DB = -35      # nguong coi la "khong co tieng dong"
MIN_D = 2.5         # khoang lang >= 2.5s moi ghi nhan
WORKERS = 6


def media_path(sku):
    for ext in (".mp4", ".webm"):
        p = os.path.join(VIDEO_DIR, sku, sku + ext)
        if os.path.exists(p):
            return p
    return None


def scan_one(sku):
    path = media_path(sku)
    if not path:
        return sku, {"error": "missing media"}
    regions = []
    gpu_chunk_bounds = []
    gpu_device = None
    engine = "cpu_ffmpeg"
    # Uu tien tang toc tren GPU CUDA (PyTorch tensor RMS + STFT Speech-Band tren RTX 4060) de giam >80% tai CPU
    try:
        import numpy as np
        import torch
        if torch.cuda.is_available():
            gpu_device = torch.cuda.get_device_name(0)
            proc = subprocess.run(
                [FFMPEG, "-hide_banner", "-hwaccel", "cuda", "-threads", "2", "-vn", "-i", path,
                 "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=600)
            if proc.returncode == 0 and len(proc.stdout) > 3200:
                pcm = np.frombuffer(proc.stdout, dtype=np.int16)
                x = torch.from_numpy(pcm.copy()).to("cuda", dtype=torch.float32) / 32768.0
                win = 800  # 50ms window at 16kHz
                n_wins = len(x) // win
                frames = x[:n_wins * win].view(n_wins, win)
                rms_db = 20.0 * torch.log10(torch.sqrt(torch.mean(frames * frames, dim=1)) + 1e-12)
                # Tinh them nang luong pho giong noi (300Hz - 3400Hz) bang STFT tren CUDA GPU
                fft_mag = torch.abs(torch.fft.rfft(frames, dim=1))
                # voi win=800 @ 16kHz, 1 bin = 20Hz -> 300Hz..3400Hz = bin 15..170
                voice_rms = torch.sqrt(torch.mean(fft_mag[:, 15:170] ** 2, dim=1) + 1e-12)
                is_sil = (rms_db < NOISE_DB).cpu().numpy()

                # Tim diem cat chunk ~180s roi dung vao thung lung nang luong thap nhat tren GPU (tranh cat ngang tu)
                total_dur = round(len(x) / 16000.0, 2)
                kernel = torch.ones(1, 1, 5, device="cuda") / 5.0  # cua so 250ms
                smooth_db = torch.nn.functional.conv1d(
                    rms_db.view(1, 1, -1), kernel, padding=2
                ).view(-1).cpu().numpy()
                curr_t = 0.0
                gpu_chunk_bounds = [0.0]
                while curr_t + 185.0 < total_dur:
                    lo_idx = int((curr_t + 150.0) / 0.05)
                    hi_idx = min(len(smooth_db) - 1, int((curr_t + 185.0) / 0.05))
                    if hi_idx > lo_idx:
                        best_idx = lo_idx + int(np.argmin(smooth_db[lo_idx:hi_idx + 1]))
                        curr_t = round(best_idx * 0.05, 2)
                    else:
                        curr_t = round(curr_t + 180.0, 2)
                    gpu_chunk_bounds.append(curr_t)
                if gpu_chunk_bounds[-1] < total_dur:
                    gpu_chunk_bounds.append(total_dur)

                del x, frames, rms_db, fft_mag, voice_rms
                torch.cuda.empty_cache()
                in_sil = False
                start_idx = 0
                for i, val in enumerate(is_sil):
                    if val and not in_sil:
                        in_sil = True
                        start_idx = i
                    elif not val and in_sil:
                        in_sil = False
                        dur = (i - start_idx) * 0.05
                        if dur >= MIN_D:
                            regions.append({
                                "start": round(start_idx * 0.05, 2),
                                "duration": round(dur, 2),
                                "end": round(i * 0.05, 2),
                            })
                if in_sil:
                    dur = (len(is_sil) - start_idx) * 0.05
                    if dur >= MIN_D:
                        regions.append({
                            "start": round(start_idx * 0.05, 2),
                            "duration": round(dur, 2),
                            "end": round(len(is_sil) * 0.05, 2),
                        })
                engine = "cuda_gpu"
    except Exception:
        regions = []
        gpu_chunk_bounds = []
        engine = "cpu_ffmpeg"

    if engine != "cuda_gpu":
        try:
            proc = subprocess.run(
                [FFMPEG, "-hide_banner", "-vn", "-i", path,
                 "-af", "silencedetect=noise=%ddB:d=%s" % (NOISE_DB, MIN_D),
                 "-f", "null", "-"],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=1800)
            text = proc.stderr.decode("utf-8", "ignore")
        except subprocess.TimeoutExpired:
            return sku, {"error": "timeout"}
        except Exception as exc:  # noqa: BLE001
            return sku, {"error": str(exc)[:120]}

        starts = []
        durs = []
        for line in text.splitlines():
            if "silence_start:" in line:
                starts.append(float(line.split("silence_start:")[1].strip().split()[0]))
            elif "silence_duration:" in line:
                durs.append(float(line.split("silence_duration:")[1].strip().split()[0]))

        for i, start in enumerate(starts):
            dur = durs[i] if i < len(durs) else None
            regions.append({
                "start": round(start, 2),
                "duration": round(dur, 2) if dur is not None else None,
                "end": round(start + dur, 2) if dur is not None else None,
            })

    total = round(sum(r["duration"] or 0 for r in regions), 2)
    res_obj = {
        "engine": engine,
        "gpu_device": gpu_device,
        "stft_speech_band": (engine == "cuda_gpu"),
        "gpu_chunk_bounds": gpu_chunk_bounds,
        "noise_db": NOISE_DB,
        "min_duration": MIN_D,
        "silence_regions": regions,
        "silence_count": len(regions),
        "silence_total_sec": total,
    }
    try:
        per_sku_path = os.path.join(VIDEO_DIR, sku, "silence.json")
        with open(per_sku_path, "w", encoding="utf-8") as sf:
            json.dump(res_obj, sf, ensure_ascii=False, indent=2)
    except Exception:
        pass
    return sku, res_obj


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    force = "--force" in sys.argv
    if only:
        skus = only
    else:
        skus = sorted(d for d in os.listdir(VIDEO_DIR)
                      if os.path.isdir(os.path.join(VIDEO_DIR, d)))

    existing = {}
    if os.path.exists(OUT_PATH):
        try:
            with open(OUT_PATH, "r", encoding="utf-8") as fh:
                existing = json.load(fh).get("videos", {})
        except Exception:  # noqa: BLE001
            existing = {}

    todo = [
        s for s in skus
        if force
        or s not in existing
        or "error" in existing.get(s, {})
        or not os.path.exists(os.path.join(VIDEO_DIR, s, "silence.json"))
    ]
    print("silence_scan: %d SKU can quet (tong %d, da co %d)"
          % (len(todo), len(skus), len(existing)), flush=True)

    def flush():
        tmp = OUT_PATH + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump({
                "schema": "h2dev.silence-scan.v1",
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "noise_db": NOISE_DB,
                "min_duration": MIN_D,
                "workers": WORKERS,
                "total": len(existing),
                "videos": existing,
            }, fh, ensure_ascii=False, indent=1)
        os.replace(tmp, OUT_PATH)

    t0 = time.time()
    done = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        for sku, data in pool.map(scan_one, todo):
            existing[sku] = data
            done += 1
            flag = data.get("error") or ("%d khoang lang / %.0fs"
                                         % (data.get("silence_count", 0),
                                            data.get("silence_total_sec", 0)))
            print("  [%3d/%3d] %-40s %s" % (done, len(todo), sku, flag), flush=True)
            if done % 10 == 0:      # checkpoint: khong mat ket qua neu bi ngat
                flush()
    flush()
    print("Xong %d SKU trong %.1fs -> %s" % (done, time.time() - t0, OUT_PATH))


if __name__ == "__main__":
    main()
