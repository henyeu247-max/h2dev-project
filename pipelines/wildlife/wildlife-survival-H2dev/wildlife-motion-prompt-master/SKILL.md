---
name: wildlife-motion-prompt-master
description: >-
  Prompt Master that standardizes image-to-video motion prompts for AI wildlife
  documentaries — turning photoreal stills into ~8s clips with physically correct
  motion: birds pecking ticks, elephants flapping ears, fish nibbling legs, water
  rippling, slow camera push-ins. Primary engine: Google Veo 3.1 in Flow
  (Ingredients/Frames to Video); secondary: Kling, Hailuo. Use when the user has AI
  animal stills to animate, asks for motion prompts or image-to-video prompts, or
  calls /wildlife-motion. Also triggers on Vietnamese phrasing: "viết motion prompt",
  "animate ảnh này", "làm cho nó động", "prompt image-to-video". Pairs with the
  script-wildlife-survival skill.
---

# Wildlife Image-to-Video Motion Prompt Master (Veo 3.1 / Flow)

Goal: turn ONE photoreal still into a motion prompt for a ~8s clip that looks like real
documentary footage — no "AI melt", no deformation.

Supreme principle: **MINIMUM MOTION, CORRECT PHYSICS.** The more a model animates at once,
the more it breaks. Real documentary footage also moves little: one subject moving gently,
a near-static background, a slowly drifting camera. Asking the model to do less yields
cleaner results.

## How to run it in Flow (image-to-video, NOT text-to-video)

A motion prompt never runs alone. Load the scene's IMAGE into Veo first:
- **Ingredients to Video:** add the image as an ingredient (keeps the animal consistent),
  then paste the prompt.
- **Frames to Video:** for transitions, supply a FIRST and LAST image and Veo bridges them
  (e.g. elephant at the water's edge → legs submerged).
- Clips cap at 8s; for longer, use "Extend"/scene extension.

## The 5-layer prompt formula (in order, comma-joined)

1. **SUBJECT MOTION** — ONE clear animal action (elephant flaps one ear / oxpecker pecks
   then lifts its head). Never stack 2–3 actions.
2. **SECONDARY / ENVIRONMENT** — small-amplitude support motion: water ripples, drifting
   dust, swaying grass, trembling feathers. Keep it ambient.
3. **CAMERA** — ONE slow camera move: very slow push-in / slow pan / gentle drift /
   locked-off. Add "subtle, cinematic".
4. **PHYSICS / REALISM** — "natural weight and momentum, realistic muscle/fin/feather
   movement, water reacts to contact". This layer prevents floaty, plastic results.
5. **TONE / SPEED** — "calm, cinematic, real-time speed, no fast motion, documentary footage".

Example:
`The elephant slowly flaps one ear, dust drifts through the god rays, water ripples gently,
very slow camera push-in, natural weight and realistic movement, calm cinematic real-time
documentary footage`

## MANDATORY AUDIO TAIL (Veo 3.1 generates its own sound)

Veo 3.1 synthesizes audio for every clip, so it must be constrained or it will layer music,
dialogue, or captions over the voiceover. ALWAYS append:
`ambient natural sound only, no music, no dialogue, no on-screen text`
(underwater scenes: `ambient natural underwater sound only, ...`).
Useful trick: extract the ambient audio Veo generates (birds, water) as FREE SFX under the
voiceover — or mute the clip's audio track entirely for clean voiceover sync.

## Prohibitions and limits (to avoid burning credits)

- NO multiple animals in complex simultaneous motion in one clip → split the scene.
- NO direct impact moments: biting, striking, pouncing, capturing prey → CUT just before,
  or imply it and cut away. (Veo is weaker at physics than Sora 2; impact shots almost
  always break.)
- NO full wing-spread takeoff if the source still shows a perched bird → wing deformation.
- NO fast running, long jumps, or sharp head turns → morphing.
- Keep complex scenes at 5s, static/ambient scenes at 8s.

## Choosing the Veo tier in Flow (credit prices shift — check the on-screen estimate)

- **Veo 3.1 Lite (~10 credits) = TEST.** Run first to verify the motion reads correctly
  (fish swimming the right way, no melt). Only then generate the final. This is how you
  avoid wasting money.
- **Veo 3.1 Fast (~20 credits) = workhorse.** Use for ~90% of clips.
- **Veo 3.1 Quality (~100 credits) = hero shots only.** The first 30 seconds plus 1–2 money
  shots. Limit to 2–3 Quality clips per video.
- **Omni Flash — skip for documentary work:** capped at 720p and excluded from the daily
  free credits. Only touch it to conversationally edit a specific clip.
- Note: Flow may charge credits even for failed generations → all the more reason to test on Lite.

## Per-engine notes

- **Veo 3.1 (primary):** responds to cinematic language — add "cinematic, shot on telephoto,
  shallow depth of field, real-time". Its camera moves are very smooth; keep subject action simple.
- **Kling (secondary):** handles long descriptions, best for fur and muscle; use Motion Brush
  on the animal and keep the background static.
- **Hailuo:** shorter prompts; good at gentle motion and smooth camera work.

## Coverage strategy — FULL-MOTION is the default (competitor-match)

Competitor channels animate EVERY shot — nothing is a static still. Default to
**full-motion**: every generated image goes through Veo.

**Tier by SCENE IMPORTANCE, assigned in the shot list — generate directly at that tier
(no mandatory Lite-test pass; that doubles waiting time):**
- **[Q] Quality (~6–9 clips):** the opening 30s, every money shot, high-detail macro
  scenes (beak-and-tick close-ups, parasite clusters, eye cleaning), and the closing shot.
- **[F] Fast (~15–18 clips):** remaining primary-action scenes (rubbing, wallowing,
  landing, wading).
- **[L] Lite (~15–20 clips):** true ambient B-roll only — establishing wides, subject
  standing nearly still. Standard ambient template, swapping only the subject:
  `The [animal] stays almost still, breathing slowly, [one micro-motion: ears flick /
  tail swishes once / skin twitches], grass and dust drift gently, locked-off camera
  with very subtle push-in, natural weight, calm real-time documentary footage,
  ambient natural sound only, no music, no dialogue, no on-screen text`
- **Lite-testing is an EXCEPTION, not a rule:** only pre-test scenes with high melt risk
  (birds bursting into flight, multiple animals moving at once, fast complex motion).
- Budget ≈ 1,300–1,400 credits per 8-min video → Ultra ≈ 7–8 videos/month (~2/week).
- Stretch tricks: slow clips to 0.85–0.9x in the editor (8s → ~9.5s); Extend the best
  clips in Flow; reuse a clip twice in distant sections with a different crop/zoom.
- **Budget fallback (only if the user asks to save credits):** hybrid mode — ~60% stills
  + Ken Burns, ~40% Veo clips. Looks close but not identical to competitors.

## OUTPUT FORMAT

For each image/scene (or each scene in the shot list):
- **Scene N** — [still + Ken Burns] OR [Veo video]
- If Veo: the 5-layer prompt as one English line + audio tail + duration (5/8s) +
  Ingredients vs Frames-to-Video + tier (Lite test → Fast/Quality) + one line on how to
  avoid failure if the scene is risky.
- If still: a suggested Ken Burns move ("slow zoom-in on the eye", "pan left across the herd").

## Notes

- Talk to the user in **Vietnamese**. Prompt output in **English**.
- No engine specified → default to Veo 3.1 (Flow), with a Kling variant.
- Given a shot list from script-wildlife-survival → map every scene and classify
  still vs animated using the ratio strategy above.
