#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
H2DEV Wildlife Motion Prompt Master
Standardizes Image-to-Video prompts for Google Veo 3.1, Kling, and Hailuo.
"""

import sys
import os
import json
import argparse
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

MOTION_KEYWORDS = [
    "subtle breathing chest expansion",
    "gentle ear flutters shaking off flies",
    "water ripples spreading outwards",
    "macro beak snapping ticks with precise movement",
    "slow camera push-in maintaining hyperrealistic depth of field",
    "soft natural savanna wind blowing dry grass blades"
]

def generate_motion_prompts_for_project(project_dir):
    p_path = Path(project_dir)
    shots_file = p_path / "shots.json"

    if not shots_file.exists():
        print(f"[ERROR] Không tìm thấy shots.json tại: {shots_file}")
        sys.exit(1)

    shots = json.loads(shots_file.read_text(encoding="utf-8"))
    motion_package = []

    for s in shots:
        beat = s.get("beat", 1)
        b_name = s.get("beat_name", "")
        base_motion = s.get("veo_motion_prompt", "")

        motion_entry = {
            "beat": beat,
            "beat_name": b_name,
            "target_engine": "Google Veo 3.1 / Kling 2.0",
            "recommended_clip_duration_sec": 8,
            "veo_prompt": f"{base_motion}, photoreal wildlife cinematography, slow natural pace, no jitter, perfectly stable anatomical features",
            "camera_directive": "Slow steady push-in 50mm lens, eye-level with the animal, gentle rack focus onto parasites and skin folds",
            "audio_cues_for_sfx": "Muffled savanna wind, rhythmic low breathing, soft water lapping, subtle bird wing flaps"
        }
        motion_package.append(motion_entry)

    out_file = p_path / "motion_prompts.json"
    out_file.write_text(json.dumps(motion_package, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[OK] Đã xuất bản motion prompts cho {len(motion_package)} shots tại: {out_file}")
    return motion_package

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="H2DEV Wildlife Motion Prompt Master")
    parser.add_argument("--project", required=True, help="Thư mục project chứa shots.json")
    args = parser.parse_args()

    generate_motion_prompts_for_project(args.project)
