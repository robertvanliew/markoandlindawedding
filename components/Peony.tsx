import Image from "next/image";
// Photo-real white peony sprays generated in Higgsfield and cut out by scripts/cutout-peonies.mjs.
import peonyTopLeft from "@/public/art/peony-top-left.png";
import peonyBottomRight from "@/public/art/peony-bottom-right.png";
import garlandBottom from "@/public/art/garland-bottom.png";

/**
 * The peonies frame the screen itself: a garland rising from the bottom edge, sprays in the top-left and bottom-right corners, all fixed while the page scrolls beneath, so their cropped edges always meet the screen's edges. They bloom in on
 * load and sway slowly.
 */
export function FlowerFrame() {
  return (
    <div className="flower-frame" aria-hidden="true">
      <div className="garland garland--bottom">
        <div className="peony-sway">
          <Image src={garlandBottom} alt="" priority sizes="(max-width: 560px) 112vw, 82vw" />
        </div>
      </div>
      <div className="peony peony--tl">
        <div className="peony-sway">
          <Image src={peonyTopLeft} alt="" priority sizes="(max-width: 560px) 50vw, 32vw" />
        </div>
      </div>
      <div className="peony peony--bl">
        <div className="peony-sway">
          <Image src={peonyBottomRight} alt="" priority sizes="(max-width: 560px) 40vw, 28vw" />
        </div>
      </div>
      <div className="peony peony--br">
        <div className="peony-sway">
          <Image src={peonyBottomRight} alt="" priority sizes="(max-width: 560px) 62vw, 36vw" />
        </div>
      </div>
    </div>
  );
}
