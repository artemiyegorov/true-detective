import { loadCase } from "@/lib/case";
import BoardView from "./BoardView";

export default async function BoardPage() {
  const ground = await loadCase();
  const evidenceById: Record<string, { id: string; name: string; significance: string }> = {};
  for (const e of ground.evidence) {
    evidenceById[e.id] = { id: e.id, name: e.name, significance: e.significance };
  }
  return (
    <main className="min-h-screen noir-vignette noir-grain">
      <BoardView evidenceById={evidenceById} caseTitle={ground.meta.title} />
    </main>
  );
}
