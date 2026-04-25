# Flux Image Generation Prompts — Case #001 (Open Investigation v1.0)

**Platform:** fal.ai (recommended)  
**Models:**
- `fal-ai/flux-pro/v1.1-ultra` for locations (16:9, higher detail)
- `fal-ai/flux-pro/v1.1` for character base portraits (2:3)
- `fal-ai/flux-pulid` for character emotional variations (face consistency, uses base portrait as face reference)

---

## Generation Workflow

1. Generate base portraits first (one per character) using listed seeds
2. Verify quality, regenerate with different seeds if face is off
3. Use Flux PuLID with the approved base portrait as face reference for emotional variants
4. Generate locations independently
5. Evidence images optional for MVP

**Total estimated cost:** ~$3-4 for all assets

---

## Global Style Block

Append this to EVERY portrait and location prompt:

```
Cinematic illustration style, grounded realism, muted cinematic color palette with desaturated blues and warm tungsten highlights, film noir meets contemporary small-town drama. Visual references: "Mare of Easttown", "Sharp Objects", "True Detective season 1". Soft directional lighting, natural imperfections, no glossy stylization. Photorealistic illustration, not pure photograph.
```

---

## CHARACTER PORTRAITS

### Tom Brennan (THE MURDERER — appears innocent at first)

**Seed:** 42101  
**Aspect ratio:** 2:3  
**Critical:** Tom must look like a respectable, charming local businessman. NOT obviously sinister. The horror reveals only as the player uncovers his secrets.

#### Tom — WARM (base, first appearance)
```
Portrait of Tom Brennan, a 52-year-old white American man, 5'11" with broad shoulders, grayish-brown receding hair neatly combed, clean-shaven with a faint shadow, warm hazel eyes with the beginnings of laugh lines. Wearing a tailored navy blazer over a crisp light-blue button-down shirt (top button undone, no tie), khaki dress pants. A wedding ring on his left hand. A subtle wristwatch. Expression: warm, sympathetic, slightly somber — the look of a family friend offering condolences. Standing in the bakery's front area, soft morning light from the window, slightly blurred crime scene tape visible in the background. Natural skin texture, age-appropriate lines, healthy color but a hint of fatigue around the eyes. [STYLE BLOCK]. Seed: 42101.
```

#### Tom — GUARDED (under questioning, mask starting to crack)
```
Same subject as Tom Brennan base portrait (same face, same wardrobe). Expression: composed but tense, jaw slightly tightened, eyes fixed forward, mouth in a controlled neutral line. Body language: seated at an interrogation table, hands clasped on the surface, shoulders squared, posture upright. Same lighting moved indoors — colder fluorescent overhead. Subtle sheen of sweat at the temple. [STYLE BLOCK]. Seed: 42101.
```

#### Tom — CRACKING (when affair/divorce evidence presented)
```
Same subject as Tom Brennan base portrait. Expression: visible vulnerability, brow furrowed, eyes slightly unfocused looking down and to the side, lips parted as if holding back words, jaw less controlled. Body language: one hand running through his hair, the other gripping the edge of the table. Cold interrogation lighting. The salesman polish is gone — beneath it is exhaustion. [STYLE BLOCK]. Seed: 42101.
```

#### Tom — BROKEN (final breakdown on DNA evidence)
```
Same subject as Tom Brennan base portrait. Expression: hollow, defeated, eyes wet but not crying, mouth slack, looking at nothing. Body language: shoulders collapsed forward, arms loose at sides, head bowed slightly. The mask is completely off. Cold interrogation lighting. The look of a man whose life is over and who knows it. [STYLE BLOCK]. Seed: 42101.
```

---

### Sarah Kim

**Seed:** 42001  
**Aspect ratio:** 2:3

#### Sarah — CALM (base)
```
Portrait of Sarah Kim, a 41-year-old Korean-American woman, 5'8" tall, shoulder-length straight dark brown hair tied back in a low ponytail with a few loose strands at the temples, wearing a tailored black silk blouse with a thin silver chain necklace, minimal but carefully applied makeup (neutral tones), small diamond stud earrings. Expression: composed, professionally grieving, mouth slightly firm, eyes focused but tired with faint shadows beneath, controlled stillness. Seated at a plain wooden interrogation table, hands resting folded on the table surface, neutral gray concrete wall background with soft directional lighting from the upper left. Natural skin texture, fine pores, subtle under-eye circles. [STYLE BLOCK]. Seed: 42001.
```

#### Sarah — GUARDED
```
Same subject as Sarah Kim base portrait. Expression: guarded, jaw slightly tightened, eyes narrowed, lips pressed thinly, slight defensive head tilt. Hands clasped tighter on the table, knuckles slightly paler, shoulders rigid. Same lighting. [STYLE BLOCK]. Seed: 42001.
```

#### Sarah — PANICKED (mid-interrogation)
```
Same subject as Sarah Kim base portrait. Expression: visibly tense, crease between brows, eyes wider and darting, lips parted as if to speak, faint sheen of sweat at hairline, one strand of hair loose by her cheek. Body language: one hand reached up to touch her collar, other gripping the table edge, shoulders hunched forward slightly. Same lighting. [STYLE BLOCK]. Seed: 42001.
```

#### Sarah — BROKEN (final breakdown on Margaret's note)
```
Same subject as Sarah Kim base portrait. Expression: emotionally devastated, eyes red-rimmed with tears running down both cheeks, mascara slightly smudged, mouth slack and trembling, chin quivering, hair loose around her face from her previously neat ponytail. Body language: shoulders collapsed forward, one hand covering her mouth, the other gripping the table edge as if holding herself up, body curled inward. Her professional polish is gone — she looks finally, utterly human. Same lighting. [STYLE BLOCK]. Seed: 42001.
```

---

### David Cole

**Seed:** 42002  
**Aspect ratio:** 2:3

#### David — GRIEVING (base)
```
Portrait of David Cole, a 58-year-old white American man, 5'11" thin build with slight stoop, graying brown hair receding at the temples and thinning on top, clean-shaven with a three-day beard shadow (silver-gray), tired hazel eyes, deep lines around eyes and mouth. Wearing a worn brown cardigan over a faded light-blue button-down shirt, reading glasses hanging from his collar on a black cord. Expression: exhausted, grieving, hollow-eyed, gaze slightly downward, mouth neutral but tired, jaw soft. Seated in his living room armchair (olive-green upholstery, well-worn), warm tungsten lamp light from side-right, slightly blurry family photographs visible in the background on a wall. Natural skin texture with age spots on the temples, wrinkles, dry skin. [STYLE BLOCK]. Seed: 42002.
```

#### David — DEFENSIVE
```
Same subject as David Cole base portrait. Expression: defensive, slight frown, jaw tightened, eyes meeting the camera directly (uncomfortable eye contact), mouth in a firm line. Body language: leaning slightly back in the armchair, arms folded across chest, one hand picking at his thumbnail. Same lighting. [STYLE BLOCK]. Seed: 42002.
```

#### David — BROKEN (on phone log evidence — confessing to affair)
```
Same subject as David Cole base portrait. Expression: relieved-broken, head bowed forward, one hand covering his eyes, the other limp in his lap, shoulders shaking minimally. Tears visible on his cheek. A man whose worst secret has finally come out — and a strange relief beneath the grief. Same lighting. [STYLE BLOCK]. Seed: 42002.
```

---

### Daniel Kim (NEW)

**Seed:** 42102  
**Aspect ratio:** 2:3

#### Daniel — EDGY (base)
```
Portrait of Daniel Kim, a 33-year-old Korean-American man, 5'10" thin build (too thin, malnourished), looks closer to 40 than 33, dark circles under his eyes, unshaven 2-3 day stubble, messy short black hair he hasn't combed, cracked dry lips. Wearing a worn gray hoodie (zipper half-down) over a faded t-shirt, the same hoodie he's worn three days running. Expression: edgy, defensive, eyes flicking sideways, mouth in a tight line. Hands visible in frame, slightly shaking. Seated at an interrogation table, harsh fluorescent overhead lighting making his pallor look worse. Natural skin texture showing the toll of addiction — tired, slightly sallow. [STYLE BLOCK]. Seed: 42102.
```

#### Daniel — HOSTILE
```
Same subject as Daniel Kim base portrait. Expression: angry, brow furrowed deeply, mouth set in defiant frown, eyes locked aggressively on the viewer. Body language: leaning forward slightly, jaw set, one fist clenched on the table. Same harsh lighting. [STYLE BLOCK]. Seed: 42102.
```

#### Daniel — BROKEN (on DNA evidence — sob-crying)
```
Same subject as Daniel Kim base portrait. Expression: completely undone, sob-crying, face contorted, tears streaming, mouth open in distress, eyes screwed shut. Body language: face dropped into both hands on the table, shoulders heaving, body curled forward. Same harsh lighting making the moment feel raw and unflattering. [STYLE BLOCK]. Seed: 42102.
```

---

### Martin Reyes

**Seed:** 42003  
**Aspect ratio:** 2:3

#### Martin — NERVOUS (base, his dominant state)
```
Portrait of Martin Reyes, a 24-year-old Guatemalan-American man, 5'7" lean build, short black hair neatly combed, clean-shaven, dark brown eyes with thick lashes, kind but anxious face. Wearing a white cotton baker's apron over a plain dark gray t-shirt, a smudge of flour on the apron, small silver chain necklace at the collar. Expression: nervous, polite, respectful, eyes slightly downcast, lips pressed in a small sad line, brows drawn together in worry. Body language: holding his own left wrist with his right hand (self-comforting gesture), seated on a simple metal chair in the front of the bakery, morning light through a window behind him creating gentle backlight. Natural skin texture, youthful but with seriousness beyond his years, slight under-eye darkness from a sleepless night. [STYLE BLOCK]. Seed: 42003.
```

#### Martin — COOPERATIVE/SAD (after Margaret's note revealed)
```
Same subject as Martin Reyes base portrait. Expression: sad but more open, eyes meeting the detective's gaze, mouth soft, small resigned nod quality. Hands now in his lap, less tense, slightly forward-leaning. Same lighting. [STYLE BLOCK]. Seed: 42003.
```

---

### Tyler Cole

**Seed:** 42004  
**Aspect ratio:** 2:3  
**Note:** Only one portrait needed for MVP — teenager who doesn't shift much emotionally.

#### Tyler — NUMB
```
Portrait of Tyler Cole, a 16-year-old white American teenage boy, 5'9" tall and skinny, messy medium-length light-brown hair falling over his forehead covering part of his eyes, faint acne on his forehead and chin, clean-shaven with starting facial hair, wearing a worn gray hoodie pulled partially up around the neck over a plain t-shirt. Expression: numb, empty, eyes unfocused staring at something just past the viewer, mouth slightly open but not speaking, jaw slack. Body language: slouched on the edge of his teenage bed, picking at the cuff of his hoodie sleeve with the other hand, shoulders forward. Dim natural light from a window, blurry movie posters and gaming paraphernalia in the background. Natural skin with adolescent texture, faint acne, still-developing features. [STYLE BLOCK]. Seed: 42004.
```

---

### Kevin Pratt

**Seed:** 42005  
**Aspect ratio:** 2:3  
**Note:** One portrait sufficient for MVP.

#### Kevin — HELPFUL
```
Portrait of Kevin Pratt, a 35-year-old white American man, 5'10" average build, completely shaved head (embracing baldness), clean-shaven, friendly hazel eyes with the beginnings of laugh lines, slight stubble on the scalp. Wearing a crisp navy-blue button-down shirt (top button undone) tucked into blue jeans. Expression: open, chatty, slightly amused, eyebrows raised in curious interest, mouth with a small helpful smile, leaning forward with engagement. Standing behind a dark polished wooden bar, holding a clean pint glass that he's polishing with a white bar towel, blurred shelves of liquor bottles on backlit glass shelves behind him, afternoon light from a window on the right. Natural skin, healthy and tanned, faint laugh lines. [STYLE BLOCK]. Seed: 42005.
```

---

### Mrs. Eleanor Carrington (NEW)

**Seed:** 42103  
**Aspect ratio:** 2:3  
**Note:** One portrait sufficient.

#### Mrs. Carrington — WARM
```
Portrait of Mrs. Eleanor Carrington, a 79-year-old white American woman, 5'2" small-framed, gray hair pulled back in a low bun, soft wrinkled face with kind blue eyes behind silver-rimmed reading glasses, clean cheeks with the natural blush of age. Wearing a soft pink floral cardigan over a cream blouse with a small pearl brooch at the collar. Expression: warm, attentive, genuinely interested in the conversation, slight smile at the corners of her mouth. Seated in a vintage floral-patterned armchair in her front room, holding a delicate teacup on a saucer, afternoon light through lace curtains, blurred bookshelves and framed photographs in the background. House feels lived-in — lavender-scented, slightly old-fashioned. Natural skin texture showing her age — fine wrinkles, age spots, healthy color. [STYLE BLOCK]. Seed: 42103.
```

---

## LOCATION ILLUSTRATIONS

**Aspect ratio:** 16:9  
**Model:** Flux Pro v1.1 Ultra (higher detail for environment)

### loc_bakery_main (Front of Bakery)
**Seed:** 43001
```
Interior of a small-town American family bakery, viewed from the customer entrance looking in. Warm pendant lighting from copper-colored fixtures hanging over the space. Cherry-wood display cases along the right wall still stocked with a few remaining rustic sourdough loaves, flaky croissants, and a single covered cake — Saturday's leftover inventory. Four small round café tables with mismatched wooden chairs by the front window (window looks out onto Olive Street, partly visible). A chalkboard menu behind a wooden counter shows handwritten daily specials in neat capital lettering: "SUNDAY: Brioche French Toast — $8". Morning sunlight streaming through the front windows, dust motes visible in the beams. Yellow crime scene tape stretched across a wooden door on the back wall (door slightly ajar). Atmosphere: sad, paused, the smell of cold bread. The bakery hasn't opened. No people visible. [STYLE BLOCK]. Seed: 43001.
```

### loc_backroom (Crime Scene)
**Seed:** 43002
```
Interior of a commercial bakery backroom kitchen, viewed from the doorway looking in. Two large stainless steel commercial ovens along the left wall. A large stainless steel prep table in the center of the room, its surface dusted with white flour and marked with the ghost-traces of recent work. A wooden back wall shelf lined with baking tools — rolling pins, whisks, measuring cups (all present, untouched). A small wooden desk in the corner with papers neatly organized and a notable square outline in the desk dust where a heavy paperweight used to sit (now missing). A white chalk outline of a body on the floor near the prep table. Small yellow evidence marker tents (numbered 1, 2, 3, 4, 5) placed around the floor — by the body, by the back door, near the desk. A solid steel back door on the right, closed. Cold harsh overhead fluorescent lighting casting unforgiving shadows. Flour traces scattered across the tiled floor with two distinct partial footprints visible. Atmosphere: grim, still, recently processed by forensics. [STYLE BLOCK]. Seed: 43002.
```

### loc_cole_house (Living Room)
**Seed:** 43003
```
Interior of a modest American two-story colonial home living room, viewed from the doorway. A worn gray upholstered couch along the back wall with a knit throw blanket folded over one armrest. A wall to the right filled with framed family photographs at various ages — slightly blurred enough not to be the focus but clearly numerous, with the most recent photos noticeably sparser than the earlier ones. A wooden side table next to the couch with a cold half-finished cup of coffee, reading glasses resting beside it, and a closed paperback novel. Heavy beige curtains drawn mostly closed over a front window, allowing only thin slices of afternoon light through. A small flatscreen TV turned off. An empty armchair (olive-green, well-worn) facing the TV. Atmosphere: heavy, quiet, a house in mourning, lived-in but not neglected. No people visible. [STYLE BLOCK]. Seed: 43003.
```

### loc_olive_bar (Bar Interior)
**Seed:** 43004
```
Interior of a small neighborhood American bar, viewed from the entrance. A long dark wooden bar along the right wall with ten worn leather bar stools, bottles of liquor on backlit glass shelves behind the bar (soft amber and green lighting). Ten small two-person tables on the left side of the narrow space, simple wooden chairs. Low pendant lights hanging over the tables, dim and warm. An old vinyl classic rock album framed on a brick-and-wood wall as decoration. A small acoustic corner at the far end (empty). A back door marked "EXIT" at the rear. Afternoon, almost empty, golden hour light streaming through a front window on the left. Atmosphere: smells like old beer and wood polish. [STYLE BLOCK]. Seed: 43004.
```

### loc_brennan_office (NEW — Tom's Office)
**Seed:** 43005
```
Interior of a small commercial real estate office in a small-town downtown, viewed from the front door. Mid-century professional furniture: a large mahogany desk in the center facing the door, leather executive chair behind it, two visitor chairs in front. Framed real estate awards and Chamber of Commerce certificates on a beige wall. A bookshelf with binders and property listings. A single window behind the desk looking out onto a parking lot and beyond it, the line of trees marking Mill Creek. A reception desk near the entrance, currently empty. Late afternoon light, slightly cold and overcast outside. Atmosphere: professional, small-town businessman aesthetic, suggestion that things are not as steady as they appear (a slightly disheveled desk, a coat hanging haphazardly). [STYLE BLOCK]. Seed: 43005.
```

### loc_carrington_house (NEW — Eleanor's home, optional)
**Seed:** 43006
```
Interior of an elderly woman's small front parlor, viewed from the doorway. Vintage floral wallpaper, a vintage floral-patterned armchair angled toward a large bay window looking out onto a residential street (with the bakery visible in the distance across the street). A small antique side table with a tea service — porcelain teapot, cup and saucer, sugar bowl. Lace curtains. Bookshelves with leather-bound books. Framed black-and-white wedding photo on a side wall (her late husband Harold). Soft lavender-scented atmosphere, golden afternoon light filtered through lace. Time-frozen, well-loved, slightly dusty in the way old houses are. [STYLE BLOCK]. Seed: 43006.
```

---

## EVIDENCE IMAGES (Optional for MVP)

**Aspect ratio:** 1:1 (square) or 4:3  
**Model:** Flux Pro v1.1  
**Style override:** Forensic photography style (overrides global cinematic style)

```
FORENSIC STYLE BLOCK: Forensic evidence photography style: harsh overhead lighting, neutral gray background or the surface where found, evidence marker and photographic ruler in frame where appropriate, documentary style, photorealistic, no artistic flourish, clinical detachment.
```

### ev_footprint_44 (Sarah's boot print)
**Seed:** 44001
```
Close-up forensic photograph of a size 12 US combat-style boot footprint on a dark kitchen tile floor, the print partially impressed in white flour dust, clearly showing a distinctive aggressive lug tread pattern (deep grooves, angular, tactical style), a forensic photographic ruler with centimeter markings placed next to the print, a small yellow evidence marker "3" visible in the top-right corner. Harsh overhead flash lighting. [FORENSIC STYLE]
```

### ev_partial_footprint_size_11 (Tom's dress shoe — KEY EVIDENCE)
**Seed:** 44002
```
Close-up forensic photograph of a partial dress shoe footprint on a dark kitchen tile floor, smudged in light flour dust, smaller than a combat boot — approximately size 11 US, smooth leather sole pattern with a slight heel marking, partially overlapping with the chalk body outline edge. Forensic ruler placed next to it, evidence marker "5" in the corner. Harsh overhead flash. [FORENSIC STYLE]
```

### ev_margaret_note
**Seed:** 44003
```
Close-up forensic photograph of a handwritten note on slightly wrinkled white lined paper, the text reads exactly: "S — 47k, talk Sun eve, police Mon AM". The handwriting is neat cursive in blue ballpoint pen, legible, with a small date "Fri" written in the top-right corner. The note rests on a plain wooden desk surface. Evidence marker "7" visible. Harsh overhead lighting. [FORENSIC STYLE]
```

### ev_missing_paperweight
**Seed:** 44004
```
Close-up photograph of a small wooden desk surface, lit harshly from above, showing a clean square outline (approximately 4 inches by 4 inches) in a thin layer of dust, marking where a heavy object recently rested. The surrounding desk is dusty but the square is clean. Evidence marker "9" visible. [FORENSIC STYLE]
```

### ev_paperweight_in_creek (THE MURDER WEAPON)
**Seed:** 44005
```
Close-up forensic photograph of a bronze square paperweight (approximately 4 inches by 4 inches), engraved in raised letters "MILLBROOK CHAMBER OF COMMERCE 2019", lying on a forensic blue tarp. The weapon is wet — recently recovered from a creek — with mud streaks and a slightly tarnished surface. One corner has visible dark brown blood and hair traces on the bronze. Forensic ruler beside it, evidence marker "12" in the corner. Harsh overhead lighting. [FORENSIC STYLE]
```

### ev_phone_log (David's call to Helen)
**Seed:** 44006
```
Close-up photograph of an old cordless home phone handset resting on its charging base, the small digital display showing call history: "LAST OUTGOING: 22:30 Sun, (555)-0137, Duration 14:03". The phone sits on a wooden side table. Evidence marker "4" in the corner. Natural indoor lighting (less harsh than other evidence — this was photographed in situ). [FORENSIC STYLE]
```

### ev_margaret_cell_log_tom (KEY EVIDENCE)
**Seed:** 44007
```
Close-up photograph of a printed phone bill page, lit by office lighting, showing a list of incoming calls to Margaret's bakery landline. One row highlighted in yellow marker: "INCOMING - Sun 22:15 - duration 9:04 - originating: 555-0182 (T. BRENNAN cell)". Evidence marker "8" in the corner. [FORENSIC STYLE]
```

### ev_bar_receipt
**Seed:** 44008
```
Close-up forensic photograph of a thermal printer bar receipt, slightly curled paper. Visible text: "OLIVE BAR" bold at the top, "Table 4 — Sarah K.", "Opened: Sun 22:03", itemized list showing "Pinot Noir x2" and "Blue Moon x1", "Closed: 23:04", "Total: $24.00". Resting on a neutral gray surface. Evidence marker "6" in the corner. [FORENSIC STYLE]
```

### ev_bank_statements
**Seed:** 44009
```
Close-up photograph of printed bank statement pages spread on a desk, standard American business account format, showing a list of transactions with visible outgoing wire transfers of varying amounts over 8 months — five transfers highlighted in yellow highlighter by an investigator. The top of the page shows "COLE & SONS LLC — BUSINESS ACCOUNT - JUNE 2023". Evidence marker "10" in the corner. [FORENSIC STYLE]
```

### ev_dna_door_handle
**Seed:** 44010
```
Close-up photograph of a steel back door handle, dusted with black fingerprint powder showing partial prints, a forensic swab in a plastic evidence bag laid next to it for scale. The door is industrial gray-painted steel. Evidence marker "11" in the corner. [FORENSIC STYLE]
```

### ev_tom_old_key
**Seed:** 44011
```
Close-up photograph of a single brass key with a worn paper tag attached by string, the tag reading in faded handwriting "Cole & Sons - back". The key is slightly tarnished, lying on a desk surface inside an office desk drawer (drawer visible at the edges of frame). Evidence marker "13" in the corner. [FORENSIC STYLE]
```

### ev_security_camera_glimpse
**Seed:** 44012
```
A still frame from a low-resolution street security camera, grainy and slightly pixelated, timestamp visible in the corner: "03/17 23:38:14". The image shows a man from behind, mid-step, walking into a dark alley between buildings. He is wearing a navy blazer and khaki pants. His face is not visible — only the back of his head and shoulders. Streetlight casting partial illumination. The image is intentionally not high-resolution — this is the limitation of the evidence. [STYLE OVERRIDE: low-fi security cam aesthetic, NOT cinematic]
```

### ev_dna_paperweight (FINAL EVIDENCE)
**Seed:** 44013
```
Close-up photograph of a forensic lab report sheet on white paper, neatly typed, showing test results. Visible text: "DNA ANALYSIS - EXHIBIT A (paperweight)". A list of analysis includes: "PRIMARY DNA: Margaret Cole (victim) - confirmed". "SECONDARY DNA: Match found in suspect database". "MATCH: Thomas Brennan - probability 99.98%". A magnified detail of the paperweight surface is shown in inset. Evidence marker "14" in the corner. Clinical office lighting. [FORENSIC STYLE]
```

### ev_eleanor_witness_sketches (NEW, optional)

You can generate simple "witness sketch" style images for Eleanor's testimony reveals:

#### ev_eleanor_witness_daniel
```
A simple investigator's notebook page, ruled lines, with a brief handwritten note in detective's writing: "Witness E. Carrington reports seeing D. Kim on Olive St., 21:45 Sunday, walking unsteadily toward bakery." Black ink on pale paper. [FORENSIC STYLE override: notebook aesthetic]
```

#### ev_eleanor_witness_car
```
Same notebook style. Note: "Witness E. Carrington reports dark-colored sedan, possibly BMW or Audi, parked one block from bakery, approx. 23:30 Sunday. Driver not seen." Black ink, pale paper.
```

#### ev_eleanor_witness_helen
```
Same notebook style. Note: "Witness E. Carrington reports unknown woman (yellow cardigan, brown hair) visiting Cole residence multiple afternoons over recent months while M. Cole at work."
```

---

## File Naming Convention

Save uploads as:
- `tom_warm.png`, `tom_guarded.png`, `tom_cracking.png`, `tom_broken.png`
- `sarah_calm.png`, `sarah_guarded.png`, `sarah_panicked.png`, `sarah_broken.png`
- `david_grieving.png`, `david_defensive.png`, `david_broken.png`
- `daniel_edgy.png`, `daniel_hostile.png`, `daniel_broken.png`
- `martin_nervous.png`, `martin_cooperative.png`
- `tyler_numb.png`
- `kevin_helpful.png`
- `eleanor_warm.png`
- `loc_bakery_main.png`, `loc_backroom.png`, `loc_cole_house.png`, `loc_olive_bar.png`, `loc_brennan_office.png`, `loc_carrington_house.png`
- `ev_footprint_44.png`, `ev_partial_footprint_size_11.png`, `ev_margaret_note.png`, etc.

**Storage:** Upload to Supabase Storage in folders `/portraits/`, `/locations/`, `/evidence/`. Reference URLs in `case_001_bakery_open.json`.

---

## Generation Tips

1. **Generate base portraits first.** Verify quality before generating emotional variants. If face is off, regenerate with different seed before locking it in.

2. **For emotional variants via PuLID:**
   - Upload approved base portrait as face reference
   - Use the variant prompt
   - PuLID strength: 0.75-0.85 (start with 0.8, tune per result)
   - Keep same seed for additional stability

3. **For locations:**
   - Try 2-3 variations per location with different seeds nearby (43001, 43011, 43021)
   - Pick the best one
   - Locations don't need PuLID — different seeds give variety

4. **Evidence images are LOWEST priority for MVP.** Use Lucide icons or emoji as placeholders if time-constrained. Generate evidence images for v1.1 polish.

5. **Critical portraits to generate first:** Tom (4 emotional states) — he's the hardest character and his portrait must work. If Tom looks creepy/sinister even in his "warm" state, the game is broken (he has to look like an innocent family friend at first).

6. **Consistency check:** After generating all 4 emotional states for a character, view them side-by-side. They should clearly be the same person.

7. **Total time estimate:** 3-4 hours of focused generation work for all assets, including iteration.

8. **Total cost estimate:** $3-5 across fal.ai for all generations (portraits + locations + optional evidence).
