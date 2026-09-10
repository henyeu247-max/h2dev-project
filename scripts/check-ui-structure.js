// Check HTML structure of index.html — tabs, render functions, IDs
const fs = require('fs');
const html = fs.readFileSync('D:/YTB/H2DEV-Project/index.html', 'utf8');
console.log('=== HTML STRUCTURE ===');
console.log('Total lines:', html.split('\n').length);
console.log('Total size:', html.length, 'chars');
console.log('');
// Check tabs defined
const tabMatches = html.match(/\{ id: '[^']+',/g) || [];
console.log('Tabs defined:', tabMatches.length);
tabMatches.forEach(t => console.log('  ' + t));
console.log('');
// Check page-title
const titleMatch = html.match(/<h1[^>]*id="page-title"[^>]*>([^<]+)<\/h1>/);
console.log('Page title:', titleMatch ? titleMatch[1] : 'NOT FOUND');
console.log('');
// Check renderTongQuan function exists
console.log('renderTongQuan defined:', html.includes('async function renderTongQuan()'));
// Check all render functions
const renderFns = html.match(/async function render(\w+)\(\)/g) || [];
console.log('');
console.log('Render functions:', renderFns.length);
renderFns.forEach(f => console.log('  ' + f));
// Check tab switching logic
console.log('');
console.log('=== TAB SWITCHING ===');
console.log('Has tab switch logic:', html.includes('activeTab') || html.includes('switchTab') || html.includes('data-tab'));
console.log('Has hashchange handler:', html.includes('hashchange'));
console.log('Has popstate handler:', html.includes('popstate'));
// Check CSS classes used in Tổng quan
console.log('');
console.log('=== TONG QUAN CSS CLASSES ===');
const tqClasses = ['bento-grid', 'bento-card', 'stat-icon', 'stat-value', 'stat-label', 'stat-sub', 'market-list', 'market-row', 'market-bar', 'niche-list', 'niche-row', 'policy-list', 'badge-green', 'badge-amber', 'badge-red', 'badge-blue', 'card', 'page-h2', 'page-lede'];
tqClasses.forEach(c => {
  const inHtml = html.includes(c);
  const inCss = fs.existsSync('D:/YTB/H2DEV-Project/assets/tailwind.css') && fs.readFileSync('D:/YTB/H2DEV-Project/assets/tailwind.css', 'utf8').includes(c);
  const inViddar = fs.existsSync('D:/YTB/H2DEV-Project/assets/viddar.css') && fs.readFileSync('D:/YTB/H2DEV-Project/assets/viddar.css', 'utf8').includes(c);
  const inApp = fs.existsSync('D:/YTB/H2DEV-Project/assets/app.css') && fs.readFileSync('D:/YTB/H2DEV-Project/assets/app.css', 'utf8').includes(c);
  const status = inHtml ? (inCss || inViddar || inApp ? 'OK' : 'HTML only, CSS MISSING') : 'NOT USED';
  console.log('  .' + c.padEnd(20) + ' HTML:' + (inHtml ? 'Y' : 'N') + ' CSS:' + (inCss ? 'tailwind' : inViddar ? 'viddar' : inApp ? 'app' : 'NONE') + ' → ' + status);
});
