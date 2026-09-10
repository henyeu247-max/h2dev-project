"""Collect a small, explicitly nonrepresentative public comment sample without login."""
import concurrent.futures, datetime, importlib.util, json, pathlib, re, urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('audit',ROOT/'scripts/audit-raw-market.py')
a=importlib.util.module_from_spec(spec); spec.loader.exec_module(a)
OUT=ROOT/'_audit/20260906-raw-market'

def collect(video):
    result={'video':video,'fetchedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'selection':'Fourth displayed video, or last available if fewer than four; default YouTube comment ranking, first returned page. Nonrandom exploratory sample; no demographic inference.'}
    headers={'User-Agent':'Mozilla/5.0','Accept-Language':'en-US,en;q=0.9'}
    try:
        s=urllib.request.urlopen(urllib.request.Request(video['url']+'&hl=en',headers=headers),timeout=25).read().decode()
        d=json.loads(re.search(r'var ytInitialData = (.*?);</script>',s).group(1))
        configs={}
        for m in re.finditer(r'ytcfg.set\((.*?)\);',s):
            try: configs.update(json.loads(m.group(1)))
            except ValueError: pass
        section=next(x['itemSectionRenderer'] for x in a.walk(d) if x.get('itemSectionRenderer',{}).get('targetId')=='comments-section')
        token=next(x['continuationCommand']['token'] for x in a.walk(section) if 'continuationCommand' in x)
        context=configs.get('INNERTUBE_CONTEXT',{'client':{'clientName':'WEB','clientVersion':'2.20260901.00.00'}})
        request=urllib.request.Request('https://www.youtube.com/youtubei/v1/next?prettyPrint=false',
            data=json.dumps({'context':context,'continuation':token}).encode(),headers={**headers,'Content-Type':'application/json'})
        payload=json.loads(urllib.request.urlopen(request,timeout=25).read())
        comments=[]
        for x in a.walk(payload):
            c=x.get('commentEntityPayload')
            if c:
                props=c.get('properties',{})
                comments.append({'id':props.get('commentId'),'text':a.txt(props.get('content')),'published':props.get('publishedTime')})
            c=x.get('commentRenderer')
            if c:
                comments.append({'id':c.get('commentId'),'text':a.txt(c.get('contentText')),'published':a.txt(c.get('publishedTimeText'))})
        result.update(status='OK' if comments else 'NO_COMMENTS_PARSED',comments=comments)
    except Exception as exc:
        result.update(status='UNAVAILABLE',error=str(exc),comments=[])
    return result

def main():
    data=json.loads((OUT/'v2/youtube-public-snapshot.json').read_text(encoding='utf-8'))
    wanted={'@workshopdecoded','@calmsciencetosleep','@weirdwardbound','@gracedailyenglish','@officialbeyondtheblue','@昔の人の知恵','@biblemadeclear26','@backyardstoryus'}
    videos=[]
    for ch in data:
        if ch['requestedHandle'].casefold() in wanted and ch.get('videos'):
            v=dict(ch['videos'][min(3,len(ch['videos'])-1)]); v['channel']=ch['requestedHandle']; videos.append(v)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        results=list(pool.map(collect,videos))
    (OUT/'public-comments.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    print([(x['video']['channel'],x['status'],len(x['comments'])) for x in results])

if __name__=='__main__': main()
