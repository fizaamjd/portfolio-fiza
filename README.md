# fiza. · portfolio

The personal portfolio of **Fiza Amjad**, full-stack engineer in Lahore.
It's a one-page site with a small 3D version of me in the hero, fifteen projects with motion demos, and a little game world where walking onto a project opens it.

**Live:** [fizaamjad.vercel.app](https://fizaamjad.vercel.app) · **Contact:** fizaamjad444@gmail.com · [LinkedIn](https://www.linkedin.com/in/fiza-amjad-a74891271/) · [GitHub](https://github.com/fizaamjd)

---

## What's inside

- **Mini me in 3D.** A rigged character rendered with Three.js. She breathes, blinks, turns toward your cursor and twirls on request, with a soft glow tracing her silhouette.
- **Work.** Fifteen projects in three groups (AI products, full-stack products, systems and games). Each card opens a panel with notes, the stack, a link to the code and, for most, a short motion reel built as a standalone HTML animation.
- **Experience.** Chapters for each role, with "the work behind it" broken into numbered notes and a contribution graph from my company GitHub account.
- **Awards & community.** Awards, community and leadership roles, and certificates, all drawn as graphics with no stock photos.
- **Off the clock.** A gallery of my paintings, photographs and exhibitions, with filters and a lights-off mode.
- **The game** (`/#play`). An isometric paper island with three districts. Walk with WASD, the arrow keys or a click, find your way around trees and signs, and step onto a glowing pad to open a project. It has a minimap, a bird's-eye map view and confetti.

## Tech

| | |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript |
| 3D | [Three.js](https://threejs.org): skinned GLTF character (meshopt + WebP, streamed in two steps), custom shaders for the blink and the silhouette glow |
| Styling | Tailwind CSS 4 plus hand-written CSS in `src/styles` |
| Motion reels | Self-contained HTML/CSS/JS files in `public/motion`, embedded in iframes |
| Hosting | Vercel |

## Project structure

```
src/
├── app/                    # Next.js entry: layout, page, global styles
├── components/
│   ├── home/               # the one-page portfolio and its sections
│   ├── projects/           # project panel, posters and reels
│   └── game/               # the island game: UI and Three.js scene
├── lib/
│   ├── data.ts             # all content: profile, projects, experience, awards, art
│   ├── company-contributions.ts
│   ├── character/          # 3D character loader, glasses, glow outline
│   └── game/               # world layout and sound effects
└── styles/                 # section styles
public/
├── models/                 # the character: compressed preview .glb, full-res WebP textures, blink mask
├── motion/                 # one HTML motion reel per project
├── projects/               # project images and demo media
├── experience/             # photos from work
└── off-the-clock/          # paintings and photographs
```

## Running it locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

Requires Node 20 or newer.

## Editing content

Almost everything on the page lives in `src/lib/data.ts`:

- **Projects:** `PROJECTS` (name, tagline, notes, stack, repo, reel).
- **Experience:** `CAREER`.
- **Awards, certificates and community:** `AWARDS`, `CERTIFICATES`, `COMMUNITY`.
- **Gallery:** add an image to `public/off-the-clock/`, then add an entry to `OFF_THE_CLOCK` with its width and height.

## Deploying

The site is a standard Next.js app, so it deploys to [Vercel](https://vercel.com/new) with no extra configuration:

1. Import this repository.
2. Keep the defaults.
3. Click deploy.

---

Designed and built by Fiza Amjad.
