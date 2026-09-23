# DEPLOY-CACHE.md — Chuẩn Cache Toàn Hệ Thống H2DEV

> Cập nhật: 2026-09-23 · Người chốt: anh (chủ dự án) · Thực thi: em
> Đây là **SSoT** cho mọi việc liên quan cache. Đọc trước khi sửa `server.js`, nginx, hoặc Cloudflare.

---

## 1. KIẾN TRÚC 3 TẦNG CACHE (phải hiểu đủ 3 mới sửa được)

```
Browser  →  Cloudflare Edge  →  nginx (VPS)  →  Node server.js
   (1)           (2)                 (3)              (4)
```

| Tầng | Cache ở đâu | Xoá bằng gì | Ai set header |
|---|---|---|---|
| (1) Browser | Máy người dùng | Ctrl+F5 / bump `?v=` | Đọc `Cache-Control` từ (2) |
| (2) Cloudflare | Edge PoP (SIN) | API purge hoặc Dashboard | **Đọc từ (3), nhưng có thể GHI ĐÈ bằng Browser Cache TTL** |
| (3) nginx `proxy_cache` | `/www/server/nginx/proxy_cache_dir` | `rm -rf` + reload | Lưu NGUYÊN header từ (4) |
| (4) Node `server.js` | RAM `GZIP_CACHE` (chỉ body nén) | restart PM2 | **Nguồn duy nhất SẠCH và CHUẨN** |

---

## 2. CHUẨN HEADER CHÍNH THỨC

| Loại file | `Cache-Control` | Lý do |
|---|---|---|
| `.html` | `no-cache, must-revalidate` | HTML đổi mỗi deploy |
| `.js`, `.css` | `no-cache, must-revalidate` | Có `?v=`; đổi code là thấy ngay |
| `data-tabs/*.json`, `data/*.json` | `public, max-age=120, stale-while-revalidate=600` | Dữ liệu bán tĩnh |
| `.svg`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.ico`, `.woff2`, `.woff`, `.ttf` | `public, max-age=86400, stale-while-revalidate=604800` | Ảnh/font hiếm đổi |

Cơ chế: `no-cache` **KHÔNG** có nghĩa "không lưu" — nghĩa là "lưu nhưng **BẮT BUỘC hỏi lại** origin".
File không đổi → ETag khớp → **304 Not Modified, 0 byte** → vừa tươi vừa nhẹ băng thông.
Tuyệt đối không dùng `no-store` cho JS/CSS (mất lợi ích 304).

---

## 3. NGUYÊN NHÂN GỐC SỰ CỐ 2026-09-23 (đọc để không lặp lại)

**Triệu chứng:** Sau deploy, HTML mới nhưng JS cũ → giao diện lỗi. Header `.js` qua Cloudflare
trả `max-age=14400` bất chấp `server.js` đã set `no-cache`.

**Đã dựng giả thuyết và BÁC BỎ bằng test cô lập (không đoán):**

| # | Giả thuyết | Cách test | Kết quả |
|---|---|---|---|
| H1 | Regex nginx `.*\.(js\|css)?$` nuốt mọi URI | Dựng nginx port riêng | ❌ Bác bỏ |
| H2 | `add_header` con bị nuốt do `add_header` cha | Dựng 3 biến thể | ❌ Bác bỏ |
| H3 | 2 server block trùng `server_name` | `nginx -T` | ❌ Bác bỏ (chỉ 1) |
| H4 | PM2 chạy code cũ | So mtime vs PID start | ❌ Bác bỏ (lệch 1 giây) |
| H5 | Cloudflare ghi đè | So ETag 1:1 | ✅ **Đúng phần ngọn** |
| H6 | **`proxy_cache cache_one` toàn cục giữ entry cũ** | Xoá cache dir → test lại | ✅ **ĐÚNG GỐC** |

**Nguyên nhân gốc THẬT:** `/www/server/nginx/conf/proxy.conf` (được `include` ở block `http`)
bật `proxy_cache cache_one;` cho **MỌI** vhost. Entry cache JS cũ (từ thời `server.js` còn gán
`max-age=86400`) sống sót nhờ `inactive=1d`, và **Cloudflare purge KHÔNG đụng tới nó**.
Vì `gzip_vary on` tách cache key theo `Accept-Encoding`, nên request có AE (gzip) đi MISS lấy bản
đúng, còn request không AE lại HIT bản cũ → **triệu chứng "lúc đúng lúc sai" gây hoang mang**.

**Cách khoá vĩnh viễn:** thêm `proxy_cache off;` vào **6/6 location** proxy của
`/www/server/panel/vhost/nginx/extension/h2dev-learn.tonymmo.com/proxy.conf`.

---

## 4. CHECKLIST DEPLOY (bắt buộc theo thứ tự)

1. **Sửa code** → bump `?v=YYYYMMDD-vXX` cho mọi asset trong HTML.
2. **Commit + push** (`git push origin main` + `git push vps main`).
3. **Reload Node:** hook `post-receive` tự `pm2 reload h2dev-learn`. Kiểm tra `pm2 describe h2dev-learn`.
4. **Reload nginx** nếu có sửa conf: `nginx -t && nginx -s reload`.
5. **Purge Cloudflare** (nếu đổi asset không bump `?v=`):
   `node scripts/cf-purge.js` (bọc API purge, token lấy từ env `CF_TOKEN`).
6. **Đo lại 3 vòng** — xem Mục 5.

---

## 5. KIỂM ĐỊNH 3 VÒNG (bắt buộc trước khi báo hoàn thành)

**Vòng 1 — Node trực tiếp** (`http://127.0.0.1:8899`, trên VPS):
```bash
curl -sI http://127.0.0.1:8899/assets/h2dev-core.js | grep -i cache-control
# Kỳ vọng: no-cache, must-revalidate
```

**Vòng 2 — Qua nginx (bỏ Cloudflare):**
```bash
curl -sI -k --resolve h2dev-learn.tonymmo.com:443:127.0.0.1 \
  https://h2dev-learn.tonymmo.com/assets/h2dev-core.js | grep -i cache-control
# Kỳ vọng: no-cache, must-revalidate
# PHẢI test CẢ 2 KIỂU: không gửi Accept-Encoding VÀ gửi Accept-Encoding: gzip
```

**Vòng 3 — Qua Cloudflare (public, cái người dùng thấy):**
```bash
curl -sI https://h2dev-learn.tonymmo.com/assets/h2dev-core.js | grep -iE 'cache-control|cf-cache-status'
# Kỳ vọng: no-cache, must-revalidate | cf=MISS hoặc REVALIDATED (KHÔNG được HIT với max-age lớn)
```

**Bảng PASS chuẩn (đã đạt 12/12 ngày 2026-09-23):**

| File | Kỳ vọng |
|---|---|
| `.js` | `no-cache, must-revalidate` |
| `.css` | `no-cache, must-revalidate` |
| `.html` | `no-cache, must-revalidate` |
| `data-tabs/*.json` | `max-age=120` |
| `.svg`/`.png`/`.woff2` | `max-age=86400` |
| ETag → `If-None-Match` | HTTP **304**, 0 byte |

---

## 6. CẠM BẪY ĐÃ GẶP (đừng dẫm lại)

1. **Purge Cloudflare xong vẫn sai** → vì còn `proxy_cache` của nginx ở tầng dưới. **Luôn đo qua nginx trước khi đo qua CF.**
2. **"Lúc đúng lúc sai"** → nghi ngay **cache key khác nhau** (do `Vary: Accept-Encoding`, query string, hoặc cookie). Đừng kết luận "bất định" khi chưa test đủ biến.
3. **`curl -I` không gửi `Accept-Encoding`** → luôn test thêm `-H 'Accept-Encoding: gzip'` để phủ đủ 2 nhánh cache.
4. **Thêm `add_header` ở nginx cho `/assets/` là VÔ NGHĨA** → `location ^~ /assets/` chỉ `proxy_pass`, header cuối cùng do Node quyết. Sửa header phải sửa ở `server.js`.
5. **`$` trong regex qua SSH/PowerShell bị nuốt** → viết script `.sh` rồi `scp` lên, đừng nhồi inline.
6. **Token Cloudflare dán trong chat = đã lộ** → rotate sau khi dùng xong.

---

## 7. FILE/ĐƯỜNG DẪN LIÊN QUAN

| Thành phần | Đường dẫn |
|---|---|
| Header quyết định cuối | `server.js` dòng ~133-164 |
| nginx proxy h2dev-learn | `/www/server/panel/vhost/nginx/extension/h2dev-learn.tonymmo.com/proxy.conf` |
| nginx vhost | `/www/server/panel/vhost/nginx/h2dev-learn.tonymmo.com.conf` |
| proxy_cache toàn cục | `/www/server/nginx/conf/proxy.conf` |
| Thư mục proxy cache | `/www/server/nginx/proxy_cache_dir` |
| Backup proxy.conf | `.../proxy.conf.bak-20260923-proxycache` |
| Backup vhost | `/www/server/panel/vhost/nginx/*.conf.bak-20260923-cache` |
