// models.js: every object in the lookdev film, modelled in code (units: centimetres).
// No third-party device models: a generic phone, a generic slim laptop, glass slabs.
import * as THREE from 'three';
import { toCreasedNormals, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const RAD = Math.PI / 180;

// Rounded rectangle with continuous-curvature (superellipse) corners: the highlight runs round the
// corner without the "kink" a circular arc gives. Returns points, counter-clockwise.
export function squirclePoints(w, h, r, seg = 18, p = 2.7) {
  const e = Math.min(r * 1.22, w / 2, h / 2), pts = [];
  const corners = [[1, -1, -90], [1, 1, 0], [-1, 1, 90], [-1, -1, 180]];
  for (const [sx, sy, a0] of corners) {
    const cx = sx * (w / 2 - e), cy = sy * (h / 2 - e);
    for (let i = 0; i <= seg; i++) {
      const a = (a0 + (90 * i) / seg) * RAD, c = Math.cos(a), s = Math.sin(a);
      pts.push(new THREE.Vector2(cx + e * Math.sign(c) * Math.abs(c) ** (2 / p), cy + e * Math.sign(s) * Math.abs(s) ** (2 / p)));
    }
  }
  return pts;
}
export const squircle = (w, h, r, seg, p) => new THREE.Shape(squirclePoints(w, h, r, seg, p));
const hole = (w, h, r, cx = 0, cy = 0) => new THREE.Path(squirclePoints(w, h, r, 8).map((v) => new THREE.Vector2(v.x + cx, v.y + cy)).reverse());

// Extruded slab with a rounded bevel that stays inside the outline, centred on z, smooth normals.
export function slab(shape, depth, bevel, bevelSeg = 5, crease = 38) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(1e-4, depth - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: bevelSeg, steps: 1, curveSegments: 12 });
  g.translate(0, 0, -(depth - 2 * bevel) / 2);
  const out = toCreasedNormals(g, crease * RAD);
  g.dispose();
  return out;
}
// A flat plate with uv = position inside its bounding box (for screen textures)
export function plate(shape, w, h) {
  const g = new THREE.ShapeGeometry(shape, 12);
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return g;
}

// Specular reflections come from the environment only: a jittered point light would print N dots on
// a mirror-like surface. Analytic lights keep their diffuse term and their shadows.
export function envSpecOnly(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_end>',
      '#include <lights_fragment_end>\nreflectedLight.directSpecular *= 0.0;\n#ifdef USE_CLEARCOAT\nclearcoatSpecularDirect *= 0.0;\n#endif\n');
  };
  mat.customProgramCacheKey = () => 'envSpecOnly';
  return mat;
}

// The same, but dialled by a shared uniform: in the light world a black flag hangs over the bench, so the
// key's broad hotspot on satin metal and key caps is cut down (set DIRECT_SPEC.value per world).
export const DIRECT_SPEC = { value: 1 };
export function flaggedSpec(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uDirectSpec = DIRECT_SPEC;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uDirectSpec;').replace('#include <lights_fragment_end>',
      '#include <lights_fragment_end>\nreflectedLight.directSpecular *= uDirectSpec;\n#ifdef USE_CLEARCOAT\nclearcoatSpecularDirect *= uDirectSpec;\n#endif\n');
  };
  mat.customProgramCacheKey = () => 'flaggedSpec';
  return mat;
}

// Sub-pixel structure of an emissive display: RGB stripes and row gaps that only resolve when the lens is
// close enough (fades out by screen-space derivative, so there is no moire at a distance).
export function pixelGrid(mat, nx, ny, k = 0.4) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uPix = { value: new THREE.Vector3(nx, ny, k) };
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uPix;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        { vec2 g = vMapUv * uPix.xy; vec2 fw = fwidth(g);
          float vis = uPix.z * smoothstep(0.5, 0.16, max(fw.x, fw.y));
          vec3 sub = 0.5 + 0.5 * cos(6.2831853 * (g.x - vec3(0.0, 0.3333, 0.6667)));
          float row = 0.5 + 0.5 * cos(6.2831853 * g.y);
          diffuseColor.rgb *= mix(vec3(1.0), (0.55 + 0.9 * sub) * (0.8 + 0.4 * row), vis); }`);
  };
  mat.customProgramCacheKey = () => 'pixelGrid';
  return mat;
}

// Cover glass: a dielectric layer that only ADDS its specular reflection over what is under it
// (the emissive display, drawn just before). Rendered in the opaque list so refraction sees it too.
export function coverGlass(o = {}) {
  const m = new THREE.MeshPhysicalMaterial({ color: 0x000000, metalness: 0, roughness: 0.03, ior: 1.52, blending: THREE.AdditiveBlending, transparent: false, depthWrite: true, ...o });
  return envSpecOnly(m);
}
// fit a roughness map (smudges, grain) to a slab whose cap uvs are in centimetres
export function fitMap(tex, w, h, { rot = 0, ox = 0.5, oy = 0.5 } = {}) {
  const t = tex.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / w, 1 / h); t.offset.set(ox, oy); t.center.set(0, 0); t.rotation = rot; t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------------------------------- phone
export const PHONE = { w: 7.16, h: 14.96, d: 0.8, r: 1.28, bevel: 0.2, glassInset: 0.185, bezel: 0.115 };
// screenTex is drawn for the whole display plate (active area + black bezel): see screens.js
export function buildPhone(screenTex, { frame = 0x8c8a85, emissive = 1.5, smudge = null, grain = null } = {}) {
  const P = PHONE, g = new THREE.Group();
  const metal = new THREE.MeshPhysicalMaterial({ color: frame, metalness: 1, roughness: 0.36, clearcoat: 0.2, clearcoatRoughness: 0.25, roughnessMap: grain ? fitMap(grain, 5, 5) : null });
  const body = new THREE.Mesh(slab(squircle(P.w, P.h, P.r), P.d, P.bevel, 7), metal);
  g.add(body);
  // side buttons
  const btn = (len, x, y) => {
    const m = new THREE.Mesh(slab(squircle(P.d * 0.36, len, 0.13, 6), 0.11, 0.035, 3), metal);
    m.rotation.y = Math.PI / 2; m.position.set(x, y, 0); g.add(m);
  };
  btn(1.95, P.w / 2 + 0.012, 2.3);
  btn(0.85, -P.w / 2 - 0.012, 4.55); btn(1.25, -P.w / 2 - 0.012, 3.0); btn(1.25, -P.w / 2 - 0.012, 1.45);
  // antenna breaks: thin polymer lines across the frame
  const poly = new THREE.MeshStandardMaterial({ color: 0x55534f, roughness: 0.6, metalness: 0 });
  for (const [x, y, w, h] of [[P.w / 2 - 0.004, 5.3, 0.012, 0.07], [-P.w / 2 + 0.004, -5.3, 0.012, 0.07], [P.w / 2 - 0.004, -5.6, 0.012, 0.07], [-P.w / 2 + 0.004, 5.9, 0.012, 0.07]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, P.d - 2 * P.bevel + 0.06), poly); m.position.set(x, y, 0); g.add(m);
  }
  // back glass (satin) and a simple camera island, for the mirror and for orbit shots
  const gi = P.glassInset, gw = P.w - 2 * gi, gh = P.h - 2 * gi, gr = P.r - gi;
  const back = new THREE.Mesh(slab(squircle(gw, gh, gr), 0.05, 0.02, 2), new THREE.MeshPhysicalMaterial({ color: 0x6f6d69, roughness: 0.42, metalness: 0.0, clearcoat: 0.3, clearcoatRoughness: 0.35 }));
  back.position.z = -P.d / 2 - 0.005; g.add(back);
  const island = new THREE.Mesh(slab(squircle(3.4, 3.4, 0.95), 0.2, 0.07, 4), back.material);
  island.position.set(-P.w / 2 + 2.25, P.h / 2 - 2.25, -P.d / 2 - 0.1); g.add(island);
  const lensM = envSpecOnly(new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: 0.05, metalness: 0, clearcoat: 1 }));
  for (const [x, y] of [[-0.75, 0.75], [-0.75, -0.75], [0.8, 0]]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.16, 40), metal); ring.rotation.x = Math.PI / 2;
    ring.position.set(island.position.x + x, island.position.y + y, -P.d / 2 - 0.24); g.add(ring);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.17, 40), lensM); lens.rotation.x = Math.PI / 2;
    lens.position.copy(ring.position); lens.position.z -= 0.005; g.add(lens);
  }
  // display plate: emissive screen (black bezel painted in), slightly under the glass surface
  const dShape = squircle(gw - 0.02, gh - 0.02, gr - 0.01);
  const display = new THREE.Mesh(plate(dShape, gw - 0.02, gh - 0.02), pixelGrid(new THREE.MeshBasicMaterial({ map: screenTex, color: new THREE.Color().setScalar(emissive) }), 620, 1340, 0.35));
  display.position.z = P.d / 2 + 0.004; g.add(display);
  // bottom edge: charging port and two rows of speaker holes
  const hole = new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 0.9, metalness: 0 });
  const port = new THREE.Mesh(slab(squircle(0.86, 0.27, 0.13, 6), 0.03, 0.01, 2), hole); port.rotation.x = Math.PI / 2; port.position.set(0, -P.h / 2 - 0.002, 0); g.add(port);
  for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 12), hole); m.position.set(sx * (0.95 + i * 0.27), -P.h / 2 - 0.002, 0); g.add(m);
  }
  const glass = new THREE.Mesh(slab(squircle(gw, gh, gr), 0.07, 0.03, 4), coverGlass(smudge ? { roughness: 0.26, roughnessMap: fitMap(smudge, 19, 19, { rot: 0.35, ox: 0.42, oy: 0.2 }) } : { roughness: 0.03 }));
  glass.position.z = P.d / 2 + 0.035; glass.renderOrder = 2; g.add(glass);
  for (const m of [body, back, island]) { m.castShadow = true; m.receiveShadow = true; }
  display.layers.enable(1);
  g.userData = { display, glass, metal, back: back.material, activeW: gw - 0.02 - 2 * P.bezel, activeH: gh - 0.02 - 2 * P.bezel };
  return g;
}

// ---------------------------------------------------------------------------------------- laptop
export const LAPTOP = { w: 31.2, d: 22.1, h: 1.12, r: 1.35, lid: 0.42, foot: 0.12, bezel: 0.55, chin: 0.35 };
const KEYROWS = [
  { h: 0.5, keys: [['esc', 1.5], ...['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].map((k) => [k, 1]), ['', 1]] },
  { h: 1, keys: [...'`1234567890-='.split('').map((k) => [k, 1]), ['delete', 1.5]] },
  { h: 1, keys: [['tab', 1.5], ...'QWERTYUIOP[]\\'.split('').map((k) => [k, 1])] },
  { h: 1, keys: [['caps', 1.75], ...'ASDFGHJKL;\''.split('').map((k) => [k, 1]), ['return', 1.75]] },
  { h: 1, keys: [['shift', 2.25], ...'ZXCVBNM,./'.split('').map((k) => [k, 1]), ['shift', 2.25]] },
  { h: 1, keys: [['fn', 1], ['ctrl', 1], ['alt', 1], ['cmd', 1.25], ['', 5], ['cmd', 1.25], ['alt', 1], ['<', 1, 'lo'], ['^v', 1, 'split'], ['>', 1, 'lo']] },
];
export function buildLaptop(screenTex, legendTex, { metalColor = 0x8e9196, emissive = 1.4, smudge = null, grain = null, enterTex = null } = {}) {   // smudge: a faint map (clean ~0.4)
  const L = LAPTOP, g = new THREE.Group(), U = 1.9, GAP = 0.27;
  const alu = flaggedSpec(new THREE.MeshPhysicalMaterial({ color: metalColor, metalness: 1, roughness: 0.42, roughnessMap: grain ? fitMap(grain, 0.9, 0.9) : null }));
  const dark = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.7, metalness: 0 });
  const keyMat = flaggedSpec(new THREE.MeshPhysicalMaterial({ color: 0x0e0e10, roughness: 0.42, metalness: 0, clearcoat: 0.2, clearcoatRoughness: 0.4 }));
  // keyboard well and trackpad are real holes in the top case
  const wellW = 14.5 * U + 0.3, wellD = 5.5 * U + 0.3, wellZ = -3.35;      // z towards the user is +
  const padW = 13.2, padD = 8.3, padZ = 6.05;
  const shape = squircle(L.w, L.d, L.r);
  shape.holes.push(hole(wellW, wellD, 0.5, 0, -wellZ), hole(padW, padD, 0.5, 0, -padZ));
  const top = L.foot + L.h;
  const base = new THREE.Mesh(slab(shape, L.h, 0.13, 4), alu);
  base.rotation.x = -Math.PI / 2; base.position.y = L.foot + L.h / 2; g.add(base);
  const wellFloor = new THREE.Mesh(new THREE.BoxGeometry(wellW + 0.2, 0.05, wellD + 0.2), dark);
  wellFloor.position.set(0, top - 0.2, wellZ); g.add(wellFloor);
  const pad = new THREE.Mesh(slab(squircle(padW - 0.07, padD - 0.07, 0.47), 0.3, 0.03, 3), flaggedSpec(new THREE.MeshPhysicalMaterial({ color: metalColor, metalness: 1, roughness: 0.34, roughnessMap: grain ? fitMap(grain, 4, 4) : null })));
  pad.rotation.x = -Math.PI / 2; pad.position.set(0, top - 0.15 - 0.006, padZ); g.add(pad);
  const padFloor = new THREE.Mesh(new THREE.BoxGeometry(padW + 0.2, 0.05, padD + 0.2), dark); padFloor.position.set(0, top - 0.33, padZ); g.add(padFloor);
  // keys
  const geos = [], legends = [];
  let z = wellZ - wellD / 2 + 0.15;
  for (const row of KEYROWS) {
    const kd = row.h * U; let x = -14.5 * U / 2;
    for (const [label, wu, mode] of row.keys) {
      const kw = wu * U, cx = x + kw / 2;
      const add = (cz, d, lab) => {
        const k = slab(squircle(kw - GAP, d - GAP, 0.2, 5), 0.16, 0.035, 3);
        k.rotateX(-Math.PI / 2);
        if (lab === 'return' && enterTex) {            // the one key that moves: its own mesh, its own legend
          const m = new THREE.Mesh(k, keyMat); m.position.set(cx, top - 0.2 + 0.11, cz); m.castShadow = m.receiveShadow = true;
          const lg = new THREE.Mesh(new THREE.PlaneGeometry(kw - GAP, d - GAP), new THREE.MeshBasicMaterial({ map: enterTex, transparent: true, depthWrite: false }));
          lg.rotation.x = -Math.PI / 2; lg.position.y = 0.082; lg.layers.enable(1); m.add(lg);
          m.userData.home = m.position.clone(); g.add(m); g.userData.enter = m; g.userData.enterLegend = lg;
          return;
        }
        k.translate(cx, top - 0.2 + 0.11, cz); geos.push(k);
        legends.push({ label: lab, x: cx, z: cz, w: kw - GAP, d: d - GAP });
      };
      if (mode === 'split') { add(z + kd * 0.25, kd / 2, '^'); add(z + kd * 0.75, kd / 2, 'v'); }
      else if (mode === 'lo') add(z + kd * 0.75, kd / 2, label);
      else add(z + kd / 2, kd, label);
      x += kw;
    }
    z += kd;
  }
  const keys = new THREE.Mesh(mergeGeometries(geos), keyMat); g.add(keys);
  geos.forEach((k) => k.dispose());
  // back-lit legends: one transparent plate just above the key tops
  if (legendTex) {
    legendTex.drawLegends(legends, wellW, wellD, wellZ);
    const lp = new THREE.Mesh(new THREE.PlaneGeometry(wellW, wellD), new THREE.MeshBasicMaterial({ map: legendTex, transparent: true, depthWrite: false, color: new THREE.Color().setScalar(1.1) }));
    lp.rotation.x = -Math.PI / 2; lp.position.set(0, top - 0.2 + 0.11 + 0.082, wellZ); lp.layers.enable(1); g.add(lp); g.userData.legends = lp;
  }
  // lid: pivots on the hinge line at the back edge
  const lid = new THREE.Group(); lid.position.set(0, top + 0.02, -L.d / 2 + 0.3); g.add(lid);
  const lidShell = new THREE.Mesh(slab(squircle(L.w, L.d, L.r), L.lid, 0.11, 4), alu);
  lidShell.position.set(0, L.d / 2 - 0.1, -L.lid / 2); lid.add(lidShell);
  const gw = L.w - 0.34, gh = L.d - 0.34, gr = L.r - 0.17;
  const display = new THREE.Mesh(plate(squircle(gw - 0.02, gh - 0.02, gr), gw - 0.02, gh - 0.02), pixelGrid(new THREE.MeshBasicMaterial({ map: screenTex, color: new THREE.Color().setScalar(emissive) }), 1500, 1057, 0.4));
  display.position.set(0, L.d / 2 - 0.1, 0.004); lid.add(display);
  const glass = new THREE.Mesh(slab(squircle(gw, gh, gr), 0.05, 0.02, 3), coverGlass(smudge ? { roughness: 0.12, specularIntensity: 0.7, roughnessMap: fitMap(smudge, 24, 24, { rot: -0.5, ox: 0.6, oy: 0.35 }) } : { roughness: 0.05, specularIntensity: 0.7 }));
  glass.position.set(0, L.d / 2 - 0.1, 0.027); glass.renderOrder = 2; lid.add(glass);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, L.w - 5.5, 32), new THREE.MeshPhysicalMaterial({ color: 0x1a1b1d, metalness: 1, roughness: 0.4 }));
  hinge.rotation.z = Math.PI / 2; hinge.position.set(0, top - 0.12, -L.d / 2 + 0.34); g.add(hinge);
  for (const m of [base, keys, pad, lidShell, hinge]) { m.castShadow = true; m.receiveShadow = true; }
  wellFloor.receiveShadow = true; display.layers.enable(1);
  Object.assign(g.userData, { lid, display, glass, alu, pad: pad.material, keyMat, top, setOpen(deg) { lid.rotation.x = -(deg - 90) * RAD; },
    activeW: gw - 0.02 - 2 * L.bezel, activeH: gh - 0.02 - 2 * L.bezel - L.chin });
  g.userData.setOpen(108);
  return g;
}

// ---------------------------------------------------------------------------------------- glass
// A solid glass slab: real transmission (screen-space refraction through `thickness`, ior, Beer-Lambert
// attenuation, dispersion), polished bevel that catches the softboxes.
export function buildGlassCard(w, h, { thick = 1.0, r = 1.0, rough = 0.03, tint = 0xbfe9df, attDist = 4, dispersion = 0.35, smudge = null, bevel = 0.16, edge = 0x3f9f8a } = {}) {
  const common = { color: 0xffffff, metalness: 0, transmission: 1, ior: 1.5, specularIntensity: 1, envMapIntensity: 1.0 };
  // faces: clear, faintly tinted. Edges and bevels: you look along the slab there, so the glass goes
  // deep green and dark (Beer-Lambert over a long path) - the cue that says "thick glass".
  const face = envSpecOnly(new THREE.MeshPhysicalMaterial({ ...common, roughness: smudge ? Math.max(rough, 0.3) : rough, thickness: thick * 1.7,
    attenuationColor: new THREE.Color(tint), attenuationDistance: attDist, dispersion,
    roughnessMap: smudge ? fitMap(smudge, 22, 22, { rot: 2.0, ox: 0.2, oy: 0.7 }) : null }));
  const side = envSpecOnly(new THREE.MeshPhysicalMaterial({ ...common, roughness: 0.05, thickness: thick * 2.2,
    attenuationColor: new THREE.Color(edge), attenuationDistance: 2.1, dispersion: 0.2 }));
  const m = new THREE.Mesh(slab(squircle(w, h, r, 20), thick, bevel, 7), [face, side]);
  m.castShadow = true; m.userData.face = face; m.userData.side = side;
  return m;
}
