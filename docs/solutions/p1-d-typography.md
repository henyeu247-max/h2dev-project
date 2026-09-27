# P1-D — Chuẩn hoá TYPOGRAPHY (line-height + letter-spacing)

> Ngày: 2026-09-26 · Phạm vi: P1-D (sau P1-F `ae33b2f`)
> Nguyên tắc: **bằng chứng TẤT ĐỊNH ở DOM/khai báo**, pixel chỉ phụ trợ (SCAR-027).

## 1. Nguyên nhân gốc rễ
Thang chuẩn `assets/h2dev-tokens.css`: line-height = `1 / 1.2 / 1.35 / 1.5 / 1.6 / 20px`;
letter-spacing = `0 / -0.02em / 0.02em / 0.04em`.
Runtime trước P1-D có **35 giá trị line-height** và **13 giá trị letter-spacing**, nhiều giá trị ngoài thang.

**Nguồn ẩn quan trọng (không nằm trong CSS dự án):** `assets/tailwind.css` (file BUILD — SCAR-018, cấm sửa) sinh sẵn
`.leading-snug{line-height:1.375}` và `.leading-relaxed{line-height:1.625}` — **cả hai ngoài thang**.
`player.html` **không nạp** `g3-inline.css` (SCAR-023) nên phải khai lại override ở `player.css`.

## 2. Can thiệp kỹ thuật (28 khai báo thay đổi so với HEAD)
| File | Thay đổi |
|---|---|
| `assets/app/g3-inline.css` | thêm `.leading-snug` → `var(--h2-lh-heading,1.35)` (gom `.leading-relaxed` → `var(--h2-lh-prose,1.6)`) |
| `assets/player.css` | khai lại `.leading-snug`/`.leading-relaxed` (vì không nạp g3-inline); `#ptitle` 1.28→1.35 |
| `assets/viddar.css` | `.vd-wordmark` 1.15→1.2; `.stat-value` 1.1→1.2; `.bento-card .stat-value` 1.15→1.2; `.policy-t` 1.55→1.5; `.card-note`/`.hd-stats`/`.policy-card p`/`.nx-card-facts` 1.45→1.5; `.stat-sub`/`.niche-name`/`.badge` 1.4→1.35; `.channel-chip`/`.nx-card-channel-label`/`.market-label`/`.nc-name` `1.3`→`1.35`; `.shortcut-key`/input `/1.4`→`/1.35`; 12 chỗ letter-spacing → 4 bậc chuẩn |
| `assets/learn.css` | `.resume-label` `/1.3`→`/1.35` |
| `assets/h2dev-components-lesson-row.css` | `.row-updated`/`.sec-stats`/`.ltag` `/1.3`→`/1.35` |
| `assets/app/main.js` | 2 chỗ inline `1.75`→`1.6` |
| `scripts/gate-p1.js` | thêm luật [7a] line-height, [7b] letter-spacing + PROBE |

## 3. Bằng chứng nghiệm thu (tất định)
### 3.1 Trên đĩa — `node _tmp-scan-lh.js` (đã dọn, kết quả lưu đây)
```
Tong khai bao line-height: 76  | dung chuan: 76  | LECH: 0
```

### 3.2 Runtime — quét 3 trang × 2 viewport × 9 tab index
```
=== KEP: (fs | lh | ls | class) — TAT CA cac cap dang hien thi ===
So cap duy nhat: 210
Tong phan tu: 12043 | dung thang: 12043 | KHONG: 0
```
Runtime line-height: **29 giá trị → 24 giá trị**, tất cả thuộc `fs × bậc chuẩn`.
letter-spacing: **13 → 9 giá trị**, tất cả quy đổi hợp lệ về 4 bậc.

### 3.3 Gates
```
gate-p1.js            ALL PASS (7 luật) + PROBE 5/5 + phục hồi byte-identical
gate-typography.js    ALL PASS (4 luật)
gate-shell.js         ALL PASS 6/6
gate-icons.js         ALL PASS (7 luật)
check-ui-classes.js   OK 3/3 trang — 0 class thiếu (lần đầu gate này XANH)
```

### 3.4 Đối chiếu khai báo so với HEAD (không phụ thuộc pixel)
`git show HEAD:<file>` vs working tree → **28 khai báo** line-height/letter-spacing đổi số.
**Mọi giá trị rời thang đều đi VỀ thang, không có giá trị nào rời thang mới được thêm vào.**

## 4. Cảnh báo phương pháp (đã ghi SCAR-027)
So ảnh pixel before/after ban đầu báo **45–81% khác** → **báo động giả 100%**, do:
1. Ảnh gốc `after-p37` cao **900px**, bản chụp mới cao **1000px** (đọc header PNG xác nhận).
2. Ảnh gốc `LOCAL_desktop_kichban.png` thực chất chứa **tab Tổng quan** (`157/142/15/14`) — script cũ chụp trước khi tab vẽ xong.
3. `player` khác do **iframe YouTube render/không render** trong headless; chữ `#ptitle`/`#pmeta` giống hệt pixel.

Sau khi sửa viewport về 900: diff `desktop/tongquan` **48% → 1.55%**.
Kết luận: **không có hồi quy layout**; sai số còn lại là do nội dung động + ảnh gốc chụp lỗi.

## 5. Ghi chú
- Cache-bust giữ nguyên `?v=20260924-p40`.
- Backup trước P1: `_backup/20260926-1530-p1-before/`.
- Ảnh chứng cứ: `_tmp-proof/p1-typo-after2/` (22 ảnh), `_tmp-proof/p1-typo-delta/` (ảnh delta 3 panel).
