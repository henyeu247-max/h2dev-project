import re, sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract all class names
raw_classes = re.findall(r'class=["\']([^"\']+)["\']', html)
used = set()
for r in raw_classes:
    for c in r.split():
        if not '${' in c and not '}' in c and c not in ['===', '?', '||', 'id', 'k', 't.id']:
            used.add(c)

with open('assets/tailwind.css', 'r', encoding='utf-8') as f:
    css = f.read()

with open('assets/app.css', 'r', encoding='utf-8') as f:
    app_css = f.read()

combined = css + '\n' + app_css

def to_css_selector(c):
    # Escape characters that need escaping in CSS
    out = ''
    for char in c:
        if char in [':', '/', '[', ']', '.', '%']:
            out += '\\' + char
        else:
            out += char
    return out

missing = []
for c in sorted(used):
    css_sel = to_css_selector(c)
    pattern = r'\.' + re.escape(css_sel)
    if not re.search(pattern, combined):
        missing.append((c, css_sel))

print(f"Tổng class dùng trong index.html: {len(used)}")
print(f"Số class THỰC SỰ THIẾU trong stylesheet: {len(missing)}")
if missing:
    print("Danh sách thiếu:")
    for c, sel in missing:
        print(f"  - {c} (selector: .{sel})")
else:
    print("✅ 100% TẤT CẢ CLASS CSS ĐÃ ĐƯỢC ĐỊNH NGHĨA HOÀN HẢO!")
