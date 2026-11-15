/**
 * Tiny square-wave synth. No audio files, no network - just oscillators.
 * The AudioContext is created lazily on the first user gesture so autoplay
 * policy never blocks it.
 */

let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Blip = {
  freq: number;
  to?: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
};

function play({ freq, to, dur, type = "square", gain = 0.05 }: Blip) {
  if (muted) return;
  const audio = ac();
  if (!audio) return;

  const osc = audio.createOscillator();
  const vol = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.currentTime);
  if (to !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(to, audio.currentTime + dur);
  }
  vol.gain.setValueAtTime(gain, audio.currentTime);
  vol.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
  osc.connect(vol).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + dur + 0.02);
}

export const sfx = {
  jump: () => play({ freq: 330, to: 620, dur: 0.11 }),
  land: () => play({ freq: 180, to: 90, dur: 0.07, gain: 0.03 }),
  token: () => play({ freq: 880, to: 1320, dur: 0.1, type: "triangle", gain: 0.06 }),
  bounce: () => play({ freq: 220, to: 880, dur: 0.16, gain: 0.055 }),
  open: () => play({ freq: 520, to: 780, dur: 0.14, type: "triangle" }),
  close: () => play({ freq: 520, to: 260, dur: 0.1, type: "triangle", gain: 0.04 }),
  complete: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      window.setTimeout(() => play({ freq: f, dur: 0.16, type: "triangle" }), i * 90),
    );
  },
  respawn: () => play({ freq: 400, to: 160, dur: 0.2, gain: 0.04 }),
};

export function setMuted(value: boolean) {
  muted = value;
}
export function isMuted() {
  return muted;
}
