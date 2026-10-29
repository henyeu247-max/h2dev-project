// H2DEV Project - SINGLE SOURCE COUNT SYNC (sync-counts.js)
// Thay viec HARDCODE so lieu (136/152/165/156...) rai rac khap du an.
//   1. Nguon chan ly = data-tabs/*.json (live) -> scripts/lib/counts.js
//   2. data/counts-manifest.json = ban CHOT so lieu (commit git)
//   3. Docs (AGENTS/TREE/README) cap nhat TU DONG tu manifest.
// Cach dung:
//   node scripts/sync-counts.js             -> ghi manifest + cap nhat docs
//   node scripts/sync-counts.js --check      -> chi bao drift (exit 1 neu lech)
//   node scripts/sync-counts.js --docs-only  -> chi cap nhat docs
// Nguyen tac: KHONG dung toi so lieu LICH SU (snapshot cu). Moi rule phai neo
// ngu canh du manh de chi sua so hien hanh.
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, buildManifest } = require('./lib/counts');

const MANIFEST_PATH = path.join(ROOT, 'data', 'counts-manifest.json');

function countVideoDocsFile(fileName) {
  let count = 0;
  const start = path.join(ROOT, 'docs');
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === fileName) count++;
    }
  }
  for (const entry of fs.readdirSync(start, { withFileTypes: true })) {
    if (entry.isDirectory() && /^VIDEO-/.test(entry.name)) walk(path.join(start, entry.name));
  }
  return count;
}

// Rule cap nhat docs: {file, pattern (RegExp), build(counts) -> string}
// Moi pattern neo ngu canh du manh; chi khop so HIEN HANH, khong khop snapshot cu.
const DOC_RULES = [
  // AGENTS.md: ngan, khong chua so lieu (so lieu o data/counts-manifest.json) -> khong con rule.

  // ---- TREE.md ----
  { file: 'TREE.md', pattern: /(catalog\.json\s+# )\d+( record \(projection gốc\))/g,
    build: c => `$1${c.catalogRecords}$2` },
  { file: 'TREE.md', pattern: /(catalog_full\.json\s+# )\d+( record \(projection đầy đủ\))/g,
    build: c => `$1${c.catalogFullRecords}$2` },
  { file: 'TREE.md', pattern: /(videos\.json\s+# )\d+( SKU \()\d+ free · \d+ pro — gồm \d+ Zoom free(\))/g,
    build: c => `$1${c.videos}$2${c.videoFree} free · ${c.videoPro} pro — gồm ${c.zoomSessions} Zoom free$3` },
  // docs/VIDEO-* : đếm file thật, không suy ra README/description từ số thư mục.
  { file: 'TREE.md', pattern: /(VIDEO-\*\\\s+# )\d+( README\.md · )\d+( description\.html \(đếm đệ quy hiện trạng\))/g,
    build: () => `$1${countVideoDocsFile('README.md')}$2${countVideoDocsFile('description.html')}$3` },
  // raw-kenh-goc: so anh + so record thieu anh
  { file: 'TREE.md', pattern: /(raw-kenh-goc\\\s+# )\d+( ảnh raw canonical \+ metadata \()\d+( record: )\d+( kênh chưa có ảnh chụp\))/g,
    build: c => `$1${c.rawChannelImages}$2${c.canonicalRaw}$3${c.rawRecordsWithoutImage}$4` },
  { file: 'TREE.md', pattern: /(kenh-mau\.json          # )\d+( kênh \()\d+( sống · )\d+( dead ẩn\) · ngay_do )\d+\/\d+( \(đo thực tế: )\d+( sống · )\d+( DIE 404 · )\d+( rỗng\))/g,
    build: c => `$1${c.channels}$2${c.liveChannels}$3${c.deadChannels}$4${c.channelsWithNgayDo}/${c.channels}$5${c.liveChannels}$6${c.deadChannelsGone}$7${c.deadChannelsEmpty}$8` },
  { file: 'TREE.md', pattern: /(tai-lieu-full\.json     # )\d+( card \(kind: prompt )\d+( · report )\d+( · tool )\d+( · list )\d+( · other )\d+( · internal-doc )\d+/g,
    build: c => `$1${c.documents}$2${c.docKindPrompt}$3${c.docKindReport}$4${c.docKindTool}$5${c.docKindList}$6${c.docKindOther}$7${c.docKindInternalDoc}` },
  { file: 'TREE.md', pattern: /(tai-lieu-full\.json     # \d+ card \(kind: [^\r\n]*?· internal-doc \d+ · sop )\d+( · guide )\d+( · transcript )\d+( · sheet )\d+( · )\d+( chưa gán\))/g,
    build: c => `$1${c.docKindSop}$2${c.docKindGuide}$3${c.docKindTranscript}$4${c.docKindSheet}$5${c.docKindUncategorized}$6` },
  { file: 'TREE.md', pattern: /(nguon-reup\.json        # )\d+/g,
    build: c => `$1${c.nguonReup}` },
  { file: 'TREE.md', pattern: /(ngach-xanh\.json        # )\d+( ngách \(xanh:true )\d+( · CÓ MẪU TĂNG )\d+( · CHƯA ĐỦ BC )\d+( · THẬN TRỌNG )\d+( · CÓ ĐK )\d+(\))/g,
    build: c => `$1${c.niches}$2${c.nichesGreenTrue}$3${c.nichesCoMauTang}$4${c.nichesChuaDuBc}$5${c.nichesThanTrong}$6${c.nichesCoDk}$7` },
  { file: 'TREE.md', pattern: /(chien-luoc\.json        # workflow )\d+( bước · 4 nguyên tắc · 12 bước Checklist trước khi đăng · Ma trận )\d+( bài học)/g,
    build: c => `$1${c.chienLuocSteps}$2${c.videos}$3` },
  { file: 'TREE.md', pattern: /(kich-ban\.json          # )\d+( — extract)/g,
    build: c => `$1${c.kichBan}$2` },
  { file: 'TREE.md', pattern: /(raw-kenh-mau\.json      # )\d+( record canonical \()\d+( kênh unique · )\d+( bản ghi trùng channel\) · OCR 83 · Vision )\d+\/\d+/g,
    build: c => `$1${c.canonicalRaw}$2${c.canonicalRawUniqueChannels}$3${c.canonicalRaw - c.canonicalRawUniqueChannels}$4${c.canonicalRaw}/${c.canonicalRaw}` },
  { file: 'TREE.md', pattern: /(thumbs\\                # )\d+\/\d+( khớp videos\.json \+ 140 HUAN \+ placeholder\.svg \()\d+( files\))/g,
    build: c => `$1${c.videos}/${c.videos}$2${c.thumbFiles}$3` },
  { file: 'TREE.md', pattern: /(video\\\s+# )\d+( thư mục: )\d+( VIDEO-<sku>\\<sku>\.mp4 \+ )\d+( ZOOM-<slug>\\<slug>\.webm \(~)[\d.]+( GiB \/ )[\d.]+( GB\))/g,
    build: c => `$1${c.videoDirs}$2${c.videoDirs - c.zoomSessions}$3${c.zoomSessions}$4${(c.mediaBytes / 1073741824).toFixed(2)}$5${(c.mediaBytes / 1e9).toFixed(2)}$6` },

  // ---- 00_README.md ----
  { file: '00_README.md', pattern: /(kho học H2DEV \()\d+( bài: )\d+( video \+ )\d+( buổi Zoom\))/g,
    build: c => `$1${c.videos}$2${c.videoLessons}$3${c.zoomSessions}$4` },
  // docs/ (tong + VIDEO-* + ZOOM-*) tren dong "Tai san"
  { file: '00_README.md', pattern: /(`docs\/` )\d+( thư mục \()\d+( `VIDEO-\*` \+ )\d+( `ZOOM-\*`)/g,
    build: c => `$1${c.docsTotalDirs}$2${c.docsVideoDirs}$3${c.docsZoomDirs}$4` },
  { file: '00_README.md', pattern: /(Video — )\d+( SKU)/g,
    build: c => `$1${c.videos}$2` },
  { file: '00_README.md', pattern: /(Kênh mẫu — )\d+/g,
    build: c => `$1${c.channels}` },
  { file: '00_README.md', pattern: /(Raw kênh — )\d+( record canonical \()\d+( kênh unique · )\d+( bản ghi trùng\))/g,
    build: c => `$1${c.canonicalRaw}$2${c.canonicalRawUniqueChannels}$3${c.canonicalRaw - c.canonicalRawUniqueChannels}$4` },
  { file: '00_README.md', pattern: /(\*\*)\d+( bài học\*\* · ~)[\d.]+( GB \()[\d.]+( GiB\) · ffprobe \*\*)\d+(\/)\d+(\*\* có hình \+ audio \(0 file 0 byte\) · )\d+( free · )\d+( pro)/g,
    build: c => `$1${c.videos}$2${(c.mediaBytes / 1e9).toFixed(2)}$3${(c.mediaBytes / 1073741824).toFixed(2)}$4${c.mediaFiles}$5${c.mediaFiles}$6${c.videoFree}$7${c.videoPro}$8` },
  { file: '00_README.md', pattern: /(\*\*)\d+( tài liệu\*\*: theo `kind` \(100% đã phân loại\) prompt )\d+( · report )\d+( · tool )\d+( · list )\d+( · other )\d+( · internal-doc )\d+/g,
    build: c => `$1${c.documents}$2${c.docKindPrompt}$3${c.docKindReport}$4${c.docKindTool}$5${c.docKindList}$6${c.docKindOther}$7${c.docKindInternalDoc}` },
  { file: '00_README.md', pattern: /(\*\*\d+ tài liệu\*\*: theo `kind` [^\r\n]*?· internal-doc \d+ · sop )\d+( · guide )\d+( · transcript )\d+( · sheet )\d+( · )\d+( chưa gán `kind`)/g,
    build: c => `$1${c.docKindSop}$2${c.docKindGuide}$3${c.docKindTranscript}$4${c.docKindSheet}$5${c.docKindUncategorized}$6` },
  { file: '00_README.md', pattern: /(\*\*)\d+( kênh mẫu\*\* \()\d+( sống · )\d+( dead 404 đã ẩn\) · `ngay_do` )\d+\/\d+( \(đo thực tế cả )\d+( kênh: )\d+( sống · )\d+( DIE 404 · )\d+( kênh rỗng 0 video)/g,
    build: c => `$1${c.channels}$2${c.liveChannels}$3${c.deadChannels}$4${c.channelsWithNgayDo}/${c.channels}$5${c.channels}$6${c.liveChannels}$7${c.deadChannelsGone}$8${c.deadChannelsEmpty}$9` },
  { file: '00_README.md', pattern: /(\*\*)\d+( ngách\*\* \+ 5 khối meta \(tab Ngách xanh\) — `xanh:true` )\d+( · CÓ MẪU TĂNG )\d+( · CHƯA ĐỦ BẰNG CHỨNG )\d+( · THẬN TRỌNG )\d+( · CÓ ĐK )\d+/g,
    build: c => `$1${c.niches}$2${c.nichesGreenTrue}$3${c.nichesCoMauTang}$4${c.nichesChuaDuBc}$5${c.nichesThanTrong}$6${c.nichesCoDk}` },
  { file: '00_README.md', pattern: /(`assets\/thumbs\/` )\d+(\/)\d+( khớp)/g,
    build: c => `$1${c.videos}$2${c.videos}$3` },
  { file: '00_README.md', pattern: /(Raw kênh: )\d+( record canonical \()\d+( kênh unique · )\d+( bản ghi trùng channel\))/g,
    build: c => `$1${c.canonicalRaw}$2${c.canonicalRawUniqueChannels}$3${c.canonicalRaw - c.canonicalRawUniqueChannels}$4` },

  // ---- knowledge-hub/docs/MEMORY.md (CHI dong "learning records" hien hanh,
  //      KHONG dung toi snapshot lich su 21/08 co dang "- 129 video · 161 kenh") ----
  { file: 'knowledge-hub/docs/MEMORY.md',
    pattern: /(- )\d+( learning records \()\d+( video \+ )\d+( Zoom; )\d+( free · )\d+( pro\) · )\d+( tài liệu · )\d+( kênh \()\d+( live · )\d+ dead/g,
    build: c => `$1${c.videos}$2${c.videoLessons}$3${c.zoomSessions}$4${c.videoFree}$5${c.videoPro}$6${c.documents}$7${c.channels}$8${c.liveChannels}$9${c.deadChannels} dead` },
  { file: 'knowledge-hub/docs/MEMORY.md',
    pattern: /(learning records [^\r\n]*?live · \d+ dead: )\d+( DIE 404 \+ )\d+( rỗng; `ngay_do` )\d+\/\d+(\) · )\d+( ngách \()\d+( `xanh:true`\) · )\d+( kịch bản · )\d+( nguồn reup)/g,
    build: c => `$1${c.deadChannelsGone}$2${c.deadChannelsEmpty}$3${c.channelsWithNgayDo}/${c.channels}$4${c.niches}$5${c.nichesGreenTrue}$6${c.kichBan}$7${c.nguonReup}$8` },
  { file: 'knowledge-hub/docs/MEMORY.md',
    pattern: /(`assets\/thumbs\/` )\d+\/\d+( khớp SKU H2DEV \(tổng )\d+( files\))/g,
    build: c => `$1${c.videos}/${c.videos}$2${c.thumbFiles}$3` },
  { file: 'knowledge-hub/docs/MEMORY.md',
    pattern: /(Raw channel: )\d+( record canonical \()\d+( kênh unique\))/g,
    build: c => `$1${c.canonicalRaw}$2${c.canonicalRawUniqueChannels}$3` },

  // ---- docs/NOI-BO/zoom/README.md ----
  { file: 'docs/NOI-BO/zoom/README.md', pattern: /(bổ sung cho kho )\d+( video bài giảng PRO)/g,
    build: c => `$1${c.videoLessons}$2` },
  { file: 'docs/NOI-BO/zoom/README.md', pattern: /(\[Ngách xanh \()\d+( ngách\)\])/g,
    build: c => `$1${c.niches}$2` },
  { file: 'docs/NOI-BO/zoom/README.md', pattern: /(\[Chiến lược \(workflow )\d+( bước\)\])/g,
    build: c => `$1${c.chienLuocSteps}$2` },

  // ---- knowledge-hub/docs/RULE-LAM-VIEC.md ----
  { file: 'knowledge-hub/docs/RULE-LAM-VIEC.md', pattern: /(Catalog )\d+( bài học \()\d+( video bài giảng \+ )\d+( buổi Zoom\) kèm phụ đề sạch)/g,
    build: c => `$1${c.videos}$2${c.videoLessons}$3${c.zoomSessions}$4` },
  { file: 'knowledge-hub/docs/RULE-LAM-VIEC.md', pattern: /(Kho )\d+( tài liệu & Master Prompts)/g,
    build: c => `$1${c.documents}$2` },
  { file: 'knowledge-hub/docs/RULE-LAM-VIEC.md', pattern: /(\d+)( hồ sơ kênh mẫu bao quát )\d+( ngách nghiệp vụ)/g,
    build: c => `${c.canonicalRaw}$2${c.niches}$3` },
  { file: 'knowledge-hub/docs/RULE-LAM-VIEC.md', pattern: /(\*\*Luồng B — Sức sống ngách & tình báo đối thủ:\*\* )\d+( ngách)/g,
    build: c => `$1${c.niches}$2` },
  { file: 'knowledge-hub/docs/RULE-LAM-VIEC.md', pattern: /(Masterclass Zoom chuyên gia \(quy trình xây kênh )\d+( bước, nuôi proxy IPv4\/Gmail)/g,
    build: c => `$1${c.chienLuocSteps}$2` },


  // ---- data-tabs/ngach-xanh.json ----
  { file: 'data-tabs/ngach-xanh.json', pattern: /("phamViKho":\s*\{[^}]*?"taiLieu":\s*)\d+/g,
    build: c => `$1${c.documents}` },
  { file: 'data-tabs/ngach-xanh.json', pattern: /("phamViKho":\s*\{[^}]*?"kenhMau":\s*)\d+/g,
    build: c => `$1${c.channels}` },
  { file: 'data-tabs/ngach-xanh.json', pattern: /("phamViKho":\s*\{[^}]*?"kenhDaDoSong":\s*)\d+/g,
    build: c => `$1${c.channels}` },
  // 2026-09-30: kenhDead/LiveTrongFile truoc day KHONG co rule -> troi 13/152 trong khi thuc te 39/126
  // (validate-project bao 2 loi). Sinh tu counts nhu cac so khac (SCAR-012: cam so viet tay).
  { file: 'data-tabs/ngach-xanh.json', pattern: /("phamViKho":\s*\{[^}]*?"kenhDeadTrongFile":\s*)\d+/g,
    build: c => `$1${c.deadChannels}` },
  { file: 'data-tabs/ngach-xanh.json', pattern: /("phamViKho":\s*\{[^}]*?"kenhLiveTrongFile":\s*)\d+/g,
    build: c => `$1${c.liveChannels}` },
  { file: 'data-tabs/ngach-xanh.json', pattern: /("phamVi":\s*")\d+(\/)\d+( record \(H01\.\.H40\)\.)/g,
    build: c => `$1${c.niches}$2${c.niches}$3` },
  { file: 'data-tabs/ngach-xanh.json', pattern: /(\(148 H2DEV \+ 140 Huân \+ 45 Đạt GMD\), )\d+( tài liệu SOP\/Master Prompts, )\d+( kênh mẫu \()\d+( live · )\d+( dead\) và 347\/347 kênh trong intelligence\.db)/g,
    build: c => `$1${c.documents}$2${c.channels}$3${c.liveChannels}$4${c.deadChannels}$5` },
  { file: 'data-tabs/ngach-xanh.json', pattern: /("ghiChu":\s*"Hệ thống 97yo-dev \(3 nhánh: 148 H2DEV · 140 Huân Academy · 45 DGMD = 333 bài học; )\d+( tài liệu catalog \+ 1\.409 tài liệu đính kèm 3 nhánh \[499 H2DEV · 750 Huân · 160 DGMD\]; )\d+( kênh mẫu gồm )\d+( live · )\d+( dead; )\d+( hồ sơ raw kênh\)\.)/g,
    build: c => `$1${c.documents}$2${c.channels}$3${c.liveChannels}$4${c.deadChannels}$5${c.canonicalRaw}$6` },
  { file: 'data-tabs/ngach-xanh.json', pattern: /(\[BẰNG CHỨNG THỰC NGHIỆM TỪ )\d+( KÊNH DEAD & 4 HỒ SƠ TERMINATED TRONG KHO 97YO-DEV\] — Đối soát thực nghiệm trên )\d+( kênh mẫu \()\d+( live · )\d+( dead: )\d+( kênh 404 gone, )\d+( kênh xóa trắng video empty wipe; trong đó 16 kênh gắn cờ DEAD_TERMINATED\))/g,
    build: c => `$1${c.deadChannels}$2${c.channels}$3${c.liveChannels}$4${c.deadChannels}$5${c.deadChannelsGone}$6${c.deadChannelsEmpty}$7` },
  { file: 'data-tabs/chien-luoc.json', pattern: /(Đề cương & SOP )\d+( bước thực chiến toàn diện trên hệ thống 97yo-dev\)\. Tổng hợp và đối soát từ 333 video bài học toàn hệ thống \()\d+( H2DEV \[)\d+( video \+ )\d+( Zoom\] · 140 Huân Academy · 45 DGMD\), )\d+( tài liệu SOP catalog)/g,
    build: c => `$1${c.chienLuocSteps}$2${c.videos}$3${c.videoLessons}$4${c.zoomSessions}$5${c.documents}$6` },
  { file: 'data-tabs/chien-luoc.json', pattern: /(\(\+1\.409 tài liệu đính kèm 3 nhánh\), )\d+( Ngách trụ cột × 120 Vi Ngách \(Micro-Niches\), )[\d.]+( kênh mẫu \()\d+( live · )\d+( dead\) và 19 H2DEV Specialized Agent Skills\.)/g,
    build: c => `$1${c.niches}$2${String(c.channels).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}$3${c.liveChannels}$4${c.deadChannels}$5` },
  { file: 'data-tabs/chien-luoc.json', pattern: /("nguonDuLieu":\s*"Hệ thống 97yo-dev: 333 bài học \()\d+( H2DEV \[)\d+( video bài giảng \+ )\d+( buổi Zoom\] \+ 140 Huân Academy \+ 45 DGMD\) \+ )\d+( tài liệu SOP catalog)/g,
    build: c => `$1${c.videos}$2${c.videoLessons}$3${c.zoomSessions}$4${c.documents}$5` },
  { file: 'data-tabs/chien-luoc.json', pattern: /(tài liệu SOP catalog \+ )\d+( Ngách trụ cột × 120 Vi Ngách \+ )[\d.]+( kênh mẫu \()\d+( live · )\d+( dead\) \+ )\d+( hồ sơ raw kênh \()\d+( kênh độc nhất\) \+ )\d+( nguồn tư liệu gốc & 19 H2DEV Specialized Skills\.)/g,
    build: c => `$1${c.niches}$2${String(c.channels).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}$3${c.liveChannels}$4${c.deadChannels}$5${c.canonicalRaw}$6${c.canonicalRawUniqueChannels}$7${c.nguonReup}$8` },
  { file: 'data-tabs/chien-luoc.json', pattern: /(Khai thác cơ sở dữ liệu )\d+( hồ sơ Raw kênh \()\d+( kênh độc nhất\) và )\d+( đối thủ mẫu \()\d+( kênh live · )\d+( case study DIE\)\.)/g,
    build: c => `$1${c.canonicalRaw}$2${c.canonicalRawUniqueChannels}$3${c.channels}$4${c.liveChannels}$5${c.deadChannels}$6` },
  { file: 'data-tabs/chien-luoc.json', pattern: /("title":\s*"Giải Mã )\d+( Kênh Chết \(Case Study DIE 404 & Empty Wipe\) & Thiết Lập Rào Chắn YMYL")/g,
    build: c => `$1${c.deadChannels}$2` },
  { file: 'data-tabs/chien-luoc.json', pattern: /(Học từ thất bại: mổ xẻ )\d+( kênh đối thủ bị YouTube trảm hoặc xóa trắng)/g,
    build: c => `$1${c.deadChannels}$2` },
  { file: 'data-tabs/chien-luoc.json', pattern: /("tabLabel":\s*"Kho )\d+( Nguồn Reup")/g,
    build: c => `$1${c.nguonReup}$2` },
  { file: 'data-tabs/dong-bo-ngoai.json', pattern: /(\(333 bài học · 3 nhánh: 148 H2DEV \+ 140 Huân \+ 45 DGMD · )\d+( tài liệu catalog · )[\d.]+( kênh mẫu: )\d+( live \+ )\d+( dead · )\d+( raw kênh · )\d+( Ngách trụ cột)/g,
    build: c => `$1${c.documents}$2${String(c.channels).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}$3${c.liveChannels}$4${c.deadChannels}$5${c.canonicalRaw}$6${c.niches}$7` },
  { file: 'data-tabs/dong-bo-ngoai.json', pattern: /(WeChat Vault và )\d+( Master Prompts\.)/g,
    build: c => `$1${c.masterPrompts}$2` },

  // ---- docs/WORKING_STATE.md (Tang 4 Live State) ----
  // 2026-09-30: truoc day KHONG co rule -> file ghi "152 live · 13 dead" trong khi that 126/39,
  // gate van xanh. Neo vao dong "Danh ba kenh mau" va dong "Tong kho bai hoc".
  { file: 'docs/WORKING_STATE.md',
    pattern: /(\*\*Danh bạ kênh mẫu \(`kenh-mau\.json`\):\*\* \*\*)\d+( kênh\*\* \()\d+( live · )\d+( dead)/g,
    build: c => `$1${c.channels}$2${c.liveChannels}$3${c.deadChannels}$4` },
  { file: 'docs/WORKING_STATE.md',
    pattern: /(→ nguồn: `data-tabs\/kenh-mau\.json` \()\d+(\/)\d+( có `ngay_do`; )\d+( sống · )\d+( dead = )\d+( DIE 404 \+ )\d+( kênh rỗng)/g,
    build: c => `$1${c.channelsWithNgayDo}$2${c.channels}$3${c.liveChannels}$4${c.deadChannels}$5${c.deadChannelsGone}$6${c.deadChannelsEmpty}$7` },
  { file: 'docs/WORKING_STATE.md',
    pattern: /(\*\*Tổng kho bài học \(`videos\.json`\):\*\* \*\*)\d+( bài\*\* \()\d+( Video bài giảng PRO \+ )\d+( Buổi Zoom Masterclass; )\d+( Free · )\d+( Pro\))/g,
    build: c => `$1${c.videos}$2${c.videoLessons}$3${c.zoomSessions}$4${c.videoFree}$5${c.videoPro}$6` },
  { file: 'docs/WORKING_STATE.md',
    pattern: /(\*\*Kho tài liệu & Master Prompts \(`tai-lieu-full\.json`\):\*\* \*\*)\d+( tài liệu\*\*)/g,
    build: c => `$1${c.documents}$2` },
  { file: 'docs/WORKING_STATE.md',
    pattern: /(\*\*Ma trận ngách YouTube \(`ngach-xanh\.json`\):\*\* \*\*)\d+( ngách\*\* \(`xanh:true` \*\*)\d+(\*\*)/g,
    build: c => `$1${c.niches}$2${c.nichesGreenTrue}$3` },
  { file: 'docs/WORKING_STATE.md',
    pattern: /(dung lượng ~)[\d.]+( GB \/ )[\d.]+( GiB\))/g,
    build: c => `$1${(c.mediaBytes / 1e9).toFixed(2)}$2${(c.mediaBytes / 1073741824).toFixed(2)}$3` },
  { file: 'knowledge-hub/docs/MEMORY.md',
    pattern: /(0 file 0 byte · )[\d.]+( GB \()[\d.]+( GiB\))/g,
    build: c => `$1${(c.mediaBytes / 1e9).toFixed(2)}$2${(c.mediaBytes / 1073741824).toFixed(2)}$3` },
];

// ---- DB COUNT GATE (2026-10-09) ----
// data/h2dev_master.db la projection dan xuat tu JSON (scripts/build_master_db.js). Truoc day gate
// KHONG doc DB -> so bang DB ghi o docs/WORKING_STATE.md (L37-39) troi ma --check van xanh.
// Doc DB CHI-DOC (node:sqlite readOnly). Thieu DB hoac node:sqlite -> bo qua (bao ro), khong fail.
// Neo khong con khop -> FAIL (tranh rule im lang khong kiem gi).
const DB_PATH = path.join(ROOT, 'data', 'h2dev_master.db');
const KG_JSON_PATH = path.join(ROOT, 'data', 'knowledge_graph.json');
const KG_DB_PATH = path.join(ROOT, 'data', 'h2dev_knowledge_graph.db');
const DB_TABLES = ['lessons', 'lesson_timestamps', 'competitor_channels', 'competitor_top_videos',
  'documents', 'reup_sources', 'niches', 'policies', 'checklists', 'search_fts'];

function readDbCounts(dbPath = DB_PATH) {
  if (!fs.existsSync(dbPath)) return { skipped: `khong thay ${path.relative(ROOT, dbPath)}` };
  let DatabaseSync;
  // An rieng canh bao ExperimentalWarning cua node:sqlite (khong anh huong canh bao khac).
  const origEmit = process.emitWarning;
  process.emitWarning = function (w, ...rest) {
    if (String((w && w.message) || w).includes('SQLite is an experimental')) return;
    return origEmit.call(process, w, ...rest);
  };
  try { ({ DatabaseSync } = require('node:sqlite')); } catch (_) { return { skipped: 'node:sqlite khong kha dung' }; }
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const counts = {};
    const errors = [];
    for (const t of DB_TABLES) counts[t] = db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
    if (!fs.existsSync(KG_DB_PATH)) {
      errors.push(`thieu ${path.relative(ROOT, KG_DB_PATH)}`);
    } else {
      try {
        const kgDb = new DatabaseSync(KG_DB_PATH, { readOnly: true });
        try {
          counts.kg_nodes = kgDb.prepare('SELECT COUNT(*) AS c FROM kg_nodes').get().c;
          counts.kg_edges = kgDb.prepare('SELECT COUNT(*) AS c FROM kg_edges').get().c;
          counts.kg_knowledge = kgDb.prepare("SELECT COUNT(*) AS c FROM kg_nodes WHERE layer = 'knowledge'").get().c;
          counts.kg_infra = kgDb.prepare("SELECT COUNT(*) AS c FROM kg_nodes WHERE layer = 'infra'").get().c;
          counts.kg_projects = kgDb.prepare("SELECT COUNT(*) AS c FROM kg_nodes WHERE type = 'project'").get().c;
        } finally { kgDb.close(); }
      } catch (e) {
        errors.push(`loi doc ${path.relative(ROOT, KG_DB_PATH)}: ${e.message}`);
      }
    }
    if (!fs.existsSync(KG_JSON_PATH)) {
      errors.push(`thieu ${path.relative(ROOT, KG_JSON_PATH)}`);
    } else {
      try {
        const kgJson = JSON.parse(fs.readFileSync(KG_JSON_PATH, 'utf8')) || {};
        const kgStats = kgJson.stats || {};
        if (counts.kg_nodes && kgStats.totalNodes !== counts.kg_nodes) {
          errors.push(`knowledge_graph.json totalNodes=${kgStats.totalNodes} != kg_nodes=${counts.kg_nodes}`);
        }
        if (counts.kg_nodes && Array.isArray(kgJson.nodes) && kgJson.nodes.length !== counts.kg_nodes) {
          errors.push(`knowledge_graph.json nodes.length=${kgJson.nodes.length} != kg_nodes=${counts.kg_nodes}`);
        }
        if (counts.kg_edges && kgStats.totalEdges !== counts.kg_edges) {
          errors.push(`knowledge_graph.json totalEdges=${kgStats.totalEdges} != kg_edges=${counts.kg_edges}`);
        }
        if (counts.kg_edges && Array.isArray(kgJson.edges) && kgJson.edges.length !== counts.kg_edges) {
          errors.push(`knowledge_graph.json edges.length=${kgJson.edges.length} != kg_edges=${counts.kg_edges}`);
        }
      } catch (e) {
        errors.push(`loi doc ${path.relative(ROOT, KG_JSON_PATH)}: ${e.message}`);
      }
    }
    return { counts, errors };
  } finally {
    db.close();
  }
}

// Dinh dang so kieu VN cho dong "2.014 entries" (dau cham ngan cach hang nghin).
const viNum = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const DB_DOC_RULES = [
  { file: 'docs/WORKING_STATE.md', label: 'FTS5 entries (dong Master SQLite Database)',
    pattern: /(\*\*Master SQLite Database:\*\* \*\*)[\d.]+( entries\*\* FTS5)/g,
    build: d => `$1${viNum(d.search_fts)}$2` },
  { file: 'docs/WORKING_STATE.md', label: 'search_fts (dong nguon do truc tiep)',
    pattern: /(`SELECT COUNT\(\*\) FROM search_fts`[^\n]*?= \*\*)\d+(\*\*)/g,
    build: d => `$1${d.search_fts}$2` },
  { file: 'docs/WORKING_STATE.md', label: 'bang kem theo (lessons..checklists)',
    pattern: /(Bảng kèm theo: `lessons` )\d+( · `lesson_timestamps` )\d+( · `competitor_channels` )\d+( · `competitor_top_videos` )\d+( · `documents` )\d+( · `reup_sources` )\d+( · `niches` )\d+(?: · `policies` \d+ · `checklists` \d+)?/g,
    build: d => `$1${d.lessons}$2${d.lesson_timestamps}$3${d.competitor_channels}$4${d.competitor_top_videos}$5${d.documents}$6${d.reup_sources}$7${d.niches} · \`policies\` ${d.policies} · \`checklists\` ${d.checklists}` },
  { file: 'docs/WORKING_STATE.md', label: 'muc 4.2 Master database (lessons..documents)',
    pattern: /(Master database `data\/h2dev_master\.db` đã rebuild đầy đủ \*\*)\d+( lessons\*\* \(148 H2DEV · 140 Huân · 45 DGMD\), \*\*)[\d.]+( lesson timestamps\*\*, \*\*)[\d.]+( competitor channels\*\*, \*\*)[\d.]+( top videos\*\*, \*\*)[\d.]+( documents\*\*)/g,
    build: d => `$1${viNum(d.lessons)}$2${viNum(d.lesson_timestamps)}$3${viNum(d.competitor_channels)}$4${viNum(d.competitor_top_videos)}$5${viNum(d.documents)}$6` },
  { file: 'docs/WORKING_STATE.md', label: 'muc 4.2 Master database (reup..FTS5)',
    pattern: /(Master database `data\/h2dev_master\.db` [^\r\n]*?documents\*\*, \*\*)[\d.]+( reup sources\*\*, \*\*)[\d.]+( niches\*\*, \*\*)[\d.]+( policies\*\*, \*\*)[\d.]+( checklists\*\* và \*\*)[\d.]+( FTS5 search index entries\*\*)/g,
    build: d => `$1${viNum(d.reup_sources)}$2${viNum(d.niches)}$3${viNum(d.policies)}$4${viNum(d.checklists)}$5${viNum(d.search_fts)}$6` },
  { file: 'docs/WORKING_STATE.md', label: 'muc 4.2 Nexus Dual-Layer Graph (nodes..edges)',
    pattern: /(Nexus Dual-Layer Graph \(`data\/h2dev_knowledge_graph\.db` \+ `data\/knowledge_graph\.json` \+ Obsidian Vault `knowledge-hub\/vault\/` \+ Web Explorer `\/graph`\) đã lập chỉ mục toàn diện \*\*)[\d.]+( nodes\*\* và \*\*)[\d.]+( edges\*\* qua 2 lớp \()[\d.]+( Knowledge nodes \+ )[\d.]+( Infra nodes trên )\d+( dự án\))/g,
    build: d => `$1${viNum(d.kg_nodes)}$2${viNum(d.kg_edges)}$3${viNum(d.kg_knowledge)}$4${viNum(d.kg_infra)}$5${d.kg_projects}$6` },
  { file: 'graph.html', label: 'btnScopeGalaxy Nexus total nodes',
    pattern: /(id="btnScopeGalaxy" data-graph-scope="galaxy" title="Vẽ toàn cảnh )[\d.]+( nút phân cụm theo Dự án & Nhánh đào tạo">🌌 Toàn Cảnh )[\d.]+( Nút<\/button>)/g,
    build: d => `$1${viNum(d.kg_nodes)}$2${viNum(d.kg_nodes)}$3` },
  { file: 'assets/app/graph-main.js', label: 'graphScope comment total nodes',
    pattern: /(\/\/ 'ego' \(Mạch Tâm Điểm Rõ Nét\) \| 'galaxy' \(Toàn Cảnh )[\d.]+( Nút\))/g,
    build: d => `$1${viNum(d.kg_nodes)}$2` },
];

// opts.docPath: ghi de duong dan doc (dung de test tren ban sao tam, KHONG dung file live).
function applyDbRules({ write, dbPath = DB_PATH, docPath = null } = {}) {
  const res = readDbCounts(dbPath);
  if (res.skipped) return { skipped: res.skipped, changes: [], missing: [] };
  const changes = [];
  const missing = [...(res.errors || [])];
  const contents = new Map();
  for (const rule of DB_DOC_RULES) {
    if (docPath && rule.file !== 'docs/WORKING_STATE.md') continue;
    const full = docPath || path.join(ROOT, rule.file);
    if (!fs.existsSync(full)) { missing.push(`${rule.file}: khong ton tai`); continue; }
    if (!contents.has(full)) contents.set(full, { orig: fs.readFileSync(full, 'utf8') });
    const entry = contents.get(full);
    const before = entry.cur !== undefined ? entry.cur : entry.orig;
    if (!before.match(rule.pattern)) { missing.push(`${rule.file}: ${rule.label} (khong tim thay neo)`); entry.cur = before; continue; }
    const after = before.replace(rule.pattern, rule.build(res.counts));
    if (after !== before) changes.push({ file: rule.file, label: rule.label });
    entry.cur = after;
  }
  if (write) {
    for (const [full, entry] of contents) {
      if (entry.cur !== undefined && entry.cur !== entry.orig) fs.writeFileSync(full, entry.cur, 'utf8');
    }
  }
  return { counts: res.counts, changes, missing };
}

function applyDocRules(counts, { write, fileOverrides = new Map() }) {
  const results = [];
  // Rule khong khop dong nao = neo da chet (doc doi cau chu, rule khong con kiem gi) -> fail loud, khong pass im lang.
  results.unmatched = [];
  for (const rule of DOC_RULES) {
    const full = fileOverrides.get(rule.file) || path.join(ROOT, rule.file);
    if (!fs.existsSync(full)) { results.unmatched.push(`${rule.file}: khong ton tai`); continue; }
    const before = fs.readFileSync(full, 'utf8');
    if (before.search(rule.pattern) === -1) results.unmatched.push(`${rule.file}: ${String(rule.pattern).slice(0, 70)}`);
    const after = before.replace(rule.pattern, rule.build(counts));
    if (after !== before) {
      results.push({ file: rule.file, changed: true });
      if (write) fs.writeFileSync(full, after, 'utf8');
    }
  }
  return results;
}

function diffCounts(live, manifest) {
  const a = (live && live.counts) || {};
  const b = (manifest && manifest.counts) || {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = [];
  for (const k of keys) if (a[k] !== b[k]) out.push({ key: k, live: a[k], manifest: b[k] });
  return out;
}

// ---- Memory sync: chi cap nhat trong block danh dau AUTO-COUNTS ----
// Nguyen tac memory: KHONG rewrite log lich su. Chi ghi so chuan vao block
// duoc danh dau ro. Neu block chua co, bo qua (khong tu chen vao file la).
const MEMORY_FILES = [
  path.resolve(ROOT, '..', '.workbuddy', 'memory', 'MEMORY.md'),
];
const AUTO_START = '<!-- AUTO-COUNTS:START -->';
const AUTO_END = '<!-- AUTO-COUNTS:END -->';

function buildAutoBlock(counts) {
  const rows = [
    `| videos.json | ${counts.videos} (${counts.videoLessons} VIDEO + ${counts.zoomSessions} ZOOM) |`,
    `| kenh-mau.json | ${counts.channels} (${counts.liveChannels} live · ${counts.deadChannels} dead) |`,
    `| tai-lieu-full.json | ${counts.documents} |`,
    `| ngach-xanh.json | ${counts.niches} (xanh:true ${counts.nichesGreenTrue}) |`,
    `| kich-ban.json | ${counts.kichBan} |`,
    `| nguon-reup.json | ${counts.nguonReup} |`,
    `| raw-kenh-mau.json | ${counts.canonicalRaw} (${counts.canonicalRawUniqueChannels} kênh unique) |`,
  ];
  return [
    AUTO_START,
    '> Số liệu CHUẨN (tự sinh bởi scripts/sync-counts.js — KHÔNG sửa tay):',
    '>',
    '| File | Số record |',
    '|---|---|',
    ...rows,
    '>',
    '> Nguồn: `data/counts-manifest.json` · đọc trực tiếp `data-tabs/*.json`.',
    AUTO_END,
  ].join('\n');
}

function applyMemorySync(counts, { write }) {
  const results = [];
  for (const full of MEMORY_FILES) {
    if (!fs.existsSync(full)) continue;
    const before = fs.readFileSync(full, 'utf8');
    const s = before.indexOf(AUTO_START);
    const e = before.indexOf(AUTO_END);
    if (s === -1 || e === -1 || e < s) continue; // chua co block -> bo qua
    const block = buildAutoBlock(counts);
    const after = before.slice(0, s) + block + before.slice(e + AUTO_END.length);
    if (after !== before) {
      results.push({ file: path.basename(full) });
      if (write) fs.writeFileSync(full, after, 'utf8');
    }
  }
  return results;
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const docsOnly = args.includes('--docs-only');
  const treeCopyArg = args.indexOf('--tree-copy');
  const treeCopy = treeCopyArg >= 0 ? args[treeCopyArg + 1] : null;
  if (treeCopy && !check) {
    console.error('[counts] --tree-copy chi duoc dung kem --check (probe tren ban sao).');
    process.exitCode = 2;
    return;
  }
  if (treeCopy && !fs.existsSync(treeCopy)) {
    console.error('[counts] --tree-copy khong ton tai: ' + treeCopy);
    process.exitCode = 2;
    return;
  }

  const live = buildManifest();
  const prev = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
    : null;

  const drift = prev ? diffCounts(live, prev) : [];
  const fileOverrides = treeCopy ? new Map([['TREE.md', path.resolve(treeCopy)]]) : new Map();
  const docChanges = applyDocRules(live.counts, { write: !check, fileOverrides });
  const memChanges = applyMemorySync(live.counts, { write: !check });
  const dbRes = applyDbRules({ write: !check });

  if (check) {
    let bad = false;
    if (!prev) { console.log('[counts] CHUA co manifest — chay: node scripts/sync-counts.js'); bad = true; }
    if (drift.length) {
      bad = true;
      console.log('[counts] LECH giua data live va manifest:');
      drift.forEach(d => console.log(`  - ${d.key}: live=${d.live} manifest=${d.manifest}`));
    }
    if (docChanges.unmatched.length) {
      bad = true;
      console.log('[counts] DOC rule KHONG KHOP dong nao (neo chet — sua rule hoac doc):');
      docChanges.unmatched.forEach(u => console.log(`  - ${u}`));
    }
    if (docChanges.length) {
      bad = true;
      console.log('[counts] DOC lech (can cap nhat):');
      docChanges.forEach(d => console.log(`  - ${d.file}`));
    }
    if (memChanges.length) {
      bad = true;
      console.log('[counts] MEMORY lech (can cap nhat):');
      memChanges.forEach(d => console.log(`  - ${d.file}`));
    }
    if (dbRes.skipped) {
      console.log(`[counts] DB: bo qua kiem tra (${dbRes.skipped}).`);
    } else {
      if (dbRes.missing.length) {
        bad = true;
        console.log('[counts] DB: neo doc khong khop (rule khong kiem duoc):');
        dbRes.missing.forEach(m => console.log(`  - ${m}`));
      }
      if (dbRes.changes.length) {
        bad = true;
        console.log('[counts] DB lech voi docs (h2dev_master.db that):', JSON.stringify(dbRes.counts));
        dbRes.changes.forEach(d => console.log(`  - ${d.file}: ${d.label}`));
      }
      if (!dbRes.missing.length && !dbRes.changes.length) {
        console.log('[counts] DB OK — h2dev_master.db khop docs:', JSON.stringify(dbRes.counts));
      }
    }
    if (bad) { process.exitCode = 1; return; }
    console.log('[counts] OK — data live, manifest, docs, memory dong bo 100%.');
    return;
  }

  if (!docsOnly) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(live, null, 2) + '\n', 'utf8');
    console.log(`[counts] Da ghi manifest: ${path.relative(ROOT, MANIFEST_PATH)}`);
  }
  if (docChanges.length) {
    console.log(`[counts] Da cap nhat ${docChanges.length} vi tri trong docs:`);
    docChanges.forEach(d => console.log(`  - ${d.file}`));
  } else {
    console.log('[counts] Docs da dong bo (0 thay doi).');
  }
  if (memChanges.length) {
    console.log(`[counts] Da cap nhat memory: ${memChanges.map(d => d.file).join(', ')}`);
  }
  if (dbRes.skipped) {
    console.log(`[counts] DB: bo qua (${dbRes.skipped}).`);
  } else {
    if (dbRes.changes.length) {
      console.log(`[counts] Da cap nhat so DB trong docs (${dbRes.changes.length} vi tri):`, JSON.stringify(dbRes.counts));
      dbRes.changes.forEach(d => console.log(`  - ${d.file}: ${d.label}`));
    }
    if (dbRes.missing.length) {
      console.log('[counts] CANH BAO DB: neo doc khong khop:');
      dbRes.missing.forEach(m => console.log(`  - ${m}`));
      process.exitCode = 1;
    }
  }
  console.log('[counts] So lieu chuan:', JSON.stringify(live.counts));
}

if (require.main === module) main();

module.exports = { DOC_RULES, DB_DOC_RULES, applyDocRules, applyDbRules, readDbCounts, applyMemorySync, diffCounts, MANIFEST_PATH, DB_PATH };
