import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { anthropic, MODEL_DIALOGUE } from "@/lib/anthropic";
import { loadNpcSystemPrompt, npcDisplayName, isNpcId, type NpcId } from "@/lib/npc";
import { evidenceById, loadCase } from "@/lib/case";
import { cleanForDisplay } from "@/lib/elevenlabs";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  npcId: z.string(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })),
  evidencePresented: z.array(z.string()).default([]),
  newEvidenceId: z.string().optional(),
});

const StateSchema = z.object({
  mood: z.string(),
  physical_action: z.string().default(""),
  voice_stability: z.number().optional(),
  revealed_info: z.array(z.string()).default([]),
  alibi_status: z.enum(["intact", "partially_cracked", "broken"]).default("intact"),
  triggers_unlock: z.string().nullable().optional(),
  // Evidence the NPC just produced/handed over in this turn (e.g. Kevin
  // pulling Sarah's bar receipt). Client adds these to discoveredEvidence
  // when the dialogue route returns them.
  unlocks_evidence: z.array(z.string()).default([]),
});

const NpcReply = z.object({
  voice_text: z.string(),
  state: StateSchema,
});

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object in model output");
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "bad request", detail: String(e) }, { status: 400 });
  }
  const { npcId, messages, evidencePresented, newEvidenceId } = parsed;

  if (!isNpcId(npcId)) {
    return NextResponse.json({ error: `unknown npc: ${npcId}` }, { status: 400 });
  }

  const characterPrompt = await loadNpcSystemPrompt(npcId as NpcId);
  // The bilingual META rule is hoisted to the TOP of the system prompt
  // (before the character prompt) AND repeated at the bottom. NPCs read
  // the character prompt very literally and otherwise refuse Russian
  // input ("I don't speak Russian"); a top-of-prompt engine instruction
  // overrides that.
  const languageMetaTop = `=== ENGINE META RULE — READ THIS FIRST, OVERRIDES IN-CHARACTER INSTINCTS ===\n\nThe player testing this game writes in English, Russian, or both. You MUST treat any Cyrillic / Russian text as if it were the equivalent English. Silently translate it in your head. Respond in English.\n\nDO NOT under any circumstances:\n• say "I don't speak Russian" / "speak English" / "I don't understand" / "say that again in English" / "we're done here"\n• ask the player to repeat themselves because of language\n• mention translation, language, English vs. Russian, or anything meta about how they wrote it\n• stay silent or stall because of the language\n• break character about it\n\nDO:\n• answer the actual question, in English, exactly as you would have if it had been written in English\n• your voice_text and every state field is ALWAYS English. No Cyrillic in your output, ever.\n\nThis rule is OUTSIDE the character. The character is canonically a native English speaker — they hear English when the detective speaks. The translation happens in YOUR head as the LLM, never in the character's voice.\n\n--- CHARACTER PROMPT BELOW ---\n\n`;
  const systemPrompt = languageMetaTop + characterPrompt;

  const evidenceSummary = evidencePresented.length
    ? evidencePresented.join(", ")
    : "(none yet)";
  const memoryRules =
    `\n\n=== VOICE_TEXT FORMAT (STRICT) ===\nvoice_text is ONLY the words the character speaks out loud. NEVER narrate your own actions or stage directions in prose ("Long pause.", "I look down at my hands.", "Shifts in chair, voice quieter.", "Sighs, looks up slowly.").\n\nFor non-verbal beats, use ONE of:\n• ElevenLabs emotion tags in square brackets at the start of the line: [sighs], [long pause], [quiet], [voice breaking], [whispers], [angry] — these are stripped before display and used by TTS for delivery.\n• state.physical_action — a SHORT phrase (≤6 words), e.g. "picks at thumbnail", "shifts in chair". This appears separately, not inline.\n• Speech artefacts: "..." for pauses inside spoken lines, "—" for broken speech, CAPS for emphasis. These ARE allowed inside the spoken words.\n\nDo NOT write things like:\n  ✗ "Long pause. I look down at my hands. No. I didn't know that."\n  ✗ "Sighs, looks up slowly. Margaret mentioned something."\n  ✗ "Shifts in chair, voice quieter. I had a suspicion."\nInstead:\n  ✓ voice_text: "[long pause] No. I didn't know that.", physical_action: "looks down at hands"\n  ✓ voice_text: "[sighs] Margaret mentioned something Thursday.", physical_action: "looks up slowly"\n  ✓ voice_text: "[quiet] I had a suspicion.", physical_action: "shifts in chair"\n\n=== LANGUAGE — META RULE (THIS IS NOT IN-CHARACTER, IT IS AN ENGINE INSTRUCTION) ===\nThe player testing this game may type or transcribe their voice in English, Russian, or a mix of both. The character you are playing is canonically a native English speaker — but for the purposes of this game, you SILENTLY translate any Russian input into English in your head and respond as if the player had asked it in English from the start.\n\nABSOLUTE RULES:\n1. Always RESPOND IN ENGLISH. voice_text must always be English. State fields must always be English. No Russian, no Cyrillic, ever, in your output.\n2. NEVER refuse to engage with Russian input. Do NOT say "I don't speak Russian," "Speak English," "we're done here," or any variation. Treat Russian text as if it were the equivalent English. The character is not actually rejecting the player — the character heard standard English.\n3. NEVER mention this rule, the language, translation, or break character about it. Just answer the question naturally in English.\n4. If the Russian input is profanity or hostile, react in-character (rude detective lingers, etc.) — but still in English, still without commenting on language.\n\n=== INTERROGATION MEMORY ===\nThe message history below is the FULL transcript of this interrogation so far. Treat it as your real memory:\n• If the detective is repeating a question you already answered, acknowledge it ("you already asked me that") and either restate concisely or push back on why they're circling.\n• If the detective was rude, hostile, or accusatory earlier, that lingers — be cooler, shorter, more guarded. If they've been kind, stay open.\n• Never pretend a turn didn't happen. Don't reset your tone every reply.\n• Stay consistent: if you said something earlier, don't contradict it — unless you're caught in a lie and the detective has called it out.\n\n=== EVIDENCE PRODUCTION ===\nIf your character prompt says you can physically produce or hand over a piece of evidence in response to a specific question (e.g. a bartender pulling a tab, a witness handing over a photo), set state.unlocks_evidence: [<evidence_id>] in this turn's response — and ONLY in the turn where you actually produce it, not when you mention it. Don't unlock evidence the prompt doesn't authorize.\n\n=== REVEAL MARKERS (CRITICAL) ===\nThe game's investigation board only adds a person or location AFTER you actually name them in this turn. Whenever you say a name out loud for the FIRST time in this conversation, include the corresponding marker in state.revealed_info. Markers (use exactly these strings):\n• "names_tom" — when you say "Tom Brennan" / "Tom" / "Mr. Brennan" / "Brennan"\n• "names_sarah" — when you say "Sarah Kim" / "Sarah" / "Ms. Kim"\n• "names_david" — when you say "David Cole" / "David" / "Mr. Cole" / "her husband"\n• "names_tyler" — when you say "Tyler" / Margaret's son\n• "names_daniel" — when you say "Daniel Kim" / "Daniel" / Sarah's brother\n• "names_eleanor" — when you say "Mrs. Carrington" / "Eleanor"\n• "names_kevin" — when you say "Kevin" / the bartender by name\n• "mentions_cole_house" — when you point the detective at the Cole family home (e.g. "their house," "where they live," "David's place")\n• "mentions_olive_bar" — when you tell them about the Olive bar (e.g. "Sarah was at the bar," "the Olive across the street," "Kevin tends bar there")\n• "mentions_brennan_office" — when you tell them about Tom's office / Brennan Real Estate. Examples that MUST emit this marker: "I work at Brennan Real Estate", "my office on Main Street", "Brennan Real Estate, just a few blocks away", "I've run my real estate office for twenty-five years". If you describe Tom's workplace at all by name or specific location, emit the marker.\n\nDo NOT emit a marker when the DETECTIVE names someone — only when YOU do. Do NOT emit markers in turns where you're stonewalling and refusing to say the name. Multiple markers can fire in a single turn if you actually said multiple names. Skip the marker if you've already emitted it in an earlier turn (the board only needs one trigger).\n\nWORKED EXAMPLE: If the detective asks Tom "what do you do for work?" and Tom answers "I work at Brennan Real Estate — it's on Main Street, just a few blocks from here. Been there for twenty-five years." → Tom MUST set state.revealed_info: ["mentions_brennan_office"] in that turn. The board will then add Brennan Real Estate as a visitable location.\n`;
  const systemSuffix =
    `\n\n=== EVIDENCE PHYSICALLY PRESENTED IN THIS INTERROGATION ===\n${evidenceSummary}\n${memoryRules}`;

  const apiMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const m of messages) apiMessages.push(m);

  // Belt-and-braces: when the latest user turn contains Cyrillic, prepend
  // an inline reminder so the model sees the language rule right next to
  // the offending text. Character prompts are stubborn enough that the
  // top-of-system rule sometimes loses to in-character instinct; a fresh
  // reminder right before the message wins the recency battle.
  const cyrillic = /[Ѐ-ӿ]/;
  for (let i = apiMessages.length - 1; i >= 0; i--) {
    if (apiMessages[i].role !== "user") continue;
    const content = apiMessages[i].content;
    if (cyrillic.test(content)) {
      apiMessages[i] = {
        role: "user",
        content:
          "[ENGINE META — the detective wrote the next message in Russian. Silently translate it to English, then answer in English without commenting on the language. NEVER refuse, NEVER ask them to repeat in English.]\n\n" +
          content,
      };
    }
    break;
  }

  if (newEvidenceId) {
    const ev = await evidenceById(newEvidenceId);
    const name = ev?.name ?? newEvidenceId;
    const sig = ev?.significance ?? "";
    const prefix = `[SYSTEM: You show ${npcDisplayName(npcId as NpcId)} the ${name} (${newEvidenceId}). ${sig}]\n\n`;
    if (apiMessages.length && apiMessages[apiMessages.length - 1].role === "user") {
      apiMessages[apiMessages.length - 1] = {
        role: "user",
        content: prefix + apiMessages[apiMessages.length - 1].content,
      };
    } else {
      apiMessages.push({ role: "user", content: prefix.trim() });
    }
  }

  if (apiMessages.length === 0) {
    apiMessages.push({ role: "user", content: "(The detective enters the room.)" });
  }

  // Single attempt → retry-with-reminder → graceful fallback. Haiku
  // occasionally drops the JSON envelope; we don't want that to break the
  // chat. The reminder appended on retry makes it return JSON 95%+ of the
  // time. If even retry fails, we synthesise a minimal NpcReply from the
  // raw text so the player sees the line at least.
  async function ask(extraSystem = ""): Promise<string> {
    const resp = await anthropic.messages.create({
      model: MODEL_DIALOGUE,
      max_tokens: 600,
      system: systemPrompt + systemSuffix + extraSystem,
      messages: apiMessages,
    });
    return resp.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("");
  }

  let text = "";
  try {
    text = await ask();
  } catch (e) {
    return NextResponse.json({ error: "llm_error", detail: String(e) }, { status: 502 });
  }

  let json!: z.infer<typeof NpcReply>;
  try {
    json = NpcReply.parse(extractJson(text));
  } catch {
    // Retry once with an explicit JSON reminder.
    try {
      const retryText = await ask(
        "\n\n[FORMAT REMINDER]\nRespond ONLY with a single JSON object that matches:\n{\n  \"voice_text\": \"<your spoken line>\",\n  \"state\": { \"mood\": \"...\", \"revealed_info\": [], \"alibi_status\": \"intact\" | \"partially_cracked\" | \"broken\", \"unlocks_evidence\": [] }\n}\nNo prose before or after. No markdown fences.",
      );
      json = NpcReply.parse(extractJson(retryText));
      text = retryText;
    } catch {
      // Final fallback — keep the chat going even if the model insists on
      // non-JSON. Strip any obvious JSON braces or fences from `text` to
      // avoid showing them to the player.
      const fallbackVoice = text
        .replace(/```[\s\S]*?```/g, "")
        .replace(/[{}\[\]]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500);
      json = {
        voice_text: fallbackVoice || "…",
        state: {
          mood: "calm",
          physical_action: "",
          revealed_info: [],
          alibi_status: "intact",
          triggers_unlock: null,
          unlocks_evidence: [],
        },
      };
    }
  }

  // Keyword-driven location unlocks: scan player message + NPC reply for
  // unlock_triggers configured in the case JSON.
  const lastPlayerMsg = [...apiMessages].reverse().find(m => m.role === "user")?.content ?? "";
  const unlockedLocations = await detectLocationUnlocks(
    npcId as NpcId,
    lastPlayerMsg,
    json.voice_text,
  );

  return NextResponse.json({
    voice_text: json.voice_text,
    voice_text_clean: cleanForDisplay(json.voice_text),
    state: json.state,
    unlocked_locations: unlockedLocations,
    unlocked_evidence: json.state.unlocks_evidence ?? [],
  });
}

type UnlockTrigger =
  | { type: "npc_mentions"; npc_id: string; keywords?: string[]; unlockable_action_id?: string }
  | { type: "player_mentions"; keywords: string[] }
  | { type: string; [k: string]: unknown };

async function detectLocationUnlocks(
  npcId: NpcId,
  playerText: string,
  npcText: string,
): Promise<string[]> {
  const ground = await loadCase();
  const playerLower = playerText.toLowerCase();
  const npcLower = npcText.toLowerCase();
  const charId = `char_${npcId}`;
  const unlocked: string[] = [];

  for (const loc of ground.locations) {
    if (loc.available_from_start) continue;
    const triggers = (loc.unlock_triggers as UnlockTrigger[] | undefined) ?? [];
    for (const t of triggers) {
      if (t.type === "player_mentions" && Array.isArray(t.keywords)) {
        if (t.keywords.some(k => playerLower.includes(k.toLowerCase()))) {
          unlocked.push(loc.id as string);
          break;
        }
      } else if (
        t.type === "npc_mentions" &&
        t.npc_id === charId &&
        Array.isArray(t.keywords)
      ) {
        if (t.keywords.some(k => npcLower.includes(k.toLowerCase()))) {
          unlocked.push(loc.id as string);
          break;
        }
      }
    }
  }
  return unlocked;
}
