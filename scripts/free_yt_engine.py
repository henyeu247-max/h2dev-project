#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
H2DEV Free YouTube Intelligence Engine
Thay thế 100% vidIQ: Không tốn credit, Không cần API key, Chạy trực tiếp qua RSS & InnerTube
"""

import sys
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import json
import re
from datetime import datetime, timezone

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
}

def get_channel_info(handle_or_url):
    """Lấy thông tin tổng quan kênh: Subs, Video count, Avatar, ChannelId"""
    if not handle_or_url.startswith('http'):
        handle = handle_or_url if handle_or_url.startswith('@') else f'@{handle_or_url}'
        url = f'https://www.youtube.com/{handle}'
    else:
        url = handle_or_url

    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='ignore')

    m = re.search(r'var ytInitialData = ({.*?});</script>', html)
    if not m:
        return {'error': 'Cannot extract ytInitialData'}

    data = json.loads(m.group(1))
    header = data.get('header', {}).get('pageHeaderRenderer', {})
    phvm = header.get('content', {}).get('pageHeaderViewModel', {})
    meta_rows = phvm.get('metadata', {}).get('contentMetadataViewModel', {}).get('metadataRows', [])

    subscribers = 'Unknown'
    video_count = 'Unknown'
    handle_found = ''

    for row in meta_rows:
        for part in row.get('metadataParts', []):
            text = part.get('text', {}).get('content', '')
            if text.startswith('@'):
                handle_found = text
            elif 'subscriber' in text.lower() or 'người đăng ký' in text.lower():
                subscribers = text
            elif 'video' in text.lower():
                video_count = text

    cmr = data.get('metadata', {}).get('channelMetadataRenderer', {})
    title = cmr.get('title', '')
    channel_id = cmr.get('externalId', '')
    avatar = cmr.get('avatar', {}).get('thumbnails', [{}])[-1].get('url', '')
    rss_url = cmr.get('rssUrl', f'https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}')

    return {
        'title': title,
        'handle': handle_found or handle_or_url,
        'channelId': channel_id,
        'subscribers': subscribers,
        'videoCount': video_count,
        'avatar': avatar,
        'rssUrl': rss_url
    }

def get_channel_rss(channel_id):
    """Lấy danh sách 15 video mới nhất kèm lượt view thật 100% miễn phí từ Google RSS"""
    url = f'https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}'
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=10) as resp:
        xml_data = resp.read()

    root = ET.fromstring(xml_data)
    ns = {
        'atom': 'http://www.w3.org/2005/Atom',
        'yt': 'http://www.youtube.com/xml/schemas/2015',
        'media': 'http://search.yahoo.com/mrss/'
    }

    entries = root.findall('atom:entry', ns)
    videos = []
    now = datetime.now(timezone.utc)

    for e in entries:
        vid = e.find('yt:videoId', ns).text
        title = e.find('atom:title', ns).text
        published = e.find('atom:published', ns).text
        
        # Calculate hours since publish
        pub_dt = datetime.fromisoformat(published.replace('Z', '+00:00'))
        hours_age = max(1.0, (now - pub_dt).total_seconds() / 3600.0)

        media_grp = e.find('media:group', ns)
        views = 0
        if media_grp is not None:
            stats = media_grp.find('media:community', ns).find('media:statistics', ns)
            if stats is not None:
                views = int(stats.attrib.get('views', 0))

        vph = round(views / hours_age, 1)

        videos.append({
            'videoId': vid,
            'title': title,
            'publishedAt': published,
            'views': views,
            'hoursAge': round(hours_age, 1),
            'vph': vph,
            'videoUrl': f'https://www.youtube.com/watch?v={vid}',
            'thumbnail': f'https://i.ytimg.com/vi/{vid}/maxresdefault.jpg'
        })

    return videos

def calculate_outliers(videos):
    """Tính toán chỉ số Outlier tự động từ mảng video"""
    if not videos:
        return []

    view_counts = sorted([v['views'] for v in videos if v['views'] > 0])
    if not view_counts:
        return videos

    median_views = view_counts[len(view_counts) // 2]
    avg_views = sum(view_counts) / len(view_counts)

    for v in videos:
        v['medianBaseline'] = median_views
        v['avgBaseline'] = round(avg_views)
        v['outlierScore'] = round(v['views'] / max(1, median_views), 2)
        v['isOutlier'] = v['outlierScore'] >= 3.0

    # Sort descending by outlier score
    return sorted(videos, key=lambda x: x['views'], reverse=True)

def suggest_keywords(seed_query):
    """Lấy danh sách từ khóa đề xuất thực tế từ YouTube Autocomplete (100% Free)"""
    encoded = urllib.parse.quote(seed_query)
    url = f'https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q={encoded}'
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        return data[1] if len(data) > 1 else []

def deconstruct_title_hook(title):
    """[1of10-Tier Multidimensional] Bóc tách 12 chiều tâm lý nhận thức, cơ chế ngữ pháp & dự báo CTR"""
    if not title:
        return {}
    clean_title = title.strip()
    lower = clean_title.lower()

    drivers = []
    if re.search(r'why .* never|why you should never|never do this|stop doing|avoid|don\'t|mistake', lower):
        drivers.append({"name": "Loss Aversion / Anti-Pattern", "impact": "Kich hoat tam ly so sai lam va tu ve sinh ton"})
    if re.search(r'how (i|he|she|they|one|this|we) (made|built|earned|became|turned|escaped|survived|scaled)', lower):
        drivers.append({"name": "Transformation / Case Study Blueprint", "impact": "Bang chung nguoi that viec that, kich thich khat vong"})
    if re.search(r'secret|hidden|truth about|what they (don\'t|won\'t) tell you|conspiracy|monopoly|classified|forbidden|exposed', lower):
        drivers.append({"name": "Hidden Architecture / Institutional Monopoly", "impact": "Tao cam giac tiep can thong tin bi gioi tinh hoa che giau"})
    if re.search(r'before it\'s too late|warning|urgent|is over|dying|collapse|crisis|ruined', lower):
        drivers.append({"name": "Existential Threat / Impending Doom", "impact": "Tao ap luc thoi gian va nguy co sinh ton cap bach"})
    if re.search(r'\b(vs|versus|compared to)\b|\d+ (things|reasons|mistakes|rules|secrets|steps|stages)', lower):
        drivers.append({"name": "Structured Benchmarking / Cognitive Ease", "impact": "Cung cap khung so sanh ro rang, giam tai nhan thuc"})
    if re.search(r'the dark (side|truth)|disturbing|mystery|unsolved|vanished|haunting|bizarre', lower):
        drivers.append({"name": "Morbid Curiosity / Unresolved Paradox", "impact": "Khai thac su hieu ky doi voi cac nghich ly chua co loi giai"})
    if re.search(r'nobody talks about|everyone is wrong|the myth of|lies you were told|debunk', lower):
        drivers.append({"name": "Authority Inversion / Myth Debunking", "impact": "Thach thuc chan ly so dong, tao cu soc dinh kien"})
    if re.search(r'\b(\d+ (days|hours|years|months))\b|from zero to|in 24 hours', lower):
        drivers.append({"name": "Timeline Compression / Extreme Feat", "impact": "Do dac no luc tren thuoc do thoi gian sieu nen"})
    if re.search(r'the most dangerous|deepest|wealthiest|scariest|coldest|hottest|extreme', lower):
        drivers.append({"name": "Absolute Superlative / Scale Shock", "impact": "Kich hoat cam giac choang ngop truoc quy mo cuc dai"})
    if re.search(r'the real reason|what actually happened|the story of how', lower):
        drivers.append({"name": "Information Asymmetry / Open Loop", "impact": "Mo ra khoang trong thong tin khien khan gia phai nhap vao"})

    if not drivers:
        drivers.append({"name": "Descriptive Narrative / Subject Exposition", "impact": "Trinh bay truc dien chu the (Phu hop kenh giao duc)"})

    syntactic = []
    if re.search(r'[()]', clean_title):
        syntactic.append("Parenthetical Hook (Dau ngoac don bat mi goc khuat)")
    if re.search(r'[\[\]]', clean_title):
        syntactic.append("Bracket Qualifier (Dau ngoac vuong dong khung dinh dang)")
    if re.search(r':\s+', clean_title):
        syntactic.append("The Colonic Pivot (Chu the : Cu ngoat kich tinh)")
    if re.search(r'\?', clean_title):
        syntactic.append("Interrogative Tension (Dau hoi cham tao ap luc tim dap an)")
    if re.search(r'\d+', clean_title):
        syntactic.append("Numerical Anchoring (Con so cu the tao do tin cay)")

    len_title = len(clean_title)
    score = 50
    if 38 <= len_title <= 58:
        score += 18
    elif len_title < 30:
        score += 5
    elif len_title > 70:
        score -= 12

    if re.search(r'\d+', clean_title):
        score += 10
    if re.search(r'[()\[\]]', clean_title):
        score += 8
    if len(drivers) >= 2:
        score += 14
    elif len(drivers) == 1 and drivers[0]["name"] != "Descriptive Narrative":
        score += 8
    score = min(99, max(35, score))

    template = re.sub(r'\b\d+([,.]\d+)?\s*(k|m|b|usd|\$|%|years|days|hours)?\b', '{{NUMBER}}', clean_title, flags=re.I)
    template = re.sub(r'\b(Elon Musk|MrBeast|Apple|Google|Microsoft|China|US|USA|Vietnam|Japan|Korea|Rome|Egypt|Hitler|Stalin|Caesar|Einstein)\b', '{{ENTITY}}', template, flags=re.I)

    base_topic = re.sub(r'^(the|how|why|what|when)\s+', '', clean_title, flags=re.I)
    base_topic = re.sub(r'\([^)]*\)|\[[^\]]*\]', '', base_topic).strip()

    variants = [
        f"Why {base_topic} Made Everything Worse (The Unseen Cost)",
        f"The Hidden Monopoly Behind {base_topic} (Exposed)",
        f"Never Touch {base_topic} Until You Watch This",
        f"The Terrifying Scale of {base_topic} Nobody Understands",
        f"What Actually Happened to {base_topic}?"
    ]

    return {
        "originalTitle": clean_title,
        "characterCount": len_title,
        "mobileStatus": "Chuan Mobile (<=58 ky tu)" if len_title <= 58 else "Nguy co bi cat [...] tren dien thoai",
        "identifiedCognitiveDrivers": drivers,
        "syntacticMechanisms": syntactic,
        "ctrPotentialScore": f"{score}/100",
        "structuralFormula": template,
        "adaptiveVariations": variants,
        "h2devSynergyRule": "Tieu de neu Boi canh/Nghich ly; Thumbnail dua ra Hinh anh gay soc/Cau chu <4 tu. KHONG lap lai tieu de tren anh bia!"
    }

def forecast_avd_and_retention(duration_seconds, word_count=0):
    """[TubeLab-Tier] Dự báo AVD mục tiêu, nhịp WPM và các mốc giữ chân khán giả"""
    dur_min = round(duration_seconds / 60.0, 1)
    effective_words = word_count if word_count > 0 else round(dur_min * 135)
    wpm = round(effective_words / max(0.1, dur_min))

    if dur_min < 5:
        target_pct = 65
    elif dur_min <= 12:
        target_pct = 50
    elif dur_min <= 20:
        target_pct = 42
    else:
        target_pct = 35

    target_sec = round(duration_seconds * (target_pct / 100.0))
    target_formatted = f"{target_sec // 60}m {target_sec % 60}s"

    wpm_status = "Chuan muc (Optimal Pacing: 125-150 WPM)"
    if wpm < 100:
        wpm_status = "Cham (Chi phu hop ngach Ru ngu / Phim tai lieu)"
    elif wpm > 175:
        wpm_status = "Qua don dap (Khuyen nghi giam nhip de khong rot view)"

    return {
        "videoDuration": f"{dur_min} phut ({duration_seconds}s)",
        "estimatedWordCount": effective_words,
        "calculatedWpm": wpm,
        "wpmStatus": wpm_status,
        "targetAvdForAlgorithm": f"{target_pct}% ({target_formatted})",
        "retentionMilestones": [
            {"timestamp": "00:00 - 00:15", "target": ">= 75%", "goal": "Hook nghich ly, khong chao hoi"},
            {"timestamp": "00:60 - 01:30", "target": ">= 60%", "goal": "Mini-cliffhanger reset su chu y"},
            {"timestamp": "50% video", "target": ">= 45%", "goal": "Mid-point re-hook loi hua dau video"},
            {"timestamp": "Phan ket", "target": ">= 35%", "goal": "Evergreen takeaway khong dong dai"}
        ]
    }

def analyze_channel_cadence(videos):
    """[Velocity Radar] Do nhip do dang video, van toc VPH va nguy co huy YPP 180 ngay"""
    if not videos or len(videos) < 2:
        return {"status": "Insufficient data"}

    sorted_vids = sorted(videos, key=lambda x: x['publishedAt'], reverse=True)
    intervals = []
    for i in range(len(sorted_vids) - 1):
        d1 = datetime.fromisoformat(sorted_vids[i]['publishedAt'].replace('Z', '+00:00'))
        d2 = datetime.fromisoformat(sorted_vids[i+1]['publishedAt'].replace('Z', '+00:00'))
        intervals.append(abs((d1 - d2).total_seconds()) / 86400.0)

    avg_interval = round(sum(intervals) / len(intervals), 1)
    latest_dt = datetime.fromisoformat(sorted_vids[0]['publishedAt'].replace('Z', '+00:00'))
    now = datetime.now(timezone.utc)
    days_since_latest = round((now - latest_dt).total_seconds() / 86400.0)

    policy_risk = "SAFE (Active Cadence)"
    rating = "Deu dan (High Consistency)"

    if days_since_latest > 180:
        policy_risk = "NGUY CO CAO (Vuot nguong 180 ngay khong dang - YouTube co the huy bat kiem tien YPP)"
        rating = "Bo kenh / Dong bang (Dormant)"
    elif days_since_latest > 60:
        policy_risk = "CANH BAO (Kenh chung dang tren 60 ngay - Giam de xuat Browse/Suggested)"
        rating = "Cham nhip (Slacking)"
    elif avg_interval <= 4:
        rating = "Tan suat cao (2-3 video/tuan)"
    elif avg_interval <= 8:
        rating = "Tan suat chuan (1 video/tuan)"

    return {
        "latestUploadDate": sorted_vids[0]['publishedAt'],
        "daysSinceLatest": days_since_latest,
        "averageDaysBetweenUploads": f"{avg_interval} ngay/video",
        "cadenceRating": rating,
        "policyHealthStatus": policy_risk,
        "sampleSize": len(sorted_vids)
    }

GLOBAL_GEO_INDEX = {
    # Tier 1 Alpha (Thị trường quảng cáo đắt đỏ nhất thế giới - Chuẩn Mediacube 2026, Lenos 2026)
    "au": 1.10, "us": 1.00, "ca": 0.89, "nz": 0.86, "ch": 0.78, "no": 0.72,
    "uk": 0.66, "gb": 0.66, "de": 0.58, "ie": 0.56, "nl": 0.54, "sg": 0.54,
    "dk": 0.53, "hk": 0.52, "at": 0.51, "se": 0.48, "fr": 0.45,
    # Đông Á phát triển & Trung Đông
    "jp": 0.48, "kr": 0.46, "ae": 0.40, "uae": 0.40, "sa": 0.35,
    # Châu Âu mới & Mỹ Latinh
    "pl": 0.25, "cz": 0.25, "br": 0.15, "mx": 0.16, "tr": 0.08,
    # Thị trường dân số lớn Đông Nam Á & Nam Á
    "in": 0.09, "vn": 0.07, "th": 0.07, "ph": 0.05, "id": 0.05, "pk": 0.04, "bd": 0.03
}

COUNTRY_ALIASES = {
    "japan": "jp", "south korea": "kr", "korea": "kr", "canada": "ca", "philippines": "ph",
    "vietnam": "vn", "united states": "us", "usa": "us", "united kingdom": "uk", "britain": "uk",
    "germany": "de", "australia": "au", "norway": "no", "switzerland": "ch", "singapore": "sg",
    "brazil": "br", "mexico": "mx", "india": "in", "indonesia": "id", "thailand": "th"
}

def predict_niche_rpm(niche_query, monthly_views, target_audience=None, tier1_pct=60, duration_minutes=12, season="baseline", custom_base_rpm=None):
    """[Universal Open AdSense Engine] Du doan RPM va doanh thu quang cao cho BAT KY ngach & BAT KY quoc gia tren the gioi"""
    input_lower = (niche_query or "").lower().strip()

    # 1. Resolve Geographic Multiplier (Single country, Blend, or Fallback)
    geo_factor = 1.0
    geo_desc = ""

    if isinstance(target_audience, list) and target_audience:
        total_share = 0.0
        weighted_sum = 0.0
        details = []
        for item in target_audience:
            raw_c = (item.get("country") or "").lower().strip()
            c = COUNTRY_ALIASES.get(raw_c, raw_c)
            s = float(item.get("share", 0.0))
            coeff = GLOBAL_GEO_INDEX.get(c, 0.45)
            weighted_sum += s * coeff
            total_share += s
            details.append(f"{c.upper()}: {round(s*100)}%")
        geo_factor = round(weighted_sum / total_share, 2) if total_share > 0 else 0.85
        geo_desc = f"Hon hop khan gia [{', '.join(details)}] -> He so Geo: {geo_factor}x"
    elif isinstance(target_audience, str) and target_audience.strip():
        raw_str = target_audience.lower().strip()
        if ":" in raw_str or "," in raw_str:
            parts = re.split(r'[,;]', raw_str)
            total_share = 0.0
            weighted_sum = 0.0
            details = []
            for p in parts:
                if ":" in p:
                    c_raw, s_raw = p.split(":", 1)
                    c = COUNTRY_ALIASES.get(c_raw.strip(), c_raw.strip())
                    s = float(s_raw.strip())
                    coeff = GLOBAL_GEO_INDEX.get(c, 0.45)
                    weighted_sum += s * coeff
                    total_share += s
                    details.append(f"{c.upper()}: {s}%")
            geo_factor = round(weighted_sum / total_share, 2) if total_share > 0 else 0.85
            geo_desc = f"Hon hop khan gia [{', '.join(details)}] -> He so Geo: {geo_factor}x"
        else:
            c = COUNTRY_ALIASES.get(raw_str, raw_str)
            geo_factor = GLOBAL_GEO_INDEX.get(c, 0.50)
            geo_desc = f"Thi truong muc tieu: {c.upper()} -> He so Geo: {geo_factor}x"
    else:
        t1 = max(5, min(100, tier1_pct)) / 100.0
        geo_factor = round(0.25 + t1 * 0.95, 2)
        geo_desc = f"Ty le Tier 1 uoc tinh {round(t1*100)}% -> He so Geo: {geo_factor}x"

    # 2. Continuous Commercial Intent Scoring
    score = 0.35
    detected_vectors = []

    if re.search(r'finance|crypto|bitcoin|invest|trading|real estate|wealth|b2b|saas|insurance|credit card|lawyer|mortgage|banking|ecommerce|forex|stock market', input_lower):
        score += 0.45
        detected_vectors.append("High-Ticket Commercial / B2B Lead Gen")
    if re.search(r'tech|software|ai|machine learning|hardware|engineering|architecture|manufacturing|industrial|medical|defense|aerospace|business|economics|startup|coding|cybersecurity|semiconductor|quantum', input_lower):
        score += 0.25
        detected_vectors.append("Professional Technical / Industrial Knowledge")
    if re.search(r'history|archaeology|civilization|wildlife|nature|philosophy|stoicism|science|space|ocean|deep sea|crime|mystery|biography|geopolitics|origin', input_lower):
        score += 0.10
        detected_vectors.append("Evergreen Documentary / Cultural Narrative")
    if re.search(r'gaming|minecraft|roblox|vlog|comedy|humor|reaction|asmr|music|meme|celebrity|pop culture|prank|entertainment|anime|cooking|food', input_lower):
        score -= 0.15
        detected_vectors.append("Mass Entertainment / Lifestyle")

    coppa_dampener = 1.0
    if re.search(r'kids|children|nursery|toddler|baby|toy|cartoons for children', input_lower):
        coppa_dampener = 0.40
        detected_vectors.append("COPPA Restricted")

    score = min(1.0, max(0.05, score))

    base_low = round((1.5 + (26.5 * (score ** 1.35)) * coppa_dampener), 1)
    base_high = round((4.0 + (56.0 * (score ** 1.35)) * coppa_dampener), 1)

    if custom_base_rpm and custom_base_rpm > 0:
        base_low = round(custom_base_rpm * 0.85, 1)
        base_high = round(custom_base_rpm * 1.25, 1)
        detected_vectors.append(f"Custom Studio Baseline: ${custom_base_rpm}")

    # 3. Continuous Duration & Mid-roll Multiplier
    dur_min = duration_minutes
    if dur_min < 8:
        duration_factor = round(0.50 + 0.05 * (dur_min / 8.0), 2)
        mid_roll_strategy = "Khong co Mid-roll (Chi Pre-roll & Post-roll)"
    elif dur_min <= 20:
        duration_factor = round(1.00 + 0.035 * (dur_min - 8), 2)
        mid_roll_strategy = "Mat do Mid-roll vua (2-3 diem dat quang cao)"
    elif dur_min <= 60:
        duration_factor = round(1.42 + 0.015 * (dur_min - 20), 2)
        mid_roll_strategy = "Mat do Mid-roll cao (Phim tai lieu 4-8 quang cao)"
    else:
        duration_factor = 2.20
        mid_roll_strategy = "Podcast / Livestream (>60m)"

    # 4. Seasonality
    season_factor = 1.0
    s_upper = (season or "baseline").upper()
    if s_upper in ("Q4", "11", "12"):
        season_factor = 1.35
    elif s_upper in ("Q1", "1", "2"):
        season_factor = 0.75

    adj_low = round(base_low * geo_factor * duration_factor * season_factor, 1)
    adj_high = round(base_high * geo_factor * duration_factor * season_factor, 1)

    views = max(1000, monthly_views or 100000)
    rev_low = round((views / 1000.0) * adj_low)
    rev_high = round((views / 1000.0) * adj_high)

    return {
        "nicheQuery": niche_query,
        "commercialIntentScore": f"{round(score*100)}/100",
        "detectedVectors": detected_vectors,
        "geographicFactors": {
            "targetAudience": target_audience or f"Tier 1: {tier1_pct}%",
            "geoMultiplier": f"{geo_factor}x",
            "description": geo_desc
        },
        "productionFactors": {
            "durationMinutes": dur_min,
            "durationMultiplier": f"{duration_factor}x",
            "midRollStrategy": mid_roll_strategy,
            "seasonality": f"{season_factor}x ({s_upper})"
        },
        "calibratedRpmRange": f"${adj_low} - ${adj_high} / 1.000 luot xem",
        "estimatedMonthlyAdSense": f"${rev_low:,} - ${rev_high:,} / thang (Voi {views:,} views)",
        "sponsorshipViability": "Xuat sac ($1,500-$4,000/deal)" if rev_high >= 5000 else "Kha ($500-$1,500/deal)" if rev_high >= 2000 else "Tiem nang trung binh"
    }

def deconstruct_thumbnail_vision(thumbnail_url, video_title="", ocr_text=""):
    """[1of10-Tier Thumbnail Vision] Kiem toan bo cuc 3 diem vang 65%, tuong phan va ti le chu tren anh bia"""
    words = [w for w in ocr_text.strip().split() if w]
    word_count = len(words) if ocr_text else None

    if word_count is not None:
        if word_count <= 4:
            readability = f"Hoan hao ({word_count} tu - Cuc ky de doc tren mobile)"
        elif word_count <= 6:
            readability = f"Trung binh ({word_count} tu - Nguy co roi mat tren man hinh nho)"
        else:
            readability = f"Bao dong ({word_count} tu - Qua nhieu chu! Lam loang diem nhan thi giac)"
    else:
        readability = "Chua cung cap text OCR tren anh"

    synergy_rating = "Tot (Dat tieu chuan bu tru)"
    synergy_advice = "Thumbnail va Tieu de phoi hop tot."
    if video_title and ocr_text:
        title_lower = video_title.lower()
        overlap = [w for w in words if len(w) > 3 and w.lower() in title_lower]
        if len(overlap) >= 2:
            synergy_rating = "Canh bao Lap lai (Anti-Pattern)"
            synergy_advice = f"Thumbnail dang lap lai tu tren Tieu de: [{', '.join(overlap)}]. Quy tac H2DEV: Tieu de neu Boi canh; Thumbnail dua ra Cam xuc/Cu ngoat <4 tu!"

    return {
        "thumbnailUrl": thumbnail_url,
        "videoTitle": video_title,
        "textReadability": {
            "ocrText": ocr_text or "Khong co text",
            "wordCount": word_count,
            "status": readability
        },
        "titleThumbnailSynergy": {
            "rating": synergy_rating,
            "advice": synergy_advice
        },
        "goldenZoneRule": {
            "safeFocalArea": "65% dien tich ben TRAI va TRUNG TAM la vung an toan thi giac cao nhat.",
            "timecodeBadgeWarning": "CANH BAO GOC PHAI DUOI: YouTube luon de phu hieu thoi luong (Timecode Badge). Tuyet doi khong dat chu hoac mat tai day!"
        },
        "visualArchetypes": [
            "Face-Centric Reaction (Cam xuc khuon mat cuc han)",
            "Scale Disparity (Chenh lech quy mo khong lo vs ti hon)",
            "Curiosity Anomaly (Vat the nghich ly / Bat thuong)",
            "Cinematic Split (Chia doi 50/50 Truoc vs Sau)",
            "Documentary Minimalist (Tong mau toi hoai co Chiaroscuro)"
        ]
    }

def generate_seo_tag_matrix(seed_keyword, competitor_tags=None):
    """[Keywords Everywhere & vidIQ Killer] Kien truc The 3-Tier tu dong nén duoi 500 ky tu cho YouTube Studio"""
    seed = (seed_keyword or "").strip()
    competitor_tags = competitor_tags or []

    auto_suggestions = suggest_keywords(seed)
    soup = []
    for p in ["how", "why", "what", "best", "explained"]:
        soup.extend(suggest_keywords(f"{seed} {p}"))

    raw = auto_suggestions + soup
    seed_words = seed.split()
    tier1 = [seed, " ".join(seed_words[:2]), "documentary", "explained", "history"]
    tier2 = [s for s in raw if 2 <= len(s.split()) <= 3 and s != seed][:8]
    tier3 = [s for s in raw if len(s.split()) >= 4][:10]

    seen = set()
    deduped = []
    for t in tier1 + tier2 + tier3 + competitor_tags[:10]:
        cl = t.strip().lower()
        if cl and cl not in seen and len(cl) <= 40:
            seen.add(cl)
            deduped.append(t.strip())

    packed = []
    cur_len = 0
    for t in deduped:
        if cur_len + len(t) + 2 <= 495:
            packed.append(t)
            cur_len += len(t) + 2
        else:
            break

    copy_str = ", ".join(packed)
    return {
        "seedKeyword": seed,
        "totalTags": len(packed),
        "characterCount": len(copy_str),
        "youtubeStudioLimit": f"{len(copy_str)}/500 ky tu (Chuan 100% khong bao do)",
        "threeTierArchitecture": {
            "tier1RootAnchors": tier1[:4],
            "tier2TopicContext": tier2[:6],
            "tier3HumanQueries": tier3[:8]
        },
        "packedTagList": packed,
        "oneClickCopyString": copy_str
    }

def detect_viral_shorts_highlights(transcript_text, max_clips=4):
    """[OpusClip & Klap Killer] Boc tach doan 30-50s Shorts viral tu transcript video dai"""
    if not transcript_text:
        return {"error": "Transcript text is required"}

    sentences = [s.strip() for s in re.split(r'(?<=[.?!])\s+', transcript_text.replace('\n', ' ')) if s.strip()]
    if len(sentences) < 5:
        return {"error": "Transcript is too short"}

    candidate_clips = []
    target_words = 75
    cur_words = []
    clip_idx = 1

    for i, s in enumerate(sentences):
        words = s.split()
        cur_words.extend(words)

        if len(cur_words) >= target_words or i == len(sentences) - 1:
            chunk = " ".join(cur_words)
            w_count = len(cur_words)
            sec = round((w_count / 135.0) * 60)

            score = 50
            hook_type = "Story Narrative"
            if "?" in chunk:
                score += 15
                hook_type = "Curiosity Gap / Question"
            if re.search(r'\b(secret|never|shocking|insane|died|killed|mystery|money|billion|dollar|truth|warning)\b', chunk, re.I):
                score += 18
            if re.search(r'\d+', chunk):
                score += 10
            if re.search(r'suddenly|however|but then|little did they know', chunk, re.I):
                score += 12
                hook_type = "Twist Plot"

            candidate_clips.append({
                "clipId": f"SHORT_CLIP_#{clip_idx}",
                "estimatedDuration": f"{sec}s",
                "wordCount": w_count,
                "viralScore": f"{min(98, score)}/100",
                "hookType": hook_type,
                "scriptSnippet": chunk[:240] + ("..." if len(chunk) > 240 else ""),
                "suggestedTitle": f"The Shocking Truth About: {chunk[:40]}..."
            })
            clip_idx += 1
            cur_words = []

    ranked = sorted(candidate_clips, key=lambda x: int(x['viralScore'].split('/')[0]), reverse=True)[:max_clips]
    return {
        "totalSentencesSampled": len(sentences),
        "shortsExtracted": len(ranked),
        "topViralShorts": ranked
    }

if __name__ == '__main__':
    print('=== TEST H2DEV FREE YOUTUBE INTELLIGENCE ENGINE ===')
    info = get_channel_info('@HiddenPlanetDocs')
    print('Channel Info:', json.dumps(info, indent=2, ensure_ascii=False))

    if info.get('channelId'):
        rss_vids = get_channel_rss(info['channelId'])
        analyzed = calculate_outliers(rss_vids)
        print(f'\nFetched {len(analyzed)} latest videos with Real Views & VPH:')
        for v in analyzed[:5]:
            title = v['title'][:45]
            views = v['views']
            vph = v['vph']
            score = v['outlierScore']
            is_out = v['isOutlier']
            print(f" - {title} | Views: {views} | VPH: {vph} | Outlier: {score}x (IsOutlier: {is_out})")

    suggs = suggest_keywords('ancient lost civilizations')
    print('\nYouTube Autocomplete Suggestions:', suggs[:5])
