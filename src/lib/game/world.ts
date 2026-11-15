import { PROJECTS, type Project } from '@/lib/data';

/*
 * Fiza's little world: an island with a plaza in the middle and three
 * districts, one per group of work (the same groups as the homepage). Each
 * project has a pad; walking onto it opens the project.
 *
 * The camera looks from +x/+z, so "up the screen" is roughly (-0.5, -0.87)
 * on the ground. Districts sit up-left, up-right and down from the plaza.
 */
export type District = { id: string; title: string; tone: 'wine' | 'ink' | 'butter'; color: number; light: number; x: number; z: number; ids: string[] };

export const DISTRICTS: District[] = [
  { id: 'ai', title: 'AI products', tone: 'wine', color: 0x7b2233, light: 0xe9c9cf, x: -12.5, z: -3.8, ids: ['zerotrust', 'smartinbox', 'infinium', 'knee', 'sentiment'] },
  { id: 'products', title: 'Full-stack products', tone: 'ink', color: 0x17557f, light: 0xc6dbe9, x: 3.2, z: -13, ids: ['versa', 'staffflow', 'postal', 'cachenet', 'oopstore'] },
  { id: 'systems', title: 'Systems and games', tone: 'butter', color: 0xd9a92a, light: 0xf6e7b4, x: 8.2, z: 9.2, ids: ['customos', 'chromalink', 'planet1', 'dungeon', 'pacman'] },
];

/** Distance from a district's landmark to its project pads. */
export const PAD_RING = 5.6;

const BY_ID = new Map(PROJECTS.map((p) => [p.id, p]));
export const GAME_PROJECTS: Project[] = DISTRICTS.flatMap((d) => d.ids.map((id) => BY_ID.get(id)).filter((p): p is Project => Boolean(p)));

/** Pads sit on an arc around each district's landmark, opening toward the plaza. */
export const PROJECT_PLACES = GAME_PROJECTS.map((p) => {
  const d = DISTRICTS.find((x) => x.ids.includes(p.id))!;
  const k = d.ids.indexOf(p.id);
  const toPlaza = Math.atan2(-d.x, -d.z);
  const a = toPlaza + (k - 2) * 0.68; // fan of five, centred on the side facing the plaza
  const r = PAD_RING;
  return { id: p.id, district: d.id, x: d.x + Math.sin(a) * r, z: d.z + Math.cos(a) * r };
});

export const ISLAND_RADIUS = 23;
export type MoveDirection = 'up' | 'down' | 'left' | 'right';
