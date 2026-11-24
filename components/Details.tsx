import { DATE_LABEL, VENUES, mapsUrl, type VenueKey } from "@/lib/wedding";

function ChurchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5v4M10 4.5h4M7 21V11l5-4.5 5 4.5v10M4 21h16M10.5 21v-4a1.5 1.5 0 0 1 3 0v4" />
    </svg>
  );
}

function RingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="9" cy="14" r="5.5" />
      <circle cx="15" cy="14" r="5.5" />
      <path d="M10.5 4.5 12 2.5l1.5 2L12 6.5z" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

function Venue({ id }: { id: VenueKey }) {
  const v = VENUES[id];
  return (
    <article className="card venue-card">
      <span className="venue-icon">{id === "ceremony" ? <ChurchIcon /> : <RingsIcon />}</span>
      <h3 className="venue-label">{v.label}</h3>
      <p className="venue-time">{v.time}</p>
      <span className="venue-divider" aria-hidden="true" />
      <p className="venue-name">{v.name}</p>
      <address className="venue-addr">
        {v.street.replace(/,$/, "")}, {v.city}
      </address>
      <div className="venue-actions">
        <a className="btn btn-sm" href={mapsUrl(id)} target="_blank" rel="noopener noreferrer">
          <PinIcon />
          Get directions<span className="sr-only"> to {v.name} (opens in a new tab)</span>
        </a>
        <a className="btn btn-sm btn-ghost" href={`/calendar/${id}.ics`} download>
          <CalendarIcon />
          Add to calendar<span className="sr-only">: {v.label}</span>
        </a>
      </div>
    </article>
  );
}

export function Details() {
  return (
    <section className="section" id="when-where" aria-labelledby="when-where-title">
      <div className="wrap">
        <div className="section-head">
          <h2 className="section-title" id="when-where-title">
            When &amp; Where
          </h2>
          <p className="section-sub">{DATE_LABEL}</p>
        </div>
        <div className="venues">
          <Venue id="ceremony" />
          <Venue id="reception" />
        </div>
      </div>
    </section>
  );
}
