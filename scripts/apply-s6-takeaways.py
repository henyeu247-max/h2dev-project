# Áp takeaway đã đối chiếu transcript (batch*.json) vào data/video_insights.json — cập nhật cả khoá HOA/thường.
# Chạy: py -3 scripts/apply-s6-takeaways.py <thư-mục-batch> [--dry]
import glob, json, os, sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILE = os.path.join(ROOT, "data", "video_insights.json")
src_dir, dry = sys.argv[1], "--dry" in sys.argv
raw = open(FILE, encoding="utf-8", newline="").read()
crlf = "\r\n" in raw
data = json.loads(raw)
new = {}
for f in glob.glob(os.path.join(src_dir, "batch*.json")):
    new.update(json.load(open(f, encoding="utf-8")))
touched = 0
for sku, tk in new.items():
    keys = [k for k in data if k.lower() == sku.lower()]
    if not keys:
        raise SystemExit("không thấy " + sku)
    for k in keys:
        data[k]["key_takeaways"] = tk
        touched += 1
print("SKU %d · khoá cập nhật %d" % (len(new), touched))
if not dry:
    indent = 2
    out = json.dumps(data, ensure_ascii=False, indent=indent) + ("\n" if raw.endswith("\n") else "")
    if crlf:
        out = out.replace("\n", "\r\n")
    open(FILE, "w", encoding="utf-8", newline="").write(out)
    print("đã ghi")
