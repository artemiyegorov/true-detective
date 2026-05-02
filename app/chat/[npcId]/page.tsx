import { notFound } from "next/navigation";
import { isNpcId, npcDisplayName, type NpcId } from "@/lib/npc";
import { loadCase } from "@/lib/case";
import Chat from "./Chat";

// Per-NPC presentable-evidence map. Anything outside this set is filtered
// out of the chat's paperclip picker so the player isn't offered, e.g.,
// "Tom's old bakery key" while interrogating Daniel — it isn't a lever
// against him narratively. Built from the case JSON's breakable_evidence
// arrays plus the per-suspect lab-match results that supersede the raw
// `ev_dna_door_handle` evidence.
const PER_NPC_EXTRA: Record<string, string[]> = {
  // Daniel's panic-break is on his own DNA match (replaces the raw
  // door-handle evidence, which is anonymous before lab work).
  daniel: ["ev_dna_match_daniel"],
  // Tom is the murderer — every Tom-tying clue is presentable.
  tom: [
    "ev_dna_match_tom",
    "ev_paperweight_recovered",
    "ev_partial_footprint_size_11",
    "ev_security_camera_glimpse",
    "ev_tom_old_key",
    "ev_margaret_cell_log_tom",
  ],
};

export default async function ChatPage({ params }: { params: { npcId: string } }) {
  if (!isNpcId(params.npcId)) notFound();
  const npcId = params.npcId as NpcId;

  const ground = await loadCase();

  // Compute the relevant set per character from breakable_evidence + the
  // per-NPC extras above. Empty set ⇒ Chat client falls back to "show
  // nothing presentable to this NPC" rather than the global PRESENTABLE
  // pool, keeping the picker tightly scoped to whoever you're talking to.
  const character = ground.characters.find(c => c.id === `char_${npcId}`);
  const breakIds = (character?.breakable_evidence ?? []).map(b => b.evidence_id);
  const relevantEvidenceIds = Array.from(
    new Set([...breakIds, ...(PER_NPC_EXTRA[npcId] ?? [])]),
  );

  const evidenceList = ground.evidence.map(e => ({ id: e.id, name: e.name }));

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Chat
        npcId={npcId}
        npcName={npcDisplayName(npcId)}
        evidenceList={evidenceList}
        relevantEvidenceIds={relevantEvidenceIds}
      />
    </main>
  );
}
