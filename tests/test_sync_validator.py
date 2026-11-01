import os
import sys
import shutil
import tempfile
import unittest
import importlib.util
import subprocess
import json

SYNC_DIR = r"C:\Users\SaxukeB\.agents\sync"
spec = importlib.util.spec_from_file_location("agents_sync", os.path.join(SYNC_DIR, "agents_sync.py"))
agents_sync = importlib.util.module_from_spec(spec)
sys.modules["agents_sync"] = agents_sync
spec.loader.exec_module(agents_sync)

class TestSyncValidatorStrict(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.src_dir = os.path.join(self.temp_dir.name, "source_skills")
        self.target_dir = os.path.join(self.temp_dir.name, "target_skills")
        os.makedirs(self.src_dir, exist_ok=True)
        os.makedirs(self.target_dir, exist_ok=True)

        for s in ["alpha", "beta", "gamma", "doc"]:
            s_dir = os.path.join(self.src_dir, s)
            os.makedirs(s_dir, exist_ok=True)
            with open(os.path.join(s_dir, "SKILL.md"), "w", encoding="utf-8") as f:
                f.write(f"---\nname: {s}\ndescription: Test {s}\n---\n")

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_validate_target_skills_config_valid(self):
        """Valid target_only skill with real directory and SKILL.md passes validation."""
        to_path = os.path.join(self.target_dir, "atk-private")
        os.makedirs(to_path, exist_ok=True)
        with open(os.path.join(to_path, "SKILL.md"), "w", encoding="utf-8") as f:
            f.write("---\nname: atk-private\ndescription: Private\n---\n")

        target = {
            "id": "test_target",
            "exclude_names": ["alpha"],
            "target_only_names": ["atk-private"]
        }
        agents_sync.validate_target_skills_config(["alpha", "beta", "gamma", "doc"], target, self.target_dir)

    def test_validate_target_skills_config_unknown_exclude(self):
        """Unknown exclude_names must raise SystemExit."""
        target = {
            "id": "test_target",
            "exclude_names": ["typo-name"]
        }
        with self.assertRaises(SystemExit) as ctx:
            agents_sync.validate_target_skills_config(["alpha", "beta"], target, self.target_dir)
        self.assertIn("UNKNOWN skill exclusion", str(ctx.exception))

    def test_validate_target_skills_config_source_collision(self):
        """Target-only skill colliding with source skill name must raise SystemExit."""
        target = {
            "id": "test_target",
            "target_only_names": ["alpha"]  # alpha is in source!
        }
        with self.assertRaises(SystemExit) as ctx:
            agents_sync.validate_target_skills_config(["alpha", "beta"], target, self.target_dir)
        self.assertIn("COLLISION: target_only skill exists in source", str(ctx.exception))

    def test_validate_target_skills_config_exclude_collision(self):
        """Target-only skill also listed in exclude_names must raise SystemExit."""
        to_path = os.path.join(self.target_dir, "atk-private")
        os.makedirs(to_path, exist_ok=True)
        with open(os.path.join(to_path, "SKILL.md"), "w", encoding="utf-8") as f:
            f.write("---\nname: atk-private\ndescription: Private\n---\n")

        target = {
            "id": "test_target",
            "exclude_names": ["alpha"],
            "target_only_names": ["atk-private"]
        }
        target["exclude_names"].append("atk-private")
        with self.assertRaises(SystemExit) as ctx:
            agents_sync.validate_target_skills_config(["alpha", "beta", "atk-private"], target, self.target_dir)

    def test_validate_target_skills_config_missing_or_invalid_dir(self):
        """Missing target_only folder or missing SKILL.md must raise SystemExit."""
        target = {
            "id": "test_target",
            "target_only_names": ["missing-folder"]
        }
        with self.assertRaises(SystemExit) as ctx:
            agents_sync.validate_target_skills_config(["alpha", "beta"], target, self.target_dir)
        self.assertIn("MISSING target_only skill", str(ctx.exception))

    def test_validate_target_skills_config_invalid_name(self):
        """Invalid name format (path traversal or uppercase/characters) must raise SystemExit."""
        target = {
            "id": "test_target",
            "target_only_names": ["../traversal"]
        }
        with self.assertRaises(SystemExit) as ctx:
            agents_sync.validate_target_skills_config(["alpha", "beta"], target, self.target_dir)
        self.assertIn("INVALID target_only skill name", str(ctx.exception))

    def test_skills_verify_full_fixture_zero_bad(self):
        """When target has all source skills copied + valid target_only skill, bad is 0."""
        for s in ["alpha", "beta", "gamma", "doc"]:
            shutil.copytree(os.path.join(self.src_dir, s), os.path.join(self.target_dir, s))
        to_path = os.path.join(self.target_dir, "atk-private")
        os.makedirs(to_path, exist_ok=True)
        with open(os.path.join(to_path, "SKILL.md"), "w", encoding="utf-8") as f:
            f.write("---\nname: atk-private\ndescription: Private\n---\n")

        manifest = {
            "source": self.src_dir,
            "targets": [
                {
                    "id": "test_target",
                    "dir": self.target_dir,
                    "target_only_names": ["atk-private"]
                }
            ],
            "retire_dirs": [],
            "retire_names": []
        }
        bad = agents_sync.skills_verify({"skills": manifest})
        self.assertEqual(bad, 0, "Full target fixture with valid target_only must result in bad==0")

    def test_verify_independent_subprocess_exit_zero(self):
        """verify_independent.py runs cleanly against production configuration (exit 0)."""
        cmd = [sys.executable, os.path.join(SYNC_DIR, "verify_independent.py")]
        p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(p.returncode, 0, f"verify_independent must exit 0: {p.stdout}\n{p.stderr}")

if __name__ == "__main__":
    unittest.main()
