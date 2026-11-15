"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/data";
import ProjectPoster from "@/components/projects/ProjectPoster";
import ProjectReel from "@/components/projects/ProjectReel";

/**
 * Full write-up on the left, the work itself on the right, a divider between.
 *
 * The right column shows the motion reel when the project has one and its
 * artwork when it does not, so both kinds of project read as the same object.
 *
 * The deployed app is never iframed. A real product inside a panel is cramped
 * and slow, plenty of hosts refuse to be framed at all, and the half-usable
 * copy it produces is a worse advert than a button to the real thing.
 */
export default function ProjectPanel({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const hasReel = Boolean(project.reel);
  const [view, setView] = useState<"landscape" | "portrait">("portrait");
  const stackedAspect = view === "portrait" ? "0.5625" : "1.7777778";

  /* Fullscreen expands the preview box, not the reel inside it: the box is what
     the layout gave a shape to, and the reel refits itself to whatever it ends
     up in. */
  const preview = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === preview.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else preview.current?.requestFullscreen?.();
  };

  useEffect(() => {
    const previous=document.activeElement as HTMLElement|null;
    const frame=requestAnimationFrame(()=>panel.current?.querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.focus());
    const esc = (e: KeyboardEvent) => {
      if(e.key === "Escape")onClose();
      if(e.key !== "Tab")return;
      const nodes=Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex="0"]')??[]).filter(el=>el.getClientRects().length);
      const first=nodes[0],last=nodes[nodes.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    };
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", esc);
      if(previous?.isConnected)previous.focus();
      else document.querySelector<HTMLButtonElement>(".world-all")?.focus();
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      style={{ animation: "fadeIn 240ms ease both" }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={project.name}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[93svh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-card sm:max-h-[88svh] sm:rounded-3xl ${
          hasReel ? "max-w-6xl" : "max-w-5xl"
        }`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <div className="label mb-1.5 text-faint">
              {project.layer.toLowerCase()} · {project.window}
            </div>
            <h2 className="display wide truncate text-2xl sm:text-3xl">
              {project.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full border border-line p-2 text-dim transition-colors hover:border-lime hover:text-lime"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </button>
        </header>

        {/* A reel earns a wider right column than a still does. The preview is
            first in the DOM so it leads when the columns stack on a phone, and
            placed into column two so it sits on the right once they split. */}
        <div
          className={`grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:overflow-hidden ${
            hasReel
              ? (view === "portrait" ? "lg:min-h-[min(680px,72svh)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)]" : "lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]")
              : "lg:grid-cols-2"
          }`}
        >
          {/* min-h-0 and justify-center belong to the two-column layout, where
              this column is taller than its content. Stacked, they let the
              section shrink under its own content and centre the overflow
              straight over the write-up below. */}
          {/* The full canvas fits inside the viewer; transport and links stay outside it. */}
          <section className="relative flex flex-col bg-bg lg:col-start-2 lg:row-start-1 lg:min-h-0">
            <Divider />

            <div
              ref={preview}
              className="preview-frame relative flex w-full flex-col bg-bg [container-type:inline-size] lg:flex-1 lg:min-h-0"
              style={{ "--preview-aspect": stackedAspect } as React.CSSProperties}
            >
              <div className={`relative w-full shrink-0 bg-bg2 max-h-[calc(100svh-300px)] lg:max-h-none ${view === "portrait" ? "" : "lg:self-start"} ${hasReel ? "h-[calc(100cqw/var(--preview-aspect)+56px)]" : "[aspect-ratio:var(--preview-aspect)]"} lg:flex-1 lg:min-h-0 lg:h-auto lg:[aspect-ratio:auto]`}>
                {hasReel ? (
                  <ProjectReel project={project} className="h-full w-full" />
                ) : (
                  <ProjectPoster project={project} className="h-full w-full" />
                )}
              </div>

              {/* Links and orientation controls cannot obscure the artwork. */}
              <div className="relative z-10 flex shrink-0 justify-end border-t border-line p-3">
                <div className="pointer-events-auto relative flex flex-wrap items-center justify-end gap-2.5">
                  {hasReel && <div className="flex items-center gap-1" aria-label="Demo orientation">{(["landscape", "portrait"] as const).map(mode => <button key={mode} type="button" aria-pressed={view === mode} className={`label min-h-11 rounded-full border px-3 ${view === mode ? "border-lime bg-bg text-lime" : "border-line text-dim"}`} onClick={() => setView(mode)}>{mode}</button>)}</div>}
                  <span className="label rounded-full border border-line bg-bg/80 px-2.5 py-1.5 text-dim backdrop-blur-sm">
                    {hasReel ? project.reelLength : "preview"}
                  </span>
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="label rounded-full border border-line bg-bg/80 px-3 py-1.5 text-lime backdrop-blur-sm transition-colors hover:border-lime"
                    >
                      source ↗
                    </a>
                  )}
                  {project.linkedinUrl && (
                    <a href={project.linkedinUrl} target="_blank" rel="noreferrer" className="label rounded-full border border-line bg-bg/80 px-3 py-1.5 text-lime backdrop-blur-sm transition-colors hover:border-lime">Original demo ↗</a>
                  )}
                  <LiveLink project={project} />
                  {hasReel && (
                    <button
                      type="button"
                      onClick={toggleFull}
                      aria-label={full ? "Exit fullscreen" : "Expand to fullscreen"}
                      className="label flex items-center gap-1.5 rounded-full border border-line bg-bg/80 px-3 py-1.5 text-dim backdrop-blur-sm transition-colors hover:border-lime hover:text-lime"
                    >
                      <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
                        <path
                          d={full ? "M6 1v5H1M10 15v-5h5" : "M1 6V1h5M15 10v5h-5"}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                      </svg>
                      {full ? "exit" : "expand"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {!project.liveUrl && !hasReel && (
              <p className="label border-t border-line px-5 py-3 text-faint sm:px-6">
                no live link yet, add <span className="text-lime">liveUrl</span>{" "}
                in data.ts
              </p>
            )}
          </section>

          {/* At lg the write-up is taken out of flow so the preview's aspect is
              what sets the row height. Left in flow it is the taller of the two
              columns, the row grows to it, and the reel goes back to sitting in
              a letterbox with paper above and below. Stacked, it flows again. */}
          <section className="min-h-0 overflow-y-auto px-5 py-6 sm:px-7 lg:col-start-1 lg:row-start-1">
            <p className="prose-body text-base text-text">{project.tagline}</p>
            <p className="prose-body mt-3 text-sm text-dim">{project.brief}</p>

            {project.linkedinUrl && (
              <a
                href={project.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 border-b border-lime pb-1 text-sm text-lime transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime"
              >
                Watch original demo on LinkedIn
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 12 12 4M4 4h8v8" />
                </svg>
              </a>
            )}

            {project.metrics && (
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4 border-y border-line py-4">
                {project.metrics.map((m) => (
                  <div key={m.label}>
                    <dd className="tabular text-lg font-semibold leading-none text-lime">
                      {m.value}
                    </dd>
                    <dt className="label mt-1.5 text-faint">{m.label}</dt>
                  </div>
                ))}
              </dl>
            )}

            <ul className="mt-6 space-y-3">
              {project.findings.map((f, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-dim">
                  <span className="tabular shrink-0 pt-0.5 text-[0.65rem] text-lime">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <ul className="mt-7 flex flex-wrap gap-1.5">
              {project.stack.map((tech) => (
                <li
                  key={tech}
                  className="label rounded-md border border-line px-2 py-1 text-dim"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * The seam between the write-up and the work. A drawn rule rather than a fading
 * one: a hairline the full height with a measured tick at the middle, the way a
 * plate is divided on a drawing sheet. Horizontal when the columns stack.
 */
function Divider() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {/* stacked: a rule across the top of the preview */}
      <span className="absolute -top-px left-0 h-px w-full bg-line lg:hidden" />
      <span className="absolute -top-px left-1/2 h-px w-10 -translate-x-1/2 bg-lime lg:hidden" />

      {/* split: a rule down the inside edge */}
      <span className="absolute inset-y-0 -left-px hidden w-px bg-line lg:block" />
      <span className="absolute -left-px top-1/2 hidden h-10 w-px -translate-y-1/2 bg-lime lg:block" />
      {/* the tick that marks the middle of the seam */}
      <span className="absolute -left-[3px] top-1/2 hidden h-px w-[5px] -translate-y-1/2 bg-lime lg:block" />
    </span>
  );
}

/** The way into the deployed app. A button, not an iframe. */
function LiveLink({ project }: { project: Project }) {
  if (!project.liveUrl) return null;
  return (
    <a
      href={project.liveUrl}
      target="_blank"
      rel="noreferrer"
      className="group/live flex items-center gap-2.5 rounded-full border border-lime/40 bg-bg/85 py-2 pl-3.5 pr-3.5 text-lime backdrop-blur-sm transition-colors duration-200 hover:border-lime hover:bg-bg"
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
      </span>
      <span className="label">try it live</span>
      <span className="transition-transform duration-200 group-hover/live:translate-x-0.5">
        ↗
      </span>
    </a>
  );
}
