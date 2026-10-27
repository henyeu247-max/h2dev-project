# Kiểm text sinh (edit_sop/avoid_flags/sop_steps/tools_mentioned/key_takeaways) có bám transcript/docs không.
# Quy tắc: mọi số, @handle, tên Latin (từ viết hoa/Latin >=4 ký tự) trong text mới phải xuất hiện trong
# transcript + tiêu đề + description + README/docs của chính video (so khớp sau chuẩn hóa bỏ dấu).
# Chạy: py -3 scripts/check-grounding.py [--live] [--track all|h2dev|huan|dgmd] [out.json ...]
import json, os, re, sys, unicodedata, urllib.parse
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

def norm(s):
    s = s.lower().replace("đ", "d")
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9@]+", " ", s).strip()

def load_all_insights(track="all"):
    files = []
    if track in ("all", "h2dev"):
        files.append("data/video_insights.json")
    if track in ("all", "huan") and os.path.exists("data/video_insights_huan.json"):
        files.append("data/video_insights_huan.json")
    if track in ("all", "dgmd") and os.path.exists("data/video_insights_dgmd.json"):
        files.append("data/video_insights_dgmd.json")
    ins = {}
    for fn in files:
        ins.update(json.load(open(fn, encoding="utf-8")))
    for vfn in ("data-tabs/videos.json", "data/videos_huan.json", "data/videos_dgmd.json"):
        if os.path.exists(vfn):
            vdata = json.load(open(vfn, encoding="utf-8"))
            vlist = vdata if isinstance(vdata, list) else vdata.get("items", vdata.get("videos", []))
            for v in vlist:
                sku = v.get("sku")
                if sku and sku in ins:
                    if not ins[sku].get("title") and v.get("title"):
                        ins[sku]["title"] = v.get("title")
    return ins

def rawcorpus(sku, ins):
    """Văn bản thô (đã giải mã %xx của URL) để so khớp handle có ký tự không phải Latin."""
    parts = []
    p = f"video/{sku}/transcript.json"
    if os.path.exists(p):
        parts += [s["text"] for s in json.load(open(p, encoding="utf-8"))["segments"]]
    rec = ins.get(sku) or ins.get(sku.lower()) or {}
    parts += [rec.get("title") or "", rec.get("actual_topic") or ""]
    for kts in rec.get("key_timestamps") or []:
        parts += [kts.get("label") or "", kts.get("description") or ""]
    for d in ("assets/docs", "assets/docs-huan", "assets/docs-dgmd", "docs"):
        base = f"{d}/{sku}"
        if os.path.isdir(base):
            for fn in os.listdir(base):
                if fn.lower().endswith((".txt", ".csv", ".html", ".md")) or fn == "README.md":
                    parts.append(open(os.path.join(base, fn), encoding="utf-8", errors="replace").read())
    return urllib.parse.unquote(" ".join(parts)).lower()


def corpus(sku, ins):
    return " " + norm(rawcorpus(sku, ins)) + " "

# ASR hay chép tên Latin thành tiếng Việt: danh sách bí danh chấp nhận (tên chuẩn -> mẫu có trong transcript)
ALIAS = {
 "capcut": r"capcode|capcom|cap ?cut|cap quyt|cat quyt|cap kut|cat cut|cap cot|cap cu",
 "elevenlabs": r"eleve|11 ?lag|eleven|11 ?lab|inlab|ilab|11 ?lap|el lab|elevenlab",
 "chatgpt": r"chat givety|chat ghi vi ti|chat beauty|chat glute|jackpt|jack pt|chat ?gpt|chat ?vt|chat ?gt|chat ?ut|chat ?uvt|chat ?gp|chat ?ti|chat ?cp|gpt",
 "claude": r"claude|cloud|cleo|claw|clog|clode|clau|codelog",
 "midjourney": r"mid ?journey|mi ?journey",
 "pexels": r"pixel bay|pixel|pizza ?bay|pcp|pcb|pc bay|pexel|pcbay|pcpay|pcsell|pc ?sell",
 "pixabay": r"pixel bay|pizza ?bay|pcp|pcb|pc bay|pixabay|pixa|pcbay|pcpay",
 "vbee": r"vobi|vbee|v bee|vibi|vb ",
 "bilibili": r"bilibili|bili ?bili|billy",
 "douyin": r"douyin|duyin|duin|doyin|dou ?yin|banduin",
 "vidiq": r"wix ?aiq|vid ?iq|vidi q|video iq",
 "gemini": r"jetmei|get ?me|gitmy|gitme|gitmy|gemini|gem ?ni|jemini",
 "adsense": r"adsense|ad sense|ads sen|adsen|google sn|kiem tien|bat kiem tien",
 "notepad": r"notepad|note pad|notepat|note pat",
 "canva": r"canva|can va|canvas|canh ve|canh vn|canh vr|canh vo",
 "photoshop": r"photoshop|photo shop",
 "premiere": r"premiere|premier",
 "whisk": r"whisk|visk|wisk",
 "youtube": r"youtube|you tube|yutube",
 "google": r"google",
 "gmail": r"gmail|g mail",
 "heygen": r"heygain|heygen|hey gen|heigen|heigin|hygen|hygiene|higgins|hay gen|hei gen",
 "minimax": r"minimax|mini max|minimart|minimap|winnie mart|mini mat|millimat|mini mac",
 "kimi": r"kimi|kismi|kiem mi",
 "grok": r"grok|grog",
 "deepseek": r"deepsick|deepseek|deep seek|depthsig|depth sig|dip sik",
 "videvo": r"videvo",
 "coverr": r"coverr",
 "vecteezy": r"vecteezy|vector ?ez",
 "remove": r"remove",
 "edge": r"edge",
 "leonardo": r"leonardo|leo ",
 "icloud": r"icloud|i cloud",
 "kling": r"kling|kking|kekin|kia king|ke kin",
 "tubeatlas": r"tube atlas|tu be atlas|tupi atlas|2b atlas",
 "mmo": r"mmo|momo|mo mo|mom mo",
 "dreamina": r"dreamina|dream mini",
 "veo": r"veo|v3|theo ba",
 "kie": r"kie ai|kia ai",
 "opus": r"opus|output|obus|oboot|op us",
 "summary": r"summar|sumari",
 "authenticator": r"authentic",
 "microsoft": r"microsoft",
}

def tokens(text):
    """Trả về danh sách token cần có bằng chứng: số, handle, từ Latin hoa/tên riêng."""
    out = []
    for m in re.finditer(r"@[\w.\-]+|\d[\d.,]*|\b[A-Z][A-Za-z0-9+\-]{2,}\b", text):
        out.append(m.group(0))
    return out

STOP = set("seo shorts mid-roll pivot niche original cinematic rpm vph ctr avd ypp sop csv ai mmo youtube video videos tool tools kenh sub pro plus desktop studio free chrome profile bước buoc google hook text save grand editor leader founder after howto ceiling llm wikipedia checklist study benchmark case prompt wi-fi wi fi zero-downsell zero downsell revenue".split())

# Không dùng whitelist VERIFIED_NUM: mọi số phải bám trực tiếp vào transcript/docs của SKU
VERIFIED_NUM = set()

KEY_NAME_RE = re.compile(r"^(primary|additional|trim_start|trim_end|emphasis|b_roll|voice|visual|music|subtitles|trim|speed_bgm|sub|footage|captions|pacing|music_sfx|avoid|cuts|trim_start_seconds|trim_end_seconds)$", re.I)

def grounded(tok, corp, sku=None, strict=False):
    tok_s = tok.strip()
    n = norm(tok_s)
    if sku and (sku, tok_s) in VERIFIED_NUM:
        return True
    if not n or ((n in STOP or tok_s.lower() in STOP) and not strict):
        return True
    if (" " + n + " ") in corp or n in corp:
        return True
    for k, pat in ALIAS.items():
        if k in n.replace(" ", "") and re.search(pat, corp):
            return True
    if re.fullmatch(r"[\d ]+", n):  # số: thử dạng chuẩn hóa bỏ dấu phân cách
        digits = re.sub(r"\D", "", n)
        if digits and re.search(r"(?<!\d)" + digits + r"(?!\d)", re.sub(r"[.,]", "", corp)):
            return True
    return False

def fields(rec):
    t = list(rec.get("tools_mentioned") or [])
    es = rec.get("edit_sop") or {}
    texts = list(es) if isinstance(es, list) else ([es.get("primary") or ""] + list(es.get("additional") or []))
    texts += list(rec.get("avoid_flags") or []) + list(rec.get("sop_steps") or []) + list(rec.get("key_takeaways") or [])
    return t, texts

def check(sku, rec, ins):
    corp = corpus(sku, ins)
    raw_c = rawcorpus(sku, ins)
    bad = []
    es = rec.get("edit_sop")
    if isinstance(es, list):
        for item in es:
            if KEY_NAME_RE.match(str(item).strip()):
                bad.append(("edit_sop_schema", f"corrupted key name in edit_sop list: {item}"))
    elif isinstance(es, dict):
        for item in (es.get("additional") or []):
            if KEY_NAME_RE.match(str(item).strip()):
                bad.append(("edit_sop_schema", f"corrupted key name in edit_sop.additional: {item}"))

    tools, texts = fields(rec)
    for t in tools:
        parts = [p for p in re.split(r"\s*/\s*", re.sub(r"\(.*?\)", "", t)) if p.strip()]
        if not any(all(grounded(w, corp, sku, strict=True) for w in tokens(p) or [p]) for p in parts):
            bad.append(("tool", t))
    for c in rec.get("channels_mentioned") or []:
        if isinstance(c, dict):
            raw_list = [c.get("handle") or "", c.get("name") or "", c.get("url") or ""]
            candidates = []
            for x in raw_list:
                if not x: continue
                for mh in re.findall(r"@[\w.\-]+", x):
                    candidates.append(mh)
                cleaned = re.sub(r"\s*\(.*?\)", "", x).strip()
                if cleaned and not cleaned.startswith("http"):
                    candidates.append(cleaned)
        else:
            candidates = [str(c).strip()]
        ok = False
        for nm in candidates:
            if not nm:
                continue
            if nm.startswith("@"):
                if nm.lower() in raw_c or norm(nm.lstrip("@")) in corp:
                    ok = True
                    break
            else:
                if norm(nm) in corp:
                    ok = True
                    break
        if not ok and candidates:
            bad.append(("channel", candidates[0]))
    for tx in texts:
        for m in re.finditer(r"@[\w.\-]+|\d[\d.,]*| [A-Z][A-Za-z0-9+\-]{2,} ", tx):
            tok = m.group(0)
            pre = tx[:m.start()]
            post = tx[m.end():]
            if re.search(r":\d|\d:", pre[-2:] + tok + post[:2]):
                continue  # mm:ss timestamp fragment
            if re.fullmatch(r"\d{1,2}", tok) and re.fullmatch(r"(?i)\s*b[uư]ớc\s*", pre):
                continue  # số thứ tự bước
            if tok.strip()[0].isupper() and tok.strip().isalpha() and (pre.strip() == "" or re.search(r"[:.;]\s*$", pre)):
                continue  # từ đầu câu viết hoa
            if not grounded(tok, corp, sku):
                bad.append(("text", tok + "  ←  " + tx[:90]))
    return bad

if __name__ == "__main__":
    track = "all"
    bare_track_specified = False
    for i, a in enumerate(sys.argv[1:], 1):
        if a == "--track" and i < len(sys.argv) - 1:
            track = sys.argv[i + 1].lower()
            bare_track_specified = True
        elif a.startswith("--track="):
            track = a.split("=", 1)[1].lower()
            bare_track_specified = True
        elif a.lower() in ("all", "h2dev", "huan", "dgmd") and (i == 1 or sys.argv[i - 1] != "--track"):
            track = a.lower()
            bare_track_specified = True
    ins = load_all_insights(track)
    live = "--live" in sys.argv or "--track" in " ".join(sys.argv) or bare_track_specified
    items = {}
    file_args = [a for a in sys.argv[1:] if not a.startswith("--") and a.lower() not in ("all", "h2dev", "huan", "dgmd")]
    if live or not file_args:
        seen = set()
        for k, r in ins.items():
            if k.lower() in seen: continue
            seen.add(k.lower()); items[k] = r
    else:
        for f in file_args:
            items.update(json.load(open(f, encoding="utf-8")))
    nbad = 0
    for sku, rec in items.items():
        if isinstance(rec, list):  # file tkout_*.json: chỉ có key_takeaways
            rec = {"key_takeaways": rec}
        b = check(sku, rec, ins)
        nbad += len(b)
        for kind, msg in b:
            print(sku, kind, msg)
    print("TOTAL ungrounded:", nbad, "in", len(items), "videos")
    sys.exit(1 if nbad else 0)
