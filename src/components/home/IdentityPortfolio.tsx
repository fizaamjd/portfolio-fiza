"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { PROFILE, PROJECTS, EDUCATION, SKILL_GROUPS, type Project } from "@/lib/data";
import ProjectPanel from "@/components/projects/ProjectPanel";
import ProjectPoster from "@/components/projects/ProjectPoster";
import ExperienceSection from "@/components/home/ExperienceSection";
import IntroReel from "@/components/home/IntroReel";
import { whenHeroReady } from "@/lib/hero-ready";
import { isLightDevice } from "@/lib/device-tier";
import RecognitionSection from "@/components/home/RecognitionSection";
import OffTheClock from "@/components/home/OffTheClock";

const Character = dynamic(() => import("@/components/home/FizaCharacter"), { ssr: false });

/* Fifteen projects in three kinds of work, five each. */
const GROUPS: { id: string; title: string; line: string; tone: string; ids: string[] }[] = [
  { id: "ai", title: "AI products", tone: "wine",
    line: "Where models meet real users: checking where an image came from, sorting an inbox, answering questions about a codebase, reading X-rays and gauging sentiment.",
    ids: ["zerotrust", "smartinbox", "infinium", "knee", "sentiment"] },
  { id: "products", title: "Full-stack products", tone: "ink",
    line: "Whole products built end to end, from the database to the screen, including a mail server and a cache that keeps working while things break around it.",
    ids: ["versa", "staffflow", "postal", "cachenet", "oopstore"] },
  { id: "systems", title: "Systems and games", tone: "butter",
    line: "The ones closer to the hardware, and the ones made for fun: an operating system shell, a lighting controller in assembly, two Unity worlds and a console game.",
    ids: ["customos", "chromalink", "planet1", "dungeon", "pacman"] },
];
const BY_ID = new Map(PROJECTS.map((p) => [p.id, p]));
const WORK_COUNT = GROUPS.reduce((n, g) => n + g.ids.length, 0);

function Arrow() { return <svg className="identity-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10" /></svg>; }

export default function IdentityPortfolio({ onPlay }: { onPlay: () => void }) {
  // once the page is idle, quietly fetch every demo reel so it is already cached when you scroll to it
  useEffect(() => {
    // phones and in-app browsers keep cards on their stills, so there is nothing to prefetch for them
    if (isLightDevice()) return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      for (const href of new Set(PROJECTS.map((p) => p.reel).filter(Boolean) as string[])) {
        const link = document.createElement("link");
        link.rel = "prefetch"; link.href = `${href}?embed=1&chrome=0`; link.as = "document";
        document.head.appendChild(link);
      }
    };
    const start = () => { if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(run, { timeout: 6000 }); else setTimeout(run, 3000); };
    // after the character is up, so she always gets the bandwidth first
    whenHeroReady(8000).then(() => { if (!cancelled) window.setTimeout(start, 1200); });
    return () => { cancelled = true; };
  }, []);
  const [open, setOpen] = useState<Project | null>(null), [greeting, setGreeting] = useState(0), [ready, setReady] = useState<boolean | null>(null);

  return <div className="identity-site st">
    <div className="identity-content" inert={Boolean(open)}><a className="identity-skip" href="#work">Skip to all projects</a>
      <header className="st-nav"><a href="#top" className="st-logo">fiza<span>.</span></a><nav aria-label="Main navigation"><a href="#work">Work</a><a href="#experience">Experience</a><a href="#about">About</a><a href="#awards">Community</a><a className="st-nav-cta" href="#contact">Get in touch</a></nav></header>
      <main>
        <section id="top" className="st-hero" aria-labelledby="identity-title">
          <div className="st-hero-copy">
            <p className="st-hello">hi, i am</p>
            <h1 id="identity-title" className="st-name">fiza<span>.</span></h1>
            <p className="st-tag">I like <mark className="st-mark">challenging myself</mark> with problems I haven&rsquo;t solved yet, then building my way through them, from the pixel you tap to the code underneath.</p>
            <p className="st-lede">These days I&rsquo;m a full-stack engineer at Techinoid in {PROFILE.location.split(",")[0]}, working on digital signage, generative AI and transit apps.</p>
            <div className="st-actions"><a className="st-btn" href="#work"><span>See my work</span><Arrow /></a><button className="st-btn st-btn-soft" onClick={onPlay}><span>Play the game</span><Arrow /></button></div>
            <a className="st-link" href={PROFILE.resumeHref} target="_blank" rel="noreferrer">Read my résumé <Arrow /></a>
          </div>
          <div className="st-stage">
            <button className="st-character identity-character-entry" onClick={onPlay} aria-label="Play as Fiza and walk through my projects">
              <span className="st-halo" aria-hidden="true"><span className="st-halo-orbit"><i /><i /></span><span className="st-halo-orbit st-halo-orbit-2"><i /></span></span>
              {ready !== false && <Character greeting={greeting} paused={false} onReady={setReady} />}
              {ready === false && <Image src={PROFILE.photo} width={600} height={800} alt="Fiza Amjad" className="identity-fallback-photo" />}
              {/* a still of her resting pose shows instantly, then fades as the live 3D version takes over */}
              {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized still that must line up exactly with the canvas */}
              {ready !== false && <img className={`st-poster${ready ? " is-gone" : ""}`} src="/models/fiza-poster.webp?v=10" alt="" aria-hidden="true" fetchPriority="high" decoding="async" />}
              {ready === null && <span className="identity-loading st-sr" role="status">Meeting little Fiza…</span>}
            </button>
            <p className="st-stage-cap">meet mini me. tap her and wander through my projects as a little game.</p>
            <div className="st-controls"><button onClick={() => setGreeting((n) => n + 1)} disabled={ready !== true}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 4v5h-5" /></svg>twirl</button></div>
          </div>
        </section>

        <section id="work" className="st-work" aria-labelledby="identity-work-title">
          <div className="st-work-head">
            <div><h2 id="identity-work-title" className="st-h2">Things I&rsquo;ve <mark className="st-mark">made</mark></h2><p>{WORK_COUNT} projects, grouped by the kind of problem they solve. Most have a short demo you can watch, and every one has notes and the code behind it.</p></div>
            <IntroReel />
          </div>
          {GROUPS.map((g) => {
            const items = g.ids.map((id) => BY_ID.get(id)).filter((p): p is Project => Boolean(p));
            return <section key={g.id} id={`work-${g.id}`} className="st-group" aria-labelledby={`group-${g.id}`}>
              <div className="st-grid">
                <header className={`st-group-card st-${g.tone}`}>
                  <h3 id={`group-${g.id}`}>{g.title}</h3>
                  <p>{g.line}</p>
                  <ol className="st-group-list">{items.map((p) => <li key={p.id}><button onClick={() => setOpen(p)}>{p.name}<Arrow /></button></li>)}</ol>
                  <span>{items.length} projects</span>
                </header>
                {items.map((project) => <article key={project.id} className="st-card" data-project={project.id}>
                  <button className="st-card-preview" aria-label={`Open ${project.name}${project.reel ? " demo" : ""}`} onClick={() => setOpen(project)}>
                    <ProjectPoster project={project} className="aspect-video w-full" />
                    <span className="st-card-badge">{project.reel ? `Play demo · ${project.reelLength}` : "Read notes"}</span>
                  </button>
                  <div className="st-card-body"><h4><button onClick={() => setOpen(project)}>{project.name}</button></h4>
                  <p>{project.tagline}</p>
                  <div className="st-card-meta"><span>{project.stack.slice(0, 3).join(", ")} &middot; {project.window}</span>{project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noreferrer">Code <Arrow /></a>}</div></div>
                </article>)}
              </div>
            </section>;
          })}
        </section>

        <ExperienceSection onOpen={setOpen} />

        <section id="about" className="st-about" aria-labelledby="identity-about-title">
          <div className="st-about-photo"><Image src={PROFILE.photo} alt="Fiza Amjad, full-stack engineer in Lahore" width={600} height={800} sizes="(max-width:700px) 90vw, 380px" quality={90} /></div>
          <div className="st-about-story">
            <h2 id="identity-about-title" className="st-h2">A little <mark className="st-mark">about me</mark></h2>
            <p>{PROFILE.intro}</p>
            <p>I like understanding the whole system: what someone sees, the service under it, the data beneath that, and the decisions that make it reliable.</p>
            <dl><div><dt>Education</dt><dd>{EDUCATION.degree}, {EDUCATION.school} &middot; {EDUCATION.window}</dd></div></dl>
            <button className="st-link" onClick={onPlay}>Prefer to explore? Walk through my projects as a game <Arrow /></button>
          </div>
        </section>

        <section className="st-tools" aria-labelledby="identity-skills-title">
          <h2 id="identity-skills-title" className="st-h2">Tools I <mark className="st-mark">use</mark></h2><p className="st-sub">The languages and tools I use most.</p>
          <div className="st-tool-groups">{SKILL_GROUPS.map((group) => <div key={group.name}><h3>{group.name}</h3><ul>{group.items.map((i) => <li key={i}>{i}</li>)}</ul></div>)}</div>
        </section>

        <RecognitionSection />
        <OffTheClock />

        <section id="contact" className="st-contact" aria-labelledby="contact-title">
          <h2 id="contact-title">Let&rsquo;s build something <em>together</em></h2>
          <p>Whether it&rsquo;s a role, a project or just a question, I&rsquo;d love to hear from you. Email is the quickest way to reach me.</p>
          <a className="st-email" href={`mailto:${PROFILE.email}`}>{PROFILE.email}<Arrow /></a>
          <nav aria-label="Contact links"><a href={PROFILE.github} target="_blank" rel="noreferrer">GitHub <Arrow /></a><a href={PROFILE.linkedin} target="_blank" rel="noreferrer">LinkedIn <Arrow /></a><a href={PROFILE.resumeHref} target="_blank" rel="noreferrer">Résumé <Arrow /></a></nav>
        </section>
      </main>
      <footer className="st-footer"><a href="#top" className="st-logo">fiza<span>.</span></a><p>© 2026 Fiza Amjad &middot; Made with care in Lahore</p><a href="#top">Back to top</a></footer>
    </div>
    {open && <ProjectPanel project={open} onClose={() => setOpen(null)} />}
  </div>;
}
