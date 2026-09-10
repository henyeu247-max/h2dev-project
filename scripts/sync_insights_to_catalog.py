# -*- coding: utf-8 -*-
"""
sync_insights_to_catalog.py
Đồng bộ các nhãn ngách, thị trường, actual_topic chuẩn xác 100% từ video_insights.json
sang:
- data/catalog_full.json
- data/catalog.json
- data-tabs/videos.json
"""

import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
DATA_TABS_DIR = os.path.join(ROOT, 'data-tabs')

def main():
    insights_path = os.path.join(DATA_DIR, 'video_insights.json')
    cat_full_path = os.path.join(DATA_DIR, 'catalog_full.json')
    cat_path = os.path.join(DATA_DIR, 'catalog.json')
    videos_tab_path = os.path.join(DATA_TABS_DIR, 'videos.json')

    if not os.path.exists(insights_path):
        print("Lỗi: Không tìm thấy file video_insights.json.")
        return

    with open(insights_path, 'r', encoding='utf-8') as f:
        insights = json.load(f)

    # 1. Sync catalog_full.json
    if os.path.exists(cat_full_path):
        with open(cat_full_path, 'r', encoding='utf-8') as f:
            cat_full = json.load(f)
        for item in cat_full:
            sku = item.get('sku')
            if sku in insights:
                ins = insights[sku]
                item['actual_topic'] = ins.get('actual_topic')
                item['niche_primary'] = ins.get('niche_primary')
                item['target_market'] = ins.get('target_market')
                item['market_code'] = ins.get('market_code')
                if ins.get('channels_mentioned'):
                    item['channels'] = list(dict.fromkeys((item.get('channels') or []) + ins['channels_mentioned']))
        with open(cat_full_path, 'w', encoding='utf-8') as f:
            json.dump(cat_full, f, ensure_ascii=False, indent=2)

    # 2. Sync catalog.json
    if os.path.exists(cat_path):
        with open(cat_path, 'r', encoding='utf-8') as f:
            cat = json.load(f)
        for item in cat:
            sku = item.get('sku')
            if sku in insights:
                ins = insights[sku]
                item['actual_topic'] = ins.get('actual_topic')
                item['niche_primary'] = ins.get('niche_primary')
                item['target_market'] = ins.get('target_market')
                item['market_code'] = ins.get('market_code')
        with open(cat_path, 'w', encoding='utf-8') as f:
            json.dump(cat, f, ensure_ascii=False, indent=2)

    # 3. Sync data-tabs/videos.json
    if os.path.exists(videos_tab_path):
        with open(videos_tab_path, 'r', encoding='utf-8') as f:
            tab_videos = json.load(f)
        for item in tab_videos:
            sku = item.get('sku')
            if sku in insights:
                ins = insights[sku]
                item['contentNiche'] = ins.get('niche_primary')
                item['niche'] = ins.get('niche_primary')
                
                # Format market badge
                m_code = ins.get('market_code')
                if m_code == 'JP':
                    item['market'] = ["🇯🇵 Nhật"]
                elif m_code == 'KR':
                    item['market'] = ["🇰🇷 Hàn"]
                elif m_code == 'VN':
                    item['market'] = ["🇻🇳 Việt"]
                elif m_code == 'CN':
                    item['market'] = ["🇨🇳 Trung"]
                elif m_code == 'US':
                    item['market'] = ["🇺🇸 Mỹ / Ngoại"]
                else:
                    item['market'] = ["🌐 Ngoại"]

                if ins.get('channels_mentioned'):
                    item['channels'] = list(dict.fromkeys((item.get('channels') or []) + ins['channels_mentioned']))

        with open(videos_tab_path, 'w', encoding='utf-8') as f:
            json.dump(tab_videos, f, ensure_ascii=False, indent=2)

    print(f"✅ Đã đồng bộ hoàn chỉnh dữ liệu ngách & thị trường thực chiến sang toàn bộ hệ thống JSON!")

if __name__ == '__main__':
    main()
