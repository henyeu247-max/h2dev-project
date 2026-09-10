"""Build complete traceable appendices from a public research snapshot."""
import collections, json, pathlib, re, statistics
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'_audit/20260906-raw-market'

FAMILIES={
 'Trẻ em / hoạt hình / IP':[1,10,23,25,29,31,50,75,79,88],
 'Đức tin / Kinh Thánh':[2,69,93],
 'Khoa học nghe chậm':[3,14],
 'Lịch sử tổng hợp / tái dựng':[4,6,8,17,20,53,59,65],
 'Giáo dục kiến thức nền':[5,49,77],
 'Lịch sử thực phẩm / đồ vật':[7,15,26,42,44,45,46,47],
 'Đời sống senior':[9],
 'Tội phạm / bi kịch':[11,76,84,87],
 'Quân sự / địa chính trị':[12,18,22,63,70,86],
 'Thiên nhiên quanh nhà / thú cưng':[13,19,27],
 'Làm vườn':[16],
 'Địa lý / du lịch / đời sống nơi khác':[21,55,56,57,58,71,72,73,74,81,82,89,95],
 'Khoa học vũ trụ / tự nhiên / tiền sử':[24,54,60,61,67,90,94],
 'Cơ chế / công cụ / công nghệ':[28,51,91,92],
 'Fitness / review sức khỏe':[30,64],
 'Học tiếng Anh':[32,33,34,35,36,37,38,39,40,41,85],
 'Lịch sử dược chất':[43],
 'Lịch sử công nghiệp':[48],
 'Triết lý / động lực':[52,66,80],
 'Công nghệ / quy định thời sự':[62],
 'Kinh doanh / thương hiệu':[68,78,83],
}
family={f'RAW-{n:03}':label for label,ids in FAMILIES.items() for n in ids}

def number(s):
    m=re.search(r'([\d,.]+)\s*([KMB])?',s or '',re.I)
    return float(m.group(1).replace(',','')) * {'K':1000,'M':1e6,'B':1e9}.get((m.group(2) or '').upper(),1) if m else None

def age(s):
    m=re.search(r'(\d+)\s*(minutes?|hours?|days?|weeks?|months?|years?|mo|[hdwmy])\b',s or '',re.I)
    if not m:return None
    unit=m.group(2).lower(); factor=30 if unit.startswith('mo') else 365 if unit.startswith('y') else 7 if unit.startswith('w') else 1 if unit.startswith('d') else 1/24 if unit.startswith('h') else 1/1440
    return int(m.group(1))*factor

def clean(s):return str(s or '').replace('|','/').replace('\n',' ')

def main():
    raw=json.loads((ROOT/'data-tabs/raw-kenh-mau.json').read_text(encoding='utf-8-sig'))['records']
    live=json.loads((OUT/'v2/youtube-public-snapshot.json').read_text(encoding='utf-8'))
    follow=json.loads((OUT/'canonical-id-followup.json').read_text(encoding='utf-8'))
    by={x['requestedHandle'].casefold():x for x in live}
    by.update({x['requestedHandle'].casefold():x for x in follow if x['status']=='RESOLVED'})
    assert set(family)=={x['id'] for x in raw}
    summaries=[]
    for x in by.values():
        values=[]
        for v in x.get('videos',[]):
            view=v.get('viewsText') or next((t for t in v.get('metadataTexts',[]) if re.fullmatch(r'[\d,.]+[KMB]?',t)), '')
            value=number(view); days=age(v.get('publishedRelative'))
            if value is not None and days is not None and 7<=days<=60: values.append(value)
        summaries.append({'handle':x['requestedHandle'],'title':x.get('title'),'status':x['status'],
            'channelId':x.get('channelId'),'header':x.get('headerTexts',[])[:4], 'videoRows':len(x.get('videos',[])),
            'approx7to60dayN':len(values),'approx7to60dayMedianViews':statistics.median(values) if values else None,
            'latest':x.get('videos',[None])[0] if x.get('videos') else None,'origins':x['origins']})
    (OUT/'channel-summary.json').write_text(json.dumps(summaries,ensure_ascii=False,indent=2),encoding='utf-8')
    rows=['# Phụ lục kiểm tra 95/95 raw — 06/09/2026','','Phân nhóm biên tập từ tiêu đề; không suy ra tuổi, địa lý người xem, bản quyền hoặc YPP. Các record trùng handle cùng dùng một snapshot. Ngày OCR không phải ngày chụp ảnh.','','| Raw | Tên trong OCR / handle | Nhóm đọc lại | Đối chiếu công khai |','|---|---|---|---|']
    for r in raw:
        h=r['ocr'].get('handle') or r['channel'].get('handle'); x=by.get(h.casefold(),{})
        info=x.get('status','NOT_REQUESTED')+'; '+str(len(x.get('videos',[])))+' dòng video trang đầu'
        if r['id']=='RAW-091':info+='; IDENTITY_UNRESOLVED: handle hiện trả kênh 3 sub/1 video, không ghép với ảnh 1.06K/10 video'
        rows.append('| '+r['id']+' | '+clean(r['ocr'].get('channelName'))+' / '+clean(h)+' | '+family[r['id']]+' | '+clean(info)+' |')
    rows+=['','## Dòng video OCR (giữ làm dữ liệu lịch sử; tiêu đề không phải kiến thức đã xác minh)']
    for r in raw:
        rows+=['', '### '+r['id']+' — '+clean(r['ocr'].get('channelName'))]
        for v in r['ocr'].get('videoRows',[]): rows.append('- '+clean(v.get('title'))+' — '+clean(v.get('viewsText'))+'; '+clean(v.get('age'))+'; '+clean(v.get('duration')))
    (OUT/'appendix-raw-95.md').write_text('\n'.join(rows)+'\n',encoding='utf-8')
    lines=['# Đối chiếu 243/243 handle — 06/09/2026','','Đã thử tất cả, không đồng nghĩa tất cả xác minh được. 404 không chứng minh kênh bị xóa hay mất YPP. RESOLVED chỉ là có metadata ở địa chỉ hiện tại, chưa chứng minh cùng kênh ảnh cũ. Không tải toàn bộ lịch sử video.','','| Handle | Tên hiện tại | Trạng thái | Video trang đầu | Video đầu tiên / tuổi tương đối |','|---|---|---|---|---|']
    for x in sorted(summaries,key=lambda x:x['handle'].casefold()):
        v=x.get('latest') or {}
        lines.append('| '+clean(x['handle'])+' | '+clean(x.get('title'))+' | '+x['status']+' | '+str(x['videoRows'])+' | '+clean(v.get('title'))+' / '+clean(v.get('publishedRelative'))+' |')
    (OUT/'appendix-handles-243.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    counts=collections.Counter(family[r['id']] for r in raw)
    print('FAMILIES',dict(counts))
    print('PUBLIC',dict(collections.Counter(x['status'] for x in summaries)))
    print('VIDEO_ROWS',sum(x['videoRows'] for x in summaries))
    print('RAW_PUBLIC',dict(collections.Counter(by[(r['ocr'].get('handle') or r['channel'].get('handle')).casefold()]['status'] for r in raw)))
    for x in summaries:
        if any(z.startswith('RAW-') for z in x['origins']): print(x['origins'][0],x['handle'],x['approx7to60dayN'],x['approx7to60dayMedianViews'])

if __name__=='__main__':main()
