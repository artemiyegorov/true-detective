import { loadCase } from "@/lib/case";
import BoardView, { type ClueDetail } from "./BoardView";

export default async function BoardPage() {
  const ground = await loadCase();
  const evidenceById: Record<string, ClueDetail> = {};
  for (const e of ground.evidence) {
    evidenceById[e.id] = {
      id: e.id,
      name: e.name,
      significance: e.significance,
      foundAt: e.found_at?.split(":")[0],
      image: e.image,
    };
  }
  const factsById: Record<string, string> = {};
  for (const f of ground.facts) factsById[f.id] = f.text;
  return (
    <main className="min-h-screen noir-vignette">
      <BoardView
        evidenceById={evidenceById}
        factsById={factsById}
        caseTitle={ground.meta.title}
        groundTruth={ground.ground_truth}
      />
    </main>
  );
}
