"use client";

import { useEffect, useRef, useState } from "react";
import { CONTRIB_ACCOUNT, CONTRIB_DAILY, CONTRIB_START } from "@/lib/company-contributions";

/*
 * The company GitHub account as one continuous run: every day from the first
 * contribution to the last day read, drawn as week columns the way GitHub
 * draws them, with a monthly bar strip and three plain facts above. Everything
 * is computed from CONTRIB_DAILY; nothing is estimated.
 */
const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const start = Date.parse(`${CONTRIB_START}T00:00:00Z`);
const date = (i: number) => new Date(start + i * DAY);
const fmt = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

function summarise() {
  const origin = CONTRIB_DAILY.findIndex((n) => n > 0);
  const days = CONTRIB_DAILY.slice(origin);
  const total = days.reduce((a, b) => a + b, 0);
  const active = days.filter((n) => n > 0).length;
  let streak = 0, best = 0;
  for (const n of days) { streak = n > 0 ? streak + 1 : 0; best = Math.max(best, streak); }
  const peak = Math.max(...days);
  const peakDay = date(origin + days.indexOf(peak));
  const sorted = days.filter((n) => n > 0).sort((a, b) => a - b);
  const q = (p: number) => sorted[Math.floor((sorted.length - 1) * p)];
  const cut = [q(0.25), q(0.5), q(0.75)];
  const level = (n: number) => (n === 0 ? 0 : n <= cut[0] ? 1 : n <= cut[1] ? 2 : n <= cut[2] ? 3 : 4);
  const firstDate = date(origin);
  const lead = firstDate.getUTCDay();
  const cells: { i: number; n: number }[] = [];
  for (let k = -lead; k < days.length; k++) cells.push({ i: origin + k, n: k < 0 ? -1 : days[k] });
  const weeks: { i: number; n: number }[][] = [];
  for (let w = 0; w < cells.length; w += 7) weeks.push(cells.slice(w, w + 7));
  const months = new Map<string, number>();
  days.forEach((n, k) => { const d = date(origin + k); const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`; months.set(key, (months.get(key) ?? 0) + n); });
  const monthList = [...months.entries()].map(([key, n]) => { const [y, m] = key.split("-").map(Number); return { y, m, n }; });
  return { total, active, best, peak, peakDay, firstDate, lastDate: date(origin + days.length - 1), level, weeks, monthList };
}
const S = summarise();

export default function ContributionArchive() {
  const root = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setOn(true);
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const t0 = performance.now() - (still ? 1e6 : 0);
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / 1800);
        setCount(Math.round(S.total * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const maxMonth = Math.max(...S.monthList.map((m) => m.n));
  const C = 12, G = 3;
  const W = S.weeks.length * (C + G);
  const H = 7 * (C + G);

  return (
    <section ref={root} aria-label="Company GitHub contributions" className={`st-contrib${on ? " is-on" : ""}`}>
      <div className="st-contrib-head">
        <h3><span className="tabular">{count.toLocaleString("en-US")}</span> contributions on the company account since {MONTHS[S.firstDate.getUTCMonth()]} {S.firstDate.getUTCFullYear()}.</h3>
        <a href={CONTRIB_ACCOUNT} target="_blank" rel="noreferrer">@fizaamjadtechinoid ↗</a>
      </div>
      <dl className="st-contrib-facts">
        <div><dt>Active days</dt><dd className="tabular">{S.active}</dd></div>
        <div><dt>Longest streak</dt><dd className="tabular">{S.best} days</dd></div>
        <div><dt>Busiest day</dt><dd>{S.peak} on {fmt(S.peakDay)}</dd></div>
      </dl>

      <div className="st-contrib-months" aria-hidden="true">
        {S.monthList.map((m, k) => (
          <div key={`${m.y}-${m.m}`} style={{ ["--h" as string]: `${Math.max(4, (m.n / maxMonth) * 100)}%`, ["--k" as string]: k }}>
            <i />
            <span>{MONTHS[m.m]}{m.m === 0 || k === 0 ? ` ’${String(m.y).slice(2)}` : ""}</span>
          </div>
        ))}
      </div>

      <div className="st-contrib-grid" role="region" aria-label="Daily contribution grid, horizontally scrollable" tabIndex={0}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: Math.max(640, W) }} role="img"
          aria-label={`${S.total} contributions from ${fmt(S.firstDate)} to ${fmt(S.lastDate)}, on ${S.active} active days.`}>
          {S.weeks.map((wk, c) => wk.map((cell, r) => cell.n < 0 ? null : (
            <rect key={`${c}-${r}`} x={c * (C + G)} y={r * (C + G)} width={C} height={C} rx={3}
              className={`lv${S.level(cell.n)}`} style={{ transitionDelay: `${c * 14}ms` }}>
              <title>{`${cell.n} on ${fmt(date(cell.i))}`}</title>
            </rect>
          )))}
        </svg>
      </div>
      <div className="st-contrib-foot">
        <span>{fmt(S.firstDate)} to {fmt(S.lastDate)}</span>
        <span className="st-contrib-key">Less {[0, 1, 2, 3, 4].map((l) => <i key={l} className={`lv${l}`} />)} More</span>
      </div>
    </section>
  );
}
