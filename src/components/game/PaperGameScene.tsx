"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createFizaCharacter } from "@/lib/character/fiza-glb";
import { isLightDevice } from "@/lib/device-tier";
import { DISTRICTS, GAME_PROJECTS, ISLAND_RADIUS, PAD_RING, PROJECT_PLACES, type MoveDirection } from "@/lib/game/world";
import { sfx } from "@/lib/game/audio";

/*
 * Fiza's little world: a grassy island in a moving sea, a plaza in the middle
 * and three districts, one per group of work, each with its own landmark.
 * Every project has a stand: an illustrated sign, a floating token and a pad.
 * Stand on a pad and a ring fills around her feet; when it closes the project
 * is collected (confetti, a chime) and opens. She has to step off the pad
 * before it can open again, so closing the panel never re-opens it.
 */
type Props = {
  paused: boolean; reduced: boolean; unlocked: string[]; destination: number | null; travelKey: number;
  /** A project is open on top of the world: stop drawing it, so the demo reel gets the main thread and GPU. */
  frozen?: boolean;
  direction: MoveDirection | null; muted: boolean; mapView: boolean;
  onCollect: (id: string) => void; onOpen: (id: string) => void; onReady: (ok: boolean) => void; onTravel: (index: number) => void;
};

const CAM_OFFSET = new THREE.Vector3(9, 15, 15.5);
const CAM_YAW = Math.atan2(CAM_OFFSET.x, CAM_OFFSET.z); // signs turn to face the camera
const BACK = new THREE.Vector3(-Math.sin(CAM_YAW), 0, -Math.cos(CAM_YAW)); // "up the screen" on the ground
// the camera looks down at this angle; signs lean back by it so they face the lens square-on, not squashed
const TOP_OFFSET = new THREE.Vector3(Math.sin(CAM_YAW) * 0.6, 40, Math.cos(CAM_YAW) * 0.6);
/** Ground point -> minimap (same heading as the game view: up on the map is up on screen). */
function toMap(x: number, z: number): [number, number] { return [x * -BACK.z + z * BACK.x, -(x * BACK.x + z * BACK.z)]; }
const CAM_PITCH = Math.atan2(CAM_OFFSET.y, Math.hypot(CAM_OFFSET.x, CAM_OFFSET.z));
const DWELL = 0.75; // seconds on a pad before it opens
const PAD_R = 1.05;
const INK = "#12283a", INK_2 = "#46617a";

/** A folded-paper tree crown: two triangles crossed at right angles, base at y = -h/2. */
function paperTree(w: number, h: number) {
  const g = new THREE.BufferGeometry(), y0 = -h / 2, y1 = h / 2;
  g.setAttribute("position", new THREE.Float32BufferAttribute([-w, y0, 0, w, y0, 0, 0, y1, 0, 0, y0, -w, 0, y0, w, 0, y1, 0], 3));
  g.computeVertexNormals(); return g;
}
function rng(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;

function fontFamily() {
  const v = getComputedStyle(document.body).getPropertyValue("--font-figtree").trim();
  return v ? `${v}, system-ui, sans-serif` : "system-ui, sans-serif";
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number, lines: number) {
  const words = text.split(/\s+/); let line = "", n = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > max && line) {
      if (n === lines - 1) { let cut = line; while (ctx.measureText(`${cut}…`).width > max && cut.length) cut = cut.slice(0, -1); ctx.fillText(`${cut}…`, x, y + n * lh); return; }
      ctx.fillText(line, x, y + n * lh); n++; line = words[i];
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y + n * lh);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** A paper signboard drawn on a canvas: coloured band, title, a line of text, a hint. */
function signTexture(opts: { band: number; kicker: string; title: string; body: string; hint: string; big?: boolean }, renderer: THREE.WebGLRenderer) {
  // drawn at 2x so the text stays sharp when the camera zooms in
  const c = document.createElement("canvas"); c.width = 1280; c.height = 800;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const draw = () => {
    const ctx = c.getContext("2d")!; const f = fontFamily();
    ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.clearRect(0, 0, 640, 400);
    roundRect(ctx, 6, 6, 628, 388, 34); ctx.fillStyle = "#fbf8f1"; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = hex(opts.band); ctx.fillRect(0, 0, 640, 70); ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = "#d9e1e7"; roundRect(ctx, 6, 6, 628, 388, 34); ctx.stroke();
    ctx.fillStyle = opts.band === 0xd9a92a ? INK : "#ffffff"; ctx.font = `600 26px ${f}`; ctx.textBaseline = "middle";
    ctx.fillText(opts.kicker.toLowerCase(), 40, 40);
    ctx.textBaseline = "alphabetic"; ctx.fillStyle = INK;
    ctx.font = `700 ${opts.big ? 64 : 50}px ${f}`; wrap(ctx, opts.title.toLowerCase(), 40, opts.big ? 165 : 140, 560, opts.big ? 66 : 54, 2);
    ctx.fillStyle = INK_2; ctx.font = `400 25px ${f}`; wrap(ctx, opts.body, 40, opts.big ? 250 : 255, 560, 33, opts.big ? 2 : 3);
    ctx.fillStyle = hex(opts.band === 0xd9a92a ? 0x9a7414 : opts.band); ctx.font = `600 23px ${f}`; ctx.fillText(opts.hint, 40, 365);
    tex.needsUpdate = true;
  };
  draw(); document.fonts?.ready.then(draw).catch(() => {});
  return tex;
}

const RING_VERT = "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const RING_FRAG = `
uniform vec3 uColor; uniform vec3 uGlow; uniform float uFill; uniform float uNear; uniform float uDone; uniform float uTime;
varying vec2 vP;
void main(){
  float r = length(vP);
  float band = smoothstep(0.86, 0.9, r) * (1.0 - smoothstep(1.16, 1.2, r));
  float a = fract(atan(vP.x, vP.y) / 6.2831853 + 1.0);
  float filled = 1.0 - smoothstep(uFill - 0.004, uFill, a);
  if (uFill <= 0.0) filled = 0.0;
  float pulse = 0.5 + 0.5 * sin(uTime * 3.0 - r * 4.0);
  float alpha = band * (0.55 + 0.25 * uNear + 0.2 * pulse * (0.4 + uNear) + 0.6 * filled);
  vec3 col = mix(mix(uColor, vec3(1.0), 0.25 + 0.15 * pulse), uGlow, max(filled, uNear * 0.5));
  col = mix(col, uColor, uDone * (1.0 - filled) * 0.6);
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}`;

export default function PaperGameScene(props: Props) {
  const host = useRef<HTMLDivElement>(null), youDot = useRef<SVGGElement>(null), districtTags = useRef<(HTMLSpanElement | null)[]>([]), labels = useRef<(HTMLButtonElement | null)[]>([]), live = useRef(props);
  useEffect(() => { live.current = props; }, [props]);

  useEffect(() => {
    const el = host.current; if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" }); } catch { live.current.onReady(false); return; }
    const light = isLightDevice(); // phones and in-app browsers: less GPU memory per frame
    renderer.setPixelRatio(Math.min(devicePixelRatio, light ? 1.25 : 1.75)); renderer.setClearColor(0xd5e3ed);
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xd5e3ed, 46, 90);
    const camera = new THREE.OrthographicCamera(-10, 10, 8, -8, 0.1, 120);
    const look = new THREE.Vector3(0, 0, 2);
    scene.add(new THREE.HemisphereLight(0xfffaf0, 0x8fb0a0, 2.4));
    const sun = new THREE.DirectionalLight(0xfff1dc, 2.9); sun.position.set(-10, 22, 12); sun.castShadow = true;
    sun.shadow.mapSize.set(light ? 1024 : 2048, light ? 1024 : 2048); Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 80 }); sun.shadow.normalBias = 0.04;
    scene.add(sun);

    const gs: THREE.BufferGeometry[] = [], ms: THREE.Material[] = [], texs: THREE.Texture[] = [];
    const std = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra }); ms.push(m); return m; };
    const add = (g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0, shadow = true) => {
      gs.push(g); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o;
    };
    const paper = std(0xfbf6ea), sand = std(0xe9d9bd), path = std(0xeee2cc), grass = std(0xf3eee2), cliff = std(0xb9d1e1), wood = std(0xb08a62), ink = std(0x25465f);
    const tone = (d: (typeof DISTRICTS)[number]) => std(d.color), toneLight = (d: (typeof DISTRICTS)[number]) => std(d.light);

    // ── the sea: a faceted sheet whose vertices roll with time ──
    const waterU = { uTime: { value: 0 } };
    const water = std(0xb3d0e2, { roughness: 0.35, metalness: 0.05, flatShading: true, transparent: true, opacity: 0.96 });
    water.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = waterU.uTime;
      sh.vertexShader = "uniform float uTime;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed.z += sin(position.x * 0.22 + uTime * 0.9) * 0.18 + cos(position.y * 0.27 + uTime * 0.7) * 0.15;");
    };
    const sea = add(new THREE.PlaneGeometry(170, 170, 90, 90), water, scene, 0, -0.95, 0, false); sea.rotation.x = -Math.PI / 2; sea.receiveShadow = false;
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }); ms.push(foamMat);
    const foam = add(new THREE.RingGeometry(ISLAND_RADIUS + 1.3, ISLAND_RADIUS + 2.1, 9), foamMat, scene, 0, -0.7, 0, false); foam.rotation.x = -Math.PI / 2;

    // ── the island ──
    // stacked sheets of paper for the island's edge, each a little offset like cut card
    add(new THREE.CylinderGeometry(ISLAND_RADIUS + 0.9, ISLAND_RADIUS + 1.0, 0.45, 9), cliff, scene, 0.25, -0.9, -0.2).rotation.y = 0.12;
    add(new THREE.CylinderGeometry(ISLAND_RADIUS + 0.5, ISLAND_RADIUS + 0.6, 0.45, 9), std(0xe4ecf2), scene, -0.15, -0.5, 0.1).rotation.y = -0.05;
    add(new THREE.CylinderGeometry(ISLAND_RADIUS + 0.2, ISLAND_RADIUS + 0.3, 0.4, 9), cliff, scene, 0, -0.12, 0).rotation.y = 0.2;
    add(new THREE.CylinderGeometry(ISLAND_RADIUS, ISLAND_RADIUS + 0.2, 0.3, 9), grass, scene, 0, 0, 0).rotation.y = 0.2;
    const flat = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, ry = 0) => { const o = add(g, m, scene, x, y, z, false); o.rotation.x = -Math.PI / 2; o.rotation.z = ry; return o; };

    // plaza with a fountain in the middle
    flat(new THREE.CircleGeometry(3.8, 48), path, 0, 0.16, 0);
    flat(new THREE.RingGeometry(3.8, 4.15, 48), sand, 0, 0.165, 0);
    add(new THREE.CylinderGeometry(1.45, 1.6, 0.45, 32), paper, scene, 0, 0.38, 0);
    const pool = std(0x9fd0e6, { roughness: 0.2, emissive: 0x2a6f93, emissiveIntensity: 0.15 });
    add(new THREE.CylinderGeometry(1.25, 1.25, 0.1, 32), pool, scene, 0, 0.58, 0, false);
    add(new THREE.CylinderGeometry(0.2, 0.28, 1.1, 16), paper, scene, 0, 1.05, 0);
    const spout = add(new THREE.SphereGeometry(0.34, 16, 12), pool, scene, 0, 1.7, 0, false);
    const welcome = new THREE.Group(); welcome.position.set(-2.3, 0.15, 3.2); welcome.rotation.y = CAM_YAW; scene.add(welcome);
    add(new THREE.BoxGeometry(0.1, 1.6, 0.1), wood, welcome, -1.05, 0.8, 0); add(new THREE.BoxGeometry(0.1, 1.6, 0.1), wood, welcome, 1.05, 0.8, 0);
    const welcomeTex = signTexture({ band: 0x12283a, kicker: "welcome", title: "fiza's little world", body: "Three districts, fifteen projects. Walk onto a glowing pad to open one.", hint: "click the ground or use WASD", big: true }, renderer); texs.push(welcomeTex);
    const wm = new THREE.MeshBasicMaterial({ map: welcomeTex, transparent: true, toneMapped: false }); ms.push(wm);
    add(new THREE.PlaneGeometry(2.6, 1.625), wm, welcome, 0, 1.75, 0.06, false).rotation.x = -CAM_PITCH;

    // districts: tinted ground, a path from the plaza, a ring path for the pads, a landmark and a sign
    const landmarkAnims: ((t: number) => void)[] = [];
    for (const d of DISTRICTS) {
      const tint = new THREE.MeshStandardMaterial({ color: d.light, roughness: 0.9, transparent: true, opacity: 0.9 }); ms.push(tint);
      flat(new THREE.CircleGeometry(PAD_RING + 2.4, 64), tint, d.x, 0.155, d.z);
      flat(new THREE.RingGeometry(PAD_RING - 0.7, PAD_RING + 0.7, 64), path, d.x, 0.162, d.z);
      const len = Math.hypot(d.x, d.z) - 4.2 - PAD_RING, ang = Math.atan2(d.x, d.z);
      const strip = add(new THREE.BoxGeometry(1.7, 0.04, len), path, scene, Math.sin(ang) * (4.0 + len / 2), 0.15, Math.cos(ang) * (4.0 + len / 2), false); strip.rotation.y = ang;

      const lm = new THREE.Group(); lm.position.set(d.x, 0.15, d.z); scene.add(lm);
      add(new THREE.CylinderGeometry(1.5, 1.7, 0.4, 6), paper, lm, 0, 0.2, 0);
      if (d.id === "ai") {
        add(new THREE.CylinderGeometry(0.35, 0.5, 1.4, 12), paper, lm, 0, 1.1, 0);
        const orb = add(new THREE.IcosahedronGeometry(0.85, 1), std(d.color, { emissive: d.color, emissiveIntensity: 0.55, roughness: 0.3, flatShading: true }), lm, 0, 2.6, 0);
        const sats = [0, 1, 2].map(() => add(new THREE.OctahedronGeometry(0.16, 0), std(0xf3d36b, { emissive: 0xf3d36b, emissiveIntensity: 0.6 }), lm, 0, 2.6, 0));
        const halo = add(new THREE.TorusGeometry(1.35, 0.03, 6, 64), std(d.light), lm, 0, 2.6, 0); halo.rotation.x = 1.2;
        landmarkAnims.push((t) => { orb.rotation.y = t * 0.4; orb.position.y = 2.6 + Math.sin(t * 1.3) * 0.12; sats.forEach((s, k) => { const a = t * 1.4 + (k * Math.PI * 2) / 3; s.position.set(Math.cos(a) * 1.35, 2.6 + Math.sin(a) * 0.45, Math.sin(a) * 1.35 * 0.4); s.rotation.y = t * 2; }); halo.rotation.z = t * 0.3; });
      } else if (d.id === "products") {
        const blue = tone(d), pale = toneLight(d);
        const floors = [1.6, 1.3, 1.0];
        floors.forEach((w, k) => { add(new THREE.BoxGeometry(w, 0.9, w), k % 2 ? pale : blue, lm, 0, 0.85 + k * 0.9, 0); for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.18, 0.28, 0.02), paper, lm, sx * w * 0.22, 0.9 + k * 0.9, w / 2 + 0.01, false); });
        add(new THREE.ConeGeometry(0.85, 0.9, 4), std(0x7b2233), lm, 0, 3.55, 0).rotation.y = Math.PI / 4;
        add(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), wood, lm, 0, 4.4, 0);
        const flag = add(new THREE.PlaneGeometry(0.6, 0.36, 6, 1), std(0xf3d36b, { side: THREE.DoubleSide }), lm, 0.3, 4.65, 0, false);
        const fp = flag.geometry.attributes.position as THREE.BufferAttribute, base = Float32Array.from(fp.array as Float32Array);
        landmarkAnims.push((t) => { for (let i = 0; i < fp.count; i++) { const x = base[i * 3]; fp.setZ(i, Math.sin(t * 5 + x * 6) * 0.06 * (x + 0.3)); } fp.needsUpdate = true; });
      } else {
        const body = std(d.color), screenMat = std(0x12283a, { emissive: 0xf3d36b, emissiveIntensity: 0.0 });
        add(new THREE.BoxGeometry(1.5, 2.3, 1.1), body, lm, 0, 1.55, 0);
        const scr = add(new THREE.BoxGeometry(1.15, 0.85, 0.05), screenMat, lm, 0, 2.05, 0.56, false); scr.rotation.x = -0.12;
        add(new THREE.BoxGeometry(1.5, 0.12, 0.6), ink, lm, 0, 1.4, 0.75);
        add(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8), ink, lm, -0.3, 1.58, 0.8); add(new THREE.SphereGeometry(0.09, 10, 8), std(0x7b2233), lm, -0.3, 1.72, 0.8);
        for (const bx of [0.15, 0.4]) add(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12), std(bx > 0.2 ? 0x7b2233 : 0x17557f), lm, bx, 1.48, 0.8);
        add(new THREE.BoxGeometry(1.6, 0.3, 1.2), std(0x7b2233), lm, 0, 2.85, 0);
        landmarkAnims.push((t) => { (screenMat as THREE.MeshStandardMaterial).emissiveIntensity = 0.35 + 0.25 * Math.sin(t * 6) * Math.sin(t * 2.3); });
      }
      // the district's name, painted on the ground on the far side from the plaza, reading toward the camera
      const away = Math.atan2(d.x, d.z);
      const nc = document.createElement("canvas"); nc.width = 2048; nc.height = 512;
      const ntex = new THREE.CanvasTexture(nc); ntex.colorSpace = THREE.SRGBColorSpace; ntex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); texs.push(ntex);
      const paint = () => { const ctx = nc.getContext("2d")!; ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.clearRect(0, 0, 1024, 256); ctx.fillStyle = hex(d.id === "systems" ? 0x9a7414 : d.color); ctx.font = `700 118px ${fontFamily()}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(d.title.toLowerCase(), 512, 128); ntex.needsUpdate = true; };
      paint(); document.fonts?.ready.then(paint).catch(() => {});
      const nm = new THREE.MeshBasicMaterial({ map: ntex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.9 }); ms.push(nm);
      const decal = add(new THREE.PlaneGeometry(5.6, 1.4 / Math.sin(CAM_PITCH)), nm, scene, d.x + Math.sin(away) * 4.4, 0.17, d.z + Math.cos(away) * 4.4, false);
      decal.rotation.set(-Math.PI / 2, 0, CAM_YAW); decal.renderOrder = 1;
    }

    // ── project stands ──
    type Stand = { token: THREE.Group; ring: THREE.ShaderMaterial; flag: THREE.Object3D; sparkles: THREE.Object3D[]; fill: number; armed: boolean; near: number; over: number };
    const stands: Stand[] = [];
    PROJECT_PLACES.forEach((place, i) => {
      const p = GAME_PROJECTS[i], d = DISTRICTS.find((x) => x.id === place.district)!;
      const g = new THREE.Group(); g.position.set(place.x, 0.15, place.z); scene.add(g);
      add(new THREE.CylinderGeometry(1.3, 1.42, 0.16, 6), paper, g, 0, 0.08, 0);
      add(new THREE.CylinderGeometry(0.95, 0.95, 0.02, 40), toneLight(d), g, 0, 0.17, 0, false);
      const ring = new THREE.ShaderMaterial({
        vertexShader: RING_VERT, fragmentShader: RING_FRAG, transparent: true, depthWrite: false,
        uniforms: { uColor: { value: new THREE.Color(d.color) }, uGlow: { value: new THREE.Color(0xf3d36b) }, uFill: { value: 0 }, uNear: { value: 0 }, uDone: { value: 0 }, uTime: { value: 0 } },
      }); ms.push(ring);
      const rm = add(new THREE.RingGeometry(0.8, 1.25, 64), ring, g, 0, 0.19, 0, false); rm.rotation.x = -Math.PI / 2; rm.renderOrder = 2;

      // token
      const token = new THREE.Group(); token.position.y = 1.25; g.add(token);
      const red = std(0x7b2233), blue = std(0x9fc0d6), dk = tone(d);
      if (p.id === "postal" || p.id === "smartinbox") {
        add(new THREE.BoxGeometry(1.0, 0.66, 0.1), paper, token, 0, 0.2, 0);
        const flapG = new THREE.BufferGeometry(); flapG.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, 0.53, 0.06, 0.5, 0.53, 0.06, 0, 0.1, 0.06], 3)); flapG.computeVertexNormals();
        add(flapG, blue, token); add(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20), red, token, 0, 0.17, 0.08).rotation.x = Math.PI / 2;
      } else if (["planet1", "dungeon", "pacman"].includes(p.id)) {
        add(new THREE.IcosahedronGeometry(0.46, 0), i % 2 ? red : dk, token, 0, 0.25, 0);
        add(new THREE.TorusGeometry(0.68, 0.03, 5, 32), ink, token, 0, 0.25, 0).rotation.x = 1.2;
      } else if (["cachenet", "infinium", "chromalink", "sentiment"].includes(p.id)) {
        for (let j = 0; j < 3; j++) { const a = (j / 3) * Math.PI * 2; add(new THREE.BoxGeometry(0.3, 0.32, 0.3), j === 0 ? red : dk, token, Math.cos(a) * 0.4, 0.24, Math.sin(a) * 0.4); }
        add(new THREE.TorusGeometry(0.4, 0.022, 4, 24), ink, token, 0, 0.24, 0).rotation.x = Math.PI / 2;
      } else {
        add(new THREE.BoxGeometry(1.0, 0.68, 0.1), ink, token, 0, 0.3, 0); add(new THREE.BoxGeometry(0.88, 0.54, 0.03), paper, token, 0, 0.3, 0.06);
        for (let j = 0; j < 3; j++) add(new THREE.BoxGeometry(0.12 + j * 0.14, 0.03, 0.02), j === 0 ? red : dk, token, -0.18 + j * 0.03, 0.44 - j * 0.13, 0.085);
        add(new THREE.BoxGeometry(0.55, 0.055, 0.3), ink, token, 0, -0.08, 0);
      }
      const sparkles = [0, 1, 2].map(() => add(new THREE.OctahedronGeometry(0.07, 0), std(0xf3d36b, { emissive: 0xf3d36b, emissiveIntensity: 0.8 }), token, 0, 0, 0, false));

      // sign behind the pad
      const sign = new THREE.Group(); sign.position.set(BACK.x * 1.8, 0, BACK.z * 1.8); sign.rotation.y = CAM_YAW; g.add(sign);
      add(new THREE.BoxGeometry(0.08, 1.5, 0.08), wood, sign, -1.05, 0.75, 0); add(new THREE.BoxGeometry(0.08, 1.5, 0.08), wood, sign, 1.05, 0.75, 0);
      const tex = signTexture({ band: d.color, kicker: d.title, title: p.name, body: p.tagline ?? "", hint: "step on the pad to open" }, renderer); texs.push(tex);
      const sm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }); ms.push(sm);
      add(new THREE.PlaneGeometry(2.5, 1.56), sm, sign, 0, 1.85, 0.05, false).rotation.x = -CAM_PITCH;

      // a little flag that goes up once the project is collected
      const flag = new THREE.Group(); flag.position.set(-BACK.z * 1.2, 0.15, BACK.x * 1.2); g.add(flag);
      add(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 6), wood, flag, 0, 0.5, 0);
      add(new THREE.PlaneGeometry(0.42, 0.26), std(d.color, { side: THREE.DoubleSide }), flag, 0.21, 0.86, 0, false);
      flag.visible = false;
      stands.push({ token, ring, flag, sparkles, fill: 0, armed: true, near: 0, over: 0 });
    });

    // ── greenery ──
    const R = rng(7);
    const avoid = (x: number, z: number) => {
      if (Math.hypot(x, z) < 5.4) return true;
      for (const d of DISTRICTS) { const dd = Math.hypot(x - d.x, z - d.z); if (dd < PAD_RING + 2.1) return true; const ang = Math.atan2(d.x, d.z), along = x * Math.sin(ang) + z * Math.cos(ang), across = Math.abs(x * Math.cos(ang) - z * Math.sin(ang)); if (along > 3 && along < Math.hypot(d.x, d.z) && across < 1.8) return true; }
      return false;
    };
    const treeSpots: [number, number, number][] = [];
    for (let k = 0; k < 600 && treeSpots.length < 16; k++) { const a = R() * Math.PI * 2, r = 12 + R() * (ISLAND_RADIUS - 14), x = Math.sin(a) * r, z = Math.cos(a) * r; if (!avoid(x, z) && treeSpots.every(([tx, tz]) => Math.hypot(tx - x, tz - z) > 3.2)) treeSpots.push([x, z, 0.6 + R() * 0.45]); }
    const trunkG = new THREE.CylinderGeometry(0.11, 0.16, 1, 6), crownG = paperTree(0.8, 1.7), crownG2 = paperTree(0.6, 2.1); gs.push(trunkG, crownG, crownG2);
    const trunks = new THREE.InstancedMesh(trunkG, wood, treeSpots.length), crowns = new THREE.InstancedMesh(crownG, std(0xffffff, { side: THREE.DoubleSide }), treeSpots.length), pines = new THREE.InstancedMesh(crownG2, std(0xffffff, { side: THREE.DoubleSide }), treeSpots.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), col = new THREE.Color();
    const greens = [0xb9d1e1, 0x9fc0d6, 0xc6dbe9, 0x8fb4cc], blossoms = [0x7b2233, 0xf3d36b];
    treeSpots.forEach(([x, z, s], k) => {
      m4.compose(pos.set(x, 0.15 + 0.5 * s, z), q.identity(), sc.set(s, s, s)); trunks.setMatrixAt(k, m4);
      const pine = k % 3 === 0;
      m4.compose(pos.set(x, 0.15 + (pine ? 1.5 : 1.35) * s, z), q.setFromEuler(new THREE.Euler(0, R() * 6, 0)), pine ? sc.set(s, s, s) : sc.set(s * 1.05, s * 0.95, s * 1.05));
      (pine ? pines : crowns).setMatrixAt(k, m4); (pine ? crowns : pines).setMatrixAt(k, new THREE.Matrix4().makeScale(0, 0, 0));
      col.setHex(k % 7 === 3 ? blossoms[k % 2] : greens[k % greens.length]); (pine ? pines : crowns).setColorAt(k, col); (pine ? crowns : pines).setColorAt(k, col);
    });
    for (const im of [trunks, crowns, pines]) { im.castShadow = true; im.receiveShadow = true; scene.add(im); }
    const flowerG = new THREE.IcosahedronGeometry(0.1, 0); gs.push(flowerG);
    const flowers = new THREE.InstancedMesh(flowerG, std(0xffffff), 34); let fc = 0;
    for (let k = 0; k < 900 && fc < 34; k++) { const a = R() * Math.PI * 2, r = 4.3 + R() * (ISLAND_RADIUS - 5), x = Math.sin(a) * r, z = Math.cos(a) * r; if (avoid(x, z)) continue; if (Math.hypot(x, z) < 4.4) continue; m4.compose(pos.set(x, 0.2, z), q.identity(), sc.setScalar(0.8 + R() * 0.7)); flowers.setMatrixAt(fc, m4); flowers.setColorAt(fc, col.setHex([0xf3d36b, 0xffffff, 0xe9a3b0, 0x9fc0d6][fc % 4])); fc++; }
    flowers.count = fc; scene.add(flowers);

    // ── sky: drifting clouds and two paper planes ──
    // clouds are only their shadows, drifting over the island (in this view a cloud mesh would read as a rock)
    const cloudMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }); ms.push(cloudMat);
    const clouds: THREE.Group[] = [];
    for (let k = 0; k < 0; k++) { const c = new THREE.Group(); const n = 3 + (k % 3); for (let j = 0; j < n; j++) add(new THREE.IcosahedronGeometry(0.9 + R() * 0.7, 0), cloudMat, c, j * 1.1 - n * 0.5, R() * 0.4, R() * 0.8); c.position.set(-30 + k * 9 + R() * 4, 14 + R() * 3, -18 + R() * 30); c.scale.setScalar(1.6); clouds.push(c); scene.add(c); }
    const planes: THREE.Group[] = [];
    for (let k = 0; k < 1; k++) { const pl = new THREE.Group(); const wing = new THREE.BufferGeometry(); wing.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -0.9, -1, 0, 0.8, 0, 0.25, 0.3, 0, 0, -0.9, 0, 0.25, 0.3, 1, 0, 0.8], 3)); wing.computeVertexNormals(); add(wing, std(0xffffff, { side: THREE.DoubleSide }), pl); planes.push(pl); scene.add(pl); }

    // ── particles: confetti bursts and dust puffs ──
    const CONF = 90, confG = new THREE.PlaneGeometry(0.14, 0.09); gs.push(confG);
    const confMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }); ms.push(confMat);
    const confetti = new THREE.InstancedMesh(confG, confMat, CONF); confetti.frustumCulled = false; scene.add(confetti);
    const cState = Array.from({ length: CONF }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), s: new THREE.Vector3(), life: 0 }));
    const confColors = [0x7b2233, 0xf3d36b, 0x17557f, 0xffffff, 0xe9a3b0];
    for (let k = 0; k < CONF; k++) { confetti.setColorAt(k, col.setHex(confColors[k % confColors.length])); confetti.setMatrixAt(k, new THREE.Matrix4().makeScale(0, 0, 0)); }
    const burst = (x: number, z: number) => { cState.forEach((c, k) => { const a = (k / CONF) * Math.PI * 2 + R(); c.p.set(x, 1.2, z); c.v.set(Math.cos(a) * (1.5 + R() * 2.2), 4 + R() * 3.5, Math.sin(a) * (1.5 + R() * 2.2)); c.r.set(R() * 6, R() * 6, R() * 6); c.s.set(9 + R() * 6, 7 + R() * 5, 8 + R() * 6); c.life = 1.6 + R() * 0.6; }); };
    const DUST = 18, dustG = new THREE.IcosahedronGeometry(0.12, 0); gs.push(dustG);
    const dustMat = new THREE.MeshBasicMaterial({ color: 0xf1e8d6, transparent: true, opacity: 0.85 }); ms.push(dustMat);
    const dust = new THREE.InstancedMesh(dustG, dustMat, DUST); dust.frustumCulled = false; scene.add(dust);
    const dState = Array.from({ length: DUST }, () => ({ p: new THREE.Vector3(), life: 0 })); let dustNext = 0, dustAt = 0;
    for (let k = 0; k < DUST; k++) dust.setMatrixAt(k, new THREE.Matrix4().makeScale(0, 0, 0));

    // ── Fiza ──
    const fiza = createFizaCharacter(renderer); fiza.stage.visible = false; fiza.container.scale.setScalar(0.5);
    fiza.container.position.set(0, 0.17, 5.2); fiza.root.rotation.y = CAM_YAW; scene.add(fiza.container);
    const position = fiza.container.position, target = new THREE.Vector3();
    const blob = add(new THREE.CircleGeometry(0.75, 24), new THREE.MeshBasicMaterial({ color: 0x1d3a2a, transparent: true, opacity: 0.18, depthWrite: false }), scene, 0, 0.2, 0, false); blob.rotation.x = -Math.PI / 2; ms.push(blob.material as THREE.Material);

    let stuck = 0, detour = 0, detourX = 0, detourZ = 0, movingTo = false, travelSeen = -1, last = 0, frame = 0, t = 0, visible = true, zoom = 1, overhead = 0;
    const caught = new Set(live.current.unlocked), keys = new Set<string>(), projected = new THREE.Vector3(), raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.15);
    stands.forEach((s, i) => { s.flag.visible = caught.has(PROJECT_PLACES[i].id); });

    const open = (i: number) => {
      const place = PROJECT_PLACES[i], s = stands[i], first = !caught.has(place.id);
      s.armed = false; s.fill = 0;
      if (first) { caught.add(place.id); s.flag.visible = true; live.current.onCollect(place.id); }
      if (!live.current.muted) (first ? sfx.complete : sfx.open)();
      if (!live.current.reduced) burst(place.x, place.z);
      keys.clear(); movingTo = false;
      // let the confetti and the flag land for a beat before the panel covers them
      pendingOpen = { id: place.id, at: t + (live.current.reduced ? 0 : 0.85) };
    };
    let pendingOpen: { id: string; at: number } | null = null;

    const keydown = (e: KeyboardEvent) => {
      if (live.current.paused || e.ctrlKey || e.metaKey || e.altKey) return;
      const element = e.target as HTMLElement; if (element.closest("button,a,input,textarea,select")) return;
      const key = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) { e.preventDefault(); keys.add(key); movingTo = false; }
      if (key === "e" || key === "enter") { const i = PROJECT_PLACES.findIndex((p) => Math.hypot(p.x - position.x, p.z - position.z) < 1.8); if (i >= 0) open(i); }
    };
    const keyup = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase()); const blur = () => keys.clear();
    window.addEventListener("keydown", keydown); window.addEventListener("keyup", keyup); window.addEventListener("blur", blur);
    const tap = (e: PointerEvent) => {
      if (live.current.paused) return;
      const box = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(ground, target)) { const r = Math.hypot(target.x, target.z), max = ISLAND_RADIUS - 1.4; if (r > max) target.multiplyScalar(max / r); goTo(target.x, target.z); }
    };
    renderer.domElement.addEventListener("pointerdown", tap);
    const resize = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h); const aspect = w / h, half = aspect < 0.8 ? 8.5 : 6.4; camera.left = -half * aspect; camera.right = half * aspect; camera.top = half; camera.bottom = -half; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    const visibility = () => { visible = !document.hidden; keys.clear(); }; document.addEventListener("visibilitychange", visibility);
    const lost = (e: Event) => { e.preventDefault(); live.current.onReady(false); }; renderer.domElement.addEventListener("webglcontextlost", lost);

    const camOff = new THREE.Vector3();
    /* Everything she can bump into, as circles: the fountain, the landmarks,
       each tree trunk, and every signboard (three circles along its width).
       She is pushed back out of any she overlaps, so she slides around them. */
    const FIZA_R = 0.32;
    const solids: { x: number; z: number; r: number; ax?: number; az?: number }[] = [{ x: 0, z: 0, r: 1.75 }, ...DISTRICTS.map((d) => ({ x: d.x, z: d.z, r: 1.85 }))];
    treeSpots.forEach(([x, z, s]) => solids.push({ x, z, r: 0.55 * s + 0.15 }));
    const signAlong = (cx: number, cz: number, half: number) => { const ax = Math.cos(CAM_YAW), az = -Math.sin(CAM_YAW); for (const k of [-1, -0.5, 0, 0.5, 1]) solids.push({ x: cx + ax * half * k, z: cz + az * half * k, r: 0.28, ax, az }); };
    signAlong(-2.3, 3.2, 1.1);
    PROJECT_PLACES.forEach((p) => signAlong(p.x + BACK.x * 1.8, p.z + BACK.z * 1.8, 1.08));
    for (const o of solids) o.r += FIZA_R;

    /* Route planning: the island as a grid of walkable cells (A* with 8
       neighbours), then the route is pulled straight wherever she can see
       ahead, so she walks in clean lines around trees and signs. */
    const CELL = 0.4, HALF = ISLAND_RADIUS + 1, N = Math.ceil((HALF * 2) / CELL);
    const blocked = new Uint8Array(N * N);
    const cx = (i: number) => -HALF + (i + 0.5) * CELL;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = cx(i), z = cx(j);
      let b = Math.hypot(x, z) > ISLAND_RADIUS - 1.5;
      if (!b) for (const o of solids) if (Math.hypot(x - o.x, z - o.z) < o.r + 0.05) { b = true; break; }
      blocked[j * N + i] = b ? 1 : 0;
    }
    const cellOf = (v: number) => THREE.MathUtils.clamp(Math.floor((v + HALF) / CELL), 0, N - 1);
    const free = (x: number, z: number) => blocked[cellOf(z) * N + cellOf(x)] === 0;
    const sight = (ax: number, az: number, bx: number, bz: number) => { const n = Math.ceil(Math.hypot(bx - ax, bz - az) / (CELL * 0.5)); for (let k = 1; k < n; k++) { const f = k / n; if (!free(ax + (bx - ax) * f, az + (bz - az) * f)) return false; } return true; };
    function nearestFree(i: number, j: number) {
      if (!blocked[j * N + i]) return [i, j];
      for (let r = 1; r < 12; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < N && b < N && !blocked[b * N + a]) return [a, b]; }
      return [i, j];
    }
    function plan(fx: number, fz: number, tx: number, tz: number): THREE.Vector3[] {
      if (sight(fx, fz, tx, tz)) return [new THREE.Vector3(tx, 0, tz)];
      const [si, sj] = nearestFree(cellOf(fx), cellOf(fz)), [gi, gj] = nearestFree(cellOf(tx), cellOf(tz));
      const start = sj * N + si, goal = gj * N + gi;
      const g = new Float32Array(N * N).fill(Infinity), from = new Int32Array(N * N).fill(-1), closed = new Uint8Array(N * N);
      const open: number[] = [start]; const f = new Float32Array(N * N).fill(Infinity);
      const h = (k: number) => { const dx = Math.abs((k % N) - gi), dz = Math.abs(Math.floor(k / N) - gj); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
      g[start] = 0; f[start] = h(start);
      while (open.length) {
        let bi = 0; for (let k = 1; k < open.length; k++) if (f[open[k]] < f[open[bi]]) bi = k;
        const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
        if (cur === goal) break;
        if (closed[cur]) continue; closed[cur] = 1;
        const ci = cur % N, cj = Math.floor(cur / N);
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue; const ni = ci + di, nj = cj + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
          const nk = nj * N + ni; if (blocked[nk] || closed[nk]) continue;
          if (di && dj && (blocked[cj * N + ni] || blocked[nj * N + ci])) continue; // no cutting corners
          const ng = g[cur] + (di && dj ? 1.414 : 1);
          if (ng < g[nk]) { g[nk] = ng; f[nk] = ng + h(nk); from[nk] = cur; open.push(nk); }
        }
      }
      if (from[goal] < 0 && goal !== start) return [new THREE.Vector3(tx, 0, tz)];
      const cells: [number, number][] = []; for (let k = goal; k >= 0 && k !== start; k = from[k]) cells.push([cx(k % N), cx(Math.floor(k / N))]);
      cells.reverse(); cells[cells.length - 1] = [tx, tz];
      const out: THREE.Vector3[] = []; let ax = fx, az = fz, k = 0;
      while (k < cells.length) { let far = k; for (let m = cells.length - 1; m > k; m--) if (sight(ax, az, cells[m][0], cells[m][1])) { far = m; break; } out.push(new THREE.Vector3(cells[far][0], 0, cells[far][1])); ax = cells[far][0]; az = cells[far][1]; k = far + 1; }
      return out;
    }
    let route: THREE.Vector3[] = [];
    const goTo = (x: number, z: number) => { route = plan(position.x, position.z, x, z); target.copy(route.shift()!); movingTo = true; keys.clear(); };
    function draw(now: number) {
      frame = requestAnimationFrame(draw);
      // hidden, or covered by an open project: the canvas keeps its last frame, nothing is drawn
      if (!visible || live.current.frozen) { last = now; return; }
      if (now - last < 1000 / 45) return;
      const dt = Math.min((now - last) / 1000, 0.06); last = now;
      const L = live.current, still = L.reduced;
      let dx = 0, dz = 0, moving = false;
      if (!L.paused) {
        t += dt;
        if (travelSeen !== L.travelKey) { travelSeen = L.travelKey; const p = PROJECT_PLACES[L.destination ?? -1]; if (p) goTo(p.x, p.z); }
        const d = L.direction;
        dx = (keys.has("d") || keys.has("arrowright") || d === "right" ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") || d === "left" ? 1 : 0);
        dz = (keys.has("s") || keys.has("arrowdown") || d === "down" ? 1 : 0) - (keys.has("w") || keys.has("arrowup") || d === "up" ? 1 : 0);
        // keys follow the view: up always walks toward the top of the screen
        if (dx || dz) { const fwdX = BACK.x, fwdZ = BACK.z, rightX = -BACK.z, rightZ = BACK.x; const ux = -dz, rx = dx; dx = fwdX * ux + rightX * rx; dz = fwdZ * ux + rightZ * rx; movingTo = false; }
        else if (movingTo) {
          dx = target.x - position.x; dz = target.z - position.z;
          if (Math.hypot(dx, dz) < (route.length ? 0.25 : 0.08)) { const next = route.shift(); if (next) target.copy(next); else { movingTo = false; dx = dz = 0; } }
          else if (detour > 0) { detour -= dt; dx = detourX; dz = detourZ; } // stepping around something in the way
        }
        const length = Math.hypot(dx, dz);
        if (length) {
          moving = true;
          const step = Math.min(5 * dt, movingTo ? length : Infinity);
          const px = position.x, pz = position.z;
          position.x += (dx / length) * step; position.z += (dz / length) * step;
          for (const s of solids) { const ox = position.x - s.x, oz = position.z - s.z, od = Math.hypot(ox, oz); if (od < s.r) { position.x = s.x + (ox / (od || 1)) * s.r; position.z = s.z + (oz / (od || 1)) * s.r; } }
          const r = Math.hypot(position.x, position.z), max = ISLAND_RADIUS - 1.4; if (r > max) { position.x *= max / r; position.z *= max / r; }
          // walking into something with nowhere to slide: give up on a clicked target rather than pushing forever
          if (Math.hypot(position.x - px, position.z - pz) < step * 0.2) {
            stuck += dt;
            if (movingTo && detour <= 0 && stuck > 0.12) {
              // blocked head-on: walk along the obstacle's edge, on the side nearer the target, for a moment
              let best = solids[0], bd = Infinity;
              for (const o of solids) { const od = Math.hypot(position.x - o.x, position.z - o.z) - o.r; if (od < bd) { bd = od; best = o; } }
              let nx = position.x - best.x, nz = position.z - best.z; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
              let tx = best.ax ?? -nz, tz = best.az ?? nx; if (tx * (target.x - position.x) + tz * (target.z - position.z) < 0) { tx = -tx; tz = -tz; }
              detourX = tx; detourZ = tz; detour = best.ax !== undefined ? 0.8 : 0.45;
            }
            if (stuck > 2.5 && movingTo) { movingTo = false; stuck = 0; } // truly boxed in: stop trying
          } else stuck = 0;
          const angle = Math.atan2(dx, dz); fiza.root.rotation.y += Math.atan2(Math.sin(angle - fiza.root.rotation.y), Math.cos(angle - fiza.root.rotation.y)) * 0.24;
          if (!still && (dustAt += dt) > 0.09) { dustAt = 0; const dp = dState[dustNext]; dp.p.set(position.x + (Math.random() - 0.5) * 0.3, 0.25, position.z + (Math.random() - 0.5) * 0.3); dp.life = 0.6; dustNext = (dustNext + 1) % DUST; }
        }
        fiza.root.position.y = 0;
        fiza.update(dt, moving);

        // pads: fill while she stands on one; it opens when the ring closes
        if (pendingOpen && t >= pendingOpen.at) { const id = pendingOpen.id; pendingOpen = null; L.onOpen(id); }
        let nearest = 99;
        PROJECT_PLACES.forEach((p, i) => {
          const s = stands[i], dist = Math.hypot(p.x - position.x, p.z - position.z);
          nearest = Math.min(nearest, dist);
          if (dist > 1.7) s.armed = true;
          const on = dist < PAD_R && s.armed && !movingTo;
          s.fill = on ? s.fill + dt : Math.max(0, s.fill - dt * 3);
          if (s.fill >= DWELL) open(i);
          s.near += ((dist < 3.2 ? 1 : 0) - s.near) * Math.min(1, dt * 6);
          s.over += ((dist < 1.8 ? 1 : 0) - s.over) * Math.min(1, dt * 5); // token floats up over her head while she stands here
          s.ring.uniforms.uFill.value = s.fill / DWELL; s.ring.uniforms.uNear.value = s.near; s.ring.uniforms.uTime.value = t; s.ring.uniforms.uDone.value = caught.has(p.id) ? 1 : 0;
          const done = caught.has(p.id);
          s.token.position.y = 1.25 + (still ? 0 : Math.sin(t * 1.8 + i) * 0.1) + s.near * 0.15 + s.over * 2.1;
          s.token.rotation.y = still ? -0.3 : t * (done ? 0.4 : 0.8) + i;
          s.sparkles.forEach((sp, k) => { sp.visible = !done && !still; const a = t * 2 + (k * Math.PI * 2) / 3; sp.position.set(Math.cos(a) * 0.75, 0.3 + Math.sin(t * 3 + k) * 0.25, Math.sin(a) * 0.75); sp.rotation.y = t * 3; });
        });
        zoom += ((nearest < 3.2 && !L.mapView ? 1.14 : 1) - zoom) * Math.min(1, dt * 2.5);

        // the world moves around her
        if (!still) {
          waterU.uTime.value = t;
          foamMat.opacity = 0.45 + Math.sin(t * 1.4) * 0.12; foam.scale.setScalar(1 + Math.sin(t * 1.4) * 0.006);
          spout.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
          landmarkAnims.forEach((f) => f(t));
          clouds.forEach((c, k) => { c.position.x += dt * (0.5 + k * 0.08); if (c.position.x > 34) c.position.x = -34; });
          planes.forEach((pl, k) => { const a = t * (0.22 + k * 0.05) + k * Math.PI; const r = 15 + k * 4; pl.position.set(Math.cos(a) * r, 6.5 + k * 1.5 + Math.sin(t * 1.2 + k) * 0.5, Math.sin(a) * r); pl.rotation.set(Math.sin(t + k) * 0.15, -a, -0.35); });
        }
        cState.forEach((c, k) => {
          if (c.life <= 0) return;
          c.life -= dt; c.v.y -= 9 * dt; c.v.multiplyScalar(1 - dt * 0.9); c.p.addScaledVector(c.v, dt); if (c.p.y < 0.2) { c.p.y = 0.2; c.v.set(0, 0, 0); }
          c.r.x += c.s.x * dt; c.r.y += c.s.y * dt; c.r.z += c.s.z * dt;
          m4.compose(c.p, q.setFromEuler(c.r), sc.setScalar(c.life > 0 ? Math.min(1, c.life * 2) : 0)); confetti.setMatrixAt(k, m4);
        });
        confetti.instanceMatrix.needsUpdate = true;
        dState.forEach((dp, k) => { if (dp.life > 0) { dp.life -= dt; dp.p.y += dt * 0.5; } const s = Math.max(0, dp.life) / 0.6; m4.compose(dp.p, q.identity(), sc.setScalar(s > 0 ? 0.6 + (1 - s) * 1.2 : 0)); dust.setMatrixAt(k, m4); });
        dust.instanceMatrix.needsUpdate = true;
        blob.position.set(position.x, 0.19, position.z);
      }

      // bird's-eye view: the camera rises straight above the island (same heading) and pulls out to fit it
      overhead += ((L.mapView ? 1 : 0) - overhead) * (still ? 1 : Math.min(1, dt * 3));
      const e = overhead * overhead * (3 - 2 * overhead);
      const follow = 1 - Math.exp(-dt * 4.5);
      look.x = THREE.MathUtils.lerp(look.x, position.x * (1 - e), still ? 1 : follow); look.z = THREE.MathUtils.lerp(look.z, position.z * (1 - e), still ? 1 : follow);
      camOff.copy(CAM_OFFSET).lerp(TOP_OFFSET, e);
      camera.position.copy(look).add(camOff); camera.lookAt(look);
      const fit = (camera.top - camera.bottom) / 2, want = THREE.MathUtils.lerp(zoom, (fit / (ISLAND_RADIUS + 2.5)) * Math.min(1, (camera.right - camera.left) / (camera.top - camera.bottom)), e);
      if (Math.abs(camera.zoom - want) > 0.0005) { camera.zoom = want; camera.updateProjectionMatrix(); }
      // the minimap's "you are here" dot
      const yd = youDot.current; if (yd) { const [u, v] = toMap(position.x, position.z); yd.setAttribute("transform", `translate(${u.toFixed(2)} ${v.toFixed(2)})`); }
      DISTRICTS.forEach((d, k) => { const tag = districtTags.current[k]; if (!tag) return; projected.set(d.x, 4, d.z).project(camera); tag.style.opacity = String(e); tag.style.left = `${(projected.x * 0.5 + 0.5) * 100}%`; tag.style.top = `${(-projected.y * 0.5 + 0.5) * 100}%`; });
      PROJECT_PLACES.forEach((p, i) => {
        const label = labels.current[i]; if (!label) return;
        const s = stands[i]; projected.set(p.x, 3.6, p.z).project(camera);
        const shown = s.near > 0.5 && overhead < 0.3 && Math.abs(projected.x) < 0.92 && projected.y < 0.85 && projected.y > -0.8;
        label.style.visibility = shown ? "visible" : "hidden";
        label.style.left = `${(projected.x * 0.5 + 0.5) * 100}%`; label.style.top = `${(-projected.y * 0.5 + 0.5) * 100}%`;
      });
      renderer.render(scene, camera);
    }
    draw(performance.now());
    let disposed = false; fiza.ready.then((ok) => { if (!disposed) live.current.onReady(ok); });
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("keydown", keydown); window.removeEventListener("keyup", keyup); window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility); renderer.domElement.removeEventListener("pointerdown", tap); renderer.domElement.removeEventListener("webglcontextlost", lost);
      fiza.dispose(); gs.forEach((g) => g.dispose()); ms.forEach((m) => m.dispose()); texs.forEach((x) => x.dispose());
      trunks.dispose(); crowns.dispose(); pines.dispose(); flowers.dispose(); confetti.dispose(); dust.dispose();
      renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  const R0 = ISLAND_RADIUS + 1.5;
  return <div className="paper-game-scene" ref={host} role="region" tabIndex={0} aria-label="3D project world. Use arrow keys or WASD to walk, or click the ground. Walk onto a glowing pad to open that project. Press M for the map.">
    {DISTRICTS.map((d, k) => <span key={d.id} ref={(el) => { districtTags.current[k] = el; }} className={`paper-map-tag tone-${d.tone}`} aria-hidden="true">{d.title.toLowerCase()}</span>)}
    {GAME_PROJECTS.map((project, i) => {
      const done = props.unlocked.includes(project.id);
      return <button key={project.id} ref={(el) => { labels.current[i] = el; }} tabIndex={-1} className={`paper-world-label ${done ? "is-collected" : ""}`} onClick={() => props.onOpen(project.id)} onPointerDown={(e) => { e.stopPropagation(); }} aria-hidden="true" data-project={project.id}>{project.name}<span>{done ? "collected · open again" : "step on the pad"}</span></button>;
    })}
    <nav className="paper-minimap" aria-label="Map of the world" onPointerDown={(e) => e.stopPropagation()}>
      <svg viewBox={`${-R0} ${-R0} ${R0 * 2} ${R0 * 2}`}>
        <polygon className="paper-minimap-land" points={Array.from({ length: 9 }, (_, k) => { const a = 0.2 + (k / 9) * Math.PI * 2; const [u, v] = toMap(Math.sin(a) * ISLAND_RADIUS, Math.cos(a) * ISLAND_RADIUS); return `${u.toFixed(1)},${v.toFixed(1)}`; }).join(" ")} />
        <circle className="paper-minimap-plaza" r="3.8" />
        {DISTRICTS.map((d) => { const [u, v] = toMap(d.x, d.z); const [pu, pv] = toMap(0, 0); return <g key={d.id}><line className="paper-minimap-path" x1={pu} y1={pv} x2={u} y2={v} /><circle className={`paper-minimap-district tone-${d.tone}`} cx={u} cy={v} r="7.4" /></g>; })}
        {PROJECT_PLACES.map((p, i) => { const [u, v] = toMap(p.x, p.z); const d = DISTRICTS.find((x) => x.id === p.district)!; const done = props.unlocked.includes(p.id);
          return <g key={p.id} className={`paper-minimap-pad tone-${d.tone} ${done ? "is-done" : ""}`} transform={`translate(${u.toFixed(2)} ${v.toFixed(2)})`}>
            <circle r="1.25" /><title>{GAME_PROJECTS[i].name}</title>
            <a href="#" aria-label={`Walk to ${GAME_PROJECTS[i].name}`} onClick={(e) => { e.preventDefault(); props.onTravel(i); }}><circle r="2.4" fill="transparent" /></a>
          </g>; })}
        <g ref={youDot} className="paper-minimap-you"><circle r="2" /><circle r="1" /></g>
      </svg>
      <p>{props.unlocked.length}/{GAME_PROJECTS.length} found · click a dot to walk</p>
    </nav>
  </div>;
}
