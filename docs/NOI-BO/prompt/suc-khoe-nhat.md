# PROMPT NGÁCH: SỨC KHỎE NHẬT (Senior Health JP)

> **Ngày tạo:** 2026-09-16 · **Nguồn dữ liệu:** kênh mẫu thật trong kho (ngachXanh - Sức khỏe Nhật) + nghiên cứu web YMYL compliance
> **Trạng thái:** READY - có kênh mẫu, chờ production toolkit riêng

## 1. KÊNH MẪU THẬT (từ kho H2DEV)
| Kênh | Vai trò | Ghi chú |
|---|---|---|
| @長生きの秘訣22 | Mẫu chính | Ngách sống khỏe tuổi già Nhật |
| @ほのぼのラジオ1 | Mẫu chính | Radio kể chuyện sức khỏe |
| @みんなの若返りアカデミア | Mẫu phụ | Trẻ hóa |
| @黄金の老年期-x9g | Mẫu phụ | Tuổi vàng |

**SKU liên quan:** VIDEO-35014d, VIDEO-21956b

## 2. ĐẶC ĐIỂM NGÁCH (đo từ kênh mẫu)
- **Đối tượng:** Người Nhật 55+ quan tâm sức khỏe tuổi già
- **Format:** Kể chuyện + lời khuyên sức khỏe, giọng điệu ấm áp, pacing chậm
- **RPM:** Nhóm health JP - cao (advertisers dược phẩm/insurance)
- **Ngôn ngữ:** Tiếng Nhật (ja-JP)

## 3. PROMPT SCRIPT (dựa cấu trúc chuẩn ngành)
```
Bạn là biên kịch kênh YouTube sức khỏe cho người Nhật 55+. Viết kịch bản [X phút] về: [chủ đề].

Cấu trúc bắt buộc:
1. HOOK 0-15s: Câu hỏi đồng cảm về tuổi già (VD: "Bạn có biết vì sao...?")
2. BỐI CẢNH: Vấn đề sức khỏe người già thường gặp
3. GIẢI PHÁP: 3-5 lời khuyên có căn cứ khoa học
4. CHỨNG MINH: Trích dẫn nghiên cứu cụ thể (tên + năm)
5. KẾT: Lời động viên ấm áp + CTA nhẹ (like/subscribe)

Quy tắc:
- Không chẩn đoán bệnh, không kê đơn
- Luôn ghi: "Nội dung giáo dục, không thay thế tư vấn y tế"
- 150-165 từ/phút
- Câu ngắn, từ ngữ dễ hiểu cho người lớn tuổi
```

## 4. COMPLIANCE (từ nghiên cứu YMYL)
- YouTube YMYL policy: nội dung sức khỏe cần độ chính xác cao
- Trích nguồn: PubMed, NIH, WHO, tạp chí y khoa
- Điểm khác biệt an toàn: GIÁO DỤC ≠ TƯ VẤN y tế
- Không quảng cáo thực phẩm chức năng như thuốc chữa bệnh

## 5. VIỆC CẦN LÀM (để FULL coverage)
- [ ] Extract deep profile kênh @長生きの秘訣22 → RAW record mới
- [ ] Sản xuất production_toolkit.json cho ngách này
- [ ] Test 1 video pilot theo prompt trên
