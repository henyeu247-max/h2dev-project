# -*- coding: utf-8 -*-
"""
BỔ SUNG TAG THỊ TRƯỜNG VÀO TRƯỜNG `tags`
=========================================
Yêu cầu: tổng hợp tag thị trường (Ngoại / Việt / Anh / Canada / Nhật / Hàn / Ấn...),
"nếu có nhiều thì thêm 2–3 tag chuẩn".

- Giữ nguyên tag hiện có (Quan trọng / Nổi bật / Zoom / Quy trình).
- Thêm tên thị trường suy ra từ trường `market`, tối đa 3 tag thị trường / video.
- Đồng bộ catalog.json · catalog_full.json · modules.json · data-tabs/videos.json.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

MARKET_NAME = {
    "🇻🇳": "Việt", "🇺🇸": "Mỹ", "🇨🇦": "Canada", "🇯🇵": "Nhật", "🇰🇷": "Hàn",
    "🇨🇳": "Trung", "🌐": "Ngoại", "🇬🇧": "Anh", "🇦🇺": "Úc", "🇩🇪": "Đức",
    "🇲🇽": "Mexico", "🇮🇳": "Ấn", "🇫🇷": "Pháp", "🇪🇸": "Tây Ban Nha", "🇮🇹": "Ý",
    "🇧🇷": "Brazil", "🇹🇭": "Thái", "🇮🇩": "Indonesia", "🇵🇭": "Philippines",
    "🇸🇬": "Singapore", "🇷🇺": "Nga", "🇭🇰": "Hong Kong",
}
MAX_MARKET_TAGS = 3


def names_from_market(m):
    if m is None:
        return []
    parts = m if isinstance(m, list) else str(m).split(",")
    out = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        name = None
        for emo, nm in MARKET_NAME.items():
            if p.startswith(emo):
                name = nm
                break
        if name is None:
            name = p
        if name and name not in out:
            out.append(name)
    return out


def merge_tags(old, market):
    tags = list(old or [])
    added = 0
    for nm in names_from_market(market):
        if added >= MAX_MARKET_TAGS:
            break
        if nm not in tags:
            tags.append(nm)
            added += 1
    return tags, added


def main():
    total_add = 0
    sample = []

    # catalog.json + catalog_full.json (list)
    for fname in ["catalog.json", "catalog_full.json"]:
        p = ROOT / "data" / fname
        cat = json.load(open(p, encoding="utf-8"))
        for c in cat:
            new, added = merge_tags(c.get("tags"), c.get("market"))
            if added:
                c["tags"] = new
                total_add += added
                if len(sample) < 12:
                    sample.append((c.get("sku"), new))
        json.dump(cat, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print(f"{fname}: da cap nhat")

    # modules.json
    p = ROOT / "data" / "modules.json"
    mod = json.load(open(p, encoding="utf-8"))
    for m in mod.get("modules", []):
        for it in m.get("items", []):
            new, added = merge_tags(it.get("tags"), it.get("market"))
            if added:
                it["tags"] = new
    json.dump(mod, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("modules.json: da cap nhat")

    # data-tabs/videos.json
    p = ROOT / "data-tabs" / "videos.json"
    vj = json.load(open(p, encoding="utf-8"))
    for it in vj:
        new, added = merge_tags(it.get("tags"), it.get("market"))
        if added:
            it["tags"] = new
    json.dump(vj, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("data-tabs/videos.json: da cap nhat")

    print(f"\nTong luot tag thi truong them (catalog): {total_add}")
    print("=== MAU ===")
    for sku, t in sample:
        print(f"  {sku}: {t}")


if __name__ == "__main__":
    main()
