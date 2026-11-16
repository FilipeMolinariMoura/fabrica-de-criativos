// studio.js: the bench both worlds share. Environment (studio HDRI + softboxes placed per shot), the
// backdrop, the floor with its mirrored reflection, and the lights the pipeline jitters every sample.
// Extracted from exemplos/lookdev/film.js so other films can use it (see exemplos/bancada).
import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const RAD = Math.PI / 180;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

const ENV = { hdr: null, pm: null };
async function loadHDRI(R, url) {
  const hdr = await new HDRLoader().loadAsync(url);
  hdr.minFilter = hdr.magFilter = THREE.LinearFilter; hdr.wrapS = THREE.RepeatWrapping; hdr.needsUpdate = true;
  ENV.hdr = hdr; ENV.pm = new THREE.PMREMGenerator(R);
}
// cards: [{ dir: Vector3, w, h (degrees), roll (deg), color, k, soft, ramp }]
export function bakeEnvironment({ rot = 0, gain = 1, floor = 0.04, cards = [] }) {
  const es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(400, 96, 48), new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { map: { value: ENV.hdr }, rot: { value: rot }, gain: { value: gain }, floorK: { value: floor } },
    vertexShader: 'varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D map; uniform float rot, gain, floorK; varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float a = atan(d.z, d.x) + rot;
        vec2 uv = vec2(fract(a * 0.15915494 + 0.5), asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5);
        vec3 c = min(textureGrad(map, uv, vec2(0.0005, 0.0), vec2(0.0, 0.0005)).rgb, vec3(50.0));
        float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(lum), c, 0.8) * gain;
        c *= mix(floorK, 1.0, smoothstep(-0.12, 0.05, d.y));     // the studio's white floor -> our bench (dark world)
        gl_FragColor = vec4(c, 1.0);
      }`,
  })));
  for (const cd of cards) {
    const D = 200, w = 2 * D * Math.tan((cd.w * RAD) / 2), h = 2 * D * Math.tan((cd.h * RAD) / 2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.ShaderMaterial({
      uniforms: { col: { value: new THREE.Color(cd.color ?? 0xffffff).multiplyScalar(cd.k ?? 1) }, soft: { value: cd.soft ?? 0.3 }, ramp: { value: cd.ramp ?? 0 } },
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`
        uniform vec3 col; uniform float soft, ramp; varying vec2 vUv;
        void main() {
          float a = smoothstep(0.0, soft, vUv.x) * smoothstep(0.0, soft, 1.0 - vUv.x) * smoothstep(0.0, soft, vUv.y) * smoothstep(0.0, soft, 1.0 - vUv.y);
          gl_FragColor = vec4(col * a * mix(1.0, vUv.y, ramp), 1.0);
        }`,
    }));
    m.position.copy(cd.dir).normalize().multiplyScalar(D); m.lookAt(0, 0, 0); m.rotateZ((cd.roll || 0) * RAD); m.renderOrder = 5;
    es.add(m);
  }
  const tex = ENV.pm.fromScene(es, 0, 1, 1000, { size: 512 }).texture;
  es.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return tex;
}
// the direction a flat mirror at `point` with normal `n` shows to a camera at `eye`
export const mirrorDir = (eye, point, n) => { const d = point.clone().sub(eye).normalize(); return d.addScaledVector(n, -2 * d.dot(n)); };

export async function createStudio(pipe, assets = 'assets/') {
  const R = pipe.R;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera();
  await loadHDRI(R, assets + 'hdri/studio_small_08_2k.hdr');
  RectAreaLightUniformsLib.init();
  const loadTex = async (url, srgb) => { const t = await new THREE.TextureLoader().loadAsync(url); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; return t; };
  const [woodC, woodN, woodR] = await Promise.all([loadTex(assets + 'tex/dark_wood/dark_wood_diff_2k.jpg', true), loadTex(assets + 'tex/dark_wood/dark_wood_nor_gl_2k.jpg'), loadTex(assets + 'tex/dark_wood/dark_wood_rough_2k.jpg')]);

  // backdrop: the studio void (dark) or the far wall of the cyclorama (light), computed in float
  const bdU = { bot: { value: V(0, 0, 0) }, top: { value: V(0, 0, 0) }, glow: { value: V(0, 0, 0) }, coral: { value: V(0, 0, 0) }, glowAz: { value: 0 }, coralAz: { value: 0.9 } };
  const backdrop = new THREE.Mesh(new THREE.SphereGeometry(1500, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: bdU, depthWrite: false,
    vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
      varying vec3 vDir; uniform vec3 bot, top, glow, coral; uniform float glowAz, coralAz;
      float lobe(float az, float h, float a0, float wa, float wh) {
        float d = atan(sin(az - a0), cos(az - a0));
        return exp(-d * d / (wa * wa)) * exp(-h * h / (wh * wh));
      }
      void main() {
        vec3 d = normalize(vDir); float h = abs(d.y); float az = atan(d.x, -d.z);
        vec3 c = mix(bot, top, smoothstep(0.0, 0.5, h));
        c += glow * (lobe(az, h, glowAz, 0.62, 0.20) + 0.5 * lobe(az, h, glowAz, 1.9, 0.08));
        c += coral * lobe(az, h, coralAz, 0.17, 0.06);
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  backdrop.renderOrder = -10; backdrop.frustumCulled = false;
  scene.add(backdrop);

  // the bench. Diffuse + shadows from the analytic lights; its reflection is a real mirrored render of
  // the scene (pipeline.setMirror), bent by the wood's normal map and blended by a capped Fresnel.
  const floorUniforms = {
    tRefl: { value: null }, reflMatrix: { value: new THREE.Matrix4() }, reflK: { value: V(0.04, 1.0, 0.5) },
    tWood: { value: woodC }, tWoodN: { value: woodN }, tWoodR: { value: woodR }, uWood: { value: new THREE.Vector4(1, 1 / 85, 0.5, 0.01) },
    uTint: { value: V(1, 1, 1) }, uCyc: { value: new THREE.Vector4(0, 0, 0, 0) }, uCycR: { value: V(0, 0, 150) },
  };
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0, envMapIntensity: 0 });
  floorMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, floorUniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 reflMatrix;\nvarying vec4 vRefl;\nvarying vec3 vWPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvRefl = reflMatrix * vec4(vWPos, 1.0);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', /* glsl */`#include <common>
        uniform sampler2D tRefl, tWood, tWoodN, tWoodR; uniform vec3 reflK, uTint, uCycR; uniform vec4 uWood, uCyc; varying vec4 vRefl; varying vec3 vWPos;
        float fh(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float fnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(fh(i), fh(i + vec2(1.0, 0.0)), f.x), mix(fh(i + vec2(0.0, 1.0)), fh(i + vec2(1.0, 1.0)), f.x), f.y); }
        vec3 gWoodN; float gWoodR; float gFn;`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        vec2 wuv = mat2(0.819, -0.574, 0.574, 0.819) * vWPos.xz * uWood.y;      // grain runs into depth, 35 deg off the frame
        vec3 wc = texture2D(tWood, wuv).rgb; wc = mix(wc, vec3(dot(wc, vec3(0.2126, 0.7152, 0.0722))), uWood.z) * 2.6;
        gWoodN = texture2D(tWoodN, wuv).xyz * 2.0 - 1.0; gWoodR = texture2D(tWoodR, wuv).g;
        gFn = fnoise(vWPos.xz * 0.11) * 0.6 + fnoise(vWPos.xz * 0.47 + 7.0) * 0.4;
        float fsp = fnoise(vWPos.xz * 11.0) * smoothstep(140.0, 25.0, length(vViewPosition));
        float fib = fnoise(vWPos.xz * vec2(0.5, 5.5) + 3.0) * 0.6 + fnoise(vWPos.xz * vec2(6.5, 0.8)) * 0.4;      // paper sweep: long fibres
        float fade = smoothstep(120.0, 22.0, length(vViewPosition));
        vec3 plain = vec3(0.93 + 0.10 * gFn + (0.07 * (fsp - 0.5) + 0.085 * (fib - 0.5)) * fade);
        float dust = step(0.9972, fh(floor(vWPos.xz * 31.0) + 0.37)) * fade * uWood.x;                     // dust on the dark bench
        wc += vec3(0.5, 0.48, 0.45) * dust;
        diffuseColor.rgb = mix(plain, wc, uWood.x) * uTint;`)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directSpecular *= 0.0;\n')
      .replace('#include <opaque_fragment>', /* glsl */`
        vec2 ruv = vRefl.xy / vRefl.w + gWoodN.xy * uWood.w * uWood.x;
        vec3 rc = texture2D(tRefl, ruv).rgb;
        float cosT = saturate(dot(normalize(vViewPosition), normal));
        float fr = reflK.x + (reflK.z - reflK.x) * pow(1.0 - cosT, 5.0);
        fr *= mix(0.92 + 0.16 * gFn, 1.45 - 1.0 * gWoodR, uWood.x);
        outgoingLight = outgoingLight * (1.0 - fr) + rc * fr * reflK.y;
        // cyclorama: the floor sweeps up into the wall, so far away it simply becomes the backdrop
        outgoingLight = mix(outgoingLight, uCyc.rgb, uCyc.a * smoothstep(uCycR.z, uCycR.z * 3.2, length(vWPos.xz - uCycR.xy)));
        #include <opaque_fragment>`);
  };
  floorMat.customProgramCacheKey = () => 'bench';
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  // lights. Each one is a point that the pipeline moves inside its own area every sample.
  const mkSpot = (color, size, map = 2048) => {
    const l = new THREE.SpotLight(color, 1, 0, 0.5, 1, 0);
    l.castShadow = true; l.shadow.mapSize.set(map, map); l.shadow.bias = -0.0004; l.shadow.normalBias = 0.005;
    l.shadow.camera.near = 20; l.shadow.camera.far = 420;
    l.userData = { base: V(0, 100, 0), size };
    scene.add(l, l.target);
    return l;
  };
  const key = mkSpot(0xfff1e2, 40), rim = mkSpot(0xbfeef0, 20), accent = mkSpot(0xff6b4a, 10, 1024);
  const dome = new THREE.DirectionalLight(0xdfeaf0, 1);
  dome.castShadow = true; dome.shadow.mapSize.set(2048, 2048); dome.shadow.bias = -0.0004; dome.shadow.normalBias = 0.005;
  Object.assign(dome.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 10, far: 500 });
  scene.add(dome, dome.target);

  const aim = (l, from, to, intensity, angle = 0.36, size = null) => { l.userData.base.copy(from); l.target.position.copy(to); l.intensity = intensity; l.angle = angle; l.visible = intensity > 0; if (size) l.userData.size = size; };
  const pivot = V(0, 0, 0), mirror = { pivot, rough: 0.012 };
  // world: { bot, top, glow, coral, wood, tint, refl, rough, cyc, env }
  const setWorld = (w) => {
    bdU.bot.value.fromArray(w.bot); bdU.top.value.fromArray(w.top); bdU.glow.value.fromArray(w.glow); bdU.coral.value.fromArray(w.coral);
    floorUniforms.uWood.value.fromArray(w.wood); floorUniforms.uTint.value.fromArray(w.tint); floorUniforms.reflK.value.fromArray(w.refl);
    floorUniforms.uCyc.value.set(w.bot[0], w.bot[1], w.bot[2], w.cyc);
    mirror.rough = w.rough; scene.environmentIntensity = w.env;
  };
  // per-sample jitter: every light inside its own area; the sky dome over the hemisphere (real occlusion)
  const sampleLights = (s) => {
    const jit = (l, [a, b]) => {
      const { base, size } = l.userData, d = base.clone().sub(l.target.position).normalize();
      const u = V(0, 1, 0).cross(d).normalize(), v = d.clone().cross(u);
      l.position.copy(base).addScaledVector(u, (a - 0.5) * size).addScaledVector(v, (b - 0.5) * size);
    };
    jit(key, s.a); jit(rim, s.b); jit(accent, [s.b[1], s.a[0]]);
    const r = Math.sqrt(s.b[0] * 0.92), ph = 2 * Math.PI * s.a[1];
    dome.target.position.copy(pivot); dome.position.copy(pivot).addScaledVector(V(r * Math.cos(ph), Math.sqrt(1 - r * r), r * Math.sin(ph)), 220);
    floorUniforms.uCycR.value.set(pivot.x, pivot.z, mirror.cycR ?? 70);
  };
  // With scene.environment three ignores material.envMapIntensity: materials that need their own share of
  // the studio get the baked map assigned directly. share: [[material, factor], ...]
  const applyEnv = (env, share) => {
    scene.environment = env;
    for (const [m, k] of share) { if (m.envMap !== env) { if (!m.envMap) m.needsUpdate = true; m.envMap = env; } m.envMapIntensity = scene.environmentIntensity * k; }
  };
  return { scene, camera, floor, floorMat, floorUniforms, backdrop: bdU, key, rim, accent, dome, aim, mirror, setWorld, sampleLights, applyEnv };
}
