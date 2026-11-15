import { AWARDS, CERTIFICATES, COMMUNITY } from "@/lib/data";

/* Awards as two bold coloured medals, community roles on a short timeline,
   certificates as a tidy ledger. All drawn, no photographs. */
type Glyph = "trophy" | "ribbon" | "code" | "handshake";

function Icon({ kind }: { kind: Glyph }) {
  const paths: Record<Glyph, React.ReactNode> = {
    trophy: <><path d="M16 10h32v14a16 16 0 0 1-32 0Z" /><path d="M16 14H8v4a10 10 0 0 0 9 10M48 14h8v4a10 10 0 0 1-9 10" /><path d="M32 40v8M22 56h20l-2-8H24Z" /><path className="fill" d="m32 15 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z" /></>,
    ribbon: <><circle cx="32" cy="26" r="17" /><circle cx="32" cy="26" r="11" /><path d="M23 40 18 58l8-4 5 7 3-17M41 40l5 18-8-4-5 7-3-17" /><path className="fill" d="m32 19 2 4.2 4.6.6-3.3 3.2.8 4.6L32 29.4l-4.1 2.2.8-4.6-3.3-3.2 4.6-.6Z" /></>,
    code: <><rect x="8" y="12" width="48" height="36" rx="6" /><path d="m26 24-7 6 7 6M38 24l7 6-7 6M34 21l-4 18" /><path d="M24 56h16M32 48v8" /></>,
    handshake: <><path d="M6 26 18 16l10 4 8-4 10 4 12 6" /><path d="m18 34 8 8a3 3 0 0 0 4-4M24 30l10 10a3 3 0 0 0 4-4L28 26M30 26l10 10a3 3 0 0 0 4-4l-8-8" /><path d="M6 26l10 14M58 26 46 40" /></>,
  };
  return <svg viewBox="0 0 64 64" aria-hidden="true" className="st-glyph">{paths[kind]}</svg>;
}

const initials = (s: string) => s.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const ROLES = COMMUNITY.filter((c) => !c.placeholder);

export default function RecognitionSection() {
  return <section id="awards" className="st-recognition" aria-labelledby="awards-title">
    <h2 id="awards-title" className="st-h2">Awards &amp; <mark className="st-mark">community</mark></h2>
    <p className="st-sub">The moments the work got noticed, the communities I helped run, and the courses I finished along the way.</p>

    <div className="st-medals">
      {AWARDS.map((a, k) => <article key={a.title} className={`st-medal tone-${k % 2 ? "ink" : "wine"}`}>
        <span className="st-medal-year">{a.year}</span>
        <span className="st-medal-icon"><Icon kind={k % 2 ? "ribbon" : "trophy"} /></span>
        <p className="st-medal-from">{a.from}</p>
        <h3>{a.title}</h3>
        {a.note && <p className="st-medal-note">{a.note}</p>}
      </article>)}
    </div>

    <div className="st-rec-split">
      <div>
        <h3 className="st-rec-title">Community &amp; leadership</h3>
        <ol className="st-timeline">
          {ROLES.map((c) => <li key={c.org + c.role}>
            <span className="st-timeline-icon"><Icon kind={/google|developer|gdg/i.test(c.org) ? "code" : "handshake"} /></span>
            <div><p className="st-timeline-when">{c.window}</p><h4>{c.role}</h4><p className="st-timeline-org">{c.org}</p><p className="st-timeline-note">{c.note}</p></div>
          </li>)}
        </ol>
      </div>
      <div>
        <h3 className="st-rec-title">Certificates</h3>
        <ul className="st-ledger">
          {CERTIFICATES.map((c, k) => <li key={c.title}>
            <span className={`st-ledger-badge tone-${["wine", "ink", "butter"][k % 3]}`} aria-hidden="true">{initials(c.from)}</span>
            <div><p className="st-ledger-name">{c.title}</p><p className="st-ledger-from">{c.from}</p></div>
            <span className="st-ledger-year">{c.year}</span>
          </li>)}
        </ul>
      </div>
    </div>
  </section>;
}
