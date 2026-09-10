"""Read-only inventory, exact-content deduplication and bounded source display.

Inventory membership never implies that a person or model reviewed the content.
Archives are inspected without executing or extracting executable attachments.
"""
import argparse, collections, hashlib, json, os, pathlib, re, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / '_audit/20260906-learning-corpus'
EXT = {'.md', '.txt', '.html', '.py', '.js', '.json', '.csv', '.tsv', '.yml', '.yaml', '.ps1', '.bat'}
SKIP = {'.git', 'node_modules', '_private', '_audit', '__pycache__'}

def safe(text):
    text = re.sub(r'(?m)^\s*[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\s*$', '[REDACTED UUID VALUE]', text, flags=re.I)
    text = re.sub(r'\b(?:ctxt_secret_|tvly-|tavily-)[A-Za-z0-9_-]+', '[REDACTED]', text, flags=re.I)
    text = re.sub(r'((?:[\w-]*(?:api[_-]?key|secret|token)[\w-]*)[\"\x27]?\s*[:=]\s*[\"\x27])[^\"\x27\n]+', r'\1[REDACTED]', text, flags=re.I)
    text = re.sub(r'(Bearer\s+)[A-Za-z0-9_.-]{16,}', r'\1[REDACTED]', text, flags=re.I)
    text = re.sub(r'\b(?:sk-|fc-)[A-Za-z0-9_-]{20,}\b', '[REDACTED]', text)
    text = re.sub(r'([?&](?:token|key|signature|sig|expires|policy|auth)\s*=)[^\s&"<>]+', r'\1[REDACTED]', text, flags=re.I)
    return text

def inventory():
    groups = {}; excluded = []; archives = []
    # Include project history and workspace skill copies; excludes credentials/dependencies.
    for base in [ROOT, pathlib.Path('D:/YTB/.agents/skills'), pathlib.Path('D:/YTB/_archive')]:
        if not base.exists(): continue
        for folder, dirs, names in os.walk(base):
            dirs[:] = [d for d in dirs if d not in SKIP]
            for name in sorted(names):
                p = pathlib.Path(folder)/name
                if name.startswith('.env') or 'secret' in name.lower() or 'mcp-keys' in name.lower():
                    excluded.append({'path':str(p),'reason':'credential material, not learning content'}); continue
                if p.suffix.lower() == '.zip':
                    try:
                        with zipfile.ZipFile(p) as z:
                            entries=[{'name':f.filename,'bytes':f.file_size} for f in z.infolist()]
                            archives.append({'path':str(p),'status':'valid_zip','entries':entries})
                            for f in z.infolist():
                                if pathlib.Path(f.filename).suffix.lower() not in EXT or f.file_size > 2000000: continue
                                add(groups, str(p)+'::'+f.filename, z.read(f.filename), 'zip_member')
                    except zipfile.BadZipFile:
                        archives.append({'path':str(p),'status':'invalid_zip','bytes':p.stat().st_size})
                    continue
                if p.suffix.lower() not in EXT: continue
                if 'video' in p.relative_to(base).parts and p.name.startswith('transcript.'):
                    excluded.append({'path':str(p),'reason':'tracked separately in video reading ledger'}); continue
                if p.stat().st_size > 4000000:
                    excluded.append({'path':str(p),'reason':'large structured data, requires row-wise audit'}); continue
                add(groups,str(p),p.read_bytes(),'file')
    rows=sorted(groups.values(),key=lambda x:x['paths'][0].casefold())
    for i,row in enumerate(rows): row['id']=i
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/'document-inventory.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
    (OUT/'archive-inventory.json').write_text(json.dumps(archives,ensure_ascii=False,indent=2),encoding='utf8')
    (OUT/'document-exclusions.json').write_text(json.dumps(excluded,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({'unique_documents':len(rows),'paths':sum(len(x['paths']) for x in rows),'archives':len(archives),'invalidArchives':sum(x['status']=='invalid_zip' for x in archives),'excluded':len(excluded)},ensure_ascii=False))

def add(groups,path,data,kind):
    # Normalize BOM/newlines only, preserve every semantic character.
    text=data.decode('utf-8-sig',errors='replace').replace('\r\n','\n')
    digest=hashlib.sha256(text.encode('utf8')).hexdigest()
    if digest not in groups: groups[digest]={'sha256':digest,'characters':len(text),'paths':[],'kind':kind,'status':'UNREAD'}
    groups[digest]['paths'].append(path)

def main():
    a=argparse.ArgumentParser(); a.add_argument('--inventory',action='store_true');a.add_argument('--list',action='store_true');a.add_argument('--filter',default='');a.add_argument('--ids',default='');a.add_argument('--offset',type=int,default=0);a.add_argument('--length',type=int,default=24000)
    args=a.parse_args()
    if args.inventory: inventory(); return
    rows=json.loads((OUT/'document-inventory.json').read_text(encoding='utf8'))
    if args.list:
        for row in rows:
            if args.filter.casefold() in ' '.join(row['paths']).casefold(): print(row['id'],row['characters'],len(row['paths']),row['paths'][0])
        return
    for ix in [int(x) for x in args.ids.split(',') if x]:
        row=rows[ix]; path=row['paths'][0]
        if '::' in path:
            archive,member=path.split('::',1)
            with zipfile.ZipFile(archive) as z: value=z.read(member).decode('utf-8-sig',errors='replace')
        else: value=pathlib.Path(path).read_text(encoding='utf-8-sig',errors='replace')
        value=value.replace('\r\n','\n')
        print('\nDOCUMENT',ix,path,'CHARACTERS',args.offset,min(len(value),args.offset+args.length),'OF',len(value))
        print(safe(value[args.offset:args.offset+args.length]))

if __name__=='__main__':main()
