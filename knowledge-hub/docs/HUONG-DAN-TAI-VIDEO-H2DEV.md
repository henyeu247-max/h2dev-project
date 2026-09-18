# Hướng dẫn tải video H2DEV — flow public chuẩn

## Kết luận đã kiểm chứng

Không lấy MP4 bằng cách gọi thẳng URL `video.mona-cloud.com` đã lưu trong catalog. Các URL lưu lâu có thể trả trang “misconfigure” hoặc CDN trả 403 ở segment.

Flow đúng của H2DEV hiện tại:

1. Mở `https://h2dev.vn/learn` để nhận cookie public và lấy hai giá trị header `verify-site` / `X-SAAS-USER-ID`.
2. Gọi GraphQL `https://saas-api.mona.academy/graphql` với resolver `getCourseNoCategory(sku)` để lấy player link mới cho từng SKU.
3. Mở player link bằng browser public, giữ `Referer` từ H2DEV.
4. Player gọi `https://video-fpt.mona-cloud.com/api/token/auth`, sau đó CDN cấp HLS playlist và segment. Segment cần header `cookie-hash` do chính player sinh ra.
5. Bắt đủ HLS segment, giải mã AES-128, ghép TS và remux sang MP4.
6. Chạy ffprobe; chỉ sau khi `bytes > 0`, duration khớp metadata và stream đọc được mới thay file đích.

## Quy tắc chống 0-byte

- Không ghi trực tiếp vào `<SKU>.mp4`; tải vào vùng tạm trước.
- Nếu player link rỗng, playlist/key thiếu, segment thiếu hoặc ffprobe lỗi: dừng và giữ nguyên file hiện tại.
- Không tự đoán tên video/CDN, không dùng token cũ, không gửi cookie phiên H2DEV sang CDN.
- File đích chỉ được thay khi đủ segment, giải mã được và kiểm tra cuối thành công.
- Sau khi tải xong, đồng bộ cả `data/catalog_full.json`, `data/catalog.json`, `data-tabs/videos.json` và `manifest_full.csv`.

## Script đồng bộ metadata

Sau khi MP4 đã được tải và kiểm tra, chạy:

```text
node scripts/sync-h2dev-record.cjs VIDEO-3a38f9
```

Script dùng endpoint public đúng, lấy player link mới và đồng bộ kích thước vào bốn nguồn dữ liệu; không cần đăng nhập.

## Kiểm tra pass

```text
node scripts/validate-project.js
node scripts/check-ui-full.js
node scripts/check-ui-structure.js
node scripts/check-broken-refs.js
```

Video mẫu `VIDEO-3a38f9` đã pass flow này: 81/81 segment, 147,537,949 bytes, 1920x1080, 671.467 giây.

---

## Cập nhật 18/09/2026 — Script tải hoàn chỉnh + phân biệt DRM

### Script chính thức

```text
node scripts/fetch_h2dev_video.cjs VIDEO-xxxxxx --quality 1080p --apply
```

Không có `--apply` = chỉ tải vào thư mục tạm (không thay file trong repo).

### 3 bài học đã kiểm chứng thực tế (tránh mất thời gian như lần đầu)

1. **KHÔNG để ffmpeg tự gọi CDN** — ffmpeg thiếu `cookie-hash` + `Referer` → HTTP 403.
2. **KHÔNG tải lại playlist bằng request context** — `wmsAuthSign` gắn **thời điểm phát**;
   request lại sẽ 403. **Phải bắt (intercept) response ngay lúc player đang phát.**
3. **Segment là TS ĐÃ MÃ HOÁ AES-128** (byte đầu khác `0x47`) → phải giải mã trước khi ghép.
   Key 16 byte lấy từ `hls.key`; **IV = số thứ tự segment** (big-endian);
   dùng `openssl enc -d -aes-128-cbc -K <key_hex> -iv <seq_hex>`.

### Phân biệt video tải được / không tải được

| Loại | Dấu hiệu | Xử lý |
|---|---|---|
| **Tải được** | player URL có `protected=False` + segment trong path `/vod/` | Chạy script bình thường |
| **KHÔNG tải được** | `protected=True` + path `/protected/` + DASH MPD có `ContentProtection` (Widevine `edef8ba9` / PlayReady `9a04f079`) | **DRM thật — flow HLS không qua được** |

Đã thử 6 vector với video DRM (`protected=True→False` · bỏ param · `/protected/`→`/vod/` ·
đổi quality · gọi lại GraphQL nhiều lần) — **đều thất bại**. Đây là giới hạn thật của CDN.

### Kết quả đo 18/09/2026

- Quét 136 SKU: **126 `protected=False`** · **6 `protected=True` (DRM)** · 4 ZOOM không có link.
- 6 video DRM: `VIDEO-f59aa7` · `c1bd51` · `806c0c` · `83a28e` · `948336` · `aacc70` (đều 480p).
- **Toàn vẹn 6 video DRM:** chỉ **`VIDEO-f59aa7` hỏng** (audio 31% packet);
  5 video còn lại nguyên vẹn 82–100%.

### Đã tải thành công qua script (kiểm chứng thực tế)

| SKU | Segment | Dung lượng | Chuẩn |
|---|---|---|---|
| VIDEO-61ad94 | 76/76 | 105.7 MB | h264+aac 1280x720, 630.05s |
| VIDEO-73d98a | 68/68 | 112.5 MB | h264+aac 1280x720, 559.86s |
