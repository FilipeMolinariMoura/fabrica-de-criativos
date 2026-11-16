// props.js: os objetos da bancada que o roteiro cita, modelados em código (centímetros).
// Cada construtor devolve um Group; o que anima fica em userData e é posto a partir de t no film.js.
import * as THREE from 'three';
import { slab, squircle, envSpecOnly, flaggedSpec, coverGlass, fitMap } from '../../lib/3d/models.js';
import { label, textTexture } from './telas.js';

const RAD = Math.PI / 180;
const shadow = (m, cast = true) => { m.castShadow = cast; m.receiveShadow = true; return m; };
const basic = (color, k = 1, o = {}) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), ...o });
const metal = (color, rough = 0.36, grain = null, o = {}) => flaggedSpec(new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: rough, roughnessMap: grain ? fitMap(grain, 0.9, 0.9) : null, ...o }));
// polished metal lit by the environment only: a jittered light would print one dot per sample on it
const chrome = (color, rough = 0.22, grain = null) => envSpecOnly(new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: rough, roughnessMap: grain ? fitMap(grain, 0.9, 0.9) : null }));
const flat = (tex, w, h, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, ...o }));

// Contact shadow: what the sky-dome occlusion cannot resolve in the last millimetres under an object.
// A soft multiply decal the size of the footprint (+ margin), lying on the bench.
export function contact(w, d, k = 0.55, margin = 1.4) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w + 2 * margin, d + 2 * margin), new THREE.ShaderMaterial({
    uniforms: { k: { value: k }, e: { value: new THREE.Vector2(margin / (w / 2 + margin), margin / (d / 2 + margin)) } },
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float k; uniform vec2 e; varying vec2 vUv; void main() { vec2 q = abs(vUv - 0.5) * 2.0; float a = (1.0 - smoothstep(1.0 - e.x * 1.5, 1.0, q.x)) * (1.0 - smoothstep(1.0 - e.y * 1.5, 1.0, q.y)); gl_FragColor = vec4(vec3(1.0 - k * a * a), 1.0); }',
  }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.012; m.renderOrder = 1; m.userData.k = k;
  return m;
}

// --------------------------------------------------------------- glass timeline (shot 3)
// Clips as slabs of real tinted glass on metal rails, each lying on its own strip of content
// (thumbnails or a waveform) that the glass refracts. The playhead is an upright steel blade.
export function buildGlassTimeline(thumbs) {
  const g = new THREE.Group(), blocks = [], layers = [[], []];
  const spec = [  // x, track z, length, colour, kind
    [-13.2, -1.9, 5.6, 0x2a9d8f, 'v'], [-6.9, -1.9, 4.2, 0xff6b4a, 'v'], [-1.6, -1.9, 6.8, 0x2a9d8f, 'v'], [5.9, -1.9, 3.6, 0xf4a259, 'v'], [10.6, -1.9, 5.4, 0x2a9d8f, 'v'],
    [-11.8, 1.9, 3.8, 0xf4a259, 'a'], [-6.6, 1.9, 5.8, 0xff6b4a, 'a'], [0.4, 1.9, 4.4, 0xff6b4a, 'a'], [6.2, 1.9, 6.2, 0x2a9d8f, 'a'], [12.6, 1.9, 3.2, 0xf4a259, 'a'],
  ];
  spec.forEach(([x, z, len, col, kind], i) => {
    const common = { color: 0xffffff, metalness: 0, transmission: 1, ior: 1.49, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.04 };
    const c = new THREE.Color(col), face = envSpecOnly(new THREE.MeshPhysicalMaterial({ ...common, roughness: 0.06, thickness: 1.0, attenuationColor: c, attenuationDistance: 5.0 }));
    const side = envSpecOnly(new THREE.MeshPhysicalMaterial({ ...common, roughness: 0.05, thickness: 2.4, attenuationColor: c.clone().multiplyScalar(0.7), attenuationDistance: 0.9 }));
    const b = new THREE.Group();
    const m = new THREE.Mesh(slab(squircle(len, 2.9, 0.3, 8), 1.0, 0.1, 5), [face, side]); m.rotation.x = -Math.PI / 2; m.position.y = 0.56; m.castShadow = true; b.add(m);
    // what the clip "contains", printed on a strip under the glass
    const tex = textTexture(Math.round(len * 90), 260, (q, w, h) => {
      q.fillStyle = '#0b1114'; q.fillRect(0, 0, w, h);
      if (kind === 'v') for (let k = 0; k * 150 < w; k++) q.drawImage(thumbs[(i + k) % thumbs.length], 0, 260, 540, 420, k * 150 + 4, 6, 142, h - 12);
      else { q.fillStyle = '#' + c.getHexString(); for (let k = 0; k < w; k += 7) { const e = Math.abs(Math.sin(k * 0.21 + i * 2.1) * Math.sin(k * 0.037 + i)); q.fillRect(k, h / 2 - e * h * 0.42, 4, e * h * 0.84 + 3); } }
    });
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(len - 0.3, 2.6), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color().setScalar(2.0) })); strip.rotation.x = -Math.PI / 2; strip.position.y = 0.045; b.add(strip);
    b.position.set(x, 0, z); b.userData = { home: b.position.clone(), len, glass: m, coral: col === 0xff6b4a };
    g.add(b); blocks.push(b); layers[z < 0 ? 0 : 1].push(m);
  });
  const rail = chrome(0x8f9296, 0.24);
  for (const z of [-3.75, 0, 3.75]) { const r = shadow(new THREE.Mesh(new THREE.BoxGeometry(60, 0.16, 0.22), rail)); r.position.set(0, 0.08, z); g.add(r); }
  const needle = new THREE.Group();
  needle.add(shadow(new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.0, 8.4), chrome(0xc4c7ca, 0.18))));
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 8.6), basic(0xff6b4a, 1.6)); cap.position.y = 1.6; cap.layers.enable(1); needle.add(cap);
  needle.position.set(2.2, 1.55, 0); g.add(needle);
  g.userData = { blocks, needle, layers };
  return g;
}

// --------------------------------------------------------------- pin ruler (shots 5, 7c, 11, 12b)
export function buildPins(n = 44, grain = null) {
  const g = new THREE.Group(), pitch = 0.64, len = n * pitch + 1.2;
  const base = shadow(new THREE.Mesh(slab(squircle(len, 2.2, 0.5, 8), 1.0, 0.18, 6), metal(0x3a3d42, 0.3, grain)));
  base.rotation.x = -Math.PI / 2; base.position.y = 0.5; g.add(base); g.add(contact(len, 2.2));
  const pins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 20).translate(0, 0.5, 0), chrome(0xc9ccd0, 0.24), n);
  pins.castShadow = true; pins.receiveShadow = true; pins.frustumCulled = false; g.add(pins);
  const tips = new THREE.InstancedMesh(new THREE.SphereGeometry(0.235, 16, 10), new THREE.MeshBasicMaterial(), n);
  tips.layers.enable(1); tips.frustumCulled = false; g.add(tips);
  const M = new THREE.Matrix4(), col = new THREE.Color();
  g.userData.set = (heights, colours) => {
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * pitch, h = 0.7 + heights[i] * 6.4;
      pins.setMatrixAt(i, M.makeScale(1, h, 1).setPosition(x, 1.0, 0));
      tips.setMatrixAt(i, M.makeScale(1, 1, 1).setPosition(x, 1.0 + h + 0.12, 0));
      tips.setColorAt(i, col.set(colours[i]).multiplyScalar(0.5 + 2.2 * heights[i]));
    }
    pins.instanceMatrix.needsUpdate = true; tips.instanceMatrix.needsUpdate = true; tips.instanceColor.needsUpdate = true;
  };
  g.userData.n = n; g.userData.pitch = pitch;
  return g;
}

// --------------------------------------------------------------- word tiles (shot 6)
export function buildTiles(words) {
  const g = new THREE.Group(), tiles = [], D = 2.35, body = new THREE.MeshPhysicalMaterial({ color: 0x17181b, roughness: 0.5, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.45 });
  words.forEach((w) => {
    const W = 2.1 + w.length * 0.92, t = new THREE.Group();
    const cap = shadow(new THREE.Mesh(slab(squircle(W, D, 0.42, 8), 1.0, 0.14, 5), flaggedSpec(body.clone()))); cap.rotation.x = -Math.PI / 2; cap.position.y = 0.5; t.add(cap);
    // legends ride on the cap (it dips when its word is spoken)
    const mk = (color) => { const p = flat(label(w, { w: Math.round(W * 150), h: Math.round(D * 150), size: 196, color, weight: 560, track: -4 }), W, D); p.position.set(0, 0, 0.504); cap.add(p); return p; };
    const off = mk('#8c9498'), on = mk('#ff7a5a'); on.layers.enable(1); on.material.color.setScalar(1.9);
    t.add(contact(W, D, 0.6, 0.9));
    t.userData = { off, on, w: W, cap };
    g.add(t); tiles.push(t);
  });
  g.userData = { tiles, depth: D };
  return g;
}

// --------------------------------------------------------------- frame-rate meter (shot 9)
export function buildMeter(oledTex, grain = null) {
  const g = new THREE.Group(), W = 9.6, H = 5.6, T = 3.0;
  const body = shadow(new THREE.Mesh(slab(squircle(W, H, 0.7, 10), T, 0.22, 6), metal(0x34373b, 0.35, grain))); body.position.y = H / 2 + 0.02; g.add(body); g.add(contact(W, T));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 3.5), new THREE.MeshBasicMaterial({ map: oledTex, color: new THREE.Color().setScalar(1.7) })); win.position.set(-0.9, H / 2 + 0.15, T / 2 + 0.004); win.layers.enable(1); g.add(win);
  const gl = new THREE.Mesh(slab(squircle(6.9, 3.8, 0.3, 6), 0.05, 0.02, 2), coverGlass({ roughness: 0.05 })); gl.position.set(-0.9, H / 2 + 0.15, T / 2 + 0.03); gl.renderOrder = 2; g.add(gl);
  const leds = [];
  for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.06), basic(0x222222)); m.position.set(3.75, 0.95 + i * 0.5 + 0.02, T / 2 + 0.03); m.layers.enable(1); g.add(m); leds.push(m); }
  const screw = chrome(0x8d9094, 0.3);
  for (const [x, y] of [[-W / 2 + 0.55, 0.57], [W / 2 - 0.55, 0.57], [-W / 2 + 0.55, H - 0.53], [W / 2 - 0.55, H - 0.53]]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 6), screw); s.rotation.x = Math.PI / 2; s.position.set(x, y, T / 2 + 0.02); g.add(s); }
  g.userData.setLevel = (k) => leds.forEach((m, i) => m.material.color.set(i / 8 < k ? (i > 5 ? 0xff6b4a : 0xf4a259) : 0x1a1a1a).multiplyScalar(i / 8 < k ? 2.2 : 1));
  return g;
}

// --------------------------------------------------------------- toggle pago -> grátis (shot 10)
export function buildToggle(oledTex, grain = null) {
  const g = new THREE.Group(), W = 10.5, D = 8.4;
  const plate = shadow(new THREE.Mesh(slab(squircle(W, D, 0.9, 10), 0.9, 0.14, 6), flaggedSpec(new THREE.MeshPhysicalMaterial({ color: 0xa3a5a7, metalness: 0, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.45, roughnessMap: grain ? fitMap(grain, 0.9, 0.9) : null })))); plate.rotation.x = -Math.PI / 2; plate.position.y = 0.45; g.add(plate); g.add(contact(W, D));
  const eng = (txt, x, col) => { const p = flat(label(txt, { w: 640, h: 220, size: 150, color: col, weight: 560, track: -3 }), 2.6, 0.9); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.905, 2.75); g.add(p); return p; };
  const pago = eng('pago', -2.55, '#101416'), gratis = eng('grátis', 2.55, '#ff5a36'); gratis.layers.enable(1);
  // a round bevelled collar instead of a raw hex nut
  const nut = shadow(new THREE.Mesh(slab(squircle(2.5, 2.5, 1.25, 16), 0.55, 0.16, 6), chrome(0xa9acb0, 0.26, grain))); nut.rotation.x = -Math.PI / 2; nut.position.set(0, 1.17, -1.1); g.add(nut);
  const collar = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.84, 0.5, 32), chrome(0xc4c7ca, 0.22, grain))); collar.position.set(0, 1.62, -1.1); g.add(collar);
  const lever = new THREE.Group(); lever.position.set(0, 1.5, -1.1); g.add(lever);
  const rod = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.5, 5.0, 28), chrome(0xd4d6d8, 0.22, grain))); rod.position.y = 2.5; lever.add(rod);
  const ball = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.9, 40, 24), chrome(0xdcdee0, 0.22, grain))); ball.position.y = 5.2; lever.add(ball);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10), basic(0x2a1410)); led.position.set(4.3, 0.98, 2.75); led.layers.enable(1); g.add(led);
  // the readout sits in a recess, behind its own glass
  const bezel = new THREE.Mesh(slab(squircle(3.5, 1.6, 0.25, 6), 0.3, 0.05, 2), new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 0.6 })); bezel.rotation.x = -Math.PI / 2; bezel.position.set(0, 0.78, -3.0); g.add(bezel);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.3), new THREE.MeshBasicMaterial({ map: oledTex, color: new THREE.Color().setScalar(1.6) })); win.rotation.x = -Math.PI / 2; win.position.set(0, 0.935, -3.0); win.layers.enable(1); g.add(win);
  const gl = new THREE.Mesh(slab(squircle(3.3, 1.45, 0.2, 6), 0.04, 0.015, 2), coverGlass({ roughness: 0.06 })); gl.rotation.x = -Math.PI / 2; gl.position.set(0, 0.96, -3.0); gl.renderOrder = 2; g.add(gl);
  g.userData = { lever, led, pago, gratis,
    // k: 0 = pago, 1 = grátis (may overshoot)
    set(k) { lever.rotation.z = (26 - 52 * k) * RAD; const on = k > 0.5; led.material.color.set(on ? 0xff6b4a : 0x2a1410).multiplyScalar(on ? 3 : 1); gratis.material.color.setScalar(on ? 1.9 : 0.5); pago.material.color.setScalar(on ? 0.45 : 1); } };
  return g;
}

// small standing plaques with the real open models' names
export function buildPlaques(names) {
  const g = new THREE.Group();
  names.forEach((n) => {
    const W = 2.0 + n.length * 0.78, p = new THREE.Group();
    const b = shadow(new THREE.Mesh(slab(squircle(W, 2.5, 0.3, 6), 0.55, 0.07, 3), new THREE.MeshPhysicalMaterial({ color: 0x1d2023, roughness: 0.42, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.3 }))); b.position.y = 1.27; b.rotation.x = -8 * RAD; p.add(b);
    const t = flat(label(n, { w: Math.round(W * 140), h: 350, size: 170, color: '#f4f1ec', weight: 560, track: -4 }), W, 2.5); t.position.set(0, 1.27, 0.29); t.rotation.x = -8 * RAD; p.add(t);
    p.add(contact(W, 0.7, 0.55, 0.8));
    p.userData.w = W; g.add(p);
  });
  return g;
}

// --------------------------------------------------------------- printed guide (shot 11)
export function buildGuide(pages) {
  const g = new THREE.Group(), W = 14.8, D = 21, paper = new THREE.MeshStandardMaterial({ color: 0xf1ede4, roughness: 0.9, metalness: 0 });
  const stack = shadow(new THREE.Mesh(new THREE.BoxGeometry(W, 0.7, D), paper)); stack.position.y = 0.36; g.add(stack); g.add(contact(W, D, 0.6));
  const sheet = (tex, x, y, z, ry, gloss) => {
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 16;
    const m = shadow(new THREE.Mesh(new THREE.PlaneGeometry(W, D, 12, 1), new THREE.MeshPhysicalMaterial({ map: tex, roughness: gloss ? 0.42 : 0.88, metalness: 0, clearcoat: gloss ? 0.5 : 0, clearcoatRoughness: 0.3 })), false);
    const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.05 * Math.sin((p.getX(i) / W + 0.5) * Math.PI) * (gloss ? 0.4 : 1.6)); m.geometry.computeVertexNormals();
    m.rotation.x = -Math.PI / 2; m.rotation.z = ry; m.position.set(x, y, z); m.receiveShadow = true; g.add(m);
    if (!gloss) { const c = contact(W, D, 0.35, 0.7); c.position.set(x, 0.011, z); c.rotation.z = ry; g.add(c); }
    return m;
  };
  sheet(pages[0], 0, 0.725, 0, 0, true);
  sheet(pages[1], 13.2, 0.03, 2.2, -0.21, false);
  sheet(pages[2], 15.8, 0.06, -1.4, 0.12, false);
  return g;
}

// --------------------------------------------------------------- the mark: a physical "F" tile (end card)
export function buildMark() {
  const g = new THREE.Group();
  const t = shadow(new THREE.Mesh(slab(squircle(5.2, 5.2, 1.25, 14), 1.3, 0.2, 6), envSpecOnly(new THREE.MeshPhysicalMaterial({ color: 0xe9512f, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }))));
  t.position.y = 2.62; g.add(t);
  const f = flat(textTexture(512, 512, (c) => { c.font = '700 330px Sans'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('F', 256, 276); }), 5.2, 5.2);
  f.position.set(0, 2.62, 0.66); f.layers.enable(1); f.material.color.setScalar(1.25); g.add(f);
  return g;
}
