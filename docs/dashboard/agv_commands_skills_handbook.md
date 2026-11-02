# Trung Tâm Điều Phối Lệnh `/` & Kỹ Năng Đa Nền Tảng v3.2 · SSoT v6.8 & Adaptive Multi-Domain

> [!TIP]
> **Gói lưu trữ & triển khai độc lập (đóng gói chuẩn `index.html` + file định danh như `Sơ đồ vận hành Agent v3.2`):**
> - **File `.ZIP` trong thư mục Downloads:** `C:\Users\SaxukeB\Downloads\Trung tâm Lệnh & Kỹ năng Đa Nền Tảng v3.2 · SSoT v6.8 & Adaptive Multi-Domain.zip`
> - **Thư mục giải nén sẵn trong Downloads:** `C:\Users\SaxukeB\Downloads\Trung tâm Lệnh & Kỹ năng Đa Nền Tảng v3.2 · SSoT v6.8 & Adaptive Multi-Domain\` (gồm `index.html` và `Trung_tam_Lenh_va_Skills_Da_Nen_Tang_v3.2.html`)
> - **Link tải trực tiếp `.ZIP` trên trình duyệt:** `http://127.0.0.1:18765/Trung_tam_Lenh_va_Skills_Da_Nen_Tang_v3.2.zip`
> - **Link xem trực tiếp Web App v3.2:** `http://127.0.0.1:18765/agv_commands_skills_dashboard.html?v=32`

---

## 1. Bảng Quy Đổi Lệnh `/` Tương Đương Giữa Các Nền Tảng (Cross-Platform Rosetta Stone)

| Nhu cầu công việc | Antigravity (`agy` / IDE) | Claude Code (`claude`) | OpenAI Codex (`codex`) | OpenCode (`opencode`) | OMP / Pi (`omp` / `pi`) |
|---|---|---|---|---|---|
| **1. Bật chế độ Lập Kế Hoạch** | `/plan` · `/scout-plan` | `/plan` · `/scout-plan` | `/plan` · `$scout-plan` | `/agents` (Plan) · `/scout-plan` | `/scout-plan` |
| **2. Tư duy sâu / Phản biện kế hoạch** | `/boost` · `/grill-me` | `/grill-me` (Effort High) | `/model` (High) · `$grill-me` | `/grill-me` | `/thinking high` · `/grill-me` |
| **3. Chạy tự hành liên tục (Auto)** | `/auto` · `/goal` | `Shift+Tab` (Auto-Accept) | `/mode` (Full Auto) | Build Auto | Tự động thực thi |
| **4. Đổi Model AI & Mức suy luận** | `/model` | `/model` · `/fast` | `/model` | `/models` (`/model`) | `/model` · `/thinking` |
| **5. Nén gọn lịch sử khi đầy Context** | `/compact` (`/summarize`) | `/compact` | `/compact` | `/compact` (`/summarize`) | `/compact` |
| **6. Kiểm tra Context & Chi phí** | `/context` · `/usage` | `/context` · `/cost` · `/usage` | `/status` | Thanh trạng thái | `/status` |
| **7. Xem thay đổi code (Git Diff)** | `/diff` | `/diff` | `/diff` | Git Diff tích hợp | Git Diff tích hợp |
| **8. Kiểm duyệt code & Quét bảo mật** | `/review-all` · `/audit` · `/security` | `/review` · `/security-review` · `/audit` | `/review` · `$audit` · `$security` | `/audit` · `/security` | `/audit` · `/security` |
| **9. Hoàn tác / Tua ngược bước sửa** | `/rewind` (`/undo`) | `/rewind` | `/fork` / Git | `/undo` · `/redo` | `/tree` · `/fork` |
| **10. Tách nhánh hội thoại thử nghiệm** | `/branch` | `/branch` (`/fork`) | `/fork` | `/session` | `/fork` · `/tree` |
| **11. Khôi phục phiên làm việc cũ** | `/resume` (`/continue`) | `/resume` (`/continue`) | `/resume` | `/resume` (`/sessions`) | `/resume` (`/session`) |
| **12. Bắt đầu phiên mới sạch sẽ** | `/clear` (`/new`, `/reset`) | `/clear` (`/new`, `/reset`) | `/new` (`/clear`) | `/new` (`/clear`) | `/new` (`/clear`) |
| **13. Quản lý & Tải lại Kỹ năng** | `/skills` · `/skills reload` | `/skills` · `/reload-plugins` | `/skills` | Tự nạp `~/.config/opencode/skills` | `/skills` · `/reload` |
| **14. Quản lý kết nối MCP Server** | `/mcp` | `/mcp` | `/mcp` | `/mcp` | `/mcp` |
| **15. Quản lý tiến trình ngầm & Subagents** | `/agents` · `/teamwork` | `/tasks` · `/agents` | `/ps` | `/agents` | `/orchestration` |
| **16. Hỏi nhanh câu phụ không bẩn Context** | `/btw <câu hỏi>` | `/btw <câu hỏi>` | `/fork` | Phiên phụ | `/fork` |
| **17. Khởi tạo hướng dẫn dự án chuẩn** | `/init` · `/project-standard` | `/init` · `/project-standard` | `/init` · `$project-standard` | `/init` · `/project-standard` | `/project-standard` |
| **18. Xuất báo cáo nghiệm thu HTML** | `/visual-report` | `/visual-report` | `$visual-report` | `/visual-report` | `/visual-report` |
| **19. Đồng bộ Luật & 109 Kỹ năng** | `/agents-directive-sync` | `/agents-directive-sync` | `$agents-directive-sync` | `/agents-directive-sync` | `/agents-directive-sync` |
| **20. Chẩn đoán & Sửa phím tắt CLI** | `/doctor` · `/cli-keybindings-repair` | `/doctor` · `/cli-keybindings-repair` | `$cli-keybindings-repair` | `/cli-keybindings-repair` | `/cli-keybindings-repair` |

---

## 2. Quy Chuẩn Kiến Trúc Lệnh `/` & Thứ Tự Ưu Tiên Nạp Kỹ Năng

1. **Cấu trúc 2 cột trên Menu gợi ý `/`:**
   - **Cột trái (`name:` — ID câu lệnh như `/computer-use`, `/context-budget`, `/de-ai-writing`):** Giữ chuẩn `a-z0-9-` không dấu (kebab-case) theo đặc tả `agentskills.io` để gõ lệnh trên CLI/IDE không bị gãy bởi khoảng trắng hoặc bộ gõ.
   - **Cột phải (`description:` — Dòng giải thích bên cạnh tên lệnh):** Chuẩn hóa theo **Dual-Trigger Vietnamese-First** — câu tóm tắt Tiếng Việt súc tích đứng đầu (hiển thị 100% Tiếng Việt trên popup `/`), theo sau là bộ từ khóa kích hoạt đa ngôn ngữ.
2. **Thứ tự ưu tiên nạp Kỹ năng:**
   - `Workspace (.agent/skills/)` > `Global SSoT (~/.agents/source/skills/)` > `Plugin & Built-in`.
