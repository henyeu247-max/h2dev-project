# Đo thực tế 256 kênh mẫu — 2026-10-14

Đo bằng 3 nguồn độc lập cho từng kênh, thêm yt-dlp khi cần. Phân loại chỉ từ bằng chứng; không có số nào ước lượng.

## Kết quả (N/N = 256/256)

| Trạng thái | Số kênh | Ý nghĩa |
|---|---:|---|
| LIVE | 187 | trang kênh 200, id khớp `channel_dossier`, có video |
| DEAD | 59 | trang kênh 404 + `channel_dossier` 404 + yt-dlp 404 |
| EMPTY | 10 | kênh tồn tại, không có tab Videos / 0 video |
| UNRESOLVED | 0 | 5 kênh lần đầu mâu thuẫn (trang kênh không có dữ liệu), đo lại cả 5 đều LIVE |
| **Tổng** | **256** | |

Trước đo: 120 LIVE + 74 chưa gắn cờ + 58 DEAD + 4 EMPTY. Sau đo: `dead:true` = 69 (59 DIE + 10 rỗng), 187 sống.

## Phương pháp

1. `scripts/probe-kenh-mau.py` — mỗi kênh: GET trang kênh (đọc `ytInitialData`: externalId, title, alerts), `youtube_intelligence.channel_dossier` qua MCP Pool :3988, RSS `feeds/videos.xml`, và yt-dlp khi không đồng thuận LIVE hoặc RSS rỗng. Handle dạng `@UC…` được thử thêm bằng `/channel/UC…`.
2. Bằng chứng thô: `_audit/20261014-kenh-mau-probe.jsonl` (261 dòng = 256 kênh + 5 dòng đo lại; dòng sau thắng).
3. `scripts/classify-kenh-mau.py` — luật phân loại (xem đầu file). Không đánh DEAD từ một tín hiệu; lỗi mạng/consent/mâu thuẫn → UNRESOLVED, không đổi dữ liệu.
4. `scripts/apply-kenh-mau-probe.js` — vá đúng các field đã đo trên file hiện tại (giữ thay đổi dở của việc khác, giữ thứ tự khóa, định dạng). Nhật ký before/after: `_audit/20261014-kenh-mau-applied.json`.

## Kiểm chứng bằng trình duyệt thật (độc lập với script)

- **15/15 kênh đổi trạng thái** mở trong trình duyệt: khớp phân loại.
- **8/8 kênh mẫu ngẫu nhiên không đổi** (seed 20261014, 4 LIVE + 4 DEAD): khớp.
- 5 kênh đo lại: `@노년의마음` mở được, có video.

## 15 kênh đổi trạng thái

| Handle | Trước | Sau | Căn cứ |
|---|---|---|---|
| `@EricBennettMD` | EMPTY | LIVE | http200+dossier khop id; rss=0; ytdlp=video |
| `@LamNgo-qz3bw` | LIVE | DEAD | http404 + dossier404 + ytdlp404 |
| `@BàiHọcTuổiGià-VN` | EMPTY | LIVE | http200+dossier khop id; rss=15; ytdlp=None |
| `@Tieulongreview2026` | LIVE? | EMPTY | http200+dossier khop id; rss=0; ytdlp=empty; videoCount=Unknown |
| `@UCeVwhrEnYjCNdaDr47x4dSw` | DEAD | LIVE | theo ID /channel/UCeVwhrEnYjCNdaDr47x4dSw: http200; rss=15; ytdlp=video; handle luu @UC... khon |
| `@UCEGZ_eUt6HeseHScQEcqTxw` | DEAD | LIVE | theo ID /channel/UCEGZ_eUt6HeseHScQEcqTxw: http200; rss=7; ytdlp=video; handle luu @UC... khong |
| `@KhámPháTrungHoa-HT` | LIVE | EMPTY | http200+dossier khop id; rss=0; ytdlp=empty; videoCount=Unknown |
| `@성실한경제학` | LIVE | EMPTY | http200+dossier khop id; rss=0; ytdlp=empty; videoCount=Unknown |
| `@LangThangHaNoi` | LIVE | EMPTY | http200+dossier khop id; rss=0; ytdlp=empty; videoCount=Unknown |
| `@부를부르는말씀` | LIVE? | DEAD | http404 + dossier404 + ytdlp404 |
| `@튼튼라디오` | LIVE | EMPTY | http200+dossier khop id; rss=0; ytdlp=empty; videoCount=Unknown |
| `@시니어톡톡2025` | LIVE | EMPTY | http200+dossier khop id; rss=0; ytdlp=empty; videoCount=Unknown |
| `@금빛노` | LIVE | EMPTY | http200+dossier khop id; rss=0; ytdlp=empty; videoCount=Unknown |
| `@다시_청춘` | LIVE | DEAD | http404 + dossier404 + ytdlp404 |
| `@노을꽃길` | LIVE | EMPTY | http200+dossier khop id; rss=0; ytdlp=empty; videoCount=Unknown |

`LIVE?` = chưa gắn cờ `dead` (giao diện coi là sống).

## Đã cập nhật theo kết quả đo (sau khi anh duyệt)

Cả 4 handle mới đều đã đo lại: trang kênh 200, id khớp, `channel_dossier` khớp.

- **2 kênh lưu handle dạng channel ID** (YouTube trả 404): `handle`/`url` đổi sang handle thật, handle cũ giữ ở `handle_cu`, thêm `channelId`.
  - `@UCeVwhrEnYjCNdaDr47x4dSw` → `@TheLifeOutline`
  - `@UCEGZ_eUt6HeseHScQEcqTxw` → `@Core_Sight`
- **2 kênh đổi handle** (handle cũ vẫn mở đúng kênh, id khớp): **giữ `handle`** vì `data/catalog.json` (dữ liệu gốc của bài học) và `ngach-xanh.json` nối với `kenh-mau.json` bằng handle cũ; đổi sẽ gãy liên kết. Thêm `handle_hien_tai` và `channelId`.
  - `@PHONGTHUYTIEMTANG` → hiện tại `@sckhaivinh686`
  - `@지혜로운위로와명상` → hiện tại `@연꽃향기트로트`
- **DB `competitor_channels`**: đã đồng bộ 237 hàng (781 ô: handle/title/channel_id/channel_url của 2 kênh `@UC…`, `ypp_status`, `is_monetized`, `channel_lifecycle_json`, `handle_history_json`, `latest_upload_date`). Không dựng lại cả DB vì bản dựng lại làm mất `avatar_url`/`local_avatar_path` mặc định của 20 hàng; chỉ chép đúng các cột bắt nguồn từ `kenh-mau.json`. `integrity_check` ok, số hàng không đổi (386). Bản sao lưu trước khi sửa: `_backup/20261014-kenh-do/h2dev_master.pre.db`.
- Lưu ý: DB chỉ có 2 trạng thái (`ACTIVE`/`DEAD_404`) nên kênh rỗng (EMPTY) ghi là `DEAD_404`, giống cách 4 kênh rỗng cũ đã được ghi trước đây.

## Giới hạn

- `subscribers`/`videoCount` của `channel_dossier` là chữ YouTube làm tròn theo ngôn ngữ ("21,2 N" = 21,2 nghìn), nên em lưu trong bằng chứng chứ không ghi vào `kenh-mau.json` (trường `subscribers` ở đó là chuỗi "Tham khảo" và giao diện ép kiểu số).
- Trạng thái đo tại thời điểm 2026-10-14; kênh có thể đổi sau đó.
- 1 kênh `channel_dossier` lỗi tool (không phải 404) nhưng 3 nguồn còn lại đồng thuận LIVE.
