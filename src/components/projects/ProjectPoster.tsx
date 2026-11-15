"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Project } from "@/lib/data";
import ProjectReel from "@/components/projects/ProjectReel";

/** Stable hash so a project's generated art never changes between loads. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * A project's visual. Uses the screenshot when there is one; otherwise draws
 * generated art seeded from the project id - so the grid looks designed today
 * and simply gets better as real images land in public/projects/.
 *
 * Flat geometry only - dots, rules and a grid. A dozen of these sit on screen
 * at once, and plain shapes composite far more cheaply than blur ever did.
 */
export default function ProjectPoster({
  project,
  className = "",
  priority = false,
}: {
  project: Project;
  className?: string;
  priority?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(project.image) && !broken;

  const art = useMemo(() => {
    const h = hash(project.id);
    const rand = (() => {
      let x = h;
      return () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
    })();

    // Where the field is densest. Kept off-centre so the plate has a subject.
    const COLS = 34;
    const ROWS = 22;
    const fx = 3 + (h % 9);
    const fy = 2 + ((h >> 4) % 8);
    const reach = 15 + ((h >> 8) % 8);

    const dots: { x: number; y: number; r: number }[] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const d = Math.hypot(col - fx, row - fy) / reach;
        if (d >= 1) continue;
        // Quantised, so it reads as a printed screen rather than a ramp.
        const step = Math.round((1 - d) * 6) / 6;
        const r = step * 1.9;
        if (r > 0.08) {
          dots.push({
            x: (col + 0.5) * (160 / COLS),
            y: (row + 0.5) * (100 / ROWS),
            r: r * (0.88 + rand() * 0.24),
          });
        }
      }
    }

    return { dots, rot: (h >> 13) % 40, warm: ((h >> 3) & 1) === 1 };
  }, [project.id]);

  if (showImage) {
    return (
      <div className={`relative overflow-hidden bg-bg2 ${className}`}>
        <Image
          src={project.image!}
          alt={`${project.name} screenshot`}
          fill
          sizes="(max-width: 768px) 100vw, 640px"
          priority={priority}
          onError={() => setBroken(true)}
          className="object-cover"
        />
        <ReelLayer project={project} />
      </div>
    );
  }

  const initial = project.name.replace(/[^A-Za-z]/g, "").slice(0, 2) || "··";
  const gid = `p-${project.id}`;

  /* The poster is printed, not lit: a halftone field whose dots shrink toward
     the edges, a measured rule, and the project's initial set in the display
     face at a width the headline type never goes to. Nothing fades. The seed
     decides where the field is densest and how the rule is struck, so every
     project gets a different plate and the same plate every time. */
  return (
    <div className={`relative overflow-hidden bg-bg2 ${className}`} aria-hidden>
      <svg
        viewBox="0 0 160 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <pattern
            id={`${gid}-grid`}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M8 0H0V8"
              fill="none"
              stroke="var(--line)"
              strokeWidth="0.35"
            />
          </pattern>
        </defs>

        <rect width="160" height="100" fill="var(--bg2)" />
        <rect width="160" height="100" fill={`url(#${gid}-grid)`} opacity="0.5" />

        {/* the halftone plate */}
        {/* On paper this ink reads far heavier than it did on near-black, and
            the maroon is the page's one hot colour - it does not belong in a
            background plate. Blue, and quiet. */}
        <g fill="var(--coral)" opacity={art.warm ? 0.2 : 0.26}>
          {art.dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} />
          ))}
        </g>

        {/* struck rules, angled off the seed */}
        <g transform={`rotate(${art.rot - 20} 130 84)`}>
          <rect x="96" y="80" width="70" height="1.2" fill="var(--coral)" opacity="0.35" />
          <rect x="96" y="85" width="46" height="1.2" fill="var(--lime)" opacity="0.3" />
        </g>
      </svg>

      {/* An index card rather than a cropped letter: the stack as a typed
          label, the name set large in the display face, and the monogram as a
          stamped mark in the corner. Reads as finished at any size. */}
      <div className="absolute inset-[6%] flex flex-col justify-between border border-line/80 bg-card/75 p-[5%]">
        <div className="flex items-start justify-between gap-4">
          <span className="text-[12px] leading-relaxed text-dim sm:text-[13px]">
            {project.stack.slice(0, 3).join(" / ")}
          </span>
          <span
            className="display grid h-10 w-10 shrink-0 place-items-center rounded-full border border-lime/60 text-sm lowercase text-lime sm:h-12 sm:w-12 sm:text-base"
            style={{ fontVariationSettings: '"wdth" 112' }}
          >
            {initial.toLowerCase()}
          </span>
        </div>
        <div>
          <span className="display block max-w-[16ch] text-[clamp(24px,4.4vw,40px)] font-semibold leading-[1.02] tracking-[-0.03em] text-text">
            {project.name}
          </span>
          <span className="mt-3 block text-[12px] text-lime sm:text-[13px]">
            No demo for this one. Notes and source inside.
          </span>
        </div>
      </div>

      <ReelLayer project={project} />
    </div>
  );
}

/**
 * When a project has a motion reel, the reel is its thumbnail - chrome-less and
 * silent, a poster that happens to move. It sits on top of the screenshot or
 * the generated art rather than replacing it, so the card is never blank while
 * the reel loads and still looks finished if it never does.
 */
function ReelLayer({ project }: { project: Project }) {
  if (!project.reel) return null;
  return (
    <ProjectReel
      project={project}
      variant="thumb"
      className="absolute inset-0 h-full w-full"
    />
  );
}
