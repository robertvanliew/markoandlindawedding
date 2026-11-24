import { DATE_LABEL, VENUES } from "@/lib/wedding";

/** The close: a quiet sign-off, set like the last line of the invitation. */
export function Footer() {
  return (
    <footer className="footer">
      <span className="footer-rule" aria-hidden="true" />
      <p className="footer-love">With love,</p>
      <p className="script footer-names">Linda &amp; Marko</p>
      <p className="footer-date">{DATE_LABEL}</p>
      <p className="footer-venues">
        {VENUES.ceremony.name} · {VENUES.reception.name}
      </p>
    </footer>
  );
}
