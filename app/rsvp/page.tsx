import type { Metadata } from "next";
import { ChurchBackdrop } from "@/components/ChurchBackdrop";
import { FlowerFrame } from "@/components/Peony";
import { RsvpFinder } from "@/components/RsvpFinder";
import { RSVP_DEADLINE_LABEL, rsvpOpen } from "@/lib/wedding";

export const metadata: Metadata = { title: "RSVP · Linda & Marko" };

/** The "Scan to RSVP" page the printed invitation's QR code opens. */
export default function RsvpFind() {
  const closed = !rsvpOpen();
  return (
    <>
      <ChurchBackdrop />
      <FlowerFrame />
      <main className="page-sheet">
        <section className="section" id="rsvp" aria-labelledby="rsvp-title">
          <div className="wrap">
            <div className="section-head">
              <p className="script finder-names">Linda &amp; Marko</p>
              <h1 className="section-title" id="rsvp-title">
                RSVP
              </h1>
              <p className="section-sub">
                {closed ? "RSVPs are now closed" : `Please reply by ${RSVP_DEADLINE_LABEL}. We kindly ask that our celebration be adults only.`}
              </p>
            </div>
            <div className="card rsvp-card">
              {closed ? (
                <div className="rsvp-link-only">
                  <h2 className="step-heading">RSVPs are now closed</h2>
                  <p className="step-note">Please contact Linda and Marko directly.</p>
                </div>
              ) : (
                <RsvpFinder />
              )}
            </div>
            <p className="finder-home">
              <a className="btn-quiet" href="/">
                See the wedding details
              </a>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
