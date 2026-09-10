// Comprehensive UI check
const fs = require('fs');
const html = fs.readFileSync('D:/YTB/H2DEV-Project/index.html', 'utf8');
console.log('=== UI COMPREHENSIVE CHECK ===');
console.log('');
// 1. Tabs
const tabs = ['tongquan', 'lotrinh', 'video', 'ngachxanh', 'kichban', 'nguonreup', 'kenh', 'rawkenh', 'chienluoc'];
console.log('[1] TABS (' + tabs.length + ' expected)');
tabs.forEach(t => {
  const hasTab = html.includes("id: '" + t + "'");
  const renderName = 'render' + t.charAt(0).toUpperCase() + t.slice(1);
  const hasRender = html.includes(renderName) || html.includes("case '" + t + "'");
  console.log('  ' + t + ': tab ' + (hasTab ? 'OK' : 'MISSING') + ' | render ' + (hasRender ? 'OK' : 'MISSING'));
});
console.log('');
// 2. CSS files
console.log('[2] CSS FILES');
['assets/tailwind.css', 'assets/viddar.css', 'assets/player.css', 'assets/learn.css'].forEach(f => {
  const exists = fs.existsSync('D:/YTB/H2DEV-Project/' + f);
  console.log('  ' + f + ': ' + (exists ? 'OK' : 'MISSING'));
});
console.log('');
// 3. JS files
console.log('[3] JS FILES');
['assets/h2dev-core.js', 'assets/learn.js'].forEach(f => {
  const exists = fs.existsSync('D:/YTB/H2DEV-Project/' + f);
  console.log('  ' + f + ': ' + (exists ? 'OK' : 'MISSING'));
});
console.log('');
// 4. HTML files
console.log('[4] HTML FILES');
['index.html', 'player.html', 'learn.html'].forEach(f => {
  const exists = fs.existsSync('D:/YTB/H2DEV-Project/' + f);
  console.log('  ' + f + ': ' + (exists ? 'OK' : 'MISSING'));
});
console.log('');
// 5. Data endpoints
console.log('[5] DATA ENDPOINTS (Tong quan uses)');
['data-tabs/videos.json', 'data-tabs/kenh-mau.json', 'data-tabs/tai-lieu-full.json', 'data/catalog.json', 'data-tabs/ngach-xanh.json'].forEach(f => {
  const exists = fs.existsSync('D:/YTB/H2DEV-Project/' + f);
  console.log('  ' + f + ': ' + (exists ? 'OK' : 'MISSING'));
});
console.log('');
// 6. Tab Tong quan specific
console.log('[6] TONG QUAN SPECIFIC');
console.log('  statCard function:', html.includes('function statCard('));
console.log('  bento-grid class:', html.includes('bento-grid'));
console.log('  market-list class:', html.includes('market-list'));
console.log('  niche-list class:', html.includes('niche-list'));
console.log('  policy-list class:', html.includes('policy-list'));
console.log('  data-open-tab (link to other tabs):', html.includes('data-open-tab'));
console.log('  ICONS object:', html.includes('const ICONS'));
console.log('  loadWatched (localStorage):', html.includes('function loadWatched'));
console.log('');
// 7. Tab dispatch
console.log('[7] TAB DISPATCH (render function)');
console.log('  switch(state.tab):', html.includes('switch (state.tab)'));
console.log('  case tongquan:', html.includes("case 'tongquan'"));
console.log('  case lotrinh (iframe):', html.includes("case 'lotrinh'"));
console.log('  All 8 cases:', tabs.every(t => html.includes("case '" + t + "'")));
console.log('');
// 8. CSS class coverage
console.log('[8] CSS CLASS COVERAGE (Tong quan)');
const tqClasses = ['bento-grid', 'bento-card', 'stat-icon', 'stat-value', 'stat-label', 'stat-sub', 'market-list', 'market-row', 'market-bar', 'niche-list', 'niche-row', 'policy-list', 'badge-green', 'badge-amber', 'badge-red', 'badge-blue', 'card', 'page-h2', 'page-lede'];
let cssOk = 0, cssMissing = 0;
tqClasses.forEach(c => {
  const inHtml = html.includes(c);
  const tailwind = fs.readFileSync('D:/YTB/H2DEV-Project/assets/tailwind.css', 'utf8').includes(c);
  const viddar = fs.readFileSync('D:/YTB/H2DEV-Project/assets/viddar.css', 'utf8').includes(c);
  if (inHtml && (tailwind || viddar)) cssOk++;
  else if (inHtml) cssMissing++;
});
console.log('  CSS classes OK: ' + cssOk + '/' + tqClasses.length);
console.log('  CSS classes MISSING: ' + cssMissing);
console.log('');
console.log('=== FINAL ===');
const allOk = cssMissing === 0 && tabs.every(t => html.includes("case '" + t + "'"));
console.log('UI STATUS:', allOk ? 'ALL OK' : 'HAS ISSUES');
