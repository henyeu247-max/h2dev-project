import json, os, sys, time, urllib.request, base64

sys.stdout.reconfigure(encoding='utf-8')

WORKDIR = r"D:\YTB\H2DEV-Project"
RAW_DIR = os.path.join(WORKDIR, "Raw Kênh Mẫu Tìm Kiếm")
META_PATH = os.path.join(RAW_DIR, "metadata-full.json")
PROGRESS_PATH = os.path.join(RAW_DIR, "metadata-processed-temp.json")

def call_mcp(tool_name, arguments):
    body = json.dumps({
        "jsonrpc": "2.0",
        "id": int(time.time()*1000) % 100000,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }).encode("utf-8")
    
    req = urllib.request.Request(
        "http://127.0.0.1:3988/mcp",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer YOUR_LOCAL_MCP_KEY"
        }
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        if "result" in res and "content" in res["result"] and len(res["result"]["content"]) > 0:
            return res["result"]["content"][0].get("text", "")
        return ""

print("Test connection to MCP Pool...")
v_res = call_mcp("vidiq__vidiq_youtube_search", {"query": "No Fluff History", "type": ["channel"], "limit": 1})
print("Search test OK, length:", len(v_res))

