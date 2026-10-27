# HỆ THỐNG HÓA DỮ LIỆU TRI THỨC VĨNH VIỄN (OBSIDIAN VAULT + SQLITE FTS5 PROPERTY GRAPH)

> **Mã tài liệu:** `H2DEV-KG-ARCHITECTURE-2026`  
> **Phạm vi:** Toàn bộ `333 Video` (`148 H2DEV Main Track + 140 Huân Academy + 45 Đại Gia Mang Dép`), `187 Kênh Mẫu`, `34 Công Cụ AI & Sản Xuất`, `31 Chủ Đề Chiến Lược`  
> ** Nguồn nghiên cứu (`/global-discover-deepresearch`):** 309 URL quốc tế (`US, CN, JP, RU, VN`), đúc kết từ `felixtorres/vault-graph`, `Karpathy llm-wiki`, và `sterben-enec/obsidian-semantic-memory`

---

## 1. BÀI TOÁN & KẾT QUẢ NGHIÊN CỨU `/global-discover-deepresearch`

Khi hệ thống đào tạo tăng quy mô lên **333 bài giảng video** (kèm phụ đề từng giây, 333 sổ tay `README.md` chuẩn Gold Standard `>= 4.500 bytes`, 333 `insight.json`, 187 kênh mẫu đối thủ và hàng trăm tài nguyên đính kèm), cả con người lẫn AI Agent đều gặp 3 điểm nghẽn lớn nếu chỉ lưu file JSON/Markdown rời rạc:
1. **Đứt gãy liên kết ngang (Isolated Silos):** Không biết bài giảng `HUAN-V004` của Huân Academy có đang nói cùng công cụ `CapCut`, cùng ngách hay cùng lỗi vi phạm với bài `VIDEO-DD983D` của H2DEV hay `DGMD-V012` của Đại Gia Mang Dép hay không.
2. **Chi phí Token & Độ trễ khi AI Agent tra cứu:** Nếu Agent phải `grep` hoặc đọc tuần tự hàng trăm file Markdown/JSON, chi phí ngữ cảnh tăng gấp **14,8 lần** và tốc độ tìm mối liên hệ ngược (Backlinks) chậm gấp **50,2 lần**.
3. **Thiếu giao diện trực quan hóa mạng lưới tri thức (Visual Graph):** Người dùng cần một bản đồ đồ thị trực quan kiểu **Obsidian Graph View** để nhìn từ nhánh lớn (`Track -> Chủ đề / Công cụ / Kênh mẫu`) xuống nhánh nhỏ (`Từng bài giảng Video -> Sổ tay SOP -> Phụ đề giây thực tế`).

### Giải pháp kiến trúc 3 tầng (Dual-Engine Knowledge Graph):
Kết hợp tinh hoa của **Obsidian Markdown Vault** (dành cho con người & phần mềm Obsidian Desktop) với **SQLite WAL + FTS5 BM25 + Property Graph** (dành cho AI Agent truy xuất `< 2ms`) và **Web Interactive Graph Explorer (`graph.html`)**:

| Tầng kiến trúc | Đường dẫn lưu trữ | Định dạng & Cơ chế | Phục vụ đối tượng |
| :--- | :--- | :--- | :--- |
| **Tầng 1: Obsidian Markdown Vault** | `knowledge-hub/vault/` | `588+` file `.md` chuẩn **YAML Frontmatter** + liên kết hai chiều `[[WikiLinks]]` (`00-MOC/`, `01-Videos/`, `02-Channels/`, `03-Tools/`, `04-Topics/`) | Mở trực tiếp bằng phần mềm **Obsidian Desktop** hoặc đọc trực tiếp trên IDE |
| **Tầng 2: SQLite Property Graph & FTS5** | `data/h2dev_knowledge_graph.db` | Cơ sở dữ liệu **SQLite WAL + `mmap_size`** gồm 4 bảng: `kg_nodes`, `kg_edges`, `kg_backlinks`, và chỉ mục toàn văn `kg_fts` (BM25) | **AI Agent & CLI** truy vấn qua `scripts/kg_query.js` với độ trễ **`< 2ms`** |
| **Tầng 3: Web Interactive Graph UI** | `graph.html` + `assets/app/graph-main.js` + `data/knowledge_graph.json` | Giao diện đồ thị lực hướng tâm (Force-Directed Canvas 60fps, pan/zoom, lọc theo Track/Loại nút, tìm kiếm tức thời, Inspector hiển thị Backlinks 2 chiều & mở thẳng Video Player) | **Boss man & Đội ngũ vận hành** duyệt trực tiếp trên trình duyệt (PC & Mobile) |

---

## 2. CẤU TRÚC THƯ MỤC OBSIDIAN VAULT (`knowledge-hub/vault/`)

Khi mở thư mục `D:\YTB\H2DEV-Project\knowledge-hub\vault` bằng phần mềm **Obsidian** (`Open folder as vault`), toàn bộ hệ sinh thái được phân nhánh từ lớn đến nhỏ:

- **`00-MOC/` (Maps of Content — Bản đồ trung tâm):**
  - `MOC-ROOT.md`: Bản đồ tổng chỉ huy toàn bộ 333 Video và các nhánh tri thức.
  - `MOC-TRACK-H2DEV.md`: Nhánh lớn 148 Video H2DEV Main Track.
  - `MOC-TRACK-HUAN.md`: Nhánh lớn 140 Video Huân Academy.
  - `MOC-TRACK-DGMD.md`: Nhánh lớn 45 Video Đại Gia Mang Dép.
- **`01-Videos/` (333 Nút Bài Giảng Video):**
  - Chia theo 3 thư mục con `h2dev/`, `huan/`, `dgmd/`.
  - Mỗi file `<SKU>.md` chứa YAML Frontmatter (`id`, `sku`, `track`, `seq`, `duration`, `tools`, `topics`, `channels`), liên kết ngược lên `[[MOC-TRACK-...]]`, liên kết ngang tới các công cụ `[[TOOL-...]]`, chủ đề `[[TOPIC-...]]`, kênh mẫu `[[CHAN-...]]`, kèm 5 luận điểm cốt lõi, 5 mốc thời gian chuẩn giây và toàn văn Sổ tay SOP.
- **`02-Channels/` (187 Nút Kênh Mẫu Đối Thủ):**
  - Mỗi kênh mẫu `@handle` là một nút độc lập, tự động gom toàn bộ các bài giảng có phân tích hoặc dẫn chứng kênh đó.
- **`03-Tools/` (34 Nút Công Cụ AI & Sản Xuất):**
  - Tự động liên kết mọi bài giảng thuộc cả 3 khóa (`H2DEV`, `Huân`, `DGMD`) có sử dụng công cụ tương ứng (`CapCut`, `ElevenLabs`, `Midjourney`, `ChatGPT`, `Claude`, `Suno`, `Premiere`, `vidIQ`, v.v.).
- **`04-Topics/` (31 Nút Chủ Đề & Module Chiến Lược):**
  - Liên kết toàn bộ bài giảng cùng chủ đề/module để tra cứu chéo phương pháp của cả 3 giảng viên.

---

## 3. GIAO THỨC CHO AI AGENT TRA CỨU TỨC THỜI (`scripts/kg_query.js`)

AI Agent khi làm việc trong dự án **không cần đọc mò từng file**, mà gọi thẳng công cụ CLI `scripts/kg_query.js` truy vấn trực tiếp vào `data/h2dev_knowledge_graph.db`:

### 3.1. Xem thống kê toàn mạng lưới tri thức
```bash
node scripts/kg_query.js stats
```

### 3.2. Tìm kiếm toàn văn BM25 (FTS5) siêu tốc (`< 2ms`)
```bash
node scripts/kg_query.js search "CapCut"
node scripts/kg_query.js search "RPM"
node scripts/kg_query.js search "reup"
```

### 3.3. Tra cứu 1 Nút & Toàn bộ Liên kết Đi / Liên kết Đến (1-Hop Graph Traversal)
```bash
# Tra cứu 1 video cụ thể cùng mọi công cụ, chủ đề, kênh mẫu liên quan:
node scripts/kg_query.js node "VIDEO-DD983D"
node scripts/kg_query.js node "HUAN-V004"
node scripts/kg_query.js node "DGMD-V001"

# Tra cứu 1 công cụ để xem tất cả bài giảng của cả 3 khóa đang nhắc tới công cụ đó:
node scripts/kg_query.js node "TOOL-capcut"
```

---

## 4. CƠ CHẾ ĐỒNG BỘ TỰ ĐỘNG (REBUILD PIPELINE)

Bất kỳ khi nào có cập nhật ở `docs/<SKU>/README.md`, `video/<SKU>/insight.json`, hoặc `data-tabs/kenh-mau.json`, chỉ cần chạy 1 lệnh duy nhất để tái tạo toàn bộ Obsidian Vault, SQLite FTS5 Database và JSON Đồ thị Web:

```bash
node scripts/build_knowledge_vault_graph.js
```
