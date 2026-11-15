import type { Metadata, Viewport } from "next";
import { Figtree, Martian_Mono } from "next/font/google";
import { PROFILE } from "@/lib/data";
import "./globals.css";
import "../styles/paper-world.css";
import "../styles/identity.css";
import "../styles/studio.css";

/** The one voice of the page: a calm, friendly sans for headings and text alike. */
const figtree = Figtree({
  variable: "--font-figtree",
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
      className={`${figtree.variable} ${martian.variable}`}
    >
      <body>
        {/* start fetching the 3D character right away, in parallel with the page's JavaScript */}
        <link rel="preload" href="/models/fiza-preview.glb?v=8" as="fetch" type="model/gltf-binary" crossOrigin="anonymous" />
        {children}
      </body>
    </html>
  );
}
