"use client";

import { useEffect, useState } from "react";

/** Sticky top bar: the couple's names, section links, and the one RSVP action. */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="site-nav" aria-label="Main" data-scrolled={scrolled}>
      <div className="wrap">
        <div className="nav-links">
          <a className="btn btn-sm" href="#rsvp">
            Reply now
          </a>
        </div>
      </div>
    </nav>
  );
}
