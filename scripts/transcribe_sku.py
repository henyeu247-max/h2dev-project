#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
transcribe_sku.py — Bóc tách & phục hồi phụ đề chính xác cho bất kỳ video nào trong H2DEV
Sử dụng:
  - FFmpeg từ D:/Linly-Dubbing/bin/ffmpeg.exe
  - Groq Whisper-large-v3 API (từ D:/Linly-Dubbing/config/groq_config.json)
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

# Prompt ngữ cảnh chuyên ngành — giúp Whisper bóc đúng thuật ngữ & hạn chế rớt nguyên âm.
# LƯU Ý: KHÔNG đưa các từ khoá kiểu "đăng ký kênh/like/share" vào prompt, vì model có thể
# "đọc lại" prompt thành phụ đề ảo giác.
VI_PROMPT = (
    "Đây là bản ghi video hướng dẫn xây kênh YouTube faceless bằng tiếng Việt. "
    "Thuật ngữ thường gặp: kênh, ngách, key, view, prompt, kịch bản, thumbnail, "
    "CapCut, AdSense, Gmail, proxy, GPM, VOTP, ngâm kênh, bán content, reup, "
    "doanh thu, RPM, AVD, đề xuất, đối thủ, tool, ChatGPT, Gemini, video, nội dung."
)

# Mẫu ảo giác Whisper hay sinh trong khoảng lặng / nhạc nền.
HALL_PATTERNS = [
    "la la school", "ghiền mì gõ", "subscribe cho kênh", "hãy subscribe",
    "cảm ơn các bạn đã theo dõi", "quảng cáo sau", "đăng ký kênh để ủng hộ",
    "nhớ đăng ký kênh", "like và chia sẻ", "like và share",
    "nhận thêm bản ghi", "nhận thêm nhiều thông tin", "nhận thêm thông tin",
    "bản ghi của mình trong phần bình luận", "các mục tiêu của youtube",
    "nhớ like, share và đăng ký kênh", "các bạn có thể nhận thêm",
    "bản ghi video hướng dẫn xây kênh", "thuật ngữ thường gặp",
    "các bạn có thể xem video này trên kênh",
]

VOWELS = set("aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩị"
             "oòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ")


def is_hallucination(text: str) -> bool:
    low = text.lower()
    if any(h in low for h in HALL_PATTERNS):
        return True
    toks = low.split()
    if len(toks) > 8:  # lặp lại y hệt nửa câu -> ảo giác
        half = len(toks) // 2
        if toks[:half] == toks[half:half * 2]:
            return True
    return False


def is_compressed(text: str) -> bool:
    """Phát hiện segment bị rớt nguyên âm (nén chữ) để gắn cờ xử lý thủ công."""
    toks = [t for t in text.split() if t]
    if len(toks) < 6:
        return False
    short = sum(1 for t in toks if len(t) <= 2) / len(toks)
    novowel = sum(1 for t in toks if not any(c in VOWELS for c in t.lower())) / len(toks)
    return short >= 0.75 and novowel >= 0.40


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

        for k in raw_keys:
            if self._test_key(k):
                self.valid_keys.append(k)
        
        print(f"[Khởi tạo Groq] Hoàn tất: {len(self.valid_keys)}/{len(raw_keys)} Keys hoạt động tốt.")
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
    """Tach audio 1 khoang [start, start+dur].

    FIX TIMESTAMP HONG (18/09/2026): them `-af aresample=async=1:first_pts=0`.
    Ly do: file `VIDEO-f59aa7.mp4` co luong audio thieu PTS o nhieu packet ->
    ffmpeg MAC DINH nén 2588s xuong con 794s khi giai ma; `-ss 1200 -t 600` chi
    nhan duoc ~114s => phu de bi mat hang loat vung noi dung (khong lop audit nao
    khac phat hien duoc). `aresample=async=1:first_pts=0` tai tao timestamp lien tuc
    theo so mau thuc.

    Da kiem chung AN TOAN voi video binh thuong (do 4 moc tren 2 video sach:
    truoc fix 120.03s / sau fix 120.03s, lech 0.00s).
    LUU Y: fix nay CHI cuu duoc timestamp; neu luong audio thieu DU LIEU THAT
    (nhu f59aa7 mat 69% packet) thi noi dung van thieu — phai thay file goc.
    Kiem tra bang `audio_integrity()` trong `audit_videos_v2.py`.
    """
    cmd = [
        FFMPEG_CMD,
        "-y",
        "-ss", str(round(start_sec, 2)),
        "-t", str(round(dur_sec, 2)),
        "-i", str(video_file),
        "-vn",
        "-ac", "1",
        "-ar", "16000",
        "-af", "aresample=async=1:first_pts=0",
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
    boundary = "----WebKitFormBoundaryGroqWhisperSingle"
    with open(audio_path, "rb") as f:
        audio_data = f.read()

    filename = audio_path.name
    parts = [
        f'--{boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n'.encode("utf-8"),
        f'--{boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n'.encode("utf-8"),
        f'--{boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nvi\r\n'.encode("utf-8"),
        f'--{boundary}\r\nContent-Disposition: form-data; name="temperature"\r\n\r\n0\r\n'.encode("utf-8"),
        f'--{boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n{VI_PROMPT}\r\n'.encode("utf-8"),
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


def transcribe_video_sku(key_mgr: GroqKeyManager, sku: str, chunk_size: float = 600.0):
    folder = VIDEO_DIR / sku
    if not folder.exists():
        print(f"[Lỗi] Không tìm thấy thư mục {folder}")
        return False

    media_files = list(folder.glob("*.mp4")) + list(folder.glob("*.webm"))
    if not media_files:
        print(f"[Lỗi] Không tìm thấy file media trong {folder}")
        return False
    video_file = media_files[0]

    srt_path = folder / "transcript.srt"
    json_path = folder / "transcript.json"
    txt_path = folder / "transcript.txt"

    total_dur = get_video_duration(video_file)
    print(f"\n[{sku}] Đang xử lý: {video_file.name} | Thời lượng: {total_dur:.2f}s ({total_dur/60:.2f} phút)")

    chunks = []
    curr = 0.0
    while curr < total_dur:
        dur = min(chunk_size, total_dur - curr)
        chunks.append((curr, dur))
        curr += dur

    print(f"[{sku}] Tách thành {len(chunks)} chunk(s)...")

    all_segments = []
    hallucination_count = 0
    compressed_count = 0
    tmp_dir = folder / "_temp_audio"
    tmp_dir.mkdir(exist_ok=True)

    try:
        for idx, (start_sec, dur_sec) in enumerate(chunks):
            chunk_file = tmp_dir / f"chunk_{idx:03d}.mp3"
            print(f"  -> Trích xuất chunk {idx+1}/{len(chunks)} ({start_sec:.1f}s - {start_sec+dur_sec:.1f}s)...")
            if not extract_audio_chunk(video_file, start_sec, dur_sec, chunk_file):
                raise RuntimeError(f"Không thể tách audio chunk {chunk_file}")

            print(f"  -> Gửi Whisper-large-v3...")
            t0 = time.time()
            resp = call_groq_whisper(key_mgr, chunk_file)
            print(f"  -> Xong trong {time.time()-t0:.2f}s.")

            segments = resp.get("segments", [])
            for seg in segments:
                real_start = round(start_sec + seg.get("start", 0.0), 3)
                real_end = round(start_sec + seg.get("end", 0.0), 3)
                text = seg.get("text", "").strip()
                if not text:
                    continue
                # 1) Lọc bỏ ảo giác Whisper (vòng lặp subscribe / kênh lạ / prompt bị đọc lại)
                if is_hallucination(text):
                    hallucination_count += 1
                    continue
                # 2) Gắn cờ "nén chữ" để hậu kiểm thủ công (không tự bịa nội dung)
                if is_compressed(text):
                    compressed_count += 1
                all_segments.append({
                    "id": len(all_segments) + 1,
                    "start": real_start,
                    "end": real_end,
                    "start_time": format_srt_time(real_start),
                    "end_time": format_srt_time(real_end),
                    "text": text,
                })

        print(f"[{sku}] Tổng số phân đoạn phụ đề thu được: {len(all_segments)}")
        print(f"[{sku}] Đã lọc bỏ {hallucination_count} segment ảo giác; "
              f"gắn cờ {compressed_count} segment 'nén chữ' (cần hậu kiểm).")
        if compressed_count:
            print(f"[{sku}] ⚠️  Có {compressed_count} segment nén chữ — nên bóc lại "
                  f"theo từng segment (xem scripts/restore_over_annotated.py) trước khi xuất bản.")

        # 1. Ghi transcript.json
        with open(json_path, "w", encoding="utf-8") as jf:
            json.dump({"sku": sku, "duration": total_dur, "segments": all_segments}, jf, ensure_ascii=False, indent=2)

        # 2. Ghi transcript.srt
        with open(srt_path, "w", encoding="utf-8") as sf:
            for seg in all_segments:
                sf.write(f"{seg['id']}\n")
                sf.write(f"{format_srt_time(seg['start'])} --> {format_srt_time(seg['end'])}\n")
                sf.write(f"{seg['text']}\n\n")

        # 3. Ghi transcript.txt
        full_text_lines = [seg["text"] for seg in all_segments]
        with open(txt_path, "w", encoding="utf-8") as tf:
            tf.write("\n".join(full_text_lines) + "\n")

        print(f"[{sku}] ✅ Hoàn tất! Đã xuất 3 file: transcript.srt, transcript.json, transcript.txt.")
        return True

    finally:
        # Dọn dẹp thư mục tạm
        if tmp_dir.exists():
            for f in tmp_dir.glob("*"):
                try:
                    f.unlink()
                except Exception:
                    pass
            try:
                tmp_dir.rmdir()
            except Exception:
                pass


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Sử dụng: python scripts/transcribe_sku.py <SKU>")
        sys.exit(1)

    sku = sys.argv[1].strip()
    key_mgr = GroqKeyManager(GROQ_CONFIG_PATH)
    success = transcribe_video_sku(key_mgr, sku)
    sys.exit(0 if success else 1)
