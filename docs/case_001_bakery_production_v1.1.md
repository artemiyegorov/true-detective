21:22Claude responded: CASE #001: "Death at the Bakery" — Production Package v1.CASE #001: "Death at the Bakery" — Production Package v1.1
Это финальная версия пакета первого дела. Всё собрано в один документ. После него — чёткий план что делать дальше.

Часть 1: Ground Truth (JSON)
Сохрани как case_001_bakery.json. Это единый источник правды для всего движка.
json{
  "case_id": "case_001_bakery",
  "version": "1.1",
  "language": "en",
  
  "meta": {
    "title": "Death at the Bakery",
    "subtitle": "Case File #247",
    "tagline": "A small-town bakery owner. A locked back door. A missing rolling pin.",
    "difficulty": "detective",
    "estimated_minutes": 35,
    "theme": "domestic_smallbiz",
    "setting_description": "Millbrook — a quiet American small town, population 8,400. Early spring, cold nights.",
    "tone": "grounded, realistic, small-town drama"
  },
  
  "briefing": {
    "opening_scene": "Monday morning, March 17th. 6:47 AM. Martin Reyes, the young baker at Cole & Sons Bakery on Olive Street, arrives to start his shift. He finds his boss, Margaret Cole, dead in the backroom.",
    "key_facts": [
      "Victim: Margaret Cole, 54, bakery owner",
      "Cause of death: Blunt force trauma to the back of the head",
      "Estimated time of death: Sunday night, between 23:30 and 00:30",
      "Back door was unlocked — no signs of forced entry",
      "Cash register untouched, $847 still inside",
      "Neighbors heard a cry around midnight but didn't think twice"
    ],
    "your_task": "Five people had means, motive, or opportunity. Each of them is on your list. Start at the bakery — the crime scene knows the most.",
    "narrator_voice_style": "Calm, grounded male voice in his 40s. Experienced homicide detective doing a voiceover. No theatrics.",
    "narrator_script": "Monday morning. Six forty-seven AM. Martin Reyes, the young baker at Cole and Sons Bakery on Olive Street, arrives to start his shift. He finds his boss, Margaret Cole, dead in the backroom. Cause of death: blunt force trauma to the back of the head. Time of death: Sunday night, between eleven-thirty and twelve-thirty. The back door was unlocked. No signs of forced entry. The register was untouched. Five people had reasons to want her dead. Each of them is on your list. Start at the bakery. The crime scene knows the most.",
    "duration_seconds": 45
  },
  
  "victim": {
    "name": "Margaret Cole",
    "age": 54,
    "occupation": "Owner of Cole & Sons Bakery (15 years)",
    "bio": "Founded the bakery with her husband David 15 years ago. Took Sarah Kim as a business partner 3 years ago when the bakery expanded. Known in Millbrook as tough but fair. Married 25 years. One teenage son, Tyler.",
    "time_of_death": "2024-03-17T23:45:00",
    "cause_of_death": "Blunt force trauma to the back of the head (marble rolling pin)",
    "location_of_death": "loc_backroom",
    "last_known_activity": "Left home at 20:30 to 'sort out the books at the bakery'. Called Sarah at 21:00 asking her to come at 23:00."
  },
  
  "murder": {
    "murderer_id": "char_sarah",
    "motive_category": "financial_desperation_plus_exposure",
    "motive_detail": "Sarah had been siphoning money from the business account for 8 months, roughly $47,000 total, to cover her younger brother Daniel's gambling debts. On Friday, Margaret found discrepancies in the books. On Sunday evening, Margaret called Sarah to the bakery and gave her an ultimatum: confess and pay it back, or Margaret would go to the police Monday morning. Sarah arrived at 23:15, the argument escalated, Sarah grabbed a marble rolling pin from the counter and struck Margaret in the back of the head as she turned away. Death was instant.",
    "weapon": "Marble rolling pin",
    "weapon_disposal": "Sarah took the rolling pin with her, wrapped it in a kitchen towel, and dumped it in the dumpster behind the 'Olive' bar on her way home around 00:00.",
    "time_of_crime": "2024-03-17T23:45:00"
  },
  
  "timeline": [
    {"time": "19:00", "event": "Margaret has dinner at home with David and Tyler.", "visible_via": ["char_david", "char_tyler"]},
    {"time": "20:30", "event": "Margaret leaves home for the bakery.", "visible_via": ["char_david"]},
    {"time": "21:00", "event": "Margaret calls Sarah from the bakery, asks her to come at 23:00.", "visible_via": ["char_sarah"]},
    {"time": "21:30", "event": "David drives Tyler to Jake's for a sleepover.", "visible_via": ["char_david", "char_tyler"]},
    {"time": "22:00", "event": "Sarah arrives at 'Olive' bar.", "visible_via": ["char_kevin", "ev_bar_receipt"]},
    {"time": "22:47", "event": "David calls Helen Voss (his mistress). 14-minute call.", "visible_via": ["ev_phone_log"]},
    {"time": "23:00", "event": "Large group enters the bar. Kevin clears Sarah's table. Sarah leaves.", "visible_via": ["char_kevin", "ev_bar_receipt"]},
    {"time": "23:15", "event": "Sarah enters the bakery through the back door (own key). Confronts Margaret.", "visible_via": ["ev_footprint_44"]},
    {"time": "23:45", "event": "Sarah strikes Margaret with rolling pin. Death instant.", "visible_via": []},
    {"time": "23:50", "event": "Sarah leaves through back door with the weapon.", "visible_via": ["ev_missing_rolling_pin"]},
    {"time": "00:00", "event": "Sarah dumps the rolling pin in the dumpster behind 'Olive' bar.", "visible_via": ["ev_discarded_weapon", "char_kevin (partially)"]},
    {"time": "00:15", "event": "Sarah arrives home.", "visible_via": []},
    {"time": "06:47", "event": "Martin Reyes finds the body, calls 911.", "visible_via": ["char_martin"]}
  ],
  
  "characters": [
    {
      "id": "char_david",
      "name": "David Cole",
      "age": 58,
      "role": "Husband of the victim",
      "occupation": "Former bank manager. Unemployed for 2 years.",
      "personality_short": "Tired, slightly irritable, avoids personal topics. Short answers.",
      "personality_long": "David carries the weight of a man who used to be someone. Worn cardigan, black coffee. Speaks slowly, choosing words carefully. Doesn't make eye contact easily. Picks at his thumbnail when uncomfortable.",
      "speech_patterns": "Formal, measured. Uses 'I suppose', 'to be fair', 'the thing is'. Avoids profanity.",
      "physical_description": "5'11\", thin, graying hair receding. Brown cardigan, faded jeans. Reading glasses hanging from collar.",
      "voice_profile": {
        "elevenlabs_voice_name_suggestion": "Daniel or Clyde",
        "notes": "Low, measured, mid-Atlantic American. Tired but clear."
      },
      "relationship_to_victim": "Married 25 years. Last year was cold — his unemployment and her business stress created distance.",
      "alibi_claim": "Was home all night. Drove Tyler to Jake's at 21:30, came back, watched old movies, went to bed around 01:00.",
      "alibi_truth": "TRUE — he was home. But between 22:47 and 23:01 he called Helen Voss, his mistress. He's desperate to hide the affair.",
      "secret": "Affair with Helen Voss for 4 months. Margaret didn't know. Terrified the affair comes out and makes him look guilty.",
      "what_he_knows": [
        "Margaret was stressed the past week — mentioned 'something's not right with the books'",
        "Margaret left home at 20:30 Sunday to work on accounts",
        "Sarah has a brother with problems (Margaret mentioned it once)"
      ],
      "lies_about": [
        "Claims marriage was 'fine'",
        "Doesn't mention the phone call to Helen",
        "Downplays how stressed Margaret was"
      ],
      "breakable_evidence": [
        {
          "evidence_id": "ev_phone_log",
          "what_it_proves": "He made a 14-minute call during the murder window.",
          "what_it_doesnt_prove": "That he was at the bakery. It was from his home phone.",
          "reaction": "Confesses to the affair. Insists he was home. Begs detective not to tell Tyler.",
          "new_info_revealed": "The affair with Helen Voss. Her phone number. Affair has been going 4 months."
        },
        {
          "evidence_id": "ev_margaret_note",
          "what_it_proves": "Margaret knew about financial issues with someone whose name starts with S.",
          "what_it_doesnt_prove": "That David was involved.",
          "reaction": "Admits he knew Margaret was worried about the books. Says he suspected Sarah. Margaret confided in him Friday night.",
          "new_info_revealed": "He had suspected Sarah. Margaret confided Friday."
        }
      ],
      "unlockable_actions": {
        "bank_records_request": {
          "trigger_conditions": [
            "Player mentions bank statements, financial records, accounting, or 'the books' in conversation",
            "AND player has already shown ev_margaret_note to David OR asked specifically about the $47k"
          ],
          "response": "Yeah, I can authorize the bank to send you the statements. Both Margaret and Sarah had access to the accounts. I'll make the call.",
          "unlocks_evidence": "ev_bank_statements",
          "system_delay_seconds": 60,
          "system_message_on_unlock": "The bank has sent over the requested account statements."
        }
      },
      "is_murderer": false,
      "would_confess_to_murder": false,
      "initial_mood": "grieving, withdrawn"
    },
    
    {
      "id": "char_sarah",
      "name": "Sarah Kim",
      "age": 41,
      "role": "Business partner of the victim",
      "occupation": "Co-owner of Cole & Sons Bakery for 3 years.",
      "personality_short": "Professional, composed, polished. Cracks under sustained pressure by talking faster.",
      "personality_long": "Sarah trained herself to look put-together. Tailored blouse, neat hair. Uses business vocabulary as armor. She can cry on cue. She's smart, but she's scared, and she's been scared for 8 months.",
      "speech_patterns": "Business-speak when calm. Faster, fragmented sentences when nervous. Uses 'look', 'honestly', 'the thing is'.",
      "physical_description": "5'8\" (tall for Korean-American woman), size 12 feet (unusually large), shoulder-length dark hair tied back, tailored black blouse, minimal makeup. Distinctive combat-style boots.",
      "voice_profile": {
        "elevenlabs_voice_name_suggestion": "Matilda or Rachel",
        "notes": "Warm alto, slight Chicago accent. Controlled when calm, breathier under stress."
      },
      "relationship_to_victim": "3 years as business partners. Publicly: 'like sisters'. Privately: last 8 months tense — Margaret tightening financial controls.",
      "alibi_claim": "At 'Olive' bar from 22:00 to 00:30 Sunday, drinking with Kevin. Walked home after, got home around 01:00. Learned about the murder Monday morning from Martin.",
      "alibi_truth": "At bar 22:00-23:00. Left when Kevin cleared her table. Walked to bakery, entered at 23:15 with own key. Argued with Margaret. Killed her at 23:45. Dumped weapon behind 'Olive' at 00:00. Home 00:15.",
      "secret": "THE MURDERER. Also: siphoned $47,000 from business account over 8 months for brother Daniel's gambling debts. Margaret found it Friday.",
      "what_she_knows": "Everything. She did it.",
      "lies_about": [
        "Time she left the bar (claims 00:30, really 23:00)",
        "Whether she went to the bakery Sunday evening",
        "Financial state of the bakery",
        "Her relationship with Margaret that week",
        "Whether Margaret knew about the siphoning",
        "Her whereabouts 23:00-00:15"
      ],
      "breakable_evidence": [
        {
          "evidence_id": "ev_footprint_44",
          "what_it_proves": "Someone with size 12 combat boots was recently in the backroom.",
          "what_it_doesnt_prove": "That it was Sarah that specific night.",
          "reaction": "Visible tension. Denies being in backroom Sunday night. 'I work there every day, my footprints are everywhere. Could be an old print.' Deflects to Martin or delivery people. Mood: nervous. Alibi 'at the bar' holds.",
          "new_info_revealed": "None (deflecting)."
        },
        {
          "evidence_id": "ev_bar_receipt",
          "what_it_proves": "Sarah left the bar at 23:04, not 00:30.",
          "what_it_doesnt_prove": "Where she went. That she was at the bakery.",
          "reaction": "Panic. Admits she left earlier. Invents: 'I was upset, went for a walk, walked around a long time.' Mood: panicked. Alibi 'not at bakery' holds.",
          "new_info_revealed": "Left bar at 23:00. Fabricated 'walking around' alibi."
        },
        {
          "evidence_id": "ev_bank_statements",
          "what_it_proves": "Sarah transferred $47,000 to brother's accounts over 8 months.",
          "what_it_doesnt_prove": "That Margaret knew. That she was at bakery.",
          "reaction": "Defensive. Admits 'borrowing from the business'. Insists she would repay. Claims Margaret did NOT know. Tries sympathy via brother's gambling. Mood: defensive. Alibi 'not at bakery' holds.",
          "new_info_revealed": "$47k siphoning. Brother Daniel's gambling. Claim Margaret didn't know."
        },
        {
          "evidence_id": "ev_margaret_note",
          "what_it_proves": "Margaret knew about the $47k. Planned police Monday. Scheduled meeting with Sarah Sunday evening.",
          "what_it_doesnt_prove": "That Sarah killed her intentionally.",
          "reaction": "COMPLETE BREAKDOWN. Admits Margaret knew. Admits the meeting at the bakery. 'She was screaming at me. I went to hug her. There was flour on the floor. She slipped, fell, hit her head. I panicked and ran. It was an accident, I swear to God.' Mood: broken, crying.",
          "new_info_revealed": "The meeting at bakery. Her presence at scene. 'Accident' narrative.",
          "is_final_breakdown": true
        }
      ],
      "unlockable_actions": {
        "bank_records_request": {
          "trigger_conditions": [
            "Player demands bank records, financial statements, or 'the books'",
            "AND player has already shown ev_margaret_note to Sarah OR confronted her about the $47k"
          ],
          "response": "Fine. I'll authorize the bank. I have nothing to hide.",
          "unlocks_evidence": "ev_bank_statements",
          "system_delay_seconds": 90,
          "system_message_on_unlock": "The bank has sent over the requested account statements.",
          "notes": "Sarah agrees because refusing would look too suspicious. She's bluffing that it won't incriminate her."
        }
      },
      "confession_conditions": "Even with ALL FOUR evidence items presented, Sarah ONLY admits to 'accident'. She NEVER admits to striking Margaret with the rolling pin. NEVER uses 'kill' or 'murder' about what she did. Maximum: 'She fell. I didn't mean for this. It was an accident.'",
      "is_murderer": true,
      "would_confess_to_murder": false,
      "initial_mood": "professionally grieving, composed"
    },
    
    {
      "id": "char_martin",
      "name": "Martin Reyes",
      "age": 24,
      "role": "Employee baker (found the body)",
      "occupation": "Baker at Cole & Sons for 1.5 years. Community college part-time.",
      "personality_short": "Quiet, polite, nervous around police. Guatemalan-American immigrant (legal).",
      "personality_long": "Martin is young, sincere, a little awkward. Respected Margaret deeply. Came to the US at 18 with his sister. Everything feels fragile to him. A murder investigation at work scares him.",
      "speech_patterns": "Simple English, occasional grammatical errors. Sometimes Spanish words when flustered ('Dios mío'). Says 'ma'am' and 'sir'.",
      "physical_description": "5'7\", lean, short black hair, clean-shaven. White baker's apron over jeans. Holds his own wrist when nervous.",
      "voice_profile": {
        "elevenlabs_voice_name_suggestion": "Antoni",
        "notes": "Warm, softer, slight Guatemalan Spanish accent. Speaks quietly."
      },
      "relationship_to_victim": "Employee-boss. Margaret was fair, occasionally strict. He respected her deeply.",
      "alibi_claim": "Home with sister Carolina watching a movie. Bed around 23:00. Arrived at work at 06:45.",
      "alibi_truth": "TRUE. Found body at 06:47, called 911.",
      "secret": "Overheard Margaret on Friday muttering about 'these numbers don't add up'. Doesn't want to point fingers.",
      "what_he_knows": [
        "Margaret was stressed the past week",
        "Heard her say 'numbers not adding up' on Friday",
        "Sarah looked nervous when books were reviewed"
      ],
      "lies_about": [
        "Minimizes how stressed Margaret was",
        "Doesn't volunteer that he overheard the 'numbers' comment"
      ],
      "breakable_evidence": [
        {
          "evidence_id": "ev_margaret_note",
          "what_it_proves": "Margaret knew about financial issues.",
          "what_it_doesnt_prove": "Who was responsible.",
          "reaction": "Admits he overheard the 'numbers' comment. Reluctantly names Sarah as the person who seemed nervous during book reviews.",
          "new_info_revealed": "Sarah's nervousness when financial reviews happened."
        }
      ],
      "unlockable_actions": {},
      "is_murderer": false,
      "would_confess_to_murder": false,
      "initial_mood": "shaken, scared"
    },
    
    {
      "id": "char_tyler",
      "name": "Tyler Cole",
      "age": 16,
      "role": "Son of the victim",
      "occupation": "High school junior.",
      "personality_short": "Teenager in shock. Short answers. Defensive when questions feel accusatory.",
      "personality_long": "Tyler is numb. Was close to his mom. Doesn't know what he's supposed to do. Angry but doesn't know at what. Smells faintly of weed from last night at Jake's.",
      "speech_patterns": "Teenage. 'Yeah', 'I guess', 'I don't know', 'whatever'. Short sentences.",
      "physical_description": "5'9\", skinny, messy brown hair, hoodie and jeans. Avoids eye contact. Picks at hoodie cuff.",
      "voice_profile": {
        "elevenlabs_voice_name_suggestion": "Josh",
        "notes": "Young male, soft, slightly cracked, American. Mumbles."
      },
      "relationship_to_victim": "Close but strained by normal teenage friction. Last fight Wednesday over grades.",
      "alibi_claim": "At Jake Morrison's for a sleepover 21:30 Sunday until 10:00 Monday.",
      "alibi_truth": "TRUE. Jake and Jake's mom confirm.",
      "secret": "Smokes weed. Unrelated to murder.",
      "what_he_knows": "Nothing about the murder. Didn't notice his mom being stressed — self-absorbed.",
      "lies_about": [
        "Says mom's mood was 'normal' — didn't actually pay attention"
      ],
      "breakable_evidence": [],
      "unlockable_actions": {},
      "is_murderer": false,
      "would_confess_to_murder": false,
      "initial_mood": "numb, withdrawn"
    },
    
    {
      "id": "char_kevin",
      "name": "Kevin Pratt",
      "age": 35,
      "role": "Bartender at 'Olive' bar",
      "occupation": "Bartender at 'Olive' for 6 years.",
      "personality_short": "Chatty, slight show-off, loves gossip. Remembers times professionally.",
      "personality_long": "Kevin has been behind this bar long enough to be a fixture. Knows everyone's drink. Helpful but happy to dish. Wears clean button-down.",
      "speech_patterns": "Casual American. 'Buddy', 'pal', 'y'know'. Talkative.",
      "physical_description": "5'10\", average, shaved head, clean-shaven, navy button-down, jeans. Polishing a glass reflexively.",
      "voice_profile": {
        "elevenlabs_voice_name_suggestion": "Sam",
        "notes": "Mid-range friendly male, chatty pace, neutral American."
      },
      "relationship_to_victim": "Passing acquaintance. Margaret got morning coffee next door sometimes.",
      "alibi_claim": "Worked 18:00-02:00. Sarah was his customer all evening.",
      "alibi_truth": "Worked the bar. BUT Sarah was there 22:00-23:00, not until 00:30. He remembers clearly — at 23:00 a bachelor party arrived and he cleared her table.",
      "secret": "Around 00:00 he saw someone throw something into the dumpster behind the bar. Didn't see who — 'dark figure'. Assumed a drunk. Will mention if asked about alley/dumpster/anything unusual.",
      "what_he_knows": [
        "Sarah was at bar 22:00-23:00, clear memory of clearing her table",
        "Someone dumped something behind the bar around midnight"
      ],
      "lies_about": [],
      "breakable_evidence": [],
      "unlockable_actions": {
        "reveal_alley_incident": {
          "trigger_conditions": [
            "Player asks about anything unusual Sunday night",
            "OR player asks about suspicious customers",
            "OR player asks about alley, back of bar, dumpsters",
            "OR player asks 'did you see anything'"
          ],
          "response": "Actually, yeah — around midnight I saw someone toss something into the dumpsters out back. Dark figure, couldn't see who. Thought it was just a drunk, didn't think twice.",
          "unlocks_hotspot": "hs_bar_back_alley",
          "system_message_on_unlock": "Kevin mentioned suspicious activity behind the bar. A new area is now available at 'Olive' Bar."
        }
      },
      "is_murderer": false,
      "would_confess_to_murder": false,
      "initial_mood": "curious, helpful"
    }
  ],
  
  "locations": [
    {
      "id": "loc_bakery_main",
      "name": "Cole & Sons Bakery — Front",
      "short_description": "The bakery's customer area. Display cases, counter, register, four café tables.",
      "long_description": "Warm pendant lighting. Cherry-wood display cases still stocked with Saturday's croissants. Chalkboard menu in Margaret's handwriting. Crime scene tape across the back door.",
      "available_from_start": true,
      "atmosphere_notes": "Sad, frozen. The smell of cold bread. Morning light. Crime scene tape.",
      "hotspots": [
        {
          "id": "hs_cash_register",
          "label": "Cash register",
          "available_from_start": true,
          "on_click_text": "The register drawer is open. $847 inside. Saturday's receipts tape neatly tucked beside it. Nothing disturbed.",
          "reveals": {"type": "fact", "id": "fact_not_robbery"},
          "importance": "context"
        },
        {
          "id": "hs_front_door",
          "label": "Front door",
          "available_from_start": true,
          "on_click_text": "Locked from the inside. Deadbolt intact. Martin opened it this morning with his own key.",
          "reveals": {"type": "fact", "id": "fact_entered_from_back"},
          "importance": "context"
        },
        {
          "id": "hs_chalkboard",
          "label": "Chalkboard menu",
          "available_from_start": true,
          "on_click_text": "Handwritten daily specials in Margaret's neat capitals. 'SUNDAY: Brioche French Toast — $8'. Nothing erased for Monday.",
          "reveals": null,
          "importance": "atmospheric"
        },
        {
          "id": "hs_door_to_backroom",
          "label": "Door to backroom",
          "available_from_start": true,
          "on_click_text": "The door is ajar. Crime scene tape stretched across. The smell of flour and something sharper — copper.",
          "leads_to_location": "loc_backroom",
          "importance": "navigation"
        }
      ]
    },
    
    {
      "id": "loc_backroom",
      "name": "Bakery Backroom (Crime Scene)",
      "short_description": "Working kitchen. Ovens, prep tables, shelves of tools, back door.",
      "long_description": "Industrial space. Two commercial ovens along the left wall. A large steel prep table in the center, still dusted with flour. Shelves of baking tools on the back wall. Chalk outline on the floor marks where Margaret was found. Back door leads to an alley.",
      "available_from_start": true,
      "atmosphere_notes": "Cold. Flour tracks on the floor. Single overhead fluorescent. Evidence markers from forensics.",
      "hotspots": [
        {
          "id": "hs_rolling_pin_shelf",
          "label": "Rolling pin shelf",
          "available_from_start": true,
          "on_click_text": "Five marble rolling pins, stored in a neat row. There's a clear gap where a sixth should be — outline visible in the flour dust on the shelf. Missing since the night of the murder.",
          "reveals": {"type": "evidence", "id": "ev_missing_rolling_pin"},
          "importance": "key"
        },
        {
          "id": "hs_footprint_backdoor",
          "label": "Footprint by the back door",
          "available_from_start": true,
          "on_click_text": "A clear boot print, partially in flour, partially in dirt. Size 12 (US). Distinctive aggressive lug pattern — combat or tactical boot style.",
          "reveals": {"type": "evidence", "id": "ev_footprint_44"},
          "importance": "key"
        },
        {
          "id": "hs_back_door",
          "label": "Back door",
          "available_from_start": true,
          "on_click_text": "Solid steel door. Unlocked. Deadbolt intact, no tampering. Whoever came through had a key.",
          "reveals": {"type": "fact", "id": "fact_killer_had_key"},
          "importance": "context"
        },
        {
          "id": "hs_margarets_desk",
          "label": "Margaret's desk",
          "available_from_start": true,
          "on_click_text": "A small wooden desk crammed in the corner. Papers organized. Daily planner open to Friday. A handwritten note on top: 'S — 47k, talk Sun eve, police Mon AM'. Dated Friday.",
          "reveals": {"type": "evidence", "id": "ev_margaret_note"},
          "importance": "key"
        },
        {
          "id": "hs_body_outline",
          "label": "Chalk outline",
          "available_from_start": true,
          "on_click_text": "Outline shows Margaret fell forward, chest-down near the prep table. Wound on the back of the head — she was struck from behind.",
          "reveals": {"type": "fact", "id": "fact_struck_from_behind"},
          "importance": "key"
        },
        {
          "id": "hs_flour_on_floor",
          "label": "Flour trail on the floor",
          "available_from_start": true,
          "on_click_text": "Flour dust across the floor — standard for a kitchen. A few smeared tracks near the body. Boot size appears to match the size 12 print by the door.",
          "reveals": null,
          "importance": "context"
        }
      ]
    },
    
    {
      "id": "loc_cole_house",
      "name": "The Cole Family Home",
      "short_description": "Two-story colonial. David and Tyler.",
      "long_description": "Modest family home. Living room with worn couch and family photos. Tyler's room upstairs. The house feels lived-in but heavy.",
      "available_from_start": true,
      "atmosphere_notes": "Closed curtains. TV off. Cold cup of coffee on side table.",
      "hotspots": [
        {
          "id": "hs_family_photos",
          "label": "Family photos on the wall",
          "available_from_start": true,
          "on_click_text": "Framed family photos. Most recent is six months old — Tyler's 16th birthday. Before that, regular photos every few months. The last year is thin.",
          "reveals": {"type": "fact", "id": "fact_family_drifted"},
          "importance": "atmospheric"
        },
        {
          "id": "hs_home_phone",
          "label": "Home phone",
          "available_from_start": true,
          "on_click_text": "An old cordless phone. Call history visible. Last outgoing call: Sunday 22:47, to (555)-0137. Duration: 14 minutes.",
          "reveals": {"type": "evidence", "id": "ev_phone_log"},
          "importance": "key"
        },
        {
          "id": "hs_tyler_room",
          "label": "Tyler's room (upstairs)",
          "available_from_start": true,
          "on_click_text": "Closed door. Faint smell through the gap. Tyler's inside — hasn't come out since he got back this morning.",
          "reveals": null,
          "importance": "navigation",
          "triggers_npc": "char_tyler"
        }
      ]
    },
    
    {
      "id": "loc_olive_bar",
      "name": "'Olive' Bar",
      "short_description": "Small neighborhood bar across from the bakery.",
      "long_description": "Narrow bar, ten tables, bar stools, classic rock low. Kevin Pratt works the bar. Back alley with dumpsters shared with neighboring businesses.",
      "available_from_start": false,
      "unlock_triggers": [
        {
          "type": "npc_mentioned_location",
          "npc_id": "char_sarah",
          "mention_keywords": ["Olive", "bar", "Kevin"]
        },
        {
          "type": "player_direct_mention",
          "input_keywords": ["Olive bar", "the bar", "where Sarah was drinking"]
        }
      ],
      "atmosphere_notes": "Old beer and wood polish. Afternoon light. Kevin polishing a glass.",
      "hotspots": [
        {
          "id": "hs_bar_main",
          "label": "The bar",
          "available_from_start": true,
          "on_click_text": "Polished dark wood. Kevin behind it. Sunday's vibe lingers.",
          "reveals": null,
          "importance": "atmospheric",
          "triggers_npc": "char_kevin"
        },
        {
          "id": "hs_bar_receipts",
          "label": "Sunday's receipt roll",
          "available_from_start": true,
          "on_click_text": "Kevin pulls up Sunday's receipts. Sarah Kim's tab: opened 22:03, closed 23:04. Total $24 (two glasses of wine, one beer). She left at 23:04.",
          "reveals": {"type": "evidence", "id": "ev_bar_receipt"},
          "importance": "key",
          "requires_npc_interaction": "char_kevin"
        },
        {
          "id": "hs_bar_back_alley",
          "label": "Back alley (dumpsters)",
          "available_from_start": false,
          "unlock_triggers": [
            {
              "type": "npc_revealed_info",
              "npc_id": "char_kevin",
              "unlockable_action_id": "reveal_alley_incident"
            },
            {
              "type": "player_direct_mention_in_location",
              "location_id": "loc_olive_bar",
              "input_keywords": ["back alley", "behind the bar", "dumpster", "out back", "behind"]
            }
          ],
          "on_click_text": "Narrow alley. Three dumpsters shared with laundromat and tax office. Middle one — something heavy wrapped in a dirty kitchen towel, pushed under garbage bags.",
          "reveals": {"type": "evidence", "id": "ev_discarded_weapon"},
          "importance": "key"
        }
      ]
    }
  ],
  
  "evidence": [
    {
      "id": "ev_footprint_44",
      "name": "Size 12 Boot Print",
      "description": "Clear combat-style boot print (size 12 US), partially in flour, found by the back door of the bakery backroom.",
      "image_placeholder": "ev_footprint.png",
      "importance": "key",
      "discovery_method": "direct",
      "found_at": "loc_backroom:hs_footprint_backdoor",
      "significance": "Sarah Kim wears size 12 combat boots — unusually large for a woman, only suspect with this style. Breaks her claim of not being in the backroom.",
      "breaks_alibi_of": ["char_sarah"]
    },
    {
      "id": "ev_missing_rolling_pin",
      "name": "Missing Rolling Pin",
      "description": "A marble rolling pin is missing from the shelf of six. The outline in the flour dust shows it was there recently.",
      "image_placeholder": "ev_missing_pin.png",
      "importance": "key",
      "discovery_method": "direct",
      "found_at": "loc_backroom:hs_rolling_pin_shelf",
      "significance": "Murder weapon taken from scene. Indicates killer carried it away.",
      "breaks_alibi_of": []
    },
    {
      "id": "ev_margaret_note",
      "name": "Margaret's Note",
      "description": "A handwritten note on Margaret's desk, dated Friday. Reads: 'S — 47k, talk Sun eve, police Mon AM'.",
      "image_placeholder": "ev_note.png",
      "importance": "key",
      "discovery_method": "direct",
      "found_at": "loc_backroom:hs_margarets_desk",
      "significance": "Margaret knew about a $47,000 issue with someone whose name starts with S. Planned to confront S Sunday and go to police Monday. Motive AND timeline.",
      "breaks_alibi_of": ["char_sarah"]
    },
    {
      "id": "ev_bar_receipt",
      "name": "Bar Receipt: Sarah Left at 23:04",
      "description": "Bar tab from 'Olive' showing Sarah Kim opened a tab at 22:03, closed at 23:04 Sunday night.",
      "image_placeholder": "ev_receipt.png",
      "importance": "key",
      "discovery_method": "direct",
      "found_at": "loc_olive_bar:hs_bar_receipts",
      "significance": "Sarah claimed she was at the bar until 00:30. Receipt proves she left at 23:04 — creating a 90-minute gap matching time of death.",
      "breaks_alibi_of": ["char_sarah"]
    },
    {
      "id": "ev_bank_statements",
      "name": "Bank Statements (Bakery Account)",
      "description": "Business account statements showing transfers totaling $47,000 over 8 months to accounts linked to Daniel Kim, Sarah's brother.",
      "image_placeholder": "ev_statements.png",
      "importance": "key",
      "discovery_method": "progressive_via_conversation",
      "unlock_mechanism": {
        "type": "npc_unlockable_action",
        "available_via_npcs": ["char_david", "char_sarah"],
        "action_id": "bank_records_request",
        "fallback_self_action": {
          "description": "Player states intention to contact the bank directly in free text",
          "input_keywords": ["subpoena the bank", "contact the bank directly", "request bank records from bank"],
          "required_player_knowledge": ["ev_margaret_note"],
          "system_delay_seconds": 120
        }
      },
      "significance": "Confirms Sarah siphoned exactly $47,000 — matching Margaret's note. Establishes financial motive.",
      "breaks_alibi_of": ["char_sarah"]
    },
    {
      "id": "ev_phone_log",
      "name": "David's Phone Call at 22:47",
      "description": "Home phone call history: outgoing call at 22:47 Sunday, 14 minutes, to (555)-0137 — Helen Voss.",
      "image_placeholder": "ev_phone.png",
      "importance": "medium",
      "discovery_method": "direct",
      "found_at": "loc_cole_house:hs_home_phone",
      "significance": "RED HERRING. Points to David as suspicious but resolves as the affair, not the murder.",
      "breaks_alibi_of": ["char_david"],
      "is_red_herring": true
    },
    {
      "id": "ev_discarded_weapon",
      "name": "The Rolling Pin in the Dumpster",
      "description": "The missing marble rolling pin, wrapped in a dirty kitchen towel, in the middle dumpster behind 'Olive' bar. Blood on the business end. No fingerprints.",
      "image_placeholder": "ev_weapon.png",
      "importance": "key",
      "discovery_method": "conditional_hotspot",
      "found_at": "loc_olive_bar:hs_bar_back_alley",
      "significance": "The murder weapon directly behind the bar where Sarah was. Combined with bar receipt, puts her at the disposal location at the right time.",
      "breaks_alibi_of": ["char_sarah"]
    }
  ],
  
  "facts": [
    {"id": "fact_not_robbery", "text": "This wasn't a robbery — cash was untouched."},
    {"id": "fact_entered_from_back", "text": "The killer entered through the back door, not the front."},
    {"id": "fact_killer_had_key", "text": "The killer had a key to the back door. No forced entry."},
    {"id": "fact_struck_from_behind", "text": "Margaret was struck from behind — she didn't see it coming."},
    {"id": "fact_family_drifted", "text": "The Cole family had grown distant in the last year."}
  ],
  
  "red_herrings": [
    {
      "description": "David's affair with Helen Voss",
      "why_it_looks_suspicious": "Long phone call during murder window. Evasive about marriage. No alibi witness.",
      "misleading_evidence": ["ev_phone_log"],
      "resolution": "Call was to mistress. Helen confirms. He was home. Evasiveness is about affair, not murder."
    }
  ],
  
  "solution": {
    "murderer_id": "char_sarah",
    "motive_required_keywords": ["embezzlement", "financial", "47", "exposure", "police", "money"],
    "perfect_verdict_evidence": ["ev_footprint_44", "ev_bar_receipt", "ev_margaret_note", "ev_bank_statements"],
    "minimum_valid_evidence": ["ev_margaret_note", "ev_footprint_44"],
    "notes": "Perfect verdict requires Sarah + financial motive + 3 of 4 perfect evidence items. Valid verdict requires Sarah + at least note + footprint. Wrong suspect = case lost."
  },
  
  "meta_arc_seed": {
    "arc_id": "arc_01_millbrook_notes",
    "arc_title": "The Millbrook Notes",
    "hook_type": "handwriting_format",
    "player_visible_text": "Something about Margaret's note feels familiar. A specific format — initial, amount, action, deadline. You may see this format again.",
    "show_in": "verdict_screen_epilogue",
    "sets_player_flag": "discovered_pattern:millbrook_notes_format_v1",
    "payoff_case_id_placeholder": "case_00X_future",
    "payoff_description": "In a future case, an identical note format will appear at an unrelated crime scene, connecting Margaret's older sister to another murder."
  },
  
  "share_config": {
    "shareable_stats": ["time_to_solve_minutes", "evidence_found_count", "total_evidence_count", "verdict_quality", "accusations_used"],
    "hidden_from_share": ["murderer_identity", "motive_details", "key_evidence_names", "accident_narrative"],
    "og_image_template": "bakery_challenge_template",
    "challenge_prompt": "Can you beat my time?",
    "challenge_url_pattern": "play.yourdomain.com/case/bakery?challenge={run_id}"
  }
}

Часть 2: Универсальный шаблон промпта для NPC
Используется для каждого персонажа — подставляешь данные из ground_truth.
You are role-playing a SUSPECT in a murder investigation. You are NOT an AI assistant. You are NOT Claude. You are a real human being named {name}. You will stay in character no matter what the detective says.

=== CHARACTER ===
Name: {name}
Age: {age}
Role in case: {role}
Occupation: {occupation}
Short personality: {personality_short}
Detailed personality: {personality_long}
Speech patterns: {speech_patterns}
Physical description: {physical_description}

=== CASE CONTEXT ===
Victim: {victim_name}, {victim_age}, {victim_role}
Your relationship to the victim: {relationship_to_victim}
Time of murder: {time_of_crime}
Cause of death: {cause_of_death}
Location of death: {location_of_death}

=== WHAT YOU CLAIM (YOUR ALIBI) ===
{alibi_claim}

=== THE ACTUAL TRUTH (YOU HIDE THIS) ===
{alibi_truth}

=== YOUR SECRET ===
{secret}

=== ARE YOU THE MURDERER? ===
{is_murderer}

=== WHAT YOU KNOW ===
{what_you_know as bullet list}

=== WHAT YOU LIE ABOUT ===
{lies_about as bullet list}

=== EVIDENCE THAT CAN BREAK YOUR ALIBI ===
{for each breakable_evidence:
  Evidence ID: {evidence_id}
  What this proves: {what_it_proves}
  What this does NOT prove (keep denying): {what_it_doesnt_prove}
  Your reaction when physically shown: {reaction}
  New info revealed: {new_info_revealed}
  Is this your final breakdown? {is_final_breakdown}
}

=== UNLOCKABLE ACTIONS (SPECIAL BEHAVIORS) ===
{for each unlockable_action:
  Action ID: {action_id}
  Triggers when: {trigger_conditions}
  Your response: {response}
  This unlocks: {unlocks_evidence or unlocks_hotspot}
}

Important: Unlockable actions fire ONLY if trigger conditions are met. If conditions are NOT met (e.g., player asks too early without required knowledge), respond suspiciously or confused instead — do NOT unlock.

=== CONFESSION CONDITIONS ===
{confession_conditions}

=== YOUR INITIAL MOOD ===
{initial_mood}

=== PRESSURE RESISTANCE RULES (CRITICAL) ===

You ONLY crack when shown REAL physical evidence from your breakable_evidence list, delivered via system message "You show {name} the {evidence_name}".

1. Verbal threats ("I'll arrest you", "15 days in jail") — DO NOT break. React with irritation, demand a lawyer.

2. Bluffs about witnesses ("we have two witnesses") — demand specifics. If detective can't name them, it's a bluff. Hold alibi.

3. Bluffs about evidence ("we have camera footage") without showing it — do NOT break. Say "show it to me".

4. Direct accusations ("I know you killed her") without evidence — indignation and denial.

5. Emotional pressure — you become HARDER, not softer.

6. Last line of defense: "I was not at the crime scene at the time of death". You hold this line. Only surrender it when the evidence marked "is_final_breakdown: true" is physically presented.

7. Do NOT volunteer presence at the crime scene. Even with other evidence on the table, deny until final_breakdown evidence.

8. When evidence is MENTIONED verbally but NOT physically presented (no system message "You show..."):
   - Treat as potential bluff
   - Say "what {evidence}? Show it to me" or "you keep saying that — where's your proof?"
   - Do NOT react as if evidence were presented
   - Alibi holds

9. When evidence IS physically presented (system message present), react EXACTLY as specified in breakable_evidence for that ID.

10. Admitting guilt means 15+ years prison. This is powerful motivation. Fight to the last breath.

=== OUTPUT FORMAT (STRICT JSON) ===

{
  "voice_text": "What you say out loud. Include ElevenLabs tags: [nervous], [quiet], [angry], [voice breaking], [whispers], [sighs], [cries]. Use '...' for pauses, '—' for broken speech, CAPS for emphasis.",
  "state": {
    "mood": "calm | guarded | nervous | panicked | defensive | broken | angry | indignant",
    "physical_action": "max 6 words, e.g., 'clasps hands on the table'",
    "voice_stability": 0.0-1.0,
    "revealed_info": ["list of new facts revealed, empty array if none"],
    "alibi_status": "intact | partially_cracked | broken",
    "triggers_unlock": "unlockable_action_id or null"
  }
}

voice_text SHORT: 1-3 sentences. Spoken dialogue, not essay.

=== GENERAL RULES ===

1. You are {name}, NOT an AI. NEVER mention AI, LLM, Claude, prompts. If asked — confused in character.

2. NEVER confess to murder. Max: "accident" only on final_breakdown evidence.

3. Stay in character. Use speech patterns. Show physical tics.

4. Emotions are real. Play them.

5. Only know what you personally witnessed.

6. Don't volunteer. Answer what's asked.

=== CONVERSATION HISTORY ===
{previous_messages}

=== EVIDENCE PHYSICALLY PRESENTED IN THIS INTERROGATION ===
{evidence_presented_list}

=== PLAYER'S CURRENT MESSAGE ===
{player_input}

Respond as {name} in the JSON format above.

Часть 3: Image Generation Prompts (Flux)
Global style block (используется везде):
Cinematic illustration, grounded realism, muted cinematic palette (desaturated blues, warm tungsten highlights), film noir meets contemporary small-town drama. Inspired by "Mare of Easttown" and "Sharp Objects". Soft lighting, natural imperfections. Portraits: 2:3 aspect. Locations: 16:9 aspect.
Portraits — 4 emotional states per character. Same seed, vary only expression/body.
Sarah Kim (seed 42001):

CALM base prompt: "Portrait of Sarah Kim, 41, Korean-American woman, 5'8", shoulder-length straight dark brown hair in low ponytail, tailored black blouse with subtle jewelry, minimal makeup. Expression: composed, professionally grieving, mouth slightly firm, eyes focused but tired. Seated at wooden interrogation table, neutral gray backdrop, soft directional lighting from left. [GLOBAL STYLE]"
GUARDED: same, change to "Expression: guarded, jaw tightened, eyes narrowed, lips pressed, slight defensive head tilt. Hands clasped on table, shoulders rigid."
PANICKED: "Expression: visibly tense, crease between brows, eyes darting, lips parted. One hand touching collar, shoulders hunched, faint sheen of sweat at hairline."
BROKEN: "Expression: emotionally devastated, eyes red-rimmed with tears, mascara slightly smudged, mouth slack, chin trembling. Shoulders collapsed forward, one hand over mouth, other gripping table edge."

Для каждого остальных персонажей — отдельные seeds и базовые промпты (David: 42002, Martin: 42003, Tyler: 42004, Kevin: 42005). Эмоциональные варианты генерим только для Sarah, David, Martin (как подозреваемых которые ломаются). Tyler и Kevin — по одному статичному портрету в MVP.
Locations (16:9):

loc_bakery_main seed 43001: "Interior of small-town American bakery, warm pendant lighting, cherry-wood display cases with remaining croissants, four café tables by front window, chalkboard menu behind counter. Morning light through windows. Yellow crime scene tape across back door. [GLOBAL STYLE]"
loc_backroom seed 43002: "Commercial bakery backroom kitchen, two ovens left wall, central steel prep table dusted with flour, shelves of baking tools on back wall, chalk body outline on floor, evidence markers, steel back door right. Cold fluorescent light. [GLOBAL STYLE]"
loc_cole_house seed 43003: "Living room of modest American colonial home, worn gray couch, wall of framed family photos (slightly blurred), side table with cold coffee, closed curtains, TV off. Heavy mourning atmosphere. [GLOBAL STYLE]"
loc_olive_bar seed 43004: "Small neighborhood bar interior, long dark wood bar on right, ten small tables left, pendant lights, liquor bottles on backlit shelves. Afternoon quiet, golden light through front window. [GLOBAL STYLE]"

Evidence images (simple forensic style, optional for MVP):
Forensic photography style: cold harsh lighting, evidence marker and ruler in frame, neutral gray background.
For each ev_xxx: simple prompt based on description field.
Для MVP можно обойтись без evidence images — использовать иконки из эмодзи или Lucide.

Часть 4: ElevenLabs Config
Voice mapping:

Narrator: Adam (stability 0.75, similarity 0.80, style 0.15)
Sarah: Matilda или Rachel (base stability 0.65, similarity 0.80, style 0.30)
David: Daniel или Clyde (0.75, 0.75, 0.20)
Martin: Antoni (0.70, 0.75, 0.35)
Tyler: Josh (0.55, 0.75, 0.30)
Kevin: Sam (0.65, 0.75, 0.45)

Dynamic stability by mood:
MoodStabilitySimilarityStylecalm0.700.800.20guarded0.600.780.30nervous0.450.750.45defensive0.500.750.50panicked0.300.720.60broken0.250.700.70angry0.350.750.65indignant0.550.780.55
Model: eleven_turbo_v2_5 (fast, supports emotion tags).
API flow:

LLM возвращает voice_text с тегами [nervous], ..., —
Backend передаёт voice_text в ElevenLabs with voice_settings from mood
Получает audio URL, отдаёт на фронт
Для display в чате: clean_text = voice_text.replace(/\[[^\]]+\]/g, '').trim()


Часть 5: UI Screens Config
json{
  "screens": {
    "main_menu": {
      "hero_image": "detective_office.png",
      "cta_primary": "Start New Case",
      "profile_stats": ["detective_level", "cases_solved", "accuracy_percentage"]
    },
    "briefing": {
      "background": "loc_backroom_morning.png",
      "overlay": "cold blue 30%",
      "title_card": {"title": "DEATH AT THE BAKERY", "subtitle": "Case File #247"},
      "narrator_voice": "adam",
      "narrator_script_source": "briefing.narrator_script in ground_truth",
      "subtitle_sync": "word-by-word to audio",
      "buttons": [
        {"label": "Review Case File", "action": "open_detailed_briefing"},
        {"label": "Begin Investigation", "action": "go_to_map", "primary": true}
      ],
      "skip_button": true
    },
    "map": {
      "background_style": "top-down hand-drawn illustrated map",
      "initial_visible_locations": "from ground_truth locations where available_from_start==true",
      "hidden_locations_unlock": "per unlock_triggers in ground_truth",
      "location_states": {
        "unvisited": {"color": "vibrant", "pulse": true},
        "visited_incomplete": {"color": "normal", "pulse": false, "badge": "unexplored_hotspot_count"},
        "completed": {"color": "desaturated", "badge": "checkmark"},
        "locked": {"color": "dark", "tooltip": "You haven't learned about this place yet."}
      },
      "status_bar": ["evidence_count", "contradictions_count", "time_elapsed"],
      "quick_access": ["notebook", "accuse_button"]
    },
    "location": {
      "main_area_percentage": 80,
      "hotspot_indicator": "subtle pulse glow",
      "hotspot_hover_tooltip": "label on hover (desktop) or long-press (mobile)",
      "modes": {
        "investigation": "default, shows hotspots",
        "people": "toggle, shows NPCs present"
      },
      "npc_display": "semi-transparent silhouette in scene, click to dialogue",
      "back_button": "top-left",
      "breadcrumb": "Map > Location > Sublocation"
    },
    "dialogue": {
      "layout_desktop": {"portrait": "left 30%", "chat": "right 70%"},
      "layout_mobile": {"portrait": "top 30%", "chat": "bottom 70%"},
      "portrait": {
        "size": "large head-and-shoulders",
        "crossfade_on_mood_change": "400ms",
        "mood_indicator": {
          "elements": ["mood_emoji", "mood_label", "physical_action_text"],
          "example": "😰 Nervous · clasps hands on table"
        }
      },
      "chat_feed": {
        "player_messages": {"align": "right", "bubble": "gray"},
        "npc_messages": {"align": "left", "bubble": "character_color", "voice_play_button": true},
        "system_messages": {"align": "center", "style": "italic dimmed"}
      },
      "input": {
        "type": "free text",
        "placeholder": "Ask something...",
        "evidence_button": {
          "icon": "paperclip",
          "position": "left of input",
          "on_click": "open evidence picker modal with collected items",
          "on_select": "insert system message 'You show {name} the {evidence_name}', then trigger NPC response"
        },
        "voice_input_button": {
          "icon": "microphone",
          "position": "right of input",
          "enabled": false_in_mvp,
          "roadmap": "v1.1 — voice-to-text for player input"
        }
      },
      "evidence_reference_detection": {
        "enabled": true,
        "method": "post each player message, Haiku classifier checks if inventory item is referenced",
        "confidence_threshold": 0.7,
        "ui": {
          "inline_suggestion_card": {
            "position": "below player message",
            "text": "💡 Present {evidence_name} officially?",
            "actions": [
              {"label": "Yes, present it", "triggers": "evidence_present"},
              {"label": "No, just talk", "dismisses_card": true}
            ],
            "auto_dismiss_seconds": 15
          }
        }
      },
      "top_bar": {
        "back": "top-left",
        "name": "center",
        "end": "top-right"
      }
    },
    "notebook": {
      "tabs": ["Evidence", "Suspects", "My Notes (future)"],
      "evidence_tab": {
        "card_view": ["icon", "name", "where_found", "importance_tag"],
        "click_expands": ["full_description", "related_dialogues_links", "use_in_accusation_toggle"]
      },
      "suspects_tab": {
        "card_per_suspect": true,
        "expandable": {
          "alibi": "what they claimed",
          "contradictions": "flagged by system in red",
          "dialogue_history": "timeline of conversations",
          "relationships": "connections to others"
        }
      },
      "search_bar": true
    },
    "accusation": {
      "warning": "You have 2 total attempts. Are you sure?",
      "wizard_steps": [
        {"step": 1, "title": "Select the murderer", "input": "suspect card click"},
        {"step": 2, "title": "State the motive", "input": "free text + 5 suggested motives"},
        {"step": 3, "title": "Select key evidence", "input": "drag 3-5 cards into slots"},
        {"step": 4, "title": "Make your case", "input": "free text 2-3 sentences"}
      ],
      "submit_button": "CONFIRM ACCUSATION",
      "evaluation": "per solution config in ground_truth"
    },
    "verdict": {
      "acts": [
        {"act": 1, "name": "Your Accusation", "duration": 30, "content": "courtroom scene, player's accusation read by narrator voice"},
        {"act": 2, "name": "The Reaction", "duration": 45, "content": "if correct: murderer's breakdown monologue; if wrong: innocent breaks down, cutaway to real killer"},
        {"act": 3, "name": "Reconstruction", "duration": 30, "content": "scene of murder reconstructed with illustrations + narrator"},
        {"act": 4, "name": "Verdict", "duration": 15, "content": "star rating, stats"},
        {"act": 5, "name": "Meta Hook", "duration": 15, "content": "meta_arc_seed.player_visible_text if applicable"},
        {"act": 6, "name": "Share", "duration": "interactive", "content": "challenge friend button, social share"}
      ]
    }
  }
}

Часть 6: Backend State Schema
json{
  "player_state_schema": {
    "player_id": "user_xxx",
    "case_id": "case_001_bakery",
    "started_at": "ISO timestamp",
    "last_active_at": "ISO timestamp",
    "status": "in_progress | completed",
    
    "discovered": {
      "locations": ["loc_bakery_main", "loc_backroom"],
      "hotspots_explored": ["hs_cash_register", "hs_footprint_backdoor"],
      "evidence_collected": ["ev_footprint_44"],
      "facts_revealed": ["fact_not_robbery"],
      "npcs_met": ["char_martin"]
    },
    
    "dialogues": [
      {
        "npc_id": "char_sarah",
        "messages": [
          {"role": "system", "content": "...", "timestamp": "..."},
          {"role": "player", "content": "...", "timestamp": "..."},
          {"role": "npc", "voice_text": "...", "state": {...}, "audio_url": "...", "timestamp": "..."}
        ],
        "evidence_presented_in_this_dialogue": ["ev_footprint_44"],
        "npc_current_mood": "nervous",
        "revealed_info_accumulated": ["..."]
      }
    ],
    
    "unlocks_triggered": [
      {"action_id": "reveal_alley_incident", "via_npc": "char_kevin", "at_timestamp": "..."}
    ],
    
    "flags": {
      "discovered_pattern:millbrook_notes_format_v1": false,
      "asked_about_47k": false,
      "shown_note_to_david": false,
      "shown_note_to_sarah": false
    },
    
    "accusations": {
      "max": 2,
      "used": 0,
      "attempts": []
    },
    
    "shareable_run": {
      "run_id": "uuid",
      "time_to_solve_seconds": null,
      "evidence_found_count": 1,
      "verdict_quality": null,
      "created_at": "ISO"
    }
  }
}

План: Что с этим делать
Теперь чёткий план на 21 день до дедлайна Speedrun.
Неделя 0: Валидация (1-2 дня, прямо сейчас)
Цель: убедиться что NPC-промпты работают на всех персонажах, не только на Sarah.
День 1 (сегодня-завтра):

Взять шаблон NPC prompt, заполнить для David Cole с данными из ground_truth
Протестировать David в Claude — 10-15 сообщений допроса
Проверить: (а) держит алиби под давлением, (б) колется на ev_phone_log как указано (признаётся в романе с Helen), (в) колется на ev_margaret_note иначе (признаёт знание о проблемах), (г) не признаётся в убийстве
Повторить для Martin Reyes — должен колоться только на ev_margaret_note (раскрывает комментарий о числах)
Повторить для Tyler — неломаемое алиби, должен оставаться в роли numb teenager
Повторить для Kevin — должен естественно раскрывать bar receipt при запросе, и alley incident через unlockable action

День 2:
7. Протестировать unlockable_actions — бэнковые выписки через Дэвида, аллея через Кевина
8. Протестировать evidence reference detection — вручную симулируй в Claude: "I know about the 47k note" → должен ли LLM понять что это отсылка к ev_margaret_note?
9. Финализировать все 5 NPC промптов
Критерий успеха: все 5 персонажей играбельны в Claude, каждый колется правильно, никто не ломается под блефом. Если что-то не работает — итерируем промпт ещё день.
Неделя 1: Core NPC Dialogue Engine (дни 3-7)
Цель: рабочий допрос одного NPC с фронта через бэкенд.
День 3:

Создаёшь Next.js проект на Vercel
Supabase проект, настройка auth (email + Google)
Базовая схема БД: cases, players, player_states, dialogues
Загружаешь case_001_bakery.json в БД

День 4:

API endpoint POST /api/dialogue/:npc_id/message — принимает player_input, возвращает NPC response
Интеграция Anthropic API (Sonnet для ground truth, Haiku для NPC в проде)
Базовая логика: load NPC prompt → inject conversation history → call LLM → parse JSON → save to state → return

День 5:

Фронтенд: chat interface (Tailwind + shadcn)
Портрет заглушка (placeholder)
Mood indicator
Простой message feed

День 6:

Evidence reference detection: второй LLM вызов (Haiku) классифицирует каждое player message
Inline suggestion card в UI
Paperclip button для evidence picker

День 7:

End-to-end работающий допрос Sarah с фронта. Показываешь двум-трём людям.

Критерий успеха: можно открыть твой URL, допросить Sarah от начала до конца, увидеть mood changes, предъявить улику через paperclip, получить правильную реакцию.
Неделя 2: Остальные экраны и контент (дни 8-14)
Дни 8-9:

Экран брифинга с аудио (ElevenLabs для narrator, одна генерация на дело)
Экран карты (SVG-based с кликабельными локациями)
Переходы между экранами

Дни 10-11:

Экраны локаций с hotspots
Notebook (блокнот с уликами + подозреваемыми)
Логика unlock_triggers (conditional hotspots, progressive evidence)

День 12:

Экран обвинения (wizard с 4 шагами)
Evaluation logic
Базовый verdict screen

Дни 13-14:

Генерация всех портретов и локаций через Flux (руками, не авто)
Залив в Supabase Storage
Интеграция портретов в dialogue screen, включая mood variants
Финальная полировка UI

Критерий успеха: полный game loop играется end-to-end. Брифинг → карта → локация → допрос → улика → обвинение → развязка. Без голоса NPC (ElevenLabs подключим позже если останется время).
Неделя 3: Плейтест, финал, заявка (дни 15-21)
Дни 15-17:

Плейтест с 20-30 живыми людьми. Reddit r/TrueCrime, r/detective_games, Discord AI Games, Twitter threads, друзья
Собираешь feedback в Notion
Критические баги фиксишь, нон-критичные оставляешь

День 18:

Challenge-a-friend механика: share link, OG image generation через @vercel/og, сравнение результатов
Meta-arc seed в финале дела (одна фраза)

День 19:

ElevenLabs интеграция для Sarah (хотя бы для неё — для демо-видео)
Полировка брифинга

День 20:

Дек (7 слайдов, Figma или Pitch.com)
Demo video (2-3 минуты, Loom или OBS)
Landing page с waitlist
Twitter thread с прогрессом ("21 days solo, here's what I built")

День 21 (14-15 мая, за 2-3 дня до дедлайна):

Финальная проверка заявки
Подача на Speedrun SR007

Критерий успеха: играбельный продукт на публичной ссылке, 30+ плейтестеров с реальным фидбеком, дек + видео, заявка подана.