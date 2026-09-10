---
name: generating-composite-and-video
description: >
  Reads shots.json and processes each shot in two fully-parallel phases:
  (1) generates composite scene images by blending character and background
  images (imgbb image_url fields) via the kie.ai flux-2/pro-image-to-image API,
  saving to ./composites/; (2) generates video clips from each composite using
  the kie.ai grok-imagine/image-to-video API, saving to ./clips/. Both phases use
  the taskId-based /jobs/recordInfo polling so all shots run concurrently.
  After clips are approved, runs scripts/merge_clips.py (FFmpeg) to concatenate
  all clips in narrative order into ./final_animation.mp4. Part of the
  Story-to-Animation pipeline (Step 5 of 5, final step).
---

# Composite Image + Video Generation → Final Merge

Three phases: composite scene images → video clips → merged final animation.

All shots are processed concurrently — for 15 shots the total runtime is roughly
the time for one composite + one video, not 15× that.

## Setup: .env

Same `.env` as Step 3. Only `KIE_API_TOKEN` is used here.

If no `.env` is present, the script auto-creates a template and exits:
```
KIE_API_TOKEN=your_kie_api_key_here
IMGBB_API_KEY=your_imgbb_api_key_here
```

## Prerequisites

- `shots.json` must exist (from Skill 4)
- `characters.json` and `backgrounds.json` must have `image_url` fields
- `.env` in project directory with `KIE_API_TOKEN` filled in
- `pip install requests`
- FFmpeg installed and in PATH (for merge step)
  - Windows: `winget install ffmpeg`
  - Mac: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`

## Running the Script

### Per-shot mode (recommended — approve each clip before the next)

```bash
python scripts/generate_videos.py --shot shot_001
python scripts/generate_videos.py --shot shot_002
# ... etc.
```

### Bulk mode (generate all shots at once)

```bash
cd /path/to/your/project
python scripts/generate_videos.py
```

## What the Script Does

### Phase 1 — Composite images (parallel, flux-2/pro-image-to-image)

- `input_urls` = [background `image_url`, character `image_url`(s)]
- `prompt` = shot `action` + "Pixar-style 3D animation, cinematic 16:9 composition"
- Polls until `state: success` → downloads to `./composites/{shot_id}.png`
- Download result is written atomically and checked for a valid image/video container;
  an existing path alone is never treated as a completed job.

### Phase 2 — Video clips (parallel, grok-imagine/image-to-video)

- `image_urls` = [composite URL from Phase 1]
- `prompt` = `veo_prompt` field from `shots.json`
- Downloads to `./clips/{shot_id}.mp4`; invalid or partial files remain failed.

### Phase 3 — Merge clips (FFmpeg)

```bash
python scripts/merge_clips.py
```

- Reads shot order from `shots.json`
- Attempts stream copy first (fast) → auto-fallbacks to H.264 re-encode if codecs mismatch
- Output: `./final_animation.mp4`

## Configurable Settings (top of generate_videos.py)

| Setting | Default | Description |
|---------|---------|-------------|
| `COMPOSITE_MAX_WORKERS` | `5` | Max parallel composite jobs |
| `VIDEO_MAX_WORKERS` | `5` | Max parallel video jobs |
| `VIDEO_ASPECT_RATIO` | `"16:9"` | `"16:9"`, `"9:16"`, `"1:1"` |
| `VIDEO_DURATION` | `8` | Clip length in seconds (6–30) |
| `VIDEO_RESOLUTION` | `"720p"` | `"480p"` or `"720p"` |
| `VIDEO_MODE` | `"normal"` | `"fun"`, `"normal"`, or `"spicy"` |
| `MAX_RETRIES` | `3` | Retry attempts on API errors |
| `POLL_INTERVAL` | `5` | Seconds between status polls |
| `MAX_POLLS` | `120` | Max polls per task (10 min timeout) |

> These param names match the current `grok-imagine/image-to-video` API on kie.ai
> (`duration`/`resolution`/`mode` — NOT the older `n_frames`/`remove_watermark`).
> Windows note: the script forces UTF-8 stdout so progress prints don't crash.

## Transient errors — expect and retry

Grok Imagine intermittently returns `Internal Error, Please try again later.` on a few
shots in a large batch — this is a server-side hiccup, not a prompt or param problem.
The composites are already saved, so simply **re-run the script**: it validates finished
clips and regenerates only missing/invalid ones. Composite URLs are recorded in
`composites/manifest.json` so a resumed run can reuse a verified job without silently
replacing a local asset that has no provenance. A single stubborn shot may need 2–3 retries.
Budget for this — a 12-shot project often costs ~20–30% more than the clip count alone
due to retries.

## Regenerating Failed or Rejected Shots

1. Delete `./composites/{shot_id}.png` and `./clips/{shot_id}.mp4`
2. Optionally update `veo_prompt` in `shots.json`
3. Re-run the script — existing clips are skipped automatically

## Review Gate (MANDATORY)

### Per-shot mode — after EACH shot

```
🎬 Shot [shot_XXX] ready!

- Composite : ./composites/shot_XXX.png
- Video clip: ./clips/shot_XXX.mp4
- Run time  : [X min]

👉 Please review this clip. You can:
  - Approve → say "ok" or "next" to generate the next shot
  - Redo    → say "redo" (deletes composite + clip, re-runs same shot)
  - Adjust  → edit veo_prompt in shots.json, then say "redo"

⏸️ Waiting for your approval before generating shot_[next].
```

### Bulk mode — after ALL shots

```
✅ Composite + Video Generation complete!

📋 Summary:
- Composite images: [X] → ./composites/
- Video clips: [X] → ./clips/
- Failed: [X] (list any failures)
- Total run time: [X min]

👉 Approve all → say "approved" or "merge" to proceed to final merge
   Regenerate specific shots → e.g., "redo shot_003"

⏸️ Waiting for your approval before merging.
```

### After merge

```
🎬 Final animation ready!

- Output : ./final_animation.mp4
- Size   : [X] MB
- Clips  : [X] merged in shot order

⏸️ The Story-to-Animation pipeline is complete.
```

**NEVER** mark the pipeline as complete without explicit user approval.
