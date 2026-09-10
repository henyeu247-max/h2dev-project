// ============================================================
//  TrendsMCP - Key rotation script (auto)
//  - Rotates between API keys (round-robin) + auto-skip dead keys
//  Usage:
//    node trends-rotate.js test                      → test cả 2 key + top trends
//    node trends-rotate.js get_top_trends <type> <limit>
//    node trends-rotate.js get_growth <keyword> <source>
//    node trends-rotate.js get_time_series <keyword> <source> <from> <to>
//  Các tham số truyền đơn giản (không cần JSON) để dễ dùng từ terminal.
// ============================================================
// Key đọc từ ../.env (web block) qua load-keys.js — KHÔNG hardcode ở đây.
const { getRequiredKey } = require('./load-keys');
const KEYS = getRequiredKey('TRENDS_KEYS');
const MCP_URL = 'https://api.trendsmcp.ai/mcp';

const a = process.argv.slice(2);
let tool = a[0] || 'get_top_trends';

let args = {};
if (tool === 'test' || tool === 'get_top_trends') {
  tool = 'get_top_trends';
  args = { type: a[1] || 'YouTube Trending', limit: parseInt(a[2] || '3', 10) };
} else if (tool === 'get_growth') {
  args = { keyword: a[1] || '', source: a[2] || 'google search' };
} else if (tool === 'get_time_series') {
  args = { keyword: a[1] || '', source: a[2] || 'google search', time_range: (a[3] ? a[3] + '..' + (a[4] || '') : undefined) };
}

async function callMcp(key) {
  const body = { jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name: 'trends___' + tool, arguments: args } };
  const r = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: r.status, text: await r.text() };
}

(async () => {
  console.log('Tool: ' + tool + ' | Args: ' + JSON.stringify(args));
  const results = [];
  for (let i = 0; i < KEYS.length; i++) {
    const short = KEYS[i].slice(0, 18) + '...';
    try {
      const res = await callMcp(KEYS[i]);
      const ok = res.status === 200 && !/isError":true|ValidationException|"error"/i.test(res.text);
      console.log(`[key ${i + 1}/${KEYS.length} ${short}] HTTP ${res.status} → ${ok ? 'OK' : 'FAIL'}`);
      if (ok) {
        try { const j = JSON.parse(res.text); const inner = JSON.parse(j.result.content[0].text); console.log('\nDATA: ' + JSON.stringify(inner.body || inner, null, 1).slice(0, 2500)); }
        catch (e) { console.log(res.text.slice(0, 2000)); }
        return;
      }
      results.push(`key${i + 1}: FAIL (${res.text.slice(0, 150)})`);
    } catch (e) {
      console.log(`[key ${i + 1} ${short}] NETWORK ERR: ${e.message}`);
      results.push(`key${i + 1}: NETWORK ERR`);
    }
  }
  console.error('\nAll keys failed:\n' + results.join('\n'));
  process.exit(1);
})();
