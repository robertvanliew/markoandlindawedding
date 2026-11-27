import type { InviteView } from "@/app/actions";
import { RSVP_DEADLINE_LABEL, rsvpOpen } from "@/lib/wedding";
import { RsvpFinder } from "./RsvpFinder";
import { RsvpForm } from "./RsvpForm";

/**
 * Guests reply here by finding their invitation with their last name and the last 4 digits of their
 * phone number. A personal link (from the invitation email) opens straight on the reply form.
 */
export function RsvpSection({ invite = null }: { invite?: InviteView | null }) {
  const closed = !rsvpOpen();
  return (
    <section className="section" id="rsvp" aria-labelledby="rsvp-title">
      <div className="wrap">
        <div className="section-head">
          <h2 className="section-title" id="rsvp-title">
            RSVP
          </h2>
          <p className="section-sub">
            {closed ? "RSVPs are now closed" : `Please reply by ${RSVP_DEADLINE_LABEL}.`}
          </p>
        </div>
        <div className="card rsvp-card">
          {invite ? (
            <RsvpForm initialInvite={invite} closed={closed} />
          ) : closed ? (
            <div className="rsvp-link-only">
              <h3 className="step-heading">RSVPs are now closed</h3>
              <p className="step-note">Please contact Linda and Marko directly.</p>
            </div>
          ) : (
            <RsvpFinder />
          )}
        </div>
      </div>
    </section>
  );
}
