# -*- coding: utf-8 -*-
"""
fill_transcript_gaps.py — Vá phụ đề cho video bị Whisper bỏ sót đoạn.

Khác transcribe_sku.py (bóc lại cả video): chỉ bóc lại đúng các cửa sổ có vấn đề rồi ghép vào
transcript hiện có, giữ nguyên phần đã tốt.
  - Cửa sổ 1: khoảng trống phụ đề >= GAP_MIN giây mà audio KHÔNG im lặng (đối chiếu silence.json).
  - Cửa sổ 2: segment "nén chữ" (rớt nguyên âm), ảo giác, hoặc bị sập cửa sổ 30s (dài >=14s nhưng <1.3 từ/giây nói).
Whisper = Groq whisper-large-v3 & whisper-large-v3-turbo qua GroqKeyManager của transcribe_sku.py.

Chạy:  py -3 scripts/fill_transcript_gaps.py VIDEO-xxxxxx [VIDEO-yyyyyy ...] [--dry]
Sao lưu transcript gốc vào _backup/<ngày>-fill-gaps/<SKU>/ trước khi ghi.
"""
import importlib.util
import json
import shutil
import sys
import time
from datetime import date
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("tsku", ROOT / "scripts" / "transcribe_sku.py")
tsku = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tsku)

GAP_MIN = 8.5       # khoảng trống tối thiểu cần vá (giây)
PAD = 0.5           # đệm hai đầu cửa sổ khoảng trống
SILENCE_JSON = ROOT / "_audit" / "20260918-full-136-audit" / "silence.json"


def silent_share(start, end, regions):
    """Tỷ lệ [start,end] nằm trong vùng im lặng (silencedetect)."""
    if end <= start:
        return 1.0
    covered = 0.0
    for r in regions:
        a = max(start, r.get("start", 0))
        b = min(end, r.get("end", 0))
        if b > a:
            covered += b - a
    return covered / (end - start)


def is_bad_seg(s, regions=None):
    txt = (s.get("text") or "").strip()
    if not txt or tsku.is_compressed(txt) or tsku.is_hallucination(txt):
        return True
    dur = max(0.0, float(s.get("end", 0)) - float(s.get("start", 0)))
    if dur >= 14.0:
        sil = silent_share(float(s.get("start", 0)), float(s.get("end", 0)), regions or [])
        talk = dur * (1.0 - sil)
        if talk >= 10.0 and (len(txt.split()) / talk) < 1.3:
            return True
    return False


def find_windows(segs, total_dur, regions):
    wins = []
    good_segs = [s for s in segs if not is_bad_seg(s, regions)]
    prev_end = 0.0
    for s in good_segs + [{"start": total_dur, "end": total_dur, "text": ""}]:
        gap = s["start"] - prev_end
        if gap >= GAP_MIN and silent_share(prev_end, s["start"], regions) < 0.8:
            wins.append([max(0.0, prev_end - PAD), min(total_dur, s["start"] + PAD), "gap"])
        prev_end = max(prev_end, s["end"])
    for s in segs:
        if is_bad_seg(s, regions):
            wins.append([s["start"], s["end"], "compressed"])
    wins.sort()
    merged = []
    for w in wins:
        if merged and w[0] <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], w[1])
            if w[2] == "gap":
                merged[-1][2] = "gap"
        else:
            merged.append(w)
    # Cua so dai (>25s) bi Whisper bo sot nhieu hon -> cat thanh manh <= 22s (khong chong lap)
    out = []
    for w0, w1, kind in merged:
        if w1 - w0 <= 25:
            out.append([w0, w1, kind])
            continue
        a = w0
        while a < w1 - 0.5:
            b = min(w1, a + 22.0)
            out.append([a, b, kind])
            if b >= w1:
                break
            a = b
    return out


def collect(resp, w0, total):
    out = []
    for sg in resp.get("segments", []):
        text = (sg.get("text") or "").strip()
        if not text or tsku.is_hallucination(text) or tsku.is_compressed(text):
            continue
        s0 = round(w0 + sg.get("start", 0.0), 3)
        s1 = round(w0 + sg.get("end", 0.0), 3)
        out.append({"start": s0, "end": min(s1, total), "text": text})
    return out


def run_window(key_mgr, media, tmp_dir, idx_prefix, w0, w1, total, regions=None):
    """Chay 2 mo hinh cho cung cua so roi chon ban tot hon:
       A = large-v3 khong prompt (tranh echo VI_PROMPT gay nen chu),
       B = large-v3-turbo khong prompt.
       Neu ca hai deu rong va cua so >= 10s, chia doi cua so de cuu."""
    mp3 = tmp_dir / f"{idx_prefix}.mp3"
    if not tsku.extract_audio_chunk(media, w0, w1 - w0, mp3):
        return []
    def score(segs):
        good = [x for x in segs if not is_bad_seg(x, regions)]
        bad_cnt = len(segs) - len(good)
        words = sum(len(x["text"].split()) for x in good)
        return words - 20 * bad_cnt
    try:
        a = collect(tsku.call_groq_whisper(key_mgr, mp3, prompt=""), w0, total)
        b = collect(tsku.call_groq_whisper(key_mgr, mp3, prompt="", model="whisper-large-v3-turbo"), w0, total)
    finally:
        mp3.unlink(missing_ok=True)
    best = [x for x in (b if score(b) >= score(a) else a) if not is_bad_seg(x, regions)]
    if not best and (w1 - w0) >= 10.0:
        mid = round((w0 + w1) / 2.0, 2)
        left = run_window(key_mgr, media, tmp_dir, idx_prefix + "L", w0, mid, total, regions)
        right = run_window(key_mgr, media, tmp_dir, idx_prefix + "R", mid, w1, total, regions)
        best = left + right
    return best


def overlap(a0, a1, b0, b1):
    return max(0.0, min(a1, b1) - max(a0, b0))


def dedup_and_clean(segs):
    """Loai bo cac segment trung lap do bien cua so va sap xep tang dan nghiem ngat."""
    segs = sorted(segs, key=lambda s: (float(s["start"]), -float(s["end"])))
    cleaned = []
    for s in segs:
        s0, s1 = float(s["start"]), float(s["end"])
        txt = (s.get("text") or "").strip()
        if not txt or s1 <= s0 + 0.15:
            continue
        # Kiem tra trung lap voi segment truoc do trong cleaned
        drop = False
        for prev in list(cleaned):
            p0, p1 = float(prev["start"]), float(prev["end"])
            ov = overlap(s0, s1, p0, p1)
            min_dur = max(0.1, min(s1 - s0, p1 - p0))
            if ov > 0.45 * min_dur:
                # Giu segment co nhieu tu hon
                if len(txt.split()) > len(prev["text"].split()):
                    cleaned.remove(prev)
                else:
                    drop = True
                    break
        if not drop:
            cleaned.append({"start": round(s0, 3), "end": round(s1, 3), "text": txt})
    cleaned.sort(key=lambda s: (s["start"], s["end"]))
    # Khong de chồng lấn mốc end > next.start
    for i in range(len(cleaned) - 1):
        if cleaned[i]["end"] > cleaned[i + 1]["start"]:
            cleaned[i]["end"] = cleaned[i + 1]["start"]
    return [c for c in cleaned if c["end"] > c["start"] + 0.1]


def process(sku, key_mgr, dry):
    folder = ROOT / "video" / sku
    jpath = folder / "transcript.json"
    data = json.loads(jpath.read_text(encoding="utf-8"))
    segs = dedup_and_clean(data["segments"])
    media = (list(folder.glob("*.mp4")) + list(folder.glob("*.webm")))[0]
    total = tsku.get_video_duration(media)
    local_sil = folder / "silence.json"
    if local_sil.exists():
        sil = json.loads(local_sil.read_text(encoding="utf-8"))
    elif SILENCE_JSON.exists():
        sil = json.loads(SILENCE_JSON.read_text(encoding="utf-8"))["videos"].get(sku, {})
    else:
        sil = {}
    regions = sil.get("silence_regions") or []
    wins = find_windows(segs, total, regions)
    print(f"[{sku}] dur={total:.1f}s segs={len(segs)} cua so can va={len(wins)}")
    for w in wins:
        print(f"   - {w[2]:10s} {w[0]:7.1f} -> {w[1]:7.1f} ({w[1]-w[0]:.1f}s)")
    if dry:
        return True

    tmp = folder / "_temp_fill"
    tmp.mkdir(exist_ok=True)
    bad_initial = [s for s in segs if is_bad_seg(s, regions)]
    kept = [s for s in segs if not is_bad_seg(s, regions)]
    added = 0
    removed = len(bad_initial)
    try:
        for i, (w0, w1, kind) in enumerate(wins):
            new = run_window(key_mgr, media, tmp, f"w{i:03d}", w0, w1, total, regions)
            kept.extend(new)
            added += len(new)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    kept = dedup_and_clean(kept)
    out = []
    for k, s in enumerate(kept, 1):
        s0, s1 = float(s["start"]), float(s["end"])
        out.append({"id": k, "start": s0, "end": s1,
                    "start_time": tsku.format_srt_time(s0), "end_time": tsku.format_srt_time(s1),
                    "text": s["text"]})
    print(f"[{sku}] them {added} segment, bo {removed} segment loi -> tong sau dedup {len(out)}")

    bk = ROOT / "_backup" / (date.today().strftime("%Y%m%d") + "-fill-gaps") / sku
    bk.mkdir(parents=True, exist_ok=True)
    for name in ("transcript.json", "transcript.srt", "transcript.txt"):
        if (folder / name).exists() and not (bk / name).exists():
            shutil.copy2(folder / name, bk / name)

    data["segments"] = out
    data["duration"] = data.get("duration", total)
    if "full_text" in data:
        data["full_text"] = " ".join(s["text"] for s in out)
    jpath.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    with open(folder / "transcript.srt", "w", encoding="utf-8") as sf:
        for s in out:
            sf.write(f"{s['id']}\n{tsku.format_srt_time(s['start'])} --> {tsku.format_srt_time(s['end'])}\n{s['text']}\n\n")
    (folder / "transcript.txt").write_text("\n".join(s["text"] for s in out) + "\n", encoding="utf-8")
    print(f"[{sku}] da ghi transcript.json/.srt/.txt (goc: {bk})")
    return True


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry" in sys.argv
    if not args:
        print(__doc__)
        sys.exit(1)
    km = None if dry else tsku.GroqKeyManager(tsku.GROQ_CONFIG_PATH)
    ok = True
    for sku in args:
        t0 = time.time()
        ok = process(sku, km, dry) and ok
        print(f"[{sku}] xong {time.time()-t0:.1f}s")
    sys.exit(0 if ok else 1)
