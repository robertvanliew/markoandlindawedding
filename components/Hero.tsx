import { HeroMotion } from "./HeroMotion";

/**
 * Full-screen opening, in the invitation's wording. The date and venues line was removed at the
 * couple's request; both appear in When & Where below.
 */
export function Hero() {
  let i = 0;
  const rise = (extra = "") => ({ className: `rise ${extra}`.trim(), style: { "--i": i++ } as React.CSSProperties });

  return (
    <header className="hero" id="top">
      <HeroMotion />

      <div className="hero-inner">
        <p {...rise("eyebrow-caps hero-together")}>Together with their families</p>

        <h1 className="script hero-names">
          <span {...rise()}>Linda Todorovski</span>
          <span {...rise("amp")}>&amp;</span>
          <span {...rise()}>Marko Pupavac</span>
        </h1>

        <p {...rise("hero-lead")}>invite you to join them as they celebrate their marriage</p>

        <div {...rise("hero-actions")}>
          <a className="btn" href="#rsvp">
            RSVP
          </a>
          <a className="btn btn-ghost" href="#when-where">
            See the details
          </a>
        </div>
        <p {...rise("hero-deadline mt-4")}>Please reply by March 15th, 2027</p>
      </div>
    </header>
  );
}
