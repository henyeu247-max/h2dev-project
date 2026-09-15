# -*- coding: utf-8 -*-
"""Kiem chung live 10 kenh qua MCP Pool :3988 - doi chieu voi data da luu."""
import json
import time
import urllib.request
import os
import re

ENV_PATH = r"D:\Mcp-Pool-Vps\.env"


def load_key():
    with open(ENV_PATH, encoding='utf-8') as f:
        for line in f:
            if line.startswith('MCP_POOL_API_KEY='):
                return line.split('=', 1)[1].strip().strip('"').strip("'")
    return None


KEY = load_key()


def call(tool, args, timeout=120):
    body = {'jsonrpc': '2.0', 'id': int(time.time() * 1000), 'method': 'tools/call',
            'params': {'name': tool, 'arguments': args}}
    req = urllib.request.Request(
        'http://127.0.0.1:3988/mcp',
        data=json.dumps(body).encode(),
        headers={'Content-Type': 'application/json',
                 'Accept': 'application/json, text/event-stream',
                 'X-API-Key': KEY or ''})
    t0 = time.time()
    raw = urllib.request.urlopen(req, timeout=timeout).read().decode('utf-8', 'replace')
    dt = (time.time() - t0) * 1000
    # Parse SSE/JSON
    txt = raw
    if txt.startswith('{'):
        obj = json.loads(txt)
    else:
        # SSE: find data: line
        m = re.search(r'data:\s*(\{.*\})', txt)
        obj = json.loads(m.group(1)) if m else {}
    content = obj.get('result', {}).get('content', [])
    inner = content[0].get('text', '') if content else ''
    try:
        data = json.loads(inner)
    except Exception:
        data = inner
    return data, dt


TARGETS = [
    ('RAW-001', '@pekaboosongs'),
    ('RAW-010', '@landonsanimationwheelhouse'),
    ('RAW-023', '@latentdiffusion'),
    ('RAW-025', '@game.mp4'),
    ('RAW-029', '@MamaToonss'),
    ('RAW-031', '@jotadrive'),
    ('RAW-050', '@yamato2030byromifilm'),
    ('RAW-075', '@The_Regular_Recap'),
    ('RAW-079', '@jessejokes'),
    ('RAW-088', '@novillainsaresafe'),
]


def parse_subs(s):
    """Parse locale VI: '80,5 N' (phay = thap phan, N = Nghin = thousand).
    Vi du: '114 N' -> 114000 | '80,5 N' -> 80500 | '1,2 Tr' -> 1200000."""
    if isinstance(s, (int, float)):
        return int(s)
    if not isinstance(s, str):
        return None
    s = s.replace('\u00a0', ' ').strip()
    m = re.match(r'([\d.,]+)\s*([A-Za-zÀ-ỹ]*)', s)
    if not m:
        return None
    num_str = m.group(1)
    unit = m.group(2).strip().lower()
    # Locale VI: phay = thap phan, cham = phan nghin
    if ',' in num_str and '.' in num_str:
        num_str = num_str.replace('.', '').replace(',', '.')  # 1.234,5 -> 1234.5
    elif ',' in num_str:
        num_str = num_str.replace(',', '.')                   # 80,5 -> 80.5
    num = float(num_str)
    # Don vi: N/Nghin=1e3, Tr/Trieu=1e6, K=1e3, M=1e6, B/Ty=1e9
    if unit.startswith('tr') or unit == 'm':
        mult = 1e6
    elif unit.startswith('t') and 'r' not in unit[:2]:  # Ty
        mult = 1e9
    elif unit.startswith('n') or unit == 'k':
        mult = 1e3
    elif unit.startswith('b'):
        mult = 1e9
    else:
        mult = 1
    return int(round(num * mult))


def main():
    results = []
    for rid, handle in TARGETS:
        item = {'id': rid, 'handle': handle}
        try:
            d, dt = call('youtube_intelligence__channel_dossier', {'channel': handle})
            if isinstance(d, dict):
                item['live_subs'] = parse_subs(d.get('subscribers'))
                item['live_title'] = d.get('title', '').strip()
                item['live_channelId'] = d.get('channelId')
                vc = d.get('videoCount', '')
                if isinstance(vc, str):
                    m = re.search(r'([\d.,]+)', vc.replace('\u00a0', ' '))
                    item['live_videoCount'] = int(float(m.group(1).replace(',', ''))) if m else None
                else:
                    item['live_videoCount'] = vc
                item['ms'] = round(dt)
            else:
                item['error'] = str(d)[:150]
        except Exception as e:
            item['error'] = str(e)[:150]
        results.append(item)
        print(json.dumps(item, ensure_ascii=False))
        time.sleep(1.5)

    # Doi chieu voi data da luu
    print('\n=== DOI CHIEU VOI DATA DA LUU ===')
    for item in results:
        rid = item['id']
        folder = [d for d in os.listdir('data/raw-channels-deep') if d.startswith(rid)][0]
        cp = json.load(open(f'data/raw-channels-deep/{folder}/channel-profile.json', encoding='utf-8'))
        saved_subs = cp.get('subscribers')
        saved_vc = cp.get('videoCount')
        match_s = item.get('live_subs') == saved_subs
        match_v = item.get('live_videoCount') == saved_vc
        print(f"{rid}: subs saved={saved_subs} live={item.get('live_subs')} {'MATCH' if match_s else 'DIFF'} | vc saved={saved_vc} live={item.get('live_videoCount')} {'MATCH' if match_v else 'DIFF'}")

    json.dump(results, open('docs/proof-live-verification-10kids.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('\n-> docs/proof-live-verification-10kids.json')


if __name__ == '__main__':
    main()
