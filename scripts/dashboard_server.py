import os
import sys
import json
import urllib.parse
import urllib.request
import http.server
import socketserver

PORT = 18765
HOST = "127.0.0.1"
DASHBOARD_FILE = os.path.normpath(r"D:\YTB\H2DEV-Project\docs\dashboard\agv_commands_skills_dashboard.html")

def _safe_dashboard_file(target_file=None):
    f_path = target_file or DASHBOARD_FILE
    expected = os.path.normcase(os.path.abspath(f_path))
    expected_dir = os.path.normcase(os.path.abspath(os.path.dirname(f_path)))
    try:
        real_file = os.path.normcase(os.path.realpath(f_path))
    except OSError:
        return None
    # Strict canonical equality: must match exact expected canonical file
    if real_file != expected:
        return None
    if not os.path.isfile(real_file):
        return None
    return real_file

class StrictDashboardHandler(http.server.BaseHTTPRequestHandler):
    server_version = "AGVDashboardServer/3.3"

    def _resolve_and_validate(self):
        raw_path = urllib.parse.unquote(self.path.split("?")[0].split("#")[0])
        if raw_path in ("/", "/agv_commands_skills_dashboard.html"):
            return "HTML"
        if raw_path == "/health":
            return "HEALTH"
        if raw_path == "/favicon.ico":
            return "FAVICON"
        return None

    def do_GET(self):
        target = self._resolve_and_validate()
        if target is None:
            self.send_error(403, "Access denied: Strict allowlist policy")
            return

        if target == "FAVICON":
            self.send_response(204)
            self.end_headers()
            return

        if target == "HEALTH":
            data = json.dumps({"status": "ok", "app": "agv_commands_skills_dashboard", "version": "3.3"}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        if target == "HTML":
            safe_p = _safe_dashboard_file()
            if safe_p is None:
                self.send_error(403, "Access denied: Target file redirection or escape detected")
                return
            with open(safe_p, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.end_headers()
            self.wfile.write(data)

    def do_HEAD(self):
        target = self._resolve_and_validate()
        if target is None:
            self.send_error(403, "Access denied: Strict allowlist policy")
            return

        if target == "FAVICON":
            self.send_response(204)
            self.end_headers()
            return

        if target == "HEALTH":
            data_len = len(json.dumps({"status": "ok", "app": "agv_commands_skills_dashboard", "version": "3.3"}).encode("utf-8"))
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(data_len))
            self.end_headers()
            return

        if target == "HTML":
            safe_p = _safe_dashboard_file()
            if safe_p is None:
                self.send_error(403, "Access denied: Target file redirection or escape detected")
                return
            file_len = os.path.getsize(safe_p)
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(file_len))
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.end_headers()

    def log_message(self, format, *args):
        try:
            msg = format % args
            if sys.stderr and not sys.stderr.closed:
                sys.stderr.write(f"[DashboardServer 18765] {msg}\n")
                sys.stderr.flush()
        except Exception:
            pass

def check_dashboard_health():
    url = f"http://{HOST}:{PORT}/health"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AGV-HealthCheck"})
        with urllib.request.urlopen(req, timeout=2) as resp:
            if resp.status == 200:
                body = json.loads(resp.read().decode("utf-8"))
                return body.get("app") == "agv_commands_skills_dashboard"
    except Exception:
        pass
    return False

def is_port_bound():
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((HOST, PORT)) == 0

def run_server():
    if check_dashboard_health():
        print(f"[DashboardServer] Verified active dashboard server running on http://{HOST}:{PORT}/")
        return 0

    if is_port_bound():
        sys.exit(f"ERROR: Port {PORT} is bound by another foreign process! Aborting.")

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((HOST, PORT), StrictDashboardHandler) as httpd:
        print(f"[DashboardServer] Successfully listening on http://{HOST}:{PORT}/ (serving {DASHBOARD_FILE})")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[DashboardServer] Terminated.")
    return 0

if __name__ == "__main__":
    sys.exit(run_server())
