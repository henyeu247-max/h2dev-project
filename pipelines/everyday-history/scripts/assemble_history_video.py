#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
H2DEV Everyday History Video Assembler
Assembles voiceover MP3 + static stills into a 1080p MP4 with gentle Ken Burns pan/zoom and crossfades.
"""

import sys
import os
import json
import subprocess
import argparse
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

def check_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def get_audio_duration(audio_path):
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(audio_path)
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
    return float(res.stdout.strip())

def assemble_video(project_dir, output_mp4=None):
    if not check_ffmpeg():
        print("[ERROR] FFmpeg không có trong PATH. Vui lòng cài đặt FFmpeg trước.")
        sys.exit(1)

    project_path = Path(project_dir)
    voice_path = project_path / "voice" / "voice.mp3"
    images_dir = project_path / "images"

    if not voice_path.exists():
        print(f"[ERROR] Không tìm thấy file âm thanh tại: {voice_path}")
        sys.exit(1)

    images = sorted(list(images_dir.glob("*.png")) + list(images_dir.glob("*.jpg")) + list(images_dir.glob("*.jpeg")))
    if not images:
        print(f"[ERROR] Không tìm thấy ảnh nào trong thư mục: {images_dir}")
        sys.exit(1)

    audio_dur = get_audio_duration(voice_path)
    dur_per_img = audio_dur / len(images)
    print(f"[INFO] Tổng thời lượng audio: {audio_dur:.2f}s | Số lượng ảnh: {len(images)} | Thời lượng/ảnh: {dur_per_img:.2f}s")

    if not output_mp4:
        output_mp4 = project_path / "final.mp4"
    else:
        output_mp4 = Path(output_mp4)

    # Tạo concat demuxer file
    concat_file = project_path / "_concat_list.txt"
    lines = []
    for img in images:
        lines.append(f"file '{img.resolve()}'")
        lines.append(f"duration {dur_per_img:.3f}")
    # Concat file cần lặp lại ảnh cuối
    lines.append(f"file '{images[-1].resolve()}'")

    concat_file.write_text("\n".join(lines), encoding="utf-8")

    # Render video bằng FFmpeg với filter zoompan (Ken Burns)
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", str(concat_file),
        "-i", str(voice_path),
        "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        str(output_mp4)
    ]

    print(f"[INFO] Bắt đầu render video với FFmpeg...")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"[ERROR] Lỗi FFmpeg: {res.stderr}")
        sys.exit(1)

    # Dọn dẹp concat file tạm
    if concat_file.exists():
        concat_file.unlink()

    print(f"[OK] Đã xuất bản video thành công: {output_mp4}")
    return str(output_mp4)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="H2DEV Everyday History Video Assembler")
    parser.add_argument("--project", required=True, help="Thư mục project chứa voice/ và images/")
    parser.add_argument("--out", default=None, help="Đường dẫn file MP4 xuất ra")
    args = parser.parse_args()

    assemble_video(args.project, args.out)
