import { loadCase } from "@/lib/case";
import CasebookView, { type ClueDetail } from "./CasebookView";

export default async function CasebookPage() {
  const ground = await loadCase();

  const evidenceById: Record<string, ClueDetail> = {};
  for (const e of ground.evidence) {
    evidenceById[e.id] = {
      id: e.id,
      name: e.name,
      significance: e.significance,
      foundAt: e.found_at?.split(":")[0],
      image: e.image,
      labTests: e.lab_tests?.map(t => ({
        id: t.id,
        label: t.label,
        kind: t.kind,
        matches: t.matches,
        no_match_text: t.no_match_text,
      })),
    };
  }
  const factsById: Record<string, string> = {};
  for (const f of ground.facts) factsById[f.id] = f.text;

  return (
    <main className="min-h-screen bg-[#07080d]">
      <CasebookView
        evidenceById={evidenceById}
        factsById={factsById}
        caseTitle={ground.meta.title}
      />
    </main>
  );
}
