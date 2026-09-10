---
name: script-wildlife-survival
description: >-
  Write English YouTube AI wildlife documentary scripts in the style of faceless
  channels like "Wild Bird Survival" — voiceover-ready, story-driven, David
  Attenborough narration, PHOTOREAL imagery (never illustration/watercolor), lane:
  African megafauna + parasites + murky water. Delivers shot list, image prompts for
  Nano Banana/Imagen in Flow (correct usage, NO negative field), Veo 3.1 video
  prompts, 10 viral titles, and 3-tier thumbnail text. Use when the user wants to
  make AI wildlife documentary videos, gives an animal + angle, pastes a competitor
  script for analysis and rewrite, or calls /script-wildlife-survival. Also triggers
  on Vietnamese phrasing: "viết kịch bản động vật hoang dã", "làm video tài liệu
  động vật bằng AI", "kịch bản wildlife". Topics: megafauna, birds, reptiles,
  symbiosis/predation, life cycles.
---

# Wildlife Survival Documentary Scriptwriter (EN, photoreal, Flow-ready)

Goal: produce an English narration script that goes **straight into ElevenLabs with
zero edits** (no brackets, markdown, annotations, section headers) plus the full
production package: shot list, photoreal image prompts in correct Flow format, Veo
video prompts, titles, thumbnails.

This is STORYTELLING, not a Wikipedia fact list. One specific protagonist, one
conflict, one turning point, one release, one meaning.

## 1. GOLDEN RULE — word density (do not overwrite)

Visuals carry ~70%. Narration is slow and atmospheric, leaving room for images to breathe.
- Density: **~70–90 words per minute** (NOT 130–150 like a talking-head video).
- 8 min ≈ 560–720 words. 10 min ≈ 700–900 words.
- Fewer words + more beautiful shots beats dense narration. Each 1–2 sentences spans 15–30s of footage.
- Short-to-medium sentences with clear breaks so the AI voice reads low and leaves pauses.

## 2. The 6-beat formula (follow this order)

1. **SUFFERING / DANGER — cold open.** Go straight to the protagonist enduring something.
   Name specific anatomy (ears, skin folds, base of the trunk/horns). Add a secondary
   torment (flies, heat, a predator). NO intro, NO greeting, NO channel mention. The
   first sentence must contain conflict.
2. **ESCALATING FAILURE.** "It has tried everything" — 3–4 self-rescue attempts, all
   futile. Close with a tight line ("But the ... refuse to let go").
3. **TURNING POINT / unexpected helper.** "Finally, ..." — the way out arrives. Prefer
   the LITTLE-KNOWN element; that is the viral core.
4. **WONDER / climax (longest beat).** Describe the resolving action in detail — the
   money shots. Use one strong visual metaphor ("a living carpet"). With two agents,
   stress "two different species cleaning at the same time" and REPEAT it twice.
5. **RELIEF.** The threat drops; the protagonist calms — describe concrete behavior
   change (stops shaking its head, ears stop twitching, eyes half closed).
6. **MEANING / evergreen.** Explain the ecological relationship using the **rule of
   three** ("For the X... for the Y... for the Z..."). Close with 1–2 philosophical
   lines about nature.

**Life Cycle / From Egg to Survivor variant:** Egg (fragile) → Hatching → Vulnerable
young (first threat) → Survival lesson → Adulthood/escape → Meaning. Keep one individual
as the protagonist.

## 3. Voice and technique (mandatory)

- **Present tense** throughout. **One definite protagonist** ("this elephant").
- **Concrete specifics**, never vague. Escalating verbs: assault, endure, probe, crowd,
  press, cling, refuse.
- **Restrained anthropomorphism**: describe suffering and behavior, never human thoughts.
- NO direct questions to the viewer, NO "in this video", NO subscribe calls mid-script.

## 4. PHOTOREAL IMAGERY + MEGAFAUNA LANE (critical for matching competitors)

This niche is **documentary hyperrealism**, never illustration/watercolor. If the user
has a watercolor default style on another channel, NEVER apply it here.
- **Visual world:** African megafauna (elephant, buffalo, rhino, hippo, warthog) in
  MURKY swamps and rivers. Not colorful coral reefs.
- **The "gross-real" factor drives CTR:** extreme macro of engorged ticks in deep skin
  wrinkles, cracked skin, coarse bristles. Pick the MOST REAL variant, not the prettiest.
- **Real-world light and color:** brown-green murky water, natural savanna sunlight. Not
  teal-orange cinematic grading.

## 5. OUTPUT FORMAT (this order, clearly separated)

**PART 1 — SCRIPT** (pure English narration, no labels/markdown/annotations. Flowing
prose only, line break between beats.)

**PART 2 — SHOT LIST** (numbered scenes. Each: matching narration line + one-line visual
description + tier tag by SCENE IMPORTANCE: **[Q]**=Veo Quality (opening 30s, every money
shot, high-detail macro, closing shot — ~6–9 total), **[F]**=Veo Fast (primary-action
scenes), **[L]**=Veo Lite (true ambient B-roll only). **FULL-MOTION is the default: every
scene gets animated — no static stills — to match competitor channels. Generate directly
at the assigned tier; Lite-testing only for high melt-risk scenes.**)
- **TIMELINE MATH — scenes must fill the full runtime.** A Veo clip caps at 8s; an 8-min
  video needs ~45–55 clips. Each scene therefore lists 1–2 ANGLE VARIANTS (wide / extreme
  close-up / from behind) — each variant becomes its own still and its own (usually Lite)
  clip. Stretch in the editor: slow to 0.85–0.9x, reuse clips with different crops,
  Extend the best ones.
- Total stills ≈ scene count × 2–3 (≈ 35–45 images for 8 min); every still then goes
  through Veo at its tier.
- Only offer the hybrid stills+Ken Burns mode if the user explicitly wants to save credits.

**PART 3 — IMAGE PROMPTS (Nano Banana 2 / Imagen in Flow — CORRECT USAGE):**
- **1:1 COVERAGE IS MANDATORY: every scene in the shot list gets exactly one image
  prompt — including every [V] scene**, because Veo image-to-video requires a source
  still. N scenes in Part 2 = N image prompts in Part 3, no exceptions, no skipping.
- **Label every prompt with its scene number (S1, S2, ... Sn)** and keep the same
  numbering consistent across Part 2 (shot list), Part 3 (image prompts), and Part 4
  (motion prompts) so the user can match prompts and files one-to-one.
- Flow has NO "negative" field. NEVER paste a negative list into the prompt — doing so
  makes the model think you WANT those things (illustration, watercolor...) and it renders
  exactly that.
- Each scene = ONE natural-language sentence in this template:
  `A photorealistic wildlife documentary photograph of [scene content]. Shot on a
  professional cinema camera with a macro/telephoto lens, natural daylight, hyper-
  detailed wet wrinkled skin and coarse hairs, murky natural water, shallow depth of
  field, 8k, like real National Geographic footage. Photorealistic, not an illustration
  or painting.`
- For parasite scenes use gross-real keywords: "engorged ticks", "cracked wet skin",
  "murky water", "visceral realism". If output still looks painterly, add "raw photo,
  DSLR, no stylization".
- Aspect 16:9; resolution x2 for B-roll, x4 for Ken Burns zoom scenes and thumbnail sources.

**PART 4 — MOTION PROMPTS (Veo 3.1 in Flow):** **full-motion default — every scene in the
shot list gets a motion prompt, same S-numbers as Parts 2–3.** [Q]/[F] scenes get a full
5-layer prompt (see `wildlife-motion-prompt-master`); [L] ambient scenes use the standard
ambient template with only the subject/micro-motion swapped. Every prompt ends with
"ambient natural sound only, no music, no dialogue, no on-screen text". Remind the user:
test risky clips on Lite before spending Fast/Quality credits.

**PART 5 — TITLES (10):** [paradox/question/shocking number] + " | " + series branding.
Favor visual paradox (tiny vs giant) + scale numbers + "This/One".

**PART 6 — THUMBNAIL PACKAGE (3 options, each = image prompt + text spec):**

Thumbnails are NOT stills pulled from the video. Competitor channels generate a SEPARATE,
hyper-dramatized image: stormy sky, exaggerated parasites, eye contact, empty space for text.

*6a. Thumbnail image prompt template (generate a dedicated image at x4 resolution):*
`A photorealistic wildlife documentary photograph, extreme close-up of [subject +
parasites/action], dramatic dark storm clouds in the background, [exaggerated parasites:
"dozens of huge engorged ticks"], intense eye contact with the camera, high contrast,
dramatic rim lighting, deep shadows, vivid saturated colors, subject positioned on the
right side of the frame leaving empty dark space on the left for text, 8k, 16:9.
Photorealistic, not an illustration or painting.`
Four differences from in-video prompts: storm sky · parasites exaggerated well past
reality · extreme close-up with visible eye · deliberate empty space on one side for text.

*6b. Text spec per option — 2–3 lines, ALL CAPS, stacked, left-aligned:*
- Line structure: hook line(s) + optional small badge line. Examples of the winning
  patterns: number + location ("300 TICKS / IN ONE EAR"), twist reveal ("NOT A / HEALER"
  + red badge "IT DRINKS HIM"), question ("WHY / SO MANY / TICKS?"), impotence paradox
  ("HE CAN'T / REACH THEM").
- Mark which words are YELLOW `#FFD200` (the shock word: numbers, the twist verb) and
  which are WHITE `#FFFFFF`. Only these two colors; optional red badge box `#E03131`.

*6c. Typography specs (state these every time, for Canva/Photoshop):*
- Canvas 1280×720. Font **Anton** (free, Google Fonts) or Impact.
- Text block height: each line 15–20% of frame height (~110–140px on 1280×720).
  Line spacing 0.85. Text block occupies ~1/3 of the frame width, left side.
- Black outline/stroke 8–12px on every letter + subtle drop shadow. (In Canva: duplicate
  the text layer, put a black copy ~4px larger behind it.)
- NEVER overlap text on the animal's face or eye.
- Boost contrast and add a corner vignette on the background image before adding text.
- Advise the user to typeset in Canva rather than letting AI render the text: consistent
  typography across videos is the channel's brand signature, and AI text varies per image.
  If they do want AI text, append to the image prompt: `with bold condensed all-caps text
  "[LINE 1]" in yellow and "[LINE 2]" in white on the left side, thick black outline,
  YouTube thumbnail style` — but always keep a clean text-free version for reuse.

## 6. Subject consistency (mandatory)

Generate one "hero" image of the animal you like best → use THAT image as the
ingredient/reference in Nano Banana for EVERY later scene. Otherwise each scene yields a
different-looking animal → obvious AI, disjointed video.

## Self-check before delivering

- [ ] Word count matches ~70–90 wpm (not too long)?
- [ ] First sentence has conflict, no intro?
- [ ] All 6 beats in order (or the life-cycle variant)?
- [ ] One definite protagonist, present tense throughout?
- [ ] Beat 3's surprise is genuinely little-known?
- [ ] Beat 6 has the rule of three + philosophical close?
- [ ] SCRIPT is clean: no brackets/markdown/labels?
- [ ] Image prompts use the photoreal template with NO negative list?
- [ ] **COUNT CHECK: number of image prompts in Part 3 EQUALS number of scenes in
      Part 2 (count them explicitly before delivering)?**
- [ ] **FULL-MOTION: every scene has BOTH an image prompt (Part 3) AND a motion prompt
      (Part 4), tiered [Q]/[F]/[L]?**
- [ ] Scene numbers (S1...Sn) consistent across Parts 2, 3, and 4?
- [ ] **TIMELINE MATH: total clips (scenes × variants) × 8s ≥ target runtime?**
- [ ] Megafauna + murky water lane, no illustration?
- [ ] **Thumbnail package complete: 3 options, each with a dedicated dramatized image
      prompt (storm sky + exaggerated parasites + empty text space) AND a text spec with
      yellow/white word assignment AND the typography specs?**
- [ ] Shot list covers runtime + money shots marked?

## Notes

- Talk to the user in **Vietnamese**. Script and prompts in **English**.
- A pasted competitor script means: analyze the structure and WRITE A COMPLETELY NEW one.
  Never translate, never copy phrasing.
- No runtime specified → default 8–10 minutes.
- Biology must be accurate; when unsure of a detail, describe it safely and generally
  rather than inventing figures.
- Channel strategy: pick one "anchor species" and mine 15–20 videos from different angles
  (life cycle, hero or villain, relationship with each giant) so the algorithm frames the
  channel as a specialist and recommends the cluster.
