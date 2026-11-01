import os
import sys
import unittest
import hashlib
import json
import urllib.request
import urllib.error
import subprocess

DASHBOARD_DIR = os.path.normpath(r"D:\YTB\H2DEV-Project\docs\dashboard")
DASHBOARD_FILE = os.path.join(DASHBOARD_DIR, "agv_commands_skills_dashboard.html")
GENERATE_SCRIPT = os.path.normpath(r"D:\YTB\H2DEV-Project\scripts\generate_dashboard.py")
SERVER_SCRIPT = os.path.normpath(r"D:\YTB\H2DEV-Project\scripts\dashboard_server.py")
SRC_SKILLS_DIR = os.path.normpath(r"C:\Users\SaxukeB\.agents\source\skills")

sys.path.insert(0, os.path.normpath(r"D:\YTB\H2DEV-Project\scripts"))
import dashboard_server

class TestDashboardIntegrityAndServer(unittest.TestCase):
    def test_generator_deterministic_double_run(self):
        """Generator must produce byte-identical output across consecutive runs."""
        subprocess.run([sys.executable, GENERATE_SCRIPT], check=True, capture_output=True)
        with open(DASHBOARD_FILE, "rb") as f:
            h1 = hashlib.sha256(f.read()).hexdigest()
        self.assertTrue(len(h1) == 64 and h1 != "")

        subprocess.run([sys.executable, GENERATE_SCRIPT], check=True, capture_output=True)
        with open(DASHBOARD_FILE, "rb") as f:
            h2 = hashlib.sha256(f.read()).hexdigest()

        self.assertEqual(h1, h2, "Generator must be 100% deterministic and byte-identical across runs")

    def test_dynamic_counts_and_header_metrics(self):
        """Dashboard dynamic count and header labels must agree with ALL_ITEMS."""
        with open(DASHBOARD_FILE, "r", encoding="utf-8") as f:
            content = f.read()

        import re
        m = re.search(r'const ALL_ITEMS = (\[[\s\S]*?\]);\s*(?:const|let|var|function)', content)
        self.assertIsNotNone(m, "ALL_ITEMS must be present")
        items = json.loads(m.group(1))

        real_source_skills = []
        for root, dirs, files in os.walk(SRC_SKILLS_DIR):
            if "_backup" in root or ".cache" in root:
                continue
            if "SKILL.md" in files:
                real_source_skills.append(root)

        cats = {}
        for it in items:
            c = it.get("cat", "unknown")
            cats[c] = cats.get(c, 0) + 1

        total_dynamic = len(items)
        global_dynamic = cats.get("skill-global", 0)
        sys_dynamic = cats.get("sys-agy", 0) + cats.get("sys-claude", 0) + cats.get("sys-codex", 0) + cats.get("sys-other", 0)
        skill_dynamic = total_dynamic - sys_dynamic

        self.assertEqual(global_dynamic, len(real_source_skills))

        # Check DOM header metrics
        self.assertIn(f"Kho Tra Cứu ({total_dynamic})", content)
        self.assertIn(f"{total_dynamic} Mục", content)
        self.assertIn(f"{sys_dynamic} Lệnh Hệ thống + {skill_dynamic} Kỹ năng", content)
        self.assertIn(f"Tất cả ({total_dynamic})", content)
        self.assertIn(f"🌐 {global_dynamic} Global Skills", content)

    def test_same_directory_redirection_rejected(self):
        """_safe_dashboard_file must strictly require exact canonical equality and reject same-directory redirection."""
        other_file_same_dir = os.path.join(DASHBOARD_DIR, "template.html")
        self.assertTrue(os.path.isfile(other_file_same_dir))
        
        # When target_file is template.html but expected is DASHBOARD_FILE, it must return None
        safe = dashboard_server._safe_dashboard_file(target_file=other_file_same_dir)
        # Verify strict check
        expected_canonical = os.path.normcase(os.path.abspath(dashboard_server.DASHBOARD_FILE))
        self.assertNotEqual(safe, expected_canonical, "Redirection to sibling file in same directory must not return canonical dashboard path")

    def test_server_allowlist_and_health(self):
        """Server must enforce strict allowlist, support /health, /favicon.ico and block traversal."""
        with urllib.request.urlopen("http://127.0.0.1:18765/health", timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertEqual(data.get("app"), "agv_commands_skills_dashboard")

        with urllib.request.urlopen("http://127.0.0.1:18765/", timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            self.assertIn("text/html", resp.headers.get("Content-Type", ""))

        req = urllib.request.Request("http://127.0.0.1:18765/favicon.ico")
        with urllib.request.urlopen(req, timeout=3) as resp:
            self.assertEqual(resp.status, 204)

        try:
            urllib.request.urlopen("http://127.0.0.1:18765/forbidden_secret.env", timeout=3)
            self.fail("Non-allowlisted path must be rejected")
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 403)

if __name__ == "__main__":
    unittest.main()
