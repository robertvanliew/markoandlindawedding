import { DATE_LABEL } from "@/lib/wedding";

export function Footer() {
  return (
    <footer className="footer">
      <p className="footer-love">With love,</p>
      <p className="script footer-names">Linda &amp; Marko</p>
      <p className="footer-date">{DATE_LABEL}</p>
    </footer>
  );
}
