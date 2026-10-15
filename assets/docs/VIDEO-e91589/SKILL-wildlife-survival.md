---
name: script-wildlife-survival
description: >-
  Write English YouTube AI wildlife documentary scripts in the style of faceless
  channels — voiceover-ready, story-driven, documentary-style narration, photoreal
  imagery (never illustration/watercolor), lane: large wild animals + parasites +
  murky water. Delivers shot list, image prompts for the image tool (correct usage,
  no negative field), video prompts, viral titles, and tiered thumbnail text.
  Use when the user wants to
  make AI wildlife documentary videos, gives an animal + angle, pastes a competitor
  script for analysis and rewrite, or calls /script-wildlife-survival. Also triggers
  on tiếng Việt phrasing: "viết kịch bản động vật hoang dã", "làm video tài liệu
  động vật bằng AI", "kịch bản wildlife". Topics: megafauna, birds, reptiles,
  symbiosis/predation, life cycles.
---

# Wildlife Survival Documentary Scriptwriter (EN, photoreal, Flow-ready)

Goal: produce an English narration script that goes **straight into the voice tool with
zero edits** (no brackets, markdown, annotations, section headers) plus the full
production package: shot list, photoreal image prompts in the correct format,
video prompts, titles, thumbnails.

This is storytelling, not a list of facts. One specific protagonist, one
conflict, one turning point, one release, one meaning.

## 1. GOLDEN RULE — word density (do not overwrite)

Visuals carry most of the weight. Narration is slow and atmospheric, leaving room for images to breathe.
- Density: **low words per minute**, slower than a talking-head video.
- Fewer words + more beautiful shots beats dense narration. Each sentence or two spans a long stretch of footage.
- Sentences are short to medium with clear breaks so the AI voice reads low and leaves pauses.

## 2. The 6-beat formula (follow this order)

1. **Suffering / danger — cold open.** Go straight to the protagonist enduring something.
   Name specific anatomy (ears, skin folds, base of the trunk/horns). Add a secondary
   torment (flies, heat, a predator). NO intro, NO greeting, NO channel mention. The
   first sentence must contain conflict.
2. **Escalating failure.** "It has tried everything" — several self-rescue attempts, all
   futile. Close with a tight line (e.g. "the ... refuse to let go").
3. **Turning point / unexpected helper.** "finally, ..." — the way out arrives. Prefer
   the little-known element; that is the viral core.
4. **Wonder / climax (longest beat):** describe the resolving action in detail — the
   money shots. Use one strong visual metaphor ("a living carpet"). With two agents,
   stress "two different species cleaning at the same time" and repeat it twice.
5. **RELIEF.** The threat drops; the protagonist calms — describe concrete behavior
   change (stops shaking its head, ears stop twitching, eyes half closed).
6. **Meaning / evergreen:** explain the ecological relationship using the **rule of
   three** ("for the X... for the Y... for the Z..."). Close with a couple of philosophical
   lines about nature.

**Variant for a life cycle:** egg (fragile) → hatching → vulnerable
young (first threat) → survival lesson → adulthood/escape → meaning. Keep one individual
as the protagonist.

## 3. Voice and technique (mandatory)

- **Present tense** throughout. **One definite protagonist** ("this elephant").
- **Concrete specifics**, never vague. Escalating verbs: assault, endure, probe, crowd,
  press, cling, refuse.
- **Restrained anthropomorphism**: describe suffering and behavior, never human thoughts.
- NO direct questions to the viewer, NO "in this video", NO subscribe calls mid-script.

## 4. PHOTOREAL IMAGERY + MEGAFAUNA LANE (critical for matching competitors)

This niche is **documentary hyperrealism**, never illustration/watercolor. If the user
has a watercolor default style on another channel, never apply it here.
- **Visual world:** megafauna (elephant, buffalo, rhino, hippo, warthog) in
  MURKY swamps and rivers. Not colorful coral reefs.
- **The "gross-real" factor drives CTR:** extreme macro of engorged ticks in deep skin
  wrinkles, cracked skin, coarse bristles. Pick the most real variant, not the prettiest.
- **Natural light and color:** brown-green murky water, natural savanna sunlight. Not
  teal-orange cinematic grading.

## 5. OUTPUT FORMAT (this order, clearly separated)

**PART 1 — SCRIPT** (pure English narration, no labels/markdown/annotations. Flowing
prose only, line break between beats.)

**Part 2 — shot list** (numbered scenes. Each: matching narration line + one-line visual
description + tier tag by scene importance: **[Q]**=top quality tier (opening, every money
shot, high-detail macro, closing shot — a small number in total), **[F]**=fast tier (primary-action
scenes), **[L]**=lite tier (true ambient B-roll only). **full-motion is the default: every
scene gets animated — no static stills — to match competitor channels. Generate directly
at the assigned tier; lite-testing only for high melt-risk scenes.**)
- **Timeline math — scenes must fill the full runtime.** A video clip is short; a long
  video needs many clips. Each scene therefore lists a few angle variants (wide / extreme
  close-up / from behind) — each variant becomes its own still and its own (usually lite)
  clip. Stretch in the editor: slow the clips down slightly, reuse clips with different crops,
  Extend the best ones.
- Total stills ≈ scene count × a few angle variants; every still then goes
  through the video tool at its tier.
- Only offer the hybrid stills+slow-zoom mode if the user explicitly wants to save credits.

**Part 3 — image prompts (image tool — correct usage):**
- **1:1 coverage is mandatory: every scene in the shot list gets exactly one image
  prompt — including every [V] scene**, because image-to-video requires a source
  still. N scenes in Part 2 = N image prompts in Part 3, no exceptions, no skipping.
- **Label every prompt with its scene number (S1, S2, ... Sn)** and keep the same
  numbering consistent across Part 2 (shot list), Part 3 (image prompts), and Part 4
  (motion prompts) so the user can match prompts and files one-to-one.
- The image tool has no "negative" field. Never paste a negative list into the prompt — doing so
  makes the model think you want those things (illustration, watercolor...) and it renders
  exactly that.
- Each scene = one natural-language sentence in this template:
  `A photorealistic wildlife documentary photograph of [scene content]. Shot on a
  professional cinema camera with a macro/telephoto lens, natural daylight, hyper-
  detailed wet wrinkled skin and coarse hairs, murky natural water, shallow depth of
  field, 8k, like real documentary footage. Photorealistic, not an illustration
  or painting.`
- For parasite scenes use gross-real keywords: "engorged ticks", "cracked wet skin",
  "murky water", "visceral realism". If output still looks painterly, add "raw photo,
  DSLR, no stylization".
- Aspect 16:9; higher resolution for B-roll, zoom scenes and thumbnail sources.

**Part 4 — motion prompts (video tool):** **full-motion default — every scene in the
shot list gets a motion prompt, same scene numbers as parts 2–3.** [Q]/[F] scenes get a full
layered prompt (see `wildlife-motion-prompt-master`); [L] ambient scenes use the standard
ambient template with only the subject/micro-motion swapped. Every prompt ends with
"ambient natural sound only, no music, no dialogue, no on-screen text". Remind the user:
test risky clips on the lite tier before spending fast/quality-tier credits.

**Part 5 — titles:** [paradox/question/shocking number] + " | " + series branding.
Favor visual paradox (tiny vs giant) + scale numbers + "this/one".

**Part 6 — thumbnail package (several options, each = image prompt + text spec):**

Thumbnails are not stills pulled from the video. Competitor channels generate a separate,
hyper-dramatized image: stormy sky, exaggerated parasites, eye contact, empty space for text.

*6a. Thumbnail image prompt template (generate a dedicated image at high resolution):*
`A photorealistic wildlife documentary photograph, extreme close-up of [subject +
parasites/action], dramatic dark storm clouds in the background, [exaggerated parasites:
"dozens of huge engorged ticks"], intense eye contact with the camera, high contrast,
dramatic rim lighting, deep shadows, vivid saturated colors, subject positioned on the
right side of the frame leaving empty dark space on the left for text, 8k, 16:9.
Photorealistic, not an illustration or painting.`
Four differences from in-video prompts: storm sky · parasites exaggerated well past
reality · extreme close-up with visible eye · deliberate empty space on one side for text.

*6b. Text spec per option — a few lines, all caps, stacked, left-aligned:*
- Line structure: hook line(s) + optional small badge line. Examples of the winning
  patterns: number + location, twist reveal (plus a red badge line), question,
  impotence paradox.
- Mark which words are yellow (the shock word: numbers, the twist verb) and
  which are white. Only these two colors; optional red badge box.

*6c. Typography specs (state these every time, for the layout editor):*
- Canvas at the standard thumbnail size. Use a bold condensed free font.
- Text block height: each line takes a sizeable share of the frame height.
  Tight line spacing. Text block occupies the left side of the frame.
- Black outline/stroke on every letter + subtle drop shadow. (Trick: duplicate
  the text layer, put a black copy slightly larger behind it.)
- Never overlap text on the animal's face or eye.
- Boost contrast and add a corner vignette on the background image before adding text.
- Advise the user to typeset in the layout editor rather than letting AI render the text: consistent
  typography across videos is the channel's brand signature, and AI text varies per image.
  If they do want AI text, append to the image prompt: `with bold condensed all-caps text
  "[line 1]" in yellow and "[line 2]" in white on the left side, thick black outline,
  YouTube thumbnail style` — but always keep a clean text-free version for reuse.

## 6. Subject consistency (mandatory)

Generate one "hero" image of the animal you like best → use that image as the
ingredient/reference in the image tool for every later scene. Otherwise each scene yields a
different-looking animal → obvious AI, disjointed video.

## Self-check before delivering

- [ ] word count matches the slow narration pace (not too long)?
- [ ] first sentence has conflict, no intro?
- [ ] all 6 beats in order (or the life-cycle variant)?
- [ ] one definite protagonist, present tense throughout?
- [ ] beat 3's surprise is genuinely little-known?
- [ ] beat 6 has the rule of three + philosophical close?
- [ ] SCRIPT is clean: no brackets/markdown/labels?
- [ ] Image prompts use the photoreal template with NO negative list?
- [ ] **count check: number of image prompts in Part 3 equals number of scenes in
      Part 2 (count them explicitly before delivering)?**
- [ ] **full-motion: every scene has both an image prompt (Part 3) and a motion prompt
      (Part 4), tiered [Q]/[F]/[L]?**
- [ ] Scene numbers (S1...Sn) consistent across parts 2, 3, and 4?
- [ ] **timeline math: total clips (scenes × variants) × clip length ≥ target runtime?**
- [ ] megafauna + murky water lane, no illustration?
- [ ] **Thumbnail package complete: 3 options, each with a dedicated dramatized image
      prompt (storm sky + exaggerated parasites + empty text space) and a text spec with
      yellow/white word assignment and the typography specs?**
- [ ] Shot list covers runtime + money shots marked?

## Notes

- Talk to the user in **tiếng Việt**. Script and prompts in **English**.
- A pasted competitor script means: analyze the structure and write a completely new one.
  Never translate, never copy phrasing.
- No runtime specified → default 8–10 minutes.
- Biology must be accurate; when unsure of a detail, describe it safely and generally
  rather than inventing figures.
- Channel strategy: pick one "anchor species" and mine 15–20 videos from different angles
  (life cycle, hero or villain, relationship with each giant) so the algorithm frames the
  channel as a specialist and recommends the cluster.
