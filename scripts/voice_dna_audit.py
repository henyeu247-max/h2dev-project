#!/usr/bin/env python
# voice_dna_audit.py — kiem dinh N/N voice samples (LUFS chinh xac + duration + speech density)
# Xuat: data/voice-dna-audit-latest.json (audit chi tiet) + data/voice-dna-verify-latest.json (cho update DB)
# Chay: python scripts/voice_dna_audit.py
from __future__ import annotations
import json
import re
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
SAMPLES = ROOT / "assets" / "voice-samples"
TARGET = -16.0
TOL = 0.5


def measure_lufs(p):
    r = subprocess.run([str(FFMPEG), "-hide_banner", "-nostats", "-i", str(p),
                        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True, timeout=120)
    err = r.stderr or ""
    try:
        return float(json.loads(err[err.rindex("{"):err.rindex("}") + 1])["input_i"])
    except Exception:
        return None


def main():
    files = sorted(f for f in SAMPLES.iterdir() if f.name.endswith(".mp3") and f.name.startswith("RAW-"))
    report = []
    verify = []
    ok = 0
    t0 = time.time()
    for f in files:
        raw_id = f.stem
        lufs = measure_lufs(f)
        d = subprocess.run([str(FFMPEG), "-hide_banner", "-i", str(f)], capture_output=True, text=True)
        m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", d.stderr or "")
        dur = round(int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)), 2) if m else None
        s = subprocess.run([str(FFMPEG), "-hide_banner", "-nostats", "-i", str(f),
                            "-af", "silencedetect=noise=-35dB:d=0.6", "-f", "null", "-"],
                           capture_output=True, text=True, timeout=120)
        sil = [float(x) for x in re.findall(r"silence_duration: ([\d.]+)", s.stderr or "")]
        density = round(max(0.0, 45.0 - sum(sil)) / 45.0, 3)
        dev = round(abs(lufs + 16), 2) if lufs is not None else None
        verdict = []
        if dev is None or dev > TOL: verdict.append("LUFS")
        if dur is None or abs(dur - 45) > 0.5: verdict.append("DUR")
        if density < 0.6: verdict.append("SPEECH")
        passed = not verdict
        if passed: ok += 1
        report.append({"file": f.name, "rawId": raw_id, "lufs": lufs, "dev": dev,
                       "dur": dur, "speechDensity": density, "verdict": verdict or ["OK"]})
        verify.append({"rawId": raw_id, "status": "ok" if passed else "not-golden",
                       "mp3": "assets/voice-samples/" + f.name})
        if (len(report) % 20) == 0:
            print(f"  progress {len(report)}/{len(files)}", flush=True)
    audit = {"schema": "h2dev.voice-dna-audit.v1",
             "generatedAt": datetime.now().isoformat(timespec="seconds"),
             "target": f"{TARGET} LUFS ±{TOL}", "total": len(files), "passed": ok,
             "failed": len(files) - ok, "report": report}
    (ROOT / "data" / "voice-dna-audit-latest.json").write_text(
        json.dumps(audit, ensure_ascii=False, indent=1, default=float), encoding="utf-8")
    (ROOT / "data" / "voice-dna-verify-latest.json").write_text(
        json.dumps({"schema": "h2dev.voice-dna-verify.v1", "report": verify}, ensure_ascii=False, indent=1),
        encoding="utf-8")
    fails = [r for r in report if r["verdict"] != ["OK"]]
    print(f"AUDIT: {len(files)} files | passed {ok} | failed {len(files) - ok} | {time.time() - t0:.0f}s")
    for r in fails[:15]:
        print("  FAIL", r["file"], r["verdict"], "dev:", r["dev"], "density:", r["speechDensity"])


if __name__ == "__main__":
    main()
