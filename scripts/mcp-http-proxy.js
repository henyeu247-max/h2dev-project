#!/usr/bin/env node
/**
 * mcp-http-proxy.js — Universal Stdio-to-HTTP MCP Bridge
 * Tự động chuyển tiếp stdio JSON-RPC từ Antigravity/IDE sang MCP HTTP Endpoint có Bearer token
 * HOÀN TOÀN KHÔNG BỊ POPUP BROWSER / KHÔNG BỊ HỎI OAUTH.
 *
 * Usage:
 *   node mcp-http-proxy.js <URL> <HEADER_NAME> <HEADER_VALUE>
 */

const http = require('http');
const https = require('https');
const readline = require('readline');

const targetUrl = process.argv[2];
const headerName = process.argv[3];
const headerValue = process.argv[4];

if (!targetUrl) {
  process.stderr.write('Missing target URL\n');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/event-stream',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Antigravity/1.0'
};

if (headerName && headerValue) {
  headers[headerName] = headerValue;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const parsed = JSON.parse(line);
    const bodyStr = JSON.stringify(parsed);
    
    const urlObj = new URL(targetUrl);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(urlObj, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Nếu trả về SSE data: {...}
        if (data.startsWith('event:') || data.startsWith('data:')) {
          const lines = data.split('\n');
          for (const l of lines) {
            if (l.startsWith('data:')) {
              const payload = l.slice(5).trim();
              if (payload) {
                process.stdout.write(payload + '\n');
              }
            }
          }
        } else {
          // JSON trực tiếp
          try {
            const j = JSON.parse(data);
            process.stdout.write(JSON.stringify(j) + '\n');
          } catch(e) {
            process.stdout.write(data + '\n');
          }
        }
      });
    });

    req.on('error', (err) => {
      process.stderr.write(`[Bridge Error] ${err.message}\n`);
      const errResp = {
        jsonrpc: '2.0',
        id: parsed.id || null,
        error: { code: -32603, message: err.message }
      };
      process.stdout.write(JSON.stringify(errResp) + '\n');
    });

    req.write(bodyStr);
    req.end();
  } catch (e) {
    process.stderr.write(`[JSON Parse Error] ${e.message}\n`);
  }
});
