# -*- coding: utf-8 -*-
"""
frame_vision_audit.py — Trich khung hinh that + giam dinh bang vision local (9Router).

Muc dich: bang chung "kiem hinh + am thanh" cho Bo 10 Tieu Chuan Vang (tieu chuan 1 & 9).
Moi video: 3 khung (5% / 50% / 95%) + thumbnail -> ghep luoi -> hoi model vision.

Rubric tra ve JSON:
  visual_type    : screencast | talking-head | mixed | slideshow | unknown
  topic_match    : khop chu de bai giang khong (dung/khong ro/khong)
  thumb_match    : thumbnail co khop noi dung video khong
  anomalies      : danh sach bat thuong (man hinh den, loi, anh AI khong lien quan...)
  confidence     : 0-100

Chay:
  py scripts/frame_vision_audit.py                 # tat ca con thieu (resume)
  py scripts/frame_vision_audit.py --all           # chay lai toan bo
  py scripts/frame_vision_audit.py --sku VIDEO-xxx
  py scripts/frame_vision_audit.py --limit 5 --workers 6
Output: _audit/20260918-full-136-audit/vision.json
        _audit/20260918-full-136-audit/frames/<SKU>_grid.jpg  (bang chung)
"""
import argparse
import base64
import json
import os
import sqlite3
import subprocess
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FFMPEG = r"D:\Linly-Dubbing\bin\ffmpeg.exe"
FFPROBE = r"D:\Linly-Dubbing\bin\ffprobe.exe"
VIDEO_DIR = os.path.join(ROOT, "video")
OUT_DIR = os.path.join(ROOT, "_audit", "20260918-full-136-audit")
FRAME_DIR = os.path.join(OUT_DIR, "frames")
OUT_PATH = os.path.join(OUT_DIR, "vision.json")

DB_9ROUTER = os.path.expanduser(r"~\AppData\Roaming\9router\db\data.sqlite")
BASE_URL = "http://127.0.0.1:20128/v1/chat/completions"
MODEL = "ag/gemini-3.7-flash-low"
FALLBACK_MODEL = "Combo-Gemini-3.7-flash"
MAX_TOKENS = 700

PROMPT = """Ban la chuyen gia kiem dinh video bai giang YouTube. Duoi day la 3 khung hinh
trich tu CUNG MOT video bai giang (tai 5%, 50%, 95% thoi luong) + 1 thumbnail cua video.
Tra ve DUY NHAT mot JSON, khong giai thich them:
{"visual_type":"screencast|talking-head|mixed|slideshow|unknown",
 "topic_match":"yes|unclear|no",
 "thumb_match":"yes|unclear|no",
 "anomalies":["..."],
 "confidence":0-100,
 "summary":"1 cau tieng Viet mo ta video day lam gi"}
Quy uoc:
- screencast = quay man hinh thao tac phan mem/web.
- talking-head = co mat nguoi dan chuong trinh noi truc tiep.
- topic_match: 3 khung co cung mach noi dung bai giang khong (khong dung yen 1 canh vo nghia).
- thumb_match: thumbnail co lien quan noi dung video khong.
- anomalies: chi ghi bat thuong THAT (man hinh den, video loi, anh AI khong lien quan, trung lap vo nghia).
  Neu khong co bat thuong thi de []."""


def load_key():
    con = sqlite3.connect("file:%s?mode=ro" % DB_9ROUTER, uri=True)
    row = con.execute("SELECT key FROM apiKeys WHERE isActive=1 LIMIT 1").fetchone()
    con.close()
    if not row:
        raise RuntimeError("Khong tim thay API key active trong 9Router DB")
    return row[0]


def media_path(sku):
    for ext in (".mp4", ".webm"):
        p = os.path.join(VIDEO_DIR, sku, sku + ext)
        if os.path.exists(p):
            return p
    return None


def thumb_path(sku):
    for ext in (".jpg", ".jpeg", ".png", ".webp"):
        p = os.path.join(ROOT, "assets", "thumbs", sku + ext)
        if os.path.exists(p):
            return p
    return None


def probe_duration(path):
    try:
        out = subprocess.check_output(
            [FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path], timeout=60)
        return float(out.decode().strip())
    except Exception:  # noqa: BLE001
        return None


def grab(path, seconds, out):
    """Trich 1 khung, chuan hoa ve DUNG 560x315 (16:9) de ghep luoi an toan.
    Scale tran 558x313 (< dich 2px) truoc khi pad — tranh loi 'padded dimensions
    cannot be smaller than input dimensions' do ffmpeg lam tron aspect."""
    subprocess.run([FFMPEG, "-v", "error", "-y", "-ss", "%.1f" % seconds, "-i", path,
                    "-frames:v", "1",
                    "-vf", "scale=558:313:force_original_aspect_ratio=decrease,"
                           "pad=560:315:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1",
                    out],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180)
    return os.path.exists(out) and os.path.getsize(out) > 0


def build_grid(sku, media, thumb, work):
    dur = probe_duration(media)
    if not dur:
        return None, None
    shots = []
    for tag, frac in (("p05", 0.05), ("p50", 0.50), ("p95", 0.95)):
        out = os.path.join(work, "%s_%s.jpg" % (sku, tag))
        if grab(media, dur * frac, out):
            shots.append(out)
    if thumb:
        shots.append(thumb)
    if len(shots) < 2:
        return None, dur

    grid = os.path.join(FRAME_DIR, "%s_grid.jpg" % sku)
    args = [FFMPEG, "-v", "error", "-y"]
    for s in shots:
        args += ["-i", s]
    n = len(shots)
    # Chuan hoa MOI khung ve cung WxH roi moi ghep (thumbnail co ti le khac -> hstack se loi).
    # scale=force_original_aspect_ratio + pad => giu nguyen noi dung, khong meo hinh.
    W, H = 560, 315
    chain = "".join(
        "[%d:v]scale=558:313:force_original_aspect_ratio=decrease,"
        "pad=%d:%d:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[v%d];" % (i, W, H, i)
        for i in range(n))
    chain += "".join("[v%d]" % i for i in range(n)) + "hstack=inputs=%d[out]" % n
    args += ["-filter_complex", chain, "-map", "[out]", "-frames:v", "1", grid]
    proc = subprocess.run(args, stdout=subprocess.DEVNULL,
                          stderr=subprocess.PIPE, timeout=180)
    if not os.path.exists(grid) or os.path.getsize(grid) == 0:
        print("  [!] grid fail %s: %s" % (sku, proc.stderr.decode("utf-8", "ignore")[:200]),
              file=sys.stderr)
    for s in shots:
        if s.startswith(work):
            try:
                os.remove(s)
            except OSError:
                pass
    return (grid if os.path.exists(grid) and os.path.getsize(grid) > 0 else None), dur


def call_vision(key, grid, media_dur, model=MODEL, timeout=180):
    b64 = base64.b64encode(open(grid, "rb").read()).decode()
    body = {
        "model": model,
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": PROMPT + "\nThoi luong video: %.0f giay." % (media_dur or 0)},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64," + b64}},
        ]}],
        "max_tokens": MAX_TOKENS,
        "temperature": 0,
        "stream": True,
    }
    req = urllib.request.Request(
        BASE_URL, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + key},
        method="POST")
    t0 = time.time()
    content = ""
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        for raw in resp:
            line = raw.decode("utf-8", "ignore").strip()
            if not line.startswith("data:"):
                continue
            payload = line[5:].strip()
            if payload == "[DONE]":
                break
            try:
                delta = json.loads(payload)
            except Exception:  # noqa: BLE001
                continue
            ch = (delta.get("choices") or [{}])[0].get("delta", {})
            if ch.get("content"):
                content += ch["content"]
    return content, time.time() - t0


def parse_json(txt):
    s, e = txt.find("{"), txt.rfind("}")
    if s < 0 or e < 0:
        return None
    try:
        return json.loads(txt[s:e + 1])
    except Exception:  # noqa: BLE001
        return None


def audit_one(sku, key, work):
    media = media_path(sku)
    if not media:
        return sku, {"error": "missing media"}
    try:
        grid, dur = build_grid(sku, media, thumb_path(sku), work)
    except Exception as exc:  # noqa: BLE001
        return sku, {"error": "frames: %s" % str(exc)[:100]}
    if not grid:
        return sku, {"error": "no frames"}
    last_err = None
    for model in (MODEL, FALLBACK_MODEL):
        try:
            content, latency = call_vision(key, grid, dur, model)
            parsed = parse_json(content)
            if parsed:
                parsed["model"] = model
                parsed["latency_sec"] = round(latency, 1)
                parsed["grid"] = os.path.relpath(grid, ROOT).replace("\\", "/")
                parsed["duration_sec"] = round(dur, 1) if dur else None
                return sku, parsed
            last_err = "unparsable: %s" % content[:120]
        except Exception as exc:  # noqa: BLE001
            last_err = "%s: %s" % (type(exc).__name__, str(exc)[:100])
    return sku, {"error": last_err, "grid": os.path.relpath(grid, ROOT).replace("\\", "/")}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sku", action="append", default=[])
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=6)
    args = ap.parse_args()

    os.makedirs(FRAME_DIR, exist_ok=True)
    work = os.path.join(FRAME_DIR, "_tmp")
    os.makedirs(work, exist_ok=True)

    existing = {}
    if os.path.exists(OUT_PATH) and not args.all:
        try:
            with open(OUT_PATH, "r", encoding="utf-8") as fh:
                existing = json.load(fh).get("videos", {})
        except Exception:  # noqa: BLE001
            existing = {}
    if args.all:
        existing = {}

    if args.sku:
        skus = args.sku
    else:
        skus = sorted(d for d in os.listdir(VIDEO_DIR)
                      if os.path.isdir(os.path.join(VIDEO_DIR, d)))
    todo = [s for s in skus if s not in existing or "error" in existing.get(s, {})]
    if args.limit:
        todo = todo[:args.limit]

    key = load_key()
    print("frame_vision_audit: %d SKU can chay (tong %d, da co %d) | workers=%d"
          % (len(todo), len(skus), len(existing), args.workers), flush=True)

    def flush():
        tmp = OUT_PATH + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump({
                "schema": "h2dev.frame-vision.v1",
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "model": MODEL,
                "prompt_version": 1,
                "total": len(existing),
                "videos": existing,
            }, fh, ensure_ascii=False, indent=1)
        os.replace(tmp, OUT_PATH)

    t0 = time.time()
    done = 0
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for sku, data in pool.map(lambda s: audit_one(s, key, work), todo):
            existing[sku] = data
            done += 1
            if data.get("error"):
                print("  [%3d/%3d] %-42s ERR %s" % (done, len(todo), sku, data["error"]), flush=True)
            else:
                print("  [%3d/%3d] %-42s %-11s topic=%-7s thumb=%-7s anom=%d conf=%s (%.1fs)"
                      % (done, len(todo), sku, data.get("visual_type"), data.get("topic_match"),
                         data.get("thumb_match"), len(data.get("anomalies") or []),
                         data.get("confidence"), data.get("latency_sec") or 0), flush=True)
            if done % 5 == 0:
                flush()
    flush()
    try:
        os.rmdir(work)
    except OSError:
        pass
    print("Xong %d SKU trong %.0fs -> %s" % (done, time.time() - t0, OUT_PATH))


if __name__ == "__main__":
    main()
