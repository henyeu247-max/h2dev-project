---
name: generating-story-from-logline
description: >
  Expands a short story logline or premise into a full structured narrative
  screenplay saved as story.md. Use when the user provides a story idea,
  logline, or premise and wants to generate a complete story with scenes,
  characters, dialogue, and visual descriptions for 3D animation production.
  Part of the Story-to-Animation pipeline (Step 1 of 5). After generating
  story.md, ALWAYS present the output and wait for explicit user approval.
  Do NOT automatically trigger the next pipeline step.
---

# Story Generation

Expand a user-provided logline into a structured animation screenplay saved as `story.md`.

## Target Duration → Scene Count

Scale scenes to match the intended video length. Each scene = 1–3 shots × 8 sec.

| Target length | Shots needed | Scenes to write |
|---------------|-------------|-----------------|
| ~30 seconds   | 3–4 shots   | 2–3 scenes      |
| ~60 seconds   | 7–8 shots   | 4–6 scenes      |
| ~2 minutes    | 15 shots    | 6–10 scenes     |
| ~3–5 minutes  | 20–37 shots | 8–15 scenes     |

> **Default if no duration specified:** aim for 8–15 scenes (~3–5 min).
> Ask the user for target duration if not provided — it changes the scene count significantly.

## MANDATORY pre-flight questions (ask BEFORE writing the story)

Two decisions silently shape the entire pipeline. Ask them up front — never assume.

1. **Target duration** — drives scene/shot count (see table above).
2. **Voice / dialogue strategy + language** — drives whether the final video has
   spoken voice or only ambient sound. The downstream video model (e.g. Grok Imagine)
   only generates voice if the dialogue is written into the story AND the prompts.
   Offer these options explicitly:
   - **Characters speak** (specify language — English gives the most reliable voice
     quality on Grok Imagine; other languages may mispronounce)
   - **Narrator voice-over** (storybook style; characters silent)
   - **Short key lines only** (1–2 spoken beats per scene, music/ambient otherwise)
   - **Silent + music** (no voice at all — Pixar "Up" opening style)

> ⚠️ If you skip the voice question and write a contemplative story with no dialogue,
> the result will have **only ambient sound and no voice** — a common, costly mistake.
> Record the chosen strategy in story.md under a `## Voice Strategy` heading.

## Instructions

1. Analyze the logline: identify genre, tone, conflict arc, and resolution.
2. Write the number of scenes appropriate for the target duration (see table above).
3. Each scene must include:
   - **Scene number and title**
   - **Location**: detailed visual description (used for background image generation)
   - **Characters present**: with brief visual descriptions on first appearance
   - **Action and dialogue**: visual storytelling focus (show, don't tell)
   - **Shot Notes**: suggested camera angles/movements (wide, close-up, tracking, etc.)
   - **Tone/Pacing**: emotional beat
4. Write for 3D animation: visually descriptive and action-oriented.
5. Keep character count manageable (3–6 main characters).
6. Reuse backgrounds across scenes where natural — reduces image generation cost.

## Output Format

Save as `story.md` in the project directory:

```markdown
# [Story Title]

## Logline
[Original logline]

## Target Duration
[X seconds / X minutes]

## Voice Strategy
[Characters speak (language) / Narrator voice-over / Short key lines / Silent + music]

## Characters
- **Name**: Brief description (age, appearance, personality)

## Scene 1: [Scene Title]
**Location**: [Detailed visual setting description]
**Characters**: [Characters present]
**Time of Day**: [Morning/Afternoon/Night]

[Narrative action and dialogue]

**Shot Notes**: [Camera angles and movements]
**Tone**: [Emotional beat]

---

## Scene 2: ...
```

## Review Gate (MANDATORY)

After saving `story.md`, present this EXACTLY:

```
✅ Story Generation complete. Output saved to story.md.

📋 Summary:
- Title: [Story Title]
- Target duration: [X seconds]
- Scenes: [X]
- Estimated shots: [X] (X scenes × ~Y shots/scene)
- Estimated length: [X shots × 8 sec = X seconds] ✓
- Characters introduced: [list names]
- Unique locations: [X] (fewer = less image generation cost)

👉 Please review story.md. You can:
  - Approve as-is → say "approved" or "proceed"
  - Request changes → describe what to modify
  - Edit story.md directly → tell me when done

⏸️ Waiting for your approval before extracting characters and backgrounds.
```

**NEVER** proceed to the next skill automatically. Wait for explicit approval.

Approval keywords: `approved`, `approve`, `looks good`, `proceed`, `next step`,
`go ahead`, `continue`, `LGTM`, `ship it`, `all good`, `move on`, `next`

If changes requested: apply them, summarize what changed, ask for approval again.
