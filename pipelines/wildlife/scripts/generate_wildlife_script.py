#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
H2DEV AI Wildlife Documentary Script Generator
David Attenborough Style, 6-Beat Storytelling, 70-90 WPM density.
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

WILDLIFE_CASES = {
    "elephant": {
        "protagonist": "an old bull elephant",
        "conflict": "engorged ticks embedded deep within the sensitive skin folds behind its ears",
        "failures": "rubbing against coarse acacia trunks, tossing dry dust across its back, and wading into shallow mud",
        "helper": "a flock of red-billed oxpeckers descending with sharp, scissor-like beaks",
        "wonder": "the birds methodically probing every crevice, extracting the parasites one by one while the giant stands completely motionless in trust",
        "relief": "the heavy ears stop twitching; the bull lowers its great head and exhales a slow, deep rumble of contentment",
        "meaning": "For the birds, a feast of life-giving blood; for the giant, salvation from torment; for the savanna, an ancient truce written into the very fabric of survival."
    },
    "hippo": {
        "protagonist": "a massive territorial bull hippo",
        "conflict": "voracious river leeches clinging tightly to its cracked hide and sensitive underbelly",
        "failures": "scraping against submerged river boulders and thrashing furiously in murky currents",
        "helper": "a school of small barbel fish emerging from the silty river bottom",
        "wonder": "hundreds of tiny mouths nibbling tirelessly across the thick hide, vacuuming every parasite from open wounds without causing a single scratch",
        "relief": "the beast lets its heavy eyelids sink beneath the warm water, drifting into rare, untroubled sleep",
        "meaning": "For the fish, vital nourishment in nutrient-poor waters; for the river titan, relief from an agonizing itch; for the ecosystem, a delicate harmony forged beneath the surface."
    },
    "buffalo": {
        "protagonist": "a battle-scarred Cape buffalo",
        "conflict": "swarms of stinging botfly larvae burrowing into its nostrils and ear canals",
        "failures": "shaking its heavy horned boss violently, plunging into stagnant wallows, and snorting against the baked earth",
        "helper": "yellow-billed oxpeckers arriving silently at dawn",
        "wonder": "perching fearlessly upon the buffalo's wet muzzle, their deft beaks plucking larvae from the dark nostrils with surgical precision",
        "relief": "the violent head-tossing ceases; the buffalo closes its eyes and resumes chewing its cud in rhythmic serenity",
        "meaning": "For the winged hunters, vital protein; for the savanna's fiercest grazer, peace of mind; for nature, proof that even the most formidable armor relies on the gentlest touch."
    }
}

def generate_wildlife_production_package(animal, conflict=None, duration_min=8, wpm=80, output_dir=None):
    key = animal.lower().strip()
    case = None
    for k in WILDLIFE_CASES:
        if k in key:
            case = WILDLIFE_CASES[k]
            break

    if not case:
        case = {
            "protagonist": f"a lone {animal}",
            "conflict": conflict or "relentless parasites tormenting its sensitive skin",
            "failures": "scratching against rough bark and seeking temporary solace in murky mud",
            "helper": "a dedicated symbiotic partner arriving at the brink of despair",
            "wonder": "the unexpected alliance working tirelessly in perfect harmony to cleanse the torment",
            "relief": "the agitation drains away, replaced by calm stillness and deep physiological relief",
            "meaning": "For the small helper, life; for the giant, peace; for the wild, an enduring testament to survival through partnership."
        }

    total_words = int(duration_min * wpm)

    # 6 Beats according to standard
    beats = [
        ("BEAT 1: SUFFERING / DANGER", (
            f"Under the scorching sun of the African wilderness, {case['protagonist']} endures a quiet agony. "
            f"Deep within the folds of its weathered hide, {case['conflict']}. "
            f"Every step is a trial; every heartbeat throbs with relentless irritation."
        )),
        ("BEAT 2: ESCALATING FAILURE", (
            f"It has tried everything to rid itself of the torment. "
            f"Desperate for reprieve, it resorts to {case['failures']}. "
            f"Yet the parasites remain lodged, refusing to surrender their agonizing grip. Exhaustion begins to set in."
        )),
        ("BEAT 3: TURNING POINT", (
            f"Just as endurance reaches its breaking point, salvation arrives from an unexpected quarter. "
            f"Drawn by the ancient scent of the struggle, {case['helper']}."
        )),
        ("BEAT 4: WONDER & THE CLIMAX", (
            f"What follows is one of nature's most extraordinary spectacles. "
            f"Without fear or hesitation, {case['wonder']}. "
            f"A profound silence falls across the clearing as predator and prey dissolve into absolute cooperation."
        )),
        ("BEAT 5: RELIEF", (
            f"Slowly, the tension ebbs from the great creature's body. "
            f"{case['relief']}. "
            f"The torment that consumed its days is finally broken."
        )),
        ("BEAT 6: MEANING & EVERGREEN REFLECTION", (
            f"{case['meaning']} "
            f"In a world where every creature fights to endure another dawn, survival is not merely about strength—it is about the unspoken bonds that hold the wild together."
        ))
    ]

    script_narration = []
    shot_list = []

    for idx, (b_title, b_text) in enumerate(beats, 1):
        script_narration.append(b_text)
        shot_list.append({
            "beat": idx,
            "beat_name": b_title,
            "narration": b_text,
            "flow_image_prompt": f"National Geographic hyperrealistic documentary still of {case['protagonist']}, {case['conflict'] if idx <= 2 else case['wonder']}, natural African savanna lighting, murky water ripples, extreme macro texture on skin and parasites, 8k, photoreal cinematic, shot on RED camera --ar 16:9",
            "veo_motion_prompt": f"Slow cinematic push-in on {case['protagonist']}, subtle breathing motion, ears gently flapping, parasites twitching, natural environmental wind rippling fur and water, 30fps smooth wildlife documentary pacing"
        })

    full_script_md = "\n\n".join(script_narration)

    titles = [
        f"Why No Elephant Can Survive Without This Tiny Bird",
        f"The Brutal Truth About Parasites on African Giants",
        f"What Really Lives Inside a Rhino's Skin Folds",
        f"The Secret Medical Treatment of the African Savanna",
        f"When a Titan Surrenders to a Flock of Oxpeckers",
        f"Nature's Most Painful Torment [And Its Miracle Cure]",
        f"How Symbiosis Saves the Deadliest Mammals on Earth",
        f"The Hidden Nightmare Living on Wild Buffalos",
        f"10,000 Parasites vs One Giant: The Savanna War",
        f"The Untold Miracle Beneath the Murky Waters"
    ]

    thumbnail_text = {
        "tier1_curiosity_gap": "THEY NEVER LEAVE",
        "tier2_contrast_hook": "HE CAN'T FIGHT BACK",
        "tier3_relief_hook": "SAVED AT LAST"
    }

    if output_dir:
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        (out_path / "script.md").write_text(full_script_md, encoding="utf-8")
        (out_path / "shots.json").write_text(json.dumps(shot_list, indent=2, ensure_ascii=False), encoding="utf-8")
        (out_path / "viral_titles.json").write_text(json.dumps({
            "titles": titles,
            "thumbnail_hooks": thumbnail_text
        }, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"[OK] Generated Wildlife script package at: {out_path}")

    return full_script_md, shot_list, titles

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="H2DEV AI Wildlife Script Generator")
    parser.add_argument("--animal", required=True, help="Loài động vật (vd: Elephant, Hippo, Buffalo)")
    parser.add_argument("--conflict", default=None, help="Mâu thuẫn / Ký sinh trùng")
    parser.add_argument("--duration", type=int, default=8, help="Thời lượng mục tiêu (phút)")
    parser.add_argument("--out", default=None, help="Thư mục xuất file")
    args = parser.parse_args()

    generate_wildlife_production_package(args.animal, args.conflict, args.duration, output_dir=args.out)
