"""Regression: invalid sync configuration must never reach a mutating phase."""
import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

MODULE_PATH = Path.home() / ".agents" / "sync" / "agents_sync.py"
spec = importlib.util.spec_from_file_location("lead_sync_preflight", MODULE_PATH)
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)

class PreflightAcceptance(unittest.TestCase):
    def assert_preflight_blocks(self, source_exists, target_extra):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            source = base / "source"
            target = base / "target"
            target.mkdir()
            if source_exists:
                (source / "alpha").mkdir(parents=True)
                (source / "alpha" / "SKILL.md").write_text("---\nname: alpha\ndescription: Fixture\n---\n")
            configuration = {"id": "fixture", "dir": str(target), **target_extra}
            manifest = {
                "skills": {"source": str(source), "targets": [configuration]},
                "targets": [{"id": "rules-fixture", "path": str(base / "rules.md"), "create": True}],
                "retire": [], "inert": []
            }
            with patch.object(sync, "run_lint", return_value=True), \
                 patch.object(sync, "load", return_value=(manifest, {})), \
                 patch.object(sync, "target_outputs", return_value=([(str(base / "rules.md"), b"fixture", "test")], "fixture")), \
                 patch.object(sync, "atomic_write") as write, \
                 patch.object(sync, "backup_path") as backup, \
                 patch.object(sync, "remove_skill_dir") as remove:
                with self.assertRaises(SystemExit):
                    sync.cmd_apply(True)
                write.assert_not_called()
                backup.assert_not_called()
                remove.assert_not_called()

    def test_missing_source_fails_before_instruction_write(self):
        self.assert_preflight_blocks(False, {})

    def test_unknown_preservation_key_fails_before_instruction_write(self):
        self.assert_preflight_blocks(True, {"target_only_name": ["private"]})

    def test_target_only_source_collision_fails_before_instruction_write(self):
        self.assert_preflight_blocks(True, {"target_only_names": ["alpha"]})

if __name__ == "__main__":
    unittest.main()
