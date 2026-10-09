import os
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = r'D:\YTB\H2DEV-Project'
VIDEOS_JSON = os.path.join(BASE_DIR, 'data-tabs', 'videos.json')
INSIGHTS_JSON = os.path.join(BASE_DIR, 'data', 'video_insights.json')
RAW_KENH_JSON = os.path.join(BASE_DIR, 'data-tabs', 'raw-kenh-mau.json')
KENH_MAU_JSON = os.path.join(BASE_DIR, 'data-tabs', 'kenh-mau.json')
TAI_LIEU_JSON = os.path.join(BASE_DIR, 'data-tabs', 'tai-lieu-full.json')

with open(VIDEOS_JSON, 'r', encoding='utf-8') as f:
    videos_list = json.load(f)

insights_dict = {}
if os.path.exists(INSIGHTS_JSON):
    with open(INSIGHTS_JSON, 'r', encoding='utf-8') as f:
        insights_data = json.load(f)
        if isinstance(insights_data, list):
            for it in insights_data:
                insights_dict[it.get('sku')] = it
        elif isinstance(insights_data, dict):
            insights_dict = insights_data

with open(RAW_KENH_JSON, 'r', encoding='utf-8') as f:
    raw_kenh = json.load(f)

with open(TAI_LIEU_JSON, 'r', encoding='utf-8') as f:
    tai_lieu = json.load(f)

print(f"Loaded {len(videos_list)} videos, {len(insights_dict)} insights, {len(raw_kenh)} raw channels, {len(tai_lieu)} docs.")

master_records = []
stats = {
    'total_videos': len(videos_list),
    'has_transcript_file': 0,
    'total_transcript_words': 0,
    'has_sop': 0,
    'has_avoid_flags': 0,
    'has_attached_docs': 0
}

for idx, v in enumerate(videos_list):
    sku = v.get('sku')
    title = v.get('title')
    duration = v.get('duration')
    category = v.get('category')
    
    # 1. Transcript text
    transcript_file = os.path.join(BASE_DIR, 'video', sku, 'transcript.txt')
    transcript_text = ""
    transcript_lines = 0
    transcript_sample = ""
    if os.path.exists(transcript_file):
        try:
            with open(transcript_file, 'r', encoding='utf-8', errors='ignore') as tf:
                content = tf.read().strip()
                lines = [l.strip() for l in content.split('\n') if l.strip()]
                transcript_lines = len(lines)
                words = content.split()
                stats['has_transcript_file'] += 1
                stats['total_transcript_words'] += len(words)
                transcript_text = content
                transcript_sample = " | ".join(lines[:3]) if lines else ""
        except Exception as e:
            pass

    # 2. Insights
    ins = insights_dict.get(sku, {})
    takeaways = ins.get('takeaways', [])
    sop = ins.get('edit_sop', '')
    avoid_flags = ins.get('avoid_flags', [])
    timestamps = ins.get('timestamps', [])
    
    if sop:
        stats['has_sop'] += 1
    if avoid_flags:
        stats['has_avoid_flags'] += 1

    # 3. Attached docs
    doc_folder = os.path.join(BASE_DIR, 'docs', sku)
    asset_doc_folder = os.path.join(BASE_DIR, 'assets', 'docs', sku)
    attached_files = []
    for d_path in [doc_folder, asset_doc_folder]:
        if os.path.exists(d_path):
            for root, _, files in os.walk(d_path):
                for fl in files:
                    attached_files.append(fl)
    if attached_files:
        stats['has_attached_docs'] += 1

    record = {
        'index': idx + 1,
        'sku': sku,
        'title': title,
        'duration': duration,
        'category': category,
        'transcript_lines': transcript_lines,
        'transcript_words': len(transcript_text.split()),
        'transcript_sample': transcript_sample,
        'takeaways_count': len(takeaways),
        'takeaways': takeaways,
        'sop_length': len(str(sop)),
        'sop': sop,
        'avoid_flags_count': len(avoid_flags),
        'avoid_flags': avoid_flags,
        'timestamps_count': len(timestamps),
        'attached_files': attached_files
    }
    master_records.append(record)

out_file = os.path.join(BASE_DIR, 'docs', 'reports', 'master_144_videos_extracted_matrix.json')
with open(out_file, 'w', encoding='utf-8') as out:
    json.dump({'stats': stats, 'records': master_records}, out, ensure_ascii=False, indent=2)

print("Saved complete master 144 matrix to:", out_file)
print("Stats:", json.dumps(stats, indent=2))
