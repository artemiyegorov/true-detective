## Investigation Board — UI Spec

The board is a separate full-screen view, accessible from the map via "🔍 Open Board" button. It replaces the simple notebook with an interactive case-building space.

### Layout

Full-screen canvas with:
- **Left sidebar (collapsible):** All NPCs as portrait cards (drag to canvas)
- **Top toolbar:** Tools — pin character, draw line, add note, attach evidence to character
- **Right sidebar (collapsible):** All discovered evidence and facts as cards (drag to canvas or attach to characters)
- **Bottom bar:** "Accuse" button (always visible), evidence count, time elapsed
- **Canvas:** Free-form workspace where player pins, connects, annotates

### Mechanics

**Pin character:** Drag NPC portrait from left sidebar onto canvas. Now persistent.

**Connect characters:** Click "draw line" tool, click two characters. A labeled line appears. Player can label it: "knows", "in conflict", "married to", "owes money", "had affair", or custom text.

**Attach evidence:** Drag evidence card from right sidebar onto a character. The evidence is visually pinned next to that character. Player can attach same evidence to multiple characters (e.g., "ev_phone_log" attaches to David AND Helen).

**Annotate:** Click "add note" tool, click a character or empty space. Free-text note (max 200 chars).

**Suspicion level:** Each pinned character has a 0-5 star "suspicion" toggle. Player sets it manually. This is purely organizational — doesn't affect game logic.

**Mark cleared:** Right-click character → "mark as cleared." Visual: grayed out with strikethrough.

**Hypothesis groups:** Lasso-select multiple characters/evidence → group them with a label ("everyone with motive", "alibi unverified", etc.).

### Save/Load

Board state is saved per-player per-case in DB. Player can close board and return.

### Mobile

On mobile, board is simplified: vertical scrolling list of "pinned characters" with their attached evidence and notes underneath. No free-form canvas. Player accuses from the same screen.

### Accuse Flow

Bottom-bar "Accuse" button → wizard (same as before):
1. Select suspect (only pinned characters available)
2. State motive (free text + suggested motives)
3. Select 3-5 key evidence (must be attached to that character on the board)
4. Make case (free text)
5. Confirm — irreversible

### Outcome Evaluation

Backend evaluates accusation against `endings` config in ground_truth. Returns one of the 7 ending tiers. Verdict screen plays the appropriate cinematic.