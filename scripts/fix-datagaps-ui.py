import sys

with open('D:/YTB/H2DEV-Project/index.html', encoding='utf-8') as f:
    html = f.read()

OLD_MARKER = 'id="raw-data-gaps" style="background:rgba(56,189,248,0.08)'
if OLD_MARKER not in html:
    print('OLD already replaced or not found')
    sys.exit(0)

# Find the full block start (go back to find the ${dataGaps conditional)
start_marker = '              ${dataGaps && Object.keys(dataGaps).length ? `\n              <div id="raw-data-gaps"'
end_marker = "              </div>` : ''}"

start_idx = html.find(start_marker)
end_idx = html.find(end_marker, start_idx) + len(end_marker)

old_block = html[start_idx:end_idx]
print(f'OLD block length: {len(old_block)}')
print(f'OLD starts with: {repr(old_block[:80])}')
print(f'OLD ends with: {repr(old_block[-60:])}')

NEW_BLOCK = r"""              ${dataGaps && Object.keys(dataGaps).length ? (() => {
                const GAP_LABELS = {
                  liveSnapshotRefreshed: 'Live snapshot',
                  thumbnailOcrVisualScoring10of10: 'Thumbnail 10/10',
                  retentionAvdProxy: 'Retention proxy'
                };
                const gapEntries = Object.entries(dataGaps);
                const openGaps = gapEntries.filter(([, g]) => g && g.status && !g.status.startsWith('COMPLETED') && !g.status.startsWith('REFRESHED') && !g.status.startsWith('PROXY_ACCEPTED'));
                const allResolved = openGaps.length === 0;
                const liveEntry = (gapEntries.find(([k]) => k === 'liveSnapshotRefreshed') || [])[1];
                const lastAuditLabel = liveEntry && liveEntry.status && liveEntry.status.includes('2026_09_14') ? '14/09/2026' : 'xem chi tiết';
                if (allResolved) {
                  return `
              <div id="raw-data-gaps" style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.28); border-radius:0.875rem; padding:0.65rem 1rem;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; flex-wrap:wrap;">
                  <div style="display:flex; align-items:center; gap:0.4rem;">
                    <span>✅</span>
                    <span style="font-size:0.78rem; font-weight:800; color:#34d399;">Kiểm định Data Gaps — Hoàn tất (${gapEntries.length}/${gapEntries.length} resolved)</span>
                  </div>
                  <span style="font-size:0.68rem; color:#64748b;">Audit lần cuối: ${lastAuditLabel}</span>
                </div>
                <div style="margin-top:0.5rem; display:flex; flex-wrap:wrap; gap:0.4rem;">
                  ${gapEntries.map(([key, gap]) => `<span style="font-size:0.68rem; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#34d399; padding:0.12rem 0.5rem; border-radius:0.4rem; font-weight:600;" title="${esc(gap.currentEvidence || '')}">✓ ${esc(GAP_LABELS[key] || key)}</span>`).join('')}
                </div>
              </div>`;
                }
                return `
              <div id="raw-data-gaps" style="background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.32); border-radius:0.875rem; padding:0.9rem 1.1rem;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.6rem;">
                  <div style="display:flex; align-items:center; gap:0.4rem;">
                    <span>⚠️</span>
                    <span style="font-size:0.78rem; font-weight:800; color:#fbbf24;">Data Gaps cần bổ sung (${openGaps.length}/${gapEntries.length} chưa khóa)</span>
                  </div>
                  <span style="font-size:0.68rem; color:#64748b;">Audit lần cuối: ${lastAuditLabel}</span>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:0.5rem;">
                  ${gapEntries.map(([key, gap]) => {
                    const isRes = gap.status && (gap.status.startsWith('COMPLETED') || gap.status.startsWith('REFRESHED') || gap.status.startsWith('PROXY_ACCEPTED'));
                    const cardBorder = isRes ? 'rgba(52,211,153,0.3)' : 'rgba(245,158,11,0.4)';
                    const labelColor = isRes ? '#34d399' : '#fbbf24';
                    const badgeBg = isRes ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)';
                    const ev = gap.currentEvidence || '';
                    const evShort = ev.length > 100 ? ev.slice(0, 100) + '...' : ev;
                    return `
                  <div style="background:#0f172a; border:1px solid ${cardBorder}; border-radius:0.65rem; padding:0.65rem;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:0.4rem; margin-bottom:0.3rem;">
                      <div style="font-size:0.72rem; color:${labelColor}; font-weight:800;">${esc(GAP_LABELS[key] || key)}</div>
                      <span style="font-size:0.63rem; font-weight:700; padding:0.1rem 0.35rem; border-radius:0.3rem; background:${badgeBg}; color:${labelColor};">${esc(gap.status || '')}</span>
                    </div>
                    <p style="font-size:0.68rem; color:#94a3b8; line-height:1.45; margin:0;" title="${esc(ev)}">${esc(evShort)}</p>
                  </div>`;
                  }).join('')}
                </div>
              </div>`;
              })() : ''}"""

html = html[:start_idx] + NEW_BLOCK + html[end_idx:]

with open('D:/YTB/H2DEV-Project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('REPLACED OK')
print(f'Old block was {len(old_block)} chars, new block is {len(NEW_BLOCK)} chars')

# Quick verify
with open('D:/YTB/H2DEV-Project/index.html', encoding='utf-8') as f:
    verify = f.read()
print('OLD still present:', OLD_MARKER in verify)
print('NEW present:', 'Kiểm định Data Gaps — Hoàn tất' in verify)
print('GAP_LABELS present:', 'GAP_LABELS' in verify)
print('lastAuditLabel present:', 'lastAuditLabel' in verify)
print('allResolved present:', 'allResolved' in verify)
