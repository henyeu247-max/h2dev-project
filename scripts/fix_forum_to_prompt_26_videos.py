# -*- coding: utf-8 -*-
"""
Chuẩn hóa 26 video: Thay thế các từ ngữ phát âm/phiên âm sai như 'forum', 'from', 'phom'
thành 'prompt' hoặc 'form prompt' chính xác theo ngữ cảnh câu lệnh kịch bản AI.
"""

import os
import json
import re

TARGET_26 = [
    "VIDEO-027064", "VIDEO-25fddf", "VIDEO-2aa1f7", "VIDEO-34f417", "VIDEO-35014d",
    "VIDEO-39ae49", "VIDEO-3df94e", "VIDEO-458892", "VIDEO-54422c", "VIDEO-54c8f7",
    "VIDEO-5c3116", "VIDEO-5cb825", "VIDEO-82f8a8", "VIDEO-8603a9", "VIDEO-891f32",
    "VIDEO-b380a1", "VIDEO-bdfab7", "VIDEO-5d54d0", "VIDEO-ca0b1a", "VIDEO-e90874",
    "VIDEO-5fe83a", "VIDEO-af606d", "VIDEO-b559c8", "VIDEO-348217", "VIDEO-a1c98f",
    "VIDEO-5c0b20"
]

def clean_text(text, is_3df94e=False):
    placeholder = "___ROMAN_FORUM_PRESERVE___"
    if is_3df94e and "guardians of the forum" in text:
        text = text.replace("guardians of the forum", placeholder)
    
    # Specific contextual patterns
    patterns = [
        (r"\b(?:cái|Cái)\s+forum\b", "cái prompt"),
        (r"\b(?:Cái|cái)\s+From\b", "cái prompt"),
        (r"\b(?:Cái|cái)\s+from\b", "cái prompt"),
        (r"\b(?:Cái|cái)\s+form\b", "cái form prompt"),
        (r"\b(?:những|Những)\s+cái\s+forum\b", "những cái prompt"),
        (r"\b(?:các|Các)\s+cái\s+forum\b", "các cái prompt"),
        (r"\b(?:tạo|Tạo)\s+forum\b", "tạo prompt"),
        (r"\b(?:lấy|Lấy)\s+forum\b", "lấy prompt"),
        (r"\b(?:train|Train)\s+forum\b", "train prompt"),
        (r"\b(?:viết|Viết)\s+from\b", "viết prompt"),
        (r"\b(?:tạo|Tạo)\s+from\b", "tạo prompt"),
        (r"\b(?:lấy|Lấy)\s+from\b", "lấy prompt"),
        (r"\b(?:train|Train)\s+From\b", "train prompt"),
        (r"\b(?:train|Train)\s+from\b", "train prompt"),
        (r"\b(?:train|Train)\s+form\b", "train prompt"),
        (r"\b(?:bỏ|Bỏ)\s+from\b", "bỏ prompt"),
        (r"\b(?:bỏ|Bỏ)\s+cái\s+from\b", "bỏ cái prompt"),
        (r"\byêu cầu của forum\b", "yêu cầu của prompt"),
        (r"\bphần forum\b", "phần prompt"),
        (r"\bForum hình ảnh\b", "Prompt hình ảnh"),
        (r"\bforum hình ảnh\b", "prompt hình ảnh"),
        (r"\bforum này\b", "prompt này"),
        (r"\bForum này\b", "Prompt này"),
        (r"\bform này\b", "form prompt này"),
        (r"\bforum của em\b", "prompt của em"),
        (r"\bforum em\b", "prompt em"),
        (r"\bforum á\b", "prompt á"),
        (r"\bforum để\b", "prompt để"),
        (r"\bforum đó\b", "prompt đó"),
        (r"\bforum cho\b", "prompt cho"),
        (r"\bforum 1\b", "prompt 1"),
        (r"\bforum thứ\b", "prompt thứ"),
        (r"\bforum các kiểu\b", "prompt các kiểu"),
        (r"\blike forum\b", "lấy prompt"),
        (r"\bRear Cut From\b", "câu lệnh Prompt"),
        (r"\bfrom skill\b", "prompt skill"),
        (r"\bviết cái from\b", "viết cái prompt"),
        (r"\bphom\b", "form prompt"),
        (r"\bforum\b", "prompt"),
        (r"\bForum\b", "Prompt"),
    ]
    
    for pat, rep in patterns:
        text = re.sub(pat, rep, text)
    
    if is_3df94e and placeholder in text:
        text = text.replace(placeholder, "guardians of the forum")
    return text

def main():
    root = "H2DEV-Project"
    video_dir = os.path.join(root, "video")
    
    updated_videos = []
    
    for sku in TARGET_26:
        v_folder = os.path.join(video_dir, sku)
        if not os.path.isdir(v_folder):
            print(f"[WARN] Video folder not found: {v_folder}")
            continue
        
        is_3df = (sku == "VIDEO-3df94e")
        sku_changed = False
        
        # 1. Update transcript.srt
        srt_path = os.path.join(v_folder, "transcript.srt")
        if os.path.exists(srt_path):
            with open(srt_path, "r", encoding="utf-8", errors="ignore") as f:
                orig = f.read()
            cleaned = clean_text(orig, is_3df)
            if orig != cleaned:
                with open(srt_path, "w", encoding="utf-8") as f:
                    f.write(cleaned)
                sku_changed = True
        
        # 2. Update transcript.txt
        txt_path = os.path.join(v_folder, "transcript.txt")
        if os.path.exists(txt_path):
            with open(txt_path, "r", encoding="utf-8", errors="ignore") as f:
                orig = f.read()
            cleaned = clean_text(orig, is_3df)
            if orig != cleaned:
                with open(txt_path, "w", encoding="utf-8") as f:
                    f.write(cleaned)
                sku_changed = True
        
        # 3. Update transcript.json
        json_path = os.path.join(v_folder, "transcript.json")
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    jdata = json.load(f)
                
                # Check structure
                j_changed = False
                if isinstance(jdata, list):
                    for seg in jdata:
                        t = seg.get("text", "")
                        c = clean_text(t, is_3df)
                        if t != c:
                            seg["text"] = c
                            j_changed = True
                elif isinstance(jdata, dict) and "segments" in jdata:
                    for seg in jdata["segments"]:
                        t = seg.get("text", "")
                        c = clean_text(t, is_3df)
                        if t != c:
                            seg["text"] = c
                            j_changed = True
                
                if j_changed:
                    with open(json_path, "w", encoding="utf-8") as f:
                        json.dump(jdata, f, ensure_ascii=False, indent=2)
                    sku_changed = True
            except Exception as e:
                print(f"[ERR] Failed to process JSON for {sku}: {e}")
        
        if sku_changed:
            updated_videos.append(sku)
            print(f"✅ Cleaned transcripts for: {sku}")

    print(f"\nTotal video folders updated: {len(updated_videos)}/{len(TARGET_26)}")

    # 4. Update data/video_insights.json
    insights_path = os.path.join(root, "data", "video_insights.json")
    if os.path.exists(insights_path):
        with open(insights_path, "r", encoding="utf-8") as f:
            vi = json.load(f)
        
        vi_changed = False
        for sku, val in vi.items():
            # Clean takeaways
            if "key_takeaways" in val:
                new_tks = []
                for tk in val["key_takeaways"]:
                    c_tk = clean_text(tk)
                    if c_tk != tk:
                        vi_changed = True
                    new_tks.append(c_tk)
                val["key_takeaways"] = new_tks
            
            # Clean timestamps
            if "key_timestamps" in val:
                for ts in val["key_timestamps"]:
                    lbl = ts.get("label", "")
                    c_lbl = clean_text(lbl)
                    if c_lbl != lbl:
                        ts["label"] = c_lbl
                        vi_changed = True
            
            # Clean actual_topic
            if "actual_topic" in val:
                c_top = clean_text(val["actual_topic"])
                if c_top != val["actual_topic"]:
                    val["actual_topic"] = c_top
                    vi_changed = True
        
        if vi_changed:
            with open(insights_path, "w", encoding="utf-8") as f:
                json.dump(vi, f, ensure_ascii=False, indent=2)
            print("✅ Updated data/video_insights.json (purged all remaining forum references)")

    # 5. Check docs/*/README.md
    docs_dir = os.path.join(root, "docs")
    if os.path.isdir(docs_dir):
        doc_count = 0
        for sku in TARGET_26:
            r_path = os.path.join(docs_dir, sku, "README.md")
            if os.path.exists(r_path):
                with open(r_path, "r", encoding="utf-8", errors="ignore") as f:
                    orig = f.read()
                cleaned = clean_text(orig, sku == "VIDEO-3df94e")
                if orig != cleaned:
                    with open(r_path, "w", encoding="utf-8") as f:
                        f.write(cleaned)
                    doc_count += 1
        print(f"✅ Updated {doc_count} README files in docs/")

if __name__ == "__main__":
    main()
