#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
transcribe_zoom.py — Bóc tách & phục hồi Timestamp chính xác cho 4 Video Zoom H2DEV
Sử dụng:
  - FFmpeg (tách audio 16kHz mono 32kbps theo chunk 600s / 10 phút)
  - Groq Whisper-large-v3 (API với cơ chế tự động xoay key & User-Agent bypass Cloudflare)
  - Ghép nối và cộng dồn offset thời gian chính xác mili-giây
  - Xuất 3 định dạng: transcript.srt, transcript.json, transcript.txt
"""

import os
import sys
import json
import time
import subprocess
import threading
from pathlib import Path
import urllib.request
import urllib.error

# Force UTF-8 on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_DIR = Path(__file__).resolve().parent.parent
VIDEO_DIR = PROJECT_DIR / "video"
LINLY_DIR = Path("D:/Linly-Dubbing")
FFMPEG_CMD = str(LINLY_DIR / "bin" / "ffmpeg.exe") if (LINLY_DIR / "bin" / "ffmpeg.exe").exists() else "ffmpeg"
FFPROBE_CMD = str(LINLY_DIR / "bin" / "ffprobe.exe") if (LINLY_DIR / "bin" / "ffprobe.exe").exists() else "ffprobe"
GROQ_CONFIG_PATH = LINLY_DIR / "config" / "groq_config.json"

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

ZOOM_SKUS = [
    "ZOOM-01-Nen-tang-moi-truong",
    "ZOOM-02-Chien-luoc-kenh-san-xuat",
    "ZOOM-03-Quy-trinh-tool-toi-uu",
    "ZOOM-04-Adsense-khang-loi"
]


class GroqKeyManager:
    def __init__(self, config_path: Path):
        self.lock = threading.Lock()
        self.valid_keys = []
        self.index = 0
        self.rate_limited_until = {}
        self.invalid_keys = set()
        
        raw_keys = []
        if config_path.exists():
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                    raw_keys = [k["key"] for k in cfg.get("groq_api_keys", []) if k.get("key")]
            except Exception as e:
                print(f"[Cảnh báo] Không thể đọc {config_path}: {e}")

        print(f"[Khởi tạo] Đang kiểm tra {len(raw_keys)} Groq API Keys...")
        for k in raw_keys:
            if self._test_key(k):
                self.valid_keys.append(k)
        
        print(f"[Khởi tạo] Hoàn tất: {len(self.valid_keys)}/{len(raw_keys)} Keys hoạt động tốt.")
        if not self.valid_keys:
            raise RuntimeError("Không tìm thấy Groq API Key nào còn hiệu lực!")

    def _test_key(self, key: str) -> bool:
        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {key}", "User-Agent": USER_AGENT}
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status == 200
        except Exception:
            return False

    def get_key(self) -> str:
        with self.lock:
            now = time.time()
            active = [k for k in self.valid_keys if k not in self.invalid_keys]
            if not active:
                raise RuntimeError("Tất cả Groq API keys đều đã hết hạn hoặc bị lỗi!")
            
            for _ in range(len(active)):
                key = active[self.index % len(active)]
                self.index = (self.index + 1) % len(active)
                if key in self.rate_limited_until and self.rate_limited_until[key] > now:
                    continue
                return key
            # Nếu tất cả đang bị rate-limited, đợi một chút
            time.sleep(2)
            return active[0]

    def mark_rate_limited(self, key: str, wait_seconds: int = 15):
        with self.lock:
            self.rate_limited_until[key] = time.time() + wait_seconds

    def mark_invalid(self, key: str):
        with self.lock:
            self.invalid_keys.add(key)
            print(f"[Key Manager] Đã loại bỏ key lỗi: {key[:8]}...")


def get_video_duration(video_file: Path) -> float:
    cmd = [
        FFPROBE_CMD,
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(video_file)
    ]
    try:
        out = subprocess.check_output(cmd).decode().strip()
        return float(out)
    except Exception as e:
        print(f"Lỗi lấy thời lượng file {video_file}: {e}")
        return 0.0


def extract_audio_chunk(video_file: Path, start_sec: float, dur_sec: float, output_mp3: Path) -> bool:
    cmd = [
        FFMPEG_CMD,
        "-y",
        "-ss", str(round(start_sec, 2)),
        "-t", str(round(dur_sec, 2)),
        "-i", str(video_file),
        "-vn",
        "-ac", "1",
        "-ar", "16000",
        "-b:a", "32k",
        "-f", "mp3",
        str(output_mp3)
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return output_mp3.exists() and output_mp3.stat().st_size > 0
    except subprocess.CalledProcessError as e:
        print(f"Lỗi tách audio chunk ({start_sec}s -> {dur_sec}s): {e}")
        return False


def call_groq_whisper(key_mgr: GroqKeyManager, audio_path: Path, max_retries: int = 10) -> dict:
    boundary = "----WebKitFormBoundaryGroqWhisperZoom"
    with open(audio_path, "rb") as f:
        audio_data = f.read()

    filename = audio_path.name
    parts = [
        f'--{boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n'.encode("utf-8"),
        f'--{boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n'.encode("utf-8"),
        f'--{boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nvi\r\n'.encode("utf-8"),
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode("utf-8"),
        audio_data,
        f'\r\n--{boundary}--\r\n'.encode("utf-8")
    ]
    body = b"".join(parts)

    for attempt in range(max_retries):
        key = key_mgr.get_key()
        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "User-Agent": USER_AGENT
            },
            data=body,
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                raw_json = resp.read().decode("utf-8")
                return json.loads(raw_json)
        except urllib.error.HTTPError as e:
            if e.code == 401:
                key_mgr.mark_invalid(key)
                continue
            elif e.code == 429:
                key_mgr.mark_rate_limited(key, wait_seconds=15)
                time.sleep(2 + attempt * 0.5)
                continue
            elif e.code in (500, 502, 503, 504):
                time.sleep(2)
                continue
            else:
                time.sleep(1)
        except Exception as e:
            time.sleep(1)

    raise RuntimeError(f"Gọi Whisper API thất bại sau {max_retries} lần thử cho {audio_path.name}")


def format_srt_time(seconds: float) -> str:
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    if millis >= 1000:
        millis = 999
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"


def process_zoom_video(key_mgr: GroqKeyManager, sku: str, chunk_size: float = 600.0, force: bool = False):
    folder = VIDEO_DIR / sku
    if not folder.exists():
        print(f"[Lỗi] Không tìm thấy thư mục {folder}")
        return False

    # Tìm file webm
    webm_files = list(folder.glob("*.webm"))
    if not webm_files:
        print(f"[Lỗi] Không tìm thấy file .webm trong {folder}")
        return False
    video_file = webm_files[0]

    srt_path = folder / "transcript.srt"
    json_path = folder / "transcript.json"
    txt_path = folder / "transcript.txt"

    if not force and json_path.exists() and srt_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as jf:
                data = json.load(jf)
                if data.get("segments") and len(data["segments"]) > 10:
                    print(f"[{sku}] Đã có transcript.json với {len(data['segments'])} segments chuẩn xác. Bỏ qua.")
                    return True
        except Exception:
            pass

    total_dur = get_video_duration(video_file)
    print(f"\n[{sku}] Bắt đầu xử lý: {video_file.name} | Thời lượng: {total_dur:.2f}s ({total_dur/60:.2f} phút)")

    # Tính toán số chunk
    chunks = []
    curr = 0.0
    while curr < total_dur:
        dur = min(chunk_size, total_dur - curr)
        chunks.append((curr, dur))
        curr += dur

    print(f"[{sku}] Chia thành {len(chunks)} chunks (mỗi chunk ~{chunk_size/60:.0f} phút)")

    all_segments = []
    full_texts = []
    temp_dir = folder / "_temp_transcribe"
    temp_dir.mkdir(exist_ok=True)

    t0 = time.time()
    for idx, (c_start, c_dur) in enumerate(chunks, 1):
        temp_mp3 = temp_dir / f"chunk_{idx:03d}.mp3"
        print(f"  -> Chunk {idx}/{len(chunks)}: {c_start:.1f}s -> {c_start+c_dur:.1f}s ...", end=" ", flush=True)
        
        ok = extract_audio_chunk(video_file, c_start, c_dur, temp_mp3)
        if not ok:
            print("LỖI TÁCH AUDIO!")
            return False

        try:
            t_chunk_start = time.time()
            res = call_groq_whisper(key_mgr, temp_mp3)
            t_chunk_elapsed = time.time() - t_chunk_start
            
            c_segs = res.get("segments", [])
            c_text = res.get("text", "").strip()
            if c_text:
                full_texts.append(c_text)

            for s in c_segs:
                seg_start = s.get("start", 0.0) + c_start
                seg_end = s.get("end", 0.0) + c_start
                seg_text = s.get("text", "").strip()
                if seg_text:
                    all_segments.append({
                        "start": seg_start,
                        "end": seg_end,
                        "text": seg_text
                    })
            print(f"OK ({len(c_segs)} câu, {t_chunk_elapsed:.1f}s)")
        except Exception as e:
            print(f"LỖI WHISPER: {e}")
            return False
        finally:
            if temp_mp3.exists():
                try:
                    temp_mp3.unlink()
                except Exception:
                    pass
        time.sleep(0.5)

    # Dọn dẹp thư mục tạm
    try:
        temp_dir.rmdir()
    except Exception:
        pass

    # Sắp xếp lại segments theo start time
    all_segments.sort(key=lambda x: x["start"])

    # Xây dựng structured_segments
    structured_segments = []
    srt_lines = []
    txt_lines = []

    for i, s in enumerate(all_segments, 1):
        start_sec = round(s["start"], 2)
        end_sec = round(max(s["end"], start_sec + 0.1), 2)
        text = s["text"]
        s_start = format_srt_time(start_sec)
        s_end = format_srt_time(end_sec)

        structured_segments.append({
            "id": i,
            "start": start_sec,
            "end": end_sec,
            "start_time": s_start,
            "end_time": s_end,
            "text": text
        })

        srt_lines.append(f"{i}\n{s_start} --> {s_end}\n{text}\n")
        txt_lines.append(f"[{s_start} - {s_end}] {text}")

    full_text_merged = " ".join(full_texts)

    # 1. Ghi transcript.srt
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(srt_lines).strip() + "\n")

    # 2. Ghi transcript.json
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "sku": sku,
            "duration": total_dur,
            "language": "Vietnamese",
            "full_text": full_text_merged,
            "segments": structured_segments
        }, f, ensure_ascii=False, indent=2)

    # 3. Ghi transcript.txt (vừa có timestamp để txtFallback parse, vừa đọc được trọn vẹn)
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(txt_lines) + "\n")

    elapsed_total = time.time() - t0
    print(f"[{sku}] THÀNH CÔNG! Đã xuất {len(structured_segments)} segments trong {elapsed_total:.1f}s.")
    return True


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Bóc tách timestamp chính xác cho 4 Video Zoom H2DEV")
    parser.add_argument("--sku", type=str, help="Chạy riêng cho 1 SKU (vd: ZOOM-01-Nen-tang-moi-truong)")
    parser.add_argument("--chunk-size", type=float, default=600.0, help="Độ dài mỗi chunk (giây, mặc định: 600s = 10 phút)")
    parser.add_argument("--force", action="store_true", help="Ghi đè phụ đề đã có")
    args = parser.parse_args()

    key_mgr = GroqKeyManager(GROQ_CONFIG_PATH)

    target_skus = [args.sku] if args.sku else ZOOM_SKUS
    print(f"\n=======================================================")
    print(f"KHỞI ĐỘNG PIPELINE BÓC TÁCH ZOOM TRANSCRIPTS: {len(target_skus)} VIDEOS")
    print(f"=======================================================\n")

    success_count = 0
    t_start = time.time()

    for sku in target_skus:
        ok = process_zoom_video(key_mgr, sku, chunk_size=args.chunk_size, force=args.force)
        if ok:
            success_count += 1
        else:
            print(f"[THẤT BÀI] Không thể hoàn thành bóc tách cho {sku}")
            break

    total_time = time.time() - t_start
    print(f"\n=======================================================")
    print(f"TỔNG KẾT: {success_count}/{len(target_skus)} Videos hoàn thành trong {total_time:.1f}s ({total_time/60:.2f} phút)")
    print(f"=======================================================\n")


if __name__ == "__main__":
    main()
