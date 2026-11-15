import * as THREE from "three";

/*
 * Thin round glasses built from geometry, so the frames stay crisp at any
 * distance (sculpted glasses melt into the face once the mesh is simplified).
 * Built around the origin, lenses facing +z, in units of the lens radius;
 * the caller scales and places the group in front of the eyes.
 *
 * Her curls cover the side of her head right behind the eyes, so arms that
 * follow the head would vanish there. `bias` (world units) pulls the arms'
 * depth toward the camera: they read through the nearby hair all the way to
 * the ear, while the far arm still hides behind her head.
 */
export function createGlasses({ r = 1, gap = 0.36, wire = 0.055, depth = 3.4, flare = 0.35, drop = 0.5, bias = 0 } = {}) {
  const group = new THREE.Group();
  group.name = "FizaGlasses";
  const owned: { dispose(): void }[] = [];
  const frame = new THREE.MeshStandardMaterial({ color: 0x24160f, metalness: 0.55, roughness: 0.32 });
  const lens = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.1,
    clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false, envMapIntensity: 1.6,
  });
  const arm = frame.clone();
  arm.onBeforeCompile = (shader) => {
    shader.uniforms.uBias = { value: bias };
    shader.vertexShader = "uniform float uBias;\n" + shader.vertexShader.replace(
      "#include <project_vertex>",
      "#include <project_vertex>\n{ vec4 b = projectionMatrix * (mvPosition + vec4(0.0, 0.0, uBias, 0.0)); gl_Position.z = b.z / b.w * gl_Position.w; }",
    );
  };
  owned.push(frame, lens, arm);
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, at?: THREE.Vector3) => {
    const m = new THREE.Mesh(geo, mat);
    if (at) m.position.copy(at);
    m.castShadow = mat !== lens;
    owned.push(geo);
    group.add(m);
    return m;
  };

  const cx = r + gap / 2; // lens centre from the middle of the nose
  for (const side of [-1, 1]) {
    add(new THREE.TorusGeometry(r, wire, 10, 72), frame, new THREE.Vector3(side * cx, 0, 0));
    const glass = add(new THREE.CircleGeometry(r * 0.985, 56), lens, new THREE.Vector3(side * cx, 0, -wire * 0.2));
    glass.renderOrder = 2;
    // temple: from the outer edge of the rim, back along the side of the head
    // to the ear, where it bends down
    const edge = side * (cx + r);
    const temple = new THREE.CatmullRomCurve3([
      new THREE.Vector3(edge, r * 0.18, 0),
      new THREE.Vector3(edge + side * r * flare * 0.6, r * 0.2, -r * 0.35),
      new THREE.Vector3(edge + side * r * flare, r * 0.12, -depth * r * 0.6),
      new THREE.Vector3(edge + side * r * flare * 0.7, -r * drop, -depth * r),
    ]);
    add(new THREE.TubeGeometry(temple, 48, wire * 0.85, 8, false), arm);
  }
  // bridge: a small raised arc between the rims
  const bridge = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-gap / 2 - wire * 0.5, r * 0.2, 0),
    new THREE.Vector3(0, r * 0.42, r * 0.08),
    new THREE.Vector3(gap / 2 + wire * 0.5, r * 0.2, 0),
  );
  add(new THREE.TubeGeometry(bridge, 20, wire * 0.9, 8, false), frame);

  return { group, dispose: () => owned.forEach((o) => o.dispose()) };
}
