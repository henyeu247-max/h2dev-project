# -*- coding: utf-8 -*-
"""
FACELESS VISION BATCH v4 — Phân loại faceless + niche kênh mẫu, ỔN ĐỊNH cho vận hành dài hạn.

TỔNG KẾT 3 LỖI ĐÃ SỬA QUA CÁC VERSION (đo thật 16/09/2026):
  v1: prompt trộn "có mặt thật" vs "có hình người" → 17 kênh AI-human bị đếm nhầm HAS_FACE
  v2: hỏi cấp 1 ảnh → collage người khác nhau (mugshots, film stills) bị đếm thành presenter
  v3: input là screenshot trang kênh (nhiễu UI/vidIQ) → ca biên dao động giữa các lần chạy
  v4 (BẢN NÀY): 6 thumbnail SẠCH từ RSS + BỎ PHIẾU 2 vòng (tie-break vòng 3) → ổn định & chính xác
                Fallback screenshot gốc khi kênh không có RSS (private/removed).

KIẾN TRÚC:
  - INPUT : 6 thumbnail mới nhất tải qua RSS (i.ytimg.com), cache tại .cache/faceless-vision/thumbs/
  - MODEL : PRIMARY ag/gemini-3.7-flash-low (0.28s/ảnh, dao động ±0.25s — đo A/B interleaved)
            FALLBACK Combo-Gemini-3.7-flash (burst 104 lanes)
  - VOTE  : 2 vòng độc lập; nếu lệch → vòng 3 tie-break, đa số thắng (unanimous / majority)
  - SEMANTICS (cấp KÊNH, code suy diễn — không phụ thuộc model):
      hasRealHumanFace = presenter thật lặp lại trong nhiều thumbnail (talking-head)
      isFaceless       = NOT presenter (hoạt hình / đồ vật / collage người khác / AI-human đều faceless)
      aiGenerated      = thumbnails do AI tạo
      needsReview      = presenter có / confidence thấp / AI lẫn người thật

Dùng:
  python scripts/faceless-vision-batch.py                # chạy kênh còn thiếu (theo checkpoint)
  python scripts/faceless-vision-batch.py --all          # chạy lại toàn bộ (ghi đè)
  python scripts/faceless-vision-batch.py --ids RAW-001,RAW-010
  python scripts/faceless-vision-batch.py --limit 10     # pilot

QUY TẮC DỰ ÁN: backup trước khi ghi data; key đọc từ 9Router DB (KHÔNG hardcode).
"""
import argparse
import base64
import io
import json
import os
import shutil
import sqlite3
import time
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_TABS = os.path.join(ROOT, 'data-tabs', 'raw-kenh-mau.json')
RAW_DIRS = [os.path.join(ROOT, 'raw-kenh-goc'), os.path.join(ROOT, 'assets', 'raw-kenh')]
CACHE_DIR = os.path.join(ROOT, '.cache', 'faceless-vision')
THUMB_CACHE = os.path.join(CACHE_DIR, 'thumbs')
CHECKPOINT = os.path.join(CACHE_DIR, 'checkpoint.json')
DB_9ROUTER = os.path.expanduser(r'~\AppData\Roaming\9router\db\data.sqlite')
BASE_URL = 'http://127.0.0.1:20128/v1/chat/completions'

PRIMARY = 'ag/gemini-3.7-flash-low'
FALLBACK = 'Combo-Gemini-3.7-flash'
LANES = 13
MAX_TOKENS = 900          # bài học 16/09: 400 tokens gây JSON-FAIL với model reasoning
TIMEOUT = 180
RETRIES = 2
N_THUMBS = 6             # số thumbnail sạch tải từ RSS
N_VOTES = 2              # 2 vòng bỏ phiếu; lệch → vòng 3 tie-break
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) H2DEV-Batch/4.0'}

PROMPT = (
    'You are given several recent video thumbnails from ONE YouTube channel (newest first). '
    'Answer in strict JSON only, no other text:\n'
    '{"presenter":"YES|NO",'
    '"presenter_count":"0|1|2+",'
    '"real_people":"NONE|SOME|MOST",'
    '"medium":"REAL_PHOTO|AI_GENERATED|ILLUSTRATION_2D|RENDER_3D|MIXED_MEDIA",'
    '"niche":"short niche phrase (max 8 words)","style":"short style phrase (max 8 words)",'
    '"confidence":"high|medium|low"}\n'
    'Rules:\n'
    '- presenter: YES only if the SAME real photographed person appears as the presenter/talking-head '
    'in MULTIPLE thumbnails (classic creator face-cam / vlog channel).\n'
    '- A collage of DIFFERENT people in one thumbnail (mugshots, historical figures, movie stills with '
    'different actors) => presenter NO.\n'
    '- Drawings, cartoons, 3D-rendered characters are NOT real people.\n'
    '- AI-generated photorealistic humans do NOT count as real photographed people: '
    'set medium=AI_GENERATED and do not count them in real_people.\n'
    '- medium: dominant creative medium of the thumbnails.\n'
    '- real_people: how many thumbnails show real photographed humans (any kind, excluding AI humans).'
)


# ----------------------------------------------------------------------------
# 9Router access
# ----------------------------------------------------------------------------
def load_key():
    con = sqlite3.connect(DB_9ROUTER)
    cur = con.cursor()
    cur.execute('SELECT key FROM apiKeys WHERE isActive=1 LIMIT 1')
    row = cur.fetchone()
    con.close()
    if not row:
        raise RuntimeError('Không tìm thấy API key active trong 9Router DB')
    return row[0]


KEY = None  # lazy


def b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode()


def call_model(model, imgpaths, timeout=TIMEOUT):
    """Gửi N thumbnail (nhiều image parts) trong 1 call, trả content + latency."""
    global KEY
    if KEY is None:
        KEY = load_key()
    content_parts = [{'type': 'text', 'text': PROMPT}]
    for p in imgpaths:
        mime = 'image/png' if p.lower().endswith('.png') else 'image/jpeg'
        content_parts.append({
            'type': 'image_url',
            'image_url': {'url': 'data:%s;base64,%s' % (mime, b64(p))},
        })
    body = {
        'model': model,
        'messages': [{'role': 'user', 'content': content_parts}],
        'max_tokens': MAX_TOKENS,
        'temperature': 0,
        'stream': True,
    }
    req = urllib.request.Request(
        BASE_URL, data=json.dumps(body).encode(),
        headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY},
        method='POST')
    t0 = time.time()
    content = ''
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        for rawline in resp:
            line = rawline.decode('utf-8', 'ignore').strip()
            if not line.startswith('data:'):
                continue
            payload = line[5:].strip()
            if payload == '[DONE]':
                break
            try:
                d = json.loads(payload)
            except Exception:
                continue
            ch = (d.get('choices') or [{}])[0].get('delta', {})
            if ch.get('content'):
                content += ch['content']
    return content, time.time() - t0


def parse_json(txt):
    s = txt.find('{')
    e = txt.rfind('}')
    if s < 0 or e < 0:
        return None
    try:
        return json.loads(txt[s:e + 1])
    except Exception:
        return None


# ----------------------------------------------------------------------------
# Clean thumbnails via RSS (cache)
# ----------------------------------------------------------------------------
NS = {'a': 'http://www.w3.org/2005/Atom'}


def fetch_clean_thumbs(rec):
    """Tải tối đa N_THUMBS thumbnail mới nhất từ RSS. Trả list path (cache-first)."""
    rid = rec.get('id', '?')
    cid = (rec.get('channel') or {}).get('channelId') or ''
    base = os.path.join(THUMB_CACHE, rid)
    manifest = os.path.join(base, 'manifest.json')
    if os.path.exists(manifest):
        try:
            with io.open(manifest, encoding='utf-8') as f:
                m = json.load(f)
            paths = [p for p in m.get('paths', []) if os.path.exists(p)]
            if paths:
                return paths
        except Exception:
            pass
    if not cid:
        return []
    os.makedirs(base, exist_ok=True)
    paths = []
    try:
        url = 'https://www.youtube.com/feeds/videos.xml?channel_id=%s' % cid
        req = urllib.request.Request(url, headers=UA)
        xml = urllib.request.urlopen(req, timeout=25).read()
        root = ET.fromstring(xml)
        entries = root.findall('a:entry', NS)[:N_THUMBS]
        for i, e in enumerate(entries):
            vid = e.find('a:id', NS).text.split(':')[-1]
            dst = os.path.join(base, '%02d_%s.jpg' % (i, vid))
            if not os.path.exists(dst):
                turl = 'https://i.ytimg.com/vi/%s/hqdefault.jpg' % vid
                treq = urllib.request.Request(turl, headers=UA)
                data = urllib.request.urlopen(treq, timeout=20).read()
                with open(dst, 'wb') as f:
                    f.write(data)
            paths.append(dst)
        with io.open(manifest, 'w', encoding='utf-8') as f:
            json.dump({'channelId': cid, 'paths': paths, 'fetchedAt': datetime.now(timezone.utc).isoformat()},
                      f, ensure_ascii=False, indent=1)
    except Exception:
        pass
    return paths


def screenshot_path(rec):
    fn = rec.get('fileName', '')
    for d in RAW_DIRS:
        p = os.path.join(d, fn)
        if os.path.exists(p):
            return p
    return None


# ----------------------------------------------------------------------------
# Business derivation (channel-level semantics)
# ----------------------------------------------------------------------------
def derive(percept, model, latency, votes):
    presenter = str(percept.get('presenter', '')).upper().strip() == 'YES'
    presenter_count = str(percept.get('presenter_count', '')).strip()
    real_people = str(percept.get('real_people', 'NONE')).upper().strip()
    medium = str(percept.get('medium', '')).upper().strip()
    confidence = str(percept.get('confidence', 'medium')).lower().strip() or 'medium'

    ai_generated = (medium == 'AI_GENERATED')
    has_real_human_face = presenter
    is_faceless = not presenter

    needs_review = (confidence == 'low')
    review_note = None
    if presenter:
        review_note = 'Presenter face detected (%s person(s)) — verify repeats across videos' % presenter_count
        needs_review = True
    if ai_generated and real_people in ('SOME', 'MOST'):
        needs_review = True
        review_note = 'AI_GENERATED medium but some real people — mixed source, spot-check'
    if len(set(votes)) > 1:
        needs_review = True
        review_note = ((review_note + ' | ') if review_note else '') + 'Votes disagreed: %s' % votes

    if presenter:
        ftype = 'FACE_CAM'
    elif ai_generated:
        ftype = 'AI_GENERATED'
    elif medium == 'ILLUSTRATION_2D':
        ftype = 'DRAWN_2D'
    elif medium == 'RENDER_3D':
        ftype = 'RENDER_3D'
    elif real_people in ('SOME', 'MOST') or medium == 'REAL_PHOTO':
        ftype = 'REAL_FOOTAGE_NO_FACE'
    else:
        ftype = 'OBJECT_ONLY'

    return {
        'schema': 'v4',
        'isFaceless': is_faceless,
        'hasRealHumanFace': has_real_human_face,
        'presenterCount': presenter_count or None,
        'realPeopleLevel': real_people or None,
        'aiGenerated': ai_generated,
        'medium': medium or None,
        'facelessVerdict': ('REAL_HUMAN' if presenter else ('AI_GENERATED' if ai_generated else 'NO_REAL_FACE')),
        'facelessType': ftype,
        'thumbnailNiche': str(percept.get('niche', '')).strip(),
        'thumbnailStyle': str(percept.get('style', '')).strip(),
        'confidence': confidence,
        'votes': votes,
        'agreement': ('unanimous' if len(set(votes)) == 1 else 'majority'),
        'sourceCount': percept.get('_source_count'),
        'needsReview': needs_review,
        'reviewNote': review_note,
        'model': model,
        'latencySec': round(latency, 2),
        'analyzedAt': datetime.now(timezone.utc).isoformat(),
    }


def classify_one(rec):
    """1 kênh: chuẩn bị ảnh → 2 vòng vote → tie-break → derive. Tự retry + fallback model."""
    rid = rec.get('id', '?')

    imgpaths = fetch_clean_thumbs(rec)
    source = 'rss_clean'
    if not imgpaths:
        sp = screenshot_path(rec)
        if not sp:
            return {'id': rid, 'ok': False, 'error': 'no images (RSS empty & screenshot missing)'}
        imgpaths = [sp]
        source = 'channel_screenshot'

    def one_call(model):
        content, dt = call_model(model, imgpaths)
        j = parse_json(content)
        if not j or 'presenter' not in j:
            raise ValueError('JSON-FAIL: ' + (content[:80].replace('\n', ' ') or '(empty)'))
        return j, dt

    last_err = None
    for model in [PRIMARY, FALLBACK]:
        for attempt in range(1, RETRIES + 1):
            try:
                votes = []
                percs = []
                dts = []
                for _ in range(N_VOTES):
                    j, dt = one_call(model)
                    votes.append(str(j.get('presenter', '')).upper().strip())
                    percs.append(j)
                    dts.append(dt)
                if len(set(votes)) > 1:
                    j3, dt3 = one_call(model)  # tie-break vòng 3
                    votes.append(str(j3.get('presenter', '')).upper().strip())
                    percs.append(j3)
                    dts.append(dt3)

                # đa số phiếu quyết định
                yes = sum(1 for v in votes if v == 'YES')
                no = sum(1 for v in votes if v == 'NO')
                final_wins = 'YES' if yes > no else 'NO'
                final_percept = None
                for j, v in zip(percs, votes):
                    if str(j.get('presenter', '')).upper().strip() == final_wins:
                        final_percept = j
                        break
                final_percept = final_percept or percs[0]
                final_percept['_source_count'] = len(imgpaths)
                final_percept['presenter'] = final_wins

                result = derive(final_percept, model, sum(dts) / len(dts), votes)
                result['source'] = source
                return {'id': rid, 'ok': True, 'result': result,
                        'model': model, 'latencySec': round(sum(dts), 2)}
            except Exception as e:
                last_err = '%s: %s' % (model, str(e)[:120])
                time.sleep(1.5 * attempt)
    return {'id': rid, 'ok': False, 'error': last_err or 'unknown'}


# ----------------------------------------------------------------------------
# Persistence
# ----------------------------------------------------------------------------
def backup_data():
    stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    bdir = os.path.join(ROOT, '_backup', '%s-faceless-vision-v4' % stamp)
    os.makedirs(bdir, exist_ok=True)
    shutil.copy2(DATA_TABS, os.path.join(bdir, 'raw-kenh-mau.json'))
    return bdir


def load_checkpoint():
    if os.path.exists(CHECKPOINT):
        with io.open(CHECKPOINT, encoding='utf-8') as f:
            return json.load(f)
    return {'done': {}}


def save_checkpoint(cp):
    os.makedirs(CACHE_DIR, exist_ok=True)
    tmp = CHECKPOINT + '.tmp'
    with io.open(tmp, 'w', encoding='utf-8') as f:
        json.dump(cp, f, ensure_ascii=False, indent=1)
    os.replace(tmp, CHECKPOINT)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ids', default='', help='danh sách RAW IDs, cách nhau dấu phẩy')
    ap.add_argument('--all', action='store_true', help='chạy lại tất cả (ghi đè kết quả cũ)')
    ap.add_argument('--limit', type=int, default=0, help='giới hạn số kênh (pilot)')
    ap.add_argument('--dry-run', action='store_true', help='chỉ liệt kê sẽ chạy')
    args = ap.parse_args()

    with io.open(DATA_TABS, encoding='utf-8') as f:
        doc = json.load(f)
    records = doc['records']

    cp = load_checkpoint()
    done_map = cp.get('done', {})

    todo = []
    for r in records:
        rid = r.get('id', '')
        if args.ids:
            if rid in [x.strip() for x in args.ids.split(',') if x.strip()]:
                todo.append(r)
            continue
        if args.all:
            todo.append(r)
        elif rid not in done_map:
            todo.append(r)
    if args.limit:
        todo = todo[:args.limit]

    print('=' * 68)
    print('FACELESS VISION BATCH v4 — 9Router LOCAL (:20128)')
    print('PRIMARY=%s  FALLBACK=%s  LANES=%d  VOTES=%d(+1 tie-break)' % (PRIMARY, FALLBACK, LANES, N_VOTES))
    print('Input: %d thumbnail sạch/kênh từ RSS (fallback screenshot). Cache: %s' % (
        N_THUMBS, os.path.relpath(THUMB_CACHE, ROOT)))
    print('Tổng records=%d | đã xong=%d | sẽ chạy=%d' % (len(records), len(done_map), len(todo)))
    print('=' * 68)
    if not todo:
        print('Không còn kênh nào cần chạy. Dùng --all để chạy lại.')
        return
    if args.dry_run:
        for r in todo:
            print('  -', r.get('id'), 'chanId=%s' % ((r.get('channel') or {}).get('channelId') or '-'))
        return

    bdir = backup_data()
    print('Backup ->', os.path.relpath(bdir, ROOT))

    t_run = time.time()
    n_ok = n_fail = 0
    errors = []
    try:
        with ThreadPoolExecutor(max_workers=LANES) as ex:
            futs = {ex.submit(classify_one, r): r.get('id') for r in todo}
            for i, fut in enumerate(as_completed(futs), 1):
                res = fut.result()
                rid = res['id']
                if res['ok']:
                    n_ok += 1
                    done_map[rid] = res['result']
                    print('[%3d/%3d] %-10s %-10s %-22s %-5s %.2fs  %s' % (
                        i, len(todo), rid,
                        'FACELESS' if res['result']['isFaceless'] else 'HAS_FACE',
                        res['result']['facelessType'],
                        res['result'].get('agreement', '')[:5],
                        res['result']['latencySec'],
                        res['result']['thumbnailNiche'][:32]))
                else:
                    n_fail += 1
                    errors.append((rid, res['error']))
                    print('[%3d/%3d] %-10s FAIL: %s' % (i, len(todo), rid, res['error'][:80]))
                if i % 10 == 0:
                    save_checkpoint({'done': done_map, 'updatedAt': datetime.now(timezone.utc).isoformat()})
    except KeyboardInterrupt:
        print('\n!! Bị dừng — đang lưu checkpoint...')

    save_checkpoint({'done': done_map, 'updatedAt': datetime.now(timezone.utc).isoformat()})

    # Ghi kết quả vào raw-kenh-mau.json
    n_written = 0
    for r in records:
        rid = r.get('id', '')
        if rid in done_map:
            r['thumbnailVision'] = done_map[rid]
            n_written += 1
    doc['records'] = records
    doc['updatedAt'] = datetime.now(timezone.utc).isoformat()
    tmp = DATA_TABS + '.tmp'
    with io.open(tmp, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
    os.replace(tmp, DATA_TABS)

    wall = time.time() - t_run
    print('=' * 68)
    print('XONG: OK=%d FAIL=%d trong %.1fs (%.2fs/kênh)' % (n_ok, n_fail, wall, wall / max(1, len(todo))))
    print('Đã ghi thumbnailVision cho %d records vào raw-kenh-mau.json' % n_written)
    if errors:
        print('Lỗi còn lại (chạy lại script để retry):')
        for rid, err in errors[:10]:
            print('  -', rid, err[:100])
    print('Checkpoint:', os.path.relpath(CHECKPOINT, ROOT))
    print('=' * 68)


if __name__ == '__main__':
    main()
