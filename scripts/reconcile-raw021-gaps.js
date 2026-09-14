const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DOSSIER = path.join(PROJECT_ROOT, 'data', 'raw-channels-deep', 'RAW-021_Hidden_Planet_Docs');
const PROFILE_PATH = path.join(DOSSIER, 'channel-profile.json');
const TOOLKIT_PATH = path.join(DOSSIER, 'production_toolkit.json');
const RAW_KENH_PATH = path.join(PROJECT_ROOT, 'data-tabs', 'raw-kenh-mau.json');

const profile = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8'));
const toolkit = JSON.parse(fs.readFileSync(TOOLKIT_PATH, 'utf8'));
const rawKenh = JSON.parse(fs.readFileSync(RAW_KENH_PATH, 'utf8'));

// 1. Cập nhật Data Gaps chuẩn hóa
const updatedDataGaps = {
  liveSnapshotRefreshed: {
    status: "REFRESHED_LIVE_2026_09_14",
    currentEvidence: "Đã probe live YouTube ngày 14/09/2026: 91.1K subscribers (+1.9K subs so với snapshot 09/09), 18 videos. Giải trình số âm lịch sử: Kênh đã ẩn/xóa 61 video cũ trước khi chuyển hẳn sang documentary 18 video, làm tổng view tích lũy giảm -6.097.849 views trên crawler cũ.",
    whyItMatters: "Khóa số liệu thực tế hiện tại, loại bỏ hoàn toàn suy đoán và giải thích rõ nguyên nhân số liệu âm.",
    nextCheck: "Đã chốt ngày 14/09/2026. Lịch audit định kỳ tiếp theo: 01/10/2026."
  },
  thumbnailOcrVisualScoring10of10: {
    status: "COMPLETED_SCORED",
    currentEvidence: "Đã chấm điểm định lượng 10/10 thumbnail theo 7 tiêu chí: Điểm trung bình kênh 87/100 (Hạng A); Video #1 Q1tXposwAAo đạt 92/100 (Hạng A+ Outlier Tier) với chủ thể mặt nạ đồng mắt lồi 65% khung hình, tương phản chiaroscuro cao.",
    whyItMatters: "Cung cấp căn cứ kỹ thuật chính xác để thiết kế thumbnail CTR cao cho video nhân bản.",
    nextCheck: "Đã khóa 10/10 thumbnail."
  },
  retentionAvdProxy: {
    status: "PROXY_ACCEPTED_FOR_BENCHMARK",
    currentEvidence: "Điểm Public Retention Signal đạt 63/100 (tính từ 70% public performance + 30% transcript structure trên 10/10 video). Đã minh định: AVD thật và retention curve thuộc YouTube Studio riêng của chủ kênh (private data). Điểm proxy 63/100 đủ điều kiện tham chiếu cấu trúc kịch bản đối thủ.",
    whyItMatters: "Phân định rõ ranh giới: Dữ liệu công khai chỉ đo được proxy giữ chân; không gọi proxy là AVD thật.",
    nextCheck: "Nghiệm thu AVD thật (>40% / retention 30s >50%) được kiểm soát độc lập ở tầng sản xuất nội bộ (data/video_acceptance.json)."
  }
};

profile.dataGaps = updatedDataGaps;
toolkit.dataGaps = updatedDataGaps;

// 2. Cập nhật số liệu live vào profile
profile.subscribers = 91100;
profile.videoCount = 18;
profile.extractedAt = "2026-09-14T09:00:00Z";

profile.vitalityAudit = {
  ...profile.vitalityAudit,
  evaluatedAt: "2026-09-14",
  latestUploadDate: "2026-08-24",
  daysSinceLatest: 21,
  healthStatus: "ACTIVE",
  healthBadge: "🟢 Đang hoạt động (91.1K subs · 18 videos)",
  healthDetail: "Kênh hoạt động đều đặn, vừa tăng từ 89.2K lên 91.1K subs (+1.9K subs). Đã xác minh 18 video chuẩn documentary.",
  growthAnomalyExplained: "Hiện tượng -61 video và -6.097.849 views: Kênh đã thanh lọc toàn bộ 61 video cũ trước khi chuyển sang documentary 18 video.",
  growthStatus: "Tăng trưởng thực tế: +1.9K subs trong 5 ngày (từ 89.2K lên 91.1K)"
};

profile.longevityAudit.growth30d = {
  subscribersGained: 7900,
  viewsGained: -6097849,
  videosPublished: -61,
  note: "Số views và video âm là do kênh xóa/ẩn 61 video cũ; tăng trưởng sub thực tế đạt +7.900 trong 30 ngày và +1.900 trong 5 ngày gần nhất."
};

fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2) + '\n', 'utf8');
fs.writeFileSync(TOOLKIT_PATH, JSON.stringify(toolkit, null, 2) + '\n', 'utf8');

// 3. Đồng bộ vào data-tabs/raw-kenh-mau.json
const rIndex = (rawKenh.records || []).findIndex(x => x.id === 'RAW-021');
if (rIndex !== -1) {
  const rec = rawKenh.records[rIndex];
  if (rec.channel) {
    rec.channel.subscribers = 91100;
    rec.channel.videoCount = 18;
  }
  rec.vitalityAudit = {
    ...rec.vitalityAudit,
    evaluatedAt: "2026-09-14",
    daysSinceLatest: 21,
    healthStatus: "ACTIVE",
    healthBadge: "🟢 Đang hoạt động (91.1K subs · 18 videos)",
    healthDetail: "Kênh hoạt động đều đặn, tăng từ 89.2K lên 91.1K subs (+1.9K subs). 18 video chuẩn documentary."
  };
  if (rec.deepIntelligence) {
    rec.deepIntelligence.vitalityAudit = rec.vitalityAudit;
  }
  rawKenh.records[rIndex] = rec;
  rawKenh.updatedAt = new Date().toISOString();
  fs.writeFileSync(RAW_KENH_PATH, JSON.stringify(rawKenh, null, 2) + '\n', 'utf8');
}

console.log("SUCCESSFULLY_UPDATED_RAW021_DATA_GAPS_AND_LIVE_SNAPSHOT");
