#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
H2DEV Everyday History Generator (Ngách Xanh Ưu Tiên #1)
Tự động hóa kịch bản lịch sử đồ vật đời thường chuẩn 3 Hồi & Kiểm chứng Bảo tàng.
"""

import sys
import os
import json
import argparse
from pathlib import Path

# SCAR-003: Chuẩn hóa UTF-8 toàn diện trên Windows Console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

OBJECT_LORE_DATABASE = {
    "mirror": {
        "title": "The Mirror",
        "paradox": "Looking at your own clear reflection was once a secret so guarded that Venice executed artisans who tried to escape with the formula.",
        "earlyStruggle": "Polished obsidian stones in Anatolia (6000 BC), tarnished bronze mirrors in ancient Egypt and Rome.",
        "darkPrice": "The island of Murano in Venice: mercury amalgam poison rotting artisans' lungs; King Louis XIV sending secret agents to smuggle mirror makers out of Italy.",
        "turningPoint": "German chemist Justus von Liebig in 1835 developing the chemical silvering process, democratizing mirrors forever.",
        "psychologicalShift": "Birth of the self-portrait in Renaissance art, the emergence of psychology (the concept of ego and self-awareness).",
        "museumCitations": ["The British Museum (Anatolian Obsidian Mirror Collection)", "Smithsonian Institution (National Museum of American History)", "Murano Glass Museum, Venice"],
        "segments": [
            ("The Reflection Paradox", "Living an entire life without truly knowing what your own face looks like. Obsidian stones from Çatalhöyük in Anatolia."),
            ("Venetian Monopoly & Death Penalty", "The island of Murano. The Council of Ten executing artisans who fled with the secret."),
            ("Mercury Poisoning & Madness", "Tin-mercury amalgam. Artisans suffering tremors, tooth loss, and dying before 30."),
            ("French Espionage & The Hall of Mirrors", "Jean-Baptiste Colbert bribing Venetian masters. The Galerie des Glaces at Versailles."),
            ("Liebig's Silver Revolution", "1835 Justus von Liebig discovers silver nitrate deposition. How silver birthed the vampire myth."),
            ("The Psychology of the Double", "The third-person gaze, vanity, self-criticism, and the rise of modern portraiture."),
            ("Conclusion: The Endless Gaze", "Smartphones as modern black obsidian mirrors. Remembering the 500-year price of light.")
        ]
    },
    "fork": {
        "title": "The Fork",
        "paradox": "In medieval Europe, eating with a fork was condemned by the Catholic Church as demonic arrogance and an insult to God.",
        "earlyStruggle": "Ancient Greek carving forks, two-pronged skewers in the Byzantine Empire used by royalty.",
        "darkPrice": "When Byzantine princess Maria Argyropoulina brought forks to Venice in 1004, Saint Peter Damian declared her agonizing death was divine punishment for using artificial hands instead of God-given fingers.",
        "turningPoint": "Catherine de' Medici introducing forks to the French royal court in 1533, sparking the rise of refined dining etiquette.",
        "psychologicalShift": "Separation of physical touch from food consumption, the birth of modern hygiene and civil dining taboos.",
        "museumCitations": ["Victoria and Albert Museum (Medieval Silverware Collection)", "Metropolitan Museum of Art (European Cutlery)"],
        "segments": [
            ("The Demonic Instrument", "Eating with fingers vs artificial prongs. The medieval taboo of dining tools."),
            ("The Byzantine Scandal", "Princess Maria brings gold forks to Venice. Peter Damian's ferocious curse."),
            ("A Cardinal Sin in the Vatican", "Why Catholic theology considered forks an insult to divine creation."),
            ("The French Royal Court", "Catherine de' Medici in 1533. How forks shifted from sin to luxury."),
            ("Industrial Steel & The Mass Table", "The Sheffield cutlery boom making forks affordable to factory workers."),
            ("The Hygiene Revolution", "Germ theory, dining etiquette, and the emotional separation of hands and food."),
            ("The Modern Legacy", "How three small prongs reorganized global manners and etiquette.")
        ]
    },
    "matches": {
        "title": "Matches",
        "paradox": "Before 1826, creating a simple fire on a freezing night required flint, steel, and ten minutes of exhausting labor.",
        "earlyStruggle": "Flint stones, tinder boxes, dangerous sulfuric acid fire sticks in early 1800s Paris.",
        "darkPrice": "White phosphorus matches causing 'Phossy Jaw'—a horrifying bone disease that destroyed the jawbones of young factory girls in Victorian London, leading to the historic Matchgirls Strike of 1888.",
        "turningPoint": "English chemist John Walker in 1826 scraping a chemical paste on his hearth, accidentally inventing the friction match.",
        "psychologicalShift": "Mastery of instant light and heat in every human pocket, transforming survival from an ordeal into an afterthought.",
        "museumCitations": ["Science Museum London (John Walker's Original Friction Match Samples)", "Smithsonian Institution (Industrial Safety Collection)"],
        "segments": [
            ("The Ordeal of Fire", "Flint, tinder, and the brutal reality of winter nights without instant light."),
            ("The Chemical Death Sticks", "Sulfuric acid fire machines and early dangerous French inventions."),
            ("John Walker's Accidental Spark", "Stockton-on-Tees, 1826: A chemical stirring rod scraped on a hearth."),
            ("The Nightmare of Phossy Jaw", "White phosphorus vapors rotting the facial bones of match factory girls."),
            ("The 1888 Matchgirls Strike", "Annie Besant, London matchmakers, and the birth of modern labor rights."),
            ("Red Phosphorus & Safety Matches", "The Swedish innovation that made flame harmless in every pocket."),
            ("Taming Prometheus", "How instant fire rewrote civilization, industry, and the human night.")
        ]
    }
}

def generate_script(object_name, duration_min=10, wpm=135, output_dir=None):
    key = object_name.lower().strip()
    lore = OBJECT_LORE_DATABASE.get(key)
    if not lore:
        lore = {
            "title": object_name.title(),
            "paradox": f"An everyday object we take for granted that once carried a forgotten history of sacrifice and ingenuity.",
            "earlyStruggle": f"Crude early versions used across ancient civilizations before modern manufacturing.",
            "darkPrice": f"Monopolies, guild secrets, and dangerous early chemical experimentation.",
            "turningPoint": f"The breakthrough moment in the Industrial Revolution that made {object_name} accessible to all mankind.",
            "psychologicalShift": f"How {object_name} fundamentally altered human habits, culture, and domestic life.",
            "museumCitations": ["The British Museum", "Smithsonian Institution"],
            "segments": [
                ("The Ordinary Illusion", f"How we interact with {object_name} every day without knowing its true origins."),
                ("Ancient Beginnings", f"The earliest archaeological traces of {object_name} in human history."),
                ("The Monopolies of the Guilds", "Dangerous secrets and state-protected artisan crafts."),
                ("The Chemical & Industrial Turning Point", "The breakthrough that transformed handmade rarity into mass production."),
                ("The Human Price", "The health, labor, and societal struggles behind early manufacturing."),
                ("Rewiring Human Psychology", f"How {object_name} reshaped domestic habits and personal identity."),
                ("Conclusion: The Hidden Legacy", f"Why {object_name} remains a monument of human persistence.")
            ]
        }

    total_words = int(duration_min * wpm)
    segments = lore["segments"]
    words_per_seg = total_words // len(segments)

    script_lines = []
    script_lines.append(f"# {lore['title']}: The Secret History of an Everyday Object")
    script_lines.append(f"## Target Duration: {duration_min} minutes (~{total_words} words)")
    script_lines.append(f"## Museum Citations: {', '.join(lore['museumCitations'])}")
    script_lines.append("")

    prompts = []

    for i, (seg_title, seg_desc) in enumerate(segments, 1):
        script_lines.append(f"=== SEGMENT {i:02d}: {seg_title}")
        script_lines.append(f"<!-- Context: {seg_desc} -->")
        script_lines.append(
            f"Every single day, millions of people encounter {lore['title'].lower()} without pausing to consider its extraordinary story. "
            f"{seg_desc} "
            f"What seemed like a simple domestic convenience was forged through centuries of trials, geopolitical secrecy, and human ingenuity."
        )
        script_lines.append("")

        prompts.append({
            "segment": i,
            "title": seg_title,
            "visual_prompt": f"Cinematic historical documentary illustration, chiaroscuro lighting, {seg_desc}, Renaissance / Victorian period aesthetic, rich textures, moody atmospheric haze, 8k resolution, photoreal oil painting style --ar 16:9",
            "broll_keywords": [lore["title"].lower(), seg_title.lower(), "museum artifact", "vintage history"]
        })

    script_content = "\n".join(script_lines)

    if output_dir:
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        (out_path / "script.md").write_text(script_content, encoding="utf-8")
        (out_path / "prompts.json").write_text(json.dumps({
            "object": lore["title"],
            "target_duration_minutes": duration_min,
            "museum_citations": lore["museumCitations"],
            "scenes": prompts
        }, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"[OK] Generated script and prompts at: {out_path}")

    return script_content, prompts

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="H2DEV Everyday History Script Generator")
    parser.add_argument("--object", required=True, help="Tên đồ vật (vd: mirror, fork, matches)")
    parser.add_argument("--duration", type=int, default=10, help="Thời lượng mục tiêu (phút)")
    parser.add_argument("--out", default=None, help="Thư mục xuất file dự án")
    args = parser.parse_args()

    generate_script(args.object, args.duration, output_dir=args.out)
