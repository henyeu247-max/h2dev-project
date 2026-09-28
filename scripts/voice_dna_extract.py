#!/usr/bin/env python
# Voice DNA pipeline — download audio (yt-dlp) + trich 45s EBU R128 -16 LUFS mono mp3 (ffmpeg)
# Chuan Bo 11 Tieu Chuan Vang: MP3 Mono 44.1kHz, -16 LUFS, dung 45s.
# Chay: python scripts/voice_dna_extract.py --limit 5   (kenh pilot: has_voice_sample=0, co top video)
from __future__ import annotations
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parents[1]
FFMPEG = ROOT / "_tools" / "ffmpeg" / "ffmpeg.exe"
FFPROBE = ROOT / "_tools" / "ffmpeg" / "ffprobe.exe"
TMP = ROOT / "assets" / "voice-samples-tmp"
OUT_DIR = ROOT / "assets" / "voice-samples"
DB = ROOT / "data" / "h2dev_master.db"

FFMPEG_LN = "loudnorm=I=-16:TP=-1.5:LRA=11"


def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def pick_pilot(limit):
    sys.path.insert(0, str(ROOT / "scripts"))
    import sqlite3
    db = sqlite3.connect(DB)
    rows = db.execute("""
        SELECT DISTINCT c.channel_id, c.handle, c.raw_id
        FROM competitor_channels c
        JOIN competitor_top_videos v ON v.channel_id = c.channel_id AND v.rank_order = 1
        WHERE c.has_voice_sample = 0
        LIMIT ?
    """, (limit,)).fetchall()
    vids = {}
    for cid, handle, raw_id in rows:
        r = db.execute(
            "SELECT video_id FROM competitor_top_videos WHERE channel_id=? AND rank_order=1 LIMIT 1",
            (cid,)).fetchone()
        vids[raw_id] = {"channel_id": cid, "handle": handle, "video_id": r[0]}
    db.close()
    return vids


def probe_json(path):
    r = sh([str(FFPROBE), "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", str(path)])
    return json.loads(r.stdout or "{}")


def measure_lufs(path):
    # 2 lan loudnorm: 1 print_format de do input_i
    r = sh([str(FFMPEG), "-hide_banner", "-nostats", "-i", str(path),
            "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
    out = r.stderr or ""
    try:
        j = out[out.rindex("{"):out.rindex("}") + 1]
        return json.loads(j).get("input_i")
    except Exception:
        return None


def extract_45s(tmp_audio, out_mp3):
    """2-pass loudnorm — pass 1 do (measured), pass 2 ap dung -> -16 LUFS chinh xac ±0.5."""
    p1 = sh([str(FFMPEG), "-hide_banner", "-nostats", "-i", str(tmp_audio),
             "-t", "45", "-af", FFMPEG_LN + ":print_format=json", "-f", "null", "-"])
    try:
        j = (p1.stderr or "")[(p1.stderr or "").rindex("{"):(p1.stderr or "").rindex("}") + 1]
        m = json.loads(j)
        measured = (f"loudnorm=I=-16:TP=-1.5:LRA=11:"
                    f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
                    f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:"
                    f"offset={m['target_offset']}:linear=true")
    except Exception:
        measured = FFMPEG_LN
    ex = sh([str(FFMPEG), "-y", "-hide_banner", "-nostats", "-i", str(tmp_audio),
             "-ss", "0", "-t", "45", "-ac", "1", "-ar", "44100",
             "-af", measured, "-b:a", "128k", str(out_mp3)], timeout=180)
    return out_mp3.exists()


def main():
    limit = 5
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])
    if not FFMPEG.exists():
        print("MISSING ffmpeg:", FFMPEG)
        sys.exit(2)
    TMP.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    pilots = pick_pilot(limit)
    print(f"PILOT: {len(pilots)} kenh")
    results = []
    for raw_id, meta in pilots.items():
        vid = meta["video_id"]
        tmp_audio = TMP / f"{raw_id}.m4a"
        out_mp3 = OUT_DIR / f"{raw_id}.mp3"
        rec = {"rawId": raw_id, "handle": meta["handle"], "videoId": vid}

        dl_ok = False
        for attempt in (1, 2):  # retry 1 lan
            dl = sh([sys.executable, "-m", "yt_dlp", "-f", "bestaudio/best",
                     "--ffmpeg-location", str(FFMPEG.parent),
                     "--download-sections", "*00:30-02:30", "-x", "--audio-format", "m4a",
                     "-o", str(tmp_audio), "--no-playlist", "--quiet",
                     f"https://www.youtube.com/watch?v={vid}"], timeout=300)
            if tmp_audio.exists():
                dl_ok = True
                break
            time.sleep(2)
        if not dl_ok:
            rec["status"] = "download-fail"
            rec["detail"] = (dl.stderr or dl.stdout or "").strip().splitlines()[-1:] or ["?"]
            results.append(rec)
            continue

        if not extract_45s(tmp_audio, out_mp3):
            rec["status"] = "extract-fail"
            results.append(rec)
            continue
        tmp_audio.unlink(missing_ok=True)

        # 3) Nghiem thu
        p = probe_json(out_mp3)
        st = p.get("streams", [{}])[0]
        dur = float(p.get("format", {}).get("duration") or 0)
        ch = int(st.get("channels") or 0)
        rate = int(st.get("sample_rate") or 0)
        lufs = measure_lufs(out_mp3)
        rec.update({"status": "ok", "mp3": str(out_mp3.relative_to(ROOT)).replace("\\", "/"),
                    "durationSec": round(dur, 2), "channels": ch, "sampleRate": rate,
                    "inputLufs": lufs})
        results.append(rec)

    print(json.dumps(results, ensure_ascii=False, indent=1, default=float))
    (ROOT / "data" / "voice-dna-pilot.json").write_text(
        json.dumps({"schema": "h2dev.voice-dna-pilot.v1",
                    "generatedAt": datetime.now().isoformat(timespec="seconds"),
                    "results": results}, ensure_ascii=False, indent=1, default=float), encoding="utf-8")

if __name__ == "__main__":
    main()
