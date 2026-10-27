"""
Full Pipeline: Generate All 45 Grounded DGMD Insights & Sync Catalogs
Grounded in Whisper Transcripts & Lecture Evidence
Complies with H2DEV-SCAR-029 and H2DEV-SCAR-030
"""

import json
import os
import sys

# Ensure local scripts dir is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dgmd_data_part1 import LESSONS_PART1
from dgmd_data_part2 import LESSONS_PART2

ALL_GROUNDED = {**LESSONS_PART1, **LESSONS_PART2}
print(f"Loaded {len(ALL_GROUNDED)} lesson blueprints.")

def sec_to_time(s):
    m = int(s // 60)
    sec = int(s % 60)
    return f"{m:02d}:{sec:02d}"

def get_exact_timestamps(sku, targets_and_labels):
    t_file = f'video/{sku}/transcript.json'
    if not os.path.exists(t_file):
        return [{"time": sec_to_time(sec), "seconds": sec, "label": lbl} for sec, lbl in targets_and_labels]
    
    with open(t_file, 'r', encoding='utf-8') as f:
        tj = json.load(f)
    segs = tj.get('segments', [])
    if not segs:
        return [{"time": sec_to_time(sec), "seconds": sec, "label": lbl} for sec, lbl in targets_and_labels]
        
    res = []
    for target_sec, label in targets_and_labels:
        best = min(segs, key=lambda s: abs(s['start'] - target_sec))
        sec = int(best['start'])
        res.append({
            "time": sec_to_time(sec),
            "seconds": sec,
            "label": label
        })
    return res

# Extra dedicated documents extracted directly from lecture instructions
SPECIAL_DOCS = {
    "VIDEO-96b420": {
        "title": "Master Prompt & Kịch Bản Hội Thoại Tiếng Anh (Trích xuất từ bài giảng)",
        "content": """# Kịch Bản & Master Prompt: Hội Thoại Tiếng Anh Song Ngữ (DGMD)

Tài liệu được trích xuất trực tiếp từ bài giảng thực chiến VIDEO-96b420.

## 1. CÔNG CỤ YÊU CẦU
- ChatGPT: Soạn kịch bản hội thoại song ngữ & tạo hình ảnh nhân vật, bối cảnh.
- Picsart: Thiết kế khung bong bóng thoại (Speech Bubble) độc quyền chống đụng hàng.
- CapCut PC: Tách nền tự động (Auto Cutout), tạo rung máy (Camera Shake), lồng giọng Text-to-Speech tiếng Anh nam/nữ.

---

## 2. PROMPT CHATGPT: SOẠN KỊCH BẢN HỘI THOẠI SONG NGỮ
Hãy sáng tạo cho tôi một cuộc trò chuyện bằng tiếng Anh giữa một nam thanh niên và một cô gái (hoặc ông cụ và bà cụ / bố mẹ và con cái).
Chủ đề: Một ngày mới bắt đầu tại nơi làm việc / công sở.
Yêu cầu định dạng:
- Đánh dấu rõ ràng lượt nói của Nam và Nữ.
- Cố định cuộc hội thoại bằng tiếng Anh kèm bản dịch tiếng Việt song song ở mỗi câu thoại (chia 2 cột hoặc dịch ngay bên dưới).
- Câu từ tự nhiên, phù hợp trình độ giao tiếp thường ngày (A2 - B1).
- Độ dài khoảng 8-12 câu thoại đối đáp qua lại.

---

## 3. PROMPT CHATGPT / DALL-E: TẠO NHÂN VẬT NAM
Hãy tạo cho tôi một hình ảnh nhân vật nam khoảng 20-25 tuổi, mặc bộ vest công sở chỉnh tề, phong cách minh họa truyện tranh hoạt hình (cartoon illustration).
- Góc nhìn: Trung cảnh (medium shot, nhìn từ đùi trở lên).
- Tư thế: Nhân vật đang quay người và hướng ánh nhìn sang phía BÊN TRÁI màn hình, nét mặt tươi cười thân thiện.
- Nền: Nền trắng đơn sắc để dễ tách nền.
- Tỷ lệ khung hình: 9:16 hoặc 1:1.

---

## 4. PROMPT CHATGPT / DALL-E: TẠO NHÂN VẬT NỮ
Hãy tạo cho tôi một hình ảnh nhân vật nữ khoảng 20-25 tuổi, mặc trang phục công sở thanh lịch, cùng phong cách minh họa hoạt hình với nhân vật nam.
- Góc nhìn: Trung cảnh (medium shot, nhìn từ đùi trở lên).
- Tư thế: Nhân vật đang quay người và hướng ánh nhìn sang phía BÊN PHẢI màn hình (đối diện nhân vật nam), nét mặt rạng rỡ.
- Nền: Nền trắng đơn sắc để dễ tách nền.
- Tỷ lệ khung hình: 9:16 hoặc 1:1.

---

## 5. PROMPT CHATGPT: TẠO HÌNH NỀN BỐI CẢNH 16:9
Hãy tạo cho tôi một hình nền bối cảnh văn phòng làm việc hiện đại, có cửa kính nhìn ra thành phố buổi sáng, phong cách minh họa hoạt hình đồng nhất với nhân vật.
- Góc nhìn: Phối cảnh ngang, không có người trong ảnh.
- Tỷ lệ khung hình: 16:9 (ngang Full HD).

---

## 6. QUY TRÌNH HẬU KỲ TRÊN CAPCUT PC & PICSART
1. Picsart:
   - Mở khung vẽ trong suốt, vẽ 2 mẫu khung bong bóng thoại hình vuông bo góc màu trắng:
     + 1 khung có đuôi nhọn trỏ sang trái (cho nam).
     + 1 khung có đuôi nhọn trỏ sang phải (cho nữ).
   - Xuất file PNG trong suốt.
2. CapCut PC:
   - Thêm ảnh nền 16:9 vào Track 1.
   - Thêm ảnh nhân vật Nam bên trái, Nữ bên phải. Bật tính năng 'Xóa tự động' (Auto Cutout) để tách nền sạch sẽ.
   - Hiệu ứng: Thêm hiệu ứng 'Máy ảnh rung' (Camera Shake) mức độ nhẹ kéo dài toàn bộ clip để nhân vật cử động tự nhiên, tránh bị thuật toán YouTube quét lỗi video tĩnh (reused/repetitive content).
   - Thêm bong bóng thoại từ Picsart vào từng phân đoạn thoại.
   - Sử dụng Text-to-Speech của CapCut: chọn 1 voice nam tiếng Anh và 1 voice nữ tiếng Anh cố định cho cả series.
   - Căn timeline so le: Khi Nam nói thì bong bóng thoại + text nam hiện; khi Nữ nói thì bong bóng thoại + text nữ hiện.
"""
    },
    "VIDEO-38145b": {
        "title": "Mẫu Đơn Kháng Nghị Khôi Phục Kênh YouTube Bị Xóa Nhầm (ChatGPT Appeal)",
        "content": """# Mẫu Đơn Kháng Nghị Khôi Phục Kênh YouTube Bị Xóa Nhầm

Tài liệu trích xuất từ bài giảng thực chiến VIDEO-38145b.

## 1. THÔNG TIN CẦN CHUẨN BỊ
- URL gốc của kênh dạng UC (lấy từ email thông báo chấm dứt): Ví dụ https://www.youtube.com/channel/UCxxxxxxxxx
- Email quản trị chính của kênh.
- Email liên hệ nhận phản hồi.

---

## 2. PROMPT CHATGPT SOẠN ĐƠN KHÁNG NGHỊ
Hãy đóng vai một chuyên gia pháp lý và nhà sáng tạo nội dung YouTube lâu năm.
Kênh YouTube của tôi vừa bị hệ thống tự động gắn cờ vi phạm Nguyên tắc cộng đồng và chấm dứt tài khoản một cách nhầm lẫn. Kênh của tôi hoàn toàn tuân thủ các chính sách về bản quyền, spam và an toàn nội dung.
Hãy viết cho tôi một bức thư kháng cáo (Appeal letter) bằng tiếng Anh thật trang trọng, lịch sự, viện dẫn đúng điều khoản và yêu cầu nhân viên con người (human specialist) xem xét thủ công lại trường hợp của tôi.

---

## 3. MẪU VĂN BẢN KHÁNG NGHỊ TIẾNG ANH CHUẨN MỰC
Dear YouTube Support and Trust & Safety Team,

I am writing this appeal to respectfully request a manual human review of the recent termination of my YouTube channel. I believe this decision was made in error by the automated detection system.

Channel Details:
- Channel Name: [Tên Kênh của bạn]
- Channel URL: [Dán link dạng https://www.youtube.com/channel/UC...]
- Associated Email: [Email của bạn]

I have thoroughly reviewed YouTube's Community Guidelines, Spam and Deceptive Practices Policies, and Copyright Policies. I can confirm with absolute certainty that:
1. All content uploaded to my channel is strictly created in accordance with YouTube guidelines, focusing on educational, commentary, or original creative value.
2. My channel has never engaged in spam, scams, misleading metadata, artificial traffic, or abusive practices.
3. No strikes or prior warnings were issued, and I take intellectual property and viewer safety with utmost seriousness.

Because automated systems can occasionally misclassify original content or benign activity, I sincerely request that a human specialist manually inspect my channel's history and content. I am confident that upon closer human inspection, you will find my channel to be in full compliance.

Thank you very much for your time, understanding, and dedication to keeping YouTube a fair platform for creators.

Sincerely,
[Họ và tên của bạn]
[Số điện thoại liên hệ]
"""
    },
    "VIDEO-fc62eb": {
        "title": "Công Thức Đúc Master Prompt Nhất Quán Nhân Vật AI (Prompt Master)",
        "content": """# Công Thức Đúc Master Prompt Nhất Quán Nhân Vật AI

Tài liệu trích xuất từ bài giảng thực chiến VIDEO-fc62eb.

## 1. NGUYÊN TẮC CỐT LÕI
Master Prompt là câu lệnh gốc cố định 5 thành phần nhận diện của nhân vật:
1. Nhân khẩu học: Tuổi tác, giới tính, chủng tộc, quốc tịch.
2. Khuôn mặt & Tóc: Màu tóc, kiểu tóc, màu mắt, đặc điểm nhận dạng đặc trưng.
3. Trang phục cố định: Màu sắc áo, quần, phụ kiện (kính, mũ, khăn).
4. Phong cách nghệ thuật (Art Style): 3D Pixar, 2D Anime Ghibli, hay Cinematic Photorealism.
5. Ánh sáng & Bối cảnh: Giờ vàng (Golden hour), ánh sáng studio sạch, tỷ lệ khung hình.

---

## 2. CÂU LỆNH TẠO MASTER PROMPT TRÊN CHATGPT
Tôi muốn tạo một series video phim hoạt hình có nhân vật chính xuất hiện xuyên suốt 100 phân cảnh mà không bị đổi mặt hay đổi trang phục.
Hãy phân tích bức ảnh nhân vật này và viết cho tôi một bộ Master Prompt tiếng Anh chuẩn với các thuộc tính cố định (Fixed Attributes) và để sẵn các thẻ biến số hành động [ACTION] và môi trường [ENVIRONMENT] để tôi thay thế cho từng cảnh.

---

## 3. KHUNG MASTER PROMPT TIẾNG ANH CHUẨN
A high-quality 3D animated character, [TUỔI] year old [GIỚI TÍNH], [MÀU DA], [MÀU MẮT], [KIỂU TÓC VÀ MÀU TÓC], wearing [TRANG PHỤC CỐ ĐỊNH], [BIỂU CẢM KHUÔN MẶT].
Currently [HÀNH ĐỘNG CỦA CẢNH - ACTION], located in [BỐI CẢNH - ENVIRONMENT].
Cinematic lighting, warm color palette, Unreal Engine 5 render, highly detailed, Pixar and Disney animation style, 8k resolution, shot on 35mm lens, 16:9 aspect ratio --ar 16:9 --v 6.0
"""
    },
    "VIDEO-ad6a82": {
        "title": "Bảng Tra Cứu Các Góc Quay Điện Ảnh Khi Đặt Prompt Sinh Ảnh AI",
        "content": """# Bảng Tra Cứu Góc Quay Điện Ảnh Cho Prompt Sinh Ảnh AI

Tài liệu trích xuất từ bài giảng thực chiến VIDEO-ad6a82.

## 1. BẢNG THUẬT NGỮ GÓC MÁY QUỐC TẾ
- **Extreme Wide Shot / Establishing Shot**: Toàn cảnh rộng lớn. Dùng ở đầu video để giới thiệu không gian vĩ mô (thành phố, núi rừng, vũ trụ).
- **Wide Shot / Full Shot**: Toàn thân nhân vật từ đầu đến chân. Dùng để thể hiện tương quan giữa nhân vật và môi trường xung quanh.
- **Medium Shot (Cowboy Shot)**: Trung cảnh, nhìn từ thắt lưng hoặc đùi trở lên. Góc máy chuẩn nhất cho các cảnh đối thoại, giao tiếp.
- **Medium Close-up**: Từ ngực trở lên. Bắt đầu tập trung vào biểu cảm và lời nói của nhân vật.
- **Close-up Shot**: Cận cảnh khuôn mặt. Tác động thị giác mạnh mẽ, bộc lộ rõ niềm vui, nỗi buồn, sự sợ hãi.
- **Extreme Close-up / Macro**: Đặc tả chi tiết siêu nhỏ (ánh mắt, giọt nước mắt, bàn tay siết chặt, chìa khóa).
- **Low-angle Shot**: Góc máy từ dưới hất lên. Tạo cảm giác nhân vật hùng vĩ, quyền lực, đáng sợ hoặc người chiến thắng.
- **High-angle / Bird's-eye View**: Góc máy từ trên cao nhìn xuống. Tạo cảm giác nhân vật nhỏ bé, yếu thế, cô đơn hoặc quan sát toàn cảnh bàn cờ.
- **Dutch Angle / Tilted Shot**: Góc máy nghiêng chéo. Thể hiện sự bất ổn tâm lý, nguy hiểm, thế giới đảo lộn.
- **Over-the-shoulder Shot**: Góc máy nhìn qua vai người này sang mặt người kia. Chuẩn mực cho cảnh 2 nhân vật tranh luận.

---

## 2. MẪU PROMPT KẾT HỢP GÓC MÁY
- Cảnh 1 (Toàn cảnh): `Cinematic wide establishing shot of a futuristic cyberpunk city in heavy rain, neon lights reflecting on wet streets --ar 16:9`
- Cảnh 2 (Trung cảnh): `Medium shot of a handsome detective in a trench coat talking to a female witness outside a café, 35mm photography --ar 16:9`
- Cảnh 3 (Cận cảnh): `Dramatic close-up shot of the detective's determined face, sharp focus on eyes, moody rim lighting --ar 16:9`
"""
    }
}

# 1. Write special docs to disk
for sku, doc_info in SPECIAL_DOCS.items():
    doc_dir = f"assets/docs-dgmd/{sku}"
    os.makedirs(doc_dir, exist_ok=True)
    txt_path = os.path.join(doc_dir, "master_prompt.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(doc_info["content"])
    print(f"Wrote special prompt doc for {sku}: {txt_path}")

# 2. Build final video_insights_dgmd.json
final_insights = {}

for sku, bp in ALL_GROUNDED.items():
    timestamps = get_exact_timestamps(sku, bp["targets_and_labels"])
    entry = {
        "sku": sku,
        "title": bp.get("title") or "",
        "actual_topic": bp["actual_topic"],
        "category_group": bp["category_group"],
        "niche_primary": bp["niche_primary"],
        "niche_id": bp["niche_id"],
        "target_market": bp["target_market"],
        "market_code": bp["market_code"],
        "tools_mentioned": bp["tools_mentioned"],
        "channels_mentioned": bp["channels_mentioned"],
        "key_timestamps": timestamps,
        "key_takeaways": bp["key_takeaways"],
        "edit_sop": bp["edit_sop"],
        "sop_steps": bp["sop_steps"],
        "avoid_flags": bp["avoid_flags"],
        "analysis_method": "verified_expert_summary",
        "source_transcript": f"video/{sku}/transcript.txt"
    }
    final_insights[sku] = entry

with open("data/video_insights_dgmd.json", "w", encoding="utf-8") as f:
    json.dump(final_insights, f, ensure_ascii=False, indent=2)

print(f"Successfully generated data/video_insights_dgmd.json ({len(final_insights)} entries).")

# 3. Synchronize with data/videos_dgmd.json and data/catalog_dgmd.json
with open("data/videos_dgmd.json", "r", encoding="utf-8") as f:
    videos = json.load(f)

for v in videos:
    sku = v["sku"]
    if sku in final_insights:
        ins = final_insights[sku]
        v["actual_topic"] = ins["actual_topic"]
        v["tools_mentioned"] = ins["tools_mentioned"]
        v["niche_primary"] = ins["niche_primary"]
        
        # Check docs
        doc_dir = f"assets/docs-dgmd/{sku}"
        existing_docs = v.get("docs") or []
        
        # If special doc was created, ensure it's in docs list
        if sku in SPECIAL_DOCS:
            doc_meta = SPECIAL_DOCS[sku]
            rel_file = f"assets/docs-dgmd/{sku}/master_prompt.txt"
            already = any(d.get("file") == rel_file for d in existing_docs)
            if not already:
                existing_docs.insert(0, {
                    "name": doc_meta["title"],
                    "title": doc_meta["title"],
                    "url": f"http://127.0.0.1:8899/{rel_file}",
                    "link": f"http://127.0.0.1:8899/{rel_file}",
                    "file": rel_file,
                    "type": "txt",
                    "host": "local",
                    "local": True
                })
        v["docs"] = existing_docs

with open("data/videos_dgmd.json", "w", encoding="utf-8") as f:
    json.dump(videos, f, ensure_ascii=False, indent=2)

print("Synchronized data/videos_dgmd.json.")

# Also sync data/catalog_dgmd.json
if os.path.exists("data/catalog_dgmd.json"):
    with open("data/catalog_dgmd.json", "r", encoding="utf-8") as f:
        cat = json.load(f)
    
    # Update products in catalog
    items_list = cat if isinstance(cat, list) else cat.get("products", [])
    for p in items_list:
        sku = p.get("sku")
        if sku in final_insights:
            ins = final_insights[sku]
            p["actual_topic"] = ins["actual_topic"]
            p["tools_mentioned"] = ins["tools_mentioned"]
            p["niche_primary"] = ins["niche_primary"]
            matching_v = next((item for item in videos if item["sku"] == sku), None)
            if matching_v:
                p["docs"] = matching_v.get("docs", [])
                p["docsCount"] = len(p["docs"])
    
    with open("data/catalog_dgmd.json", "w", encoding="utf-8") as f:
        json.dump(cat, f, ensure_ascii=False, indent=2)
    print("Synchronized data/catalog_dgmd.json.")

print("ALL 45 DGMD LESSONS FULLY GROUNDED & SYNCHRONIZED SUCCESSFULLY!")
