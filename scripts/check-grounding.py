# Kiểm text sinh (edit_sop/avoid_flags/sop_steps/tools_mentioned) có bám transcript không.
# Quy tắc: mọi số, @handle, tên Latin (từ viết hoa/Latin >=4 ký tự) trong text mới phải xuất hiện trong
# transcript + tiêu đề + description của chính video (so khớp sau chuẩn hóa bỏ dấu).
# Chạy: py -3 scripts/check-grounding.py <out.json ...>  (kiểm file đầu ra)  hoặc  --live (kiểm data/video_insights.json)
import json, os, re, sys, unicodedata
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

def norm(s):
    s = s.lower().replace("đ", "d")
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9@]+", " ", s).strip()

def rawcorpus(sku, ins):
    """Văn bản thô (đã giải mã %xx của URL) để so khớp handle có ký tự không phải Latin."""
    import urllib.parse
    parts = []
    p = f"video/{sku}/transcript.json"
    if os.path.exists(p):
        parts += [s["text"] for s in json.load(open(p, encoding="utf-8"))["segments"]]
    for d in ("assets/docs", "docs"):
        base = f"{d}/{sku}"
        if os.path.isdir(base):
            for fn in os.listdir(base):
                if fn.lower().endswith((".txt", ".csv")):
                    parts.append(open(os.path.join(base, fn), encoding="utf-8", errors="replace").read())
    return urllib.parse.unquote(" ".join(parts)).lower()


def corpus(sku, ins):
    parts = []
    p = f"video/{sku}/transcript.json"
    if os.path.exists(p):
        parts += [s["text"] for s in json.load(open(p, encoding="utf-8"))["segments"]]
    rec = ins.get(sku) or ins.get(sku.lower()) or {}
    parts += [rec.get("title") or "", rec.get("actual_topic") or ""]
    # tài liệu đính kèm của chính video (mô tả, csv, md) cũng là nguồn hợp lệ
    for d in ("assets/docs", "docs"):
        base = f"{d}/{sku}"
        if os.path.isdir(base):
            for fn in os.listdir(base):
                if fn.lower().endswith((".txt", ".csv")):
                    parts.append(open(os.path.join(base, fn), encoding="utf-8", errors="replace").read())
    return " " + norm(" ".join(parts)) + " "

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
 "adsense": r"adsense|ad sense|ads sen|adsen|google sn",
 "notepad": r"notepad|note pad",
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
 "notepad": r"notepad|note pad|notepat|note pat",
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

STOP = set("seo shorts mid-roll pivot niche original cinematic rpm vph ctr avd ypp sop csv ai mmo youtube video videos tool tools kenh sub pro plus desktop studio free chrome profile bước buoc bước google".split())

# Số đã đối chiếu tay với transcript (ASR viết thành chữ: "5 trăm", "hai nghìn rưỡi", "một nghìn mấy")
VERIFIED_NUM = {("VIDEO-027064", "500"), ("VIDEO-2aa1f7", "2500"), ("VIDEO-2aa1f7", "5000"), ("VIDEO-2aa1f7", "1000")}

def grounded(tok, corp, sku=None, strict=False):
    n = norm(tok)
    if sku and (sku, tok) in VERIFIED_NUM:
        return True
    if not n or (n in STOP and not strict):
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
        # số viết thành chữ trong ASR không kiểm được -> coi là chưa có bằng chứng
    return False

def fields(rec):
    t = list(rec.get("tools_mentioned") or [])
    es = rec.get("edit_sop") or {}
    texts = [es.get("primary") or ""] + list(es.get("additional") or [])
    texts += list(rec.get("avoid_flags") or []) + list(rec.get("sop_steps") or []) + list(rec.get("key_takeaways") or [])
    return t, texts

def check(sku, rec, ins):
    corp = corpus(sku, ins)
    bad = []
    tools, texts = fields(rec)
    for t in tools:
        parts = [p for p in re.split(r"\s*/\s*", re.sub(r"\(.*?\)", "", t)) if p.strip()]
        if not any(all(grounded(w, corp, sku, strict=True) for w in tokens(p) or [p]) for p in parts):
            bad.append(("tool", t))
    for c in rec.get("channels_mentioned") or []:
        nm = c if isinstance(c, str) else json.dumps(c, ensure_ascii=False)
        if nm.startswith("@"):
            ok = nm.lower() in rawcorpus(sku, ins)
        else:
            ok = norm(nm) in corp
        if not ok:
            bad.append(("channel", nm))
    for tx in texts:
        for m in re.finditer(r"@[\w.\-]+|\d[\d.,]*|[A-Z][A-Za-z0-9+\-]{2,}", tx):
            tok = m.group(0)
            pre = tx[:m.start()]
            if re.fullmatch(r"\d{1,2}", tok) and re.fullmatch(r"(?i)\s*b[uư]ớc\s*", pre):
                continue  # số thứ tự bước
            if tok[0].isupper() and tok.isalpha() and (pre.strip() == "" or re.search(r"[:.;]\s*$", pre)):
                continue  # từ đầu câu viết hoa
            if not grounded(tok, corp, sku):
                bad.append(("text", tok + "  ←  " + tx[:90]))
    return bad

if __name__ == "__main__":
    ins = json.load(open("data/video_insights.json", encoding="utf-8"))
    live = "--live" in sys.argv
    items = {}
    if live:
        seen = set()
        for k, r in ins.items():
            if k.lower() in seen: continue
            seen.add(k.lower()); items[k] = r
    else:
        for f in sys.argv[1:]:
            if f.startswith("--"): continue
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
