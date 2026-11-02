import os
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

PRIMARY_DIR = r"C:\Users\SaxukeB\.gemini\antigravity-cli\brain\86ed65d1-ea45-48e7-9698-cfd469842f45"
FALLBACK_DIR = r"D:\YTB\H2DEV-Project\docs\dashboard"
SERVE_DIR = PRIMARY_DIR if os.path.isfile(os.path.join(PRIMARY_DIR, "agv_commands_skills_dashboard.html")) else FALLBACK_DIR

class QuietDashboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SERVE_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    os.chdir(SERVE_DIR)
    httpd = ThreadingHTTPServer(("127.0.0.1", 18765), QuietDashboardHandler)
    httpd.serve_forever()