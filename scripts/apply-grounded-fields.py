# Gộp kết quả viết lại bám transcript (out_*.json) vào data/video_insights.json (cả khoá HOA/thường).
# Ghi đè: tools_mentioned, edit_sop, avoid_flags, sop_steps. Chạy: py -3 scripts/apply-grounded-fields.py <thư-mục> [--dry]
import glob, json, os, re, sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILE = os.path.join(ROOT, "data", "video_insights.json")
src, dry = sys.argv[1], "--dry" in sys.argv
# Công cụ KHÔNG có bằng chứng trong lời nói / tài liệu kèm (đã đối chiếu tay) -> bỏ
DROP_TOOLS = {("VIDEO-a85eac", "ChatGPT"), ("VIDEO-39ae49", "Claude"), ("VIDEO-ca0b1a", "Gemini"),
              ("VIDEO-b380a1", "CapCut"), ("VIDEO-f59aa7", "HeyGen"), ("VIDEO-5c3116", "Notepad++"), ("VIDEO-3df94e", "Midjourney"), ("VIDEO-5cb825", "Midjourney")}
# Thay chữ trong câu khi công cụ bị bỏ
REPLACE = {"VIDEO-f59aa7": [("HeyGen", "công cụ tạo avatar")], "VIDEO-5c3116": [("Notepad++", "file văn bản")]}
raw = open(FILE, encoding="utf-8", newline="").read()
crlf = "\r\n" in raw
data = json.loads(raw)
new = {}
for f in sorted(glob.glob(os.path.join(src, "out_*.json"))):
    new.update(json.load(open(f, encoding="utf-8")))

def fix(sku, text):
    for a, b in REPLACE.get(sku, []):
        text = text.replace(a, b)
    return text

n = 0
for sku, v in new.items():
    keys = [k for k in data if k.lower() == sku.lower()]
    if not keys:
        raise SystemExit("không thấy " + sku)
    tools = [t for t in v["tools_mentioned"] if (sku, t) not in DROP_TOOLS]
    es = {"primary": fix(sku, v["edit_sop"]["primary"]), "additional": [fix(sku, x) for x in v["edit_sop"]["additional"]]}
    af = [fix(sku, x) for x in v["avoid_flags"]]
    ss = [fix(sku, x) for x in v["sop_steps"]] if v.get("sop_steps") else None
    for k in keys:
        data[k]["tools_mentioned"] = tools
        data[k]["edit_sop"] = es
        data[k]["avoid_flags"] = af
        data[k]["sop_steps"] = ss
        n += 1
print("SKU %d · khoá cập nhật %d" % (len(new), n))
if not dry:
    out = json.dumps(data, ensure_ascii=False, indent=2) + ("\n" if raw.endswith("\n") else "")
    if crlf:
        out = out.replace("\n", "\r\n")
    open(FILE, "w", encoding="utf-8", newline="").write(out)
    print("đã ghi")

# ---- Bước 2: key_takeaways viết lại (tkout_*.json) + lọc channels_mentioned không có bằng chứng ----
import importlib.util
spec = importlib.util.spec_from_file_location("cg", os.path.join(ROOT, "scripts", "check-grounding.py"))
cg = importlib.util.module_from_spec(spec); spec.loader.exec_module(cg)
os.chdir(ROOT)
raw = open(FILE, encoding="utf-8", newline="").read()
data = json.loads(raw)
tk = {}
for f in sorted(glob.glob(os.path.join(src, "tkout_*.json"))) + sorted(glob.glob(os.path.join(src, "tk2out_*.json"))):
    tk.update(json.load(open(f, encoding="utf-8")))
n_tk = n_ch = 0
for sku, lines in tk.items():
    for k in [k for k in data if k.lower() == sku.lower()]:
        data[k]["key_takeaways"] = lines
        n_tk += 1
seen = {}
for k, r in data.items():
    chs = r.get("channels_mentioned") or []
    if not chs:
        continue
    sku = k
    for c in (k, "VIDEO-" + k.split("-", 1)[1].lower(), "VIDEO-" + k.split("-", 1)[1].upper()):
        if os.path.exists(f"video/{c}/transcript.json"):
            sku = c; break
    corp = cg.corpus(sku, data)
    keep = []
    for c in chs:
        nm = c if isinstance(c, str) else json.dumps(c, ensure_ascii=False)
        ok = (nm.lower() in cg.rawcorpus(sku, data)) if nm.startswith("@") else (cg.norm(nm) in corp)
        if ok:
            keep.append(c)
        else:
            n_ch += 1
    r["channels_mentioned"] = keep
print("key_takeaways cập nhật %d khoá · channels_mentioned bỏ %d mục không có bằng chứng" % (n_tk, n_ch))
if not dry:
    out = json.dumps(data, ensure_ascii=False, indent=2) + ("\n" if raw.endswith("\n") else "")
    if crlf:
        out = out.replace("\n", "\r\n")
    open(FILE, "w", encoding="utf-8", newline="").write(out)
    print("đã ghi (bước 2)")
