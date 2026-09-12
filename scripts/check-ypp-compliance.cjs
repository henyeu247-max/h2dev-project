/**
 * check-ypp-compliance.cjs
 * Công cụ linter tự động kiểm soát tuân thủ chính sách YouTube YPP 2027 & Inauthentic Content.
 * Sử dụng: node scripts/check-ypp-compliance.cjs <đường-dẫn-file-kịch-bản>
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_RULES = [
  {
    category: 'YMYL_MEDICAL_ADVICE',
    name: 'Lời khuyên hoặc cam kết chữa bệnh y khoa',
    pattern: /\b(cure cancer|cures disease|medical prescription|guaranteed cure|bác sĩ khuyên|chữa khỏi hoàn toàn|đặc trị ung thư|thuốc tiên)\b/i,
    severity: 'ERROR',
  },
  {
    category: 'YMYL_FINANCIAL_PROMISE',
    name: 'Cam kết lợi nhuận hoặc xúi giục đầu tư tài chính',
    pattern: /\b(guaranteed return|100% profit|get rich quick|financial advisor recommends|cam kết lãi suất|làm giàu cấp tốc|đầu tư chắc thắng)\b/i,
    severity: 'ERROR',
  },
  {
    category: 'DISTRESSING_ANIMAL_RESCUE',
    name: 'Mô típ cứu trợ động vật giả hoặc gây sốc phản cảm',
    pattern: /\b(rescued from torture|staged rescue|animal suffering|dàn cảnh cứu chó|giải cứu mèo bị bạo hành)\b/i,
    severity: 'ERROR',
  },
  {
    category: 'AI_PERSONA_EXPERT',
    name: 'AI Persona xưng danh chuyên gia y tế/tài chính/pháp lý',
    pattern: /\b(as a licensed doctor|speaking as your lawyer|với tư cách bác sĩ 40 năm|luật sư của bạn khẳng định)\b/i,
    severity: 'ERROR',
  },
  {
    category: 'GENERIC_TEMPLATE_CLICKBAIT',
    name: 'Tiêu đề hoặc mở đầu giật gân lừa dối (misleading clickbait)',
    pattern: /\b(secret the government hides|you will die if you do not watch|bạn sẽ hối hận cả đời nếu không xem)\b/i,
    severity: 'WARNING',
  },
];

function cleanScriptText(rawContent) {
  // Loại bỏ frontmatter nếu có
  let text = rawContent.replace(/^---[\s\S]*?---\s*/, '');
  // Loại bỏ các khối code block hoặc JSON prompt
  text = text.replace(/```[\s\S]*?```/g, '');
  // Loại bỏ các thẻ html hoặc markdown directives
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/^#+\s+.*$/gm, '');
  return text.trim();
}

function checkYppCompliance(filePath) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    return {
      schema: 'h2dev.ypp-2027-compliance.v1',
      ok: false,
      error: `Tệp không tồn tại: ${fullPath}`,
    };
  }

  const rawContent = fs.readFileSync(fullPath, 'utf8');
  const text = cleanScriptText(rawContent);

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  // Tốc độ đọc tự nhiên chuẩn của Voiceover là 135 từ/phút
  const estimatedDurationMinutes = +(wordCount / 135).toFixed(1);

  const errors = [];
  const warnings = [];
  const passedChecks = [];

  // 1. Kiểm tra từ khóa vùng cấm
  for (const rule of FORBIDDEN_RULES) {
    const match = rule.pattern.exec(text);
    if (match) {
      const issue = {
        category: rule.category,
        ruleName: rule.name,
        match: match[0],
      };
      if (rule.severity === 'ERROR') {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    } else {
      passedChecks.push({ rule: rule.category, status: 'PASS' });
    }
  }

  // 2. Kiểm tra độ dài & thời lượng giữ chân AVD (Chuẩn YPP 2027 mục tiêu 8.000h)
  const MIN_WORDS = 1200; // Khoảng 9-10 phút
  if (wordCount < 600) {
    errors.push({
      category: 'DURATION_TOO_SHORT',
      ruleName: 'Kịch bản quá ngắn cho video dài',
      detail: `Độ dài ${wordCount} từ (~${estimatedDurationMinutes} phút). Không đủ tối ưu AVD cho bài toán 8.000 giờ YPP 2027.`,
    });
  } else if (wordCount < MIN_WORDS) {
    warnings.push({
      category: 'DURATION_SUBOPTIMAL',
      ruleName: 'Kịch bản dưới ngưỡng tối ưu 8-12 phút',
      detail: `Độ dài ${wordCount} từ (~${estimatedDurationMinutes} phút). Nên mở rộng lên $\ge 1.400$ từ.`,
    });
  } else {
    passedChecks.push({ rule: 'RETENTION_DURATION', status: 'PASS', words: wordCount, minutes: estimatedDurationMinutes });
  }

  // 3. Kiểm tra Hook 0-15s (200 từ đầu tiên)
  const first200Words = words.slice(0, 200).join(' ');
  const hasQuestionHook = /\?|why|how|before|what if|tại sao|trước khi|điều gì|nghịch lý/i.test(first200Words);
  if (!hasQuestionHook) {
    warnings.push({
      category: 'HOOK_WEAK',
      ruleName: 'Hook mở đầu thiếu câu hỏi hoặc nghịch lý gây tò mò',
      detail: 'Đoạn mở đầu (200 từ đầu) nên có câu hỏi kích thích trí tò mò để hạ tỷ lệ thoát trước 30 giây.',
    });
  } else {
    passedChecks.push({ rule: 'HOOK_STRUCTURE', status: 'PASS' });
  }

  // 4. Kiểm tra trích dẫn nguồn lịch sử / bảo tàng / tư liệu
  const hasCitations = /\b(museum|archive|patent|invented|century|discovered|historian|records|bảo tàng|thế kỷ|sáng chế|lịch sử|tài liệu)\b/i.test(text);
  if (!hasCitations) {
    warnings.push({
      category: 'CITATIONS_MISSING',
      ruleName: 'Thiếu trích dẫn hoặc căn cứ lịch sử/khoa học xác thực',
      detail: 'Nên bổ sung tên bảo tàng, niên đại, hoặc người phát minh để củng cố giá trị giáo dục (educational value).',
    });
  } else {
    passedChecks.push({ rule: 'HISTORICAL_CITATIONS', status: 'PASS' });
  }

  const compliant = errors.length === 0;
  const score = Math.max(0, 100 - (errors.length * 30) - (warnings.length * 10));

  return {
    schema: 'h2dev.ypp-2027-compliance.v1',
    compliant,
    score,
    wordCount,
    estimatedDurationMinutes,
    errors,
    warnings,
    passedChecks,
  };
}

// Chạy trực tiếp qua CLI
if (require.main === module) {
  const targetFile = process.argv[2] || 'raw-niches/US_EverydayHistory/PILOT-01-THE-MIRROR/master-script.md';
  console.log(`Kiểm tra tuân thủ chính sách YPP 2027 cho: ${targetFile}\n`);
  const result = checkYppCompliance(targetFile);

  console.log('=== KẾT QUẢ KIỂM TRA CHÍNH SÁCH YPP 2027 ===');
  console.log(`- Trạng thái: ${result.compliant ? '✓ ĐẠT CHUẨN (COMPLIANT)' : '✗ KHÔNG ĐẠT (VIOLATION)'}`);
  console.log(`- Điểm số: ${result.score}/100`);
  console.log(`- Số từ: ${result.wordCount} từ (Ước tính thời lượng: ${result.estimatedDurationMinutes} phút)`);

  if (result.errors && result.errors.length > 0) {
    console.log('\n❌ LỖI NGHIÊM TRỌNG (BẮT BUỘC SỬA):');
    result.errors.forEach((e) => console.log(`  - [${e.category}] ${e.ruleName}: ${e.detail || e.match}`));
  }

  if (result.warnings && result.warnings.length > 0) {
    console.log('\n⚠️ CẢNH BÁO TỐI ƯU:');
    result.warnings.forEach((w) => console.log(`  - [${w.category}] ${w.ruleName}: ${w.detail || w.match}`));
  }

  if (result.passedChecks && result.passedChecks.length > 0) {
    console.log('\n✅ CÁC MỤC ĐẠT CHUẨN:');
    result.passedChecks.forEach((p) => console.log(`  - ${p.rule}: PASS`));
  }

  process.exit(result.compliant ? 0 : 1);
}

module.exports = { checkYppCompliance };
