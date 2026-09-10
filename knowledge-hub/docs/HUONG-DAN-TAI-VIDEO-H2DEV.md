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
