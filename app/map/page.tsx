import { loadCase } from "@/lib/case";
import MapView from "./MapView";

export default async function MapPage() {
  const ground = await loadCase();
  const locations = ground.locations.map(l => ({
    id: l.id as string,
    name: l.name as string,
    available_from_start: Boolean(l.available_from_start),
    short_description: (l.short_description as string | undefined) ?? null,
    hotspot_count: Array.isArray(l.hotspots) ? l.hotspots.length : 0,
    unlock_hint: extractUnlockHint(l),
  }));
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <MapView locations={locations} />
    </main>
  );
}

function extractUnlockHint(loc: Record<string, unknown>): string | null {
  if (loc.available_from_start) return null;
  const triggers = loc.unlock_triggers as Array<Record<string, unknown>> | undefined;
  if (!triggers || triggers.length === 0) return null;
  const npcMentions = triggers
    .filter(t => t.type === "npc_mentions")
    .map(t => `via ${(t.npc_id as string)?.replace("char_", "")}`)
    .join(" or ");
  return npcMentions || "discover via dialogue";
}
