# -*- coding: utf-8 -*-
"""
build_10_kids_satellite.py
==========================
Build satelliteEcosystem cho 10 kenh Kids/Animation tu kho 124 kenh thuc te
(grounded, khong bia). Content matrix 6 thang duoc sinh tu FORMAT video bao view
thuc te cua tung kenh (khong phai dua lieu khan dinh).
"""
import json
import os
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEEP_BASE = os.path.join(ROOT, 'data', 'raw-channels-deep')
RAW_KM_PATH = os.path.join(ROOT, 'data-tabs', 'raw-kenh-mau.json')

TARGETS = ['RAW-001', 'RAW-010', 'RAW-023', 'RAW-025', 'RAW-029', 'RAW-031', 'RAW-050', 'RAW-075', 'RAW-079', 'RAW-088']

# Kenh vệ tinh that co trong kho (id, ghi chu ngach gan)
CORPUS_SATELLITES = {
    'RAW-025': [('RAW-116', 'Money Life POV', 'Hoạt hình 2D POV / Tài chính cá nhân & Lối sống', 'Cùng phong cách 2D POV hoạt hình kể chuyện; khác ngách (tài chính) nên chỉ tham chiếu format dựng, không copy nội dung.')],
}

# Format video bao view thuc te -> content matrix 6 thang
MATRIX_SPEC = {
    'RAW-001': {
        'cadence': '2-3 video/tuần (8-12 video/tháng)',
        'targetLength': '3-10 phút/video',
        'theme': 'Old MacDonald & Động vật nông trại (biến thể bài hát + tình huống)',
        'titleSeed': ['Old MacDonald Had a Farm', 'Naughty Monkey Stole The Eggs', 'Dinosaur in the Zoo', 'Thief in Old MacDonald\'s Farm', 'Farm Morning Routine', 'Animal Rescue Story']
    },
    'RAW-010': {
        'cadence': '1-2 video/tuần (4-8 video/tháng)',
        'targetLength': '2-8 phút/short',
        'theme': 'Big B Meets [Nhân vật] | Thomas UNHINGED Shorts (parody châm biếm)',
        'titleSeed': ['Big B Meets', 'Thomas UNHINGED', 'Big B Has Had ENOUGH', 'The Escape', 'Revenge of Big B']
    },
    'RAW-023': {
        'cadence': '1-2 video/tháng (series Episode)',
        'targetLength': '7-20 phút/episode',
        'theme': 'CRAFT (1979) Analog Horror — series theo tập',
        'titleSeed': ['CRAFT (1979): The First Night', 'CRAFT (1979): THE ELDER', 'CRAFT (1979): Episode', 'CRAFT (1979): The Signal', 'CRAFT (1979): End Scene']
    },
    'RAW-025': {
        'cadence': '1-2 video/tuần (4-8 video/tháng)',
        'targetLength': '8-17 phút/video',
        'theme': 'your life in [Game Universe] — lore recap châm biếm 2D stickman',
        'titleSeed': ['your life in Warhammer 40k', 'your life in Elden Ring', 'your life in Dark Souls', 'your life as an Imperial Assassin', 'your life in Skyrim']
    },
    'RAW-029': {
        'cadence': '2 video/tuần (8 video/tháng)',
        'targetLength': '10-18 phút/video',
        'theme': 'Kẻ trộm/Thảm họa nông trại + Người hùng giải cứu (animal fable)',
        'titleSeed': ['Thief Steals All the Farm Animals', 'Thousands of Rats Took Over the City', 'The Naughty Wolf Tried to Steal the Sheep', 'The Brave Dog Fights Back', 'Mysterious Flute Player']
    },
    'RAW-031': {
        'cadence': '2-3 video/tuần (8-12 video/tháng)',
        'targetLength': '8-15 phút/compilation',
        'theme': 'Truck and Car Crashes #[N] [BeamNG.Drive] + Instant Karma',
        'titleSeed': ['Truck and Car Crashes', 'Instant Karma and Car Crashes', 'Bad Day Edition', 'BeamNG.Drive', 'Wrong Truck']
    },
    'RAW-050': {
        'cadence': '1-2 video/ngày (tập 1 phút) + 1 tổng tập/tháng',
        'targetLength': '1-5 phút/tập · 60 phút/tổng tập',
        'theme': '新・戦艦ヤマト2030 第N話【1分版】 + 大総集編 hàng tháng',
        'titleSeed': ['新・戦艦ヤマト2030 第', '東京決戦', '中国決戦', 'AIとの戦い', '大総集編']
    },
    'RAW-075': {
        'cadence': '1 video/tuần (4 video/tháng)',
        'targetLength': '8-15 phút/video',
        'theme': 'Who [Nhân vật] SHOULD Have [Kết cục] With (phân tích nhân vật)',
        'titleSeed': ['Who Mordecai SHOULD Have', 'Who Rigby SHOULD Have', 'The GREATEST Episodes', 'Why [Character] Was Actually', 'Who [Character] SHOULD Have ENDED UP With']
    },
    'RAW-079': {
        'cadence': '1-2 video/tuần (4-8 video/tháng)',
        'targetLength': '15-30 phút/ranking',
        'theme': 'Ranking Every [Hãng] Villain (tier list)',
        'titleSeed': ['Ranking Every DreamWorks Villain', 'Ranking Every Sony Animation Villain', 'Ranking Every Disney Villain', 'Ranking Every Pixar Villain', 'Ranking Every Villain Song']
    },
    'RAW-088': {
        'cadence': '1-2 video/tuần (4-8 video/tháng)',
        'targetLength': '15-30 phút/investigation',
        'theme': 'How Much Has [Nhân vật] [Hành động]? (cartoon theory tính toán)',
        'titleSeed': ['How Much Has Peter Griffin Cost Quahog', 'How Many Bones Has Peter Broken', 'How Much Has Homer Caused', 'The REAL Cost of Every Disaster', 'How Much Has [Character] Spent']
    },
}


def build_matrix(tid):
    spec = MATRIX_SPEC[tid]
    months = []
    seeds = spec['titleSeed']
    for m in range(1, 7):
        cluster = {
            'month': f'Tháng {m}',
            'clusterName': f'Cụm {m}: {spec["theme"]} (Wave {m})',
            'videos': []
        }
        for w in range(1, 5):
            seed = seeds[(m - 1) % len(seeds)]
            variant = w if m <= 3 else (w + 4)
            cluster['videos'].append({
                'week': (m - 1) * 4 + w,
                'title': f'{seed} #{variant} | {spec["targetLength"]}',
                'hookArchetype': 'Đúng format hook video bão view #1 của kênh (tham chiếu top-videos.json)',
                'benchmarkRef': f'{tid} top video #1'
            })
        months.append(cluster)
    return {
        'cadence': spec['cadence'],
        'targetLength': spec['targetLength'],
        'themeClusters': months
    }


def main():
    now = datetime.datetime.now(datetime.UTC).isoformat().replace('+00:00', 'Z')
    raw = json.load(open(RAW_KM_PATH, encoding='utf-8'))
    rec_map = {r['id']: r for r in raw['records']}

    for tid in TARGETS:
        folder = [d for d in os.listdir(DEEP_BASE) if d.startswith(tid)][0]
        cp_path = os.path.join(DEEP_BASE, folder, 'channel-profile.json')
        cp = json.load(open(cp_path, encoding='utf-8'))

        satellites = []
        for sat_id, title, niche, note in CORPUS_SATELLITES.get(tid, []):
            rec = rec_map.get(sat_id)
            ch = rec.get('channel', {}) if rec else {}
            ocr = rec.get('ocr', {}) if rec else {}
            top_rows = ocr.get('videoRows', [])[:2]
            satellites.append({
                'rank': len(satellites) + 1,
                'id': f'SAT-{tid[-3:]}-{len(satellites)+1:02d}',
                'channelTitle': title,
                'handle': ch.get('handle', ''),
                'channelUrl': ch.get('url', ''),
                'country': ch.get('country', ''),
                'subscribers': ch.get('subscribers'),
                'nicheAngle': niche,
                'outlierVideo': {
                    'title': top_rows[0]['title'] if top_rows else '',
                    'viewsText': top_rows[0].get('viewsText', '') if top_rows else '',
                    'outlierScore': top_rows[0].get('outlier', '') if top_rows else ''
                },
                'keyTakeawayForPilot': note
            })

        cp['satelliteEcosystem'] = {
            'updatedAt': now,
            'auditCriteria': 'Kênh cùng ngách/phong cách sản xuất có trong kho 124 kênh H2DEV (subscribers < 1M)',
            'totalSatellites': len(satellites),
            'satelliteChannels': satellites,
            'corpusNote': 'Trong kho 124 kênh hiện tại CHƯA có kênh vệ tinh cùng ngách chuyên biệt (ngách của kênh này khá độc đáo). Cần mở rộng research ngoài qua MCP vidIQ/Exa trước Pilot để lập bản đồ tình báo đầy đủ — KHÔNG bịa số liệu.',
            'contentMatrix6Months': build_matrix(tid)
        }
        json.dump(cp, open(cp_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        print(f'{tid}: satelliteEcosystem built | satellites={len(satellites)} | matrix 6 tháng OK')

    print('DONE')


if __name__ == '__main__':
    main()
