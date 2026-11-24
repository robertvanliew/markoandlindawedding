// Wedding facts, verbatim from the printed invitation (PROJECT_BRIEF.md §2).
// TODO(confirm): Serbian translations of all guest-facing copy (PRODUCT.md: English + Serbian).

export const COUPLE = {
  bride: "Linda Todorovski",
  groom: "Marko Pupavac",
  short: "Linda & Marko",
} as const;

export const TIMEZONE = "America/Toronto";

export const DATE_LABEL = "Saturday, May 15th, 2027";

export type VenueKey = "ceremony" | "reception";

export const VENUES: Record<VenueKey, {
  label: string;
  time: string;
  name: string;
  nameLines: [string, string?];
  street: string;
  city: string;
  /** Local start, America/Toronto. */
  start: string;
  /** Local end, America/Toronto. TODO(confirm): end times are not on the invitation. */
  end: string;
}> = {
  ceremony: {
    label: "Church Ceremony",
    time: "1:00 PM",
    name: "St. Sava Serbian Orthodox Church",
    nameLines: ["St. Sava Serbian", "Orthodox Church"],
    street: "1375 Blundell Rd.",
    city: "Mississauga, ON",
    start: "20270515T130000",
    end: "20270515T143000",
  },
  reception: {
    label: "Reception",
    time: "5:30 PM",
    name: "Château Le Jardin",
    nameLines: ["Château Le Jardin"],
    street: "8440 Hwy 27,",
    city: "Woodbridge, ON",
    start: "20270515T173000",
    end: "20270515T235900",
  },
};

export function venueAddress(key: VenueKey) {
  const v = VENUES[key];
  return `${v.name}, ${v.street.replace(/,$/, "")}, ${v.city}`;
}

export function mapsUrl(key: VenueKey) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venueAddress(key))}`;
}

export const RSVP_DEADLINE_LABEL = "March 15th, 2027";

/** End of day March 15, 2027 in Toronto (EDT, UTC−4). */
export const RSVP_DEADLINE = new Date("2027-03-16T03:59:59.999Z");

export function rsvpOpen(now = new Date()) {
  return now.getTime() <= RSVP_DEADLINE.getTime();
}

export const MEALS = [
  { value: "chicken", label: "Chicken" },
  { value: "beef", label: "Beef" },
  { value: "veggie", label: "Veggie" },
] as const;

export type Meal = (typeof MEALS)[number]["value"];
