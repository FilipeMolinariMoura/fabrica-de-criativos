// pipeline.js: the "camera" of the lookdev film.
//
// One frame = N full renders of the scene accumulated in a 32-bit float buffer. Every sample moves
//   - the camera on the lens aperture (true depth of field, real bokeh),
//   - the sub-pixel position (anti-aliasing, gaussian reconstruction filter),
//   - the time inside the shutter (motion blur),
//   - every light inside its own area (soft area shadows, sky-dome occlusion),
//   - the floor mirror's micro-normal (glossy, contact-hardening reflections).
// Then one finishing pass in scene-linear HDR: bloom + halation from the highlights, lateral
// chromatic aberration, vignette, exposure, ACES filmic, grade, 2-D type, grain, dither, sRGB.
//
// Everything is a pure function of (t, sample index): no clocks, no Math.random.
import * as THREE from 'three';

const FS_VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

// N decorrelated sample tuples. lens: Vogel spiral on the unit disk (even coverage = clean bokeh);
// px: gaussian sub-pixel offset; a/b/c: 2-D points for the lights; time: stratified in [0,1).
export function makeSamples(N) {
  const out = [], GA = 2.399963229728653;
  const perm = (k, a, b) => (k * a + b) % N;
  for (let k = 0; k < N; k++) {
    const r = ((k + 0.5) / N) ** 0.46, th = k * GA;      // 0.5 = even disk; a little under = brighter rim, like a real lens
    const u1 = Math.max(1e-4, halton(k + 1, 2)), u2 = halton(k + 1, 3);
    const g = Math.min(1.6, Math.sqrt(-2 * Math.log(u1))) * 0.36;      // sigma ~0.36 px
    const ka = perm(k, 7, 3), kb = perm(k, 11, 5), kc = perm(k, 13, 1), kt = perm(k, 5, 2);
    out.push({
      k,
      lens: [r * Math.cos(th), r * Math.sin(th)],
      px: [g * Math.cos(2 * Math.PI * u2), g * Math.sin(2 * Math.PI * u2)],
      a: [(0.5 + ka * 0.7548776662) % 1, (0.5 + ka * 0.5698402909) % 1],
      b: [(0.5 + kb * 0.7548776662) % 1, (0.5 + kb * 0.5698402909) % 1],
      c: [(0.5 + kc * 0.7548776662) % 1, (0.5 + kc * 0.5698402909) % 1],
      time: (kt + 0.5) / N,
    });
  }
  return out;
}

export class Pipeline {
  constructor(canvas, W, H) {
    this.W = W; this.H = H;
    const R = this.R = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    R.setPixelRatio(1);
    R.setSize(W, H, false);
    R.toneMapping = THREE.NoToneMapping;            // tone mapping happens once, in the finishing pass
    R.outputColorSpace = THREE.SRGBColorSpace;
    R.shadowMap.enabled = true;
    R.shadowMap.type = THREE.PCFShadowMap;
    R.shadowMap.autoUpdate = false;
    R.autoClear = false;
    R.info.autoReset = false;

    const hdr = (w, h, o = {}) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, ...o });
    this.rtSample = hdr(W, H, { depthBuffer: true, samples: 0 });
    this.rtMirror = hdr(W, H, { depthBuffer: true, samples: 0 });
    this.rtAcc = [0, 1].map(() => hdr(W, H, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }));
    this.rtAcc.forEach((r) => { r.texture.minFilter = r.texture.magFilter = THREE.LinearFilter; });
    this.rtEm = [0, 1].map(() => hdr(W, H));                  // emissive-only accumulation: the only source of bloom / halation
    this.rtLayer = [0, 1].map(() => hdr(W, H, { depthBuffer: true }));   // glass seen through glass (see renderMain)
    this.blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.projector = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, res: { value: new THREE.Vector2(W, H) } },
      vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D t; uniform vec2 res; void main() { gl_FragColor = vec4(texture2D(t, gl_FragCoord.xy / res).rgb, 1.0); }' });
    this.bloom = [];
    for (let i = 0, w = W >> 1, h = H >> 1; i < 7; i++, w = Math.max(2, w >> 1), h = Math.max(2, h >> 1)) this.bloom.push(hdr(w, h));

    this.fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.fsMesh = new THREE.Mesh(tri, null);
    this.fsMesh.frustumCulled = false;
    this.fsScene = new THREE.Scene(); this.fsScene.add(this.fsMesh);

    const mat = (frag, uniforms, o = {}) => new THREE.ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, ...o });
    // Accumulate one sample. Optical vignetting: towards the corners the lens barrel hides part of the
    // aperture, so each pixel only accepts the lens positions it can "see" (cat-eye bokeh off-axis).
    // The accepted weight is summed in alpha and divided out in the finishing pass.
    this.mAcc = mat(/* glsl */`
      uniform sampler2D tPrev, tNew; uniform float w, cat; uniform vec2 lens, asp; varying vec2 vUv;
      void main() {
        vec2 n = (vUv * 2.0 - 1.0) * asp;
        float m = smoothstep(1.02, 0.9, length(lens - cat * n));
        gl_FragColor = texture2D(tPrev, vUv) + vec4(texture2D(tNew, vUv).rgb * m, m) * w;
      }`,
      { tPrev: { value: null }, tNew: { value: null }, w: { value: 1 }, cat: { value: 0.3 }, lens: { value: new THREE.Vector2() }, asp: { value: new THREE.Vector2(W / H, 1) } });
    // bright pass + first downsample (soft knee, firefly clamp)
    this.mBright = mat(/* glsl */`
      uniform sampler2D t; uniform vec2 px; uniform float thr, knee, cap; varying vec2 vUv;
      vec3 pre(vec4 q) {
        vec3 c = min(q.rgb / max(q.a, 1e-4), vec3(cap));
        float br = max(c.r, max(c.g, c.b));
        float s = clamp(br - thr + knee, 0.0, 2.0 * knee); s = s * s / (4.0 * knee + 1e-5);
        return c * max(s, br - thr) / max(br, 1e-5);
      }
      void main() {
        vec3 c = pre(texture2D(t, vUv + px * vec2(-1.0, -1.0))) + pre(texture2D(t, vUv + px * vec2(1.0, -1.0)))
               + pre(texture2D(t, vUv + px * vec2(-1.0, 1.0))) + pre(texture2D(t, vUv + px * vec2(1.0, 1.0)));
        gl_FragColor = vec4(c * 0.25, 1.0);
      }`, { t: { value: null }, px: { value: new THREE.Vector2() }, thr: { value: 1 }, knee: { value: 0.5 }, cap: { value: 40 } });
    // 13-tap downsample (Jimenez, "Next generation post processing in Call of Duty: AW")
    this.mDown = mat(/* glsl */`
      uniform sampler2D t; uniform vec2 px; varying vec2 vUv;
      void main() {
        vec3 a = texture2D(t, vUv + px * vec2(-2.0, 2.0)).rgb, b = texture2D(t, vUv + px * vec2(0.0, 2.0)).rgb, c = texture2D(t, vUv + px * vec2(2.0, 2.0)).rgb;
        vec3 d = texture2D(t, vUv + px * vec2(-2.0, 0.0)).rgb, e = texture2D(t, vUv).rgb, f = texture2D(t, vUv + px * vec2(2.0, 0.0)).rgb;
        vec3 g = texture2D(t, vUv + px * vec2(-2.0, -2.0)).rgb, h = texture2D(t, vUv + px * vec2(0.0, -2.0)).rgb, i = texture2D(t, vUv + px * vec2(2.0, -2.0)).rgb;
        vec3 j = texture2D(t, vUv + px * vec2(-1.0, 1.0)).rgb, k = texture2D(t, vUv + px * vec2(1.0, 1.0)).rgb;
        vec3 l = texture2D(t, vUv + px * vec2(-1.0, -1.0)).rgb, m = texture2D(t, vUv + px * vec2(1.0, -1.0)).rgb;
        gl_FragColor = vec4(e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125, 1.0);
      }`, { t: { value: null }, px: { value: new THREE.Vector2() } });
    // 9-tap tent upsample, added onto the next larger level
    this.mUp = mat(/* glsl */`
      uniform sampler2D t; uniform vec2 px; uniform float w; varying vec2 vUv;
      void main() {
        vec3 c = texture2D(t, vUv).rgb * 4.0;
        c += (texture2D(t, vUv + px * vec2(-1.0, 0.0)).rgb + texture2D(t, vUv + px * vec2(1.0, 0.0)).rgb + texture2D(t, vUv + px * vec2(0.0, -1.0)).rgb + texture2D(t, vUv + px * vec2(0.0, 1.0)).rgb) * 2.0;
        c += texture2D(t, vUv + px * vec2(-1.0, -1.0)).rgb + texture2D(t, vUv + px * vec2(1.0, -1.0)).rgb + texture2D(t, vUv + px * vec2(-1.0, 1.0)).rgb + texture2D(t, vUv + px * vec2(1.0, 1.0)).rgb;
        gl_FragColor = vec4(c * (w / 16.0), 1.0);
      }`, { t: { value: null }, px: { value: new THREE.Vector2() }, w: { value: 1 } },
      { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation });

    this.look = {
      exposure: 1.0, bloom: 0.22, halation: 0.10, halTint: new THREE.Vector3(1.0, 0.30, 0.10),
      ca: 0.0010, vignette: 0.15, grain: 0.04, sat: 0.92, contrast: 1.05,
      shadowTint: new THREE.Vector3(-0.004, 0.002, 0.005), highTint: new THREE.Vector3(0.012, 0.003, -0.014),
    };
    this.mFinal = mat(/* glsl */`
      uniform sampler2D tAcc, tBloom, tHal, tType;
      uniform vec2 res; uniform float exposure, bloomK, halK, ca, vig, grainK, sat, contrast, frame, typeOn;
      uniform vec3 halTint, shadowTint, highTint;
      varying vec2 vUv;
      vec3 RRTAndODTFit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
      vec3 aces(vec3 color) {
        const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
        const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
        color *= exposure / 0.6;
        return clamp(O * RRTAndODTFit(I * color), 0.0, 1.0);
      }
      vec3 oetf(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
      uint pcg(uint v) { uint s = v * 747796405u + 2891336453u; uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
      float rnd(ivec2 p, uint salt) { return float(pcg(uint(p.x) + pcg(uint(p.y) + pcg(salt)))) / 4294967295.0; }
      float gnoise(ivec2 p, uint salt) { return rnd(p, salt) + rnd(p, salt + 17u) + rnd(p, salt + 31u) - 1.5; }
      void main() {
        vec2 c = vUv - 0.5; vec2 asp = vec2(res.x / res.y, 1.0);
        float r2 = dot(c * asp, c * asp) * 4.0;                       // 1.0 at the top/bottom edge centre
        // lateral chromatic aberration: red scales out, blue in, quadratic towards the corners (0.1 % there)
        vec3 col;
        vec4 qr = texture2D(tAcc, 0.5 + c * (1.0 + ca * r2)), qg = texture2D(tAcc, vUv), qb = texture2D(tAcc, 0.5 + c * (1.0 - ca * r2));
        col = vec3(qr.r / max(qr.a, 1e-4), qg.g / max(qg.a, 1e-4), qb.b / max(qb.a, 1e-4));
        col += texture2D(tBloom, vUv).rgb * bloomK;
        col += texture2D(tHal, vUv).rgb * halTint * halK;
        // optical vignette (cos^4-like falloff)
        float vg = 1.0 - vig * smoothstep(0.15, 1.35, r2) ;           // vig = darkening at the corners (0.15 = 15 %)
        col *= vg;
        col = aces(col);
        // grade in display-linear: split tone, contrast around mid grey, saturation
        float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col += shadowTint * pow(1.0 - l, 3.0) + highTint * l * l;
        col = max(col, vec3(0.0));
        col = pow(col / 0.18, vec3(contrast)) * 0.18;
        l = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col = mix(vec3(l), col, sat);
        col = oetf(clamp(col, 0.0, 1.0));
        // 2-D type layer (premultiplied, display space)
        vec4 ty = texture2D(tType, vUv) * typeOn;
        col = col * (1.0 - ty.a) + ty.rgb;
        // grain: ~1.35 px clumps (bilinear value noise) + a little per-pixel, strongest in the mid-shadows
        ivec2 p = ivec2(gl_FragCoord.xy); uint f = uint(frame);
        vec2 gp = gl_FragCoord.xy / 1.35; ivec2 gi = ivec2(floor(gp)); vec2 gf = fract(gp); gf = gf * gf * (3.0 - 2.0 * gf);
        float g = mix(mix(gnoise(gi, f), gnoise(gi + ivec2(1, 0), f), gf.x), mix(gnoise(gi + ivec2(0, 1), f), gnoise(gi + ivec2(1, 1), f), gf.x), gf.y) * 1.25
                + gnoise(p, f + 59u) * 0.35;
        float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
        float amp = grainK * mix(1.0, 0.5, smoothstep(0.15, 0.95, lum)) * smoothstep(-0.03, 0.05, lum);
        vec3 gc = vec3(g) + 0.2 * vec3(gnoise(p, f + 101u), gnoise(p, f + 211u), gnoise(p, f + 307u));
        col += gc * amp;
        // triangular dither to 8 bit
        col += (rnd(p, f + 401u) + rnd(p, f + 503u) - 1.0) / 255.0;
        gl_FragColor = vec4(col, 1.0);
      }`, {
      tAcc: { value: null }, tBloom: { value: null }, tHal: { value: null }, tType: { value: null },
      res: { value: new THREE.Vector2(W, H) }, exposure: { value: 1 }, bloomK: { value: 0 }, halK: { value: 0 }, ca: { value: 0 },
      vig: { value: 0 }, grainK: { value: 0 }, sat: { value: 1 }, contrast: { value: 1 }, frame: { value: 0 }, typeOn: { value: 1 },
      halTint: { value: new THREE.Vector3() }, shadowTint: { value: new THREE.Vector3() }, highTint: { value: new THREE.Vector3() },
    });

    this.mirrorCam = new THREE.PerspectiveCamera();
    this.mirrorCam.matrixAutoUpdate = true;
    this.reflMatrix = new THREE.Matrix4();
    this._v = { r: new THREE.Vector3(), u: new THREE.Vector3(), f: new THREE.Vector3(), p: new THREE.Vector3(), n: new THREE.Vector3(), t: new THREE.Vector3() };
    this.samplesCache = new Map();
  }

  pass(material, target) {
    this.fsMesh.material = material;
    this.R.setRenderTarget(target);
    this.R.render(this.fsScene, this.fsCam);
  }

  // Place the real camera for one lens sample. base: { pos, target, up?, fov, focus, aperture }.
  // The camera moves on the aperture disk and the projection is sheared so the focus plane stays put.
  setLens(cam, base, s) {
    const { r, u, f } = this._v;
    cam.fov = base.fov; cam.aspect = this.W / this.H; cam.near = base.near ?? 1; cam.far = base.far ?? 3000;
    cam.position.copy(base.pos); cam.up.set(Math.sin(base.roll || 0), Math.cos(base.roll || 0), 0);
    cam.lookAt(base.target);
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    r.setFromMatrixColumn(cam.matrixWorld, 0); u.setFromMatrixColumn(cam.matrixWorld, 1); f.setFromMatrixColumn(cam.matrixWorld, 2).negate();
    const dx = s.lens[0] * base.aperture, dy = s.lens[1] * base.aperture;
    cam.position.addScaledVector(r, dx).addScaledVector(u, dy);
    cam.updateMatrixWorld(true);
    const e = cam.projectionMatrix.elements;
    const jx = (2 * s.px[0]) / this.W, jy = (2 * s.px[1]) / this.H;
    this._lens = { sx: (e[0] * dx) / base.focus, sy: (e[5] * dy) / base.focus, jx, jy };
    e[8] = -this._lens.sx + jx; e[9] = -this._lens.sy + jy;
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }

  // The same camera seen in the floor: mirrored about a plane through `pivot` whose normal is the
  // floor normal tilted by a small random angle (the floor's roughness).
  setMirror(cam, pivot, rough, s) {
    const { r, u, f, p, n, t } = this._v, m = this.mirrorCam;
    const g = Math.sqrt(-2 * Math.log(Math.max(1e-4, s.c[0]))) * rough, a = 2 * Math.PI * s.c[1];
    n.set(g * Math.cos(a), 1, g * Math.sin(a)).normalize();
    const refl = (v, point) => { const d = (point ? v.clone().sub(pivot) : v).dot(n); return v.addScaledVector(n, -2 * d); };
    u.setFromMatrixColumn(cam.matrixWorld, 1); f.setFromMatrixColumn(cam.matrixWorld, 2).negate();
    p.copy(cam.position); refl(p, true);
    t.copy(cam.position).add(f); refl(t, true);
    refl(u, false);
    m.position.copy(p); m.up.copy(u); m.lookAt(t); m.updateMatrixWorld(true);
    m.projectionMatrix.copy(cam.projectionMatrix);
    const e = m.projectionMatrix.elements, L = this._lens;
    e[8] = L.sx + L.jx; e[9] = -L.sy + L.jy;
    m.projectionMatrixInverse.copy(m.projectionMatrix).invert();
    m.matrixWorldInverse.copy(m.matrixWorld).invert();
    this.reflMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(m.projectionMatrix).multiply(m.matrixWorldInverse);
  }

  // One sample of the beauty pass into rtSample. Transmission in three.js only sees opaque objects, so
  // glass behind glass would vanish. Glass is therefore rendered in depth layers, back to front: a layer
  // already rendered is shown to the next pass as an opaque "projection" of that finished image, which
  // puts it in the next layer's transmission buffer, refraction included.
  renderMain(stage) {
    const R = this.R, layers = stage.glassLayers ? stage.glassLayers() : [];
    if (layers.length <= 1) { R.setRenderTarget(this.rtSample); R.clear(); R.render(stage.scene, stage.camera); return; }
    const real = new Map(); layers.flat().forEach((m) => real.set(m, m.material));
    let prev = null;
    layers.forEach((layer, i) => {
      layers.forEach((l, j) => l.forEach((m) => {
        m.visible = j <= i; m.material = j < i ? this.projector : real.get(m);
        m.children.forEach((c) => { c.visible = j === i; });
      }));
      this.projector.uniforms.t.value = prev ? prev.texture : null;
      const target = i === layers.length - 1 ? this.rtSample : this.rtLayer[i % 2];
      R.setRenderTarget(target); R.clear(); R.render(stage.scene, stage.camera);
      prev = target;
    });
    layers.flat().forEach((m) => { m.material = real.get(m); m.visible = true; m.children.forEach((c) => { c.visible = true; }); });
  }

  // stage: { scene, camera, floor, update(t) -> base camera, sample(s), mirror: { pivot, rough }, glassLayers?() }
  render(stage, t, { spp = 64, shutter = 0.5, fps = 30, typeTex = null, frame = 0 } = {}) {
    const R = this.R;
    if (!this.samplesCache.has(spp)) this.samplesCache.set(spp, makeSamples(spp));
    const S = this.samplesCache.get(spp), EM = 2;                 // emissive pass every EM-th sample
    R.info.reset();
    stage.prepare?.(t);                                          // dynamic canvases: once per frame, not per sample
    shutter = stage.shutter ?? shutter;
    R.setClearColor(0x000000, 0);
    R.setRenderTarget(this.rtAcc[0]); R.clear();
    R.setRenderTarget(this.rtEm[0]); R.clear();
    R.setClearColor(0x000000, 1);
    let cur = 0, curE = 0;
    const acc = (pair, c, src, w, lens) => {
      this.mAcc.uniforms.tPrev.value = pair[c].texture; this.mAcc.uniforms.tNew.value = src.texture; this.mAcc.uniforms.w.value = w;
      this.mAcc.uniforms.lens.value.set(lens[0], lens[1]); this.mAcc.uniforms.cat.value = this.look.cat ?? 0.3;
      this.pass(this.mAcc, pair[1 - c]);
      return 1 - c;
    };
    // the lens pattern turns with the frame number, so defocus never shows the same striation twice
    const la = frame * 1.9416, lc = Math.cos(la), ls = Math.sin(la);
    for (const s0 of S) {
      const s = { ...s0, lens: [lc * s0.lens[0] - ls * s0.lens[1], ls * s0.lens[0] + lc * s0.lens[1]] };
      const base = stage.update(t + s.time * (shutter / fps));
      stage.sample(s);
      this.setLens(stage.camera, base, s);
      R.shadowMap.needsUpdate = true;
      if (stage.floor) {
        this.setMirror(stage.camera, stage.mirror.pivot, stage.mirror.rough, s);
        stage.floor.visible = false;
        R.setRenderTarget(this.rtMirror); R.clear();
        R.render(stage.scene, this.mirrorCam);
        stage.floor.visible = true;
        stage.floorUniforms.tRefl.value = this.rtMirror.texture;
        stage.floorUniforms.reflMatrix.value.copy(this.reflMatrix);
      }
      this.renderMain(stage);
      cur = acc(this.rtAcc, cur, this.rtSample, 1 / S.length, s.lens);
      if (s.k % EM === 0) {
        // emissive pass: everything black for depth, then only the layer-1 (emissive) objects on top
        const hidden = stage.emissiveHide ? stage.emissiveHide() : [];
        hidden.forEach((o) => { o.visible = false; });
        R.setRenderTarget(this.rtSample); R.clear();
        stage.scene.overrideMaterial = this.blackMat; R.render(stage.scene, stage.camera);
        stage.scene.overrideMaterial = null; stage.camera.layers.set(1); R.render(stage.scene, stage.camera); stage.camera.layers.set(0);
        hidden.forEach((o) => { o.visible = true; });
        curE = acc(this.rtEm, curE, this.rtSample, EM / S.length, s.lens);
      }
    }
    this._last = [this.rtAcc[cur].texture, this.rtEm[curE].texture, typeTex, frame];
    this.finish(...this._last);
  }

  // the same frame again with another finishing ('motor' | 'limpo'): one render, two masters
  refinish(mode) { const p = this.acabamento; this.acabamento = mode; this.finish(...this._last); this.acabamento = p; }

  finish(accTex, emTex, typeTex, frame) {
    const L = this.look, B = this.bloom;
    this.mBright.uniforms.t.value = emTex;
    this.mBright.uniforms.px.value.set(0.5 / this.W, 0.5 / this.H);
    this.mBright.uniforms.thr.value = 0.0; this.mBright.uniforms.knee.value = 0.001;
    this.pass(this.mBright, B[0]);
    for (let i = 1; i < B.length; i++) {
      this.mDown.uniforms.t.value = B[i - 1].texture;
      this.mDown.uniforms.px.value.set(1 / B[i - 1].width, 1 / B[i - 1].height);
      this.pass(this.mDown, B[i]);
    }
    for (let i = B.length - 2; i >= 0; i--) {
      this.mUp.uniforms.t.value = B[i + 1].texture;
      this.mUp.uniforms.px.value.set(1 / B[i + 1].width, 1 / B[i + 1].height);
      this.mUp.uniforms.w.value = 1.0;
      this.pass(this.mUp, B[i]);
    }
    const u = this.mFinal.uniforms;
    u.tAcc.value = accTex; u.tBloom.value = B[0].texture; u.tHal.value = B[2].texture; u.tType.value = typeTex; u.typeOn.value = typeTex ? 1 : 0;
    // 'motor' = finished in camera; 'limpo' = clean master for an external grade (no grain, vignette,
    // halation or chromatic aberration; exposure, tone mapping, bloom and dither stay)
    const fin = (this.acabamento || 'motor') === 'motor' ? 1 : 0;
    u.exposure.value = L.exposure; u.bloomK.value = L.bloom / B.length; u.halK.value = fin * L.halation / (B.length - 2);
    u.ca.value = fin * L.ca; u.vig.value = fin * L.vignette; u.grainK.value = fin * L.grain; u.sat.value = L.sat; u.contrast.value = L.contrast;
    u.halTint.value.copy(L.halTint); u.shadowTint.value.copy(L.shadowTint); u.highTint.value.copy(L.highTint);
    u.frame.value = frame;
    this.pass(this.mFinal, null);
  }
}
