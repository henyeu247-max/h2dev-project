# -*- coding: utf-8 -*-
"""
REPAIR FIELD DAN XUAT BI NEN CHU — H2DEV
=======================================
`key_timestamps[].label` va `key_takeaways[]` trong data/video_insights.json bi
"nen chu" (rot nguyen am). Transcript goc SACH.

Cach lam (grounded, KHONG bia):
  - LABEL (co `seconds`): lay NGUYEN VAN transcript tu segment tai/gan moc do,
    noi tiep cac segment cho du ~110 ky tu (giong dinh dang label TOT hien co).
  - TAKEAWAY (khong co moc): tim cua so segment (1..4 lien tiep) khop nhat theo
    "xuong am" (skeleton) voi text nen; chi nhan khi score >= 0.72, nguoc lai GIU NGUYEN
    va bao de xu ly tay.

Chay: python scripts/repair_insight_fields.py           (dry-run)
      python scripts/repair_insight_fields.py --apply
"""
import os
import re
import sys
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INS = ROOT / "data" / "video_insights.json"
VID = ROOT / "video"
APPLY = "--apply" in sys.argv
BKDIR = ROOT / "_backup" / "20260917-insight-fields"

VOWELS = set("aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ")
VOWELS |= set("AÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬEÈÉẺẼẸÊỀẾỂỄỆIÌÍỈĨỊOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢUÙÚỦŨỤƯỪỨỬỮỰYỲÝỶỸỴ")


def skeleton(s):
    return "".join(ch for ch in s.lower() if ch.isalnum() and ch not in VOWELS)


def _dropped(x):
    """Token bi 'rot nguyen am' that: khong co nguyen am, khong phai chu hoa/so, ngan."""
    if any(c.isdigit() for c in x):
        return False
    if x.isupper():
        return False
    if any(c in VOWELS for c in x.lower()):
        return False
    return len(x) <= 5


def novowel_ratio(t):
    w = [x for x in re.split(r"\s+", t.strip()) if x]
    if len(w) < 4:
        return 0.0
    return sum(1 for x in w if _dropped(x)) / len(w)


def is_compressed(t):
    w = [x for x in re.split(r"\s+", t.strip()) if x]
    # phai du token VA ty le token rot nguyen am cao (>= 0.5)
    return len(w) >= 4 and novowel_ratio(t) >= 0.5


def load_segments(sku):
    p = VID / sku / "transcript.json"
    if not p.exists():
        return []
    try:
        return (json.loads(p.read_text(encoding="utf-8")).get("segments") or [])
    except Exception:
        return []


def clean(t):
    return re.sub(r"\s+", " ", t or "").strip()


def window_from(segs, sec, limit=110):
    """Ghep nguyen van cac segment bat dau tu segment tai/gan moc `sec` cho du ~limit ky tu."""
    if not segs:
        return None
    idx = 0
    for i, s in enumerate(segs):
        if s.get("start", 0) <= sec <= s.get("end", 0):
            idx = i
            break
    else:
        idx = min(range(len(segs)), key=lambda i: abs(segs[i].get("start", 0) - sec))
    buf = ""
    for s in segs[idx:]:
        t = clean(s.get("text", ""))
        if not t:
            continue
        buf = (buf + " " + t).strip() if buf else t
        if len(buf) >= limit:
            break
    if not buf:
        return None
    return buf if len(buf) <= limit else buf[:limit - 1] + "…"


def best_window(segs, target, maxw=4, thr=0.72):
    sk = skeleton(target)
    if len(sk) < 8:
        return None
    best = (0.0, None)
    for i in range(len(segs)):
        for w in range(1, maxw + 1):
            j = min(i + w, len(segs))
            txt = clean(" ".join(clean(s.get("text", "")) for s in segs[i:j]))
            st = skeleton(txt)
            if not st:
                continue
            L = min(len(sk), len(st), 60)
            if L < 8:
                continue
            score = sum(1 for a, b in zip(sk[:L], st[:L]) if a == b) / L
            if score > best[0]:
                best = (score, txt)
    return best if best[0] >= thr else None


def main():
    ins = json.loads(INS.read_text(encoding="utf-8"))
    seg_cache = {}
    lbl_fix, tk_fix, hold = [], [], []

    for sku, e in ins.items():
        if not isinstance(e, dict):
            continue
        segs = seg_cache.setdefault(sku, load_segments(sku))
        for kt in (e.get("key_timestamps") or []):
            lbl = clean(kt.get("label", ""))
            if not is_compressed(lbl):
                continue
            new = window_from(segs, kt.get("seconds", 0))
            if new:
                kt["label"] = new
                lbl_fix.append((sku, kt.get("seconds"), lbl, new))
            else:
                hold.append(("label", sku, kt.get("seconds"), lbl))
        tk_list = e.get("key_takeaways") or []
        for i, tk in enumerate(tk_list):
            txt = clean(tk if isinstance(tk, str) else tk.get("text", ""))
            if not is_compressed(txt):
                continue
            m = best_window(segs, txt)
            if m:
                new = m[1] if len(m[1]) <= 200 else m[1][:199] + "…"
                if isinstance(tk, str):
                    tk_list[i] = new
                else:
                    tk["text"] = new
                tk_fix.append((sku, round(m[0], 2), txt, new))
            else:
                hold.append(("takeaway", sku, None, txt))

    print(f"[{'APPLY' if APPLY else 'DRY-RUN'}] label sua: {len(lbl_fix)} | takeaway sua: {len(tk_fix)} | giu nguyen: {len(hold)}")
    print("\n--- LABEL (nen -> nguyen van transcript) ---")
    for x in lbl_fix:
        print(f"  {x[0]} @{x[1]}s")
        print(f"     cu : {x[2][:78]!r}")
        print(f"     moi: {x[3][:78]!r}")
    print("\n--- TAKEAWAY ---")
    for x in tk_fix:
        print(f"  {x[0]} (score {x[1]})")
        print(f"     cu : {x[2][:78]!r}")
        print(f"     moi: {x[3][:78]!r}")
    print("\n--- GIU NGUYEN (khong khop) ---")
    for x in hold:
        print(f"  {x[0]} {x[1]} {x[2]} {x[3][:70]!r}")

    if APPLY:
        BKDIR.mkdir(parents=True, exist_ok=True)
        shutil.copy2(INS, BKDIR / "video_insights.json")
        INS.write_text(json.dumps(ins, ensure_ascii=False, indent=2), encoding="utf-8")
        # --- LAN SANG README + DB ---
        sync_readme(ins)
        sync_db(ins)
        print(f"\n   backup -> {BKDIR}")


def sync_readme(ins):
    """Cap nhat label moc thoi gian trong docs/VIDEO-*/README.md tu insights (match theo time)."""
    import glob
    n = 0
    for f in glob.glob(str(ROOT / "docs" / "VIDEO-*" / "README.md")):
        sku = Path(f).parent.name
        e = ins.get(sku) or {}
        kts = {kt.get("time"): kt.get("label") for kt in (e.get("key_timestamps") or [])}
        if not kts:
            continue
        lines = Path(f).read_text(encoding="utf-8").split("\n")
        changed = False
        for i, ln in enumerate(lines):
            m = re.match(r"^(\s*- `)([0-9:]+)(` — )(.*)$", ln)
            if not m:
                continue
            tm, lbl = m.group(2), m.group(4)
            if tm in kts and is_compressed(lbl) and kts[tm]:
                lines[i] = m.group(1) + tm + m.group(3) + kts[tm]
                changed = True
        if changed:
            BKDIR.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, BKDIR / f"{sku}.README.md")
            Path(f).write_text("\n".join(lines), encoding="utf-8")
            n += 1
    print(f"   README cap nhat: {n} file")


def sync_db(ins):
    """Cap nhat lesson_timestamps.title trong h2dev_master.db (match sku+seconds)."""
    import subprocess
    import tempfile
    dbp = ROOT / "data" / "h2dev_master.db"
    if not dbp.exists():
        return
    BKDIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(dbp, BKDIR / "h2dev_master.db")
    labels = {}
    for sku, e in ins.items():
        if not isinstance(e, dict):
            continue
        for kt in (e.get("key_timestamps") or []):
            labels[f"{sku}|{int(kt.get('seconds', 0))}"] = kt.get("label")
    js = (
        "const {DatabaseSync}=require('node:sqlite');"
        "const fs=require('fs');"
        f"const L=JSON.parse(fs.readFileSync('{ (BKDIR/'labels.json').as_posix() }','utf8'));"
        f"const db=new DatabaseSync('{dbp.as_posix()}');"
        "const rows=db.prepare('SELECT timestamp_id,sku,seconds,title FROM lesson_timestamps').all();"
        "let n=0;const up=db.prepare('UPDATE lesson_timestamps SET title=? WHERE timestamp_id=?');"
        "for(const r of rows){const k=r.sku+'|'+r.seconds;const v=L[k]||L[r.sku+'|'+r.seconds];"
        "if(v && v!==r.title){up.run(v,r.timestamp_id);n++;}}"
        "console.log('db title cap nhat:',n);"
    )
    (BKDIR / "labels.json").write_text(json.dumps(labels, ensure_ascii=False), encoding="utf-8")
    r = subprocess.run(["node", "-e", js], capture_output=True, text=True, cwd=str(ROOT))
    print("  ", (r.stdout or r.stderr).strip()[:200])


if __name__ == "__main__":
    main()
