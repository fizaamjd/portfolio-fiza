"use client";

import { useState } from "react";
import Image from "next/image";
import { CAREER, PROJECTS, type Project } from "@/lib/data";
import ContributionArchive from "@/components/home/ContributionArchive";

export default function ExperienceSection({ onOpen }: { onOpen: (project: Project) => void }) {
  const [selected, setSelected] = useState(0);
  const [readAll, setReadAll] = useState(false);
  return <section id="experience" aria-labelledby="experience-title" className="career-section career-journal">
    <div className="career-title"><h2 id="experience-title">Experience</h2></div>
    <div className="career-journal-layout">
      <aside className="career-chapters" aria-label="Choose an experience chapter">
        <p className="career-chapter-instruction">Explore a chapter</p>
        {CAREER.map((post, index) => <button key={post.org} className="career-chapter" aria-pressed={!readAll && selected === index} aria-controls={`career-chapter-${index}`} onClick={() => { setSelected(index); setReadAll(false); }}><span className="career-chapter-date">{post.window}</span><span className="career-chapter-name">{post.org}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span><span>{post.title}</span></button>)}
        <button className="career-read-all" aria-pressed={readAll} onClick={() => setReadAll(value => !value)}>{readAll ? 'Back to chapter view' : 'Read the complete story'}<span aria-hidden="true">{readAll ? '−' : '+'}</span></button>
        <p className="career-chapter-footnote">Different teams.<br/>The same instinct to build.</p>
      </aside>
      <div className="career-pages">
        {CAREER.map((post, index) => {
          const photos = post.photos?.filter(photo => !photo.wide) ?? [];
          return <article id={`career-chapter-${index}`} hidden={!readAll && selected !== index} className="career-page" key={post.org} aria-labelledby={`career-name-${index}`}>
            <header className="career-page-header"><div><h3 id={`career-name-${index}`}>{post.org}</h3><p className="career-position">{post.title}</p></div><p className="career-page-location">{post.location}<br/><span className="career-window">{post.window}</span></p></header>
            <p className="career-page-summary">{post.summary}</p>
            {post.shipped && <div className="career-projects"><h4>Shipped here</h4>{post.shipped.map(id => { const project = PROJECTS.find(item => item.id === id); return project ? <button key={id} onClick={() => onOpen(project)}>{project.name}<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg></button> : null; })}</div>}
            <details className="career-details" open={readAll || undefined}><summary><span className="career-details-label"><strong>The work behind it</strong><small>{post.notes.length} things I built and owned here</small></span><span className="career-details-toggle" aria-hidden="true">+</span></summary><ol>{post.notes.map(note => <li key={note}>{note}</li>)}</ol></details>
            <div className="career-page-tools"><h4>In the toolkit</h4><p>{post.stack.join(' · ')}</p></div>
            {photos.length > 0 && <div className="career-gallery"><h4>A few moments along the way</h4><div>{photos.map(photo => <figure key={photo.src}><a href={photo.src} target="_blank" rel="noreferrer" aria-label={`Open photograph: ${photo.caption ?? post.org}`}><Image src={photo.src} alt={photo.caption ?? post.org} width={520} height={390} sizes="(max-width: 600px) 75vw, 260px" quality={90}/></a><figcaption>{photo.caption}</figcaption></figure>)}</div></div>}
          </article>;
        })}
      </div>
    </div>
    <div className="career-journal-activity"><ContributionArchive/></div>
  </section>;
}
