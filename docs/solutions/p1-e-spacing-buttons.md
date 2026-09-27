# P1-E — Chuẩn hoá SPACING + BỘ NÚT (.h2-btn)

> Ngày: 2026-09-26 · Phạm vi: P1-E (sau P1-D `0156962`)

## 1. Khảo sát thực tế (exhaustive, không dùng danh sách tài liệu — SCAR-024)
| Hạng mục | Trước | Chuẩn |
|---|---|---|
| `.card` padding | **12 tổ hợp**: `p-4`(19), `p-5`(14), `p-4 sm:p-5`(8), `p-3.5`(6), `p-6`(6), `p-5 sm:p-6`(5), `p-3 sm:p-4`(2)... | `p-4 sm:p-5` |
| `.card` margin-bottom | **3 giá trị**: `16px`/`20px`/`24px` | `24px` (`mb-6`) |
| Nút trong card Raw kênh | **4 màu khác nhau**: `bg-rose-950/40`, `bg-gradient-to-r from-blue-900/60 to-indigo-900/60`, `bg-brand-900/30`, `bg-brand-500/20` + **5 tổ hợp padding** (`px-2 py-2`, `px-2.5 py-2`, `px-3 py-1.5`, `px-2.5 py-1.5`, `px-4 py-2.5`) | `.h2-btn` + biến thể |
| CTA màu tím | **2 nút `bg-purple-600`** trùng chức năng + 1 panel `bg-gradient purple→indigo` | `.h2-btn--brand` / token xám |

## 2. Can thiệp kỹ thuật
| File | Thay đổi |
|---|---|
| `assets/h2dev-primitives.css` | thêm `.h2-btn--sm` (size phụ trong card, `min-height:32px`) — bổ sung vào hệ `.h2-btn` đã có |
| `assets/app/tabs/content.js` | thay **3 nút card Raw kênh** (4 màu → `.h2-btn--ghost .h2-btn--sm`); thay **2 CTA tím** → `.h2-btn--brand`/`.h2-btn--ghost .h2-btn--sm`; thay panel gradient tím → `.card` + token; **15 chỗ padding card** → `p-4 sm:p-5`; **9 chỗ `mb-4/mb-5` trên `.card`** → `mb-6` |
| `scripts/gate-p1.js` | thêm luật **[8a]** CTA màu tím + **[8b]** nút tự chế (padding + màu raw) + 2 injection PROBE |
| `scripts/gate-icons.js` | **VÁ LỖI GATE**: `ALLOWED` khớp theo **số dòng cứng** (`content.js:1644`) → dòng trôi sau khi sửa P1-E làm gate **đỏ GIẢ**. Đổi sang khớp theo **nội dung** (`data-badge="..."`). Đã PROBE 2 chiều. |

## 3. Bằng chứng nghiệm thu
### 3.1 Runtime (3 trang × 2 viewport × 9 tab)
```
=== NUT KHONG dung he chuan (h2-btn/btn-*) ===
(21 "kieu nut" con lai deu la component nghiep vu co CSS rieng:
 .tab-btn / .filter-btn / .niche-row / .market-row / .quick-access__button)
=== .card margin-bottom ===
     36  24px          <-- 100% = mb-6, 0 gia tri khac
=== class nut dung (btn*/h2-btn*) ===
    552 btn-press | 286 btn-primary | 144 h2-btn | 144 h2-btn--ghost | 144 h2-btn--sm | 96 btn-open-raw-deep | 30 btn-ghost
Phan tu con class chua "purple": 0
```
- 3 nút card Raw kênh: **cùng 1 class set**, `min-height:32px`, `border-radius:4px`, nền trong suốt — đo được ở cả desktop và mobile.
- Chụp 22 ảnh (11 màn × 2 viewport): **0 console error, 0 page error**.

### 3.2 Gates
```
gate-p1.js            ALL PASS (9 luật) + PROBE 7/7 + phục hồi byte-identical
gate-icons.js         ALL PASS (sau khi vá lỗi khớp số dòng) + PROBE 2 chiều FAIL đúng
gate-typography.js    ALL PASS
gate-shell.js         ALL PASS 6/6
check-ui-classes.js   OK 3/3 trang
```

### 3.3 PROBE gate-icons (chứng minh gate THẬT, không pass im lặng — SCAR-019)
- (a) Đổi marker `data-badge` → `FAIL content.js:1642 [🎬]` ✔
- (b) Tiêm emoji trang trí `🎯` → `FAIL content.js:86 [🎯]` ✔
- Phục hồi **byte-identical** → ALL PASS ✔

## 4. Ghi chú
- Cache-bust giữ `?v=20260924-p40`.
- Ảnh chứng cứ: `_tmp-proof/p1-e-after/` (22 ảnh + ảnh vùng nút).
- `.h2-btn` là hệ **đã có sẵn** trong `h2dev-primitives.css`; P1-E chỉ **mở rộng** (thêm `.h2-btn--sm`) và **di chuyển** các nút ad-hoc về hệ đó — không tạo hệ mới.
