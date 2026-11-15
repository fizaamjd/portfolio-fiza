"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createFizaCharacter } from "@/lib/character/fiza-glb";
import { markHeroReady } from "@/lib/hero-ready";
import { createSilhouetteOutline } from "@/lib/character/silhouette-outline";

/* Little Fiza on the hero stage: she breathes, sways a little and turns
   gently toward the cursor. "Twirl" turns her once around. A butter glow with a
   comet tail keeps running around her silhouette, like an edge light in a
   game; it rests with Pause and stays off under reduced motion. */
export default function FizaCharacter({ greeting, paused, onReady }: { greeting: number; paused: boolean; onReady: (ok: boolean) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ greeting, paused, onReady });
  useEffect(() => { live.current = { greeting, paused, onReady }; }, [greeting, paused, onReady]);

  useEffect(() => {
    const el = host.current; if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" }); } catch { markHeroReady(); live.current.onReady(false); return; }
    // supersample: render at 2x even on 1x screens so edges and texture detail stay crisp
    renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio, 2), 2.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; el.prepend(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(27, 1, .1, 80); camera.position.set(.1, 2.9, 12.6); camera.lookAt(0, 2.5, 0);
    // image-based lighting from a soft studio room gives the materials real depth
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env; scene.environmentIntensity = 0.85;
    scene.add(new THREE.HemisphereLight(0xfffaf3, 0x8aa3b6, 0.6));
    const key = new THREE.DirectionalLight(0xfff3e6, 1.9); key.position.set(-3.5, 7, 7); key.castShadow = true; key.shadow.mapSize.set(4096, 4096);
    Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -6, near: .1, far: 30 }); key.shadow.normalBias = .02; scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfeaf3, .45); fill.position.set(5, 3, 5); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xb9d6ec, 1.3); rim.position.set(3, 5, -5); scene.add(rim);

    const model = createFizaCharacter(renderer); scene.add(model.container);
    // no platform: a soft contact shadow grounds her on the page
    model.stage.visible = false;
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.12 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), floorMat); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const outline = createSilhouetteOutline(renderer, { width: 8.5, tail: 0.42 });
    const mid = new THREE.Vector3();
    let drawStart = -1, glintClock = 0;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false, loaded = false;
    model.ready.then((ok) => { loaded = ok; markHeroReady(); if (!disposed) live.current.onReady(ok); });

    const pointer = { x: 0, over: false };
    const move = (e: PointerEvent) => { const box = el.getBoundingClientRect(); pointer.x = THREE.MathUtils.clamp((e.clientX - box.left) / box.width * 2 - 1, -1, 1); pointer.over = true; };
    const leave = () => { pointer.x = 0; pointer.over = false; };
    el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
    const observer = new ResizeObserver(() => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h); outline.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); });
    observer.observe(el);
    let visible = true, frame = 0, last = performance.now(), spin = 0, spunFor = 0, zoom = 0;
    // full-length framing, and the portrait the camera eases into on hover
    const FAR = { pos: new THREE.Vector3(.1, 2.9, 12.6), look: new THREE.Vector3(0, 2.5, 0) };
    const NEAR = { pos: new THREE.Vector3(.05, 4.55, 6.4), look: new THREE.Vector3(0, 4.35, 0) };
    const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
    const visibility = () => { visible = !document.hidden; last = performance.now(); };
    document.addEventListener("visibilitychange", visibility);
    const lost = (e: Event) => { e.preventDefault(); live.current.onReady(false); };
    renderer.domElement.addEventListener("webglcontextlost", lost);

    function draw(now: number) {
      frame = requestAnimationFrame(draw);
      if (!visible || now - last < 1000 / 40) return;
      const dt = Math.min((now - last) / 1000, .06); last = now;
      const still = reduce.matches || live.current.paused;
      if (live.current.greeting !== spunFor) { spunFor = live.current.greeting; spin += Math.PI * 2; }
      const target = spin - .1 + (still ? 0 : pointer.x * .22);
      model.root.rotation.y = still && spin === 0 ? target : THREE.MathUtils.lerp(model.root.rotation.y, target, 1 - Math.exp(-dt * 3.5));
      zoom = reduce.matches ? 0 : THREE.MathUtils.lerp(zoom, pointer.over ? 1 : 0, 1 - Math.exp(-dt * 2.6));
      const z = zoom * zoom * (3 - 2 * zoom);
      camPos.lerpVectors(FAR.pos, NEAR.pos, z); camLook.lerpVectors(FAR.look, NEAR.look, z);
      camera.position.copy(camPos); camera.lookAt(camLook);
      if (loaded && !still) model.update(dt);
      // a blink is small enough to keep under reduced motion; Pause stops it too
      else if (loaded && !live.current.paused) model.blinkStep(dt);
      // the glow: fades in once she is loaded, then keeps running around her
      let head: number | null = null, strength = 0;
      if (loaded && !reduce.matches) {
        if (drawStart < 0) drawStart = now;
        strength = THREE.MathUtils.clamp((now - drawStart) / 700, 0, 1);
        if (!still) glintClock += dt;
        head = (glintClock * 0.16) % 1;
      }
      model.root.localToWorld(mid.set(0, 2.7, 0));
      outline.render(scene, camera, mid, head, strength);
    }
    draw(performance.now());
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility); renderer.domElement.removeEventListener("webglcontextlost", lost);
      model.dispose(); floor.geometry.dispose(); floorMat.dispose(); outline.dispose(); env.dispose(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="identity-character-canvas" aria-hidden="true" />;
}
