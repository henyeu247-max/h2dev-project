#!/usr/bin/env python3
"""agents_sync: giao luật chung ~/.agents/source/*.md tới đúng file mà từng CLI/IDE thật sự đọc.

  verify             đối chiếu nội dung/cap mọi target, retire, inert (chỉ đọc; exit 1 nếu lệch)
  apply [--yes]      lint nguồn → ghi target (backup trước) → chuyển file retire vào backup; mặc định dry-run
  prune [--yes]      chuyển file inert + backup lẻ của file chỉ thị vào backups/<run>/legacy (không xoá)
  retention [--yes]  xoá run-dir backup cũ, giữ N mới nhất (manifest _backup_keep)

Biến thể (variant):
  full    = master.md + workflow.md (tool chỉ đọc 1 file, trần lớn)
  master  = master.md
  capped  = capped.md
  lite    = master-lite.md
  workflow= workflow.md (chỉ cho target khai force_variant, ghi vào thư mục rules của tool)
Target chọn biến thể lớn nhất vừa trần theo tier_order (của target, mặc định của manifest).
"""
import sys, os, json, hashlib, shutil, datetime, re, subprocess

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOME = os.path.expanduser("~")
ROOT = os.path.join(HOME, ".agents")
MANIFEST = os.path.join(ROOT, "sync", "manifest.json")
LINT = os.path.join(ROOT, "sync", "lint_source.py")
LINT_SKILLS = os.path.join(ROOT, "sync", "lint_skills.py")
SKILL_STATE = os.path.join(ROOT, "sync", "skills-state.json")
SKIP_NAMES = {"__pycache__", "Thumbs.db", ".DS_Store"}
BACKUPS = os.path.join(ROOT, "backups")
STAMP_TOKEN = b"{{STAMP}}"
RUN_ID = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
DEFAULT_BACKUP_KEEP = 5
BACKUP_RUN_RE = re.compile(r"^\d{8}-\d{6}$")
DEFAULT_TIER_ORDER = ["full", "master", "capped", "lite"]
FULL_JOIN = b"\n\n---\n\n"

SOURCE_PATHS = {}   # variant -> đường dẫn nguồn (để gắn nhãn chunk)


def ex(p):
    """Resolve ~ and documented Windows environment-variable locations."""
    return os.path.normpath(os.path.expanduser(os.path.expandvars(p)))


def rb(p):
    try:
        with open(p, "rb") as f:
            return f.read()
    except FileNotFoundError:
        return None


def h8(b):
    return hashlib.sha256(b).hexdigest()[:8] if b is not None else "--------"


def _stamped(path):
    raw = rb(ex(path))
    if raw is None:
        sys.exit("source missing: " + path)
    if raw.count(STAMP_TOKEN) != 1:
        sys.exit("%s must contain exactly one {{STAMP}}" % path)
    st = h8(raw)
    return raw, st, raw.replace(STAMP_TOKEN, st.encode())
def load():
    with open(MANIFEST, "r", encoding="utf-8") as f:
        m = json.load(f)
    variants = {}
    raws = {}
    for name, path in m["sources"].items():
        raw, st, body = _stamped(path)
        raws[name] = raw
        variants[name] = (st, body)
        SOURCE_PATHS[name] = path
    if "master" in variants and "workflow" in variants:
        st = h8(raws["master"] + FULL_JOIN + raws["workflow"])
        variants["full"] = (st, variants["master"][1].rstrip(b"\n") + FULL_JOIN + variants["workflow"][1])
        SOURCE_PATHS["full"] = "master.md+workflow.md"
    return m, variants


def backup_path(p, tag):
    safe = p.replace(":", "_").replace("\\", "_").replace("/", "_")
    d = os.path.join(BACKUPS, RUN_ID, tag)
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, safe)


def atomic_write(p, data):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    tmp = p + ".agents-sync.tmp"
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, p)


def cap_problem(t, data):
    if "cap_chars" in t and len(data.decode("utf-8")) > t["cap_chars"]:
        return "chars %d > cap %d" % (len(data.decode("utf-8")), t["cap_chars"])
    if "cap_bytes" in t and len(data) > t["cap_bytes"]:
        return "bytes %d > cap %d" % (len(data), t["cap_bytes"])
    return ""


def _strip_atk_bytes(body):
    text = body.decode("utf-8")
    text = re.sub(r"\n## (?:0\.\d+\s+)?POSTURE LOCK[\s\S]*?(?=\n## PART 0:|\n## 0\. )", "\n", text)
    text = re.sub(r"\n- \*\*Adversarial Security Analysis \(ATK Inversion\):\*\*[^\n]*", "", text)
    text = re.sub(r"\n- \*\*Phân tích An ninh Đối kháng \(Adversarial Security Analysis / ATK Inversion\):\*\*[^\n]*", "", text)
    return text.encode("utf-8")


def pick(t, variants, default_order):
    """(variant, bytes, stamp_or_reason)."""
    prefix = t.get("prefix", "").encode("utf-8")
    order = [t["force_variant"]] if t.get("force_variant") else t.get("tier_order", default_order)
    why = []
    for name in order:
        if name not in variants:
            why.append("%s: khong co" % name)
            continue
        stamp, body = variants[name]
        if t.get("strip_atk"):
            body = _strip_atk_bytes(body)
        data = prefix + body
        p = cap_problem(t, data)
        if not p:
            return name, data, stamp
        why.append("%s: %s" % (name, p))
    return None, None, " | ".join(why)

def split_body(body, prefix, maxc, maxb, tag=""):
    """Cắt tại heading ## / ### ngoài fenced code; gắn dòng đánh dấu chunk i/n."""
    MARK_RESERVE = 90
    lines = body.decode("utf-8").split("\n")
    fence = False
    cuts = []
    for i, l in enumerate(lines):
        s = l.strip()
        if s.startswith("```") or s.startswith("~~~"):
            fence = not fence
            continue
        if fence or i == 0:
            continue
        if l.startswith("## ") or l.startswith("### "):
            cuts.append(i)
    pts = [0] + cuts + [len(lines)]
    blocks = ["\n".join(lines[pts[j]:pts[j + 1]]) for j in range(len(pts) - 1)]
    budget_c = maxc - len(prefix.decode("utf-8")) - MARK_RESERVE
    budget_b = maxb - len(prefix) - MARK_RESERVE
    chunks, cur = [], ""
    for b in blocks:
        cand = b if not cur else cur + "\n" + b
        if cur and (len(cand) > budget_c or len(cand.encode()) > budget_b):
            chunks.append(cur)
            cur = b
        else:
            cur = cand
    if cur:
        chunks.append(cur)
    n = len(chunks)
    out = []
    for i, c in enumerate(chunks, 1):
        mk = "<!-- agents-sync %s chunk %d/%d -->\n" % (tag, i, n) if tag else ""
        out.append(prefix + mk.encode("utf-8") + c.encode("utf-8"))
    return out


def target_outputs(t, variants, default_order):
    var, data, info = pick(t, variants, default_order)
    if var is None:
        return None, info
    if "split_max_chars" in t or "split_max_bytes" in t:
        if "{n}" not in t["path"]:
            return None, "target co split_max_* thi path PHAI chua {n}"
        prefix = t.get("prefix", "").encode("utf-8")
        src = os.path.basename(ex(SOURCE_PATHS.get(var, var)))
        parts = split_body(data[len(prefix):], prefix, t.get("split_max_chars", 10 ** 9),
                           t.get("split_max_bytes", 10 ** 9), "%s @ %s" % (src, info))
        return [(ex(t["path"].replace("{n}", str(i))), d, var) for i, d in enumerate(parts, 1)], info
    return [(ex(t["path"]), data, var)], info


def run_lint():
    ok = True
    for script in (LINT, LINT_SKILLS):
        if not os.path.isfile(script):
            continue
        r = subprocess.run([sys.executable, script], capture_output=True, text=True, encoding="utf-8", errors="replace")
        print(r.stdout.rstrip())
        ok = ok and r.returncode == 0
    return ok


# ----------------------------------------------------------------- skills
def is_link(p):
    try:
        return os.path.islink(p) or bool(os.stat(p, follow_symlinks=False).st_file_attributes & 0x400)
    except (OSError, AttributeError):
        return os.path.islink(p)


def tree_hash(p):
    """Hash noi dung cay thu muc (bo __pycache__); None neu khong ton tai; 'LINK' neu la junction/symlink."""
    if not os.path.lexists(p):
        return None
    if is_link(p):
        return "LINK"
    m = hashlib.sha256()
    for r, ds, fs in os.walk(p):
        ds[:] = sorted(d for d in ds if d not in SKIP_NAMES)
        for f in sorted(fs):
            if f in SKIP_NAMES:
                continue
            fp = os.path.join(r, f)
            m.update(os.path.relpath(fp, p).replace("\\", "/").encode())
            m.update(b"\0")
            with open(fp, "rb") as fh:
                m.update(fh.read())
    return m.hexdigest()[:12]


def skills_conf(m):
    sk = m.get("skills")
    if not sk:
        return None, [], [], [], []
    src = ex(sk["source"])
    names = sorted(n for n in os.listdir(src) if os.path.isdir(os.path.join(src, n))) if os.path.isdir(src) else []
    return src, names, sk.get("targets", []), sk.get("retire_dirs", []), sk.get("retire_names", [])


def remove_skill_dir(p, tag, yes):
    """Chuyen ban hien co vao backup roi go. Junction: chi ghi dich + rmdir (khong di xuyen)."""
    if not yes or not os.path.lexists(p):
        return
    bdir = os.path.join(BACKUPS, RUN_ID, "skills", tag)
    os.makedirs(bdir, exist_ok=True)
    name = os.path.basename(p)
    if is_link(p):
        try:
            dest = os.readlink(p)
        except OSError:
            dest = "?"
        with open(os.path.join(bdir, name + ".link.txt"), "w", encoding="utf-8") as fh:
            fh.write(dest)
        os.rmdir(p)
    else:
        dst = os.path.join(bdir, name)
        try:
            os.rename(p, dst)
        except OSError:
            shutil.copytree(p, dst)
            shutil.rmtree(p, onerror=_on_rm_error)


def validate_target_skills_config(names, target, target_dir):
    ALLOWED_KEYS = {"id", "dir", "evidence", "create", "exclude_names", "target_only_names", "preserve_names"}
    bad_keys = set(target.keys()) - ALLOWED_KEYS
    if bad_keys:
        sys.exit("UNKNOWN key in skill target %s: %s" % (target.get("id"), ",".join(sorted(bad_keys))))
    name_pat = re.compile(r"^[a-z0-9][a-z0-9-]*$")
    excluded = set(target.get("exclude_names", []))
    unknown = excluded - set(names)
    if unknown:
        sys.exit("UNKNOWN skill exclusion for %s: %s" % (target["id"], ",".join(sorted(unknown))))
    target_only = set(target.get("target_only_names", []) + target.get("preserve_names", []))
    for n in target_only:
        if not name_pat.match(n):
            sys.exit("INVALID target_only skill name in %s: %s" % (target["id"], n))
    collision = target_only & set(names)
    if collision:
        sys.exit("COLLISION: target_only skill exists in source for %s: %s" % (target["id"], ",".join(sorted(collision))))
    ex_collision = target_only & excluded
    if ex_collision:
        sys.exit("COLLISION: target_only skill also in exclude_names for %s: %s" % (target["id"], ",".join(sorted(ex_collision))))
    for n in target_only:
        p = os.path.join(target_dir, n)
        if not os.path.isdir(p) or is_link(p) or not os.path.isfile(os.path.join(p, "SKILL.md")):
            sys.exit("MISSING target_only skill in %s: %s (must be real dir with SKILL.md)" % (target["id"], n))

def target_skill_names(names, target):
    excluded = set(target.get("exclude_names", []))
    unknown = excluded - set(names)
    if unknown:
        sys.exit("UNKNOWN skill exclusion for %s: %s" % (target["id"], ",".join(sorted(unknown))))
    return [name for name in names if name not in excluded]


def skills_apply(m, yes):
    src_cfg = m.get("skills", {}).get("source")
    if src_cfg:
        src_dir = ex(src_cfg)
        if not os.path.isdir(src_dir):
            sys.exit("MISSING skill source: %s (skill sync aborted before writes)" % src_dir)
        source_names = sorted(n for n in os.listdir(src_dir) if os.path.isdir(os.path.join(src_dir, n)))
        for target_config in m.get("skills", {}).get("targets", []):
            validate_target_skills_config(source_names, target_config, ex(target_config["dir"]))
        orca_skills_dir = os.path.join(ROOT, "skills")
        if os.path.isdir(orca_skills_dir):
            for n in sorted(os.listdir(orca_skills_dir)):
                cand_dir = os.path.join(orca_skills_dir, n)
                cand_md = os.path.join(cand_dir, "SKILL.md")
                dst_md = os.path.join(src_dir, n, "SKILL.md")
                if os.path.isfile(cand_md) and not is_link(cand_dir) and os.path.isdir(os.path.join(src_dir, n)):
                    cb = rb(cand_md)
                    db = rb(dst_md)
                    if cb and cb != db and b"---" in cb[:16]:
                        print("absorb   orca-skill     %s (~/.agents/skills -> source/skills)" % n)
                        if yes:
                            if db is not None:
                                shutil.copy2(dst_md, backup_path(dst_md, "orca-absorb"))
                            atomic_write(dst_md, cb)
                print("retire   orca-canonical %s -> backup" % n)
                remove_skill_dir(cand_dir, "orca-canonical", yes)
            if yes and os.path.isdir(orca_skills_dir) and not os.listdir(orca_skills_dir):
                os.rmdir(orca_skills_dir)
    src, names, targets, retire_dirs, retire_names = skills_conf(m)
    if src is None:
        return
    print("\n== SKILLS (%d skill tu %s) ==" % (len(names), src))
    state = json.load(open(SKILL_STATE, encoding="utf-8")) if os.path.isfile(SKILL_STATE) else {}
    srch = {n: tree_hash(os.path.join(src, n)) for n in names}
    # Validate ALL target configs upfront before any mutation
    for t in targets:
        validate_target_skills_config(names, t, ex(t["dir"]))
    new_state = {}
    for t in targets:
        target_names = target_skill_names(names, t)
        d = ex(t["dir"])
        if not os.path.isdir(d):
            if not t.get("create"):
                print("SKIP     skills:%-14s thu muc khong ton tai: %s" % (t["id"], d))
                continue
            if yes:
                os.makedirs(d, exist_ok=True)
        n_ok = n_w = 0
        for n in target_names:
            p = os.path.join(d, n)
            if tree_hash(p) == srch[n]:
                n_ok += 1
                continue
            n_w += 1
            print("%-8s skills:%-14s %s" % ("update" if os.path.lexists(p) else "create", t["id"], n))
            if yes:
                remove_skill_dir(p, t["id"], yes)
                shutil.copytree(os.path.join(src, n), p, ignore=shutil.ignore_patterns(*SKIP_NAMES))
                if tree_hash(p) != srch[n]:
                    sys.exit("VERIFY FAIL skill %s -> %s" % (n, p))
        target_only = set(t.get("target_only_names", []) + t.get("preserve_names", []))
        missing_to = [n for n in target_only if not os.path.lexists(os.path.join(d, n))]
        if missing_to:
            sys.exit("UNKNOWN target_only skill for %s: %s" % (t["id"], ",".join(sorted(missing_to))))
        gone = ((set(state.get(t["id"], [])) - set(target_names)) |
                (set(names) - set(target_names)) |
                set(retire_names)) - target_only
        for n in sorted(gone):
            p = os.path.join(d, n)
            if os.path.lexists(p):
                print("retire   skills:%-14s %s -> backup" % (t["id"], n))
                remove_skill_dir(p, t["id"], yes)
        new_state[t["id"]] = target_names
        print("skills:%-14s ok=%d ghi=%d  %s" % (t["id"], n_ok, n_w, d))
    for rd in retire_dirs:
        d = ex(rd["dir"])
        for n in sorted(set(names) | set(retire_names)):
            p = os.path.join(d, n)
            if os.path.lexists(p):
                print("retire   skills:%-14s %s -> backup (%s)" % (rd["id"], n, rd.get("reason", "")))
                remove_skill_dir(p, rd["id"], yes)
    if yes:
        atomic_write(SKILL_STATE, (json.dumps(new_state, indent=1, ensure_ascii=False) + "\n").encode("utf-8"))


def skills_verify(m):
    src, names, targets, retire_dirs, retire_names = skills_conf(m)
    if src is None:
        return 0
    bad = 0
    print("\n== SKILLS (%d) ==" % len(names))
    srch = {n: tree_hash(os.path.join(src, n)) for n in names}
    for t in targets:
        target_names = target_skill_names(names, t)
        d = ex(t["dir"])
        miss = [n for n in target_names if tree_hash(os.path.join(d, n)) != srch[n]]
        left = [n for n in retire_names if os.path.lexists(os.path.join(d, n))]
        excluded_left = [n for n in t.get("exclude_names", []) if os.path.lexists(os.path.join(d, n))]
        target_only = set(t.get("target_only_names", []) + t.get("preserve_names", []))
        missing_to = [n for n in target_only if not os.path.lexists(os.path.join(d, n))]
        bad += len(miss) + len(left) + len(excluded_left) + len(missing_to)
        print("%-8s skills:%-14s %d/%d khop%s%s%s  %s" % ("OK" if not (miss or left or excluded_left) else "STALE", t["id"], len(target_names) - len(miss),
              len(target_names), (" lech=" + ",".join(miss[:6])) if miss else "", (" con_retire=" + ",".join(left)) if left else "", (" con_exclude=" + ",".join(excluded_left)) if excluded_left else "", d))
    for rd in retire_dirs:
        d = ex(rd["dir"])
        left = [n for n in set(names) | set(retire_names) if os.path.lexists(os.path.join(d, n))]
        bad += len(left)
        print("%-8s skills:%-14s retire_dir con %d  %s" % ("OK" if not left else "PRESENT", rd["id"], len(left), d))
    return bad


def cmd_verify():
    m, variants = load()
    order = m.get("_tier_order", DEFAULT_TIER_ORDER)
    for k in ["full", "master", "workflow", "capped", "lite"]:
        if k in variants:
            st, body = variants[k]
            print("source %-8s stamp=%s  %6d chars  %6d bytes" % (k, st, len(body.decode("utf-8")), len(body)))
    bad = 0
    print("\n== TARGETS ==")
    for t in m["targets"]:
        outs, info = target_outputs(t, variants, order)
        if outs is None:
            bad += 1
            print("NOFIT    %-22s %s [%s]" % (t["id"], t["path"], info))
            continue
        for p, data, var in outs:
            b = rb(p)
            st = "MISSING" if b is None else ("OK" if b == data else "STALE")
            bad += st != "OK"
            print("%-8s %-22s %-8s %s %s" % (st, t["id"], var, info if st == "OK" else h8(b), p))
    print("\n== RETIRE (con ton tai = lech) ==")
    for r in m["retire"]:
        exists = os.path.exists(ex(r["path"]))
        bad += exists
        print("%-8s %s" % ("PRESENT" if exists else "gone", r["path"]))
    n = sum(1 for p in m["inert"] if os.path.exists(ex(p)))
    for p in m["inert"]:
        if os.path.exists(ex(p)):
            print("inert    %s" % p)
    bad += skills_verify(m)
    print("\nsummary: %d target/retire con lech, %d inert file" % (bad, n))
    return 1 if bad else 0


def cmd_apply(yes):
    if not run_lint():
        print("\nAPPLY TU CHOI: nguon con chi tiet co dinh (xem lint o tren).")
        return 1
    m, variants = load()
    # Preflight validate ALL skill targets BEFORE any mutation (rules, retire, or skills)
    sk = m.get("skills")
    if sk and sk.get("source"):
        src = ex(sk["source"])
        if not os.path.isdir(src):
            sys.exit("MISSING skill source: %s (apply aborted before writes)" % src)
        names = sorted(n for n in os.listdir(src) if os.path.isdir(os.path.join(src, n)))
        for t in sk.get("targets", []):
            validate_target_skills_config(names, t, ex(t["dir"]))
    order = m.get("_tier_order", DEFAULT_TIER_ORDER)
    print("[%s] backup dir: %s" % ("APPLY" if yes else "DRY-RUN", os.path.join(BACKUPS, RUN_ID)))
    for t in m["targets"]:
        outs, info = target_outputs(t, variants, order)
        if outs is None:
            print("SKIP     %-22s %s [%s]" % (t["id"], t["path"], info))
            continue
        if "{n}" in t["path"]:
            pre, suf = os.path.basename(t["path"]).split("{n}", 1)
            d0 = os.path.dirname(ex(t["path"].replace("{n}", "")))
            if os.path.isdir(d0):
                for f in sorted(os.listdir(d0)):
                    fp = os.path.join(d0, f)
                    num = f[len(pre):len(f) - len(suf)] if f.startswith(pre) and f.endswith(suf) else ""
                    if num.isdigit() and int(num) > len(outs) and os.path.isfile(fp):
                        print("stale    %-22s chunk %s -> backup" % (t["id"], num))
                        if yes:
                            shutil.move(fp, backup_path(fp, "stalechunks"))
        for p, data, var in outs:
            b = rb(p)
            if b == data:
                print("ok       %-22s %-8s %s" % (t["id"], var, p))
                continue
            if b is None and not t.get("create") and not os.path.isdir(os.path.dirname(p)):
                print("SKIP     %-22s parent missing: %s" % (t["id"], p))
                continue
            print("%-8s %-22s %-8s %s" % ("create" if b is None else "overwrite", t["id"], var, p))
            if yes:
                if b is not None:
                    shutil.copy2(p, backup_path(p, "targets"))
                atomic_write(p, data)
                if rb(p) != data:
                    sys.exit("VERIFY FAIL after write: " + p)
    for r in m["retire"]:
        p = ex(r["path"])
        if not os.path.exists(p):
            continue
        print("retire   %s -> backup" % r["path"])
        if yes:
            shutil.move(p, backup_path(p, "retired"))
    skills_apply(m, yes)
    if yes:
        print("\nretention:")
        prune_backups(m.get("_backup_keep", DEFAULT_BACKUP_KEEP), yes)
        print("\nre-verify:")
        return cmd_verify()
    print("\n(dry-run; them --yes de ghi)")
    return 0


def _on_rm_error(func, path, exc):
    os.chmod(path, 0o700)
    func(path)


def prune_backups(keep, yes):
    """Giữ `keep` run-dir YYYYMMDD-HHMMSS mới nhất; thư mục tên khác (snapshot-*) không bị chạm."""
    if keep is None or keep < 0 or not os.path.isdir(BACKUPS):
        print("retention: tat hoac khong co backups")
        return 0
    runs = sorted((d for d in os.listdir(BACKUPS)
                   if BACKUP_RUN_RE.match(d) and os.path.isdir(os.path.join(BACKUPS, d))), reverse=True)
    victims = runs[keep:]
    print("[%s] retention keep=%d | run-dir=%d | se xoa=%d" % ("APPLY" if yes else "DRY-RUN", keep, len(runs), len(victims)))
    for d in victims:
        print("  rm  %s" % d)
        if yes:
            shutil.rmtree(os.path.join(BACKUPS, d), onerror=_on_rm_error)
    return len(victims)


def cmd_prune(yes):
    m, _ = load()
    live = {ex(t["path"]) for t in m["targets"]}
    names = {"AGENTS.md", "CLAUDE.md", "GEMINI.md", "universal.md", "user_rules.md", "global_rules.md"}
    dirs, cands = set(), []
    for pth in m["inert"]:
        p = ex(pth)
        dirs.add(os.path.dirname(p))
        if os.path.isfile(p):
            cands.append(p)
    for t in m["targets"]:
        dirs.add(os.path.dirname(ex(t["path"])))
        names.add(os.path.basename(ex(t["path"])))
    for d in sorted(dirs):
        if os.path.isdir(d):
            for f in sorted(os.listdir(d)):
                p = os.path.join(d, f)
                if os.path.isfile(p) and p not in live and any(f.startswith(n + ".bak") or f == n + ".agents-sync.tmp" for n in names):
                    cands.append(p)
    cands = list(dict.fromkeys(c for c in cands if c not in live))
    print("[%s] %d file -> %s" % ("APPLY" if yes else "DRY-RUN", len(cands), os.path.join(BACKUPS, RUN_ID, "legacy")))
    for p in cands:
        print("archive  %s" % p)
        if yes:
            shutil.move(p, backup_path(p, "legacy"))
    return 0


def main(argv):
    yes = "--yes" in argv
    args = [a for a in argv[1:] if a != "--yes"]
    cmd = args[0] if args else ""
    if cmd == "verify":
        return cmd_verify()
    if cmd == "apply":
        return cmd_apply(yes)
    if cmd == "prune":
        return cmd_prune(yes)
    if cmd == "retention":
        m, _ = load()
        prune_backups(m.get("_backup_keep", DEFAULT_BACKUP_KEEP), yes)
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
