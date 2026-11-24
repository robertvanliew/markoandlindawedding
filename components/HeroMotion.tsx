"use client";

import { useEffect } from "react";

/**
 * Review switches: `?settled` jumps every animation to its end state; `?frozen` pauses everything
 * partway through (so falling petals can be inspected in a screenshot).
 */
export function HeroMotion() {
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.has("frozen")) document.documentElement.classList.add("motion-frozen");
    else if (q.has("settled")) document.documentElement.classList.add("motion-settled");
  }, []);

  return null;
}
