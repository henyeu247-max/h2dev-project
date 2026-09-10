import re, sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

files = ['index.html', 'player.html', 'learn.html']

with open('assets/tailwind.css', 'r', encoding='utf-8') as f:
    css = f.read()

with open('assets/app.css', 'r', encoding='utf-8') as f:
    app_css = f.read()

with open('assets/learn.css', 'r', encoding='utf-8') as f:
    learn_css = f.read()

combined = css + '\n' + app_css + '\n' + learn_css

def to_css_selector(c):
    out = ''
    for char in c:
        if char in [':', '/', '[', ']', '.', '%']:
            out += '\\' + char
        else:
            out += char
    return out

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        html = f.read()

    raw_classes = re.findall(r'class=["\']([^"\']+)["\']', html)
    used = set()
    for r in raw_classes:
        for c in r.split():
            if not '${' in c and not '}' in c and c not in ['===', '?', '||', 'id', 'k', 't.id', 'true', 'false']:
                used.add(c)

    missing = []
    for c in sorted(used):
        css_sel = to_css_selector(c)
        pattern = r'\.' + re.escape(css_sel)
        if not re.search(pattern, combined):
            missing.append((c, css_sel))

    print(f"=== {file} ===")
    print(f"Tổng class dùng: {len(used)}")
    print(f"Số class thiếu: {len(missing)}")
    if missing:
        for c, sel in missing:
            print(f"  - {c}")
    else:
        print("✅ 100% OK")
