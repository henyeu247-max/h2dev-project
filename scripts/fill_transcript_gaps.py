# -*- coding: utf-8 -*-
"""
fill_transcript_gaps.py — Vá phụ đề cho video bị Whisper bỏ sót đoạn.

Khác transcribe_sku.py (bóc lại cả video): chỉ bóc lại đúng các cửa sổ có vấn đề rồi ghép vào
transcript hiện có, giữ nguyên phần đã tốt.
  - Cửa sổ 1: khoảng trống phụ đề >= GAP_MIN giây mà audio KHÔNG im lặng (đối chiếu silence.json).
  - Cửa sổ 2: segment "nén chữ" (rớt nguyên âm) -> bóc lại đúng khoảng của segment đó.
Whisper = Groq whisper-large-v3 qua GroqKeyManager của transcribe_sku.py.

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

GAP_MIN = 15.0      # khoảng trống tối thiểu cần vá (giây)
PAD = 1.5           # đệm hai đầu cửa sổ khoảng trống
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


def find_windows(segs, total_dur, regions):
    wins = []
    prev_end = 0.0
    for s in segs + [{"start": total_dur, "end": total_dur, "text": ""}]:
        gap = s["start"] - prev_end
        if gap >= GAP_MIN and silent_share(prev_end, s["start"], regions) < 0.8:
            wins.append([max(0.0, prev_end - PAD), min(total_dur, s["start"] + PAD), "gap"])
        prev_end = max(prev_end, s["end"])
    for s in segs:
        if tsku.is_compressed(s.get("text", "")):
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
    # Cua so dai (>45s) bi Whisper bo sot nhieu hon -> cat thanh manh <= 35s (chong 1s)
    out = []
    for w0, w1, kind in merged:
        if w1 - w0 <= 45:
            out.append([w0, w1, kind])
            continue
        a = w0
        while a < w1 - 0.5:
            b = min(w1, a + 35.0)
            out.append([a, b, kind])
            if b >= w1:
                break
            a = b - 1.0
    return out


def collect(resp, w0, total):
    out = []
    for sg in resp.get("segments", []):
        text = (sg.get("text") or "").strip()
        if not text or tsku.is_hallucination(text):
            continue
        s0 = round(w0 + sg.get("start", 0.0), 3)
        s1 = round(w0 + sg.get("end", 0.0), 3)
        out.append({"start": s0, "end": min(s1, total), "text": text})
    return out


def run_window(key_mgr, mp3, w0, total):
    """Chay 2 mo hinh cho cung cua so roi chon ban tot hon:
       A = large-v3 + VI_PROMPT (pipeline chinh; hay bo sot doan noi va co luc ro nguyen am),
       B = large-v3-turbo khong prompt.
       Diem = so giay co loi - 10 x so segment nen chu. Hoa -> A."""
    def score(segs):
        sec = sum(max(0.0, x["end"] - x["start"]) for x in segs)
        comp = sum(1 for x in segs if tsku.is_compressed(x["text"]))
        return sec - 10 * comp
    a = collect(tsku.call_groq_whisper(key_mgr, mp3), w0, total)
    b = collect(tsku.call_groq_whisper(key_mgr, mp3, prompt="", model="whisper-large-v3-turbo"), w0, total)
    return b if score(b) > score(a) else a

def overlap(a0, a1, b0, b1):
    return max(0.0, min(a1, b1) - max(a0, b0))


def process(sku, key_mgr, dry):
    folder = ROOT / "video" / sku
    jpath = folder / "transcript.json"
    data = json.loads(jpath.read_text(encoding="utf-8"))
    segs = sorted(data["segments"], key=lambda s: s["start"])
    media = (list(folder.glob("*.mp4")) + list(folder.glob("*.webm")))[0]
    total = tsku.get_video_duration(media)
    sil = json.loads(SILENCE_JSON.read_text(encoding="utf-8"))["videos"].get(sku, {})
    regions = sil.get("silence_regions") or []
    wins = find_windows(segs, total, regions)
    print(f"[{sku}] dur={total:.1f}s segs={len(segs)} cua so can va={len(wins)}")
    for w in wins:
        print(f"   - {w[2]:10s} {w[0]:7.1f} -> {w[1]:7.1f} ({w[1]-w[0]:.1f}s)")
    if dry or not wins:
        return True

    tmp = folder / "_temp_fill"
    tmp.mkdir(exist_ok=True)
    kept = list(segs)
    added = removed = 0
    try:
        for i, (w0, w1, kind) in enumerate(wins):
            mp3 = tmp / f"w{i:03d}.mp3"
            if not tsku.extract_audio_chunk(media, w0, w1 - w0, mp3):
                raise RuntimeError(f"khong tach duoc audio {sku} {w0}-{w1}")
            new = run_window(key_mgr, mp3, w0, total)
            if kind == "compressed":
                # thay segment nen chu trong cua so bang ban bóc lai, CHI khi ban moi het nen chu
                old = [s for s in kept if overlap(s["start"], s["end"], w0, w1) > 0 and tsku.is_compressed(s["text"])]
                good = [n for n in new if not tsku.is_compressed(n["text"])]
                if good:
                    for s in old:
                        kept.remove(s)
                        removed += 1
                    kept.extend(good)
                    added += len(good)
            else:
                # segment nen chu nam trong cua so: duoc thay neu ban moi phu no
                old_c = [s for s in kept if overlap(s["start"], s["end"], w0, w1) > 0 and tsku.is_compressed(s["text"])]
                fresh = []
                for n in new:
                    if tsku.is_compressed(n["text"]):
                        continue
                    # bo segment moi trung >50% voi segment tot dang giu
                    dup = any(s not in old_c and overlap(n["start"], n["end"], s["start"], s["end"]) > 0.5 * max(0.1, n["end"] - n["start"]) for s in kept)
                    if not dup:
                        fresh.append(n)
                for s in old_c:
                    if any(overlap(s["start"], s["end"], n["start"], n["end"]) > 0 for n in fresh):
                        kept.remove(s)
                        removed += 1
                kept.extend(fresh)
                added += len(fresh)
            mp3.unlink(missing_ok=True)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    kept.sort(key=lambda s: (s["start"], s["end"]))
    out = []
    for k, s in enumerate(kept, 1):
        s0, s1 = float(s["start"]), float(s["end"])
        out.append({"id": k, "start": s0, "end": s1,
                    "start_time": tsku.format_srt_time(s0), "end_time": tsku.format_srt_time(s1),
                    "text": s["text"]})
    print(f"[{sku}] them {added} segment, thay {removed} segment nen chu -> tong {len(out)}")

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
