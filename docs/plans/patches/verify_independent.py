"""verify_independent.py — kiểm ĐỘC LẬP (không import agents_sync): tự dựng lại từng target từ nguồn
và so BYTE với file trên đĩa. Thứ tự tier mặc định cố ý hardcode ở đây để không phụ thuộc engine.
Exit 0 = mọi file khớp byte."""
import os, json, hashlib, sys, re

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

H = os.path.expanduser("~")
MF = os.path.join(H, ".agents", "sync", "manifest.json")
m = json.load(open(MF, encoding="utf-8"))
ORDER = ["full", "master", "capped", "lite"]
JOIN = b"\n\n---\n\n"


def ex(p):
    return os.path.normpath(os.path.expanduser(os.path.expandvars(p)))


def is_link(p):
    try:
        st = os.lstat(p)
        return os.path.islink(p) or (hasattr(st, "st_file_attributes") and bool(st.st_file_attributes & 1024))
    except OSError:
        return False


def h8(b):
    return hashlib.sha256(b).hexdigest()[:8]


RAW, VAR, SRCNAME = {}, {}, {}
for name, path in m["sources"].items():
    raw = open(ex(path), "rb").read()
    if raw.count(b"{{STAMP}}") != 1:
        sys.exit("FAIL: %s phai co dung 1 {{STAMP}}" % path)
    RAW[name] = raw
    VAR[name] = (h8(raw), raw.replace(b"{{STAMP}}", h8(raw).encode()))
    SRCNAME[name] = os.path.basename(ex(path))
fst = h8(RAW["master"] + JOIN + RAW["workflow"])
VAR["full"] = (fst, VAR["master"][1].rstrip(b"\n") + JOIN + VAR["workflow"][1])
SRCNAME["full"] = "master.md+workflow.md"


def fits(t, data):
    if "cap_chars" in t and len(data.decode("utf-8")) > t["cap_chars"]:
        return False
    if "cap_bytes" in t and len(data) > t["cap_bytes"]:
        return False
    return True


def _strip_atk_bytes(body):
    import re
    text = body.decode("utf-8")
    text = re.sub(r"\n## (?:0\.\d+\s+)?POSTURE LOCK[\s\S]*?(?=\n## PART 0:|\n## 0\. )", "\n", text)
    text = re.sub(r"\n- \*\*Adversarial Security Analysis \(ATK Inversion\):\*\*[^\n]*", "", text)
    text = re.sub(r"\n- \*\*Phân tích An ninh Đối kháng \(Adversarial Security Analysis / ATK Inversion\):\*\*[^\n]*", "", text)
    return text.encode("utf-8")


def pick(t):
    pref = t.get("prefix", "").encode()
    order = [t["force_variant"]] if t.get("force_variant") else t.get("tier_order", ORDER)
    for n in order:
        if n in VAR:
            body = _strip_atk_bytes(VAR[n][1]) if t.get("strip_atk") else VAR[n][1]
            if fits(t, pref + body):
                return n, pref + body, VAR[n][0]
    return None, None, None

def chunks(body, pref, maxc, maxb, tag):
    ls = body.decode("utf-8").split("\n")
    inf, cuts = False, []
    for i, l in enumerate(ls):
        if l.strip()[:3] in ("```", "~~~"):
            inf = not inf
            continue
        if not inf and i and (l[:3] == "## " or l[:4] == "### "):
            cuts.append(i)
    pts = [0] + cuts + [len(ls)]
    bc, bb = maxc - len(pref.decode()) - 90, maxb - len(pref) - 90
    out, cur = [], ""
    for j in range(len(pts) - 1):
        blk = "\n".join(ls[pts[j]:pts[j + 1]])
        cand = blk if not cur else cur + "\n" + blk
        if cur and (len(cand) > bc or len(cand.encode()) > bb):
            out.append(cur)
            cur = blk
        else:
            cur = cand
    if cur:
        out.append(cur)
    n = len(out)
    return [pref + ("<!-- agents-sync %s chunk %d/%d -->\n" % (tag, i, n)).encode() + c.encode() for i, c in enumerate(out, 1)]


ok = total = 0
print("VERIFY DOC LAP (byte-level) — %d target" % len(m["targets"]))
for t in m["targets"]:
    v, data, st = pick(t)
    if v is None:
        total += 1
        print("  NOFIT  %s" % t["id"])
        continue
    if "split_max_chars" in t or "split_max_bytes" in t:
        pref = t.get("prefix", "").encode()
        parts = chunks(data[len(pref):], pref, t.get("split_max_chars", 10 ** 9), t.get("split_max_bytes", 10 ** 9),
                       "%s @ %s" % (SRCNAME[v], st))
        outs = [(ex(t["path"].replace("{n}", str(i))), d) for i, d in enumerate(parts, 1)]
    else:
        outs = [(ex(t["path"]), data)]
    for p, exp in outs:
        total += 1
        act = open(p, "rb").read() if os.path.exists(p) else None
        same = act == exp
        ok += same
        print("  %s %-22s %-8s %7s B  %s" % ("OK " if same else ("MISS" if act is None else "BAD"), t["id"], v,
                                             "-" if act is None else format(len(act), ","), p.replace(H, "~")))
print("KET QUA: %d/%d byte-identical" % (ok, total))

# ---- skills: tu tinh hash cay thu muc nguon va tung dich (doc lap voi engine)
SKIP = {"__pycache__", "Thumbs.db", ".DS_Store"}


def is_link(p):
    return os.path.islink(p) or (os.path.exists(p) and bool(os.stat(p, follow_symlinks=False).st_file_attributes & 0x400))


def th(p):
    if not os.path.isdir(p) or is_link(p):
        return None
    m_ = hashlib.sha256()
    for r, ds, fs in os.walk(p):
        if is_link(r):
            return None
        ds[:] = sorted(d for d in ds if d not in SKIP)
        for d in ds:
            if is_link(os.path.join(r, d)):
                return None
        for f in sorted(fs):
            if f in SKIP:
                continue
            fp = os.path.join(r, f)
            if is_link(fp):
                return None
            m_.update(os.path.relpath(fp, p).replace("\\", "/").encode() + b"\0" + open(fp, "rb").read())
    return m_.hexdigest()


sk = m.get("skills")
sk_ok = sk_total = 0
if sk:
    src = ex(sk["source"])
    names = sorted(n for n in os.listdir(src) if os.path.isdir(os.path.join(src, n)))
    ref = {n: th(os.path.join(src, n)) for n in names}
    name_pat = re.compile(r"^[a-z0-9][a-z0-9-]*$")
    for t in sk["targets"]:
        ALLOWED_KEYS = {"id", "dir", "evidence", "create", "exclude_names", "target_only_names", "preserve_names"}
        bad_keys = set(t.keys()) - ALLOWED_KEYS
        if bad_keys:
            sys.exit("FAIL: unknown key in skill target %s: %s" % (t.get("id"), ",".join(sorted(bad_keys))))
        excluded = set(t.get("exclude_names", []))
        unknown = excluded - set(names)
        if unknown:
            sys.exit("FAIL: unknown skill exclusion for %s: %s" % (t["id"], ",".join(sorted(unknown))))
        d = ex(t["dir"])
        target_only = set(t.get("target_only_names", []) + t.get("preserve_names", []))
        # Validate format
        for n in target_only:
            if not name_pat.match(n):
                sys.exit("FAIL: invalid target_only skill name in %s: %s" % (t["id"], n))
        # Disjoint checks
        collision = target_only & set(names)
        if collision:
            sys.exit("FAIL: target_only collides with source in %s: %s" % (t["id"], ",".join(sorted(collision))))
        ex_collision = target_only & excluded
        if ex_collision:
            sys.exit("FAIL: target_only collides with exclude in %s: %s" % (t["id"], ",".join(sorted(ex_collision))))
        # Real directory and SKILL.md check
        missing_to = []
        for n in target_only:
            p = os.path.join(d, n)
            if not os.path.isdir(p) or is_link(p) or not os.path.isfile(os.path.join(p, "SKILL.md")):
                missing_to.append(n)
        if missing_to:
            sys.exit("FAIL: target_only skill missing or invalid in %s: %s" % (t["id"], ",".join(sorted(missing_to))))
        target_names = [n for n in names if n not in excluded]
        good = sum(1 for n in target_names if ref[n] is not None and th(os.path.join(d, n)) == ref[n])
        left = [n for n in excluded if os.path.lexists(os.path.join(d, n))]
        sk_ok += good
        sk_total += len(target_names)
        print("  %s skills:%-14s %d/%d%s  %s" % ("OK " if good == len(target_names) and not left else "BAD", t["id"], good, len(target_names),
              (" exclude_left=" + ",".join(left)) if left else "", d.replace(H, "~")))
        if left:
            sk_total += len(left)
    print("SKILLS: %d/%d ban sao khop" % (sk_ok, sk_total))
sys.exit(0 if ok == total and sk_ok == sk_total else 1)
