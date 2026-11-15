"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The motion intro that opens the work section. It plays only while it is on
 * screen, the reel itself honours prefers-reduced-motion, and the viewer can
 * pause or replay it from controls that sit outside the artwork.
 */
export default function IntroReel() {
  const shell = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [paused, setPaused] = useState(false);
  const userPaused = useRef(false);

  const send = (reel: "play" | "pause" | "restart") =>
    frame.current?.contentWindow?.postMessage({ reel }, window.location.origin);

  useEffect(() => {
    const el = shell.current;
    if (!el || mounted) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setMounted(true), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  useEffect(() => {
    const el = shell.current;
    if (!el || !loaded) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const visible = e.isIntersecting && e.intersectionRatio >= 0.35;
        if (!visible) send("pause");
        else if (!userPaused.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) send("play");
      },
      { threshold: [0, 0.35] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loaded]);

  return (
    <div className="identity-intro-reel" role="region" aria-label="Motion introduction">
      <div ref={shell} className="identity-intro-frame">
        {mounted && (
          <iframe
            ref={frame}
            src="/motion/intro-reel.html?embed=1&chrome=0#paused=1"
            title="Fiza Amjad, a short motion introduction"
            loading="lazy"
            tabIndex={-1}
            onLoad={() => {
                            // Open on a frame with something on it: the typed "hello." under the
              // inspector, or the name scene when motion is reduced.
              const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              (frame.current?.contentWindow as (Window & { __seekReel?: (ms: number) => void }) | null)?.__seekReel?.(still ? 6600 : 2600);
              setLoaded(true);
            }}
            className={loaded ? "is-loaded" : ""}
          />
        )}
      </div>
      <div className="identity-intro-controls">
        <span>Intro &middot; 0:33</span>
        <button
          type="button"
          onClick={() => {
            const next = !paused;
            setPaused(next);
            userPaused.current = next;
            send(next ? "pause" : "play");
          }}
        >
          {paused ? "Play" : "Pause"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPaused(false);
            userPaused.current = false;
            send("restart");
          }}
        >
          Replay
        </button>
      </div>
    </div>
  );
}
