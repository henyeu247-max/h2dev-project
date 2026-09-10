import sys

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Thêm icon raw trong ICONS nếu cần
old_tabs_def = """    const TABS = [
      { id: 'tongquan', icon: ICONS.home, name: 'Tổng quan' },
      { id: 'lotrinh', icon: ICONS.doc, name: 'Lộ trình' },
      { id: 'video', icon: ICONS.video, name: 'Video' },
      { id: 'ngachxanh', icon: ICONS.niche, name: 'Ngách xanh' },
      { id: 'kichban', icon: ICONS.doc, name: 'Tài liệu' },
      { id: 'nguonreup', icon: ICONS.link, name: 'Nguồn reup' },
      { id: 'kenh', icon: ICONS.channel, name: 'Kênh mẫu' },
      { id: 'chienluoc', icon: ICONS.strategy, name: 'Chiến lược' }
    ];"""

new_tabs_def = """    const TABS = [
      { id: 'tongquan', icon: ICONS.home, name: 'Tổng quan' },
      { id: 'lotrinh', icon: ICONS.doc, name: 'Lộ trình' },
      { id: 'video', icon: ICONS.video, name: 'Video' },
      { id: 'ngachxanh', icon: ICONS.niche, name: 'Ngách xanh' },
      { id: 'kichban', icon: ICONS.doc, name: 'Tài liệu' },
      { id: 'nguonreup', icon: ICONS.link, name: 'Nguồn reup' },
      { id: 'kenh', icon: ICONS.channel, name: 'Kênh mẫu' },
      { id: 'rawkenh', icon: ICONS.search, name: 'Raw Kênh (95)' },
      { id: 'chienluoc', icon: ICONS.strategy, name: 'Chiến lược' }
    ];"""

if old_tabs_def in content:
    content = content.replace(old_tabs_def, new_tabs_def)
    pass
else:
    pass

# 2. Thêm switch case 'rawkenh'
old_switch = """          case 'kenh': html = await renderKenh(); break;
          case 'chienluoc': html = await renderChienLuoc(); break;"""

new_switch = """          case 'kenh': html = await renderKenh(); break;
          case 'rawkenh': html = await renderRawKenh(); break;
          case 'chienluoc': html = await renderChienLuoc(); break;"""

if old_switch in content:
    content = content.replace(old_switch, new_switch)
    pass
else:
    pass

# 3. Định nghĩa hàm renderRawKenh
raw_kenh_func = """
    async function renderRawKenh() {
      let rawData;
      try {
        rawData = await loadJSON('data-tabs/raw-kenh-mau.json');
      } catch (e) {
        rawData = { records: [] };
      }
      const records = rawData.records || [];
      const q = (state.rawQ || '').trim().toLowerCase();
      const currentNiche = state.rawNiche || '';

      const nicheCounts = records.reduce((acc, r) => {
        const n = r.niche || 'Chưa phân loại';
        acc[n] = (acc[n] || 0) + 1;
        return acc;
      }, {});

      const sortedNiches = Object.keys(nicheCounts).sort((a,b) => nicheCounts[b] - nicheCounts[a]);

      const filtered = records.filter(r => {
        const ch = r.channel || {};
        const title = (ch.title || '').toLowerCase();
        const handle = (ch.handle || '').toLowerCase();
        const fname = (r.fileName || '').toLowerCase();
        const n = r.niche || 'Chưa phân loại';
        if (currentNiche && n !== currentNiche) return false;
        if (q && !title.includes(q) && !handle.includes(q) && !fname.includes(q) && !n.toLowerCase().includes(q)) return false;
        return true;
      });

      return `
        <div class="space-y-6">
          <div class="bg-ink-800/80 p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <span class="text-brand-400">📸</span> Kho Ảnh Raw Kênh Mẫu (95 Ảnh Đã Chuẩn Hóa)
              </h2>
              <p class="text-sm text-gray-400 mt-1">
                Data bóc tách qua <strong>Vision AI + OCR + vidIQ</strong>: đầy đủ ảnh gốc, tên kênh, handle, ngách mục tiêu.
              </p>
            </div>
            <div class="flex items-center gap-2 w-full md:w-auto">
              <input type="text" placeholder="Tìm kênh, ngách, file..." value="${esc(state.rawQ || '')}"
                oninput="state.rawQ=this.value; renderTab('rawkenh')"
                class="bg-ink-900 border border-white/10 text-white rounded-xl px-4 py-2 text-sm w-full md:w-64 focus:outline-none focus:border-brand-500">
              ${(state.rawQ || state.rawNiche) ? `
                <button onclick="state.rawQ=''; state.rawNiche=''; renderTab('rawkenh')" class="text-xs text-brand-300 hover:text-white bg-white/5 px-3 py-2 rounded-xl whitespace-nowrap">
                  Xóa lọc
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Chip ngách -->
          <div class="flex flex-wrap gap-2 pt-1">
            <button onclick="state.rawNiche=''; renderTab('rawkenh')"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold transition ${!currentNiche ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'bg-ink-800 text-gray-400 hover:text-white hover:bg-ink-700'}">
              Tất cả (${records.length})
            </button>
            ${sortedNiches.map(n => `
              <button onclick="state.rawNiche='${esc(n)}'; renderTab('rawkenh')"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold transition ${currentNiche === n ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'bg-ink-800 text-gray-400 hover:text-white hover:bg-ink-700'}">
                ${esc(n)} (${nicheCounts[n]})
              </button>
            `).join('')}
          </div>

          <!-- Lưới card 95 ảnh -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${filtered.map(r => {
              const ch = r.channel || {};
              const vision = r.visionAnalysis || {};
              const imgSrc = 'assets/raw-kenh/' + esc(r.fileName);
              const ytSearchUrl = ch.url || ('https://www.youtube.com/results?search_query=' + encodeURIComponent(ch.title || ch.handle || ''));
              return `
                <div class="bg-ink-800/90 rounded-2xl border border-white/5 overflow-hidden flex flex-col hover:border-brand-500/30 transition group">
                  <!-- Ảnh preview màn hình -->
                  <div class="relative bg-ink-950 aspect-video overflow-hidden border-b border-white/5">
                    <img src="${imgSrc}" alt="${esc(ch.title)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300 cursor-pointer"
                      onclick="window.open('${imgSrc}', '_blank')" loading="lazy" onerror="this.src='assets/placeholder.svg'">
                    <span class="absolute top-2 left-2 bg-ink-900/80 backdrop-blur px-2.5 py-0.5 rounded-lg text-[11px] font-mono text-gray-300 border border-white/10">
                      ${esc(r.id)}
                    </span>
                    <span class="absolute top-2 right-2 bg-brand-600/90 backdrop-blur text-white text-[11px] font-medium px-2.5 py-0.5 rounded-lg shadow">
                      ${esc(r.niche || 'Chưa rõ')}
                    </span>
                  </div>

                  <!-- Thông tin kênh bóc tách -->
                  <div class="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div class="flex items-start justify-between gap-2">
                        <h3 class="font-bold text-base text-white group-hover:text-brand-300 transition line-clamp-1">
                          ${esc(ch.title || 'Chưa rõ tên')}
                        </h3>
                        ${ch.handle ? `<span class="text-xs text-brand-400 font-mono bg-brand-500/10 px-2 py-0.5 rounded shrink-0">${esc(ch.handle)}</span>` : ''}
                      </div>

                      ${vision.mainTopic ? `
                        <p class="text-xs text-gray-300 mt-2 bg-white/5 p-2 rounded-lg border border-white/5">
                          <span class="text-amber-400 font-semibold">Chủ đề:</span> ${esc(vision.mainTopic)}
                        </p>
                      ` : ''}

                      ${vision.videoTitles && vision.videoTitles.length ? `
                        <div class="mt-2 text-xs text-gray-400">
                          <span class="text-gray-500 font-medium">Video mẫu:</span>
                          <p class="italic text-gray-300 line-clamp-2 mt-0.5">"${esc(vision.videoTitles[0])}"</p>
                        </div>
                      ` : ''}
                    </div>

                    <div class="pt-4 mt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span class="text-gray-500 font-mono text-[11px]">${esc(r.fileName)}</span>
                      <a href="${esc(ytSearchUrl)}" target="_blank" rel="noopener"
                        class="inline-flex items-center gap-1 text-brand-300 hover:text-white bg-brand-500/20 hover:bg-brand-500 px-3 py-1.5 rounded-lg transition font-medium">
                        Mở YouTube ↗
                      </a>
                    </div>
                  </div>
                </div>
              `;
            }).join('') || '<div class="col-span-full p-12 text-center text-gray-400">Không tìm thấy kênh phù hợp với bộ lọc.</div>'}
          </div>
        </div>
      `;
    }
"""

if "async function renderRawKenh()" not in content:
    # chèn vào trước function renderKenh
    target_pos = content.find("async function renderKenh()")
    if target_pos != -1:
        content = content[:target_pos] + raw_kenh_func + "\n\n    " + content[target_pos:]
    else:
        raise SystemExit("Không tìm thấy điểm chèn renderKenh trong index.html")

with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)
