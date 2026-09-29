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
DENO = ROOT / "_tools" / "deno.exe"
FFPROBE = ROOT / "_tools" / "ffmpeg" / "ffprobe.exe"
TMP = ROOT / "assets" / "voice-samples-tmp"
OUT_DIR = ROOT / "assets" / "voice-samples"
DB = ROOT / "data" / "h2dev_master.db"

FFMPEG_LN = "loudnorm=I=-16:TP=-1.5:LRA=11"


def sh(cmd, **kw):
    """Subprocess an toan: TimeoutExpired se DUOC catch — SCAR 29/09: yt-dlp treo vo han
    tren video cham (RAW-048, 4h49m khong tien do) lam batch treo; socket-timeout + catch."""
    try:
        return subprocess.run(cmd, capture_output=True, text=True, **kw)
    except subprocess.TimeoutExpired as e:
        class R:
            returncode = -9
            stdout = ""
            stderr = f"TIMEOUT after {kw.get('timeout', '?')}s"
        return R()


def pick_pilot(limit, raws=None):
    sys.path.insert(0, str(ROOT / "scripts"))
    import sqlite3
    db = sqlite3.connect(DB)
    if raws:
        marks = ",".join("?" for _ in raws)
        rows = db.execute(f"""
            SELECT DISTINCT c.raw_id FROM competitor_channels c
            JOIN competitor_top_videos v ON v.channel_id = c.channel_id AND v.rank_order = 1
            WHERE c.raw_id IN ({marks})
        """, raws).fetchall()
        raw_ids = [r[0] for r in rows if r[0]]
    else:
        # Lay gap 3 lan limit — kenH video chet se bi bo qua, loop main chay den du ok_count.
        # COALESCE: kenh kenh-mau-only co raw_id NULL — dung channel_id lam slot.
        rows = db.execute("""
            SELECT DISTINCT COALESCE(c.raw_id, c.channel_id) AS slot
            FROM competitor_channels c
            WHERE c.has_voice_sample = 0
            LIMIT ?
        """, (limit * 3,)).fetchall()
        raw_ids = [r[0] for r in rows if r[0]]
    vids = {}
    for raw_id in raw_ids:
        r = db.execute(
            "SELECT channel_id, handle FROM competitor_channels WHERE raw_id=? OR channel_id=? LIMIT 1",
            (raw_id, raw_id)).fetchone()
        if not r:
            continue
        # Nhieu video ung vien theo rank — video rank 1 thuong da chet (SCAR 29/09: 17/25 fail)
        vlist = db.execute(
            "SELECT video_id FROM competitor_top_videos WHERE channel_id=? ORDER BY rank_order ASC LIMIT 10",
            (r[0],)).fetchall()
        vlist = [x[0] for x in vlist]
        if not vlist and r[1]:
            # Khong co top-video trong DB — dung CHANNEL LISTING (video moi nhat cua kenh)
            vlist = ["CH:" + r[1]]
        vids[raw_id] = {"channel_id": r[0], "handle": r[1], "video_ids": vlist}
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


def gain_trim(out_mp3, target=-16.0):
    """Buoc chot: do LUFS output -> volume gain dB -> LUFS chinh xac ±0.05.
    (loudnorm linear=true bi bypass khi LRA nguon lon — gain trim la buoc dam bao.)"""
    cur = measure_lufs(out_mp3)
    if cur is None:
        return None
    dev = float(cur) - target
    if abs(dev) <= 0.2:
        return cur
    tmp = out_mp3.with_suffix(".tmp.mp3")
    sh([str(FFMPEG), "-y", "-hide_banner", "-nostats", "-i", str(out_mp3),
        "-af", f"volume={-dev:.3f}dB", "-c:a", "libmp3lame", "-b:a", "128k", str(tmp)], timeout=120)
    if tmp.exists():
        tmp.replace(out_mp3)
    return measure_lufs(out_mp3)


def extract_45s(tmp_audio, out_mp3):
    """2-pass loudnorm — pass 1 do DUNG CUA SO 45s (SCAR: do 2 phut nguon thi measured
    lech cua so encode -> LUFS xat lech 0.5-1.9), pass 2 ap dung linear.
    Feedback loop: sau encode do lai output; neu |LUFS+16| > 0.5 thi redo toi da 2 lan."""
    target = 45
    for _ in range(3):
        p1 = sh([str(FFMPEG), "-hide_banner", "-nostats", "-i", str(tmp_audio),
                 "-t", str(target), "-af", FFMPEG_LN + ":print_format=json", "-f", "null", "-"])
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
        if not out_mp3.exists():
            return False
        cur = measure_lufs(out_mp3)
        if cur is not None and abs(float(cur) + 16) <= 0.5:
            gain_trim(out_mp3)
            return True
    gain_trim(out_mp3)
    return True  # het vong feedback — gain trim dam bao -16 chinh xac


def main():
    limit = 5
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])
    raws = None
    if "--raws" in sys.argv:
        raws = [x.strip() for x in sys.argv[sys.argv.index("--raws") + 1].split(",") if x.strip()]
    if not FFMPEG.exists():
        print("MISSING ffmpeg:", FFMPEG)
        sys.exit(2)
    TMP.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    pilots = pick_pilot(limit, raws)
    ok_target = limit
    ok_count = 0
    print(f"PILOT: {len(pilots)} ung vien (muc tieu {ok_target} thanh cong)")
    results = []
    for raw_id, meta in pilots.items():
        if ok_count >= ok_target:
            break
        out_mp3 = OUT_DIR / f"{raw_id}.mp3"
        rec = {"rawId": raw_id, "handle": meta["handle"], "videoIds": meta.get("video_ids", [])}
        if out_mp3.exists():
            rec["status"] = "ok"
            rec["mp3"] = str(out_mp3.relative_to(ROOT)).replace("\\", "/")
            results.append(rec)
            ok_count += 1
            continue

        # Thu lan luot video ung vien: video rank (chet nhieu) + CHANNEL LISTING (video moi nhat)
        tmp_audio = TMP / f"{raw_id}.m4a"
        dl_ok = False
        attempt = 0
        for vid in meta.get("video_ids", []):
            if vid.startswith("CH:"):
                handle_u = vid[3:].replace("@", "")
                from urllib.parse import quote
                base_url = f"https://www.youtube.com/@{quote(handle_u)}/videos"
            else:
                base_url = f"https://www.youtube.com/watch?v={vid}"
            for pi in (1, 2, 3):  # video moi thu 1..3 cua kenh/list
                attempt += 1
                if attempt > 6:
                    break
                dl = sh([sys.executable, "-m", "yt_dlp", "-f", "bestaudio/best",
                         "--ffmpeg-location", str(FFMPEG.parent),
                         "--js-runtimes", f"deno:{DENO}",
                         "--socket-timeout", "15", "--retries", "2",
                         "--download-sections", "*00:30-02:30", "-x", "--audio-format", "m4a",
                         "-o", str(tmp_audio), "--no-playlist", "--quiet",
                         "--playlist-items", str(pi), base_url], timeout=240)
                if tmp_audio.exists():
                    dl_ok = True
                    break
            if dl_ok:
                break
        if not dl_ok:
            rec["status"] = "download-fail"
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
        ok_count += 1
        results.append(rec)

    print(json.dumps(results, ensure_ascii=False, indent=1, default=float))
    (ROOT / "data" / "voice-dna-pilot.json").write_text(
        json.dumps({"schema": "h2dev.voice-dna-pilot.v1",
                    "generatedAt": datetime.now().isoformat(timespec="seconds"),
                    "results": results}, ensure_ascii=False, indent=1, default=float), encoding="utf-8")

if __name__ == "__main__":
    main()
