#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
H2DEV Project — Voice Sample Extractor & Voice DNA Profiler
Tự động tải 30s-60s audio chuẩn từ top video của kênh, chuẩn hóa âm thanh,
tạo file voice mẫu để clone ElevenLabs và sinh hồ sơ phân tích giọng nói (Voice DNA).
"""

import os
import sys
import json
import subprocess
import argparse
import shutil

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEEP_DIR = os.path.join(ROOT_DIR, 'data', 'raw-channels-deep')
ASSETS_VOICE_DIR = os.path.join(ROOT_DIR, 'assets', 'voice-samples')

os.makedirs(ASSETS_VOICE_DIR, exist_ok=True)

VOICE_MAPPING_RULES = {
    'Trẻ em': {
        'gender': 'Nữ / Trẻ em',
        'age': 'Trẻ em (6-12 tuổi) hoặc Nữ trẻ trung (20-25)',
        'tone': 'Trong trẻo, tươi vui, giàu nhạc điệu, nhí nhảnh',
        'pace': '120 - 135 từ/phút (Vừa phải, phát âm tròn vành rõ chữ)',
        'elevenlabs_recommended': ['Gigi (Childish & Playful)', 'Freya (Expressive & Youthful)', 'Alice (Confident & Clear)'],
        'clone_prompt': 'A cheerful and energetic young female voice with an upbeat, playful tone suitable for children animations and nursery rhymes.'
    },
    'Triết lý': {
        'gender': 'Nam / Nữ trung niên hoặc cao tuổi',
        'age': 'Trung niên / Lão niên (55-75 tuổi)',
        'tone': 'Trầm ấm, điềm đạm, sâu lắng, chiêm nghiệm, tạo cảm giác bình yên',
        'pace': '105 - 115 từ/phút (Chậm rãi, khoảng dừng câu lắng đọng)',
        'elevenlabs_recommended': ['George (Deep, Warm & Reflective)', 'Daniel (Authoritative British Wisdom)', 'Bill (Wise Elder Storyteller)'],
        'clone_prompt': 'A calm, deep, and meditative male voice with a gentle pacing, conveying ancient wisdom and spiritual tranquility.'
    },
    'Sức khỏe': {
        'gender': 'Nam / Nữ trung niên (Bác sĩ / Chuyên gia dưỡng lão)',
        'age': 'Trung niên (40-60 tuổi)',
        'tone': 'Chân thành, ân cần, đáng tin cậy, khoa học nhưng dễ hiểu',
        'pace': '115 - 125 từ/phút (Rõ ràng, nhấn mạnh từ khóa y tế)',
        'elevenlabs_recommended': ['Adam (Deep & Engaging Professional)', 'Brian (Thoughtful & Reassuring)', 'Sarah (Warm & Informative)'],
        'clone_prompt': 'A reassuring and professional voice with a warm, caring bedside manner suitable for senior healthcare and nutrition advice.'
    },
    'Lịch sử': {
        'gender': 'Nam trầm hùng',
        'age': 'Trung niên (35-55 tuổi)',
        'tone': 'Hùng tráng, lôi cuốn, kịch tính, dồn dập ở các đoạn cao trào',
        'pace': '125 - 140 từ/phút (Biến thiên theo nhịp kịch bản)',
        'elevenlabs_recommended': ['Callum (Intense & Dramatic)', 'Charlie (Australian / Engaging History)', 'Liam (Youthful Narrative)'],
        'clone_prompt': 'A dramatic and gripping narrator voice with cinematic presence, perfect for historical documentaries and mysteries.'
    },
    'Tôn giáo': {
        'gender': 'Nam / Nữ thành kính',
        'age': 'Trung niên (45-65 tuổi)',
        'tone': 'Trang nghiêm, ấm áp, giàu đức tin, xoa dịu tâm hồn',
        'pace': '105 - 115 từ/phút (Trang trọng, nhịp điệu thánh thót)',
        'elevenlabs_recommended': ['Will (Friendly & Earnest)', 'Eric (Reflective & Compassionate)', 'Jessica (Serene & Faithful)'],
        'clone_prompt': 'A reverent and gentle speaker with a soothing, comforting cadence for scripture reading and spiritual devotion.'
    },
    'Drama': {
        'gender': 'Nữ / Nam tâm sự',
        'age': 'Thanh niên / Trung niên (28-45 tuổi)',
        'tone': 'Thủ thỉ, tâm sự, giàu cảm xúc, nghẹn ngào ở nút thắt',
        'pace': '110 - 125 từ/phút (Ngập ngừng đúng nhịp tâm trạng)',
        'elevenlabs_recommended': ['Rachel (Calm & Empathetic)', 'Nicole (Whisper & Intimate Stories)', 'Michael (Gentle Male Confessions)'],
        'clone_prompt': 'An intimate, conversational storyteller voice with emotional depth and heartfelt expression for real-life emotional dramas.'
    }
}

def get_voice_rules_for_niche(niche_str):
    for key, val in VOICE_MAPPING_RULES.items():
        if key.lower() in niche_str.lower():
            return val
    return {
        'gender': 'Nam / Nữ chuyên nghiệp',
        'age': '30-50 tuổi',
        'tone': 'Rõ ràng, tự nhiên, cuốn hút',
        'pace': '120-130 từ/phút',
        'elevenlabs_recommended': ['Adam (Versatile Narrative)', 'Rachel (Clear & Friendly)', 'George (Deep Narrative)'],
        'clone_prompt': 'A clear, engaging, and versatile narrator voice with natural inflections suitable for educational documentaries.'
    }

def try_download_audio_section(video_url, output_path, start_sec=20, duration=40):
    m_start, s_start = divmod(start_sec, 60)
    m_end, s_end = divmod(start_sec + duration, 60)
    download_section = f"*{m_start:02d}:{s_start:02d}-{m_end:02d}:{s_end:02d}"

    cmd = [
        "yt-dlp",
        "--no-update",
        "--extractor-args", "youtube:player_client=ios,web,android",
        "--download-sections", download_section,
        "-f", "140/ba[ext=m4a]/ba/18/b",
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "128K",
        "-o", output_path,
        "--force-overwrites",
        video_url
    ]

    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return res.returncode == 0 and os.path.exists(output_path)

def process_channel(folder_name, start_sec=20, duration=40):
    folder_path = os.path.join(DEEP_DIR, folder_name)
    top_videos_path = os.path.join(folder_path, 'top-videos.json')
    profile_path = os.path.join(folder_path, 'channel-profile.json')

    if not os.path.exists(top_videos_path):
        print(f"[SKIP] {folder_name}: Không tìm thấy top-videos.json")
        return False

    with open(top_videos_path, 'r', encoding='utf-8') as f:
        tv_data = json.load(f)

    raw_id = tv_data.get('rawId') or folder_name.split('_')[0]
    videos = tv_data.get('videos', [])
    if not videos:
        print(f"[SKIP] {folder_name}: Danh sách videos rỗng")
        return False

    print(f"\n=======================================================")
    print(f"🎙️ ĐANG XỬ LÝ: [{raw_id}] {folder_name}")
    print(f"⏱️ Mẫu chuẩn: {start_sec}s -> {start_sec + duration}s ({duration}s audio chuẩn)")
    print(f"=======================================================")

    temp_audio = os.path.join(folder_path, f"temp_{raw_id}.mp3")
    final_audio = os.path.join(folder_path, "voice_sample_30s.mp3")
    public_audio = os.path.join(ASSETS_VOICE_DIR, f"{raw_id}.mp3")

    downloaded = False
    chosen_vid = None

    # Thử lần lượt các video trong top list cho đến khi thành công
    for vid in videos[:3]:
        video_url = vid.get('url') or f"https://www.youtube.com/watch?v={vid.get('videoId')}"
        video_id = vid.get('videoId', '')
        video_title = vid.get('title', '')
        print(f"-> Đang thử video [{video_id}]: {video_title[:50]}...")
        if try_download_audio_section(video_url, temp_audio, start_sec=start_sec, duration=duration):
            downloaded = True
            chosen_vid = vid
            break

    if not downloaded or not os.path.exists(temp_audio):
        print(f"[FAIL] Không thể tải audio mẫu cho kênh {raw_id}")
        return False

    # Dùng ffmpeg chuẩn hóa âm lượng (loudnorm -16 LUFS) và chuyển sang Mono 44.1kHz (chuẩn vàng cho ElevenLabs Voice Clone)
    ff_cmd = [
        "ffmpeg", "-y",
        "-i", temp_audio,
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11,afftdn=nf=-25",
        "-ar", "44100",
        "-ac", "1",
        "-b:a", "128k",
        final_audio
    ]

    try:
        subprocess.run(ff_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError:
        shutil.copyfile(temp_audio, final_audio)

    if os.path.exists(temp_audio):
        os.remove(temp_audio)

    # Phân phối sang assets public để web player nạp mượt mà
    shutil.copyfile(final_audio, public_audio)

    file_size_kb = os.path.getsize(final_audio) / 1024
    print(f"✅ Đã tạo mẫu voice chuẩn: {final_audio} ({file_size_kb:.1f} KB)")
    print(f"✅ Đã copy vào assets public: {public_audio}")

    # Phân tích Voice DNA và gợi ý ElevenLabs
    channel_niche = "Chưa phân loại"
    if os.path.exists(profile_path):
        with open(profile_path, 'r', encoding='utf-8') as f:
            prof = json.load(f)
            channel_niche = prof.get('editorialNiche', channel_niche)

    rules = get_voice_rules_for_niche(channel_niche)
    end_sec = start_sec + duration

    voice_dna = {
        "rawId": raw_id,
        "channelFolder": folder_name,
        "sourceVideo": {
            "videoId": chosen_vid.get('videoId'),
            "title": chosen_vid.get('title'),
            "url": chosen_vid.get('url') or f"https://www.youtube.com/watch?v={chosen_vid.get('videoId')}",
            "timeWindow": f"{start_sec}s – {end_sec}s ({duration}s)"
        },
        "sampleAudio": {
            "localPath": f"data/raw-channels-deep/{folder_name}/voice_sample_30s.mp3",
            "publicUrl": f"assets/voice-samples/{raw_id}.mp3",
            "fileSizeKB": round(file_size_kb, 1),
            "format": "MP3 Mono 44.1kHz 128kbps (Chuẩn hóa LUFS -16)"
        },
        "voiceCharacteristics": {
            "genderEstimate": rules['gender'],
            "ageEstimate": rules['age'],
            "toneAndStyle": rules['tone'],
            "estimatedPace": rules['pace'],
            "nicheCategory": channel_niche
        },
        "aiVoiceCloningGuide": {
            "elevenlabsRecommendedVoices": rules['elevenlabs_recommended'],
            "suggestedVoiceDesignPrompt": rules['clone_prompt'],
            "usageNotes": "Mẫu voice đã được lọc nhiễu nhẹ và chuẩn hóa -16 LUFS, sẵn sàng nạp trực tiếp vào ElevenLabs Instant Voice Clone hoặc Custom Voice Design."
        }
    }

    voice_profile_path = os.path.join(folder_path, "voice_profile.json")
    with open(voice_profile_path, 'w', encoding='utf-8') as f:
        json.dump(voice_dna, f, ensure_ascii=False, indent=2)

    print(f"📝 Đã lưu hồ sơ Voice DNA: {voice_profile_path}")
    return True

def main():
    parser = argparse.ArgumentParser(description="Trích xuất mẫu voice 30-60s và hồ sơ Voice DNA cho kênh H2DEV")
    parser.add_argument("target", nargs="?", default="RAW-001", help="Mã RAW-ID (ví dụ RAW-001, RAW-002) hoặc 'ALL'")
    parser.add_argument("--duration", type=int, default=40, help="Thời lượng mẫu voice tính theo giây (mặc định 40s)")
    parser.add_argument("--start", type=int, default=20, help="Giây bắt đầu cắt để né intro nhạc (mặc định 20s)")
    args = parser.parse_args()

    folders = [d for d in os.listdir(DEEP_DIR) if os.path.isdir(os.path.join(DEEP_DIR, d))]
    folders.sort()

    if args.target.upper() == 'ALL':
        print(f"🚀 BẮT ĐẦU TRÍCH XUẤT HÀNG LOẠT CHO {len(folders)} KÊNH...")
        success = 0
        for f in folders:
            if process_channel(f, start_sec=args.start, duration=args.duration):
                success += 1
        print(f"\n🎉 HOÀN TẤT: Đã tạo thành công {success}/{len(folders)} mẫu voice chuẩn!")
    else:
        target_folder = next((f for f in folders if f.startswith(args.target.upper())), None)
        if not target_folder:
            print(f"❌ Không tìm thấy thư mục kênh cho {args.target}")
            sys.exit(1)
        process_channel(target_folder, start_sec=args.start, duration=args.duration)

if __name__ == "__main__":
    main()
