import type { InviteView } from "@/app/actions";
import { RSVP_DEADLINE_LABEL, rsvpOpen } from "@/lib/wedding";
import { RsvpForm } from "./RsvpForm";

/**
 * Replies are made only through each party's personal invitation link. The home page has no guest
 * search, so nobody can look anyone up; it points guests to their invitation email instead.
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
            {closed ? "RSVPs are now closed" : `Please reply by ${RSVP_DEADLINE_LABEL}. We kindly ask that our celebration be adults only.`}
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
            <div className="rsvp-link-only">
              <h3 className="step-heading">Your personal RSVP link</h3>
              <p className="step-note">
                Each invitation was sent by email with its own RSVP button, already set up with your name and the seats reserved for you.
                Please open your invitation email and tap <strong>RSVP</strong>.
              </p>
              <p className="step-note">Can&apos;t find it? Check your spam folder, or ask Linda or Marko to send it again.</p>
              <p className="rsvp-printed">
                <a className="btn btn-ghost" href="/rsvp">
                  Received a printed invitation?
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
