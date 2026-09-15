# QUYẾT ĐỊNH: CHỌN MODEL 9ROUTER LOCAL (:20128) CHO TỪNG CÔNG VIỆC

> **Ngày đo:** 2026-09-16 | **Người đo:** AI (evidence-first, đo thật từng model)
> **Bối cảnh:** VPS `api-9router.tonymmo.com` đang dừng/chậm → chuyển sang 9Router LOCAL `http://127.0.0.1:20128`
> **Bằng chứng thô:** `_archive/20260916-model-benchmark/` (13 thumbnail + kết quả JSON từng call)

---

## I. HIỆN TRẠNG HẠ TẦNG (đo thật)

| Hạ tầng | Trạng thái | Đo được |
|---|---|---|
| 9Router local :20128 | ✅ LIVE (PID 26872, node.exe) | /v1/models trả 569 model trong 10ms |
| VPS api-9router.tonymmo.com | ⚠️ Endpoint sống (307/401) nhưng không có credential | latency mạng ~100-450ms |
| Key truy cập local | `apiKeys` table trong `%APPDATA%\9router\db\data.sqlite` | KHÔNG hardcode vào repo |

**Combo route map thật (đọc từ DB, không đoán):**

| Tên Combo | Route thật tới |
|---|---|
| Combo-Gemini-3.7-flash | `qd/qoder/dfmodel` (Qoder IDE → DeepSeek 4.1 Flash hệ) |
| Combo-Gemini-3.6-flash | `cbai/deepseek-v4.1-flash` |
| Combo-Gemini-3.5-flash | `sn/deepseek-v4-flash` |
| Combo-Gemini-3.1-Pro | `sn/deepseek-v4-pro` |
| Combo-Claude-Sonet-4.6 | `bddevlab/claude-sonnet-5` |
| Combo-Claude-Opus-4.6 | `bddevlab/claude-opus-4.8` |
| Combo-GPT-OSS-120B | `bddevlab/gpt-5.6-terra` |
| Combo-Gemini-3.8-flash | ❌ LỖI: "No active credentials for provider: openai" |

---

## II. BENCHMARK VISION (13 thumbnail: 10 hoạt hình + 3 người thật)

### A. Đơn luồng — độ chính xác + tốc độ (avg over 13 ảnh)

| Model | Đúng | avg total | avg TTFT | Ghi chú |
|---|---|---|---|---|
| `ag/gemini-3.7-flash-high` | 12/13 | 3.84s | 3.44s | Chất lượng cao nhất |
| `ag/gemini-3.7-flash-low` | 12/13 | **2.34s** | 2.25s | Nhanh, ổn định |
| `ag/gemini-3.7-flash-medium` | 12/13 | 2.78s | 2.70s | Trung gian |
| `Combo-Gemini-3.7-flash` | 12/13 | **2.05s** | 1.84s | Nhanh nhất nhóm ổn định |
| `gemini/gemini-3.5-flash-lite` | 12/13 | **1.30s** | 1.17s | Nhanh nhất NHƯNG bị 429 khi concurrent |
| `gh/gpt-4.1` | 12/13 | 1.45s | 1.24s | Không suy nghĩ tự nhiên |
| `ag/gemini-3.8-flash` | 12/13 | 23.27s | 22.98s | ❌ Quá chậm đơn luồng |

*13 ảnh gồm 1 ca ambiguous thật (MKBHD — chỉ có bàn tay, không mặt) → coi là SOFT, không tính FAIL. Ảnh MarkRober hoá ra là hình vẽ minh hoạ (không phải người thật) → mọi model trả CARTOON/MIXED đều ĐÚNG.*

### B. Đa luồng 13 lanes (batch 13 ảnh cùng lúc)

| Model | OK | JSON | WALL | Hiệu dụng | Throughput |
|---|---|---|---|---|---|
| `Combo-Gemini-3.7-flash` | 13/13 | 13/13 | 2.0-6.4s | **0.15-0.50s/ảnh** | 2.0-6.5 img/s |
| `ag/gemini-3.7-flash-low` | 13/13 | 13/13 | 3.9-6.0s | **0.30-0.46s/ảnh** | 2.2-3.4 img/s |
| `ag/gemini-3.7-flash-medium` | 13/13 | 13/13 | 3.8s | 0.29s/ảnh | 3.44 img/s |
| `ag/gemini-3.8-flash-low` | 13/13 | 13/13 | 3.8s | 0.29s/ảnh | 3.42 img/s |
| `gh/gpt-4.1` | 13/13 | 13/13 | 33.6s | 2.58s/ảnh | 0.39 img/s (tail latency) |
| `cbcn/deepseek-v4.1-flash` | 13/13 | 12/13 | 21.8s | 1.68s/ảnh | 0.60 img/s (chập chờn) |
| `cbai/deepseek-v4.1-flash` | 13/13 | 10/13 | 18.9s | 1.46s/ảnh | 0.69 img/s (JSON fail nhiều) |
| `kc/step-3.7-flash:free` | 10/10 | 9/10 | 15.9s | 1.59s/ảnh | Tail chậm |
| `ocg/qwen3.8-flash` | 10/10 | 9/10 | 17.9s | 1.79s/ảnh | Tail chậm |
| `gemini/gemini-3.5-flash-lite` | ❌ 429 | - | - | - | Rate limit ở 4/8/13 lanes |
| `lenec.tech/gemini-2.5-pro` | 13/13 | 13/13 | 17.6s | 1.76s/ảnh | Chậm đều 7-17s/ảnh |

### C. Kiểm chứng ổn định (3 lần lặp, 13 lanes)

- `Combo-Gemini-3.7-flash`: 3/3 lần đạt **13/13 OK** — WALL 2.06s / 2.00s / 6.44s
- `ag/gemini-3.7-flash-low`: 2/2 lần đạt **13/13 OK** — WALL 5.97s / 5.04s

---

## III. TẮT SUY NGHĨ — KẾT QUẢ ĐO THẬT

Test trên `cbcn/deepseek-v4.1-flash` (1 ảnh, RAW-010):

| Cách tắt | Total | JSON | Ghi chú |
|---|---|---|---|
| baseline (không can thiệp) | 16.69s | ❌ FAIL | Reasoning ăn hết token, không ra JSON |
| `reasoning_effort: none` | 2.60s | ✅ OK | Có hiệu lực |
| `reasoning_effort: minimal` | **2.02s** | ✅ OK | Nhanh + hiệu lực |
| `thinking: {type: disabled}` | 2.89s | ✅ OK | Vẫn tốn 227 reasoning tokens (không tắt hẳn) |
| `/no_think` trong prompt | **1.53s** | ✅ OK | ⚡ Nhanh nhất |
| `gh/gpt-4.1` (tự nhiên không think) | 2.98s | ✅ OK | Không cần điều khiển gì |

**Kết luận:** DeepSeek 4.1 trên provider cbcn/cbai **bật suy nghĩ mặc định và không tắt được hoàn toàn** — quan trọng là phải cấp `max_tokens` đủ lớn (≥900) hoặc dùng effort=none/minimal/no_think. Lỗi ERR ở lần đo đầu là do đặt `max_tokens: 400` (reasoning ăn 357 tokens).

---

## IV-B. A/B INTERLEAVED 3 VÒNG (cùng điều kiện, thứ tự đảo chiều) — CHỐT VẤN ĐỀ "AG CÓ PHẢI NHANH NHẤT?"

Đo ngày 16/09 vòng 2, 3 rounds xen kẽ, 13 lanes/round:

| Model | WALL mean | min | max | eff mean | OK |
|---|---|---|---|---|---|
| **`ag/gemini-3.7-flash-low`** | **3.63s** | 3.45s | 3.95s | **0.279s/ảnh** | 39/39 |
| `ag/gemini-3.7-flash-medium` | 4.17s | 2.76s | 5.22s | 0.321s/ảnh | 39/39 |
| `ag/gemini-3.8-flash-low` | 4.91s | 2.85s | 7.06s | 0.378s/ảnh | 39/39 |
| `Combo-Gemini-3.7-flash` | 5.27s | 2.01s | 8.43s | 0.406s/ảnh | 39/39 |

→ **`ag/gemini-3.7-flash-low` thắng về độ ỔN ĐỊNH** (dải 3.45-3.95s, lệch chỉ ±0.25s), nhưng `Combo` có **min nhanh nhất** (2.01s) và biên độ dao động lớn hơn (2.0-8.4s).

### Stress test tìm trần (26 → 52 → 104 lanes)

| Model | 26 lanes | 52 lanes | 104 lanes |
|---|---|---|---|
| `ag/gemini-3.7-flash-low` | 26/26 · 0.168s/ảnh | 52/52 · 0.153s/ảnh | 104/104 · **0.054s/ảnh** |
| `Combo-Gemini-3.7-flash` | 26/26 · 0.154s/ảnh | 52/52 · **0.083s/ảnh** | 104/104 · **0.037s/ảnh** |

**Không tìm thấy trần ở 104 lanes — cả hai đều 100% sạch.** Điểm khác biệt lộ rõ ở tải cao: `Combo` (→qd/dfmodel) vượt trội khi burst lớn (0.037s/ảnh @104), `ag-low` bám ổn định ở mọi mức tải nhưng đuôi chậm dần (0.054s/ảnh @104).

### Cơ chế đằng sau (đọc từ DB, không đoán)
- `ag/` = provider **Antigravity** — có **10 account trong pool** (henyeu247, mducs1244, minahlan10, xaxukeb3/93/04, zingh2781, zongh2782/83, lytutienrv97) → round-robin qua 10 account nên chịu tải song song tốt và ổn định.
- `qd/` = provider **Qoder** — burst rất mạnh nhưng đơn luồng biến động (2-27s trong các test trước).
- `cbcn/cbai` deepseek trực tiếp: JSON-FAIL khi đa luồng (3/13 fail @cbai) → loại khỏi batch.

---

## IV. TỐC ĐỘ SINH VĂN BẢN (script generation)

| Model (routed) | TTFT | Total | Output tok | Reasoning tok | tok/s |
|---|---|---|---|---|---|
| `ag/gemini-3.7-flash-high` (→3.7-tiered) | 6.23s | 10.16s | 1839 | 1657 | **180.9** |
| `Combo-Claude-Opus-4.6` (→claude-opus-4-8) | 2.17s | 17.83s | 1016 | 0 | **57.0** |
| `ag/gemini-3.7-flash-low` | 1.63s | 2.60s | 190 | 0 | 73.0 |
| `gh/gpt-4.1` (→gpt-4.1-2025-04-14) | 2.17s | 7.65s | 184 | 0 | 24.0 |
| `cbcn/deepseek-v4-pro` | 11.16s | 14.49s | 254 | 0 | 17.5 |

---

## V. BẢNG NHẬN ĐỊNH CUỐI: MODEL NÀO CHO VIỆC NÀO

| Công việc | Model đề xuất | Bằng chứng |
|---|---|---|
| **Vision batch hàng loạt — ưu tiên ổn định** | `ag/gemini-3.7-flash-low` | Thắng A/B interleaved (0.279s/ảnh, dải ±0.25s), 39/39 OK; stress 104/104 |
| **Vision batch hàng loạt — burst cực lớn** | `Combo-Gemini-3.7-flash` | 104/104 OK @104 lanes, 0.037s/ảnh khi burst; min nhanh nhất 2.01s |
| **Vision 1 ảnh cần chất lượng cao nhất** | `ag/gemini-3.7-flash-high` | Niche/style chi tiết nhất, 3.84s đơn luồng |
| **Việc text cần NHANH, không suy nghĩ** | `gh/gpt-4.1` hoặc thêm `/no_think` | gpt-4.1 tự nhiên no-think 2.98s; /no_think 1.53s |
| **Sinh script dài, chất lượng top** | `Combo-Claude-Opus-4.6` | 57 tok/s, TTFT 2.17s, chất lượng Opus |
| **Sinh text khối lượng lớn nhanh** | `ag/gemini-3.7-flash-high` | 181 tok/s (cấp max_tokens ≥ 2000) |
| **Tắt suy nghĩ DeepSeek** | `reasoning_effort: minimal` hoặc `/no_think` | Đo được 16.7s → 1.5-2.0s |
| **KHÔNG dùng cho batch** | `gemini/flash-lite` (429), `lenec/2.5-pro` (chậm), `deepseek-v4.1-flash trực tiếp` (tail + JSON fail), `Combo-Gemini-3.8-flash` (lỗi credential) | Đo được ở mục II |

---

## VI. KHUYẾN NGHỊ TRIỂN KHAI

1. **Vision batch 124 kênh × 10 thumbnails (~1.240 ảnh):** dùng `Combo-Gemini-3.7-flash`, 13 lanes song song → ~2-5 phút thay vì 2.2 giờ (ước tính cũ theo 6.4s/ảnh đơn luồng).
2. **Luôn cấp `max_tokens` ≥ 900** cho mọi model reasoning (bài học từ lỗi 400 tokens).
3. **Cơ chế retry:** xử lý 429 (flash-lite) và tail-latency >15s (deepseek) — retry 2 lần, fallback chéo giữa `Combo-Gemini-3.7-flash` ↔ `ag/gemini-3.7-flash-low`.
4. **Tránh phụ thuộc 1 nguồn:** các prefix (qd, cbcn, cbai, ag, gh) là các upstream khác nhau — khi một cái chập chờn thì fallback sang cái khác cùng tier.
5. **VPS:** giữ local làm primary; VPS chỉ là backup (đang dừng credential).

---

## VII. TRIỂN KHAI SẢN XUẤT: FACELESS VISION BATCH v4 (16/09/2026)

Script `scripts/faceless-vision-batch.py` — production-ready cho vận hành dài hạn.

### Cấu hình chốt
| Thành phần | Giá trị | Lý do |
|---|---|---|
| PRIMARY | `ag/gemini-3.7-flash-low` | Thắng A/B interleaved (0.28s/ảnh, dao động ±0.25s) |
| FALLBACK | `Combo-Gemini-3.7-flash` | Burst 104 lanes, 0.037s/ảnh |
| INPUT | 6 thumbnail SẠCH từ RSS (+fallback screenshot) | Screenshot trang kênh gây nhiễu → dao động kết quả (bài học v3) |
| VOTING | 2 vòng bỏ phiếu, lệch → vòng 3 tie-break | Chống hallucination ca biên |
| LANES | 13 | Đo được ổn định 39/39 qua 3 rounds |
| MAX_TOKENS | 900 | 400 gây JSON-FAIL (bài học benchmark) |

### Semantics cấp KÊNH (code suy diễn, không phụ thuộc model)
```
hasRealHumanFace = presenter THẬT lặp lại nhiều thumbnail (talking-head)
isFaceless       = NOT presenter  (hoạt hình / đồ vật / collage người khác / AI-human = faceless)
aiGenerated      = thumbnails do AI tạo
needsReview      = presenter có / confidence thấp / AI lẫn người thật
```

### Kết quả chạy thật (16/09)
- **124/124 OK, 120.6s** · 123 unanimous (99.2%) · 122 faceless / 2 HAS_FACE
- Stability: rerun 10 kênh → verdict đồng nhất
- Checkpoint resume: `.cache/faceless-vision/checkpoint.json` (đứt giữa chừng chạy lại không mất kết quả)
- Backup tự động: `_backup/<ts>-faceless-vision-v4/`

### Lệnh vận hành
```bash
python scripts/faceless-vision-batch.py              # chạy kênh còn thiếu
python scripts/faceless-vision-batch.py --all        # chạy lại toàn bộ
python scripts/faceless-vision-batch.py --ids RAW-001,RAW-010
python scripts/faceless-vision-batch.py --limit 10   # pilot
```
