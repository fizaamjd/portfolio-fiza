"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/data";

/* Where a card's thumbnail opens, in reel milliseconds. Most reels begin on a
   quiet ident that reads as an empty card at thumbnail size, so the grid opens
   each one on a frame that shows the work. The full player still starts at 0. */
const THUMB_START: Record<string, number> = {
  zerotrust: 15500,
  smartinbox: 16000,
  infinium: 15000,
  knee: 2600,
  sentiment: 9000,
  cachenet: 7000,
  postal: 15000,
  staffflow: 19500,
  planet1: 4400,
  dungeon: 2800,
  oopstore: 3000,
  pacman: 3400,
};

/** Full-stage motion previews, with accessible transport outside the artwork. */
export default function ProjectReel({
  project,
  variant = "player",
  className = "",
}: {
  project: Project;
  variant?: "player" | "thumb";
  className?: string;
}) {
  const thumb = variant === "thumb";
  const shell = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const userPaused = useRef(false);
  const [scale, setScale] = useState(0);
  const [playback, setPlayback] = useState({ time: 0, total: 1, playing: false });
  type DemoWindow = Window & {
    __reelInfo?: { total: number };
    __reelState?: () => { time: number; playing: boolean };
    __seekReel?: (time: number) => void;
    __setReelPlaying?: (playing: boolean) => void;
    __restartReel?: () => void;
    __setReelRate?: (rate: number) => void;
  };

  /* A thumbnail is a whole reel's worth of bytes for a card that may never be
     scrolled to, so it waits until it is nearly in view. The player sits in a
     dossier the viewer deliberately opened, so it loads at once. */
  const [mounted, setMounted] = useState(!thumb);
  const [loaded, setLoaded] = useState(false);

  /* True only while the reel is paused because we hid it, never because the
     viewer pressed pause or because reduced motion stopped it at the door.
     Resuming anything we did not stop would override both. */
  const ours = useRef(false);
  const inViewport = useRef(false);

  const send = useCallback((reel: "play" | "pause" | "restart") => {
    frame.current?.contentWindow?.postMessage({ reel }, window.location.origin);
  }, []);

  const setVisible = useCallback(
    (visible: boolean) => {
      if (!visible) {
        ours.current = true;
        send("pause");
      } else if (ours.current && !userPaused.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        ours.current = false;
        send("play");
      }
    },
    [send],
  );

  // Prepare nearby thumbnails, but animate only previews actually in view.
  useEffect(() => {
    const el = shell.current;
    if (!el || mounted) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin: "200px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

  useEffect(() => {
    const el = shell.current;
    if (!el || !loaded) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewport.current = entry.isIntersecting && entry.intersectionRatio >= 0.1;
        setVisible(inViewport.current && document.visibilityState === "visible");
      },
      { threshold: [0, 0.1] },
    );
    observer.observe(el);
    const onVisibility = () =>
      setVisible(inViewport.current && document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loaded, setVisible]);

  // Supply the slot shape to the responsive scene director. No cover crop or fitted-square gutters.
  const canvasWidth = 1200;
  const [canvasHeight, setCanvasHeight] = useState(canvasWidth / (project.reelAspect ?? 16 / 9));
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => {
      if (!el.clientWidth || !el.clientHeight) return;
      setCanvasHeight(canvasWidth * el.clientHeight / el.clientWidth);
      setScale(el.clientWidth / canvasWidth);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (thumb || !loaded) return;
    const sync = () => {
      const win = frame.current?.contentWindow as DemoWindow | null;
      const doc = win?.document;
      const seek = doc?.getElementById("seek") as HTMLInputElement | null;
      const play = doc?.getElementById("play");
      const state = win?.__reelState?.() ?? (seek ? { time: Number(seek.value), playing: play?.textContent?.trim() === "Pause" } : undefined);
      if (state) setPlayback({ ...state, total: win?.__reelInfo?.total ?? Number(seek?.max ?? 1) });
    };
    sync();
    const timer = window.setInterval(sync, 150);
    return () => window.clearInterval(timer);
  }, [loaded, thumb]);
  const timeLabel = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;

  return (
    <div
      ref={shell}
      className={`group/reel relative overflow-hidden ${
        "bg-bg2"
      } ${className}`}
    >
      <div ref={stage} className={`absolute inset-x-0 top-0 ${thumb ? "bottom-0" : "bottom-14"}`}>
      {/* The reel reads prefers-reduced-motion itself and opens on its first
          frame when it is set, so there is nothing to pass in for that here -
          and nothing computed from `window` during render to go wrong between
          the server pass and hydration. */}
      {mounted && (
        <iframe
          ref={frame}
          src={`${project.reel}?embed=1&chrome=0`}
          title={`${project.name} motion demo`}
          onLoad={() => {
            // Start the thumbnail on useful product content, keeping the full player at its original opening.
            const start = thumb ? THUMB_START[project.id] : undefined;
            if(start !== undefined){
              const win=frame.current?.contentWindow as DemoWindow|null;
              win?.__seekReel?.(start);
              ours.current=true;
            }
            setLoaded(true);
          }}
          tabIndex={thumb ? -1 : undefined}
          aria-hidden={thumb || undefined}
          style={{ width: canvasWidth, height: canvasHeight, left: "50%", top: "50%", transform: `translate(-50%, -50%) scale(${scale})` }}
          className={`absolute border-0 transition-opacity duration-300 motion-reduce:transition-none ${thumb ? "pointer-events-none" : ""} ${loaded && scale ? "opacity-100" : "opacity-0"}`}

        />
      )}

      </div>
      {!thumb && !loaded && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg2">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-lime" />
          <span className="label text-faint">loading demo…</span>
        </div>
      )}

      {!thumb && (
        <div className="absolute inset-x-0 bottom-0 flex h-14 items-center gap-2 border-t border-line bg-bg px-2 text-xs text-text sm:gap-3 sm:px-4" aria-label="Demo playback">
          <button type="button" className="min-h-11 min-w-11 px-2 focus-visible:outline-2 focus-visible:outline-lime" aria-label={playback.playing ? "Pause demo" : "Play demo"} onClick={() => {
            userPaused.current = playback.playing;
            const win = frame.current?.contentWindow as DemoWindow | null;
            if (playback.time >= playback.total - 1) win?.__restartReel?.();
            else win?.__setReelPlaying?.(!playback.playing);
          }}>{playback.playing ? "Pause" : "Play"}</button>
          <button type="button" className="min-h-11 px-2 focus-visible:outline-2 focus-visible:outline-lime" onClick={() => { userPaused.current = false; (frame.current?.contentWindow as DemoWindow | null)?.__restartReel?.(); }}>Restart</button>
          <input type="range" aria-label="Seek demo" min={0} max={playback.total} step={100} value={Math.min(playback.time, playback.total)} className="h-11 min-w-0 flex-1 accent-lime" onChange={(event) => {
            userPaused.current = true;
            const win = frame.current?.contentWindow as DemoWindow | null;
            if (win?.__seekReel) win.__seekReel(Number(event.target.value));
            else {
              const seek = win?.document.getElementById("seek") as HTMLInputElement | null;
              if (seek) { seek.value = event.target.value; seek.dispatchEvent(new Event("input", { bubbles: true })); send("pause"); }
            }
          }} />
          <select aria-label="Demo playback speed" defaultValue="1" className="min-h-11 max-w-16 bg-bg text-text" onChange={e => (frame.current?.contentWindow as DemoWindow | null)?.__setReelRate?.(Number(e.target.value))}><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select>
          <span className="shrink-0 tabular-nums">{timeLabel(playback.time)} / {timeLabel(playback.total)}</span>
        </div>
      )}
    </div>
  );
}
