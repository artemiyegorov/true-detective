import { notFound } from "next/navigation";
import { isNpcId, npcDisplayName, type NpcId } from "@/lib/npc";
import { loadCase } from "@/lib/case";
import Chat from "./Chat";

export default async function ChatPage({ params }: { params: { npcId: string } }) {
  if (!isNpcId(params.npcId)) notFound();
  const npcId = params.npcId as NpcId;

  const ground = await loadCase();
  const evidenceList = ground.evidence.map(e => ({ id: e.id, name: e.name }));

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Chat
        npcId={npcId}
        npcName={npcDisplayName(npcId)}
        evidenceList={evidenceList}
      />
    </main>
  );
}
