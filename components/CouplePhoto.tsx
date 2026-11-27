import Image from "next/image";
// Cropped from the couple's photo by hand (original kept outside the repo in "Image  for space").
import couple from "@/public/photos/linda-marko.jpg";

/** The couple's photo between the opening and When & Where, its edges fading into the paper. */
export function CouplePhoto() {
  return (
    <figure className="couple-photo">
      <Image src={couple} alt="Linda and Marko dancing on a stone terrace above the sea" placeholder="blur" sizes="(max-width: 560px) 88vw, 460px" />
    </figure>
  );
}
