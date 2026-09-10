"""Read-only source audit and optional public YouTube snapshot. Never edits core data."""
import argparse, collections, concurrent.futures, datetime, hashlib, json, pathlib, re, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]

def read(name):
    return json.loads((ROOT / 'data-tabs' / name).read_text(encoding='utf-8-sig'))

def norm(value):
    return urllib.parse.unquote(value).strip().casefold()

def walk(obj):
    if isinstance(obj, dict):
        yield obj
        for value in obj.values():
            yield from walk(value)
    elif isinstance(obj, list):
        for value in obj:
            yield from walk(value)

def txt(obj):
    if not isinstance(obj, dict):
        return ''
    return obj.get('simpleText') or obj.get('content') or ''.join(x.get('text','') for x in obj.get('runs',[]))

def fetch(item):
    handle, origins = item
    route = 'channel/'+handle.lstrip('@') if re.fullmatch(r'@?UC[A-Za-z0-9_-]{22}',handle) else urllib.parse.quote(handle, safe='@-_.')
    url = 'https://www.youtube.com/' + route + '/videos?hl=en'
    result = {'requestedHandle':handle, 'origins':origins, 'url':url,
              'fetchedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()}
    try:
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0','Accept-Language':'en-US,en;q=0.9'})
        with urllib.request.urlopen(req, timeout=25) as response:
            html = response.read().decode('utf-8')
            result.update(httpStatus=response.status, finalUrl=response.url, htmlSha256=hashlib.sha256(html.encode()).hexdigest())
        match = re.search(r'var ytInitialData = (.*?);</script>', html)
        if not match:
            result['status'] = 'NO_INITIAL_DATA'
            return result
        data = json.loads(match.group(1))
        meta = data.get('metadata',{}).get('channelMetadataRenderer',{})
        result.update(title=meta.get('title'),channelId=meta.get('externalId'),description=meta.get('description'),canonicalUrl=meta.get('channelUrl'),ownerUrls=meta.get('ownerUrls'))
        result['headerTexts'] = list(dict.fromkeys(x['content'] for x in walk(data.get('header',{})) if isinstance(x.get('content'),str)))
        videos = {}
        for node in walk(data.get('contents',{})):
            modern = node.get('lockupViewModel')
            if modern and modern.get('contentType') == 'LOCKUP_CONTENT_TYPE_VIDEO':
                vid = modern.get('contentId')
                md = modern.get('metadata',{}).get('lockupMetadataViewModel',{})
                parts = [x['content'] for x in walk(md.get('metadata',{})) if isinstance(x.get('content'),str)]
                badges = [x['thumbnailBadgeViewModel'].get('text','') for x in walk(modern.get('contentImage',{})) if 'thumbnailBadgeViewModel' in x]
                if vid:
                    videos[vid] = {'videoId':vid,'title':txt(md.get('title')),
                        'viewsText':next((x for x in parts if 'view' in x.lower()),''),
                        'publishedRelative':next((x for x in parts if 'ago' in x.lower()),''),
                        'metadataTexts':parts,'duration':next((x for x in badges if re.fullmatch(r'[0-9:]+',x)),''),
                        'url':'https://www.youtube.com/watch?v='+vid}
            v = node.get('videoRenderer')
            if not v or not v.get('videoId'):
                continue
            videos[v['videoId']] = {'videoId':v['videoId'],'title':txt(v.get('title')),
                'viewsText':txt(v.get('viewCountText')),'publishedRelative':txt(v.get('publishedTimeText')),
                'duration':txt(v.get('lengthText')),'url':'https://www.youtube.com/watch?v='+v['videoId']}
        result['videos'] = list(videos.values())
        result['status'] = 'RESOLVED' if meta.get('externalId') else 'NO_CHANNEL_METADATA'
        result['limitations'] = 'Public first-page /videos snapshot only; not full channel history, audience demographics, YPP or revenue verification. Relative publication labels remain relative to fetch time.'
    except Exception as exc:
        result.update(status='FETCH_ERROR', error=str(exc))
    return result

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--live',action='store_true')
    ap.add_argument('--output',required=True)
    args=ap.parse_args()
    out=pathlib.Path(args.output)
    out.mkdir(parents=True,exist_ok=True)
    raw=read('raw-kenh-mau.json')['records']; core=read('kenh-mau.json'); niches=read('ngach-xanh.json')
    groups=collections.defaultdict(list); targets={}
    for row in raw:
        handle=(row.get('ocr') or {}).get('handle') or row['channel'].get('handle')
        key=norm(handle or row['id']); groups[key].append(row['id'])
        if handle: targets.setdefault(key,{'handle':handle,'origins':[]})['origins'].append(row['id'])
    for row in core:
        handle=row['handle']; key=norm(handle)
        targets.setdefault(key,{'handle':handle,'origins':[]})['origins'].append('core:'+handle)
    summary={'date':'2026-09-06','rawRecords':len(raw),'rawVideoRows':sum(len(x['ocr'].get('videoRows',[])) for x in raw),
        'rawUniqueHandleKeys':len(groups),'rawDuplicateGroups':{k:v for k,v in groups.items() if len(v)>1},
        'rawStatus':dict(collections.Counter(x['status'] for x in raw)),
        'rawMonetizedOCRLabels':dict(collections.Counter(x['ocr'].get('monetized') for x in raw)),
        'rawCanonicalIdCount':sum(bool(x['channel'].get('channelId')) for x in raw),
        'coreRecords':len(core),'nicheRecords':len(niches['ngachXanh']), 'uniqueCombinedHandleKeys':len(targets),
        'warning':'OCR scan timestamp is not screenshot capture date. Monetized OCR badges are not proof of YPP or earnings. Handle-key deduplication is provisional until canonical IDs resolve.'}
    (out/'inventory.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(summary,ensure_ascii=False),flush=True)
    if args.live:
        results=[]
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            futures=[pool.submit(fetch,(v['handle'],v['origins'])) for v in targets.values()]
            for future in concurrent.futures.as_completed(futures):
                results.append(future.result())
                if len(results)%20==0:
                    print('PROGRESS',len(results),'/',len(targets),dict(collections.Counter(x['status'] for x in results)),flush=True)
                    (out/'youtube-public-snapshot.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
        results.sort(key=lambda x:norm(x['requestedHandle']))
        (out/'youtube-public-snapshot.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
        print('COMPLETE',len(results),dict(collections.Counter(x['status'] for x in results)),flush=True)

if __name__=='__main__':
    main()
