"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { OFF_THE_CLOCK, type Artwork } from "@/lib/data";

/* A tight gallery wall: pieces at their own uneven heights and never cropped.
   Each piece goes into the shortest column, then the columns get slightly
   different widths, worked out so that at their natural shapes they all end
   at exactly the same height: no cropping and no empty space at the bottom.
   Filter by medium, dim the room, and open any piece large. */
const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "painting", label: "Paintings" },
  { id: "photo", label: "Photography" },
  { id: "exhibition", label: "Exhibitions" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];
const KIND: Record<Artwork["kind"], string> = { painting: "Painting", photo: "Photograph", exhibition: "Exhibition" };

export default function OffTheClock() {
  const [filter, setFilter] = useState<Filter>("all");
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState<Artwork | null>(null);
  const [cols, setCols] = useState(5);
  const [wallW, setWallW] = useState(0);
  const wall = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fit = () => setCols(window.innerWidth < 620 ? 2 : window.innerWidth < 1000 ? 3 : 5);
    fit(); window.addEventListener("resize", fit);
    const el = wall.current; const ro = el ? new ResizeObserver(() => setWallW(el.clientWidth)) : null; if (el && ro) ro.observe(el);
    return () => { window.removeEventListener("resize", fit); ro?.disconnect(); };
  }, []);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = dialog.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  if (OFF_THE_CLOCK.length === 0) return null;

  const shown = OFF_THE_CLOCK.filter((a) => filter === "all" || a.kind === filter);
  const n = Math.max(1, Math.min(cols, shown.length));
  const columns: { art: Artwork; h: number }[][] = Array.from({ length: n }, () => []);
  const heights = new Array(n).fill(0);
  for (const art of shown) { const h = (art.h ?? 5) / (art.w ?? 4); const k = heights.indexOf(Math.min(...heights)); columns[k].push({ art, h }); heights[k] += h; }
  // column k at width w is w * heights[k] + GAP * (items - 1) tall; pick widths so every column is height H
  const GAP = cols === 2 ? 8 : 10, W = wallW || 1200;
  const H = (W - GAP * (n - 1) + columns.reduce((a, c, k) => a + (GAP * (c.length - 1)) / heights[k], 0)) / heights.reduce((a, h) => a + 1 / h, 0);
  const widths = columns.map((c, k) => Math.max(40, (H - GAP * (c.length - 1)) / heights[k]));
  const count = (id: Filter) => (id === "all" ? OFF_THE_CLOCK.length : OFF_THE_CLOCK.filter((a) => a.kind === id).length);

  return <section id="off-the-clock" className="st-art" aria-labelledby="art-title">
    <div className="st-art-head">
      <div>
        <h2 id="art-title" className="st-h2">Off the <mark className="st-mark">clock</mark></h2>
        <p className="st-sub">When I&rsquo;m not at a keyboard I paint, take photographs, and sometimes get to hang them on a real wall.</p>
      </div>
    </div>

    <div className={`st-gallery${dark ? " is-dark" : ""}`}>
      <div className="st-gallery-bar">
        <div className="st-art-filters" role="group" aria-label="Show">
          {FILTERS.filter((f) => count(f.id) > 0).map((f) => <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}<span>{count(f.id)}</span></button>)}
        </div>
        <button className="st-lights" aria-pressed={dark} onClick={() => setDark((v) => !v)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3Z" /></svg>
          {dark ? "Lights on" : "Lights off"}
        </button>
      </div>

      <div className="st-wall" ref={wall}>
        {columns.map((col, k) => <ul key={k} className="st-wall-col" style={{ flex: `0 0 ${widths[k]}px` }}>
          {col.map(({ art: a, h }) => <li key={a.src} className="st-piece">
            <button className="st-frame" onClick={() => setOpen(a)} aria-label={`View ${a.title} larger`} style={{ aspectRatio: `1 / ${h.toFixed(4)}` }}>
              <Image src={a.src} alt={a.title} fill sizes="(max-width: 620px) 50vw, (max-width: 1000px) 33vw, 260px" quality={75} />
              <span className="st-label"><strong>{a.title}</strong><small>{KIND[a.kind]}{a.note ? ` · ${a.note}` : ""}</small></span>
            </button>
          </li>)}
        </ul>)}
      </div>
    </div>

    <dialog ref={dialog} className="st-art-dialog" onClose={() => setOpen(null)} onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
      {open && <figure>
        <Image src={open.src} alt={open.title} width={1800} height={1800} sizes="92vw" quality={90} style={{ width: "auto", height: "auto", maxWidth: "90vw", maxHeight: "80vh" }} />
        <figcaption><span>{open.title}</span><small>{KIND[open.kind]}{open.note ? ` · ${open.note}` : ""}</small></figcaption>
        <button className="st-art-close" onClick={() => setOpen(null)} aria-label="Close">×</button>
      </figure>}
    </dialog>
  </section>;
}
