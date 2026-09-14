import json
import os
import subprocess
import shutil

PROJECT_DIR = r"D:\YTB\H2DEV-Project"
DOSSIER_DIR = os.path.join(PROJECT_DIR, "data", "raw-channels-deep", "RAW-021_Hidden_Planet_Docs")

print("================================================================")
print("     AUDIT TOÀN DIỆN 100% RAW-021 (HIDDEN PLANET DOCS)          ")
print("================================================================")

errors = []
warnings = []

# 1. Check channel-profile.json
p_file = os.path.join(DOSSIER_DIR, "channel-profile.json")
if not os.path.exists(p_file):
    errors.append("Thiếu file channel-profile.json")
else:
    with open(p_file, "r", encoding="utf-8") as f:
        p_data = json.load(f)
    print(f"[1] channel-profile.json:")
    print(f"    - Title: {p_data.get('title')}")
    print(f"    - Handle: {p_data.get('handle')}")
    print(f"    - Subs: {p_data.get('subscribers')} | Views: {p_data.get('views')} | VideoCount: {p_data.get('videoCount')}")
    print(f"    - Tags count: {len(p_data.get('channelTags', []))}")
    if len(p_data.get('channelTags', [])) < 30:
        warnings.append(f"Tags count ({len(p_data.get('channelTags', []))}) chưa đạt mốc 30-50 tags!")
    rev = p_data.get('vitalityAudit', {}).get('estimatedMonthlyRev')
    print(f"    - Estimated Rev: {rev}")
    if "N/A" in str(rev):
        errors.append(f"estimatedMonthlyRev vẫn còn chứa N/A: {rev}")

# 2. Check voice sample audio
v_audio = os.path.join(DOSSIER_DIR, "voice_sample_30s.mp3")
v_asset = os.path.join(PROJECT_DIR, "assets", "voice-samples", "RAW-021.mp3")

def get_ffprobe_bin():
    p = shutil.which("ffprobe")
    if p: return p
    candidates = [
        r"C:\Users\SaxukeB\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin\ffprobe.exe",
        r"D:\Linly-Dubbing\bin\ffprobe.exe"
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return "ffprobe"

ffprobe_bin = get_ffprobe_bin()

for label, a_path in [("Dossier MP3", v_audio), ("Public Asset MP3", v_asset)]:
    if not os.path.exists(a_path):
        errors.append(f"Thiếu file âm thanh: {label} ({a_path})")
    else:
        sz = os.path.getsize(a_path)
        cmd = [ffprobe_bin, "-v", "error", "-show_entries", "format=duration,bit_rate", "-of", "default=noprint_wrappers=1", a_path]
        try:
            out = subprocess.check_output(cmd, text=True).strip()
            print(f"[2] {label}: Size={sz}B ({sz/1024:.1f}KB) | ffprobe: {out.replace(chr(10), ' ')}")
        except Exception as e:
            errors.append(f"ffprobe lỗi trên {label}: {e}")

# 3. Check voice_profile.json
vp_file = os.path.join(DOSSIER_DIR, "voice_profile.json")
if not os.path.exists(vp_file):
    errors.append("Thiếu file voice_profile.json")
else:
    with open(vp_file, "r", encoding="utf-8") as f:
        vp_data = json.load(f)
    print(f"[3] voice_profile.json:")
    print(f"    - Time window: {vp_data.get('sourceVideo', {}).get('timeWindow')}")
    print(f"    - WPM: {vp_data.get('voiceCharacteristics', {}).get('actualPaceWPM')}")
    print(f"    - Speech block chars: {len(vp_data.get('promptingStudio', {}).get('sampleSpeechBlock', ''))}")
    if len(vp_data.get('promptingStudio', {}).get('sampleSpeechBlock', '')) < 100:
        errors.append("sampleSpeechBlock quá ngắn hoặc rỗng!")

# 4. Check production_toolkit.json
tk_file = os.path.join(DOSSIER_DIR, "production_toolkit.json")
if not os.path.exists(tk_file):
    errors.append("Thiếu file production_toolkit.json")
else:
    with open(tk_file, "r", encoding="utf-8") as f:
        tk_data = json.load(f)
    print(f"[4] production_toolkit.json:")
    vd = tk_data.get('visualDirective', {})
    sb = tk_data.get('scriptBlueprint', {})
    ps = tk_data.get('productionStack', {})
    pkg = tk_data.get('packagingCTR', {})
    print(f"    - Script Ref Vid: {sb.get('scriptRefVid')}")
    print(f"    - Master Script Prompt chars: {len(sb.get('masterScriptPrompt', ''))}")
    print(f"    - SOP Doc Path: {ps.get('sopDocPath')}")
    sop_abs = os.path.join(PROJECT_DIR, ps.get('sopDocPath', ''))
    if not os.path.exists(sop_abs):
        errors.append(f"sopDocPath không tồn tại: {sop_abs}")
    else:
        print(f"      -> File SOP tồn tại: {sop_abs} ({os.path.getsize(sop_abs)}B)")
    repo_abs = os.path.join(PROJECT_DIR, ps.get('repoPath', ''))
    if not os.path.exists(repo_abs):
        errors.append(f"repoPath không tồn tại: {repo_abs}")
    else:
        print(f"      -> Repo tồn tại: {repo_abs}")

# 5. Check top-videos.json (10 videos)
tv_file = os.path.join(DOSSIER_DIR, "top-videos.json")
if not os.path.exists(tv_file):
    errors.append("Thiếu file top-videos.json")
else:
    with open(tv_file, "r", encoding="utf-8") as f:
        tv_data = json.load(f)
    videos = tv_data.get('videos', [])
    print(f"[5] top-videos.json: {len(videos)} videos")
    
    # Check sort order by views descending
    views_list = [v.get('views', 0) for v in videos]
    is_sorted = all(views_list[i] >= views_list[i+1] for i in range(len(views_list)-1))
    print(f"    - Sắp xếp views giảm dần (Most Viewed): {'ĐÚNG' if is_sorted else 'SAI'}")
    if not is_sorted:
        errors.append("top-videos.json chưa được sắp xếp giảm dần theo views!")

    for i, v in enumerate(videos):
        vid = v.get('videoId')
        title = v.get('title')
        views = v.get('views')
        t_rel = v.get('transcriptJsonRel')
        s_rel = v.get('summaryViRel')
        
        t_abs = os.path.join(DOSSIER_DIR, t_rel) if t_rel else None
        s_abs = os.path.join(DOSSIER_DIR, s_rel) if s_rel else None
        
        t_ok = os.path.exists(t_abs) if t_abs else False
        s_ok = os.path.exists(s_abs) if s_abs else False
        
        seg_count = 0
        if t_ok:
            try:
                with open(t_abs, "r", encoding="utf-8") as tf:
                    t_json = json.load(tf)
                    seg_count = len(t_json.get('segments', []))
            except Exception as e:
                t_ok = False
        
        s_size = os.path.getsize(s_abs) if s_ok else 0
        
        status_str = f"#{i+1}: [{vid}] {views:,} views | Segs: {seg_count} | SummaryVi: {s_size}B | {title[:40]}..."
        print(f"    {status_str}")
        
        if not t_ok or seg_count == 0:
            errors.append(f"Video {vid} thiếu hoặc lỗi transcript JSON!")
        if not s_ok or s_size == 0:
            errors.append(f"Video {vid} thiếu hoặc rỗng summaryVi!")

# 6. Check thumbnail image
raw_img = os.path.join(PROJECT_DIR, "assets", "raw-kenh", "HPTI8OiW8AAeW5m.png")
if not os.path.exists(raw_img):
    errors.append(f"Thiếu file ảnh raw: {raw_img}")
else:
    print(f"[6] Ảnh raw kênh: {raw_img} ({os.path.getsize(raw_img)}B)")

# 7. Check raw-kenh-mau.json consistency
rkm_file = os.path.join(PROJECT_DIR, "data-tabs", "raw-kenh-mau.json")
with open(rkm_file, "r", encoding="utf-8") as f:
    rkm_data = json.load(f)
records = rkm_data.get('records', []) if isinstance(rkm_data, dict) else rkm_data
r21_list = [r for r in records if r.get('id') == 'RAW-021']
if not r21_list:
    errors.append("Không tìm thấy RAW-021 trong raw-kenh-mau.json!")
else:
    r21 = r21_list[0]
    di = r21.get('deepIntelligence', {})
    va = r21.get('vitalityAudit', {})
    al = r21.get('audioLanguageInfo', {})
    print(f"[7] raw-kenh-mau.json:")
    print(f"    - tagsCount: {di.get('tagsCount')}")
    print(f"    - estimatedMonthlyRev: {va.get('estimatedMonthlyRev')}")
    print(f"    - audioLanguageInfo: {al.get('flag')} {al.get('language')} ({al.get('code')})")
    print(f"    - featuredDemoVideo: {r21.get('featuredDemoVideo', {}).get('videoId')} - {r21.get('featuredDemoVideo', {}).get('title')}")
    if di.get('tagsCount') == 0:
        errors.append("raw-kenh-mau.json tagsCount vẫn là 0!")
    if "N/A" in str(va.get('estimatedMonthlyRev')):
        errors.append(f"raw-kenh-mau.json estimatedMonthlyRev vẫn chứa N/A: {va.get('estimatedMonthlyRev')}")

print("\n================================================================")
print(f"TỔNG KẾT AUDIT RAW-021:")
print(f"Số lỗi phát hiện (Errors): {len(errors)}")
print(f"Số cảnh báo (Warnings): {len(warnings)}")
if errors:
    print("DANH SÁCH LỖI:")
    for e in errors:
        print(f"  ❌ {e}")
if warnings:
    print("DANH SÁCH CẢNH BÁO:")
    for w in warnings:
        print(f"  ⚠️ {w}")
if not errors and not warnings:
    print("  ✅ 100% HOÀN HẢO! TẤT CẢ FILE VÀ THÔNG SỐ ĐẠU TIÊU CHUẨN VÀNG!")
print("================================================================")
