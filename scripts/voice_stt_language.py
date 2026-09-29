# -*- coding: utf-8 -*-
"""Voice DNA Bo 11 muc 4: detect ngon ngu that + WPM tu 257 file audio.
- faster-whisper tiny (CPU int8) — detect language + transcribe.
- WPM: Latin = words/min; CJK (ja/zh) = chars/min (ghi chu trong report).
- Ghi report SAU MOI record (scar 29/09: batch crash mat json).
Xuat: data/voice-stt-report.json
"""
import json
import sys
import time
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "voice-stt-report.json"

from faster_whisper import WhisperModel

# lang whisper (iso639-1) -> locale mac dinh theo convention DB + flag
LOCALE_MAP = {
    "en": ("en-US", "🇺🇸"), "ja": ("ja-JP", "🇯🇵"), "ko": ("ko-KR", "🇰🇷"),
    "vi": ("vi-VN", "🇻🇳"), "ru": ("ru-RU", "🇷🇺"), "es": ("es-ES", "🇪🇸"),
    "hi": ("hi-IN", "🇮🇳"), "id": ("id-ID", "🇮🇩"), "pt": ("pt-BR", "🇧🇷"),
    "fr": ("fr-FR", "🇫🇷"), "de": ("de-DE", "🇩🇪"), "ar": ("ar-SA", "🇸🇦"),
    "th": ("th-TH", "🇹🇭"), "zh": ("zh-CN", "🇨🇳"), "tl": ("fil-PH", "🇵🇭"),
    "it": ("it-IT", "🇮🇹"), "tr": ("tr-TR", "🇹🇷"), "pl": ("pl-PL", "🇵🇱"),
    "uk": ("uk-UA", "🇺🇦"), "bn": ("bn-BD", "🇧🇩"), "ta": ("ta-IN", "🇱🇰"),
}
CJK = {"ja", "zh"}

def main():
    sys.path.insert(0, str(ROOT / "scripts"))
    import sqlite3
    db = sqlite3.connect(ROOT / "data" / "h2dev_master.db")
    rows = db.execute("""
        SELECT COALESCE(raw_id, channel_id) AS slot, handle, voice_sample_path,
               audio_language_code, wpm
        FROM competitor_channels WHERE has_voice_sample = 1
    """).fetchall()
    db.close()
    print(f"KENH: {len(rows)} sample", flush=True)

    model = WhisperModel("tiny", device="cpu", compute_type="int8")

    # Load report cu (resume neu crash giua chung)
    report = {"date": "2026-09-29", "model": "faster-whisper tiny int8 CPU",
              "note": "WPM: Latin = words/min, CJK = chars/min", "results": []}
    if OUT.exists():
        try:
            old = json.loads(OUT.read_text(encoding="utf-8"))
            report["results"] = old.get("results", [])
        except Exception:
            pass
    done = {r["slot"] for r in report["results"] if r.get("status") == "ok"}
    print(f"resume: {len(done)} da xong", flush=True)

    for idx, (slot, handle, mp3rel, cur_code, cur_wpm) in enumerate(rows, 1):
        if slot in done:
            continue
        mp3 = ROOT / mp3rel
        rec = {"slot": slot, "handle": handle, "dbCode": cur_code, "dbWpm": cur_wpm}
        if not mp3.exists():
            rec["status"] = "missing-file"
            report["results"].append(rec)
            OUT.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
            continue
        try:
            t0 = time.time()
            segments, info = model.transcribe(str(mp3), vad_filter=True, beam_size=1)
            lang = info.language
            langProb = round(float(info.language_probability), 3)
            words = 0
            textSample = ""
            for seg in segments:
                t = seg.text.strip()
                words += len(t.split()) if lang not in CJK else len([c for c in t if not c.isspace()])
                if not textSample and t:
                    textSample = t[:80]
            durationSec = 45.0
            wpm = int(round(words / (durationSec / 60.0)))
            locale, flag = LOCALE_MAP.get(lang, (lang + "-XX", "🌐"))
            rec.update({
                "status": "ok", "lang": lang, "langProb": langProb,
                "locale": locale, "flag": flag, "wordCount": words, "wpm": wpm,
                "textSample": textSample, "elapsedSec": round(time.time() - t0, 1),
                "changed": (cur_code == "ALL" or cur_code != locale),
            })
        except Exception as e:
            rec["status"] = "stt-fail"
            rec["err"] = str(e)[:120]
        report["results"].append(rec)
        OUT.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"[{idx}/{len(rows)}] {slot} {handle} -> {rec.get('lang','-')} p={rec.get('langProb','-')} wpm={rec.get('wpm','-')}", flush=True)

    ok = [r for r in report["results"] if r.get("status") == "ok"]
    print(f"STT-DONE: {len(ok)}/{len(rows)} ok", flush=True)

if __name__ == "__main__":
    main()
