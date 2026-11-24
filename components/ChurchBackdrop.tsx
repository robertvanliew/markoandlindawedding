import Image from "next/image";
import churchBackdrop from "@/public/art/church-backdrop.jpg";

/**
 * The ceremony church at 1375 Blundell Rd. (CC0 photo, Wikimedia Commons), washed into the paper and
 * fixed behind the whole page, so it stays in view while the visitor scrolls.
 */
export function ChurchBackdrop() {
  return (
    <div className="church-backdrop" aria-hidden="true">
      <Image src={churchBackdrop} alt="" priority fill sizes="100vw" />
    </div>
  );
}
