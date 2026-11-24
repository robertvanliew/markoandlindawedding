import { notFound } from "next/navigation";
import { loadInvite } from "@/app/actions";
import { Hero } from "@/components/Hero";
import { Details } from "@/components/Details";
import { RsvpSection } from "@/components/RsvpSection";
import { Footer } from "@/components/Footer";
import { SiteNav } from "@/components/SiteNav";
import { FlowerFrame } from "@/components/Peony";
import { ChurchBackdrop } from "@/components/ChurchBackdrop";

export const dynamic = "force-dynamic";

/** Personal link: same page, the RSVP opens straight on the party's invitation. */
export default async function PersonalRsvp({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await loadInvite(token);
  if (!invite) notFound();
  return (
    <>
      <a className="skip-link" href="#rsvp">Skip to the RSVP</a>
      <ChurchBackdrop />
      <SiteNav />
      <FlowerFrame />
      <Hero />
      <div className="page-sheet">
      <main>
        <Details />
        <RsvpSection invite={invite} />
      </main>
      <Footer />
      </div>
    </>
  );
}
