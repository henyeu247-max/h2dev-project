# Deploy VPS — post-receive hook (H2DEV)

Hook `post-receive` chạy trên VPS sau mỗi `git push vps main`:
1. Sync app về `origin/main`.
2. **GUARD:** `node scripts/sync-counts.js --check` — nếu docs/số liệu **lệch** data live → **CHẶN deploy + ROLLBACK** về commit cũ (DB + PM2 không đổi).
3. Build Master SQLite DB.
4. Reload PM2 `h2dev-learn`.

## Vì sao có GUARD + ROLLBACK?
- `server.js` serve file tĩnh đọc từ **disk mỗi request** → code mới trên disk có hiệu lực **ngay**, không cần PM2 reload. Nếu chỉ `exit 1` mà không rollback, app vẫn lộ code/data lệch → guard vô nghĩa.
- Vì vậy hook lưu `OLD_REV` trước khi `reset --hard`, và `git reset --hard "$OLD_REV"` khi guard fail.

## Cài / cập nhật hook trên VPS
```bash
# Từ máy local (đường dẫn tuyệt đối):
scp scripts/deploy/post-receive root@103.249.201.164:/root/h2dev.git/hooks/post-receive
ssh root@103.249.201.164 "chmod +x /root/h2dev.git/hooks/post-receive && bash -n /root/h2dev.git/hooks/post-receive"
```
> Windows: file phải dùng **LF** (không CRLF) vì là script bash. Kiểm tra: `file scripts/deploy/post-receive`.

## Test hook (không làm hỏng deploy)
```bash
# 1. Tao drift tam: sua data/counts-manifest.json cho lech (vd videos=999)
# 2. git commit + git push vps main  => hook phai in BLOCKED + ROLLBACK
# 3. Verify: app HEAD = commit cu, manifest tren disk dung
# 4. Don: git reset --hard <commit_dung> && git push vps main --force
```

## Lịch sử
- **2026-09-17:** thêm bước GUARD `sync-counts.js --check` + ROLLBACK. Test E2E: push commit lệch → BLOCKED → rollback đúng.

