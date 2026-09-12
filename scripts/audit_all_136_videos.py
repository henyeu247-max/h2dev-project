# -*- coding: utf-8 -*-
"""
AUDIT TOÀN DIỆN 136 VIDEO — H2DEV PROJECT
==========================================
Kiểm định N/N (không lấy mẫu) trên 5 nhóm tiêu chí:

  A. CƠ CHẾ SUB (Transcript)
     A1. Đủ 3 định dạng srt/txt/json
     A2. Số segment khớp giữa 3 định dạng
     A3. Ảo giác Whisper (subscribe / La La School / Ghiền Mì Gõ ...)
     A4. Segment "nén chữ" (rớt nguyên âm)
     A5. Segment rác (chỉ toàn "à")
     A6. Segment lệch thứ tự thời gian
     A7. Định dạng timestamp SRT hợp lệ
     A8. Độ phủ timeline so với thời lượng video thật

  B. FILE LIÊN QUAN
     B1. File video tồn tại & > 0 byte
     B2. Thumbnail tồn tại
     B3. File tài liệu (docs) tồn tại trên đĩa
     B4. notes.txt (nếu có)

  C. ĐỒNG BỘ DỮ LIỆU
     C1. Hiện diện đồng thời ở catalog / catalog_full / videos.json / modules.json
     C2. Số docs khớp giữa các bảng
     C3. Thị trường (market) khớp giữa các bảng

  D. NGUỒN & TÓM TẮT (Insights)
     D1. Có entry trong video_insights.json
     D2. key_takeaways >= 3
     D3. key_timestamps >= 3 và seconds nằm trong thời lượng video
     D4. Có edit_sop và avoid_flags
     D5. Có actual_topic

  E. TAG
     E1. market có giá trị hợp lệ
     E2. tags array không rỗng
     E3. niche_primary có giá trị
     E4. badge hiển thị

Xuất: _audit/20260912-full-136-audit/report.json + report.md
"""

import os
import re
import json
import glob
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_audit" / "20260912-full-136-audit"
OUT.mkdir(parents=True, exist_ok=True)

HALL_PATTERNS = [
    "subscribe cho kênh", "Ghiền Mì Gõ", "La La School",
    "Cảm ơn các bạn đã theo dõi", "Hãy subscribe", "quảng cáo sau",
    "đăng ký kênh để ủng hộ", "nhớ đăng ký kênh", "like và chia sẻ",
]
VALID_MARKETS = ["🇻🇳", "🇺🇸", "🇨🇦", "🇯🇵", "🇰🇷", "🇨🇳", "🌐", "🇬🇧", "🇦🇺", "🇩🇪", "🇲🇽", "🇮🇳", "🇫🇷", "🇪🇸", "🇮🇹", "🇧🇷", "🇹🇭", "🇮🇩", "🇵🇭", "🇸🇬"]


def short_ratio(text):
    toks = [t for t in re.split(r"\s+", text.strip()) if t]
    if len(toks) < 6:
        return 0.0
    return sum(1 for t in toks if len(t) <= 2) / len(toks)


def load(p):
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def probe_duration(video_path):
    """Đọc thời lượng thật bằng ffprobe."""
    import subprocess
    ff = "D:/Linly-Dubbing/bin/ffprobe.exe"
    if not os.path.exists(ff) or not os.path.exists(video_path):
        return None
    try:
        out = subprocess.check_output(
            [ff, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(video_path)],
            timeout=30).decode().strip()
        return float(out)
    except Exception:
        return None


def main():
    catalog = load(ROOT / "data" / "catalog.json")
    catalog_full = load(ROOT / "data" / "catalog_full.json")
    videos_json = load(ROOT / "data-tabs" / "videos.json")
    modules = load(ROOT / "data" / "modules.json")
    insights = load(ROOT / "data" / "video_insights.json")

    cat_by = {x["sku"]: x for x in catalog}
    full_by = {x["sku"]: x for x in catalog_full}
    vj_by = {(x.get("sku") or x.get("id")): x for x in videos_json}
    ins_by = insights

    # modules index
    mod_by = {}
    for m in modules.get("modules", []):
        for it in m.get("items", []):
            mod_by[it.get("sku")] = (m["id"], it)

    skus = sorted(cat_by.keys())
    report = []
    summary = {
        "total": len(skus),
        "A_transcript": {}, "B_files": {}, "C_sync": {},
        "D_insights": {}, "E_tags": {},
    }

    for sku in skus:
        c = cat_by[sku]
        vfolder = ROOT / "video" / sku
        issues = []

        # ---------------- A. TRANSCRIPT ----------------
        a = {}
        jp = vfolder / "transcript.json"
        sp = vfolder / "transcript.srt"
        tp = vfolder / "transcript.txt"
        a["has_json"] = jp.exists()
        a["has_srt"] = sp.exists()
        a["has_txt"] = tp.exists()
        if not (a["has_json"] and a["has_srt"] and a["has_txt"]):
            issues.append("A1: thiếu file phụ đề (" +
                          ",".join(k for k in ["json", "srt", "txt"]
                                   if not a.get("has_" + k)) + ")")

        n_json = n_srt = n_txt = 0
        hall = comp = junk = ooo = bad_ts = 0
        last_end = 0.0
        if a["has_json"]:
            try:
                d = load(jp)
                segs = d.get("segments") or []
                n_json = len(segs)
                for i, s in enumerate(segs):
                    t = s.get("text", "")
                    if any(h.lower() in t.lower() for h in HALL_PATTERNS):
                        hall += 1
                    if short_ratio(t) >= 0.75:
                        comp += 1
                    if re.fullmatch(r"(?:à\s*)+", t.strip()):
                        junk += 1
                    if i > 0 and s.get("start", 0) < segs[i - 1].get("start", 0) - 0.01:
                        ooo += 1
                if segs:
                    last_end = segs[-1].get("end", 0)
            except Exception as e:
                issues.append("A2: JSON lỗi đọc: " + str(e)[:50])
        if a["has_srt"]:
            srt = sp.read_text(encoding="utf-8", errors="ignore")
            n_srt = len(re.findall(
                r"^\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$", srt, re.M))
            bad_ts = len(re.findall(r"-->", srt)) - n_srt
        if a["has_txt"]:
            n_txt = len([l for l in tp.read_text(encoding="utf-8", errors="ignore").split("\n") if l.strip()])

        a.update({"n_json": n_json, "n_srt": n_srt, "n_txt": n_txt,
                  "hallucination": hall, "compressed": comp, "junk": junk,
                  "out_of_order": ooo, "bad_timestamp": bad_ts,
                  "last_end_sec": round(last_end, 1)})
        if not (n_json == n_srt == n_txt) and n_json > 0:
            issues.append(f"A2: số segment lệch (json={n_json} srt={n_srt} txt={n_txt})")
        if hall:
            issues.append(f"A3: {hall} segment ảo giác")
        if comp:
            issues.append(f"A4: {comp} segment nén chữ")
        if junk:
            issues.append(f"A5: {junk} segment rác 'à à'")
        if ooo:
            issues.append(f"A6: {ooo} segment lệch thứ tự")
        if bad_ts:
            issues.append(f"A7: {bad_ts} timestamp SRT sai định dạng")

        # A8: coverage vs real duration
        vfile = None
        for ext in [".mp4", ".webm"]:
            cand = vfolder / f"{sku}{ext}"
            if cand.exists():
                vfile = cand
                break
        real_dur = probe_duration(vfile) if vfile else None
        a["real_duration_sec"] = round(real_dur, 1) if real_dur else None
        a["catalog_duration_sec"] = c.get("duration_sec")
        if real_dur and last_end:
            a["coverage_pct"] = round(last_end / real_dur * 100, 1)
            if last_end / real_dur < 0.90:
                issues.append(f"A8: phụ đề chỉ phủ {a['coverage_pct']}% thời lượng")
        else:
            a["coverage_pct"] = None

        # ---------------- B. FILES ----------------
        b = {}
        b["video_exists"] = bool(vfile)
        b["video_size_mb"] = round(vfile.stat().st_size / 1048576, 1) if vfile else 0
        thumb = ROOT / c.get("thumb", "")
        b["thumb_exists"] = thumb.exists()
        if not vfile:
            issues.append("B1: thiếu file video")
        elif b["video_size_mb"] == 0:
            issues.append("B1: file video 0 byte")
        if not b["thumb_exists"]:
            issues.append("B2: thiếu thumbnail")
        missing_docs = []
        for doc in c.get("docs", []):
            f = doc.get("file")
            if f and not (ROOT / f).exists():
                missing_docs.append(f)
        b["docs_total"] = len(c.get("docs", []))
        b["docs_missing"] = len(missing_docs)
        b["docs_missing_list"] = missing_docs[:5]
        if missing_docs:
            issues.append(f"B3: {len(missing_docs)} file tài liệu không tồn tại trên đĩa")
        b["has_notes"] = (vfolder / "notes.txt").exists()

        # ---------------- C. SYNC ----------------
        cc = {}
        cc["in_catalog_full"] = sku in full_by
        cc["in_videos_json"] = sku in vj_by
        cc["in_modules"] = sku in mod_by
        if not cc["in_catalog_full"]:
            issues.append("C1: thiếu trong catalog_full.json")
        if not cc["in_videos_json"]:
            issues.append("C1: thiếu trong data-tabs/videos.json")
        if not cc["in_modules"]:
            issues.append("C1: thiếu trong modules.json")

        def norm_market(m):
            if isinstance(m, list):
                return ",".join(sorted(str(x) for x in m))
            return str(m)

        m_cat = norm_market(c.get("market"))
        cc["market_catalog"] = m_cat
        cc["docs_count_catalog"] = len(c.get("docs", []))
        if sku in vj_by:
            m_vj = norm_market(vj_by[sku].get("market"))
            cc["market_videos_json"] = m_vj
            cc["docs_count_videos_json"] = len(vj_by[sku].get("docs", []))
            if m_vj != m_cat:
                issues.append(f"C3: market lệch giữa catalog({m_cat}) và videos.json({m_vj})")
            if cc["docs_count_videos_json"] != cc["docs_count_catalog"]:
                issues.append(f"C2: số docs lệch giữa catalog({cc['docs_count_catalog']}) và videos.json({cc['docs_count_videos_json']})")
        if sku in mod_by:
            mid, it = mod_by[sku]
            m_mod = norm_market(it.get("market"))
            cc["market_modules"] = m_mod
            cc["module_id"] = mid
            cc["docs_count_modules"] = len(it.get("docs", []))
            if m_mod != m_cat:
                issues.append(f"C3: market lệch giữa catalog({m_cat}) và modules({m_mod})")
            if cc["docs_count_modules"] != cc["docs_count_catalog"]:
                issues.append(f"C2: số docs lệch giữa catalog({cc['docs_count_catalog']}) và modules({cc['docs_count_modules']})")

        # ---------------- D. INSIGHTS ----------------
        dd = {}
        ins = ins_by.get(sku)
        dd["has_insights"] = bool(ins)
        if not ins:
            issues.append("D1: không có entry trong video_insights.json")
            dd.update({"takeaways": 0, "timestamps": 0, "ts_out_of_range": 0,
                       "has_edit_sop": False, "has_avoid": False, "has_topic": False})
        else:
            tk = ins.get("key_takeaways", [])
            ts = ins.get("key_timestamps", [])
            dd["takeaways"] = len(tk)
            dd["timestamps"] = len(ts)
            if len(tk) < 3:
                issues.append(f"D2: chỉ có {len(tk)} key_takeaways (<3)")
            if len(ts) < 3:
                issues.append(f"D3: chỉ có {len(ts)} key_timestamps (<3)")
            oor = 0
            if real_dur:
                for t in ts:
                    sec = t.get("seconds")
                    if sec is None or sec < 0 or sec > real_dur + 5:
                        oor += 1
            dd["ts_out_of_range"] = oor
            if oor:
                issues.append(f"D3: {oor} mốc thời gian nằm ngoài thời lượng video")
            dd["has_edit_sop"] = bool(ins.get("edit_sop"))
            dd["has_avoid"] = bool(ins.get("avoid_flags"))
            dd["has_topic"] = bool(ins.get("actual_topic"))
            if not ins.get("edit_sop"):
                issues.append("D4: thiếu edit_sop")
            if not ins.get("avoid_flags"):
                issues.append("D4: thiếu avoid_flags")
            if not ins.get("actual_topic"):
                issues.append("D5: thiếu actual_topic")

        # ---------------- E. TAGS ----------------
        e = {}
        mk = c.get("market") or ""
        e["market"] = mk
        e["market_valid"] = any(v in str(mk) for v in VALID_MARKETS)
        e["tags"] = c.get("tags", [])
        e["niche_primary"] = c.get("niche_primary")
        e["badge"] = c.get("badge")
        if not e["market_valid"]:
            issues.append(f"E1: market không hợp lệ ({mk!r})")
        if not e["tags"]:
            issues.append("E2: tags rỗng")
        if not e["niche_primary"]:
            issues.append("E3: thiếu niche_primary")
        if not e["badge"]:
            issues.append("E4: thiếu badge")

        report.append({
            "sku": sku, "title": c.get("title", "")[:70],
            "issues": issues,
            "issue_count": len(issues),
            "A": a, "B": b, "C": cc, "D": dd, "E": e,
        })

    # ---- summary ----
    def cnt(pred):
        return sum(1 for r in report if pred(r))

    summary["A_transcript"] = {
        "missing_files": cnt(lambda r: not (r["A"]["has_json"] and r["A"]["has_srt"] and r["A"]["has_txt"])),
        "count_mismatch": cnt(lambda r: r["A"]["n_json"] > 0 and not (r["A"]["n_json"] == r["A"]["n_srt"] == r["A"]["n_txt"])),
        "hallucination": cnt(lambda r: r["A"]["hallucination"] > 0),
        "compressed": cnt(lambda r: r["A"]["compressed"] > 0),
        "junk": cnt(lambda r: r["A"]["junk"] > 0),
        "out_of_order": cnt(lambda r: r["A"]["out_of_order"] > 0),
        "bad_timestamp": cnt(lambda r: r["A"]["bad_timestamp"] > 0),
        "low_coverage": cnt(lambda r: r["A"]["coverage_pct"] is not None and r["A"]["coverage_pct"] < 90),
    }
    summary["A_transcript"]["total_compressed_segments"] = sum(r["A"]["compressed"] for r in report)
    summary["A_transcript"]["total_hallucination_segments"] = sum(r["A"]["hallucination"] for r in report)

    summary["B_files"] = {
        "missing_video": cnt(lambda r: not r["B"]["video_exists"]),
        "missing_thumb": cnt(lambda r: not r["B"]["thumb_exists"]),
        "missing_docs": cnt(lambda r: r["B"]["docs_missing"] > 0),
        "with_notes": cnt(lambda r: r["B"]["has_notes"]),
    }
    summary["C_sync"] = {
        "missing_catalog_full": cnt(lambda r: not r["C"]["in_catalog_full"]),
        "missing_videos_json": cnt(lambda r: not r["C"]["in_videos_json"]),
        "missing_modules": cnt(lambda r: not r["C"]["in_modules"]),
        "market_mismatch": cnt(lambda r: any("C3" in i for i in r["issues"])),
        "docs_count_mismatch": cnt(lambda r: any("C2" in i for i in r["issues"])),
    }
    summary["D_insights"] = {
        "missing_insights": cnt(lambda r: not r["D"]["has_insights"]),
        "low_takeaways": cnt(lambda r: r["D"]["takeaways"] < 3),
        "low_timestamps": cnt(lambda r: r["D"]["timestamps"] < 3),
        "ts_out_of_range": cnt(lambda r: r["D"]["ts_out_of_range"] > 0),
        "missing_edit_sop": cnt(lambda r: not r["D"]["has_edit_sop"]),
        "missing_avoid": cnt(lambda r: not r["D"]["has_avoid"]),
        "missing_topic": cnt(lambda r: not r["D"]["has_topic"]),
    }
    summary["E_tags"] = {
        "invalid_market": cnt(lambda r: not r["E"]["market_valid"]),
        "empty_tags": cnt(lambda r: not r["E"]["tags"]),
        "missing_niche": cnt(lambda r: not r["E"]["niche_primary"]),
        "missing_badge": cnt(lambda r: not r["E"]["badge"]),
    }
    summary["clean_videos"] = cnt(lambda r: r["issue_count"] == 0)
    summary["videos_with_issues"] = cnt(lambda r: r["issue_count"] > 0)

    # Ghi báo cáo
    with open(OUT / "report.json", "w", encoding="utf-8") as f:
        json.dump({"summary": summary, "videos": report}, f, ensure_ascii=False, indent=2)

    # Markdown
    lines = ["# BÁO CÁO AUDIT TOÀN DIỆN 136 VIDEO — H2DEV", "",
             f"- Tổng số video: **{summary['total']}**",
             f"- Video sạch (0 lỗi): **{summary['clean_videos']}**",
             f"- Video có vấn đề: **{summary['videos_with_issues']}**", "",
             "## A. CƠ CHẾ SUB (Transcript)", ""]
    for k, v in summary["A_transcript"].items():
        lines.append(f"- {k}: **{v}**")
    lines += ["", "## B. FILE LIÊN QUAN", ""]
    for k, v in summary["B_files"].items():
        lines.append(f"- {k}: **{v}**")
    lines += ["", "## C. ĐỒNG BỘ DỮ LIỆU", ""]
    for k, v in summary["C_sync"].items():
        lines.append(f"- {k}: **{v}**")
    lines += ["", "## D. NGUỒN & TÓM TẮT (Insights)", ""]
    for k, v in summary["D_insights"].items():
        lines.append(f"- {k}: **{v}**")
    lines += ["", "## E. TAG", ""]
    for k, v in summary["E_tags"].items():
        lines.append(f"- {k}: **{v}**")

    lines += ["", "---", "", "## CHI TIẾT VIDEO CÓ VẤN ĐỀ", ""]
    for r in report:
        if r["issue_count"] > 0:
            lines.append(f"### {r['sku']} — {r['title']}")
            for i in r["issues"]:
                lines.append(f"- {i}")
            lines.append("")
    with open(OUT / "report.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print()
    print("Báo cáo: " + str(OUT / "report.json"))
    print("Báo cáo: " + str(OUT / "report.md"))


if __name__ == "__main__":
    main()
