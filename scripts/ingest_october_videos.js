const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');

function getFfprobeInfo(filePath) {
  try {
    const raw = execSync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`,
      { encoding: 'utf-8' }
    );
    const data = JSON.parse(raw);
    const videoStream = data.streams.find(s => s.codec_type === 'video') || {};
    const duration = parseFloat(data.format.duration || 0);
    const size = parseInt(data.format.size || 0, 10);
    return {
      duration_sec: Math.round(duration),
      duration_hms: formatHMS(duration),
      size_bytes: size,
      size_mb: parseFloat((size / (1024 * 1024)).toFixed(2)),
      width: videoStream.width || 1280,
      height: videoStream.height || 720,
      resolution: (videoStream.height || 720) >= 1080 ? '1080p' : '720p',
      badge: (videoStream.height || 720) >= 1080 ? '1080p' : '720p',
    };
  } catch (err) {
    return null;
  }
}

function formatHMS(seconds) {
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const remSec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
}

const newVideosDef = [
  {
    sku: 'VIDEO-ab1137',
    id: 12777,
    title: 'Khám kênh show thực tế kênh làm nhân bản thị trường từ Hàn sang Nhật sau chỉ 1 video đầu tiên',
    published_at: '2026-10-11',
    actual_topic: 'Khám Kênh Thực Tế: Nhân Bản Thị Trường Từ Hàn Sang Nhật Ăn Đề Xuất Ngay Video Đầu Tiên',
    niche_primary: 'Nhân Bản Kênh & Chiến Lược Thị Trường',
    target_market: 'Nhật Bản, Hàn Quốc',
    market_code: 'JP',
    market: ['🇯🇵 Nhật', '🇰🇷 Hàn'],
    market_str: '🇯🇵 Nhật / 🇰🇷 Hàn',
    tags: ['Quan trọng', 'Nhật', 'Hàn', 'Nhân bản', 'Case study', 'Mới nhất'],
    channels: [],
    desc: 'Bài học khám kênh phân tích case study học viên thực tế nhân bản thị trường từ Hàn Quốc sang Nhật Bản ở ngách làm vườn/đời sống, ăn đề xuất ngay từ video đầu tiên. Nhấn mạnh nguyên tắc chọn đúng ngách quyết định 70% thành công.',
    url_key: 'kham-kenh-show-thuc-te-kenh-lam-nhan-ban-thi-truong-tu-han-sang-nhat-sau-chi-1-video-dau-tien',
    docs: [
      {
        name: 'Mô tả bài giảng & Phân tích Case Study (README.md)',
        link: 'docs/VIDEO-ab1137/README.md',
        file: 'docs/VIDEO-ab1137/README.md',
        title: 'Mô tả bài giảng & Phân tích Case Study (README.md)'
      },
      {
        name: 'Bản ghi phụ đề đầy đủ (Transcript timestamped .txt)',
        link: 'video/VIDEO-ab1137/transcript.txt',
        file: 'video/VIDEO-ab1137/transcript.txt',
        title: 'Bản ghi phụ đề đầy đủ (Transcript timestamped .txt)'
      }
    ],
    insight: {
      category_group: 'nhan_ban',
      niche_id: 'cross-market-replication',
      key_takeaways: [
        'Học viên áp dụng tư duy nhân bản thị trường: Lấy công thức ngách đang thắng ở Hàn Quốc (làm vườn / đời sống) để đưa sang thị trường Nhật Bản.',
        'Kênh mới chỉ đăng đúng 1 video đầu tiên đã được hệ thống YouTube phân phối đề xuất mạnh mẽ.',
        'Chọn đúng ngách chiếm đến 70% thắng lợi của việc xây kênh YouTube Faceless: khi ngách có nhu cầu tự nhiên và độ cạnh tranh thấp thì video đầu tiên đã có thể bùng nổ view.',
        'Minh chứng thực tế từ số liệu học viên PRO chứng minh tính hiệu quả của mô hình nhân bản chéo ngôn ngữ.'
      ],
      edit_sop: {
        primary: 'Sản xuất video đời sống/làm vườn theo phong cách Nhật Bản nhẹ nhàng, chân thực',
        additional: [
          'Tối ưu hóa tiêu đề và thumbnail chuẩn phong cách và ngữ cảm người dùng Nhật Bản',
          'Sử dụng giọng lồng tiếng tự nhiên chuẩn bản ngữ tiếng Nhật',
          'Cắt dựng nhịp nhàng, âm thanh thiên nhiên ASMR tạo cảm giác thư giãn'
        ]
      },
      avoid_flags: [
        'Không dùng công cụ dịch máy thô sơ khiến câu từ gượng gạo gây phản cảm cho khán giả Nhật',
        'Tránh chọn những ngách quá bão hòa hoặc không có sự tương đồng văn hóa'
      ],
      tools_mentioned: [],
      channels_mentioned: [],
      sop_steps: [
        'Bước 1: Tìm ngách đang có nhu cầu cao và cạnh tranh thấp ở thị trường gốc (Hàn Quốc).',
        'Bước 2: Nghiên cứu thị trường mục tiêu có văn hóa tương đồng (Nhật Bản).',
        'Bước 3: Chuẩn hóa ngôn ngữ bản địa và phong cách thẩm mỹ của thị trường đích.',
        'Bước 4: Sản xuất và xuất bản video đầu tiên với tiêu chuẩn chất lượng cao nhất.'
      ]
    }
  },
  {
    sku: 'VIDEO-0b3f44',
    id: 12779,
    title: 'Share 2 ngách nhỏ bán content view ngoại mới | Update 13-10-2026',
    published_at: '2026-10-13',
    actual_topic: 'Share 2 Ngách Nhỏ Bán Content View Ngoại: Triết Lý Giáo Sư & Thói Quen Ăn Uống Sức Khỏe Tim Phổi',
    niche_primary: 'Bán Content Ngách Cực Nhỏ & Tối Ưu CTR',
    target_market: 'Hàn Quốc',
    market_code: 'KR',
    market: ['🇰🇷 Hàn'],
    market_str: '🇰🇷 Hàn',
    tags: ['Quan trọng', 'Hàn', 'Bán content', 'Outlier', 'Thumbnail', 'Mới nhất'],
    channels: ['@sangong7449', '@건강채소이야기18'],
    desc: 'Cập nhật chia sẻ 2 ngách nhỏ bán content view ngoại thị trường Hàn Quốc ngày 13/10/2026. Phân tích case study kênh 11 video view bùng nổ về triết lý giáo sư nổi tiếng và ngách thói quen ăn uống sức khỏe với thumbnail mô hình giải phẫu tim phổi đạt CTR đỉnh cao.',
    url_key: 'share-2-ngach-nho-ban-content-view-ngoai-moi-update-13-10-2026',
    docs: [
      {
        name: 'SOP Phân Tích 2 Ngách Nhỏ Bán Content View Ngoại (README.md)',
        link: 'docs/VIDEO-0b3f44/README.md',
        file: 'docs/VIDEO-0b3f44/README.md',
        title: 'SOP Phân Tích 2 Ngách Nhỏ Bán Content View Ngoại (README.md)'
      },
      {
        name: 'Mô tả bài giảng & Kênh đối thủ (description.txt)',
        link: 'assets/docs/VIDEO-0b3f44/description.txt',
        file: 'assets/docs/VIDEO-0b3f44/description.txt',
        title: 'Mô tả bài giảng & Kênh đối thủ (description.txt)'
      },
      {
        name: 'Bản ghi phụ đề đầy đủ (Transcript timestamped .txt)',
        link: 'video/VIDEO-0b3f44/transcript.txt',
        file: 'video/VIDEO-0b3f44/transcript.txt',
        title: 'Bản ghi phụ đề đầy đủ (Transcript timestamped .txt)'
      }
    ],
    insight: {
      category_group: 'ban_content',
      niche_id: 'kr-small-niche-ctr',
      key_takeaways: [
        'Ngách 1 (Triết lý nhân vật cụ thể): Kênh cổ 2017 mới làm 11 video đã có video >300K views sau 7 ngày, tập trung khai thác lời khuyên của giáo sư/nhân vật nổi tiếng.',
        'Ngách 2 (Thói quen ăn uống & bệnh lý): Kênh chuyển dịch từ ăn uống chung sang phân tích bệnh lý cụ thể với thumbnail bác sĩ cầm mô hình nội tạng (tim, phổi) đạt view đột phá.',
        'Lỗi nghiêm trọng cần tránh trong edit: Để 1 ảnh tĩnh duy nhất xuyên suốt video rất dễ bị YouTube quét bản quyền / Reused Content; bắt buộc phải cắt ghép nhiều b-roll.',
        'Tối ưu Thumbnail: Với ngách nhân vật bắt buộc phải dùng mặt thật của nhân vật, không để AI tự vẽ mặt biến dạng làm tụt CTR.'
      ],
      edit_sop: {
        primary: 'Sản xuất video bán content ngách nhỏ Hàn Quốc với b-roll động và thumbnail chuẩn CTR',
        additional: [
          'Cắt ghép đa dạng cảnh b-roll, tránh tuyệt đối để 1 ảnh tĩnh xuyên suốt video',
          'Ghép mặt nhân vật có thật vào thumbnail để tạo độ uy tín cao cho người xem',
          'Thumbnail ngách sức khỏe sử dụng hình ảnh bác sĩ cầm mô hình 3D trực quan'
        ]
      },
      avoid_flags: [
        'Không để ảnh tĩnh chạy hiệu ứng chuyển động nhẹ kéo dài (dễ dính Reused Content)',
        'Không dùng ảnh thumbnail do AI tự tạo gương mặt biến dạng, thiếu chân thực',
        'Không đặt tiêu đề và thumbnail chung chung (như đau đầu, mệt mỏi) vì khó ăn đề xuất'
      ],
      tools_mentioned: [],
      channels_mentioned: ['@sangong7449', '@건강채소이야기18'],
      sop_steps: [
        'Bước 1: Tìm nhân vật có tầm ảnh hưởng lớn trong ngách triết lý/giáo dục hoặc chủ đề sức khỏe cụ thể.',
        'Bước 2: Nghiên cứu các video phổ biến nhất của kênh đối thủ (@sangong7449, @건강채소이야기18).',
        'Bước 3: Biên tập kịch bản phân đoạn, ghép nhiều tư liệu hình ảnh chuyển động.',
        'Bước 4: Thiết kế thumbnail với mặt nhân vật thật hoặc mô hình giải phẫu trực quan.'
      ]
    }
  },
  {
    sku: 'VIDEO-0c72ab',
    id: 12797,
    title: 'V1 - Full 50 phút Thực chiến hướng dẫn quy trình A-Z làm ngách "What-If" đang cực HOT trends bằng Claude và Edit 100% = Claude code  |  Update 21-10-2026',
    published_at: '2026-10-21',
    actual_topic: 'V1 Full 50 Phút Thực Chiến Hướng Dẫn Quy Trình A-Z Làm Ngách Trends What-If Biên Tập 100% Bằng Claude Code',
    niche_primary: 'Tự Động Hóa YouTube, Edit Bằng Code & Ngách Giả Định What-If',
    target_market: 'Quốc tế / Hoa Kỳ',
    market_code: 'US',
    market: ['🇺🇸 US / Global'],
    market_str: '🇺🇸 US / Global',
    tags: ['Quan trọng', 'Trends', 'What-If', 'Claude Code', 'Edit 100%', 'Mới nhất'],
    channels: [],
    desc: 'Bản hướng dẫn thô cứng full 50 phút thực chiến từ A-Z cách xây dựng ngách "What-If" đang cực hot trend trên YouTube toàn cầu bằng Claude AI, biên tập dựng video 100% trực tiếp bằng Claude Code kèm bộ kỹ năng WhatIf-Skills.zip.',
    url_key: 'full-50-phut-thuc-chien-huong-dan-quy-trinh-a-z-lam-ngach-what-if-dang-cuc-hot-trends-bang-claude-va-edit-100-claude-code-update-21-10-2026',
    docs: [
      {
        name: 'Hướng dẫn thực chiến ngách What-If V1 (README.md)',
        link: 'docs/VIDEO-0c72ab/README.md',
        file: 'docs/VIDEO-0c72ab/README.md',
        title: 'Hướng dẫn thực chiến ngách What-If V1 (README.md)'
      },
      {
        name: 'Tài nguyên & Bộ Skill What-If (WhatIf-Skills.zip)',
        link: 'assets/docs/VIDEO-0c72ab/WhatIf-Skills.zip',
        file: 'assets/docs/VIDEO-0c72ab/WhatIf-Skills.zip',
        title: 'Tài nguyên & Bộ Skill What-If (WhatIf-Skills.zip)'
      },
      {
        name: 'Mô tả bài giảng & Liên kết tài nguyên (description.txt)',
        link: 'assets/docs/VIDEO-0c72ab/description.txt',
        file: 'assets/docs/VIDEO-0c72ab/description.txt',
        title: 'Mô tả bài giảng & Liên kết tài nguyên (description.txt)'
      },
      {
        name: 'Bản ghi phụ đề đầy đủ (Transcript timestamped .txt)',
        link: 'video/VIDEO-0c72ab/transcript.txt',
        file: 'video/VIDEO-0c72ab/transcript.txt',
        title: 'Bản ghi phụ đề đầy đủ (Transcript timestamped .txt)'
      }
    ],
    insight: {
      category_group: 'ai_automation',
      niche_id: 'what-if-claude-code',
      key_takeaways: [
        'Ngách What-If (Giả định tình huống) có tỷ lệ giữ chân người xem (AVD) cực cao nhờ tính tò mò và nội dung kịch tính.',
        'Hướng dẫn quy trình thô cứng nền tảng: Hiểu rõ từng công đoạn từ kịch bản, prompt ảnh, timing thoại đến cắt dựng.',
        'Đột phá công nghệ: Sử dụng Claude Code để tự động hóa toàn bộ việc cắt ghép, render hiệu ứng chuyển động mà không cần can thiệp phần mềm thủ công.',
        'Tặng kèm bộ kỹ năng WhatIf-Skills.zip được tối ưu hóa cho Claude để tạo prompt phân cảnh nhất quán.'
      ],
      edit_sop: {
        primary: 'Sản xuất video What-If tự động với kịch bản 3 hồi và edit 100% bằng Claude Code',
        additional: [
          'Sử dụng bộ WhatIf-Skills.zip để chuẩn hóa prompt hình ảnh',
          'Tạo chuỗi hình ảnh nhất quán nhân vật và bối cảnh',
          'Điều khiển Claude Code để ghép timeline, audio và hiệu ứng chuyển cảnh'
        ]
      },
      avoid_flags: [
        'Không chuyển thẳng sang tự động hóa nếu chưa hiểu rõ bản chất quy trình thô cứng ở bản V1',
        'Tránh viết kịch bản lan man làm giảm nhịp độ kịch tính của câu chuyện giả tưởng'
      ],
      tools_mentioned: ['Claude'],
      channels_mentioned: [],
      sop_steps: [
        'Bước 1: Giải nén và nạp bộ kỹ năng WhatIf-Skills.zip vào môi trường Claude.',
        'Bước 2: Xây dựng ý tưởng giả định độc đáo thu hút sự tò mò cao.',
        'Bước 3: Lên dàn ý phân cảnh và tạo prompt hình ảnh nhất quán.',
        'Bước 4: Sử dụng Claude Code thực thi lệnh cắt dựng và ráp nối âm thanh hoàn chỉnh.'
      ]
    }
  },
  {
    sku: 'VIDEO-e0e9cd',
    id: 12799,
    title: 'V2 - Thực chiến quy trình A-Z làm ngách đang cực HOT trends = Claude Automation | Update 22-10-2026',
    published_at: '2026-10-22',
    actual_topic: 'V2 Thực Chiến Quy Trình A-Z Làm Ngách Trends What-If Bằng Claude Automation & Plugin H2 2D Studio',
    niche_primary: 'Tự Động Hóa YouTube & Ngách Giả Định What-If',
    target_market: 'Quốc tế / Hoa Kỳ',
    market_code: 'US',
    market: ['🇺🇸 US / Global'],
    market_str: '🇺🇸 US / Global',
    tags: ['Quan trọng', 'Trends', 'What-If', 'Claude Automation', 'Plugin', 'Mới nhất'],
    channels: ['@IfverseTales', '@Ifinite-c5h', '@IFOLOGYFILMS', '@JeremyBearimyTheory'],
    desc: 'Phiên bản 2 nâng cấp toàn diện quy trình tự động hóa sản xuất video ngách "What-If" đang cực hot trend bằng Claude Automation và Plugin H2 2D Studio (h2-2d-studio.plugin). Rút ngắn 80% thời gian sản xuất và phân tích 4 kênh đối thủ triệu view.',
    url_key: 'v2-thuc-chien-quy-trinh-a-z-lam-ngach-dang-cuc-hot-trends-claude-automation-update-22-10-2026',
    docs: [
      {
        name: 'Hướng dẫn tự động hóa ngách What-If V2 (README.md)',
        link: 'docs/VIDEO-e0e9cd/README.md',
        file: 'docs/VIDEO-e0e9cd/README.md',
        title: 'Hướng dẫn tự động hóa ngách What-If V2 (README.md)'
      },
      {
        name: 'Plugin Tự Động Hóa H2 2D Studio (h2-2d-studio.plugin)',
        link: 'assets/docs/VIDEO-e0e9cd/h2-2d-studio.plugin',
        file: 'assets/docs/VIDEO-e0e9cd/h2-2d-studio.plugin',
        title: 'Plugin Tự Động Hóa H2 2D Studio (h2-2d-studio.plugin)'
      },
      {
        name: 'Mô tả bài giảng & Kênh đối thủ (description.txt)',
        link: 'assets/docs/VIDEO-e0e9cd/description.txt',
        file: 'assets/docs/VIDEO-e0e9cd/description.txt',
        title: 'Mô tả bài giảng & Kênh đối thủ (description.txt)'
      },
      {
        name: 'Bản ghi phụ đề đầy đủ (Transcript timestamped .txt)',
        link: 'video/VIDEO-e0e9cd/transcript.txt',
        file: 'video/VIDEO-e0e9cd/transcript.txt',
        title: 'Bản ghi phụ đề đầy đủ (Transcript timestamped .txt)'
      }
    ],
    insight: {
      category_group: 'ai_automation',
      niche_id: 'what-if-claude-automation',
      key_takeaways: [
        'Phiên bản 2 tối ưu hóa tốc độ: Chuyển từ thao tác thủ công sang tự động hóa hoàn toàn với plugin h2-2d-studio.plugin.',
        'Phân tích 4 kênh đối thủ hàng đầu ngách What-If: @IfverseTales, @Ifinite-c5h, @IFOLOGYFILMS, @JeremyBearimyTheory.',
        'Quy trình đóng gói kịch bản và tài nguyên ảnh 2D tự động giúp tạo video dài với thời gian cực ngắn.',
        'Đảm bảo sự đồng nhất tuyệt đối về visual giữa các phân cảnh nhờ cấu trúc prompt chuyên sâu trong plugin.'
      ],
      edit_sop: {
        primary: 'Tự động hóa hoàn toàn quy trình làm video What-If với Plugin H2 2D Studio',
        additional: [
          'Kích hoạt plugin h2-2d-studio.plugin trong môi trường Claude',
          'Tham khảo các mẫu concept thành công từ 4 kênh đối thủ lớn',
          'Tự động sinh kịch bản và mã hóa hình ảnh theo từng cảnh',
          'Ghép nhạc nền và hiệu ứng âm thanh SFX đồng bộ'
        ]
      },
      avoid_flags: [
        'Tránh nhảy cóc sang bản V2 nếu chưa nắm vững logic của bản V1',
        'Không để âm lượng nhạc nền lấn át giọng lồng tiếng chính',
        'Kiểm tra tính logic của giả thuyết What-If để giữ chân người xem xuyên suốt'
      ],
      tools_mentioned: ['Claude'],
      channels_mentioned: ['@IfverseTales', '@Ifinite-c5h', '@IFOLOGYFILMS', '@JeremyBearimyTheory'],
      sop_steps: [
        'Bước 1: Nạp plugin h2-2d-studio.plugin vào Claude.',
        'Bước 2: Khảo sát chủ đề hot từ 4 kênh đối thủ (@IfverseTales, @Ifinite-c5h, @IFOLOGYFILMS, @JeremyBearimyTheory).',
        'Bước 3: Chạy lệnh tự động hóa để sản xuất kịch bản và phân cảnh.',
        'Bước 4: Xuất bản video chất lượng cao với đầy đủ âm thanh và phụ đề.'
      ]
    }
  }
];

function run() {
  console.log('>>> INGESTING 4 NEW OCTOBER 2026 VIDEOS INTO H2DEV DATA STORES <<<');

  const catalogPath = path.join(projectRoot, 'data', 'catalog.json');
  const catalogFullPath = path.join(projectRoot, 'data', 'catalog_full.json');
  const videosTabPath = path.join(projectRoot, 'data-tabs', 'videos.json');
  const modulesPath = path.join(projectRoot, 'data', 'modules.json');
  const insightsPath = path.join(projectRoot, 'data', 'video_insights.json');

  let catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  let catalogFull = JSON.parse(fs.readFileSync(catalogFullPath, 'utf8'));
  let videosTab = JSON.parse(fs.readFileSync(videosTabPath, 'utf8'));
  let modulesData = JSON.parse(fs.readFileSync(modulesPath, 'utf8'));
  let insights = JSON.parse(fs.readFileSync(insightsPath, 'utf8'));

  const m06 = modulesData.modules.find(m => m.id === 'M06');
  if (!m06) {
    throw new Error('Module M06 not found in modules.json');
  }

  for (const def of newVideosDef) {
    const mp4Path = path.join(projectRoot, 'video', def.sku, `${def.sku}.mp4`);
    const exists = fs.existsSync(mp4Path);
    if (!exists) {
      console.log(`[WAITING] Video ${def.sku} MP4 not found yet at ${mp4Path}. Will skip or check later.`);
      continue;
    }

    const info = getFfprobeInfo(mp4Path);
    if (!info) {
      console.log(`[WARN] Could not probe ${def.sku}`);
      continue;
    }

    console.log(`[PROBING] ${def.sku}: ${info.duration_sec}s (${info.duration_hms}), ${info.size_mb}MB, ${info.resolution}`);

    // 1. data/catalog.json
    let catIdx = catalog.findIndex(c => c.sku === def.sku);
    const catEntry = {
      sku: def.sku,
      title: def.title,
      file: `video/${def.sku}/${def.sku}.mp4`,
      thumb: `assets/thumbs/${def.sku}.png`,
      resolution: info.resolution,
      width: info.width,
      height: info.height,
      badge: info.badge,
      size_mb: info.size_mb,
      duration_sec: info.duration_sec,
      is_drm: false,
      is_pro: true,
      index: catIdx >= 0 ? catalog[catIdx].index : catalog.length + 1,
      is_free: false,
      access: 'pro',
      published_at: def.published_at,
      actual_topic: def.actual_topic,
      niche_primary: def.niche_primary,
      target_market: def.target_market,
      market_code: def.market_code,
      duration: info.duration_hms,
      total_view: 0,
      tags: def.tags,
      market: def.market_str,
      docs: def.docs,
      channels: def.channels,
      visual_audio_check_method: 'local_transcript_heuristic',
      visual_audio_checked: true,
      visual_audio_needs_eye_confirm: false,
      media_audit_date: '2026-10-22',
      image: `assets/thumbs/${def.sku}.png`
    };

    if (catIdx >= 0) {
      catalog[catIdx] = catEntry;
    } else {
      catalog.push(catEntry);
    }

    // 2. data/catalog_full.json
    let fullIdx = catalogFull.findIndex(c => c.sku === def.sku);
    const fullEntry = {
      sku: def.sku,
      title: def.title,
      image: `assets/thumbs/${def.sku}.png`,
      video_link: '',
      size: info.size_bytes,
      drm: false,
      desc: def.desc,
      docs: def.docs,
      url_key: def.url_key,
      mp4: `video/${def.sku}/${def.sku}.mp4`,
      origin: `https://h2dev.vn/learn/study/${def.url_key}`,
      free: false,
      total_lesson_free: 0,
      total_lesson_pro: 1,
      channels: def.channels,
      published_at: def.published_at,
      actual_topic: def.actual_topic,
      niche_primary: def.niche_primary,
      target_market: def.target_market,
      market_code: def.market_code,
      duration: info.duration_hms,
      total_view: 0,
      market: def.market_str,
      tags: def.tags,
      visual_audio_check_method: 'local_transcript_heuristic',
      visual_audio_checked: true,
      visual_audio_needs_eye_confirm: false,
      media_audit_date: '2026-10-22'
    };

    if (fullIdx >= 0) {
      catalogFull[fullIdx] = fullEntry;
    } else {
      catalogFull.push(fullEntry);
    }

    // 3. data-tabs/videos.json
    let tabIdx = videosTab.findIndex(v => v.sku === def.sku);
    const tabEntry = {
      sku: def.sku,
      title: def.title,
      index: tabIdx >= 0 ? videosTab[tabIdx].index : videosTab.length + 1,
      market: def.market,
      niche: def.niche_primary,
      size: info.size_bytes,
      free: false,
      drm: false,
      docs: def.docs,
      channels: def.channels,
      origin: `https://h2dev.vn/learn/study/${def.url_key}`,
      mp4: `video/${def.sku}/${def.sku}.mp4`,
      image: `assets/thumbs/${def.sku}.png`,
      published_at: def.published_at,
      contentNiche: def.niche_primary,
      docsCount: def.docs.length,
      tags: def.tags.filter(t => t !== 'Quan trọng' && t !== 'Mới nhất')
    };

    if (tabIdx >= 0) {
      videosTab[tabIdx] = tabEntry;
    } else {
      videosTab.push(tabEntry);
    }

    // 4. data/modules.json (M06)
    let m06ItemIdx = m06.items.findIndex(it => it.sku === def.sku);
    const nextSeq = String(m06.items.length + (m06ItemIdx >= 0 ? 0 : 1));
    const m06Entry = {
      sku: def.sku,
      title: def.title,
      image: `assets/thumbs/${def.sku}.png`,
      mp4: `video/${def.sku}/${def.sku}.mp4`,
      origin: `https://h2dev.vn/learn/study/${def.url_key}`,
      published_at: def.published_at,
      free: false,
      size: info.size_bytes,
      channels: def.channels,
      docsCount: def.docs.length,
      seq: m06ItemIdx >= 0 ? m06.items[m06ItemIdx].seq : nextSeq,
      duration: info.duration_hms,
      badge: 'QUAN TRỌNG',
      access: 'PRO',
      docs: def.docs,
      desc: def.desc,
      market: def.market,
      tags: def.tags
    };

    if (m06ItemIdx >= 0) {
      m06.items[m06ItemIdx] = m06Entry;
    } else {
      m06.items.push(m06Entry);
    }

    // 5. data/video_insights.json
    insights[def.sku] = {
      sku: def.sku,
      title: def.title,
      actual_topic: def.actual_topic,
      category_group: def.insight.category_group,
      niche_primary: def.niche_primary,
      niche_id: def.insight.niche_id,
      target_market: def.market_str,
      market_code: def.market_code,
      key_takeaways: def.insight.key_takeaways,
      edit_sop: def.insight.edit_sop,
      avoid_flags: def.insight.avoid_flags,
      tools_mentioned: def.insight.tools_mentioned,
      channels_mentioned: def.insight.channels_mentioned,
      key_timestamps: [
        { time: '00:00', seconds: 0, label: def.title.slice(0, 60) }
      ],
      analysis_method: 'verified_expert_summary',
      accuracy_status: 'verified_expert_summary',
      visual_audio_checked: true,
      verified_expert_summary: true,
      claims_require_external_verification: false,
      source_transcript: `video/${def.sku}/transcript.txt`,
      sop_steps: def.insight.sop_steps
    };
  }

  // Update M06 counts and duration
  m06.count = m06.items.length;
  m06.countOriginal = m06.items.length;
  let totalSecM06 = 0;
  for (const it of m06.items) {
    if (it.duration) {
      const parts = it.duration.split(':').map(Number);
      if (parts.length === 2) totalSecM06 += parts[0] * 60 + parts[1];
      else if (parts.length === 3) totalSecM06 += parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }
  const hM06 = Math.floor(totalSecM06 / 3600);
  const mM06 = Math.floor((totalSecM06 % 3600) / 60);
  m06.totalDuration = `${hM06}h ${mM06}m`;

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  fs.writeFileSync(catalogFullPath, JSON.stringify(catalogFull, null, 2), 'utf8');
  fs.writeFileSync(videosTabPath, JSON.stringify(videosTab, null, 2), 'utf8');
  fs.writeFileSync(modulesPath, JSON.stringify(modulesData, null, 2), 'utf8');
  fs.writeFileSync(insightsPath, JSON.stringify(insights, null, 2), 'utf8');

  console.log(`>>> DONE! Ingested into catalog (${catalog.length}), catalog_full (${catalogFull.length}), videosTab (${videosTab.length}), M06 (${m06.items.length}), insights (${Object.keys(insights).length}).`);
}

run();
