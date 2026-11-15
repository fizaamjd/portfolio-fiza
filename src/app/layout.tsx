import type { Metadata, Viewport } from "next";
import { Archivo, Figtree, Fraunces, Martian_Mono, Schibsted_Grotesk } from "next/font/google";
import { PROFILE } from "@/lib/data";
import "./globals.css";
import "../styles/paper-world.css";
import "../styles/identity.css";
import "../styles/studio.css";

/** Variable width axis - headlines can be set wide without faking it. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

/** Display face: a soft old-style serif. SOFT rounds the terminals, opsz lets
    the big name use the high-contrast cut and small headings the sturdy one. */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

/** The one voice of the page: a calm, friendly sans for headings and text alike. */
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  display: "swap",
});

/*
 * No `weight` here on purpose. Martian Mono is a variable font, and the docs
 * are explicit that an array of weights is for non-variable fonts only - on a
 * variable one it builds a font query the loader cannot resolve, which is the
 * "next/font/google queries have exactly one entry" build error. Omitted, the
 * whole variable range is available, so the 400 and 500 the stylesheet asks
 * for both still work.
 */
const martian = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${PROFILE.name} - ${PROFILE.role}`,
  description:
    "Full-stack engineer working across generative AI, backend services and low-level systems. A personal portfolio of full-stack engineering, AI products and systems, with interactive project demos.",
  openGraph: {
    title: `${PROFILE.name} - ${PROFILE.role}`,
    description: "From React components to kernel-mode C.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#e4ecf2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${fraunces.variable} ${figtree.variable} ${schibsted.variable} ${martian.variable}`}
    >
      <body>
        {/*
          THESIS: Fiza is the center of a single readable portfolio, with every project accessible on the page.
          OWN-WORLD: Ice-blue paper, maroon, blue ink, Archivo and Schibsted, actual Three.js sculpture geometry.
          STORY: Meet the person, browse all work, watch a demo, read the career evidence and make contact.
          FIRST VIEWPORT: Name above a centered transforming monogram, readable engineering introduction,
          pointer response and shape controls, clear project and contact anchors. The character lives in the optional game.
          FORM: User-pinned identity composition, replacing the rejected paper-world direction, seed 253aeac9.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review,
          the verdict, DESIGN.md, and every shipping raster carrying its provenance.
        */}
        {children}
      </body>
    </html>
  );
}
