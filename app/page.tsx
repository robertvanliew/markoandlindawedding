import { Hero } from "@/components/Hero";
import { Details } from "@/components/Details";
import { RsvpSection } from "@/components/RsvpSection";
import { Footer } from "@/components/Footer";
import { SiteNav } from "@/components/SiteNav";
import { FlowerFrame } from "@/components/Peony";
import { ChurchBackdrop } from "@/components/ChurchBackdrop";

export const revalidate = 3600;

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#rsvp">Skip to the RSVP</a>
      <ChurchBackdrop />
      <SiteNav />
      <FlowerFrame />
      <Hero />
      <main>
        <Details />
        <RsvpSection />
      </main>
      <Footer />
    </>
  );
}
