# -*- coding: utf-8 -*-
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_KM_PATH = os.path.join(ROOT, 'data-tabs', 'raw-kenh-mau.json')
DEEP_BASE = os.path.join(ROOT, 'data', 'raw-channels-deep')

LIVE_UPDATES = {
    'RAW-001': {
        'subs': 114000,
        'videoCount': 4,
        'country': 'US',
        'latestUploadDate': '2026-09-15',
        'daysSinceLatest': 1,
        'healthStatus': 'ACTIVE',
        'healthBadge': '🟢 Đang hoạt động (Ra video 1 ngày trước)',
        'monetizationStatus': 'MONETIZED_ACTIVE',
        'monetizationBadge': 'Bật kiếm tiền (YPP Active)',
        'monetizationAdvisory': 'Kênh hoạt động trở lại ngày 15/09/2026 với bài hát Farm Morning Routine (8.2K views). Lọc bớt video cũ từ 7 xuống 4 video để tối ưu CTR. Cần giữ nhịp đăng 2-3 video 3D mầm non/tháng để duy trì đà đề xuất.',
        'latestVideo': {
            'videoId': '7IVc5MrRzI0',
            'title': 'Farm Morning Routine | 3D Cartoon for Kids | Old MacDonald Had a Farm 🐄 Animal Song & Animal Sounds',
            'publishedAt': '2026-09-15T14:45:40Z',
            'views': 8277
        }
    },
    'RAW-010': {
        'subs': 285000,
        'videoCount': 110,
        'country': 'US',
        'latestUploadDate': '2026-08-08',
        'daysSinceLatest': 39,
        'healthStatus': 'ACTIVE',
        'healthBadge': '🟢 Đang hoạt động (Ra video 39 ngày trước)',
        'monetizationStatus': 'MONETIZED_ACTIVE',
        'monetizationBadge': 'Bật kiếm tiền (YPP Active)',
        'monetizationAdvisory': 'Kênh parody Thomas the Tank Engine đạt 3.1M views cho video Big B gần nhất (08/08/2026). Sức hút mạnh trong ngách unhinged animated shorts.',
        'latestVideo': {
            'videoId': '0phXPxGpoXg',
            'title': 'Big B Meets Angélique Magnifique | Thomas UNHINGED Shorts',
            'publishedAt': '2026-08-08T00:00:33Z',
            'views': 3170703
        }
    },
    'RAW-023': {
        'subs': 225000,
        'videoCount': 21,
        'country': 'US',
        'latestUploadDate': '2026-09-14',
        'daysSinceLatest': 2,
        'healthStatus': 'ACTIVE',
        'healthBadge': '🟢 Đang hoạt động (Ra video 2 ngày trước)',
        'monetizationStatus': 'MONETIZED_ACTIVE',
        'monetizationBadge': 'Bật kiếm tiền (YPP Active)',
        'monetizationAdvisory': 'Kênh Analog Horror CRAFT (1979) ra video mới ngày 14/09/2026 (The Elder - End Scene). Đang là hiện tượng indie animation theo phong cách retro CGI VHS.',
        'latestVideo': {
            'videoId': '3_jTn0LUO3M',
            'title': 'CRAFT (1979): THE ELDER - End Scene',
            'publishedAt': '2026-09-14T18:05:08Z',
            'views': 6577
        }
    },
    'RAW-025': {
        'subs': 183000,
        'videoCount': 30,
        'country': 'US',
        'latestUploadDate': '2026-08-16',
        'daysSinceLatest': 31,
        'healthStatus': 'ACTIVE',
        'healthBadge': '🟢 Đang hoạt động (Ra video 31 ngày trước)',
        'monetizationStatus': 'MONETIZED_ACTIVE',
        'monetizationBadge': 'Bật kiếm tiền (YPP Active)',
        'monetizationAdvisory': 'Kênh 2D stickman lore recap Warhammer 40K & Gaming đạt 438K views cho video Imperial Assassin. Sức sống ổn định.',
        'latestVideo': {
            'videoId': 'IosvVkKa7eM',
            'title': 'Your life as an Imperial Assassin(Warhammer 40k)',
            'publishedAt': '2026-08-16T15:47:11Z',
            'views': 438555
        }
    },
    'RAW-029': {
        'subs': 80500,
        'videoCount': 16,
        'country': 'US',
        'latestUploadDate': '2026-05-25',
        'daysSinceLatest': 114,
        'healthStatus': 'DORMANT_MID',
        'healthBadge': '🟡 Tạm dừng 114 ngày',
        'monetizationStatus': 'MONETIZED_ACTIVE',
        'monetizationBadge': 'Bật kiếm tiền (YPP Active)',
        'monetizationAdvisory': 'Kênh chưa đăng video mới kể từ 25/05/2026 (114 ngày). Kênh có kho tàng 16 video cổ tích thiếu nhi đạt gần 50M view, cần đăng lại trước mốc 180 ngày để tránh rủi ro đánh giá lại YPP.',
        'latestVideo': {
            'videoId': 'W0kDOtrW1-c',
            'title': 'Thousands of Rats Took Over the City Until a Mysterious Flute Player Appeared | Mama Toons',
            'publishedAt': '2026-05-25T11:00:15Z',
            'views': 33138
        }
    },
    'RAW-031': {
        'subs': 955000,
        'videoCount': 97,
        'country': 'BR',
        'latestUploadDate': '2026-09-13',
        'daysSinceLatest': 3,
        'healthStatus': 'ACTIVE',
        'healthBadge': '🟢 Đang hoạt động (Hồi sinh 3 ngày trước)',
        'monetizationStatus': 'MONETIZED_ACTIVE',
        'monetizationBadge': 'Bật kiếm tiền (YPP Active)',
        'monetizationAdvisory': 'Kênh đã trở lại bùng nổ ngày 13/09/2026 với tập Car Crashes #06 (348K views). Phá vỡ chuỗi ngừng đăng cũ, xác nhận sức sống mãnh liệt của ngách BeamNG simulation.',
        'latestVideo': {
            'videoId': 'vVQ8Mw4WowA',
            'title': 'Instant Karma and Car Crashes #06 [BeamNG.Drive]',
            'publishedAt': '2026-09-13T13:10:03Z',
            'views': 348794
        }
    },
    'RAW-050': {
        'subs': 51400,
        'videoCount': 693,
        'country': 'JP',
        'latestUploadDate': '2026-09-15',
        'daysSinceLatest': 1,
        'healthStatus': 'ACTIVE',
        'healthBadge': '🟢 Đang hoạt động (Ra video 1 ngày trước)',
        'monetizationStatus': 'MONETIZED_ACTIVE',
        'monetizationBadge': 'Bật kiếm tiền (YPP Active)',
        'monetizationAdvisory': 'Kênh anime sci-fi Yamato duy trì tần suất đăng cực cao với 693 video, vừa ra tập 250 ngày 15/09/2026. Lượng fan trung thành Nhật Bản rất cao.',
        'latestVideo': {
            'videoId': '_mBRIKvbYSw',
            'title': '「全部、話します」——なぜ漁師の証言は放送されない？｜新・戦艦ヤマト2030 第250話【1分版】',
            'publishedAt': '2026-09-15T10:55:03Z',
            'views': 3562
        }
    },
    'RAW-075': {
        'subs': 11200,
        'videoCount': 32,
        'country': 'US',
        'latestUploadDate': '2026-04-15',
        'daysSinceLatest': 154,
        'healthStatus': 'DORMANT_MID',
        'healthBadge': '🟡 Tạm dừng 154 ngày (Gần ngưỡng 180d)',
        'monetizationStatus': 'MONETIZED_ACTIVE',
        'monetizationBadge': 'Bật kiếm tiền (YPP Active)',
        'monetizationAdvisory': 'Video gần nhất ngày 15/04/2026 (The GREATEST Regular Show Episodes). Kênh đã dừng 154 ngày, đang tiến gần ngưỡng 180 ngày của chính sách YPP.',
        'latestVideo': {
            'videoId': 'jP2JzWsB7CM',
            'title': 'The GREATEST Regular Show Episodes',
            'publishedAt': '2026-04-15T11:42:59Z',
            'views': 14522
        }
    },
    'RAW-079': {
        'subs': 259000,
        'videoCount': 12,
        'country': 'NL',
        'latestUploadDate': '2026-08-28',
        'daysSinceLatest': 19,
        'healthStatus': 'ACTIVE',
        'healthBadge': '🟢 Đang hoạt động (Ra video 19 ngày trước)',
        'monetizationStatus': 'MONETIZED_ACTIVE',
        'monetizationBadge': 'Bật kiếm tiền (YPP Active)',
        'monetizationAdvisory': 'Kênh ranking nhân vật hoạt hình đạt 669K views cho video Sony Animation Villains ngày 28/08/2026. Chỉ với 12 video nhưng đã đạt 259K subs và 25M view.',
        'latestVideo': {
            'videoId': 'z2nviKCdrWg',
            'title': 'Ranking Every Sony Animation Villain',
            'publishedAt': '2026-08-28T14:01:00Z',
            'views': 669687
        }
    },
    'RAW-088': {
        'subs': 335000,
        'videoCount': 209,
        'country': 'US',
        'latestUploadDate': '2026-09-12',
        'daysSinceLatest': 4,
        'healthStatus': 'ACTIVE',
        'healthBadge': '🟢 Đang hoạt động (Hồi sinh 4 ngày trước)',
        'monetizationStatus': 'MONETIZED_ACTIVE',
        'monetizationBadge': 'Bật kiếm tiền (YPP Active)',
        'monetizationAdvisory': 'Kênh đã trở lại ngày 12/09/2026 với video bóc tách Peter Griffin Broken Bones (26.6K views). Phá tan cảnh báo dừng đăng cũ, xác nhận ngách cartoon logic investigation vẫn bão view.',
        'latestVideo': {
            'videoId': '1EE5q-r9n00',
            'title': 'How Many Bones Has Peter Broken?',
            'publishedAt': '2026-09-12T16:07:26Z',
            'views': 26618
        }
    }
}

# 1. Cập nhật file data-tabs/raw-kenh-mau.json
with open(RAW_KM_PATH, 'r', encoding='utf-8') as f:
    raw_km = json.load(f)

for r in raw_km['records']:
    rid = r['id']
    if rid in LIVE_UPDATES:
        up = LIVE_UPDATES[rid]
        ch = r.setdefault('channel', {})
        ch['subscribers'] = up['subs']
        ch['videoCount'] = up['videoCount']
        ch['country'] = up['country']
        
        vA = r.setdefault('vitalityAudit', {})
        vA['healthStatus'] = up['healthStatus']
        vA['healthBadge'] = up['healthBadge']
        vA['latestUploadDate'] = up['latestUploadDate']
        vA['daysSinceLatest'] = up['daysSinceLatest']
        vA['monetizationStatus'] = up['monetizationStatus']
        vA['monetizationBadge'] = up['monetizationBadge']
        vA['monetizationAdvisory'] = up['monetizationAdvisory']
        
        if 'latestVideo' in up:
            r['featuredDemoVideo'] = up['latestVideo']

with open(RAW_KM_PATH, 'w', encoding='utf-8') as f:
    json.dump(raw_km, f, indent=2, ensure_ascii=False)
print('Updated data-tabs/raw-kenh-mau.json successfully.')

# 2. Cập nhật các file deep channel-profile.json
for rid, up in LIVE_UPDATES.items():
    deep_dirs = [d for d in os.listdir(DEEP_BASE) if d.startswith(rid)]
    if not deep_dirs: continue
    cp_path = os.path.join(DEEP_BASE, deep_dirs[0], 'channel-profile.json')
    if os.path.exists(cp_path):
        with open(cp_path, 'r', encoding='utf-8') as f:
            cp = json.load(f)
        cp['subscribers'] = up['subs']
        cp['videoCount'] = up['videoCount']
        cp['country'] = up['country']
        la = cp.setdefault('longevityAudit', {})
        la['sustainabilityStatus'] = up['healthBadge']
        la['lastUploadDate'] = up['latestUploadDate']
        la['daysSinceLastUpload'] = up['daysSinceLatest']
        with open(cp_path, 'w', encoding='utf-8') as f:
            json.dump(cp, f, indent=2, ensure_ascii=False)
print('Updated deep channel-profile.json files successfully.')
