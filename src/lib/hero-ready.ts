/*
 * A tiny shared signal: "the hero character is on screen". Demo thumbnails and
 * the background reel prefetch wait for it, so on a first visit the character
 * gets the bandwidth first. Nothing waits longer than `maxWait`, in case the
 * character is slow or cannot load at all.
 */
let ready = false;
const waiters = new Set<() => void>();

export function markHeroReady() {
  if (ready) return;
  ready = true;
  for (const resolve of waiters) resolve();
  waiters.clear();
}

export function whenHeroReady(maxWait = 4000): Promise<void> {
  if (ready || typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => { window.clearTimeout(timer); waiters.delete(done); resolve(); };
    const timer = window.setTimeout(done, Math.max(0, maxWait - performance.now()));
    waiters.add(done);
  });
}
