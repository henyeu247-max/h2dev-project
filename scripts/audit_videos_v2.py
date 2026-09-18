# -*- coding: utf-8 -*-
"""
AUDIT TOAN DIEN VIDEO — H2DEV v2 (2026-09-18)
=============================================
Ke thua audit_all_136_videos.py (A-E) + BIT 2 DIEM MU da chung minh bang so lieu:

  Diem mu 1 — check A8 cu chi cong `max(end)/duration`:
    VIDEO-f59aa7 mat 1305s noi dung nhung van bao 93.8% -> KHONG bi flag.
  Diem mu 2 — metric "tong thoi luong co text / duration":
    bat nham cac video im lang duoi (vd VIDEO-469cb5 im 154.7s->189s).

  => Do CA 3 lop: (1) coverage-toi-het, (2) mat do loi noi (tu/giay khi co tieng),
     (3) khoang trong phu de >= N giay NHUNG audio KHONG im lang (silence_scan.json)
        -> chi lop (3) moi la "mat noi dung".

Cac nhom kiem tra:
  A. TRANSCRIPT : 3 dinh dang 1-1, schema, SRT timestamp, ao giac / nen chu / rac /
                  lech thu tu, coverage 3 lop, duration vs ffprobe, CRLF.
  B. MEDIA      : 2 luong + size>0, thumbnail, docs file ton tai, loudness EBU R128.
  C. DONG BO    : catalog / catalog_full / videos / modules, duration lech, item thieu field.
  D. INSIGHTS   : Bo Vang (takeaways>=5, timestamps 4-5 trong bien, edit_sop, avoid_flags),
                  grounding takeaway voi transcript, co che do ro rang.
  E. KENH & DEPLOY: channels/handle precheck, vps HTTP 200.

Output: _audit/20260918-full-136-audit/report.json + report.md
Chay  : py scripts/audit_videos_v2.py                 (full)
        py scripts/audit_videos_v2.py --sku VIDEO-xxx (1 SKU)
        py scripts/audit_videos_v2.py --skip-http     (bo qua phan HTTP, nhanh hon)
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import unicodedata
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FFPROBE = r"D:\Linly-Dubbing\bin\ffprobe.exe"
FFMPEG = r"D:\Linly-Dubbing\bin\ffmpeg.exe"
VIDEO_DIR = os.path.join(ROOT, "video")
THUMB_DIR = os.path.join(ROOT, "assets", "thumbs")
OUT_DIR = os.path.join(ROOT, "_audit", "20260918-full-136-audit")

VPS_BASE = "https://h2dev-learn.tonymmo.com"
LOCAL_BASE = "http://127.0.0.1:8899"

# ---- nguong chuan (hieu chuan TU DU LIEU THAT do 18/09/2026, khong suy doan) ----
#
# WPM: do tren 135 video -> p10=207, median=229, p90=253, max=279.
#   Nguoi day nay NOI NHANH la dac thu cua kho (khong phai loi). Chi coi la bat thuong
#   khi VUOT HAN phan bo: > 300 WPM.
# LUFS: do tren 136 video -> co 2 cum ro ret:
#   cum "quay man hinh" (im, -32..-24 LUFS) va cum "noi truc tiep" (-14..-11 LUFS).
#   Ca 2 deu binh thuong. Chi coi la loi khi audio gan nhu RONG: < -45 LUFS.
#   (Do that: VIDEO-8e0275 = -70 LUFS, mean_volume -91 dB -> luong audio khong co noi dung.)
MIN_TAKEAWAYS = 5
MIN_TIMESTAMPS = 4
MIN_COVERAGE = 0.90          # coverage-toi-het
GAP_MIN_SEC = 20.0           # khoang trong phu de dang ke
GAP_TOLERANCE = 0.6          # cho phep sai so khi doi chieu khoang lang
DUR_TOL = 1.0                # lech duration _sec vs ffprobe
WPM_MIN, WPM_MAX = 60, 300   # bien WPM (hieu chuan tu phan bo do that 18/09)
LUFS_BROKEN = -45.0          # duoi muc nay = audio gan nhu rong

HALL_PATTERNS = [
    # CHI cac mau AO GIAC DAC TRUNG (thuong hieu kenh la / vong lap / prompt bi doc lai).
    # KHONG dua "Cảm ơn các bạn đã theo dõi" vao day: cau ket video THAT cung thuong dung
    # cau nay (da bao nham o ZOOM-03 khi test 18/09). Cau ket that la hop le.
    "subscribe cho kênh", "Ghiền Mì Gõ", "La La School",
    "Hãy subscribe", "quảng cáo sau", "đăng ký kênh để ủng hộ", "nhớ đăng ký kênh",
    "nhận thêm bản ghi", "nhận thêm nhiều thông tin", "nhận thêm thông tin",
    "bản ghi của mình trong phần bình luận", "các mục tiêu của youtube",
    "nhớ like, share và đăng ký kênh", "các bạn có thể nhận thêm",
    "bản ghi video hướng dẫn xây kênh", "thuật ngữ thường gặp",
]
VALID_MARKETS = ["🇻🇳", "🇺🇸", "🇨🇦", "🇯🇵", "🇰🇷", "🇨🇳", "🌐", "🇬🇧", "🇦🇺",
                 "🇩🇪", "🇲🇽", "🇮🇳", "🇫🇷", "🇪🇸", "🇮🇹", "🇧🇷", "🇹🇭", "🇮🇩",
                 "🇵🇭", "🇸🇬"]
VOWELS = set("aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩị"
             "oòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ")


# ---------------------------------------------------------------- utilities
def load_json(path, default=None):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:  # noqa: BLE001
        return default


def norm(text):
    s = unicodedata.normalize("NFD", (text or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def is_compressed(text):
    toks = [t for t in re.split(r"\s+", text.strip()) if t]
    if len(toks) < 6:
        return False
    short = sum(1 for t in toks if len(t) <= 2) / len(toks)
    novowel = sum(1 for t in toks if not any(c in VOWELS for c in t.lower())) / len(toks)
    return short >= 0.75 and novowel >= 0.40


def ffprobe_duration(path):
    try:
        out = subprocess.check_output(
            [FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path], timeout=60)
        return float(out.decode().strip())
    except Exception:  # noqa: BLE001
        return None


def ffprobe_streams(path):
    has = {"video": False, "audio": False}
    for kind in ("v", "a"):
        try:
            out = subprocess.check_output(
                [FFPROBE, "-v", "error", "-select_streams", kind + ":0",
                 "-show_entries", "stream=codec_type",
                 "-of", "csv=p=0", path], timeout=60).decode().strip()
            has["video" if kind == "v" else "audio"] = bool(out)
        except Exception:  # noqa: BLE001
            pass
    return has


def audio_integrity(path, real_dur, cache=None, key=None):
    """Kiem tra luong audio co DU DU LIEU khong (khong chi co "duration" khai bao).

    PHAT HIEN 18/09/2026 — VIDEO-f59aa7: container khai `duration=2588.21s` nhung
    luong audio THIEU PACKET THAT 69%. ffmpeg giai ma toan bo audio chi ra 794.17s.
    => DAY LA LOP KIEM TRA QUAN TRONG NHAT: khong lop nao khac (ke ca coverage,
    silencedetect, ASR probe) tu phat hien duoc file media hong.

    3 phep do DOC LAP — phu MOI codec (het "not-applicable"):
      1. `nb_frames / duration` (AAC co nb_frames). Chuan do that: **43.06 pkt/s**.
      2. `nb_read_packets / duration` (`-count_packets`) — DUNG CHO MOI CODEC.
         Chuan do that 18/09: AAC **43.06** pkt/s · **Opus/WebM 16.67** pkt/s
         (do tren 3 mp4 sach + 4 webm ZOOM sach, ca 4 webm deu dung 16.67).
      3. Decode probe — trich 10s tai 50% thoi luong, do lai do dai thuc nhan duoc.

    BAI HOC: lan quet dau chi dung phep 1 -> 4 file ZOOM (webm) tra
    "not-applicable" va bi BO QUA IM LANG, roi van bao '132/132 sach'
    (bao cao N/N KHONG). Nay phep 2 phu du 100% codec.
    """
    if cache is not None and key is not None and key in cache:
        return cache[key]

    # Nguong packet/s CHUAN theo codec (do thuc 18/09 tren file sach)
    EXPECTED_PPS = {
        "aac": 43.06,
        "mp3": 38.28,      # 1 frame/26.12ms @44.1k
        "opus": 16.67,     # 60ms frame @48k (do: 53032/3181.9 = 16.67)
        "vorbis": 43.07,
        "flac": 43.07,
    }
    BROKEN_RATIO = 0.70   # thap hon 70% chuan => coi la thieu du lieu

    out = {}
    try:
        raw = subprocess.check_output(
            [FFPROBE, "-v", "error", "-select_streams", "a:0", "-count_packets",
             "-show_entries", "stream=codec_name,nb_frames,nb_read_packets,duration,sample_rate",
             "-of", "json", path], timeout=180).decode()
        st = (json.loads(raw).get("streams") or [{}])[0]
    except Exception as exc:  # noqa: BLE001
        out["probe_error"] = str(exc)[:100]
        st = {}

    codec = (st.get("codec_name") or "").lower()
    out["codec"] = codec or None
    try:
        sdur = float(st.get("duration"))
    except (TypeError, ValueError):
        sdur = None
    if not sdur or sdur <= 0:
        sdur = real_dur

    # ---- Phep 1+2: nb_frames (aac) va nb_read_packets (moi codec) ----
    nf = int(st["nb_frames"]) if str(st.get("nb_frames", "")).isdigit() else None
    npk = int(st["nb_read_packets"]) if str(st.get("nb_read_packets", "")).isdigit() else None
    expected = EXPECTED_PPS.get(codec)

    for label, count, meth in (("frame_rate", nf, "method_1_verdict"),
                               ("packet_rate", npk, "method_2a_verdict")):
        if not count or not sdur or sdur <= 0:
            out[meth] = "not-available"
            continue
        rate = count / sdur
        out[label] = round(rate, 2)
        out[label + "_expected"] = expected
        if expected:
            ratio = rate / expected
            out[label + "_ratio_to_expected"] = round(ratio, 3)
            out[meth] = "broken" if ratio < BROKEN_RATIO else "ok"
        else:
            # codec la -> khong co chuan: chi bao "not-applicable" (KHONG coi la sach)
            out[meth] = "not-applicable (codec '%s' chua co chuan)" % (codec or "?")
    if npk:
        out["nb_read_packets"] = npk
    if nf:
        out["nb_frames"] = nf
    out["stream_duration_sec"] = round(sdur, 2) if sdur else None

    # ---- Phep 3: decode probe (dung cho moi container/codec) ----
    if real_dur and real_dur > 40:
        probe_len = 10.0
        start = max(0.0, min(real_dur * 0.5, real_dur - probe_len - 1))
        tmp = os.path.join(tempfile.gettempdir(), "h2dev_probe_%s.wav" % os.path.basename(path))
        try:
            subprocess.run(
                [FFMPEG, "-v", "error", "-y", "-ss", "%.2f" % start, "-t", "%.2f" % probe_len,
                 "-i", path, "-vn", "-ac", "1", "-ar", "16000", "-f", "wav", tmp],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=600)
            got = None
            if os.path.exists(tmp):
                try:
                    got = float(subprocess.check_output(
                        [FFPROBE, "-v", "error", "-show_entries", "format=duration",
                         "-of", "csv=p=0", tmp], timeout=60).decode().strip())
                except Exception:  # noqa: BLE001
                    got = None
            out["decode_probe"] = {
                "seek_sec": round(start, 1),
                "expected_sec": probe_len,
                "got_sec": round(got, 2) if got is not None else None,
            }
            if got is None or (got < probe_len * 0.8 and (probe_len - got) > 2.0):
                out["method_3_verdict"] = "broken"
            else:
                out["method_3_verdict"] = "ok"
        except Exception as exc:  # noqa: BLE001
            out["method_3_error"] = str(exc)[:100]
        finally:
            try:
                os.remove(tmp)
            except OSError:
                pass

    # Tong hop: BAT KY phep nao bao "broken" => file hong.
    # Neu khong phep nao cho ket luan (toan 'not-available'/'not-applicable') => khong-verify-duoc.
    keys = ("method_1_verdict", "method_2a_verdict", "method_3_verdict")
    verdicts = [out.get(k) for k in keys]
    decided = [v for v in verdicts if v in ("ok", "broken")]
    if not decided:
        out["verdict"] = "khong-verify-duoc"
        out["verdict_note"] = "khong phep nao cho ket luan: %s" % [v for v in verdicts if v]
    elif "broken" in decided:
        out["verdict"] = "broken"
        out["broken_by"] = [k for k in keys if out.get(k) == "broken"]
    else:
        out["verdict"] = "ok"
    out["methods_decided"] = len(decided)
    out["methods_total"] = 3

    if cache is not None and key is not None:
        cache[key] = out
    return out


def loudness(path, cache=None, key=None):
    """EBU R128 integrated loudness + true peak (ffmpeg ebur128).

    LUU Y 1: ffmpeg in "I: ..." cho TUNG KHUNG hinh trong luc chay, va chi in
    summary that o CUOI. Phai lay match CUOI CUNG, neu khong se doc nham
    momentary cua khung dau (vd -70 LUFS) — loi da gap khi test 18/09.
    LUU Y 2: ebur128 giai ma TOAN BO audio (~1-2s/video, 136 video = ~10 phut).
    Co cache (loudness.json) de lan chay sau khong phai do lai.
    """
    if cache is not None and key in cache:
        return cache[key]
    try:
        proc = subprocess.run(
            [FFMPEG, "-hide_banner", "-i", path, "-af", "ebur128=peak=true",
             "-f", "null", "-"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=1800)
        text = proc.stderr.decode("utf-8", "ignore")
    except Exception:  # noqa: BLE001
        return {}
    out = {}
    m = re.findall(r"I:\s*(-?[\d.]+)\s*LUFS", text)
    if m:
        out["integrated_lufs"] = float(m[-1])
    m = re.findall(r"LRA:\s*(-?[\d.]+)\s*LU", text)
    if m:
        out["lra"] = float(m[-1])
    m = re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS", text)
    if m:
        out["true_peak_dbfs"] = float(m[-1])
    if cache is not None and key is not None and out:
        cache[key] = out
    return out


def http_code(url, timeout=12):
    try:
        req = urllib.request.Request(url, method="GET", headers={"User-Agent": "h2dev-audit/2"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status
    except urllib.error.HTTPError as exc:
        return exc.code
    except Exception:  # noqa: BLE001
        return None


def media_path(sku):
    for ext in (".mp4", ".webm"):
        p = os.path.join(VIDEO_DIR, sku, sku + ext)
        if os.path.exists(p):
            return p
    return None


def thumb_path(sku, catalog_row):
    for candidate in [catalog_row.get("thumb") or ""]:
        if candidate and os.path.exists(os.path.join(ROOT, candidate)):
            return candidate
    for ext in (".jpg", ".jpeg", ".png", ".webp"):
        rel = "assets/thumbs/%s%s" % (sku, ext)
        if os.path.exists(os.path.join(ROOT, rel)):
            return rel
    return None


def parse_mmss(text):
    if text is None:
        return None
    if isinstance(text, (int, float)):
        return float(text)
    parts = str(text).split(":")
    try:
        nums = [float(p) for p in parts]
    except ValueError:
        return None
    if len(nums) == 3:
        return nums[0] * 3600 + nums[1] * 60 + nums[2]
    if len(nums) == 2:
        return nums[0] * 60 + nums[1]
    return None


# ---------------------------------------------------------------- main audit
def audit_one(sku, ctx):
    issues = []
    review_flags = []      # nghi van can kiem tay (chua du bang chung ket luan)
    standards_gaps = []    # chua dat chuan Bo Vang (KHONG phai du lieu hong)
    rec = {"sku": sku, "issues": issues, "review_flags": review_flags,
           "standards_gaps": standards_gaps}
    checks = rec["checks"] = {}

    catalog_row = ctx["catalog"].get(sku) or {}
    video_row = ctx["videos"].get(sku) or {}
    insights = ctx["insights"].get(sku) or {}
    mod_row = ctx["modules"].get(sku) or {}
    silence = ctx["silence"].get(sku) or {}

    path = media_path(sku)
    real_dur = None
    if path:
        real_dur = ffprobe_duration(path)
    rec["real_duration_sec"] = round(real_dur, 2) if real_dur else None

    # ---------------- A. TRANSCRIPT ----------------
    a = {}
    checks["A_transcript"] = a
    vdir = os.path.join(VIDEO_DIR, sku)
    jp = os.path.join(vdir, "transcript.json")
    sp = os.path.join(vdir, "transcript.srt")
    tp = os.path.join(vdir, "transcript.txt")
    a["has_json"], a["has_srt"], a["has_txt"] = (
        os.path.exists(jp), os.path.exists(sp), os.path.exists(tp))
    if not (a["has_json"] and a["has_srt"] and a["has_txt"]):
        issues.append("A1: thieu file phu de")

    segs, tr_dur, tr_full = [], None, ""
    if a["has_json"]:
        data = load_json(jp) or {}
        if isinstance(data, list):
            segs = data
            tr_full = " ".join(s.get("text", "") for s in segs)
        else:
            segs = data.get("segments") or []
            tr_dur = data.get("duration")
            tr_full = data.get("full_text") or " ".join(s.get("text", "") for s in segs)
    a["segments"] = len(segs)
    a["schema"] = "doc-style" if any("start_time" not in s for s in segs) else "standard"

    hall = comp = junk = ooo = 0
    for i, seg in enumerate(segs):
        txt = seg.get("text", "") or ""
        if any(h.lower() in txt.lower() for h in HALL_PATTERNS):
            hall += 1
        if is_compressed(txt):
            comp += 1
        if re.fullmatch(r"(?:à\s*)+", txt.strip()):
            junk += 1
        if i > 0 and seg.get("start", 0) < segs[i - 1].get("start", 0) - 0.01:
            ooo += 1
    a.update({"hallucination": hall, "compressed": comp, "junk": junk, "out_of_order": ooo})
    if hall:
        issues.append("A3: %d segment ao giac" % hall)
    if comp:
        issues.append("A4: %d segment nen chu" % comp)
    if junk:
        issues.append("A5: %d segment rac" % junk)
    if ooo:
        issues.append("A6: %d segment lech thu tu" % ooo)

    if a["has_srt"]:
        srt = open(sp, "r", encoding="utf-8", errors="ignore").read()
        n_srt = len(re.findall(
            r"^\d+\r?\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$", srt, re.M))
        a["srt_blocks"] = n_srt
        a["srt_bad_ts"] = srt.count("-->") - n_srt
        if a["srt_bad_ts"]:
            issues.append("A7: %d timestamp SRT sai dinh dang" % a["srt_bad_ts"])
    if a["has_txt"]:
        a["txt_lines"] = len([l for l in open(tp, "r", encoding="utf-8", errors="ignore")
                              .read().split("\n") if l.strip()])

    if a.get("srt_blocks") is not None and a["segments"] and a["srt_blocks"] != a["segments"]:
        if a["schema"] != "doc-style":
            issues.append("A2: srt lech json (%d vs %d)" % (a["srt_blocks"], a["segments"]))

    # ---- A8 coverage 3 lop (bit diem mu) ----
    a["transcript_duration_sec"] = round(tr_dur, 2) if tr_dur else None
    if tr_dur and real_dur and abs(tr_dur - real_dur) > DUR_TOL:
        issues.append("A8a: transcript.duration lech ffprobe %.1fs" % abs(tr_dur - real_dur))

    if segs and real_dur:
        max_end = max((s.get("end") or 0) for s in segs)
        a["max_end_sec"] = round(max_end, 2)
        a["coverage_to_end_pct"] = round(max_end / real_dur * 100, 1)
        if max_end > real_dur + 0.5:
            issues.append("A8b: segment vuot thoi luong that %.1fs" % (max_end - real_dur))
        if max_end / real_dur < MIN_COVERAGE:
            issues.append("A8c: phu chi %.1f%% thoi luong" % (max_end / real_dur * 100))

        # mat do loi noi: bo qua khoang lang that
        silence_regions = silence.get("silence_regions") or []
        speech_sec = sum(max(0, (s.get("end") or 0) - (s.get("start") or 0)) for s in segs)

        def in_silence(start, end):
            for rg in silence_regions:
                rs, re_ = rg.get("start"), rg.get("end")
                if rs is None or re_ is None:
                    continue
                if start >= rs - GAP_TOLERANCE and end <= re_ + GAP_TOLERANCE:
                    return True
            return False

        # khoang trong phu de dang ke
        gaps = []
        cursor = 0.0
        for seg in segs:
            st = seg.get("start") or 0
            if st - cursor >= GAP_MIN_SEC:
                gaps.append({"start": round(cursor, 1), "end": round(st, 1),
                             "gap": round(st - cursor, 1)})
            cursor = max(cursor, seg.get("end") or 0)
        if real_dur - cursor >= GAP_MIN_SEC:
            gaps.append({"start": round(cursor, 1), "end": round(real_dur, 1),
                         "gap": round(real_dur - cursor, 1)})
        a["gaps_count"] = len(gaps)
        a["gaps_total_sec"] = round(sum(g["gap"] for g in gaps), 1)
        unexplained = [g for g in gaps if not in_silence(g["start"], g["end"])]
        a["gaps_unexplained"] = len(unexplained)
        a["gaps_unexplained_sec"] = round(sum(g["gap"] for g in unexplained), 1)
        a["gaps_unexplained_detail"] = unexplained[:12]
        if unexplained:
            # LUU Y PHUONG PHAP: "audio khong im lang" chua du de ket luan "mat noi dung" —
            # khoang do co the chi la NHAC NEN. Day la CO CAN KIEM TAY (VAD/ASR probe),
            # khong phai loi chac chan. Vi vay ghi vao review_flags, khong vao issues.
            review_flags.append(
                "A8d: %d khoang trong phu de (%.0fs) audio KHONG im lang — can ASR probe"
                % (len(unexplained), a["gaps_unexplained_sec"]))

        words = len([w for w in re.split(r"\s+", tr_full.strip()) if w])
        a["words"] = words
        a["speech_sec"] = round(speech_sec, 1)
        # WPM: mau so = thoi gian THUC SU co tieng noi theo AUDIO (duration - im lang),
        # khong dung speech_sec cua transcript (neu transcript thieu thi WPM bi thoi phong).
        sil_total = silence.get("silence_total_sec") or 0
        audio_talk = real_dur - sil_total
        # ASR probe (speech_density.json) la NGUON CHAN LY cho cau hoi "video co loi giang that khong"
        # — silencedetect chi bat im lang ky thuat, KHONG bat "nhac nen khong co loi".
        # Do that: VIDEO-b559c8/ed1be9/b96929/a348a5 chi co loi o dau video, phan con lai la
        # screencast + nhac -> phu de dang annotation la DUNG (khong phai loi).
        sd = ctx["speech_density"].get(sku) or {}
        dens = sd.get("speech_density")
        a["speech_density"] = dens
        a["speech_density_verdict"] = sd.get("verdict")
        if audio_talk >= 60:
            a["wpm"] = round(words / (audio_talk / 60), 1)
            a["wpm_basis"] = "audio(duration-silence)"
            if a["wpm"] > WPM_MAX:
                issues.append("A8e: WPM %.0f > %d — nghi phu de bi nen/thua doan"
                              % (a["wpm"], WPM_MAX))
            elif a["wpm"] < WPM_MIN:
                # WPM thap chi la DAU HIEU. Ket luan phai dua vao ASR probe.
                if dens is not None and dens >= 0.5:
                    review_flags.append(
                        "A8g: WPM %.0f thap nhung ASR probe xac nhan co loi giang (%.0f%% cua so)"
                        " — kiem tra phu de co thieu khong" % (a["wpm"], dens * 100))
                elif dens is not None:
                    a["note"] = ("WPM %.0f thap + ASR probe %.0f%% cua so co loi: video "
                                 "screencast co nhac nen; annotation la dung."
                                 % (a["wpm"], dens * 100))
                else:
                    review_flags.append("A8g: WPM %.0f thap — can ASR probe xac nhan"
                                        % a["wpm"])
        else:
            a["wpm"] = None
            a["wpm_basis"] = "n/a"
            issues.append("A8f: audio gan nhu rong (chi %.0fs khong-im-lang / %.0fs video)"
                          % (audio_talk, real_dur))
        a["speech_ratio"] = round(speech_sec / real_dur, 3)
    rec["silence"] = {
        "count": silence.get("silence_count"),
        "total_sec": silence.get("silence_total_sec"),
    }
    # ---- A10: bang chung HINH ANH (vision local qua 9Router) ----
    vision = ctx["vision"].get(sku) or {}
    rec["vision"] = vision
    if vision and not vision.get("error"):
        a["visual_type"] = vision.get("visual_type")
        a["topic_match"] = vision.get("topic_match")
        a["thumb_match"] = vision.get("thumb_match")
        anomalies = vision.get("anomalies") or []
        a["vision_anomalies"] = anomalies
        if vision.get("thumb_match") == "no":
            review_flags.append("A10: thumbnail khong khop noi dung (vision)")
        if anomalies:
            review_flags.append("A10: vision ghi nhan %d bat thuong: %s"
                                % (len(anomalies), "; ".join(anomalies)[:160]))
    elif not vision:
        review_flags.append("A10: chua co bang chung hinh anh (vision)")
    a["crlf_srt"] = None
    if a["has_srt"]:
        raw = open(sp, "rb").read()
        a["crlf_srt"] = b"\r\n" in raw
        if a["schema"] == "standard" and b"\r\n" not in raw and a["segments"] > 50:
            issues.append("A9: srt khong dung CRLF nhu chuan")

    # ---------------- B. MEDIA & FILES ----------------
    b = {}
    checks["B_media"] = b
    b["media_exists"] = bool(path)
    b["media_size_mb"] = round(os.path.getsize(path) / 1048576, 1) if path else 0
    if not path:
        issues.append("B1: thieu file media")
    elif b["media_size_mb"] == 0:
        issues.append("B1: media 0 byte")
    else:
        streams = ffprobe_streams(path)
        b.update(streams)
        if not streams["video"]:
            issues.append("B2: thieu luong video")
        if not streams["audio"]:
            issues.append("B3: thieu luong audio")
        # B7: TOAN VEN DU LIEU AUDIO (phat hien file hong — xem media_integrity_cache.json)
        integ = audio_integrity(path, real_dur, ctx["integrity"], sku)
        b["audio_integrity"] = integ
        if integ.get("verdict") == "broken":
            detail = []
            for label, pps, cps in (("packet_rate", integ.get("packet_rate"),
                                     integ.get("packet_rate_expected")),
                                    ("frame_rate", integ.get("frame_rate"),
                                     integ.get("frame_rate_expected"))):
                if pps and cps:
                    detail.append("%s %.1f/s (chuan %.2f, dat %.0f%%)"
                                  % (label, pps, cps, pps / cps * 100))
            dp = integ.get("decode_probe") or {}
            if dp.get("got_sec") is not None:
                detail.append("decode probe: lay %.0fs tai giay %s chi duoc %.1fs"
                              % (dp.get("expected_sec") or 0, dp.get("seek_sec"), dp["got_sec"]))
            issues.append("B7: LUONG AUDIO THIEU DU LIEU THAT [%s] — %s"
                          % (",".join(integ.get("broken_by") or []), "; ".join(detail) or "?"))
        elif integ.get("verdict") == "khong-verify-duoc":
            review_flags.append("B7: khong verify duoc toan ven audio — %s"
                                % (integ.get("verdict_note") or integ.get("probe_error") or "?"))
        b["loudness"] = loudness(path, ctx["loudness"], sku)
        lufs = b["loudness"].get("integrated_lufs")
        if lufs is not None and lufs < LUFS_BROKEN:
            issues.append("B4: audio gan nhu rong (%.1f LUFS < %.0f)" % (lufs, LUFS_BROKEN))

    thumb = thumb_path(sku, catalog_row)
    b["thumb"] = thumb
    if not thumb:
        issues.append("B5: thieu thumbnail")

    docs = video_row.get("docs") or []
    b["docs_count"] = len(docs)
    missing_docs = []
    for doc in docs:
        f = (doc or {}).get("file") or ""
        if f and not re.match(r"^https?://", f) and not os.path.exists(os.path.join(ROOT, f)):
            missing_docs.append(f)
    b["docs_missing_files"] = len(missing_docs)
    if missing_docs:
        issues.append("B6: %d file docs khong ton tai" % len(missing_docs))

    # ---------------- C. DONG BO DU LIEU ----------------
    c = {}
    checks["C_sync"] = c
    c["in_catalog_full"] = sku in ctx["catalog_full"]
    c["in_videos_json"] = sku in ctx["videos"]
    c["in_modules"] = sku in ctx["modules"]
    for key, label in (("in_catalog_full", "catalog_full"), ("in_videos_json", "videos.json"),
                       ("in_modules", "modules.json")):
        if not c[key]:
            issues.append("C1: thieu trong %s" % label)

    if catalog_row and real_dur:
        cs = catalog_row.get("duration_sec")
        c["catalog_duration_sec"] = cs
        c["duration_delta_sec"] = round((cs or 0) - real_dur, 1) if cs else None
        if cs and abs(cs - real_dur) > DUR_TOL:
            issues.append("C2: catalog.duration_sec lech %.1fs (cat=%s real=%.1f)"
                          % (abs(cs - real_dur), cs, real_dur))

    if mod_row:
        # badge RONG la trang thai HOP LE (130/136 item co nhan; 6 item khong co nhan
        # goc tu site h2dev.vn — UI chi an badge, khong loi). Chi bat khi THIEU HAN key.
        missing_fields = [f for f in ("duration", "access")
                          if not mod_row.get(f)]
        if not mod_row.get("badge") and "badge" not in mod_row:
            missing_fields.append("badge(key)")
        # seq: kiem tra rieng (rong = loi that, vi UI dung seq de danh so bai)
        if not mod_row.get("seq"):
            missing_fields.append("seq")
        c["module_missing_fields"] = missing_fields
        if missing_fields:
            issues.append("C3: modules thieu field %s" % ",".join(missing_fields))
        mod_dur = parse_mmss(mod_row.get("duration"))
        if mod_dur and real_dur and abs(mod_dur - real_dur) > 2:
            issues.append("C4: modules.duration lech %.0fs" % (mod_dur - real_dur))

    # ---------------- D. INSIGHTS (BO VANG) ----------------
    d = {}
    checks["D_insights"] = d
    d["has_entry"] = bool(insights)
    if not insights:
        issues.append("D1: thieu entry trong video_insights.json")
    else:
        tks = insights.get("key_takeaways") or []
        tss = insights.get("key_timestamps") or []
        d["takeaways"] = len(tks)
        d["timestamps"] = len(tss)
        d["vac"] = insights.get("visual_audio_checked") is True
        d["method"] = insights.get("analysis_method")
        # Nhom "CHUA DAT CHUAN" (Bo Vang Phần 7), KHONG phai du lieu hong.
        # Tach rieng de bao cao trung thuc: thieu chuan != data hong.
        if len(tks) < MIN_TAKEAWAYS:
            standards_gaps.append("S2: key_takeaways=%d (<%d) — chua dat Tieu chuan 6"
                                  % (len(tks), MIN_TAKEAWAYS))
        if len(tss) < MIN_TIMESTAMPS:
            standards_gaps.append("S3: key_timestamps=%d (<%d) — chua dat Tieu chuan 5"
                                  % (len(tss), MIN_TIMESTAMPS))
        if not (insights.get("edit_sop") or ""):
            standards_gaps.append("S4: thieu edit_sop — chua dat Tieu chuan 7")
        if not (insights.get("avoid_flags") or []):
            standards_gaps.append("S5: thieu avoid_flags — chua dat Tieu chuan 8")

        # timestamp trong bien (kiem khach quan)
        out_of_range = []
        for t in tss:
            sec = t.get("seconds")
            if sec is None:
                out_of_range.append("no-seconds")
            elif real_dur and (sec < 0 or sec > real_dur + 2):
                out_of_range.append(sec)
        d["ts_out_of_range"] = len(out_of_range)
        if out_of_range:
            issues.append("D6: %d moc thoi gian ngoai bien" % len(out_of_range))

        # Grounding takeaway: RULE Phần 7 Tieu chuan 6 yeu cau doi chieu TAY voi transcript.
        # Takeaway chuan la TOM TAT CHUYEN GIA (khong phai trich nguyen van) => khong the
        # ket luan tu dong. Do ty le "neo" (tu dai >=6 ky tu co mat trong transcript)
        # lam CO SO cho nguoi kiem, va ghi vao review_flags (khong phai issue).
        full_norm = norm(tr_full)
        anchors, hit = 0, 0
        for t in tks:
            words = [w for w in norm(t).split() if len(w) >= 6]
            for w in words[:6]:
                anchors += 1
                if w in full_norm:
                    hit += 1
        d["takeaway_anchor_hits"] = hit
        d["takeaway_anchor_total"] = anchors
        d["takeaway_anchor_ratio"] = round(hit / anchors, 2) if anchors else None
        if anchors >= 6 and hit / anchors < 0.35:
            review_flags.append(
                "S6: ty le neo takeaway/transcript thap (%.0f%%, %d/%d) — doi chieu tay"
                % (hit / anchors * 100, hit, anchors))

        if d["vac"] and d["method"] == "local_transcript_heuristic":
            d["vac_evidence_gap"] = True
            review_flags.append(
                "S9: visual_audio_checked=true nhung method=local_transcript_heuristic "
                "— can tai xac nhan bang chung hinh/anh")

    # ---------------- E. KENH & TAGS ----------------
    e = {}
    checks["E_channels"] = e
    channels = video_row.get("channels") or []
    mentioned = [m for m in (insights.get("channels_mentioned") or []) if m]
    e["channels"] = len(channels)
    e["channels_mentioned"] = len(mentioned)
    e["channels_mentioned_no_handle"] = len(mentioned) if not channels and mentioned else 0
    tags = video_row.get("tags") or []
    e["tags"] = len(tags)
    if not tags:
        issues.append("E1: tags rong")
    market = video_row.get("market") or []
    if not market:
        issues.append("E2: market rong")

    rec["issue_count"] = len(issues)
    return rec


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sku", action="append", default=[])
    ap.add_argument("--skip-http", action="store_true")
    ap.add_argument("--no-vps", action="store_true")
    ap.add_argument("--out-suffix", default="")
    args = ap.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)
    catalog = {r["sku"]: r for r in (load_json(os.path.join(ROOT, "data", "catalog.json")) or [])}
    catalog_full = {r["sku"]: r for r in
                    (load_json(os.path.join(ROOT, "data", "catalog_full.json")) or []) if r.get("sku")}
    videos = {r["sku"]: r for r in
              (load_json(os.path.join(ROOT, "data-tabs", "videos.json")) or []) if r.get("sku")}
    insights = load_json(os.path.join(ROOT, "data", "video_insights.json")) or {}
    modules_raw = load_json(os.path.join(ROOT, "data", "modules.json")) or {}
    modules = {}
    for mod in modules_raw.get("modules", []):
        for item in mod.get("items", []):
            if item.get("sku"):
                modules[item["sku"]] = item
    silence = (load_json(os.path.join(OUT_DIR, "silence.json")) or {}).get("videos", {})
    vision = (load_json(os.path.join(OUT_DIR, "vision.json")) or {}).get("videos", {})
    loudness_cache = (load_json(os.path.join(OUT_DIR, "loudness.json")) or {}).get("videos", {})
    speech_density = (load_json(os.path.join(OUT_DIR, "speech_density.json")) or {}).get("videos", {})
    integrity_cache = (load_json(os.path.join(OUT_DIR, "media_integrity_cache.json")) or {}).get("videos", {})

    ctx = {"catalog": catalog, "catalog_full": catalog_full, "videos": videos,
           "insights": insights, "modules": modules, "silence": silence,
           "vision": vision, "loudness": loudness_cache,
           "speech_density": speech_density, "integrity": integrity_cache}

    skus = args.sku or sorted(catalog.keys())
    print("audit_v2: %d SKU | silence coverage: %d/%d"
          % (len(skus), sum(1 for s in skus if s in silence), len(skus)))

    t0 = time.time()
    report = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for rec in pool.map(lambda s: audit_one(s, ctx), skus):
            report.append(rec)
            print("  %-42s issues=%d" % (rec["sku"], rec["issue_count"]), flush=True)
    report.sort(key=lambda r: r["sku"])

    # ---- HTTP: local + VPS (rieng, gom 1 lan) ----
    http = {"local": {}, "vps": {}}
    if not args.skip_http:
        for base, key in ((LOCAL_BASE, "local"), (VPS_BASE, "vps")):
            if key == "vps" and args.no_vps:
                continue
            codes = {}
            for sku in skus:
                url = "%s/lotrinh/%s" % (base, sku)
                code = http_code(url, timeout=15)
                codes[sku] = code
            http[key] = codes
    for rec in report:
        sku = rec["sku"]
        if http["local"]:
            rec["http_local"] = http["local"].get(sku)
        if http["vps"]:
            rec["http_vps"] = http["vps"].get(sku)

    # ---- lenh HTTP vao issues ----
    for rec in report:
        if rec.get("http_local") not in (200, None) and rec.get("http_local"):
            rec["issues"].append("F1: local HTTP %s" % rec["http_local"])
        if rec.get("http_vps") not in (200, None) and rec.get("http_vps"):
            rec["issues"].append("F2: vps HTTP %s" % rec["http_vps"])
        rec["issue_count"] = len(rec["issues"])

    # ---- KPI: totalDuration sai dinh dang ----
    module_issues = []
    for mod in modules_raw.get("modules", []):
        td = mod.get("totalDuration")
        if td:
            parts = str(td).split(":")
            if len(parts) == 2 and parse_mmss(td) and parse_mmss(td) > 3600:
                module_issues.append("M11-like: %s totalDuration '%s' thieu gio" % (mod.get("id"), td))

    summary = {
        "total": len(report),
        "clean": sum(1 for r in report if r["issue_count"] == 0),
        "with_issues": sum(1 for r in report if r["issue_count"] > 0),
        "with_review_flags": sum(1 for r in report if r.get("review_flags")),
        "with_standards_gaps": sum(1 for r in report if r.get("standards_gaps")),
        "by_check": {},
        "by_review": {},
        "by_standards": {},
    }
    for rec in report:
        for iss in rec["issues"]:
            code = iss.split(":")[0]
            summary["by_check"][code] = summary["by_check"].get(code, 0) + 1
        for fl in rec.get("review_flags") or []:
            code = fl.split(":")[0]
            summary["by_review"][code] = summary["by_review"].get(code, 0) + 1
        for gp in rec.get("standards_gaps") or []:
            code = gp.split(":")[0]
            summary["by_standards"][code] = summary["by_standards"].get(code, 0) + 1
    summary["module_issues"] = module_issues
    summary["elapsed_sec"] = round(time.time() - t0, 1)

    out_json = os.path.join(OUT_DIR, "report%s.json" % args.out_suffix)
    with open(out_json, "w", encoding="utf-8") as fh:
        json.dump({"schema": "h2dev.audit-v2.v1",
                   "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                   "summary": summary, "videos": report}, fh, ensure_ascii=False, indent=1)

    # Ghi cache loudness + audio integrity (de lan audit sau khong phai do lai)
    try:
        measured = {r["sku"]: r["checks"]["B_media"]["loudness"]
                    for r in report
                    if r.get("checks", {}).get("B_media", {}).get("loudness")}
        if measured:
            cache_out = os.path.join(OUT_DIR, "loudness.json")
            merged = dict(loudness_cache)
            merged.update(measured)
            with open(cache_out, "w", encoding="utf-8") as fh:
                json.dump({"schema": "h2dev.loudness.v1",
                           "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                           "total": len(merged), "videos": merged},
                          fh, ensure_ascii=False, indent=1)
    except Exception as exc:  # noqa: BLE001
        print("canh bao: khong ghi duoc loudness cache: %s" % exc)

    try:
        integ_measured = {r["sku"]: r["checks"]["B_media"]["audio_integrity"]
                          for r in report
                          if r.get("checks", {}).get("B_media", {}).get("audio_integrity")}
        if integ_measured:
            cache_out = os.path.join(OUT_DIR, "media_integrity_cache.json")
            merged = dict(integrity_cache)
            merged.update(integ_measured)
            broken = [k for k, v in merged.items() if v.get("verdict") == "broken"]
            with open(cache_out, "w", encoding="utf-8") as fh:
                json.dump({"schema": "h2dev.media-integrity.v1",
                           "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                           "method": "2 phep do doc lap: (1) nb_frames/stream.duration vs chuan 43.07 frame/s (AAC 44.1kHz); "
                                     "(2) decode probe: trich 10s tai 50% thoi luong roi do lai do dai thuc.",
                           "total": len(merged),
                           "broken_count": len(broken),
                           "broken": broken,
                           "videos": merged}, fh, ensure_ascii=False, indent=1)
    except Exception as exc:  # noqa: BLE001
        print("canh bao: khong ghi duoc media integrity cache: %s" % exc)

    md = ["# BAO CAO AUDIT VIDEO v2 — H2DEV (136 video)", "",
          "- Sinh luc: %s" % time.strftime("%Y-%m-%d %H:%M:%S"),
          "",
          "## 3 nhom ket qua KHAC NHAU ve ban chat (khong tron lan)",
          "",
          "| Nhom | Y nghia | So video |",
          "|---|---|---|",
          "| **A. ISSUE** | Du lieu hong / sai that — phai sua | %d |" % summary["with_issues"],
          "| **B. REVIEW** | Nghi van, chua du bang chung ket luan — can kiem tay | %d |"
          % summary["with_review_flags"],
          "| **C. STANDARDS GAP** | Chua dat chuan Bo Vang Phần 7 — KHONG phai data hong | %d |"
          % summary["with_standards_gaps"],
          "",
          "## A. Issue (du lieu hong that)", ""]
    for code, cnt in sorted(summary["by_check"].items(), key=lambda x: -x[1]):
        md.append("- `%s`: **%d**" % (code, cnt))
    if summary["by_review"]:
        md += ["", "## B. Can kiem tay (chua du bang chung ket luan)", ""]
        for code, cnt in sorted(summary["by_review"].items(), key=lambda x: -x[1]):
            md.append("- `%s`: **%d**" % (code, cnt))
    if summary["by_standards"]:
        md += ["", "## C. Chua dat chuan Bo Vang (khong phai data hong)", ""]
        for code, cnt in sorted(summary["by_standards"].items(), key=lambda x: -x[1]):
            md.append("- `%s`: **%d**" % (code, cnt))
    if module_issues:
        md += ["", "## Issue cap module", ""] + ["- " + m for m in module_issues]
    md += ["", "---", "", "## Chi tiet theo video", ""]
    for rec in report:
        if not (rec["issue_count"] or rec.get("review_flags") or rec.get("standards_gaps")):
            continue
        md.append("### %s (`%s`)" % (rec["sku"], rec.get("real_duration_sec")))
        for iss in rec["issues"]:
            md.append("- **[ISSUE]** " + iss)
        for fl in rec.get("review_flags") or []:
            md.append("- [review] " + fl)
        for gp in rec.get("standards_gaps") or []:
            md.append("- [chuan] " + gp)
        g = rec["checks"].get("A_transcript", {})
        if g.get("gaps_unexplained_detail"):
            md.append("  - khoang trong khong giai thich: %s" % g["gaps_unexplained_detail"])
        md.append("")
    with open(os.path.join(OUT_DIR, "report%s.md" % args.out_suffix), "w", encoding="utf-8") as fh:
        fh.write("\n".join(md))

    print("\n=== SUMMARY ===")
    print(json.dumps(summary, ensure_ascii=False, indent=1))
    print("report: %s" % out_json)


if __name__ == "__main__":
    main()
