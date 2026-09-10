"""Inventory local learning sources and display bounded full-text reading batches.

No source edits, network calls or production actions. A displayed batch is not
automatically marked semantically reviewed; review notes are a separate artifact.
"""
import argparse, collections, hashlib, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / '_audit/20260906-learning-corpus'

def read(p):
    return p.read_text(encoding='utf-8-sig', errors='replace')

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--inventory', action='store_true')
    parser.add_argument('--start', type=int, default=0)
    parser.add_argument('--count', type=int, default=3)
    parser.add_argument('--offset', type=int, default=0)
    parser.add_argument('--length', type=int, default=0)
    args=parser.parse_args()
    OUT.mkdir(parents=True,exist_ok=True)
    catalog=json.loads(read(ROOT/'data/catalog_full.json'))
    by={v['sku'].casefold():v for v in catalog}
    records=[]
    for folder in sorted((ROOT/'video').glob('VIDEO-*'), key=lambda x:x.name.casefold()):
        tx=folder/'transcript.txt'; sj=folder/'transcript.json'; sr=folder/'transcript.srt'
        text=read(tx) if tx.exists() else ''
        data=json.loads(read(sj)) if sj.exists() else {}
        srt=read(sr) if sr.exists() else ''
        srt_text=' '.join(line for line in srt.splitlines() if line.strip() and not line.strip().isdigit() and '-->' not in line)
        norm=lambda t:re.sub(r'\s+',' ',t).strip()
        row={'sku':folder.name,'title':by.get(folder.name.casefold(),{}).get('title'),
             'transcriptExists':tx.exists(),'characters':len(text),'words':len(text.split()),
             'txtEqualsJson':norm(text)==norm(data.get('full_text','')) if tx.exists() and sj.exists() else None,
             'txtEqualsSrt':norm(text)==norm(srt_text) if tx.exists() and sr.exists() else None,
             'segments':len(data.get('segments',[])),
             'files':[{'path':str(p.relative_to(ROOT)).replace('\\','/'),'bytes':p.stat().st_size,
                       'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in (tx,sj,sr) if p.exists()]}
        records.append(row)
    if args.inventory:
        (OUT/'video-inventory.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
        files=[]
        excluded={'node_modules','.git','_private','_backup','_archive','_audit'}
        for p in ROOT.rglob('*'):
            if p.is_file() and not excluded.intersection(p.relative_to(ROOT).parts):
                files.append({'path':str(p.relative_to(ROOT)).replace('\\','/'),'bytes':p.stat().st_size,'extension':p.suffix.lower()})
        (OUT/'active-file-inventory.json').write_text(json.dumps(files,ensure_ascii=False,indent=2),encoding='utf8')
        print(json.dumps({'videos':len(records),'transcripts':sum(x['transcriptExists'] for x in records),
          'missing':[x for x in records if not x['transcriptExists']],
          'txtJsonMismatch':[x['sku'] for x in records if x['txtEqualsJson'] is False],
          'txtSrtMismatch':[x['sku'] for x in records if x['txtEqualsSrt'] is False],
          'words':sum(x['words'] for x in records),'activeFiles':len(files)},ensure_ascii=False,indent=2))
        return
    for i,row in enumerate(records[args.start:args.start+args.count],start=args.start):
        print('\n### FULL TRANSCRIPT',i,row['sku'],row['title'])
        p=ROOT/'video'/row['sku']/'transcript.txt'
        value=read(p) if p.exists() else '[MISSING TRANSCRIPT]'
        if args.offset or args.length:
            end=args.offset+args.length if args.length else len(value)
            print(f'[CHARACTERS {args.offset}:{min(end,len(value))} OF {len(value)}]')
            value=value[args.offset:end]
        print(value)
        print('\n### END',row['sku'])

if __name__=='__main__': main()
