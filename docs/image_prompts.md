# Flux Image Generation Prompts — Case #001

**Platform:** fal.ai (recommended)  
**Models:**  
- `fal-ai/flux-pro/v1.1-ultra` for locations (higher detail)  
- `fal-ai/flux-pro/v1.1` for character base portraits  
- `fal-ai/flux-pulid` for character emotional variations (face consistency)

---

## Global Style Block

Append this to EVERY prompt (portraits and locations):
Cinematic illustration style, grounded realism, muted cinematic color palette with desaturated blues and warm tungsten highlights, film noir meets contemporary small-town drama. Visual references: "Mare of Easttown", "Sharp Objects", "True Detective season 1". Soft directional lighting, natural imperfections, no glossy stylization. Photorealistic illustration, not pure photograph.

---

## CHARACTER PORTRAITS

### Sarah Kim

**Seed:** 42001  
**Aspect ratio:** 2:3 (portrait)  
**Base image generation:** Flux Pro v1.1  
**Emotional variants:** Flux PuLID using base as face reference

#### Sarah — CALM (base)
Portrait of Sarah Kim, a 41-year-old Korean-American woman, 5'8" tall, shoulder-length straight dark brown hair tied back in a low ponytail with a few loose strands at the temples, wearing a tailored black silk blouse with a thin silver chain necklace, minimal but carefully applied makeup (neutral tones), small diamond stud earrings. Expression: composed, professionally grieving, mouth slightly firm, eyes focused but tired with faint shadows beneath, controlled stillness. Seated at a plain wooden interrogation table, hands resting folded on the table surface, neutral gray concrete wall background with soft directional lighting from the upper left casting gentle shadows. Natural skin texture with fine pores, subtle under-eye circles, realistic imperfections. [STYLE BLOCK]

#### Sarah — GUARDED (early pressure)
Same subject as Sarah Kim base portrait (same face, same hair, same wardrobe, same setting). Expression: guarded, jaw slightly tightened, eyes narrowed minimally, lips pressed together thinly, slight defensive tilt of the head back and to the side. Body language: hands now more tightly clasped on the table, knuckles slightly paler, shoulders a touch more rigid, spine straighter. Same lighting, same background. [STYLE BLOCK]

#### Sarah — PANICKED (mid-interrogation crack)
Same subject as Sarah Kim base portrait. Expression: visibly tense and stressed, small crease between her brows, eyes slightly wider and darting to the side, lips parted as if about to speak, a faint sheen of sweat at the hairline, one strand of hair loose by her cheek. Body language: one hand has reached up to touch her collar or throat, the other grips the edge of the table, shoulders hunched forward slightly. Same lighting, same background. [STYLE BLOCK]

#### Sarah — BROKEN (final breakdown)
Same subject as Sarah Kim base portrait. Expression: emotionally devastated, eyes red-rimmed with tears running down both cheeks, mascara slightly smudged, mouth slack and trembling, chin quivering, hair now loose around her face from her previously neat ponytail. Body language: shoulders collapsed forward, one hand covering her mouth, the other gripping the table edge as if holding herself up, body curled inward slightly. Her professional polish is completely gone — she looks finally, utterly human. Same lighting, same background. [STYLE BLOCK]

---

### David Cole

**Seed:** 42002  
**Aspect ratio:** 2:3

#### David — CALM/GRIEVING (base)
Portrait of David Cole, a 58-year-old white American man, 5'11" thin build with slight stoop, graying brown hair receding at the temples and thinning on top, clean-shaven but with a three-day beard shadow (silver-gray), tired hazel eyes, deep lines around the eyes and mouth. Wearing a worn brown cardigan over a faded light-blue button-down shirt, reading glasses hanging from his collar on a black cord. Expression: exhausted, grieving, hollow-eyed, gaze slightly downward, mouth neutral but tired, jaw soft. Seated in his living room armchair (olive-green upholstery, well-worn), warm tungsten lamp light from the side-right, slightly blurry family photographs visible in the background on a wall. Natural skin texture with age spots on the temples, wrinkles, dry skin. [STYLE BLOCK]

#### David — DEFENSIVE
Same subject as David Cole base portrait. Expression: defensive, slight frown, jaw tightened, eyes meeting the camera directly now (uncomfortable eye contact), mouth set in a firm line. Body language: leaning slightly back in the armchair, arms folded across his chest, one hand picking at his thumbnail. Same lighting, same background. [STYLE BLOCK]

#### David — BROKEN (on ev_phone_log confession of affair)
Same subject as David Cole base portrait. Expression: relieved-broken, head bowed forward, one hand covering his eyes, the other limp in his lap, shoulders shaking minimally. Tears visible on his cheek. A man whose worst secret has finally come out. Same lighting, same background. [STYLE BLOCK]

---

### Martin Reyes

**Seed:** 42003  
**Aspect ratio:** 2:3

#### Martin — NERVOUS (base — his dominant state)
Portrait of Martin Reyes, a 24-year-old Guatemalan-American man, 5'7" lean build, short black hair neatly combed, clean-shaven, dark brown eyes with thick lashes, kind but anxious face. Wearing a white cotton baker's apron over a plain dark gray t-shirt, a smudge of flour on the apron, small silver chain necklace visible at the collar. Expression: nervous, polite, respectful, eyes slightly downcast, lips pressed in a small sad line, brows drawn together in worry. Body language: holding his own left wrist with his right hand (self-comforting gesture), seated on a simple metal chair in the front of the bakery, morning light through a window behind him creating a gentle backlight. Natural skin texture, youthful but with a seriousness beyond his years, slight under-eye darkness. [STYLE BLOCK]

#### Martin — COOPERATIVE/SAD (after ev_margaret_note reveal)
Same subject as Martin Reyes base portrait. Expression: sad but more open, eyes meeting the detective's gaze now, mouth soft, small resigned nod quality. Body language: hands now in his lap, less tense, slightly forward-leaning — as if finally willing to share. Same lighting, same setting. [STYLE BLOCK]

---

### Tyler Cole

**Seed:** 42004  
**Aspect ratio:** 2:3  
**Only one portrait needed for MVP** (teenager who doesn't shift much emotionally)

#### Tyler — NUMB (default)
Portrait of Tyler Cole, a 16-year-old white American teenage boy, 5'9" tall and skinny, messy medium-length light-brown hair falling over his forehead covering part of his eyes, faint acne on his forehead and chin, clean-shaven (just starting to grow facial hair), wearing a worn gray hoodie with the hood down around his neck over a plain t-shirt. Expression: numb, empty, eyes unfocused staring at something just past the viewer, mouth slightly open but not speaking, jaw slack. Body language: slouched on the edge of his teenage bed, picking at the cuff of his hoodie sleeve with the other hand, shoulders forward. Dim natural light from a window, blurry movie posters and gaming paraphernalia in the background. Natural skin with adolescent texture, faint acne, still-developing features. [STYLE BLOCK]

---

### Kevin Pratt

**Seed:** 42005  
**Aspect ratio:** 2:3  
**Only one portrait needed for MVP** (doesn't shift much)

#### Kevin — CURIOUS/HELPFUL (default)
Portrait of Kevin Pratt, a 35-year-old white American man, 5'10" average build, completely shaved head (embracing baldness), clean-shaven, friendly hazel eyes with the beginnings of laugh lines, slight stubble on the scalp. Wearing a crisp navy-blue button-down shirt (top button undone) tucked into blue jeans. Expression: open, chatty, slightly amused, eyebrows raised in curious interest, mouth with a small helpful smile, leaning forward with engagement. Standing behind a dark polished wooden bar, holding a clean pint glass that he's polishing with a white bar towel, blurred shelves of liquor bottles on backlit glass shelves behind him, afternoon light from a window on the right side of the frame. Natural skin, healthy and tanned, faint laugh lines at the eyes. [STYLE BLOCK]

---

## LOCATION ILLUSTRATIONS

**Aspect ratio:** 16:9  
**Model:** Flux Pro v1.1 Ultra

### loc_bakery_main (Front of Bakery)
**Seed:** 43001
Interior of a small-town American family bakery, viewed from the customer entrance looking in. Warm pendant lighting from copper-colored fixtures hanging over the space. Cherry-wood display cases along the right wall still stocked with a few remaining rustic sourdough loaves, flaky croissants, and a single covered cake — Saturday's leftover inventory. Four small round café tables with mismatched wooden chairs by the front window (window looks out onto Olive Street, partly visible). A chalkboard menu behind a wooden counter shows handwritten daily specials in neat capital lettering: "SUNDAY: Brioche French Toast — $8". Morning sunlight streaming through the front windows, dust motes visible in the beams. Yellow crime scene tape stretched across a wooden door on the back wall (door slightly ajar). Atmosphere: sad, paused, the smell of cold bread. The bakery hasn't opened. No people visible. [STYLE BLOCK]

### loc_backroom (Crime Scene)
**Seed:** 43002
Interior of a commercial bakery backroom kitchen, viewed from the doorway looking in. Two large stainless steel commercial ovens along the left wall. A large stainless steel prep table in the center of the room, its surface dusted with white flour and marked with the ghost-traces of recent work. A wooden back wall shelf lined with baking tools — five marble rolling pins arranged in a neat row with a visible gap where a sixth should be (faint flour-dust outline marks the missing one), various whisks, measuring cups, metal bowls. A white chalk outline of a body on the floor near the prep table, with small yellow evidence marker tents (numbered 1, 2, 3) placed nearby. A solid steel back door to the right, closed. Cold harsh overhead fluorescent lighting casting unforgiving shadows. Flour traces scattered across the tiled floor. Atmosphere: grim, still, recently processed by forensics. [STYLE BLOCK]

### loc_cole_house (Living Room)
**Seed:** 43003
Interior of a modest American two-story colonial home living room, viewed from the doorway into the space. A worn gray upholstered couch along the back wall with a knit throw blanket folded over one armrest. A wall to the right filled with framed family photographs at various ages — slightly blurred enough not to be the focus but clearly numerous, with the most recent photos noticeably sparser than the earlier ones. A wooden side table next to the couch with a cold half-finished cup of coffee, reading glasses resting beside it, and a closed paperback novel. Heavy beige curtains drawn mostly closed over a front window, allowing only thin slices of afternoon light through. A small flatscreen TV turned off. An empty armchair (olive-green, well-worn) facing the TV. Atmosphere: heavy, quiet, a house in mourning, lived-in but not neglected. No people visible. [STYLE BLOCK]

### loc_olive_bar (Bar Interior)
**Seed:** 43004
Interior of a small neighborhood American bar, viewed from the entrance looking in. A long dark wooden bar along the right wall with ten worn leather bar stools, bottles of liquor on backlit glass shelves behind the bar (soft amber and green lighting from behind the bottles). Ten small two-person tables arranged on the left side of the narrow space with simple wooden chairs. Low pendant lights hanging over the tables, dim and warm. An old vinyl classic rock album framed on a brick-and-wood wall as decoration. A small stage or acoustic corner at the far end (empty). A back door marked "EXIT" at the rear. Afternoon, almost empty, one lone figure at the bar (silhouette, not featured). Golden hour light streaming through a front window on the left. Atmosphere: comfortable, unpretentious, smells of old beer and wood polish. [STYLE BLOCK]

---

## EVIDENCE IMAGES (Optional for MVP)

**Aspect ratio:** 1:1 (square) or 4:3  
**Model:** Flux Pro v1.1  
**Style override:** Forensic photography style (overrides global style)
Forensic evidence photography style: harsh overhead lighting, neutral gray background or the surface where found, evidence marker and photographic ruler in frame, documentary style, photorealistic, no artistic flourish.

### ev_footprint_44
**Seed:** 44001
Close-up forensic photograph of a size 12 US combat-style boot footprint on a dark kitchen floor, the print partially impressed in white flour dust, clearly showing a distinctive aggressive lug tread pattern (deep grooves, angular, tactical style), a forensic photographic ruler with centimeter markings placed next to the print, a small yellow evidence marker "3" visible in the top-right corner of the frame. Harsh overhead flash lighting. [FORENSIC STYLE]

### ev_margaret_note
**Seed:** 44002
Close-up forensic photograph of a handwritten note on slightly wrinkled white lined paper, the text reads exactly: "S — 47k, talk Sun eve, police Mon AM". The handwriting is neat cursive in blue ballpoint pen, legible, with a small date "Fri" written in the top-right corner. The note rests on a plain wooden desk surface. Evidence marker "7" visible in the corner. Harsh overhead lighting. [FORENSIC STYLE]

### ev_bar_receipt
**Seed:** 44003
Close-up forensic photograph of a thermal printer bar receipt, slightly curled paper. Visible text: "OLIVE BAR" bold at the top, "Table 4 — Sarah K.", "Opened: Sun 22:03", itemized list showing "Pinot Noir x2" and "Blue Moon x1", "Closed: 23:04", "Total: $24.00". Resting on a neutral gray surface, evidence marker "5" in the corner. Crisp detail on the printing. [FORENSIC STYLE]

### ev_missing_rolling_pin
**Seed:** 44004
Close-up photograph of a wooden bakery shelf viewed from the front, showing five marble rolling pins lined up in a row, with a clearly visible empty gap where a sixth rolling pin should be — a circular outline is visible in the fine flour dust on the shelf, marking where it recently rested. Harsh overhead bakery lighting. Evidence marker "2" visible. [FORENSIC STYLE]

### ev_discarded_weapon
**Seed:** 44005
Close-up forensic photograph of a marble rolling pin wrapped in a dirty white kitchen towel with visible dark brown blood stains on the business end soaking through the towel. The weapon lies at the bottom of an open dumpster among garbage bags and refuse, harsh flashlight illumination cutting through the dark interior. Evidence marker "8" in the corner. [FORENSIC STYLE]

### ev_phone_log
**Seed:** 44006
Close-up photograph of an old cordless home phone handset resting on its charging base, the small digital display showing call history: "LAST OUTGOING: 22:47 Sun, (555)-0137, Duration 14:03". The phone sits on a wooden side table. Evidence marker "4" in the corner. Natural indoor lighting. [FORENSIC STYLE]

### ev_bank_statements
**Seed:** 44007
Close-up photograph of printed bank statement pages spread on a desk, standard American business account format, showing a list of transactions with visible outgoing wire transfers of varying amounts over 8 months — some amounts highlighted in yellow highlighter by an investigator. The top of the page shows "Cole & Sons LLC — Business Account". Evidence marker "6" in the corner. Natural office lighting. [FORENSIC STYLE]

---

## Generation Workflow Notes

1. **Generate character base portraits first** (all 5 characters × 1 calm/default portrait each) on Flux Pro v1.1 with listed seeds. Review quality — re-generate with different seeds if any face is off.

2. **For emotional variants** (Sarah ×3, David ×2, Martin ×1), use Flux PuLID on fal.ai:
   - Upload the approved base portrait as the face reference
   - Use the variant prompt
   - PuLID strength: 0.75-0.85 (tune per result)
   - Keep same seed for stability

3. **Generate locations** on Flux Pro Ultra with listed seeds. Try 2-3 variations per location and pick the best.

4. **Evidence images are OPTIONAL for MVP.** Can be replaced with Lucide icons or simple emoji in the UI. Generate them for production polish in v1.1.

5. **Total generation budget estimate:** ~$2-3 for all assets in this case.

6. **File naming convention:**
   - `sarah_calm.png`, `sarah_guarded.png`, `sarah_panicked.png`, `sarah_broken.png`
   - `david_calm.png`, `david_defensive.png`, `david_broken.png`
   - `martin_nervous.png`, `martin_cooperative.png`
   - `tyler_numb.png`
   - `kevin_default.png`
   - `loc_bakery_main.png`, `loc_backroom.png`, `loc_cole_house.png`, `loc_olive_bar.png`
   - `ev_footprint_44.png`, `ev_margaret_note.png`, etc.

7. **Storage:** Upload to Supabase Storage, reference URLs in ground_truth.json.