# -*- coding: utf-8 -*-
"""mark_media_integrity.py — Danh dau CHINH THUC cac video co luong media HONG vao data.

SCRIPT TAI DUNG (khong phai va 1 lan): doc ket qua tu cache cua audit_videos_v2.py
(`_audit/20260918-full-136-audit/media_integrity_cache.json`), roi ghi co
`media_integrity` vao cac bang du lieu + registry `data/media_integrity.json`.

Chay lai moi khi audit phat hien file hong moi:
  1. py scripts/audit_videos_v2.py            (cap nhat cache)
  2. py scripts/mark_media_integrity.py       (danh dau vao data)

Backup tu dong vao _backup/<YYYYMMDD>-media-integrity/ truoc khi ghi.
"""
import json
import io
import os
import shutil
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, '_audit', '20260918-full-136-audit', 'media_integrity_cache.json')
REGISTRY = os.path.join(ROOT, 'data', 'media_integrity.json')
TARGETS = ['data/catalog.json', 'data/catalog_full.json', 'data-tabs/videos.json']
STAMP = time.strftime('%Y%m%d')
BKDIR = os.path.join(ROOT, '_backup', STAMP + '-media-integrity')


def build_record(sku, integ):
    """Dung record co the truy vet tu ket qua do cua audio_integrity()."""
    dp = integ.get('decode_probe') or {}
    methods = {
        'method_1_frame_rate': integ.get('method_1_verdict'),
        'method_2_packet_rate': integ.get('method_2a_verdict'),
        'method_3_decode_probe': integ.get('method_3_verdict'),
    }
    return {
        'status': 'BROKEN_AUDIO_TRUNCATED',
        'detected_at': time.strftime('%Y-%m-%d'),
        'detected_by': 'scripts/audit_videos_v2.py :: audio_integrity() [3 phep do doc lap]',
        'severity': 'high',
        'symptom': ('Luong audio thieu packet that: %s packet / %ss = %s packet/s (chuan %s)'
                    % (integ.get('nb_read_packets'), integ.get('stream_duration_sec'),
                       integ.get('packet_rate'), integ.get('packet_rate_expected'))),
        'measured': {
            'codec': integ.get('codec'),
            'container_duration_sec': integ.get('stream_duration_sec'),
            'audio_packets_actual': integ.get('nb_read_packets'),
            'packet_rate_actual': integ.get('packet_rate'),
            'packet_rate_expected': integ.get('packet_rate_expected'),
            'ratio_to_expected': integ.get('packet_rate_ratio_to_expected'),
            'decode_probe': dp,
            'methods': methods,
            'broken_by': integ.get('broken_by'),
            'verdict': integ.get('verdict'),
        },
        'root_cause': ('File media hong tu nguon (thieu packet audio). '
                       'KHONG phai loi phu de, KHONG phai loi seek/timestamp.'),
        'action': {
            'subtitle': 'GIU NGUYEN phu de hien co (ban ghi cua phan audio con lai)',
            'user_visible': 'UI hien canh bao chat luong cho video nay',
        },
        'remediation_required': ('Thay file media goc tu nguon khac, sau do chay lai: '
                                 'py scripts/transcribe_sku.py ' + sku),
    }


def main():
    if not os.path.exists(CACHE):
        print('KHONG tim thay cache: %s' % CACHE)
        print('Chay truoc: py scripts/audit_videos_v2.py')
        return 1
    cache = json.load(io.open(CACHE, encoding='utf-8'))
    vids = cache.get('videos', {})
    broken = {k: v for k, v in vids.items() if v.get('verdict') == 'broken'}
    print('Nguon cache : %s' % CACHE)
    print('Tong video  : %d | broken: %d' % (len(vids), len(broken)))
    if not broken:
        print('Khong co video hong -> khong can danh dau.')
        return 0

    os.makedirs(BKDIR, exist_ok=True)

    # --- registry rieng ---
    prev = {}
    if os.path.exists(REGISTRY):
        shutil.copy2(REGISTRY, os.path.join(BKDIR, 'media_integrity.json'))
        try:
            prev = json.load(io.open(REGISTRY, encoding='utf-8')).get('videos', {})
        except Exception:  # noqa: BLE001
            prev = {}
    for sku, integ in broken.items():
        prev[sku] = build_record(sku, integ)
    # bo cac SKU da het hong (neu file duoc thay)
    for sku in list(prev):
        if sku not in broken:
            prev.pop(sku)
    io.open(REGISTRY, 'w', encoding='utf-8', newline='').write(json.dumps({
        'schema': 'h2dev.media-integrity-registry.v1',
        'generated_at': time.strftime('%Y-%m-%dT%H:%M:%S'),
        'note': 'Video co luong media HONG (thieu du lieu that). UI/server doc de canh bao.',
        'broken_count': len(prev),
        'videos': prev,
    }, ensure_ascii=False, indent=2).replace('\n', '\r\n'))
    print('  %-28s %d video' % ('data/media_integrity.json', len(prev)))

    # --- gan co vao cac bang ---
    for rel in TARGETS:
        p = os.path.join(ROOT, rel)
        if not os.path.exists(p):
            print('  %-28s (khong ton tai, bo qua)' % rel)
            continue
        shutil.copy2(p, os.path.join(BKDIR, os.path.basename(rel)))
        data = json.load(io.open(p, encoding='utf-8'))
        n = 0
        for row in data:
            sku = row.get('sku')
            if sku in prev:
                row['media_integrity'] = prev[sku]
                n += 1
            elif 'media_integrity' in row:
                row.pop('media_integrity')   # da duoc thay file -> bo co cu
        io.open(p, 'w', encoding='utf-8', newline='').write(
            json.dumps(data, ensure_ascii=False, indent=2).replace('\n', '\r\n'))
        print('  %-28s danh dau %d record' % (rel, n))

    print('  backup -> %s' % BKDIR)
    return 0


if __name__ == '__main__':
    sys.exit(main())
