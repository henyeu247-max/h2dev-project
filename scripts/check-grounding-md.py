# Kiểm file SOP assets/docs/VIDEO-*/*.md bám nguồn của chính video (transcript + tiêu đề + .txt/.csv đính kèm).
# Token cần bằng chứng: @handle, số >=3 chữ số hoặc có dấu thập phân/%, tên riêng/công cụ Latin viết hoa giữa câu.
# Bỏ qua: dòng tiêu đề (#), dòng metadata '> **', từ viết hoa đầu câu, từ vựng chung (GENERIC), số 1-2 chữ số, năm 2024-2026.
# Chạy: py -3 scripts/check-grounding-md.py [--live] [file.md ...]   (exit 1 nếu còn token chưa có bằng chứng)
import glob, importlib.util, json, os, re, sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
_spec = importlib.util.spec_from_file_location("cg", os.path.join("scripts", "check-grounding.py"))
cg = importlib.util.module_from_spec(_spec)
_argv = sys.argv; sys.argv = ["x"]; _spec.loader.exec_module(cg); sys.argv = _argv

GENERIC = set(x.lower() for x in """Hook Audio Thumbnail Channel Content Background B-roll Voice Part Reused Unlisted Chill Senior Speed Loop
Visual Sound Features Global Footage Library Motion Avoid Flags Use SFX Claim Voiceover FAQ TTS SKU H2DEV USD M01 M02 M03 M04 M05 M06
M07 M08 M09 M10 Module Video Title Script Prompt Text Image Style Scene Shot Timeline Export Import Project Setting Settings Template
Intro Outro Short Shorts Long Format Quality Check Step Steps Rule Rules Tips Tip Note Warning Tool Tools Data Report Draft Final
Master Backup Upload Download File Folder Link Account Email Password Profile Browser Mobile Desktop Free Pro Premium Basic Standard
Original Reup Reupload Copyright Policy Strike Review Monetization Revenue Analytics Studio Dashboard Playlist Community Comment
Subscribe Subscriber Views View Watch Time Retention Click Rate Impression Niche Market Global Vietnam English Korean Japanese
Chinese Max Min Auto Manual Light Dark High Low Medium Normal Fast Slow Start End Open Close Save Delete Copy Paste Cut Split
Trim Crop Zoom Fade Mask Layer Track Clip Frame Frames Effect Effects Filter Transition Overlay Subtitle Subtitles Caption Captions
Voiceovers Narration Music Noise Bass Mix Mixing Master Level Volume Gain Normalize Loudness Resolution Bitrate Codec""".split())

def tok_iter(line):
    for m in re.finditer(r"@[\w.\-]+|\d[\d.,]*%?|[A-Z][A-Za-z0-9+\-]{2,}", line):
        yield m

def check_file(path, ins):
    sku = os.path.basename(os.path.dirname(path))
    corp = cg.corpus(sku, ins)
    bad = []
    for ln, line in enumerate(open(path, encoding="utf-8").read().split("\n"), 1):
        s = line.strip()
        if s.startswith("#") or s.startswith("> **") or not s:
            continue
        for m in tok_iter(line):
            t = m.group(0); pre = line[:m.start()]
            if t[0].isalpha() and m.end() < len(line) and line[m.end()].isalpha():
                continue  # chữ Việt có dấu bị regex cắt đôi
            if t[0].isdigit():
                core = re.sub(r"\D", "", t)
                if len(core) < 3 and "." not in t.rstrip(".,") and "%" not in t:
                    continue
                if re.fullmatch(r"20(2[4-6])", core): continue
                t = t.rstrip(".,")
                if not t: continue
            elif t[0].isalpha():
                if t.lower() in GENERIC: continue
                if t.isalpha() and (pre.strip(" *-_>`\"'(") == "" or re.search(r"[:.;!?]\s*[*_`\"'(]*$", pre)):
                    continue
            if t.startswith('@'):
                if t.lower() in cg.rawcorpus(sku, ins):
                    continue
            if not cg.grounded(t, corp, sku):
                bad.append((ln, t, s[:80]))
    return sku, bad

if __name__ == "__main__":
    ins = json.load(open("data/video_insights.json", encoding="utf-8"))
    files = [a for a in sys.argv[1:] if not a.startswith("--")]
    if "--live" in sys.argv or not files:
        files = sorted(glob.glob("assets/docs/VIDEO-*/*.md"))
    total = 0
    quiet = "--quiet" in sys.argv
    for f in files:
        sku, bad = check_file(f, ins)
        total += len(bad)
        if not quiet:
            for ln, t, ctx in bad:
                print(f"{f}:{ln} {t}  <-  {ctx}")
    print("TOTAL ungrounded md tokens:", total, "in", len(files), "files")
    sys.exit(1 if total else 0)
