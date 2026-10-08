# -*- coding: utf-8 -*-
"""Voice DNA Bo 11 muc 4: detect ngon ngu that + WPM tu 257 file audio.
- Groq Whisper API (whisper-large-v3-turbo, GROQ_API_KEY / Linly groq_config.json) -- truoc day: faster-whisper tiny (CPU int8) — detect language + transcribe.
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

sys.path.insert(0, str(ROOT / "scripts"))
from transcribe_sku import GroqKeyManager, GROQ_CONFIG_PATH, call_groq_whisper  # noqa: E402

GROQ_MODEL = "whisper-large-v3-turbo"
# Groq verbose_json tra 'language' dang ten day du -> iso639-1
LANG_NAME_TO_ISO = {
    "english": "en", "japanese": "ja", "korean": "ko", "vietnamese": "vi", "russian": "ru",
    "spanish": "es", "hindi": "hi", "indonesian": "id", "portuguese": "pt", "french": "fr",
    "german": "de", "arabic": "ar", "thai": "th", "chinese": "zh", "tagalog": "tl",
    "italian": "it", "turkish": "tr", "polish": "pl", "ukrainian": "uk", "bengali": "bn", "tamil": "ta",
}

def _iso(lang):
    lang = (lang or "").strip().lower()
    return lang if len(lang) <= 3 else LANG_NAME_TO_ISO.get(lang, lang)

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
MIN_WORDS = 20  # duoi nguong nay = nhac/hat/it loi -> khong tin ngon ngu & wpm

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

    key_mgr = GroqKeyManager(GROQ_CONFIG_PATH)

    # Load report cu (resume neu crash giua chung)
    report = {"date": "2026-09-29", "model": "groq " + GROQ_MODEL,
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
            resp = call_groq_whisper(key_mgr, mp3, language=None, prompt=None, model=GROQ_MODEL)
            lang = _iso(resp.get("language"))
            segments = resp.get("segments") or []
            # Groq khong tra language_probability -> proxy = 1 - no_speech_prob trung binh (theo thoi luong)
            tot = sum(max(0.0, float(sg.get("end", 0)) - float(sg.get("start", 0))) for sg in segments) or 0.0
            if tot > 0:
                nsp = sum(float(sg.get("no_speech_prob", 0)) * max(0.0, float(sg.get("end", 0)) - float(sg.get("start", 0))) for sg in segments) / tot
                langProb = round(1.0 - nsp, 3)
            else:
                langProb = 0.0
            noSpeechProb = round(1.0 - langProb, 3)
            segments = [type("Seg", (), {"text": sg.get("text", "")})() for sg in segments]
            words = 0
            textSample = ""
            for seg in segments:
                t = seg.text.strip()
                words += len(t.split()) if lang not in CJK else len([c for c in t if not c.isspace()])
                if not textSample and t:
                    textSample = t[:80]
            durationSec = float(resp.get("duration") or 45.0)  # thoi luong that tu Groq; mac dinh 45s
            wpm = int(round(words / (durationSec / 60.0)))
            locale, flag = LOCALE_MAP.get(lang, (lang + "-XX", "🌐"))
            rec.update({
                "status": "ok", "lang": lang, "langProb": langProb,
                "locale": locale, "flag": flag, "wordCount": words, "wpm": wpm,
                "textSample": textSample, "elapsedSec": round(time.time() - t0, 1),
                "noSpeechProb": noSpeechProb,
                # RULE (2026-10-07): reliable = du loi noi that (>= MIN_WORDS tu/ky tu) va no_speech thap (<= 0.3).
                # Groq khong tra language_probability nen langProb (=1-no_speech) gan nhu luon ~1.0 -> khong du de loc nhac.
                "reliable": bool(words >= MIN_WORDS and noSpeechProb <= 0.3),
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
