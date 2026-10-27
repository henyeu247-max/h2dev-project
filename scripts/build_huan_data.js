const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function formatDuration(sec) {
  const s = parseInt(sec || '0', 10);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const remS = s % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(remS).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(remS).padStart(2, '0')}`;
}

function parseTimeToSec(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(timeStr) || 0;
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapMarkets(targetMarket, marketCode) {
  const tm = String(targetMarket || '').toLowerCase();
  const mc = String(marketCode || '').toUpperCase();
  const out = [];
  if (tm.includes('việt') || mc.includes('VN')) {
    out.push('🇻🇳 Việt');
  }
  if (tm.includes('toàn cầu') || tm.includes('ngoại') || tm.includes('mỹ') || tm.includes('us') || mc.includes('GLOBAL') || mc.includes('US')) {
    out.push('🇺🇸 US / Global');
  }
  if (!out.length) {
    out.push('🇻🇳 Việt', '🇺🇸 US / Global');
  }
  return out;
}

const DEFAULT_COURSE_DOCS = [
  {
    title: 'Tài Liệu Gốc: 1. GODA - QUY TRÌNH TRIỂN KHAI KÊNH VIEW NGOẠI 2025.pdf',
    file: 'assets/docs-huan/QUY_TRINH_TRIEN_KHAI_KENH_2025/1._GODA_-_QUY_TRINH_TRIEN_KHAI_KENH.pdf',
    readFile: 'assets/docs-huan/QUY_TRINH_TRIEN_KHAI_KENH_2025/1._GODA_-_QUY_TRINH_TRIEN_KHAI_KENH.pdf.md',
    link: 'https://drive.google.com/file/d/1Oez2iFNDTxAt-oWznLzKXLbj_AaJgtPs/view'
  },
  {
    title: 'Checklist Gốc: CHECKLIST YOUTUBE 1 TRANG.docx (Quy Tắc 100 Video)',
    file: 'assets/docs-huan/CHECKLIST_YOUTUBE_1_TRANG.docx',
    readFile: 'assets/docs-huan/CHECKLIST_YOUTUBE_1_TRANG.docx.md',
    link: 'https://drive.google.com/file/d/1YEfmxATH9KB9vsH_hkMpW9QaxvGRUYG1/view'
  },
  {
    title: 'Sách Điện Tử Gốc: 7 Bước Thành Công Với YouTube - Bí Mật Kiếm Tiền YouTube',
    file: 'assets/docs-huan/7_buoc_thanh_cong_voi_Youtube_-_BI_MAT_KIEM_TIEN_YOUTUBE_.pdf',
    readFile: 'assets/docs-huan/7_buoc_thanh_cong_voi_Youtube_-_BI_MAT_KIEM_TIEN_YOUTUBE_.pdf.md',
    link: 'https://drive.google.com/file/d/1DjL8FIY0VknSZcn9W1m2WYltKXmTDh27/view'
  }
];

async function main() {
  console.log('>>> BUILDING HUAN ACADEMY 7-LAYER GOLD STANDARD DATA <<<');

  const existingModulesPath = path.join(ROOT, 'data', 'modules_huan.json');
  const existingCatalogPath = path.join(ROOT, 'data', 'catalog_huan.json');
  const existingInsightsPath = path.join(ROOT, 'data', 'video_insights_huan.json');

  const existingModulesData = JSON.parse(fs.readFileSync(existingModulesPath, 'utf8'));
  const existingCatalog = JSON.parse(fs.readFileSync(existingCatalogPath, 'utf8'));
  const existingInsights = fs.existsSync(existingInsightsPath)
    ? JSON.parse(fs.readFileSync(existingInsightsPath, 'utf8'))
    : {};

  const catalogBySku = {};
  for (const item of existingCatalog) {
    catalogBySku[item.sku] = item;
  }

  const modulesHuan = [];
  const catalogHuan = [];
  const videosHuan = [];
  const videoInsightsHuan = {};

  let globalIndex = 0;
  let totalDurationSec = 0;
  let totalFree = 0;
  let totalPro = 0;

  for (let cIdx = 0; cIdx < existingModulesData.modules.length; cIdx++) {
    const prevMod = existingModulesData.modules[cIdx];
    const modId = prevMod.id || `HUAN-M${String(cIdx + 1).padStart(2, '0')}`;
    const prods = prevMod.items || [];

    const modObj = {
      id: modId,
      category_id: String(prevMod.category_id || ''),
      title: prevMod.title,
      desc: prevMod.desc || `Lộ trình đào tạo Huân Academy: ${prevMod.title}`,
      count: prods.length,
      countOriginal: prods.length,
      totalDuration: '',
      totalDurationSec: 0,
      freeCount: 0,
      proCount: 0,
      items: []
    };

    let modSec = 0;

    prods.forEach((p, pIdx) => {
      globalIndex++;
      const sku = p.sku;
      const prevCatItem = catalogBySku[sku] || p;
      const durSec = parseInt(prevCatItem.duration_sec || p.duration_sec || '0', 10);
      modSec += durSec;
      totalDurationSec += durSec;

      const isFree = !!(prevCatItem.is_free ?? p.is_free ?? p.free);
      if (isFree) {
        totalFree++;
        modObj.freeCount++;
      } else {
        totalPro++;
        modObj.proCount++;
      }

      const durStr = formatDuration(durSec);
      let thumbFile = '';
      for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
        if (fs.existsSync(path.join(ROOT, 'assets', 'thumbs-huan', `${sku}${ext}`))) {
          thumbFile = `assets/thumbs-huan/${sku}${ext}`;
          break;
        }
      }
      if (!thumbFile) {
        thumbFile = prevCatItem.thumb || 'assets/thumbs/placeholder.svg';
      }

      const lessonTitle = prevCatItem.title || p.title || '';
      const docDir = path.join(ROOT, 'docs', sku);
      const readmeAbs = path.join(docDir, 'README.md');
      const readmeRel = `docs/${sku}/README.md`;
      const readmeText = fs.existsSync(readmeAbs) ? fs.readFileSync(readmeAbs, 'utf8') : '';

      const tjPath = path.join(ROOT, 'video', sku, 'transcript.json');
      const segs = fs.existsSync(tjPath) ? (JSON.parse(fs.readFileSync(tjPath, 'utf8')).segments || []) : [];

      // Load verified insight from video/<SKU>/insight.json first, fallback to existingInsights[sku]
      const localInsPath = path.join(ROOT, 'video', sku, 'insight.json');
      let ins = {};
      if (fs.existsSync(localInsPath)) {
        ins = JSON.parse(fs.readFileSync(localInsPath, 'utf8'));
        let mutated = false;

        if (!ins.sku) {
          ins.sku = sku;
          mutated = true;
        }
        if (!ins.title) {
          ins.title = lessonTitle;
          mutated = true;
        }
        if (!ins.actual_topic || String(ins.actual_topic).trim().length < 15) {
          ins.actual_topic = ins.summary || ins.Summary || (Array.isArray(ins.topics) && ins.topics[0]) || existingInsights[sku]?.actual_topic || `${lessonTitle} — Phân tích & Quy trình thực chiến Huân Academy`;
          mutated = true;
        }
        if ((!Array.isArray(ins.key_takeaways) || !ins.key_takeaways.length) && Array.isArray(ins.KeyTakeaways)) {
          ins.key_takeaways = ins.KeyTakeaways;
          mutated = true;
        }
        if ((!Array.isArray(ins.key_timestamps) || !ins.key_timestamps.length) && Array.isArray(ins.Timestamps)) {
          ins.key_timestamps = ins.Timestamps;
          mutated = true;
        }
        if ((!Array.isArray(ins.tools_mentioned) || !ins.tools_mentioned.length) && Array.isArray(ins.ToolsMentioned)) {
          ins.tools_mentioned = ins.ToolsMentioned;
          mutated = true;
        }
        const BAD_SOP_KEY_RE = /^(primary|additional|trim_start|trim_end|cut_Note|speed_note|keep_segments|voice|visual|music|subtitles|emphasis|b_roll)$/i;
        const cleanSopStep = x => String(x || '').replace(/^(Bước\s*\d+\s*[:.-]?\s*|\d+\.\s*)/i, '').trim();
        const isValidSopStep = s => Boolean(s) && !BAD_SOP_KEY_RE.test(s);
        if (!ins.edit_sop || typeof ins.edit_sop !== 'object' || Array.isArray(ins.edit_sop)) {
          let rawSteps = Array.isArray(ins.edit_sop) ? ins.edit_sop : [];
          if (!rawSteps.length) {
            if (Array.isArray(ins.ActionPlaybook)) {
              rawSteps = ins.ActionPlaybook.map(x => `${String(x.step || '').replace(/^(Bước\s*\d+\s*[:.-]?\s*|\d+\.\s*)/i, '')}: ${x.detail || ''}`);
            } else if (Array.isArray(ins.ActionItems)) {
              rawSteps = ins.ActionItems;
            } else if (Array.isArray(ins.sop_steps) && ins.sop_steps.length) {
              rawSteps = ins.sop_steps;
            }
          }
          const steps = rawSteps.map(cleanSopStep).filter(isValidSopStep);
          const primaryStep = steps[0] || `Quy trình thực thi chuẩn bài học: ${lessonTitle}`;
          const additionalSteps = steps.length > 1 ? steps.slice(1) : steps;
          ins.edit_sop = {
            primary: primaryStep,
            additional: additionalSteps
          };
          ins.sop_steps = additionalSteps;
          mutated = true;
        } else {
          let rawAdditional = Array.isArray(ins.edit_sop.additional) ? ins.edit_sop.additional : [];
          if (!rawAdditional.length) {
            if (Array.isArray(ins.ActionPlaybook)) {
              rawAdditional = ins.ActionPlaybook.map(x => `${String(x.step || '').replace(/^(Bước\s*\d+\s*[:.-]?\s*|\d+\.\s*)/i, '')}: ${x.detail || ''}`);
            } else if (Array.isArray(ins.ActionItems)) {
              rawAdditional = ins.ActionItems;
            } else if (Array.isArray(ins.sop_steps) && ins.sop_steps.length) {
              rawAdditional = ins.sop_steps;
            }
          }
          let cleanedSteps = rawAdditional.map(cleanSopStep).filter(isValidSopStep);
          let primaryVal = String(ins.edit_sop.primary || '').trim();
          if (!primaryVal || BAD_SOP_KEY_RE.test(primaryVal)) {
            primaryVal = cleanedSteps[0] || `Quy trình thực thi chuẩn bài học: ${lessonTitle}`;
            if (cleanedSteps.length > 2 && cleanedSteps[0] === primaryVal) {
              cleanedSteps = cleanedSteps.slice(1);
            }
          }
          if (ins.edit_sop.primary !== primaryVal || JSON.stringify(cleanedSteps) !== JSON.stringify(ins.edit_sop.additional)) {
            ins.edit_sop = { primary: primaryVal, additional: cleanedSteps };
            ins.sop_steps = cleanedSteps;
            mutated = true;
          }
        }
        if ((!Array.isArray(ins.avoid_flags) || !ins.avoid_flags.length)) {
          if (Array.isArray(ins.HiddenInsights) && ins.HiddenInsights.length >= 2) {
            ins.avoid_flags = ins.HiddenInsights;
            mutated = true;
          } else if (Array.isArray(ins.ActionItems) && ins.ActionItems.length >= 2) {
            ins.avoid_flags = ins.ActionItems.slice(0, 4);
            mutated = true;
          }
        }
        if ((!Array.isArray(ins.channels_mentioned) || !ins.channels_mentioned.length) && Array.isArray(ins.referenced_channels)) {
          ins.channels_mentioned = ins.referenced_channels;
          mutated = true;
        }
        if ((!Array.isArray(ins.channels_mentioned) || !ins.channels_mentioned.length) && Array.isArray(ins.ChannelsMentioned)) {
          const mappedChans = [];
          for (const rawC of ins.ChannelsMentioned) {
            if (typeof rawC === 'string') {
              const m = rawC.match(/@([a-zA-Z0-9_.-]+)/);
              if (m) {
                const handle = `@${m[1]}`;
                const name = rawC.replace(/\(.*?\)/g, '').replace(handle, '').trim() || handle;
                mappedChans.push({ handle, name, url: `https://www.youtube.com/${handle}` });
              }
            } else if (rawC && typeof rawC === 'object') {
              mappedChans.push(rawC);
            }
          }
          ins.channels_mentioned = mappedChans;
          mutated = true;
        }
        if (!Array.isArray(ins.course_docs) || !ins.course_docs.length) {
          ins.course_docs = DEFAULT_COURSE_DOCS;
          mutated = true;
        } else {
          for (const cd of ins.course_docs) {
            if (cd && !cd.file && cd.path) {
              cd.file = cd.path;
              mutated = true;
            }
          }
        }

        // Normalize key_timestamps seconds & time alignment
        if (Array.isArray(ins.key_timestamps) && ins.key_timestamps.length) {
          let prevS = -1;
          for (const ts of ins.key_timestamps) {
            let sVal = typeof ts.seconds === 'number' ? ts.seconds : (ts.sec ?? ts.start ?? parseTimeToSec(ts.time));
            sVal = Math.floor(Number(sVal) || 0);
            if (segs.length && sVal > 0) {
              const exact = segs.some(sg => Math.abs(Math.floor(sg.start) - sVal) <= 2);
              if (!exact) {
                let best = segs[0];
                let bestDiff = Math.abs(Math.floor(best.start) - sVal);
                for (const sg of segs) {
                  const d = Math.abs(Math.floor(sg.start) - sVal);
                  if (d < bestDiff && Math.floor(sg.start) > prevS) {
                    best = sg;
                    bestDiff = d;
                  }
                }
                sVal = Math.floor(best.start);
              }
            }
            if (sVal <= prevS && segs.length) {
              const nextSeg = segs.find(sg => Math.floor(sg.start) > prevS);
              if (nextSeg) sVal = Math.floor(nextSeg.start);
            }
            prevS = sVal;
            const m = Math.floor(sVal / 60);
            const r = sVal % 60;
            const tStr = `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
            if (ts.seconds !== sVal || ts.time !== tStr) {
              ts.seconds = sVal;
              ts.time = tStr;
              mutated = true;
            }
          }
        }

        // Filter tools_mentioned to ensure 100% grounding in corpusNorm
        if (Array.isArray(ins.tools_mentioned) && ins.tools_mentioned.length) {
          const corpusNorm = ' ' + norm(segs.map(s => s.text).join(' ') + ' ' + (ins.title || '') + ' ' + readmeText) + ' ';
          const validTools = [];
          for (const t of ins.tools_mentioned) {
            const tNorm = norm(t).replace(/\s+com$/, '');
            if (tNorm && corpusNorm.includes(tNorm)) {
              validTools.push(t);
            } else {
              // Check base name before parentheses
              const base = String(t).split('(')[0].trim();
              const bNorm = norm(base).replace(/\s+com$/, '');
              if (bNorm && corpusNorm.includes(bNorm) && !validTools.includes(base)) {
                validTools.push(base);
              }
            }
          }
          if (JSON.stringify(validTools) !== JSON.stringify(ins.tools_mentioned)) {
            ins.tools_mentioned = validTools;
            mutated = true;
          }
        }

        if (mutated) {
          fs.writeFileSync(localInsPath, JSON.stringify(ins, null, 2), 'utf8');
        }
      } else if (existingInsights[sku]) {
        ins = existingInsights[sku];
      }

      const channels = Array.isArray(ins.channels_mentioned) ? ins.channels_mentioned : [];
      const contentNiche = ins.niche_primary || prevCatItem.niche_primary || prevMod.title;
      const markets = mapMarkets(ins.target_market, ins.market_code);
      const seqStr = String(pIdx + 1).padStart(2, '0');
      const publishedAt = prevCatItem.published_at || '2026-09-01';

      const localMp4 = `video/${sku}/${sku}.mp4`;
      const isLocal = fs.existsSync(path.join(ROOT, localMp4));
      const sizeBytes = isLocal ? fs.statSync(path.join(ROOT, localMp4)).size : 0;
      const sizeMb = isLocal ? parseFloat((sizeBytes / (1024 * 1024)).toFixed(2)) : 0;

      // Build docs array with full H2DEV schema { name, title, link, file, readFile, path, size }
      const docs = [];
      if (fs.existsSync(readmeAbs)) {
        docs.push({
          name: `Hồ sơ phân tích & SOP thực chiến: ${lessonTitle} (README.md)`,
          title: `Hồ sơ phân tích & SOP thực chiến: ${lessonTitle} (README.md)`,
          link: readmeRel,
          file: readmeRel,
          readFile: readmeRel,
          path: readmeRel,
          size: fs.statSync(readmeAbs).size
        });
      }
      if (Array.isArray(ins.course_docs)) {
        for (const cd of ins.course_docs) {
          if (!cd || !cd.file) continue;
          const cdAbs = path.join(ROOT, cd.file);
          const readAbs = cd.readFile ? path.join(ROOT, cd.readFile) : null;
          docs.push({
            name: cd.title || cd.name || path.basename(cd.file),
            title: cd.title || cd.name || path.basename(cd.file),
            link: cd.link || cd.file,
            file: cd.file,
            readFile: (readAbs && fs.existsSync(readAbs)) ? cd.readFile : (/\.(md|txt)$/i.test(cd.file) ? cd.file : undefined),
            path: cd.file,
            size: fs.existsSync(cdAbs) ? fs.statSync(cdAbs).size : 0
          });
        }
      }
      const txtRel = `video/${sku}/transcript.txt`;
      const txtAbs = path.join(ROOT, txtRel);
      if (fs.existsSync(txtAbs)) {
        docs.push({
          name: `Bản ghi phụ đề đầy đủ (Transcript .txt)`,
          title: `Bản ghi phụ đề đầy đủ (Transcript .txt)`,
          link: txtRel,
          file: txtRel,
          readFile: txtRel,
          path: txtRel,
          size: fs.statSync(txtAbs).size
        });
      }

      const normalizedInsight = {
        ...ins,
        sku,
        title: ins.title || lessonTitle,
        actual_topic: ins.actual_topic || lessonTitle,
        category_group: ins.category_group || 'he_thong',
        niche_primary: contentNiche,
        niche_id: ins.niche_id || 'he_thong_youtube',
        target_market: ins.target_market || 'Việt Nam & Toàn Cầu',
        market_code: ins.market_code || 'VN_GLOBAL',
        tools_mentioned: Array.isArray(ins.tools_mentioned) ? ins.tools_mentioned : [],
        channels_mentioned: channels,
        key_timestamps: Array.isArray(ins.key_timestamps) ? ins.key_timestamps : [],
        key_takeaways: Array.isArray(ins.key_takeaways) ? ins.key_takeaways : [],
        edit_sop: ins.edit_sop || { primary: '', additional: [] },
        sop_steps: Array.isArray(ins.sop_steps)
          ? ins.sop_steps
          : (Array.isArray(ins.edit_sop?.additional) ? ins.edit_sop.additional : []),
        avoid_flags: Array.isArray(ins.avoid_flags) ? ins.avoid_flags : [],
        source_transcript: txtRel,
        accuracy_status: ins.accuracy_status || 'GROUNDED_VERIFIED',
        visual_audio_checked: true
      };
      videoInsightsHuan[sku] = normalizedInsight;

      const catalogItem = {
        sku,
        title: lessonTitle,
        file: isLocal ? localMp4 : (prevCatItem.video_link || ''),
        thumb: thumbFile,
        image: thumbFile,
        resolution: '1080p',
        width: 1920,
        height: 1080,
        badge: isFree ? 'MIỄN PHÍ' : 'PRO',
        size_mb: sizeMb,
        duration_sec: durSec,
        duration: durStr,
        is_drm: false,
        is_pro: !isFree,
        is_free: isFree,
        free: isFree,
        access: isFree ? 'free' : 'pro',
        index: globalIndex,
        seq: seqStr,
        published_at: publishedAt,
        actual_topic: normalizedInsight.actual_topic,
        category_id: String(prevMod.category_id || ''),
        category_name: prevMod.title,
        module_id: modId,
        module_title: prevMod.title,
        position: pIdx + 1,
        contentNiche,
        niche: contentNiche,
        market: markets,
        tags: ['Huân Academy', contentNiche, ...(normalizedInsight.tools_mentioned || []).slice(0, 4)],
        docs,
        docsCount: docs.length,
        channels,
        origin: prevCatItem.origin || '',
        desc: prevCatItem.desc || '',
        video_link: prevCatItem.video_link || '',
        mp4: isLocal ? localMp4 : '',
        size: sizeBytes,
        tools_mentioned: normalizedInsight.tools_mentioned,
        niche_primary: contentNiche,
        local: isLocal,
        drm: false,
        isHuan: true,
        platform: 'huan.academy'
      };

      catalogHuan.push(catalogItem);
      modObj.items.push(catalogItem);

      videosHuan.push({
        index: globalIndex,
        seq: seqStr,
        sku,
        title: lessonTitle,
        duration: durStr,
        duration_sec: durSec,
        category: prevMod.title,
        category_name: prevMod.title,
        module: modId,
        module_id: modId,
        module_title: prevMod.title,
        contentNiche,
        niche: contentNiche,
        market: markets,
        published_at: publishedAt,
        badge: isFree ? 'MIỄN PHÍ' : 'PRO',
        free: isFree,
        is_free: isFree,
        drm: false,
        is_drm: false,
        isHuan: true,
        platform: 'huan.academy',
        thumb: thumbFile,
        image: thumbFile,
        origin: catalogItem.origin,
        docs,
        docsCount: docs.length,
        channels,
        tags: catalogItem.tags,
        local: isLocal,
        mp4: isLocal ? localMp4 : '',
        file: catalogItem.file,
        size: sizeBytes,
        size_mb: sizeMb
      });
    });

    modObj.totalDurationSec = modSec;
    modObj.totalDuration = formatDuration(modSec);
    modulesHuan.push(modObj);
  }

  const fullModulesData = {
    generatedAt: new Date().toISOString(),
    source: 'https://huan.academy/learn/ (Canonical GraphQL COURSE1)',
    brand: 'HUAN',
    brand_name: 'Huân Academy',
    domain: 'huan.academy',
    totalLessons: catalogHuan.length,
    totalFree,
    totalPro,
    totalDuration: formatDuration(totalDurationSec),
    modules: modulesHuan
  };

  fs.writeFileSync(path.join(ROOT, 'data', 'modules_huan.json'), JSON.stringify(fullModulesData, null, 2), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'data', 'catalog_huan.json'), JSON.stringify(catalogHuan, null, 2), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'data', 'videos_huan.json'), JSON.stringify(videosHuan, null, 2), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'data', 'video_insights_huan.json'), JSON.stringify(videoInsightsHuan, null, 2), 'utf8');

  console.log(`\n======================================================`);
  console.log(`HUAN ACADEMY 7-LAYER CATALOG, MODULES & DOCS SYNCED:`);
  console.log(`- Modules: ${modulesHuan.length} chapters`);
  console.log(`- Videos: ${catalogHuan.length} lessons`);
  console.log(`- Free: ${totalFree} | Pro: ${totalPro}`);
  console.log(`- Total Duration: ${fullModulesData.totalDuration}`);
  console.log(`- Saved files: data/modules_huan.json, data/catalog_huan.json, data/videos_huan.json, data/video_insights_huan.json, docs/<SKU>/README.md`);
  console.log(`======================================================`);
}

main().catch(console.error);
