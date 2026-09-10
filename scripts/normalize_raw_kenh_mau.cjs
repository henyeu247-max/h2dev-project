/**
 * normalize_raw_kenh_mau.cjs
 * Chuẩn hóa toàn diện 95/95 record ảnh Raw Kênh Mẫu Tìm Kiếm.
 * - Sửa lỗi OCR view 1.8M -> 1.8k tại RAW-011.
 * - Sửa lỗi dán nhầm channel.title "God's Perspective" tại RAW-038 và RAW-085.
 * - Sửa lỗi typo handle tại RAW-063.
 * - Sửa tên kênh tại RAW-010, RAW-016, RAW-024, RAW-056, RAW-071, RAW-077.
 * - Đánh dấu chính xác 10 nhóm trùng lặp (12 record duplicateOf).
 * - Gán chuẩn 21 nhóm biên tập (editorialNiche).
 * - Cập nhật đồng bộ vào metadata-full.json và data-tabs/raw-kenh-mau.json.
 */

const fs = require('fs');
const path = require('path');

const ROOT = 'd:/YTB/H2DEV-Project';
const rawMetaPath = path.join(ROOT, 'Raw Kênh Mẫu Tìm Kiếm', 'metadata-full.json');
const tabMetaPath = path.join(ROOT, 'data-tabs', 'raw-kenh-mau.json');
const auditPath = path.join(ROOT, '_audit/20260906-raw-market/appendix-raw-95.md');

const meta = JSON.parse(fs.readFileSync(rawMetaPath, 'utf8'));
const auditContent = fs.readFileSync(auditPath, 'utf8');

// Parse audit appendix for 21 editorial niches & public status
const auditMap = {};
for (const line of auditContent.split('\n')) {
  const match = line.match(/^\|\s*(RAW-\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
  if (match) {
    auditMap[match[1].trim()] = {
      editorialNiche: match[3].trim(),
      publicStatus: match[4].trim(),
    };
  }
}

// Map 10 duplicate groups (12 redundant records)
const duplicateMapping = {
  'RAW-027': 'RAW-013', // Backyard Story (@BackyardStoryUS)
  'RAW-026': 'RAW-015', // Vanished Britain (@VanishedBritainUK)
  'RAW-036': 'RAW-035', // Passion Learning Live (@PassionLearningLive)
  'RAW-041': 'RAW-035', // Passion Learning Live (@PassionLearningLive)
  'RAW-090': 'RAW-054', // BeyondTheBlue (@OfficialBeyondTheBlue)
  'RAW-094': 'RAW-054', // BeyondTheBlue (@OfficialBeyondTheBlue)
  'RAW-072': 'RAW-055', // trueglobe66 (@trueglobe66)
  'RAW-071': 'RAW-056', // Happy Travel 99 (@HappyTravel99)
  'RAW-073': 'RAW-057', // travpedia (@travpedia)
  'RAW-074': 'RAW-058', // Best Travel (@BestTravel2)
  'RAW-061': 'RAW-060', // Jay_Hona (@Jay_Hona)
  'RAW-093': 'RAW-069', // God's Perspective (@GodsPerspective10)
};

let fixedCount = 0;
let dupMarkedCount = 0;

for (const r of meta.records) {
  // 1. Gán editorialNiche & publicStatus
  if (auditMap[r.id]) {
    r.editorialNiche = auditMap[r.id].editorialNiche;
    r.publicVerification = auditMap[r.id].publicStatus;
  }

  // 2. Gán duplicateOf
  if (duplicateMapping[r.id]) {
    r.duplicateOf = duplicateMapping[r.id];
    r.status = 'DUPLICATE_SIGNAL';
    dupMarkedCount++;
  } else {
    r.duplicateOf = null;
    if (r.status !== 'NEEDS_REVIEW') {
      r.status = 'VERIFIED_UNIQUE';
    }
  }

  // 3. Sửa lỗi cụ thể từng record
  if (r.id === 'RAW-011') {
    // Sửa lỗi view 1.8M -> 1.8k
    if (r.ocr && r.ocr.videoRows && r.ocr.videoRows[2]) {
      if (r.ocr.videoRows[2].viewsText === '1.8M views') {
        r.ocr.videoRows[2].viewsText = '1.8k views';
        r.ocr.videoRows[2].note = 'Đã sửa lỗi OCR đọc nhầm k thành M (bằng chứng 5 days ago, 2 VPH)';
        fixedCount++;
      }
    }
  }

  if (r.id === 'RAW-038') {
    // Sửa nhầm tên kênh God's Perspective
    if (r.channel) {
      r.channel.title = 'HL Goo Daily English';
      r.channel.handle = '@HLGooDailyEnglish888';
      fixedCount++;
    }
  }

  if (r.id === 'RAW-085') {
    // Sửa nhầm tên kênh God's Perspective
    if (r.channel) {
      r.channel.title = '2ch英語スレ';
      r.channel.handle = '@eigo2ch';
      fixedCount++;
    }
  }

  if (r.id === 'RAW-063') {
    // Sửa typo handle
    if (r.channel) {
      r.channel.handle = '@AnimatedMilitaryy';
      fixedCount++;
    }
  }

  if (r.id === 'RAW-010' && r.channel) {
    r.channel.title = "Landon's Animation Wheelhouse";
    fixedCount++;
  }

  if (r.id === 'RAW-016' && r.channel) {
    r.channel.title = 'Slow Living Agriculture 2';
    fixedCount++;
  }

  if (r.id === 'RAW-024' && r.channel) {
    r.channel.title = 'Ao Infinito e Além';
    fixedCount++;
  }

  if ((r.id === 'RAW-056' || r.id === 'RAW-071') && r.channel) {
    r.channel.title = 'Happy Travel 99';
    fixedCount++;
  }

  if (r.id === 'RAW-077' && r.channel) {
    r.channel.title = 'Kurzgesagt – In a Nutshell';
    fixedCount++;
  }
}

meta.updatedAt = '2026-09-09T10:30:00+08:00';
meta.summary = {
  totalRecords: meta.records.length,
  uniqueChannels: meta.records.length - dupMarkedCount,
  duplicateRecords: dupMarkedCount,
  duplicateGroups: 10,
  editorialNichesCount: 21,
};

// Ghi ra 2 file
fs.writeFileSync(rawMetaPath, JSON.stringify(meta, null, 2), 'utf8');
fs.writeFileSync(tabMetaPath, JSON.stringify(meta, null, 2), 'utf8');

console.log('✅ Đã chuẩn hóa toàn bộ 95 record:');
console.log(' - Tổng record:', meta.records.length);
console.log(' - Kênh độc lập (unique):', meta.summary.uniqueChannels);
console.log(' - Record trùng lặp (duplicateOf):', dupMarkedCount);
console.log(' - Các lỗi OCR & nhãn đã sửa:', fixedCount);
console.log(' - Đã đồng bộ sang metadata-full.json và raw-kenh-mau.json');
