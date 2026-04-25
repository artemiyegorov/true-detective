import { notFound } from "next/navigation";
import { loadCase, type Evidence } from "@/lib/case";
import LocationView from "./LocationView";

type Hotspot = {
  id: string;
  label: string;
  available_from_start: boolean;
  on_click_text?: string;
  reveals?: { type: "evidence" | "fact"; id: string } | null;
  leads_to_location?: string;
  leads_to_npc?: string;
};

export default async function LocationPage({ params }: { params: { locId: string } }) {
  const ground = await loadCase();
  const loc = ground.locations.find(l => l.id === params.locId) as
    | (Record<string, unknown> & { hotspots?: Hotspot[] })
    | undefined;
  if (!loc) notFound();

  const hotspots: Hotspot[] = (loc.hotspots ?? []).map(h => ({
    id: h.id,
    label: h.label,
    available_from_start: Boolean(h.available_from_start),
    on_click_text: h.on_click_text,
    reveals: h.reveals ?? null,
    leads_to_location: h.leads_to_location,
    leads_to_npc: h.leads_to_npc,
  }));

  const evidenceMap: Record<string, Pick<Evidence, "id" | "name" | "significance">> = {};
  for (const e of ground.evidence) evidenceMap[e.id] = { id: e.id, name: e.name, significance: e.significance };

  const factsMap: Record<string, string> = {};
  for (const f of ground.facts) factsMap[f.id] = f.text;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <LocationView
        locId={loc.id as string}
        locName={loc.name as string}
        hotspots={hotspots}
        evidenceMap={evidenceMap}
        factsMap={factsMap}
      />
    </main>
  );
}
