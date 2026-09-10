#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
transcribe_videos.py — Tự động bóc tách phụ đề & kịch bản 129 video khóa học H2DEV
Sử dụng đa luồng (Multi-threading) + Xoay vòng 14 Groq API keys + FFmpeg từ Linly-Dubbing.

Output cho từng video (H2DEV-Project/video/VIDEO-<sku>/):
  - transcript.srt   (Phụ đề chuẩn SubRip / YouTube)
  - transcript.json  (Dữ liệu cấu trúc timeline chi tiết)
  - transcript.txt   (Văn bản liền mạch)
"""

import os
import sys
import json
import time
import subprocess
import threading
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.request
import urllib.error

# Force UTF-8 on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


# Thiết lập đường dẫn gốc
PROJECT_DIR = Path(__file__).resolve().parent.parent
VIDEO_DIR = PROJECT_DIR / "video"
LINLY_DIR = Path("D:/Linly-Dubbing")
FFMPEG_BIN = LINLY_DIR / "bin" / "ffmpeg.exe"
FFPROBE_BIN = LINLY_DIR / "bin" / "ffprobe.exe"
GROQ_CONFIG_PATH = LINLY_DIR / "config" / "groq_config.json"
# 31/08/2026: key proxy 9router từng hardcode tại đây → đã REDACT.
# Dự án KHÔNG giữ key. DUB_PROXY_KEY lấy từ biến môi trường do omp/CLI cấu hình.
DUB_PROXY_KEY = os.environ.get("DUB_PROXY_KEY", "")
# Kiểm tra công cụ FFmpeg
if not FFMPEG_BIN.exists():
    FFMPEG_CMD = "ffmpeg"
    FFPROBE_CMD = "ffprobe"
else:
    FFMPEG_CMD = str(FFMPEG_BIN)
    FFPROBE_CMD = str(FFPROBE_BIN)

# Class quản lý xoay vòng Groq Keys thread-safe
class ThreadSafeGroqKeyManager:
    def __init__(self, config_path):
        self.lock = threading.Lock()
        self.keys = []
        self.index = 0
        self.rate_limited_until = {}
        self.invalid_keys = set()
        
        if config_path.exists():
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.keys = [k["key"] for k in data.get("groq_api_keys", []) if k.get("key")]
            except Exception as e:
                print(f"[Cảnh báo] Không thể đọc {config_path}: {e}")
        
        # Luôn thêm 9router-proxy vào danh sách dự phòng
        self.keys.append("9router-proxy")
        print(f"[Khởi tạo] Đã nạp thành công {len(self.keys) - 1} Groq API Keys + 1 9router Proxy dự phòng.")

    def get_key(self):
        with self.lock:
            now = time.time()
            valid_keys = [k for k in self.keys if k not in self.invalid_keys]
            if not valid_keys:
                return "9router-proxy"
            for _ in range(len(valid_keys)):
                key = valid_keys[self.index % len(valid_keys)]
                self.index = (self.index + 1) % len(valid_keys)
                if key in self.rate_limited_until and self.rate_limited_until[key] > now:
                    continue
                return key
            return valid_keys[0]

    def mark_rate_limited(self, key, wait_seconds=10):
        with self.lock:
            self.rate_limited_until[key] = time.time() + wait_seconds

    def mark_invalid(self, key):
        with self.lock:
            if key != "9router-proxy":
                self.invalid_keys.add(key)


key_manager = ThreadSafeGroqKeyManager(GROQ_CONFIG_PATH)


def format_timestamp_srt(seconds: float) -> str:
    """Chuyển đổi giây thành format SRT: 00:00:00,000"""
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    if millis >= 1000:
        millis = 999
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"


def extract_audio(video_path: Path, output_mp3: Path) -> bool:
    """Tách âm thanh từ video sang MP3 32kbps Mono siêu nhẹ bằng FFmpeg"""
    cmd = [
        FFMPEG_CMD,
        "-y",
        "-i", str(video_path),
        "-vn",
        "-ac", "1",
        "-ar", "16000",
        "-b:a", "32k",
        "-f", "mp3",
        str(output_mp3)
    ]
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return output_mp3.exists() and output_mp3.stat().st_size > 0
    except subprocess.CalledProcessError as e:
        print(f"Lỗi tách audio từ {video_path.name}: {e.stderr.decode('utf-8', errors='ignore')[:200]}")
        return False


def call_groq_whisper(audio_path: Path, max_retries: int = 15) -> dict:
    """Gọi Groq Whisper API với cơ chế tự động xoay key, loại key lỗi và retry"""
    boundary = "----WebKitFormBoundaryGroqWhisperMultiThread"
    
    with open(audio_path, "rb") as f:
        audio_data = f.read()

    filename = audio_path.name
    
    # Tạo multipart/form-data payload cho direct groq
    direct_parts = [
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"model\"\r\n\r\nwhisper-large-v3\r\n".encode("utf-8"),
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"response_format\"\r\n\r\nverbose_json\r\n".encode("utf-8"),
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"language\"\r\n\r\nvi\r\n".encode("utf-8"),
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\nContent-Type: audio/mpeg\r\n\r\n".encode("utf-8"),
        audio_data,
        f"\r\n--{boundary}--\r\n".encode("utf-8")
    ]
    direct_body = b"".join(direct_parts)

    # Payload cho 9router
    proxy_parts = [
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"model\"\r\n\r\ngroq/whisper-large-v3\r\n".encode("utf-8"),
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"response_format\"\r\n\r\nverbose_json\r\n".encode("utf-8"),
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"language\"\r\n\r\nvi\r\n".encode("utf-8"),
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\nContent-Type: audio/mpeg\r\n\r\n".encode("utf-8"),
        audio_data,
        f"\r\n--{boundary}--\r\n".encode("utf-8")
    ]
    proxy_body = b"".join(proxy_parts)

    for attempt in range(max_retries):
        key = key_manager.get_key()
        if key == "9router-proxy":
            if not DUB_PROXY_KEY:
                raise RuntimeError(
                    "Thiếu DUB_PROXY_KEY. Đặt biến môi trường "
                    "DUB_PROXY_KEY=sk-... trong shell/profile trước khi chạy. "
                    "Dự án KHÔNG đọc .env."
                )
            url = "http://127.0.0.1:20128/v1/audio/transcriptions"
            auth_header = "Bearer " + DUB_PROXY_KEY
            req_body = proxy_body
        else:
            url = "https://api.groq.com/openai/v1/audio/transcriptions"
            auth_header = f"Bearer {key}"
            req_body = direct_body

        req = urllib.request.Request(
            url,
            headers={
                "Authorization": auth_header,
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "User-Agent": "H2DEV-Dubber/1.0"
            },
            data=req_body,
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                raw_json = resp.read().decode("utf-8")
                return json.loads(raw_json)
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8", errors="ignore")
            if e.code == 401:
                key_manager.mark_invalid(key)
                continue
            elif e.code == 429:
                key_manager.mark_rate_limited(key, wait_seconds=15)
                time.sleep(1 + attempt * 0.3)
                continue
            elif e.code in (500, 502, 503, 504):
                time.sleep(2)
                continue
            else:
                time.sleep(1)
        except Exception as e:
            time.sleep(1)

    raise RuntimeError(f"Thất bại sau {max_retries} lần thử cho {audio_path.name}")



def process_single_video(video_folder: Path, force: bool = False) -> tuple:
    """Xử lý trọn gói 1 video: Tách audio -> Gửi Whisper -> Lưu .srt, .json, .txt"""
    sku = video_folder.name
    mp4_file = video_folder / f"{sku}.mp4"
    
    if not mp4_file.exists():
        mp4_list = list(video_folder.glob("*.mp4"))
        if mp4_list:
            mp4_file = mp4_list[0]
        else:
            return sku, False, "Không tìm thấy file .mp4"

    srt_path = video_folder / "transcript.srt"
    json_path = video_folder / "transcript.json"
    txt_path = video_folder / "transcript.txt"

    if not force and srt_path.exists() and json_path.exists() and srt_path.stat().st_size > 0:
        return sku, True, "Đã có sẵn phụ đề (Bỏ qua)"

    temp_mp3 = video_folder / f"_temp_{sku}.mp3"
    t_start = time.time()
    
    try:
        # Bước 1: Tách audio
        ok = extract_audio(mp4_file, temp_mp3)
        if not ok:
            return sku, False, "Lỗi tách audio bằng FFmpeg"

        # Bước 2: Gọi Groq Whisper
        res = call_groq_whisper(temp_mp3)
        
        segments = res.get("segments", [])
        full_text = res.get("text", "").strip()

        # Bước 3: Xuất file .srt
        srt_lines = []
        structured_segments = []

        for idx, seg in enumerate(segments, 1):
            start = seg.get("start", 0.0)
            end = seg.get("end", 0.0)
            text = seg.get("text", "").strip()
            
            s_start = format_timestamp_srt(start)
            s_end = format_timestamp_srt(end)
            
            srt_lines.append(f"{idx}\n{s_start} --> {s_end}\n{text}\n")
            
            structured_segments.append({
                "id": idx,
                "start": round(start, 2),
                "end": round(end, 2),
                "start_time": s_start,
                "end_time": s_end,
                "text": text
            })

        with open(srt_path, "w", encoding="utf-8") as f:
            f.write("\n".join(srt_lines).strip() + "\n")

        # Bước 4: Xuất file .json
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump({
                "sku": sku,
                "duration": res.get("duration", 0),
                "language": res.get("language", "vi"),
                "full_text": full_text,
                "segments": structured_segments
            }, f, ensure_ascii=False, indent=2)

        # Bước 5: Xuất file .txt
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(full_text + "\n")

        elapsed = round(time.time() - t_start, 1)
        return sku, True, f"Xong trong {elapsed}s ({len(segments)} câu)"

    except Exception as e:
        return sku, False, str(e)
    finally:
        if temp_mp3.exists():
            try:
                temp_mp3.unlink()
            except Exception:
                pass


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Trích xuất phụ đề 129 video H2DEV qua Groq Whisper đa luồng.")
    parser.add_argument("--sku", type=str, help="Chạy thử nghiệm cho 1 video SKU cụ thể (vd: VIDEO-DD983D)")
    parser.add_argument("--workers", type=int, default=6, help="Số luồng song song (mặc định: 6)")
    parser.add_argument("--force", action="store_true", help="Ghi đè phụ đề đã có")
    args = parser.parse_args()

    if args.sku:
        target_folder = VIDEO_DIR / args.sku
        if not target_folder.exists():
            print(f"[Lỗi] Không tìm thấy thư mục: {target_folder}")
            sys.exit(1)
        video_folders = [target_folder]
    else:
        video_folders = sorted([d for d in VIDEO_DIR.iterdir() if d.is_dir() and d.name.startswith("VIDEO-")])

    total = len(video_folders)
    print("=" * 70)
    print(f"🚀 BẮT ĐẦU TRÍCH XUẤT PHỤ ĐỀ CHO {total} VIDEO")
    print(f"⚙️ Cấu hình: {args.workers} luồng song song | {len(key_manager.keys)} Groq Keys")
    print("=" * 70)

    start_all = time.time()
    success_count = 0
    fail_count = 0

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(process_single_video, folder, args.force): folder for folder in video_folders}
        
        idx = 0
        for future in as_completed(futures):
            idx += 1
            sku, success, msg = future.result()
            if success:
                success_count += 1
                status_icon = "✅"
            else:
                fail_count += 1
                status_icon = "❌"
            
            print(f"[{idx:03d}/{total:03d}] {status_icon} {sku}: {msg}")

    total_time = round(time.time() - start_all, 1)
    print("=" * 70)
    print(f"🎉 HOÀN TẤT TRONG {total_time}s | Thành công: {success_count}/{total} | Thất bại: {fail_count}")
    print("=" * 70)


if __name__ == "__main__":
    main()
