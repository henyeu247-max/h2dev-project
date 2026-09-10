---
name: creating-shot-list
description: >
  Reads story.md, characters.json, and backgrounds.json to decompose the story
  into individual 8-second shots. Each shot maps to specific character IDs, a
  background ID, camera movement, action description, and a self-contained Veo 3
  video-generation prompt. Saves output as shots.json. Part of the
  Story-to-Animation pipeline (Step 4 of 5). Use when story and asset JSON files
  exist and the user wants to create the shot-by-shot breakdown for video
  generation. After generating shots.json, ALWAYS present the output and wait
  for explicit user approval. Do NOT automatically trigger the next pipeline step.
---

# Shot List Creation

Decompose the story into discrete 8-second shots mapped to asset IDs and Veo 3
generation prompts. Save as `shots.json`.

## Instructions

1. Read `story.md`, `characters.json`, and `backgrounds.json`.
2. Break each scene into **1–3 shots** of exactly 8 seconds each.
3. Scale total shots to match target duration from story.md (see table below).
4. Assign sequential IDs: `shot_001`, `shot_002`, ...

| Target length | Shots to create |
|---------------|----------------|
| ~30 seconds   | 3–4 shots      |
| ~60 seconds   | 7–8 shots      |
| ~2 minutes    | 15 shots       |
| ~3–5 minutes  | 20–37 shots    |

5. For each shot:
   - **characters**: List of `character_id`s present (must match characters.json IDs)
   - **background**: The `bg_id` for this location (must match backgrounds.json IDs)
   - **action**: Clear visual description of what happens in this 8-second clip
   - **camera_movement**: e.g., `"static wide shot"`, `"slow dolly-in"`, `"pan left"`, `"close-up on face"`, `"tracking shot"`
   - **dialogue**: Spoken line if any, or `""` if none.
     ⚠️ Empty dialogue across all shots = the final video will have **only ambient
     sound, no voice**. If the story's Voice Strategy calls for spoken voice, every
     relevant shot MUST carry a dialogue line AND that line must be embedded in the
     `veo_prompt` (see Audio rule below).
   - **mood**: Emotional tone
   - **veo_prompt**: Self-contained Veo 3 generation prompt (see format below)

## Veo Prompt Format

Each `veo_prompt` must be fully self-contained — describe the shot as if standalone.
Do NOT use asset IDs (char_001, bg_001) — Veo reads this directly.

Pattern:
```
[Art style], [shot type + camera movement], [character description + action],
[setting description], [lighting and mood], [Audio: voice + ambient], [duration hint]
```

### Audio rule (CRITICAL — this is how voice gets into the video)

The video model reads the `veo_prompt` to decide what audio to generate. You MUST
end every prompt with an explicit `Audio:` clause:

- **If the shot has dialogue**: spell out who speaks, in what language, and the exact
  line. Example: *"Audio: the bear says softly in English: 'Hippo will love this.',
  gentle morning birdsong, soft wind."*
- **If the shot is intentionally silent**: say so — *"Audio: ambient forest sounds and
  gentle music, no dialogue."*

Never leave audio implicit. Writing "no dialogue" when the story wanted voice — or
omitting the dialogue line from the prompt — produces a voiceless clip.

Example:
```
Pixar-style 3D animation, slow dolly-in from wide to medium shot, a 12-year-old
girl with curly auburn hair and teal jacket steps into a magical sunlit forest
clearing, bioluminescent mushrooms and golden sunbeams, sense of wonder,
Audio: the girl whispers in English: "It's beautiful...", soft forest ambience
and gentle music, 8 seconds
```

## Output File: shots.json

```json
{
  "shots": [
    {
      "shot_id": "shot_001",
      "scene_number": 1,
      "scene_title": "Scene title from story.md",
      "shot_number_in_scene": 1,
      "duration_seconds": 8,
      "characters": ["char_001"],
      "background": "bg_001",
      "action": "Luna steps into the forest clearing, eyes wide with wonder",
      "camera_movement": "Slow dolly-in from wide shot to medium shot",
      "dialogue": "It's beautiful...",
      "mood": "Wonder and discovery",
      "veo_prompt": "Pixar-style 3D animation, slow dolly-in from wide to medium shot, a 12-year-old girl with curly auburn hair and teal adventure jacket steps cautiously into a magical forest clearing with bioluminescent mushrooms, warm golden sunbeams filter through ancient oak trees, sense of awe and discovery, Audio: the girl whispers in English: 'It's beautiful...', soft magical forest ambience and gentle music, 8 seconds"
    }
  ]
}
```

## Review Gate (MANDATORY)

After saving `shots.json`, present this EXACTLY:

```
✅ Shot List Creation complete. Output saved to shots.json.

📋 Summary:
- Total shots: [X]
- Estimated total length: [X shots × 8 sec = X seconds (~X min)] ✓
- Scenes covered: [X]
- Characters referenced: [list unique char_ids used]
- Backgrounds referenced: [list unique bg_ids used]

👉 Please review shots.json. Key things to check:
  - Does each shot's action match the story flow?
  - Are veo_prompts detailed and fully self-contained (no asset ID references)?
  - Are all character_ids and bg_ids valid (match the JSON files)?
  - Is the pacing right (shots per scene)?
  - Does total length match the target duration?

You can:
  - Approve → say "approved" or "proceed"
  - Request changes → e.g., "add a close-up of Luna's face after shot_003"
  - Edit shots.json directly → tell me when done

⏸️ Waiting for your approval before generating video clips.
```

**NEVER** proceed to the next skill automatically. Wait for explicit approval.

Allow iterative refinement — add, remove, or reorder shots as needed.
