import * as THREE from 'three';

/**
 * Fiza, built from geometry rather than loaded from an asset.
 *
 * The previous version fetched /models/fiza-character.glb through GLTFLoader.
 * That file was never authored, so the loader 404'd, `ready` resolved false and
 * the portrait rendered an empty stage: the character was not boring, it was
 * absent. Everything below is primitives, lathes and extrusions assembled in
 * code, so there is no asset to go missing and nothing to download.
 *
 * The figure stands on y=0 and is a shade under 5 units tall, which is the
 * height the camera in FizaCharacter was already framed for.
 *
 * Returns the same shape the old module did - container, root, stage, ready,
 * update, dispose - so FizaCharacter and PaperGameScene need no changes.
 */

const SKIN = 0xe3b291;
const SKIN_SHADE = 0xd49c79;
const HAIR = 0x452a1c;
const HAIR_LIT = 0x5c3a26;
const TOP = 0xeee6da;
const DENIM = 0x2a5f86;
const DENIM_DARK = 0x1f4a6a;
const RED = 0x7b2233;
const BOOT = 0x1d1d20;
const BOOT_SOLE = 0x2c2c30;
const METAL = 0xc9ced5;
const DARK = 0x241c17;

/** Deterministic noise, so the curls land in the same place on every load. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Kit = {
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
};

function makeKit(): Kit {
  return { geometries: [], materials: [] };
}

function material(kit: Kit, color: number, roughness = 0.72, metalness = 0) {
  const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  kit.materials.push(m);
  return m;
}

function mesh(kit: Kit, geometry: THREE.BufferGeometry, mat: THREE.Material) {
  kit.geometries.push(geometry);
  const m = new THREE.Mesh(geometry, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * A box with its edges taken off. Everything she wears is soft goods or moulded
 * rubber, and a hard 90 degree corner reads as cardboard next to the rest.
 */
function roundedBox(w: number, h: number, d: number, r = 0.04) {
  const shape = new THREE.Shape();
  const x = w / 2 - r;
  const y = h / 2 - r;
  shape.moveTo(-x, -y - r);
  shape.lineTo(x, -y - r);
  shape.quadraticCurveTo(x + r, -y - r, x + r, -y);
  shape.lineTo(x + r, y);
  shape.quadraticCurveTo(x + r, y + r, x, y + r);
  shape.lineTo(-x, y + r);
  shape.quadraticCurveTo(-x - r, y + r, -x - r, y);
  shape.lineTo(-x - r, -y);
  shape.quadraticCurveTo(-x - r, -y - r, -x, -y - r);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: d - r * 2,
    bevelEnabled: true,
    bevelSize: r,
    bevelThickness: r,
    bevelSegments: 3,
    curveSegments: 6,
  });
  g.translate(0, 0, -(d - r * 2) / 2);
  g.computeVertexNormals();
  return g;
}

/** One wide-leg cargo trouser, lathed from its own silhouette. */
function trouserLeg(kit: Kit, cloth: THREE.Material, shadow: THREE.Material) {
  const leg = new THREE.Group();

  /* The silhouette is the whole point of the reference: narrow at the hip,
     barely shaped at the knee, then a long flare that puddles over the boot. */
  const profile = [
    new THREE.Vector2(0.325, 2.78),
    new THREE.Vector2(0.34, 2.35),
    new THREE.Vector2(0.345, 1.85),
    new THREE.Vector2(0.335, 1.38),
    new THREE.Vector2(0.385, 1.0),
    new THREE.Vector2(0.455, 0.62),
    new THREE.Vector2(0.5, 0.42),
    new THREE.Vector2(0.49, 0.3),
    new THREE.Vector2(0.33, 0.275),
    new THREE.Vector2(0, 0.27),
  ];
  leg.add(mesh(kit, new THREE.LatheGeometry(profile, 28), cloth));

  /* Cargo pockets: a panel on the outer thigh and a smaller one below it, each
     with its own flap. Slightly proud of the leg so they catch the key light. */
  const pocket = (y: number, w: number, h: number) => {
    const g = new THREE.Group();
    const body = mesh(kit, roundedBox(w, h, 0.07, 0.025), cloth);
    const flap = mesh(kit, roundedBox(w * 0.96, h * 0.3, 0.075, 0.02), shadow);
    flap.position.y = h / 2 - h * 0.12;
    g.add(body, flap);
    g.position.set(0.3, y, 0.06);
    g.rotation.y = Math.PI / 2.3;
    return g;
  };
  leg.add(pocket(1.52, 0.34, 0.42), pocket(0.95, 0.26, 0.26));

  /* The pressed crease down the front. Without it the widest, flattest part of
     the figure has nothing to describe its form. */
  const crease = mesh(kit, roundedBox(0.03, 1.95, 0.03, 0.012), shadow);
  crease.position.set(0.02, 1.42, 0.33);
  crease.rotation.x = -0.04;
  leg.add(crease);

  /* Two creases where the hem stacks on the boot. */
  for (const y of [0.46]) {
    const ring = mesh(kit, new THREE.TorusGeometry(0.465, 0.026, 6, 24), shadow);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    leg.add(ring);
  }
  return leg;
}

/** Chunky platform boot. */
function boot(kit: Kit, upper: THREE.Material, sole: THREE.Material) {
  const g = new THREE.Group();
  const platform = mesh(kit, roundedBox(0.52, 0.2, 0.86, 0.06), sole);
  platform.position.set(0, 0.085, 0.06);
  const tread = mesh(kit, roundedBox(0.54, 0.06, 0.88, 0.025), sole);
  tread.position.set(0, 0.025, 0.06);
  const shoe = mesh(kit, roundedBox(0.47, 0.34, 0.74, 0.1), upper);
  shoe.position.set(0, 0.36, 0.04);
  const cuff = mesh(kit, new THREE.CylinderGeometry(0.24, 0.23, 0.22, 16), upper);
  cuff.position.set(0, 0.58, -0.04);
  g.add(platform, tread, shoe, cuff);
  return g;
}

/**
 * An arm as a posed chain: shoulder rotates the whole limb, elbow rotates the
 * forearm and the hand hangs off the end, so a pose is three numbers rather
 * than hand-placed meshes.
 */
function arm(kit: Kit, sleeve: THREE.Material, skin: THREE.Material) {
  const shoulder = new THREE.Group();
  const upper = mesh(kit, new THREE.CapsuleGeometry(0.1, 0.42, 4, 14), sleeve);
  upper.position.y = -0.3;
  shoulder.add(upper);

  const elbow = new THREE.Group();
  elbow.position.y = -0.58;
  shoulder.add(elbow);

  const fore = mesh(kit, new THREE.CapsuleGeometry(0.088, 0.38, 4, 14), sleeve);
  fore.position.y = -0.28;
  elbow.add(fore);

  /* The top is long-sleeved, so skin only appears at the very end. */
  const wrist = mesh(kit, new THREE.CylinderGeometry(0.082, 0.078, 0.07, 12), skin);
  wrist.position.y = -0.52;
  const hand = mesh(kit, new THREE.SphereGeometry(0.1, 14, 12), skin);
  hand.scale.set(1, 1.15, 0.72);
  hand.position.y = -0.63;
  elbow.add(wrist, hand);

  return { shoulder, elbow, hand };
}

export function createFizaModel() {
  const kit = makeKit();
  const container = new THREE.Group();
  const root = new THREE.Group();
  container.add(root);
  root.rotation.y = -0.1;
  /* The camera in FizaCharacter is framed for a five unit figure. */
  root.scale.setScalar(1.16);

  const skin = material(kit, SKIN, 0.62);
  const skinShade = material(kit, SKIN_SHADE, 0.66);
  const hairMat = material(kit, HAIR, 0.78);
  const hairLit = material(kit, HAIR_LIT, 0.74);
  const topMat = material(kit, TOP, 0.84);
  const denim = material(kit, DENIM, 0.86);
  const denimDark = material(kit, DENIM_DARK, 0.88);
  const red = material(kit, RED, 0.7);
  const bootMat = material(kit, BOOT, 0.64);
  const soleMat = material(kit, BOOT_SOLE, 0.82);
  const metal = material(kit, METAL, 0.34, 0.65);
  const dark = material(kit, DARK, 0.5);

  /* ---- legs and boots ------------------------------------------------- */
  const lowerBody = new THREE.Group();
  const legs: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.x = side * 0.275;
    const trouser = trouserLeg(kit, denim, denimDark);
    trouser.scale.x = side;
    const shoe = boot(kit, bootMat, soleMat);
    shoe.position.set(side * 0.02, 0, 0);
    shoe.rotation.y = side * 0.09;
    leg.add(trouser, shoe);
    legs.push(leg);
    lowerBody.add(leg);
  }

  /* The seat, bridging the two lathes so the hips are not two tubes. */
  const seat = mesh(kit, new THREE.SphereGeometry(0.42, 22, 16), denim);
  seat.scale.set(1.06, 0.66, 0.9);
  seat.position.y = 2.72;
  lowerBody.add(seat);
  root.add(lowerBody);

  /* ---- belt ------------------------------------------------------------ */
  const belt = new THREE.Group();
  belt.position.y = 2.96;
  const band = mesh(kit, new THREE.TorusGeometry(0.4, 0.045, 8, 32), red);
  band.rotation.x = Math.PI / 2;
  band.scale.set(1.06, 0.92, 1);
  belt.add(band);

  /* The long tail hanging down the front, and the little charm on its ring. */
  const tail = mesh(kit, roundedBox(0.1, 0.72, 0.04, 0.015), red);
  tail.position.set(-0.14, -0.38, 0.37);
  tail.rotation.x = -0.12;
  const tip = mesh(kit, new THREE.ConeGeometry(0.056, 0.12, 4), red);
  tip.position.set(-0.14, -0.78, 0.35);
  tip.rotation.y = Math.PI / 4;
  const ring = mesh(kit, new THREE.TorusGeometry(0.055, 0.016, 8, 18), metal);
  ring.position.set(0.1, -0.09, 0.38);
  const charm = mesh(kit, roundedBox(0.12, 0.14, 0.07, 0.03), red);
  charm.position.set(0.1, -0.24, 0.38);
  const stud = mesh(kit, new THREE.SphereGeometry(0.026, 10, 8), topMat);
  stud.position.set(0.1, -0.24, 0.42);
  belt.add(tail, tip, ring, charm, stud);
  root.add(belt);

  /* ---- torso ----------------------------------------------------------- */
  const torso = new THREE.Group();
  torso.position.y = 2.96;

  /* Bare midriff between the belt and the cropped hem. */
  const waist = mesh(kit, new THREE.CylinderGeometry(0.33, 0.37, 0.3, 22), skin);
  waist.position.y = 0.14;
  const navel = mesh(kit, new THREE.SphereGeometry(0.022, 8, 8), skinShade);
  navel.position.set(0, 0.1, 0.33);
  torso.add(waist, navel);

  const shirt = mesh(
    kit,
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.33, 0.3),
        new THREE.Vector2(0.355, 0.5),
        new THREE.Vector2(0.38, 0.72),
        new THREE.Vector2(0.385, 0.9),
        new THREE.Vector2(0.355, 1.02),
        new THREE.Vector2(0.25, 1.08),
        new THREE.Vector2(0.16, 1.1),
        new THREE.Vector2(0, 1.11),
      ],
      26,
    ),
    topMat,
  );
  torso.add(shirt);
  root.add(torso);

  /* ---- head ------------------------------------------------------------ */
  const head = new THREE.Group();
  head.position.y = 4.02;

  const neck = mesh(kit, new THREE.CylinderGeometry(0.11, 0.13, 0.17, 14), skin);
  neck.position.y = -0.06;
  head.add(neck);

  const skull = mesh(kit, new THREE.SphereGeometry(0.285, 28, 24), skin);
  skull.scale.set(0.92, 1.04, 0.94);
  skull.position.y = 0.3;
  const jaw = mesh(kit, new THREE.SphereGeometry(0.19, 20, 16), skin);
  jaw.scale.set(1, 0.9, 1);
  jaw.position.set(0, 0.16, 0.05);
  head.add(skull, jaw);

  /* Eyes sit behind the lenses, so they are simple and dark on purpose. */
  for (const side of [-1, 1]) {
    const eye = mesh(kit, new THREE.SphereGeometry(0.047, 14, 12), dark);
    eye.position.set(side * 0.115, 0.3, 0.277);
    const brow = mesh(kit, roundedBox(0.1, 0.022, 0.02, 0.008), hairMat);
    brow.position.set(side * 0.12, 0.385, 0.285);
    brow.rotation.z = side * 0.1;
    head.add(eye, brow);
  }
  const nose = mesh(kit, new THREE.SphereGeometry(0.035, 10, 8), skinShade);
  nose.scale.set(0.8, 0.9, 1.1);
  nose.position.set(0, 0.235, 0.305);
  const mouth = mesh(kit, new THREE.TorusGeometry(0.052, 0.012, 6, 14, Math.PI * 0.8), dark);
  mouth.rotation.set(Math.PI, 0, Math.PI * 0.1);
  mouth.position.set(0, 0.16, 0.285);
  head.add(nose, mouth);

  /* Round wire glasses: two rims, a bridge, and arms back to the hair. */
  const glasses = new THREE.Group();
  for (const side of [-1, 1]) {
    const rim = mesh(kit, new THREE.TorusGeometry(0.097, 0.014, 8, 26), dark);
    rim.position.set(side * 0.12, 0.3, 0.285);
    const lens = mesh(
      kit,
      new THREE.CircleGeometry(0.093, 22),
      (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0xdfe9f0,
          roughness: 0.12,
          metalness: 0.1,
          transparent: true,
          opacity: 0.22,
        });
        kit.materials.push(m);
        return m;
      })(),
    );
    lens.position.set(side * 0.12, 0.3, 0.284);
    const temple = mesh(kit, roundedBox(0.02, 0.016, 0.22, 0.006), dark);
    temple.position.set(side * 0.205, 0.3, 0.19);
    glasses.add(rim, lens, temple);
  }
  const bridge = mesh(kit, roundedBox(0.07, 0.014, 0.016, 0.005), dark);
  bridge.position.set(0, 0.315, 0.285);
  glasses.add(bridge);
  head.add(glasses);

  /**
   * The hair is the silhouette that makes her recognisable, so it gets the most
   * geometry: a skull cap, then a seeded cloud of spheres packed around and
   * below it. Seeded, so the curls are identical on every load rather than
   * rearranging themselves between renders.
   */
  const hair = new THREE.Group();
  hair.position.y = 0.3;
  const cap = mesh(kit, new THREE.SphereGeometry(0.308, 24, 20), hairMat);
  cap.scale.set(0.96, 1.02, 0.98);
  cap.position.y = 0.025;
  hair.add(cap);

  const rand = seeded(20261031);
  const curlGeo = new THREE.SphereGeometry(1, 9, 8);
  kit.geometries.push(curlGeo);
  for (let i = 0; i < 112; i++) {
    const t = i / 112;
    /* Wrap the curls around the head and let them fall past the shoulders,
       heavier at the sides than across the face. */
    const yaw = rand() * Math.PI * 2;
    const drop = Math.pow(rand(), 0.7);
    const front = Math.cos(yaw);
    let y = 0.28 - drop * 0.78;
    /* Anything that would land across the face is lifted into the fringe
       above the brow instead, so the glasses and the eyes stay readable. */
    if (front > 0.25 && y > -0.42) y = Math.max(y, 0.24);
    const spread = 0.258 + drop * 0.115 + rand() * 0.045;
    const faceGuard = front > 0.25 ? 0.085 : 0;
    const curl = new THREE.Mesh(curlGeo, t % 3 === 0 ? hairLit : hairMat);
    curl.position.set(
      Math.sin(yaw) * spread,
      y + Math.sin(yaw * 3) * 0.04,
      Math.cos(yaw) * (spread - faceGuard) - 0.02,
    );
    const r = (0.05 + rand() * 0.034) * (1 + drop * 0.55);
    curl.scale.setScalar(r);
    curl.castShadow = true;
    hair.add(curl);
  }
  head.add(hair);
  root.add(head);

  /* ---- arms, and what is in her hands ---------------------------------- */
  /* Rotating about Z sends a downward limb to +x whichever side it is on, so
     the two arms need opposite signs or they both swing across the body. */
  const left = arm(kit, topMat, skin); // her right, screen left: the drink
  left.shoulder.position.set(-0.33, 3.74, 0.02);
  left.shoulder.rotation.set(0, 0, -0.3);
  left.elbow.rotation.set(-2.0, 0, -0.12);
  root.add(left.shoulder);

  const right = arm(kit, topMat, skin); // her left, screen right: the laptop
  right.shoulder.position.set(0.33, 3.74, 0.02);
  right.shoulder.rotation.set(0.04, 0, 0.2);
  right.elbow.rotation.set(-0.5, 0, -0.1);
  root.add(right.shoulder);

  /* Iced coffee, sitting in the raised hand. */
  const drink = new THREE.Group();
  const cupGeo = new THREE.CylinderGeometry(0.105, 0.082, 0.3, 20, 1, true);
  const cupMat = new THREE.MeshStandardMaterial({
    color: 0xe7dfd6,
    roughness: 0.2,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });
  kit.materials.push(cupMat);
  drink.add(mesh(kit, cupGeo, cupMat));
  const coffee = mesh(kit, new THREE.CylinderGeometry(0.098, 0.08, 0.23, 20), material(kit, 0x6b4426, 0.42));
  coffee.position.y = -0.03;
  const lid = mesh(kit, new THREE.CylinderGeometry(0.115, 0.112, 0.035, 20), topMat);
  lid.position.y = 0.16;
  const straw = mesh(kit, new THREE.CylinderGeometry(0.016, 0.016, 0.34, 10), red);
  straw.position.set(0.03, 0.3, 0.01);
  straw.rotation.z = -0.18;
  drink.add(coffee, lid, straw);
  drink.position.set(0, -0.02, 0.1);
  drink.rotation.x = 2.0; // cancel the forearm's rotation so the cup stays level
  left.hand.add(drink);

  /* Laptop, tucked under the other arm. */
  const laptop = new THREE.Group();
  const base = mesh(kit, roundedBox(0.62, 0.035, 0.44, 0.012), metal);
  const screen = mesh(kit, roundedBox(0.62, 0.42, 0.028, 0.012), metal);
  screen.position.set(0, 0.2, -0.21);
  screen.rotation.x = -0.22;
  laptop.add(base, screen);
  laptop.rotation.set(0.5 + Math.PI / 2, 0.16, 0.3);
  laptop.position.set(-0.04, 0.26, -0.03);
  right.hand.add(laptop);

  /* ---- the stage she stands on ----------------------------------------- */
  const stageGeometry = new THREE.CylinderGeometry(1.82, 1.95, 0.1, 80);
  const stageMaterial = new THREE.MeshStandardMaterial({ color: 0xc3d5e1, roughness: 0.95 });
  const stage = new THREE.Mesh(stageGeometry, stageMaterial);
  stage.position.y = -0.055;
  stage.receiveShadow = true;
  container.add(stage);

  /* ---- motion ----------------------------------------------------------- */
  let time = 0;
  let stride = 0;

  function update(dt: number, isWalking = false) {
    time += dt;
    stride = THREE.MathUtils.lerp(stride, isWalking ? 1 : 0, 1 - Math.exp(-dt * 7));

    /* Breathing: the chest lifts and the shoulders follow it a beat later. */
    const breath = Math.sin(time * 1.45);
    torso.scale.set(1 + breath * 0.012, 1 + breath * 0.008, 1 + breath * 0.012);
    head.position.y = 4.02 + breath * 0.012;
    head.rotation.z = Math.sin(time * 0.6) * 0.022;

    /* The raised arm drifts; the laptop arm stays put because it is carrying. */
    left.shoulder.rotation.z = -0.3 + Math.sin(time * 1.1) * 0.03;
    left.elbow.rotation.x = -2.0 + Math.sin(time * 1.1 + 0.6) * 0.035;
    right.shoulder.rotation.z = 0.2 + breath * 0.012;

    /* Hair lags behind the body, which is most of what sells it as hair. */
    hair.rotation.z = Math.sin(time * 0.9) * 0.028;
    hair.position.y = 0.3 + breath * 0.008;

    const swing = Math.sin(time * 7.2) * 0.42 * stride;
    legs[0].rotation.x = swing;
    legs[1].rotation.x = -swing;
    root.position.y = stride * Math.abs(Math.sin(time * 7.2)) * 0.045;
  }

  return {
    container,
    root,
    stage,
    /* Nothing to fetch, so the portrait can show itself on the first frame. */
    ready: Promise.resolve(true),
    update,
    dispose() {
      for (const g of kit.geometries) g.dispose();
      for (const m of kit.materials) m.dispose();
      stageGeometry.dispose();
      stageMaterial.dispose();
    },
  };
}
