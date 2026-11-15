import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { createFizaModel } from "@/lib/character/fiza-model";
import { createGlasses } from "@/lib/character/fiza-glasses";
import { MASK_LAYER } from "@/lib/character/silhouette-outline";

/*
 * Little Fiza, rigged in Meshy (Mixamo skeleton) and exported with its walk
 * cycles: public/models/fiza-rigged.glb, textures recompressed with
 * game-builds/character/textures.mjs (8K colour).
 *
 * Standing, she holds her sculpted pose and moves only a little: breathing in
 * the spine, a slow head tilt, a blink every few seconds. Walking plays the
 * walk clip, faded in and out. The blink happens inside her own texture: a
 * mask (public/models/fiza-blink.png, built from a UV render of her face)
 * marks the eye texels in red and a closed-lid lash line in green, and for a
 * fifth of a second those texels fade to skin with the lash drawn in. Her
 * texture islands are fragmented, which is why this has to be done in UV
 * space rather than with geometry over the face.
 *
 * Same shape as createFizaModel (container, root, stage, ready, update,
 * dispose), so the hero and the game use it directly. If the file cannot
 * load, the hand-built character takes its place.
 */
// bump ?v= whenever the model file changes, so browsers fetch the new one
const URL = "/models/fiza-rigged.glb?v=7";
const HEIGHT = 5.4;
const WALK_CLIP = "Walking_Woman";

const BLINK_MASK = "/models/fiza-blink.png?v=7";
// THREE.Color treats hex as sRGB and stores it linear, matching the shader
const SKIN = new THREE.Color(0xe9946b);
const LASH = new THREE.Color(0x29170f);
/* Where the glasses sit, measured from the rest pose at HEIGHT: lens centre
   offset from the head bone (world units, model facing +z), lens radius,
   gap across the nose, arm length (in lens radii), wire thickness (in lens
   radii), how far the arms spread and bend at the ear, how far they read
   through her hair, and the head's tilt and roll in the sculpted pose. */
const GLASSES = { offset: new THREE.Vector3(0.033, 0.209, 0.367), r: 0.105, gap: 0.073, depth: 3.8, wire: 0.07, flare: 0.35, drop: 0.5, bias: 0.32, tilt: 0, roll: -0.195 };

let cache: Promise<{ scene: THREE.Group; clips: THREE.AnimationClip[] } | null> | null = null;
function loadOnce() {
  if (!cache) {
    cache = new GLTFLoader()
      .loadAsync(URL)
      .then((g) => ({ scene: g.scene as THREE.Group, clips: g.animations }))
      .catch(() => null);
  }
  return cache;
}

/** Keep the walk in place: drop the hips' travel across the floor, keep its bob. */
function inPlace(clip: THREE.AnimationClip) {
  const c = clip.clone();
  for (const t of c.tracks) {
    if (/Hips\.position$/.test(t.name)) {
      const v = t.values;
      const x0 = v[0], z0 = v[2];
      for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; }
    }
  }
  return c;
}

export function createFizaCharacter(renderer?: THREE.WebGLRenderer) {
  const container = new THREE.Group();
  const root = new THREE.Group();
  container.add(root);

  const stageGeometry = new THREE.CylinderGeometry(1.82, 1.95, 0.1, 80);
  const stageMaterial = new THREE.MeshStandardMaterial({ color: 0xc3d5e1, roughness: 0.95 });
  const stage = new THREE.Mesh(stageGeometry, stageMaterial);
  stage.position.y = -0.055;
  stage.receiveShadow = true;
  container.add(stage);

  let fallback: ReturnType<typeof createFizaModel> | null = null;
  let mixer: THREE.AnimationMixer | null = null;
  let walk: THREE.AnimationAction | null = null;
  const bones: Record<string, THREE.Bone> = {};
  const rest = new Map<THREE.Bone, THREE.Quaternion>();
  const IDLE = ["Spine", "Spine2", "Neck", "Head"];
  const blink = { value: 0 };
  const owned: { dispose(): void }[] = [];
  let disposed = false;
  const aniso = renderer ? renderer.capabilities.getMaxAnisotropy() : 8;

  const ready = loadOnce().then((loaded) => {
    if (disposed) return false;
    if (!loaded) {
      fallback = createFizaModel();
      fallback.stage.visible = false;
      root.add(fallback.root);
      return fallback.ready;
    }
    const model = cloneSkinned(loaded.scene) as THREE.Group;
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const s = HEIGHT / box.getSize(new THREE.Vector3()).y;
    const body = new THREE.Group();
    body.scale.setScalar(s);
    body.position.y = -box.min.y * s;
    body.add(model);
    root.add(body);

    model.traverse((o) => {
      const m = o as THREE.Mesh;
      if ((o as THREE.Bone).isBone) {
        const key = o.name.replace(/^mixamorig:?/, "");
        bones[key] = o as THREE.Bone;
        rest.set(o as THREE.Bone, o.quaternion.clone());
      }
      if (!m.isMesh) return;
      m.layers.enable(MASK_LAYER); // traced by the hero's silhouette outline
      m.castShadow = true;
      m.frustumCulled = false;
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.metalness = Math.min(mat.metalness, 0.05);
      mat.roughness = Math.max(mat.roughness, 0.45);
      for (const t of [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap]) if (t) t.anisotropy = aniso;
      if (mat.map) {
        const maskTex = new THREE.TextureLoader().load(BLINK_MASK);
        maskTex.flipY = false;
        maskTex.colorSpace = THREE.NoColorSpace;
        // thin lash line: keep it sharp at a distance instead of averaging it away
        maskTex.generateMipmaps = false;
        maskTex.minFilter = THREE.LinearFilter;
        owned.push(maskTex);
        mat.onBeforeCompile = (shader) => {
          shader.uniforms.uBlink = blink;
          shader.uniforms.uBlinkMask = { value: maskTex };
          shader.uniforms.uSkin = { value: SKIN };
          shader.uniforms.uLash = { value: LASH };
          shader.fragmentShader = "uniform float uBlink;\nuniform sampler2D uBlinkMask;\nuniform vec3 uSkin;\nuniform vec3 uLash;\n" + shader.fragmentShader.replace(
            "#include <map_fragment>",
            "#include <map_fragment>\nif (uBlink > 0.001) { vec2 bm = texture2D(uBlinkMask, vMapUv).rg; diffuseColor.rgb = mix(diffuseColor.rgb, uSkin, bm.r * uBlink); diffuseColor.rgb = mix(diffuseColor.rgb, uLash, bm.g * uBlink); }",
          );
        };
      }
      mat.needsUpdate = true;
    });

    // crisp geometry glasses, carried by the head bone
    const head = bones.Head;
    if (head) {
      root.updateMatrixWorld(true);
      const glasses = createGlasses({ r: 1, gap: GLASSES.gap / GLASSES.r, depth: GLASSES.depth, wire: GLASSES.wire, flare: GLASSES.flare, drop: GLASSES.drop, bias: GLASSES.bias });
      owned.push(glasses);
      glasses.group.traverse((o) => o.layers.enable(MASK_LAYER));
      glasses.group.scale.setScalar(GLASSES.r);
      glasses.group.rotation.set(GLASSES.tilt, 0, GLASSES.roll);
      // placed in the root's frame (she faces +z there), then handed to the head
      glasses.group.position.copy(root.worldToLocal(head.getWorldPosition(new THREE.Vector3()))).add(GLASSES.offset);
      root.add(glasses.group);
      glasses.group.updateMatrixWorld(true);
      head.attach(glasses.group);
    }

    const clip = loaded.clips.find((c) => c.name === WALK_CLIP) ?? loaded.clips.find((c) => /walk/i.test(c.name));
    mixer = new THREE.AnimationMixer(model);
    if (clip) {
      walk = mixer.clipAction(inPlace(clip));
      walk.setEffectiveWeight(0);
      walk.play();
    }

    return true;
  });

  let time = 0;
  let walkRate = 1; // the hero slows the cycle so her steps match a gentle stroll
  let stride = 0;
  let nextBlink = 1.2;
  let blinkT = -1;
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const sway = (name: string, x: number, y: number, z: number) => {
    const b = bones[name];
    if (!b) return;
    e.set(x, y, z); q.setFromEuler(e);
    b.quaternion.multiply(q);
  };

  function update(dt: number, isWalking = false) {
    if (fallback) { fallback.update(dt, isWalking); return; }
    if (!mixer) return;
    time += dt;
    stride = THREE.MathUtils.lerp(stride, isWalking ? 1 : 0, 1 - Math.exp(-dt * 6));
    if (walk) { walk.setEffectiveWeight(stride); walk.timeScale = walkRate; }

    /* The mixer only writes a bone when its value changes, so put the idle
       bones back to rest first; otherwise the idle motion would pile up. */
    for (const n of IDLE) { const b = bones[n]; const r = b && rest.get(b); if (b && r) b.quaternion.copy(r); }
    mixer.update(dt);
    if (stride < 0.98) {
      // standing: hold the sculpted pose, breathe, tilt the head a little
      const k = 1 - stride;
      const breath = Math.sin(time * 1.4);
      sway("Spine", breath * 0.012 * k, 0, 0);
      sway("Spine2", breath * 0.01 * k, Math.sin(time * 0.45) * 0.03 * k, 0);
      sway("Neck", 0, Math.sin(time * 0.5) * 0.04 * k, 0);
      sway("Head", Math.sin(time * 0.37) * 0.025 * k, Math.sin(time * 0.29 + 1) * 0.06 * k, Math.sin(time * 0.6) * 0.035 * k);
    }

    blinkStep(dt);
  }

  /* Blink on its own clock, so it keeps going even when the rest of her
     motion is held (reduced motion): close in 100ms, hold 140ms, open in
     160ms, so it reads even from the full-length view; every 2 to 4
     seconds, sometimes twice in a row. */
  let blinkClock = 0;
  function blinkStep(dt: number) {
    if (fallback || !mixer) return;
    blinkClock += dt;
    if (blinkT < 0 && blinkClock >= nextBlink) blinkT = 0;
    let c = 0;
    if (blinkT >= 0) {
      blinkT += dt;
      const t = blinkT;
      c = t < 0.1 ? t / 0.1 : t < 0.24 ? 1 : t < 0.4 ? 1 - (t - 0.24) / 0.16 : 0;
      if (t >= 0.4) { blinkT = -1; nextBlink = blinkClock + (Math.random() < 0.2 ? 0.35 : 2 + Math.random() * 2); }
    }
    blink.value = c;
  }

  return {
    container,
    root,
    stage,
    ready,
    update,
    blinkStep,
    setWalkRate(r: number) { walkRate = r; },
    dispose() {
      disposed = true;
      fallback?.dispose();
      mixer?.stopAllAction();
      for (const o of owned) o.dispose();
      stageGeometry.dispose();
      stageMaterial.dispose();
    },
  };
}
