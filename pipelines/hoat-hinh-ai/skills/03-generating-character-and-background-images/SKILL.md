---
name: generating-character-and-background-images
description: >
  Reads characters.json and backgrounds.json, then generates reference images
  for each character and background using the kie.ai nano-banana-pro API.
  Character images (1:1 aspect ratio) are saved to ./characters/ and background
  images (16:9) to ./backgrounds/, named by their IDs (char_001.png, bg_001.png,
  etc.). Each image is then uploaded to imgbb for permanent public hosting, and
  the imgbb URL is written back as an image_url field in both JSON files — these
  URLs are required by generate_videos.py. Part of the Story-to-Animation
  pipeline (Step 3 of 5). Run scripts/generate_images.py to execute. Use when
  both JSON prompt files exist and the user wants to generate the actual reference
  images. After generating all images, ALWAYS present the output and wait for
  explicit user approval. Do NOT automatically trigger the next pipeline step.
---

# Character & Background Image Generation

Generate reference images with kie.ai nano-banana-pro, host them on imgbb,
and write permanent `image_url` fields back into the JSON files.

## Setup: .env

On first run the script automatically creates a `.env` template in your project
directory and exits. Open it, fill in your keys, then re-run:

```
KIE_API_TOKEN=your_kie_api_key_here
IMGBB_API_KEY=your_imgbb_api_key_here
```

- **KIE_API_TOKEN** — from [kie.ai](https://kie.ai) dashboard → API Keys
- **IMGBB_API_KEY** — from [api.imgbb.com](https://api.imgbb.com) (free account)
- Add `.env` to `.gitignore` — never commit API keys
- Real environment variables always take precedence over `.env` values

A reference copy is at `assets/.env.example` in this skill's folder.

## Prerequisites

- `characters.json` and `backgrounds.json` must exist (from Skill 2)
- `.env` in project directory with both keys filled in (auto-created on first run)
- `pip install requests`

## Running the Script

```bash
cd /path/to/your/project
python ~/.claude/skills/generating-character-and-background-images/scripts/generate_images.py
```

### Image model (switchable)

At the top of `scripts/generate_images.py` is `IMAGE_MODEL`. Both options use the same
`jobs/createTask` flow:

| Value | Model | Notes |
|-------|-------|-------|
| `gpt-image-2-text-to-image` (default) | OpenAI GPT-Image-2 | High quality, native 16:9. Occasionally a task stalls in `generating` and times out — just re-run, the script retries it. |
| `nano-banana-pro` | Google Nano-Banana Pro | Cheaper, more stable for landscapes. |

To switch, change the one `IMAGE_MODEL` line.

### What the script does per image:

1. **Generate** — POST to `jobs/createTask` (model = `IMAGE_MODEL`, aspect_ratio, resolution: `1K`)
2. **Poll** — GET `jobs/recordInfo?taskId=...` until `state: success`; extract `resultUrls[0]`
   (times out after `MAX_POLLS` × 5s = 5 min; on timeout, re-run to retry that image)
3. **Download** — save PNG to `./characters/{id}.png` or `./backgrounds/{id}.png`
4. **Upload to imgbb** — POST base64-encoded PNG to `api.imgbb.com/1/upload`; get permanent URL
5. **Write back** — store imgbb URL as `image_url` in `characters.json` / `backgrounds.json`

> **Re-run safety**: if a valid PNG already exists, the script re-uploads it to imgbb to refresh
> `image_url` instead of regenerating. An invalid/partial PNG or failed host upload is a
> failure for retry; a path existing alone is never treated as success.
> Windows note: the script forces UTF-8 stdout so emoji/arrows print without errors.

Character images: **1:1** aspect ratio (reference sheets)
Background images: **16:9** aspect ratio (cinematic wide shots)

If imgbb upload fails, the local PNG is kept for retry but the item is marked failed; a
temporary kie.ai URL is not recorded as a successful permanent host.

## Regenerating Specific Images

1. Update the `prompt` field in the JSON
2. Delete the existing PNG (e.g., `./characters/char_001.png`)
3. Re-run the script — it skips existing files, regenerates deleted ones

## Important: image_url Fields

After running, each JSON entry has an `image_url` field containing a permanent
imgbb URL. **Skill 5 (`generate_videos.py`) reads these URLs** to generate
composite images — do not delete or overwrite them.

## Review Gate (MANDATORY)

After all images are generated, present this EXACTLY:

```
✅ Image Generation complete.

📋 Summary:
- Character images: [X] generated → ./characters/
  [char_001.png: "Name", char_002.png: "Name", ...]
- Background images: [X] generated → ./backgrounds/
  [bg_001.png: "Name", bg_002.png: "Name", ...]
- Failed: [X] (list any failures)
- image_url (imgbb) written to: characters.json, backgrounds.json

👉 Please review the generated images. You can:
  - Approve all → say "approved" or "proceed"
  - Reject specific images → e.g., "regenerate char_001, the hair is wrong"
    (update prompt in characters.json, delete the PNG, re-run script)
  - Replace images manually → save your PNG as ./characters/char_001.png,
    then tell me to upload it to imgbb to get a fresh image_url

⏸️ Waiting for your approval before creating the shot list.
```

**NEVER** proceed to the next skill automatically. Wait for explicit approval.
