import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost, Pinyon_Script } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-jost",
  display: "swap",
});

const pinyon = Pinyon_Script({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-pinyon",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Linda & Marko · May 15th, 2027",
  description: "Together with their families, Linda Todorovski & Marko Pupavac invite you to celebrate their marriage on Saturday, May 15th, 2027.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  openGraph: {
    title: "Linda & Marko",
    description: "Saturday, May 15th, 2027 · Please RSVP by March 15th, 2027",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fdfbf8",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable} ${pinyon.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
