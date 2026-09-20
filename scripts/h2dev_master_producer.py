#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
H2DEV Master Producer Router (Bàn Điều Khiển Sản Xuất Đa Ngách 1-Click)
Bao quát toàn bộ 12 Nhóm Chủ Đề Lớn & 156 Kênh Mẫu SSoT của Hệ Sinh Thái H2DEV.
"""

import sys
import os
import json
import argparse
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SKILLS_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".agents", "skills"))

GROUP_ROUTER_MAP = {
    "everyday_history": {
        "name": "Nhóm Lịch Sử Đời Sống / Đồ Vật Thường Nhật (Ngách Xanh #1 SSoT)",
        "scriptPath": os.path.join(SKILLS_ROOT, "h2dev-everyday-history", "scripts", "generate_everyday_history.py"),
        "defaultTopic": "mirror",
        "argName": "--object"
    },
    "ancient_civilizations": {
        "name": "Nhóm Lịch Sử / Khảo Cổ Học / Nền Văn Minh Cổ Đại (35 kênh H2DEV)",
        "scriptPath": os.path.join(SKILLS_ROOT, "h2dev-ancient-civilizations", "scripts", "generate_ancient_civilization.py"),
        "defaultTopic": "gobekli_tepe",
        "argName": "--preset"
    },
    "senior_wisdom": {
        "name": "Nhóm Sức Khỏe / Lão Hóa / Chuyện Đời (42 kênh H2DEV - Không YMYL)",
        "scriptPath": os.path.join(SKILLS_ROOT, "h2dev-senior-wisdom", "scripts", "generate_senior_wisdom.py"),
        "defaultTopic": "letting_go",
        "argName": "--topic"
    },
    "dark_crime": {
        "name": "Nhóm Kinh Doanh / Tài Chính / Tội Phạm Kinh Tế (RPM $18-$38)",
        "scriptPath": os.path.join(SKILLS_ROOT, "h2dev-dark-crime", "scripts", "generate_dark_crime.py"),
        "defaultTopic": "ftx",
        "argName": "--case"
    },
    "survival": {
        "name": "Nhóm Địa Lý / Sinh Tồn Hoang Dã / Off-Grid (18 kênh H2DEV)",
        "scriptPath": os.path.join(SKILLS_ROOT, "h2dev-survival-offgrid", "scripts", "generate_survival_script.py"),
        "defaultTopic": "arctic_earth_shelter",
        "argName": "--preset"
    },
    "english_learning": {
        "name": "Nhóm Học Tiếng Anh Thụ Động / Kể Chuyện Cuộc Sống (9 kênh H2DEV)",
        "scriptPath": os.path.join(SKILLS_ROOT, "h2dev-english-learning", "scripts", "generate_english_learning.py"),
        "defaultTopic": "airport_lost_passport",
        "argName": "--preset"
    },
    "geopolitics": {
        "name": "Nhóm Quân Sự / Địa Chính Trị / Bản Đồ Chiến Lược (8 kênh H2DEV)",
        "scriptPath": os.path.join(SKILLS_ROOT, "h2dev-geopolitics-military", "scripts", "generate_geopolitics_script.py"),
        "defaultTopic": "strait_of_malacca",
        "argName": "--preset"
    },
    "ai_film": {
        "name": "Nhóm Phim Điện Ảnh AI / Drama / Tiên Hiệp / Cổ Trang (10 Thể Loại)",
        "scriptPath": os.path.join(SKILLS_ROOT, "h2dev-ai-film-director", "scripts", "director_engine.py"),
        "defaultTopic": "Cửu Trọng Tiên Ma Ký - Tập 1",
        "argName": "--topic"
    }
}

def main():
    parser = argparse.ArgumentParser(description="H2DEV Master Producer Router")
    parser.add_argument("--group", choices=list(GROUP_ROUTER_MAP.keys()), default="everyday_history", help="Nhóm chủ đề sản xuất")
    parser.add_argument("--topic", help="Chủ đề cụ thể (nếu bỏ trống sẽ dùng chủ đề mẫu chuẩn)")
    parser.add_argument("--duration", type=int, default=12, help="Thời lượng mong muốn (phút)")
    parser.add_argument("--lang", default="EN", choices=["EN", "RU", "ES", "KR", "VI"], help="Ngôn ngữ mục tiêu (cho các nhóm hỗ trợ đa ngữ)")
    args = parser.parse_args()

    cfg = GROUP_ROUTER_MAP[args.group]
    topic_val = args.topic or cfg["defaultTopic"]

    if not os.path.exists(cfg["scriptPath"]):
        print(f"Lỗi: Không tìm thấy script tại {cfg['scriptPath']}")
        sys.exit(1)

    cmd = [
        sys.executable,
        cfg["scriptPath"],
        cfg["argName"], topic_val,
        "--duration", str(args.duration)
    ]

    if args.group == "ancient_civilizations":
        cmd.extend(["--lang", args.lang])

    print(f"=== H2DEV MASTER PRODUCER: ĐANG KHỞI CHẠY [{cfg['name'].upper()}] ===")
    print(f"-> Chủ đề: {topic_val} | Thời lượng: {args.duration} phút\n")

    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if res.returncode != 0:
        print(f"Lỗi thực thi: {res.stderr}")
        sys.exit(res.returncode)

    print(res.stdout)

if __name__ == '__main__':
    main()
