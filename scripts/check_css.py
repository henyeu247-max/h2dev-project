import re, sys
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

with open('assets/tailwind.css', 'r', encoding='utf-8') as f:
    css1 = f.read()

with open('assets/app.css', 'r', encoding='utf-8') as f:
    css2 = f.read()

css = css1 + '\n' + css2

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract all class names
raw_classes = re.findall(r'class=["\']([^"\']+)["\']', html)
used = set()
for r in raw_classes:
    for c in r.split():
        if not '${' in c and not '}' in c:
            used.add(c)

missing = []
for c in sorted(used):
    pattern = r'\.' + re.escape(c) + r'[{,\s:.]'
    if not re.search(pattern, css) and c not in ['active', 'hidden', 'truncate', 'sr-only', 'font-black']:
        missing.append(c)

print(f"Tổng class dùng trong index.html: {len(used)}")
print(f"Số class THIẾU trong assets/tailwind.css: {len(missing)}")
print("Danh sách class thiếu:")
for m in missing:
    print(f"  - {m}")
