import type { InviteView } from "@/app/actions";
import { RSVP_DEADLINE_LABEL, rsvpOpen } from "@/lib/wedding";
import { RsvpForm } from "./RsvpForm";

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
            {closed ? "RSVPs are now closed" : `Please reply by ${RSVP_DEADLINE_LABEL}. We kindly ask that our celebration be adults only.`}
          </p>
        </div>
        <div className="card rsvp-card">
          <RsvpForm initialInvite={invite} closed={closed} />
        </div>
      </div>
    </section>
  );
}
