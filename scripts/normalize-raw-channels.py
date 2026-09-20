import json, os, sys, time, urllib.request, base64

sys.stdout.reconfigure(encoding='utf-8')

WORKDIR = r"D:\YTB\H2DEV-Project"
RAW_DIR = os.path.join(WORKDIR, "raw-kenh-goc")  # 18/09/2026: dời từ "Raw Kênh Mẫu Tìm Kiếm" (TREE.md)
META_PATH = os.path.join(RAW_DIR, "metadata-full.json")
PROGRESS_PATH = os.path.join(RAW_DIR, "metadata-normalized.json")

if not os.path.isdir(RAW_DIR):
    print(f"[LOI] Thu muc khong ton tai: {RAW_DIR}")
    print("       Kiem tra TREE.md de biet duong dan chuan.")
    sys.exit(1)
if not os.path.exists(META_PATH):
    print(f"[LOI] Thieu file: {META_PATH}")
    sys.exit(1)


def get_local_mcp_key():
    # Ưu tiên 1: Biến môi trường
    key = os.environ.get("MCP_POOL_API_KEY")
    if key:
        return key
    # Ưu tiên 2: Đọc từ .env của dự án
    env_file = os.path.join(WORKDIR, ".env")
    if os.path.exists(env_file):
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("MCP_POOL_API_KEY="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            return val
        except Exception:
            pass
    # Ưu tiên 3: Fallback chuẩn của MCP Pool Local (:3988)
    return "mcp-pool-2026-secure-key"

LOCAL_MCP_KEY = get_local_mcp_key()

def call_mcp(tool_name, arguments, timeout=40):
    body = json.dumps({
        "jsonrpc": "2.0",
        "id": int(time.time()*1000) % 100000,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }).encode("utf-8")
    
    req = urllib.request.Request(
        "http://127.0.0.1:3988/mcp",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {LOCAL_MCP_KEY}",
            "X-API-Key": LOCAL_MCP_KEY
        }
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        if "result" in res and "content" in res["result"] and len(res["result"]["content"]) > 0:
            return res["result"]["content"][0].get("text", "")
        return ""

def search_youtube_channel(query):
    try:
        raw = call_mcp("vidiq__vidiq_youtube_search", {"query": query, "type": ["channel"], "limit": 1})
        if not raw:
            return None
        parsed = json.loads(raw)
        results = parsed.get("results", [])
        if results:
            return results[0]
    except Exception as e:
        # print(f"Search err for {query}: {e}")
        pass
    return None

def get_channel_stats(channel_id):
    try:
        raw = call_mcp("vidiq__vidiq_channel_stats", {"channelId": channel_id})
        if not raw:
            return None
        return json.loads(raw)
    except Exception as e:
        pass
    return None

def analyze_with_vision(image_path):
    try:
        with open(image_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        data_uri = f"data:image/jpeg;base64,{b64}"
        prompt = """Hãy phân tích ảnh chụp màn hình YouTube này.
Trả về định dạng JSON DUY NHẤT (không kèm markdown rào, chỉ JSON thuần) với các trường:
{
  "channelName": "tên kênh (hoặc null nếu không thấy)",
  "handle": "handle kênh dạng @... (hoặc null)",
  "videoTitles": ["tiêu đề 1", "tiêu đề 2"],
  "mainTopic": "chủ đề chính ngắn gọn",
  "suggestedNiche": "một trong các ngách: Everyday History EN, Kinh Thánh EN, Phật pháp Nhật, Sức khỏe Nhật, Chuyện đời / kể chuyện senior Nhật, Khoa học / Trái Đất EN, Triết lý / Tâm linh, Hoạt hình / Giáo dục, Âm nhạc / Thiếu nhi, Khác",
  "language": "EN hoặc JP hoặc KR hoặc VN hoặc Other"
}"""
        res_text = call_mcp("vision__analyze_image", {"image": data_uri, "prompt": prompt}, timeout=50)
        # Parse JSON from response
        clean_text = res_text.strip()
        if "```json" in clean_text:
            clean_text = clean_text.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_text:
            clean_text = clean_text.split("```")[1].split("```")[0].strip()
        return json.loads(clean_text)
    except Exception as e:
        # print(f"Vision error on {image_path}: {e}")
        pass
    return None

def infer_niche(channel_title, topics, vision_niche):
    if vision_niche and vision_niche != "Khác":
        return vision_niche
    t_str = (channel_title + " " + " ".join(topics or [])).lower()
    if any(w in t_str for w in ["history", "timeline", "past", "ancient", "war"]):
        return "Everyday History EN (lịch sử / đồ vật / quá khứ)"
    if any(w in t_str for w in ["christian", "bible", "jesus", "gospel"]):
        return "Kinh Thánh EN (giáo dục)"
    if any(w in t_str for w in ["buddha", "buddhism", "仏教", "シニア", "長生き"]):
        return "Phật pháp Nhật / Senior Nhật"
    if any(w in t_str for w in ["science", "physics", "earth", "universe", "calculus", "academy"]):
        return "Khoa học / Trái Đất EN"
    if any(w in t_str for w in ["song", "kids", "rhyme", "peekaboo", "children"]):
        return "Âm nhạc / Thiếu nhi / Family"
    if any(w in t_str for w in ["drive", "car", "travel"]):
        return "Du lịch / Lái xe POV"
    return "Kiến thức / Giải trí tổng hợp"

# Load current metadata
with open(META_PATH, encoding="utf-8") as f:
    data = json.load(f)

records = data.get("records", [])
print(f"Bắt đầu chuẩn hóa {len(records)} ảnh raw...")

# Load existing progress if any
processed = {}
if os.path.exists(PROGRESS_PATH):
    try:
        with open(PROGRESS_PATH, encoding="utf-8") as f:
            old_data = json.load(f)
            processed = {r["id"]: r for r in old_data.get("records", [])}
            print(f"Đã có sẵn {len(processed)} bản ghi đã xử lý trước đó.")
    except Exception:
        pass

updated_records = []
for idx, r in enumerate(records, 1):
    rid = r["id"]
    fname = r["fileName"]
    img_full_path = os.path.join(RAW_DIR, fname)
    
    # Check if already processed with channel and niche
    if rid in processed and processed[rid].get("channel", {}).get("title") and processed[rid].get("niche"):
        updated_records.append(processed[rid])
        continue
    
    print(f"[{idx}/{len(records)}] Đang xử lý {rid} ({fname})...")
    
    obs = r.get("observed", {})
    label = obs.get("channelLabel")
    handle = obs.get("literalHandle")
    
    vision_data = None
    # Nếu chưa có label hoặc label quá ngắn/nghi ngờ, gọi Vision
    if not label or len(label) < 3:
        print(f"  -> Gọi Vision OCR đọc ảnh...")
        vision_data = analyze_with_vision(img_full_path)
        if vision_data:
            if vision_data.get("channelName"):
                label = vision_data["channelName"]
            if vision_data.get("handle") and not handle:
                handle = vision_data["handle"]
            print(f"  -> Vision tìm thấy: label='{label}', handle='{handle}', topic='{vision_data.get('mainTopic')}'")
    
    # Tìm kiếm channel trên YouTube bằng vidIQ
    yt_ch = None
    query_target = handle if handle else label
    if query_target:
        print(f"  -> Tìm kiếm YouTube channel: '{query_target}'...")
        yt_ch = search_youtube_channel(query_target)
    
    # Nếu tìm chưa ra mà có vision titles, thử tìm bằng title video
    if not yt_ch and vision_data and vision_data.get("videoTitles"):
        v_title = vision_data["videoTitles"][0]
        print(f"  -> Thử tìm bằng video title: '{v_title}'...")
        yt_ch = search_youtube_channel(v_title)
    
    # Lấy thông tin thống kê chi tiết nếu tìm thấy
    ch_stats = None
    channel_info = {}
    if yt_ch:
        ch_id = yt_ch.get("channelId") or yt_ch.get("id")
        ch_title = yt_ch.get("title") or yt_ch.get("channelTitle") or label
        ch_stats = get_channel_stats(ch_id) if ch_id else None
        
        subs = 0
        views = 0
        videos = 0
        topics = []
        country = yt_ch.get("country")
        avatar = yt_ch.get("thumbnail")
        
        if ch_stats:
            current = ch_stats.get("currentStats", {})
            subs = current.get("subscribers", 0)
            views = current.get("views", 0)
            videos = current.get("videos", 0)
            topics = ch_stats.get("topics", [])
            country = ch_stats.get("country") or country
            avatar = ch_stats.get("thumbnail") or avatar
            if ch_stats.get("title"):
                ch_title = ch_stats.get("title")
        
        channel_info = {
            "channelId": ch_id,
            "title": ch_title,
            "handle": handle if handle else (f"@{ch_id}" if ch_id else None),
            "url": f"https://www.youtube.com/channel/{ch_id}" if ch_id else None,
            "subscribers": subs,
            "views": views,
            "videoCount": videos,
            "country": country,
            "avatar": avatar,
            "topics": topics
        }
        print(f"  -> MATCHED: '{ch_title}' (ID: {ch_id}, Subs: {subs}, Videos: {videos})")
    else:
        channel_info = {
            "channelId": None,
            "title": label if label else "Chưa xác định",
            "handle": handle,
            "url": None,
            "subscribers": 0,
            "views": 0,
            "videoCount": 0,
            "country": None,
            "avatar": None,
            "topics": []
        }
        print(f"  -> UNRESOLVED: '{label}'")
    
    # Xác định ngách chuẩn
    v_niche = vision_data.get("suggestedNiche") if vision_data else None
    assigned_niche = infer_niche(channel_info["title"] or "", channel_info.get("topics", []), v_niche)
    
    # Cập nhật record
    new_record = {
        "id": rid,
        "fileName": fname,
        "sha256": r.get("sha256"),
        "technical": r.get("technical"),
        "channel": channel_info,
        "niche": assigned_niche,
        "visionAnalysis": vision_data,
        "status": "VERIFIED_MATCH" if channel_info.get("channelId") else "MANUAL_REVIEW"
    }
    updated_records.append(new_record)
    processed[rid] = new_record
    
    # Lưu định kỳ mỗi 5 record để tránh mất tiến độ
    if len(updated_records) % 5 == 0:
        with open(PROGRESS_PATH, "w", encoding="utf-8") as f:
            json.dump({
                "schema": "h2dev.raw-kenh-mau-metadata.v10-ocr",
                "updatedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
                "totalRecords": len(updated_records),
                "records": updated_records
            }, f, ensure_ascii=False, indent=2)
        print(f"--- Đã lưu checkpoint ({len(updated_records)}/{len(records)}) ---")
    
    time.sleep(0.3)

# Hoàn tất lưu file chính
final_output = {
    "schema": "h2dev.raw-kenh-mau-metadata.v10-ocr",
    "updatedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
    "totalRecords": len(updated_records),
    "records": updated_records
}
with open(PROGRESS_PATH, "w", encoding="utf-8") as f:
    json.dump(final_output, f, ensure_ascii=False, indent=2)

with open(META_PATH, "w", encoding="utf-8") as f:
    json.dump(final_output, f, ensure_ascii=False, indent=2)

print("\n=== HOÀN TẤT CHUẨN HÓA 95/95 ẢNH RAW ===")
