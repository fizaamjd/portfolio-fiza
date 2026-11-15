import * as THREE from "three";

/*
 * A glow that runs around the character's silhouette, like an edge light in
 * a game: a bright butter head with a fading comet tail, circling her
 * clockwise. Nothing glows where it isn't, so there is no fixed outline.
 *
 * How: the character is rendered flat white into a small mask (camera layer
 * MASK_LAYER, so the stage and lights are left out), a second pass grows that
 * mask into a halo that fades away from her edge, keeps only the part outside
 * her, and the halo is painted on the canvas before the scene, so she always
 * sits on top of it. Both passes run at up to 2x CSS pixels, so the edge
 * stays crisp on retina screens without paying for the full canvas size.
 */
export const MASK_LAYER = 5;

const FULLSCREEN_VERT = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

const RING_FRAG = `
uniform sampler2D tMask; uniform vec2 uTexel; uniform float uWidth;
varying vec2 vUv;
void main(){
  float inside = texture2D(tMask, vUv).a;
  // a soft halo: nearer rings count for more, so it fades out from her edge
  float glow = 0.0;
  for (int r = 1; r <= 4; r++) {
    float rad = uWidth * float(r) / 4.0;
    float wgt = 1.0 - (float(r) - 1.0) / 4.0;
    for (int i = 0; i < 16; i++) {
      float a = (float(i) + 0.5 * float(r)) / 16.0 * 6.2831853;
      glow = max(glow, texture2D(tMask, vUv + vec2(cos(a), sin(a)) * uTexel * rad).a * wgt);
    }
  }
  glow = glow * glow * (3.0 - 2.0 * glow);
  gl_FragColor = vec4(glow * (1.0 - smoothstep(0.35, 0.65, inside)));
}`;

const PAINT_FRAG = `
uniform sampler2D tRing; uniform vec3 uColor; uniform vec3 uGlint;
uniform vec2 uCenter; uniform float uAspect; uniform float uHead; uniform float uTail; uniform float uStrength;
varying vec2 vUv;
void main(){
  float a = texture2D(tRing, vUv).r;
  if (a < 0.01) discard;
  vec2 d = (vUv - uCenter) * vec2(uAspect, 1.0);
  float ang = fract(atan(d.x, d.y) / 6.2831853 + 1.0);   // 0 at the top, clockwise
  float behind = fract(uHead - ang);                       // 0 at the head, growing along the tail
  float ahead = fract(ang - uHead);
  float tail = behind < uTail ? pow(1.0 - behind / uTail, 1.6) : 0.0;
  float lead = 1.0 - smoothstep(0.0, 0.012, ahead);        // soft front edge on the head
  float k = a * max(tail, lead) * uStrength;
  if (k < 0.01) discard;
  float hot = 1.0 - smoothstep(0.0, 0.05, min(behind, ahead));
  vec3 col = mix(uColor, uGlint, hot);
  float alpha = clamp(k * (0.85 + 0.55 * hot), 0.0, 1.0);
  gl_FragColor = vec4(col * alpha, alpha);   // premultiplied, for the transparent canvas
}`;

export function createSilhouetteOutline(renderer: THREE.WebGLRenderer, { color = 0xf7dc8a, glint = 0xfffaea, width = 10, tail = 0.3 } = {}) {
  const opts = { type: THREE.UnsignedByteType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true };
  const maskRT = new THREE.WebGLRenderTarget(2, 2, opts);
  const ringRT = new THREE.WebGLRenderTarget(2, 2, { ...opts, depthBuffer: false });
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const ring = new THREE.ShaderMaterial({
    vertexShader: FULLSCREEN_VERT, fragmentShader: RING_FRAG, depthTest: false, depthWrite: false,
    uniforms: { tMask: { value: maskRT.texture }, uTexel: { value: new THREE.Vector2() }, uWidth: { value: width } },
  });
  // colours are given as sRGB and written straight to the canvas
  const toVec = (hex: number) => { const c = new THREE.Color(); c.setHex(hex, THREE.LinearSRGBColorSpace); return new THREE.Vector3(c.r, c.g, c.b); };
  const paint = new THREE.ShaderMaterial({
    vertexShader: FULLSCREEN_VERT, fragmentShader: PAINT_FRAG, depthTest: false, depthWrite: false, blending: THREE.NoBlending,
    uniforms: {
      tRing: { value: ringRT.texture }, uColor: { value: toVec(color) }, uGlint: { value: toVec(glint) },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) }, uAspect: { value: 1 }, uHead: { value: 0 }, uTail: { value: tail }, uStrength: { value: 1 },
    },
  });

  const size = new THREE.Vector2();
  function setSize(cssW: number, cssH: number) {
    const scale = Math.min(renderer.getPixelRatio(), 2);
    const w = Math.max(2, Math.round(cssW * scale)), h = Math.max(2, Math.round(cssH * scale));
    maskRT.setSize(w, h); ringRT.setSize(w, h);
    ring.uniforms.uTexel.value.set(1 / w, 1 / h);
    ring.uniforms.uWidth.value = width * scale;
    paint.uniforms.uAspect.value = w / h;
    size.set(w, h);
  }

  const clear = new THREE.Color();
  const v = new THREE.Vector3();
  /**
   * Draws the scene with the travelling glow behind the character.
   * `center` is a world point at the middle of her body; `head` 0..1 is where
   * the glow's bright head sits around her, clockwise from the top (null: no
   * glow); `strength` 0..1 fades the whole thing in or out.
   */
  function render(scene: THREE.Scene, camera: THREE.Camera, center: THREE.Vector3, head: number | null, strength = 1) {
    const on = head !== null && strength > 0;
    const prevClear = renderer.getClearColor(clear), prevAlpha = renderer.getClearAlpha();
    const prevAuto = renderer.autoClear, prevShadow = renderer.shadowMap.autoUpdate, prevOverride = scene.overrideMaterial;
    const prevMask = camera.layers.mask;

    if (on) {
      // 1. her silhouette, flat white
      renderer.shadowMap.autoUpdate = false;
      camera.layers.set(MASK_LAYER);
      scene.overrideMaterial = white;
      renderer.setRenderTarget(maskRT);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(scene, camera);
      scene.overrideMaterial = prevOverride;
      camera.layers.mask = prevMask;
      renderer.shadowMap.autoUpdate = prevShadow;

      // 2. a soft halo just outside it
      quad.material = ring;
      renderer.setRenderTarget(ringRT);
      renderer.clear();
      renderer.render(quadScene, quadCam);
    }

    // 3. paint the moving part of the halo, then the scene on top
    renderer.setRenderTarget(null);
    renderer.setClearColor(prevClear, prevAlpha);
    renderer.clear();
    if (on) {
      v.copy(center).project(camera);
      paint.uniforms.uCenter.value.set(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5);
      paint.uniforms.uHead.value = head;
      paint.uniforms.uStrength.value = strength;
      quad.material = paint;
      renderer.render(quadScene, quadCam);
    }
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(scene, camera);
    renderer.autoClear = prevAuto;
  }

  return {
    setSize,
    render,
    dispose() {
      maskRT.dispose(); ringRT.dispose(); white.dispose(); ring.dispose(); paint.dispose(); quad.geometry.dispose();
    },
  };
}
