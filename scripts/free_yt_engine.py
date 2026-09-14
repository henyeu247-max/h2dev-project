#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
H2DEV Free YouTube Intelligence Engine
Thay thế 100% vidIQ: Không tốn credit, Không cần API key, Chạy trực tiếp qua RSS & InnerTube
"""

import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import json
import re
from datetime import datetime, timezone

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
