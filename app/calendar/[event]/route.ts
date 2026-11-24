import { buildIcs } from "@/lib/ics";
import type { VenueKey } from "@/lib/wedding";

const KEYS: VenueKey[] = ["ceremony", "reception"];

export async function GET(_req: Request, { params }: { params: Promise<{ event: string }> }) {
  const { event } = await params;
  const key = event.replace(/\.ics$/, "") as VenueKey;
  if (!KEYS.includes(key)) return new Response("Not found", { status: 404 });
  return new Response(buildIcs(key), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="linda-marko-${key}.ics"`,
    },
  });
}
