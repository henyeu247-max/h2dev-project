// ============================================================
//  MCP HELPER — dùng MCP có sẵn qua terminal (không cần UI/phiên chat)
//  Cách dùng:
//    node mcp-help.js list                     → danh sách MCP có sẵn
//    node mcp-help.js trends <tool> [args]     → gọi TrendsMCP (xoay vòng 5 key)
//    node mcp-help.js vidiq <tool> [jsonArgs]  → gọi vidIQ (51 tools)
//    node mcp-help.js exa <query>              → search web Exa
//    node mcp-help.js jina <query>             → search web Jina
// ============================================================
const fs = require('fs');
const path = require('path');

// Key đọc từ ../.env (web block) qua load-keys.js — KHÔNG hardcode ở đây.
const { loadKeys, getRequiredKey } = require('./load-keys');

async function callMcp(url, headers, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', ...headers }, body: JSON.stringify(body) });
  return r.text();
}

async function trendsCall(tool, args) {
  const TRENDS_KEYS = getRequiredKey('TRENDS_KEYS');
  for (let i = 0; i < TRENDS_KEYS.length; i++) {
    try {
      const t = await callMcp('https://api.trendsmcp.ai/mcp', { 'Authorization': 'Bearer ' + TRENDS_KEYS[i] },
        { jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name: 'trends___' + tool, arguments: args } });
      if (!/isError":true|"error"/.test(t)) { console.log(`[trends key${i + 1}] OK`); return t; }
      console.log(`[trends key${i + 1}] FAIL — thử key tiếp`);
    } catch (e) { console.log(`[trends key${i + 1}] NET ERR`); }
  }
  return 'ALL TRENDS KEYS FAILED';
}

async function vidiqCall(tool, args) {
  const VIDIQ_KEY = getRequiredKey('VIDIQ_KEY');
  return callMcp('https://mcp.vidiq.com/mcp', { 'Authorization': 'Bearer ' + VIDIQ_KEY },
    { jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name: 'vidiq_' + tool, arguments: args || {} } });
}

const a = process.argv.slice(2);
const action = a[0];

(async () => {
  if (!action || action === 'list') {
    const keys = loadKeys();
    console.log('MCP có sẵn (qua API, không cần UI):');
    console.log(`  - trends  : ${keys.TRENDS_KEYS.length ? keys.TRENDS_KEYS.length + ' key khả dụng' : 'Chưa có key'}`);
    console.log(`  - vidIQ   : ${keys.VIDIQ_KEY ? 'Đã có key (51 tools)' : 'Chưa có key'}`);
    console.log(`  - exa     : ${keys.EXA_KEY ? 'Đã có key' : 'Chưa có key'}`);
    console.log(`  - jina    : ${keys.JINA_KEY ? 'Đã có key' : 'Chưa có key'}`);
    console.log('\nVí dụ:');
    console.log('  node mcp-help.js trends get_top_trends "YouTube Trending" 5');
    console.log('  node mcp-help.js vidiq balance');
    console.log('  node mcp-help.js vidiq channel_stats @quietstrength88');
    console.log('  node mcp-help.js exa "true crime youtube niche"');
    return;
  }
  if (action === 'trends') {
    const tool = a[1] || 'get_top_trends'; const type = a[2]; const limit = a[3];
    let args = {};
    if (tool === 'get_top_trends') args = { type: type || 'YouTube Trending', limit: parseInt(limit || '5', 10) };
    else if (tool === 'get_growth') args = { keyword: type || '', source: a[3] || 'google search' };
    else if (tool === 'get_time_series') args = { keyword: type || '', source: a[3] || 'google search', time_range: a[4] ? a[4] + '..' + (a[5] || '') : undefined };
    console.log(await trendsCall(tool, args));
    return;
  }
  if (action === 'vidiq') {
    const tool = a[1];
    let args = {};
    try { args = a[2] ? JSON.parse(a[2]) : {}; } catch (e) { args = { channelId: a[2] }; }
    console.log(await vidiqCall(tool, args));
    return;
  }
  if (action === 'exa') {
    const EXA_KEY = getRequiredKey('EXA_KEY');
    const q = a.slice(1).join(' ');
    const r = await fetch('https://api.exa.ai/search', { method: 'POST', headers: { 'x-api-key': EXA_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, numResults: 5 }) });
    const j = await r.json();
    console.log(JSON.stringify((j.results || []).map(x => ({ title: x.title, url: x.url, text: (x.text || '').slice(0, 150) })), null, 1));
    return;
  }
  if (action === 'jina') {
    const JINA_KEY = getRequiredKey('JINA_KEY');
    const q = a.slice(1).join(' ');
    const url = q.startsWith('http') ? ('https://r.jina.ai/' + q) : ('https://s.jina.ai/' + encodeURIComponent(q));
    const r = await fetch(url, { headers: { 'Authorization': 'Bearer ' + JINA_KEY } });
    const t = await r.text();
    console.log(t.slice(0, 2000));
    return;
  }
  console.log('Cách dùng: node mcp-help.js list');
})();
