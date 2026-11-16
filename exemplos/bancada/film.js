// A bancada: o filme de divulgação refeito como filme de produto. Tudo o que o roteiro cita é um
// objeto físico numa bancada de estúdio, fotografado com lente longa. Função pura do tempo:
// window.seek(t) pinta o quadro t. Cada corte e cada evento sai do vo.json (wt / on), nunca de segundos fixos.
//
// Mundos: ESCURO (gancho) -> CLARO (ciclorama osso, o método) -> ESCURO (CTA).
// URL: ?render=1&spp=128&fps=30&acabamento=motor|limpo   (window.ACABAMENTO também vale)
import * as THREE from 'three';
import { Pipeline } from '../../lib/3d/pipeline.js';
import { createStudio, bakeEnvironment, mirrorDir } from '../../lib/3d/studio.js';
import { buildPhone, buildLaptop, PHONE, LAPTOP, DIRECT_SPEC } from '../../lib/3d/models.js';
import { legendTexture, smudgeTexture, grainTexture } from '../../lib/3d/screens.js';
import { makeLaptopScreen, makePhoneScreen, retouchGitHub, oled, label } from './telas.js';
import { buildGlassTimeline, buildPins, buildTiles, buildMeter, buildToggle, buildPlaques, buildGuide, buildMark, contact } from './props.js';

const params = new URLSearchParams(location.search);
const RENDER = params.get('render') === '1';
const W = Number(params.get('w') || 1080), H = Number(params.get('h') || 1920);
const FPS = Number(params.get('fps') || 30);
const SPP = Number(params.get('spp') || (RENDER ? 128 : 12));
const RAD = Math.PI / 180;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const ease = (k) => k * k * k * (k * (k * 6 - 15) + 10);
const easeOut = (k) => 1 - (1 - k) ** 3, easeIn = (k) => k * k * k;
const vlerp = (a, b, k) => V(lerp(a.x, b.x, k), lerp(a.y, b.y, k), lerp(a.z, b.z, k));
const fovOf = (mm) => 2 * Math.atan(18 / mm) / RAD;
const apertureOf = (mm, stop) => mm / 10 / stop / 2;
const CORAL = '#FF6B4A', CORAL_INK = '#8F2408', TEAL_INK = '#094C44', TEAL_LIT = '#5ED3C3', PAPER = '#F4F1EC', INK = '#0B1416', TEAL = 0x35c2b0;
const A = '../../lib/3d/assets/', D = '../divulgacao/assets/';

// ------------------------------------------------------------------------------------------ worlds
// One grade for both: the same slightly teal shadows, warm highlights.
const GRADE = { shadowTint: [-0.0035, 0.0015, 0.0040], highTint: [0.010, 0.003, -0.012] };
const WORLD = {
  dark: { bot: [0.0022, 0.0050, 0.0060], top: [0.0004, 0.0008, 0.0010], glow: [0.0045, 0.0165, 0.0180], coral: [0.080, 0.019, 0.009],
    wood: [1, 1 / 38, 0.72, 0.010], tint: [0.21, 0.20, 0.20], refl: [0.045, 1.0, 0.55], rough: 0.009, cyc: 0, env: 0.5, envFloor: 0.04, dark: true,
    look: { exposure: 1.0, bloom: 0.24, halation: 0.12, vignette: 0.17, grain: 0.042, sat: 0.92, contrast: 1.06 } },
  // warm bone paper sweep with a pool of light: the corners fall off about a stop and a half
  light: { bot: [1.02, 0.975, 0.90], top: [0.74, 0.705, 0.65], glow: [0.08, 0.075, 0.065], coral: [0, 0, 0],
    wood: [0, 1 / 38, 0, 0], tint: [0.83, 0.79, 0.72], refl: [0.06, 1.0, 0.6], rough: 0.022, cyc: 1, env: 0.42, envFloor: 0.85, dark: false,
    look: { exposure: 0.88, bloom: 0.16, halation: 0.05, vignette: 0.14, grain: 0.034, sat: 0.93, contrast: 1.05 } },
};
const tinted = (t) => ({ ...WORLD.light, tint: t, bot: t.map((v) => v * 1.22), top: t.map((v) => v * 0.9), glow: t.map((v) => v * 0.09) });
WORLD.coral = tinted([0.92, 0.56, 0.44]);                 // "Outra cor?"
WORLD.teal = tinted([0.70, 0.80, 0.77]);                  // "Outra voz?"
WORLD.grafite = { ...WORLD.light, bot: [0.030, 0.033, 0.036], top: [0.012, 0.013, 0.015], glow: [0.01, 0.012, 0.014], tint: [0.060, 0.064, 0.070], refl: [0.045, 1.0, 0.5], env: 0.45, envFloor: 0.08, dark: true,
  look: { ...WORLD.dark.look, vignette: 0.15 } };

// ------------------------------------------------------------------------------------------ words
// wt('palavra', n): start of the n-th occurrence in vo.json (accents, case, punctuation ignored).
// on('palavra', n): when it is actually HEARD (energy onset measured in vo.wav; vo.json runs early).
function makeVO(vo, vozes, onsets) {
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9$]/g, '');
  const words = vo.words.map((w, i) => ({ ...w, n: norm(w.w), on: clamp(Math.max(onsets[i] ?? 0, w.t0 + 0.1), w.t0, w.t0 + 0.25) }));
  const find = (word, n = 0) => {
    const alts = word.split('|').map(norm); let k = 0;
    for (const w of words) if (alts.includes(w.n) && k++ === n) return w;
    throw new Error(`vo.json: palavra "${word}" (#${n}) não encontrada`);
  };
  const frases = vo.frases.map((f, i) => ({ ...f, voz: vozes[i]?.voz || 'f1' }));
  return { words, frases, wt: (w, n = 0) => find(w, n).t0, we: (w, n = 0) => find(w, n).t1, on: (w, n = 0) => find(w, n).on, fr: (i) => frases[i],
    voiceAt: (t) => { let v = frases[0].voz; for (const f of frases) if (t >= f.t0 - 0.12) v = f.voz; return v; } };
}

const loadImage = async (src) => { const im = new Image(); im.src = src; await im.decode(); return im; };
const pad3 = (n) => String(n).padStart(3, '0');

async function main() {
  const canvas = document.getElementById('film');
  canvas.width = W; canvas.height = H;
  if (RENDER) document.body.classList.add('render');
  await Promise.all(['400 40px Sans', '500 40px Sans', '600 40px Sans', '700 40px Sans', '400 40px Mono', '500 40px Mono', '600 40px Chrome', 'italic 400 40px Serif'].map((f) => document.fonts.load(f, 'AaÁã0123·→$')));
  const J = (u) => fetch(u).then((r) => r.json());
  const DEMO = [30, 90, 150, 210, 270, 330, 380], PLAY0 = 196, PLAYN = 84;
  const [voRaw, vozes, roteiro, envData, onsets, ghRaw, prints, demo, play, variants, pagesImg, beats] = await Promise.all([
    J('vo.json'), J('vozes.json'), J('roteiro.json'), J('assets/envelope.json'), J('assets/onsets.json'),
    loadImage(D + 'github-topo.png'), loadImage(A + 'tex/fingerprints/Fingerprints004_1K-JPG_Color.jpg'),
    Promise.all(DEMO.map((i) => loadImage(`${D}demo/f_${pad3(i)}.jpg`))),
    Promise.all(Array.from({ length: PLAYN }, (_, i) => loadImage(`${D}demo/f_${pad3(PLAY0 + i)}.jpg`))),
    Promise.all(['base', 'escuro', 'impacto'].map((n) => loadImage(`${D}variantes/${n}.jpg`))),
    Promise.all(['p00', 'p01', 'p02'].map((n) => new THREE.TextureLoader().loadAsync(`${D}pdf/${n}.png`))),
    fetch('beats.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ]);
  const VO = makeVO(voRaw, vozes, onsets), { wt, we, on, fr } = VO;
  const DUR = Math.round((voRaw.dur + 2.2) * 30) / 30;
  const env = (t) => { const i = t * envData.rate; const a = envData.env[Math.floor(i)] ?? 0, b = envData.env[Math.floor(i) + 1] ?? 0; return t < 0 ? 0 : lerp(a, b, i % 1); };

  // ---- key times. Cuts: two 60-fps frames before the word's vo.json start. Hits: the audible onset.
  const LEAD = 2 / 60, TW = ['cada', 'cena', 'entra', 'exatamente', 'na', 'palavra', 'falada'];
  const T = {
    editado: wt('editado'), still: we('editado'), ele: wt('ele'), prog: on('programado'), abriu: wt('abriu'), editor: on('editor'), arrastou: on('arrastou'), clipe: wt('clipe'), clipeEnd: we('clipe'),
    voce: wt('voce'), roteiro: wt('roteiro'), ia: Math.min(wt('a'), wt('inteligencia') - 0.1), narra: on('narra'),
    tiles: TW.map((w) => on(w)), quer: fr(5).t0, estilo: fr(6).t0, voz: fr(7).t0, vozW: on('voz'), um: fr(8).t0, so: on('so'),
    sessenta: fr(9).t0, segundo: on('segundo'), pronto: on('pronto'), custa: fr(10).t0, zero: on('zero'), os: wt('os'), modelos: on('modelos'),
    metodo: fr(11).t0, metodoW: on('metodo'), guia: wt('guia'), pdf: on('pdf'), codigo: on('codigo'), procure: fr(12).t0, fabrica: wt('fabrica'), criativosEnd: we('criativos'), crie: wt('crie'), fim: fr(12).t1,
  };
  const CUT = { s1b: T.ele - 0.02, s2: fr(2).t0 - LEAD, s3: fr(3).t0 - LEAD, s4: T.voce - LEAD, s5: T.ia - LEAD, s6: wt('cada') - LEAD,
    s7a: T.quer - LEAD, s7b: T.estilo - LEAD, s7c: T.voz - LEAD, s8: T.um - LEAD, s9: T.sessenta - LEAD, s10: T.custa - LEAD, s11: T.metodo - LEAD, s12a: T.procure - LEAD, s12b: T.crie - LEAD };
  const SHOTS = [['1a', 0], ['1b', CUT.s1b], ['2', CUT.s2], ['3', CUT.s3], ['4', CUT.s4], ['5', CUT.s5], ['6', CUT.s6], ['7a', CUT.s7a], ['7b', CUT.s7b], ['7c', CUT.s7c],
    ['8', CUT.s8], ['9', CUT.s9], ['10', CUT.s10], ['11', CUT.s11], ['12a', CUT.s12a], ['12b', CUT.s12b]].map(([id, t0], i, a) => ({ id, t0, t1: a[i + 1] ? a[i + 1][1] : DUR }));
  const shotAt = (t) => { let s = SHOTS[0]; for (const q of SHOTS) if (t >= q.t0 - 1e-6) s = q; return s; };
  const STAR = CUT.s12b - 0.6;                                        // the star is tapped and stays filled for 0.6 s

  // ---- the bench
  const pipe = new Pipeline(canvas, W, H);
  pipe.acabamento = params.get('acabamento') || window.ACABAMENTO || 'motor';
  const S = await createStudio(pipe, A);
  const { scene, key, rim, accent, dome, aim } = S;
  S.mirror.cycR = 70;
  const gh = retouchGitHub(ghRaw), IMG = { gh, ghRaw, demo };
  const smudge = smudgeTexture(prints), smudgeFaint = smudgeTexture(prints, { clean: 0.4, k: 0.3, seed: 11 }), grain = grainTexture();
  const lapScr = makeLaptopScreen(IMG, roteiro), phScr = makePhoneScreen(IMG);
  const phone = buildPhone(phScr.tex, { emissive: 1.5, smudge, grain });
  const enterTex = label('enter', { w: 560, h: 300, size: 92, color: '#ff7a5a', weight: 560, track: 0 });
  const laptop = buildLaptop(lapScr.tex, legendTexture(), { emissive: 1.75, smudge: smudgeFaint, grain, enterTex });
  const screenGlow = new THREE.RectAreaLight(0x6fb3b0, 2.0, LAPTOP.w - 2, LAPTOP.d - 2);
  screenGlow.position.set(0, LAPTOP.d / 2, 0.3); screenGlow.rotation.y = Math.PI; laptop.userData.lid.add(screenGlow);
  const timeline = buildGlassTimeline(demo), pins = buildPins(44, grain), tiles = buildTiles(TW);
  const meterTex = oled(1320, 700, (c, w, h, k = 0) => {
    c.fillStyle = '#ffb469'; c.textBaseline = 'alphabetic'; c.font = '600 380px Mono'; c.fillText('60', 68, 392); c.font = '500 156px Mono'; c.fillText('fps', 600, 392);
    c.globalAlpha = 0.25 + 0.75 * k; c.font = '500 124px Mono'; c.fillText('-14 LUFS', 72, 600); c.globalAlpha = 1;
  });
  const meter = buildMeter(meterTex, grain);
  const zeroTex = oled(920, 400, (c, w, h, k = 0) => { c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '600 290px Mono';
    c.globalAlpha = 0.22 * (1 - k); c.fillStyle = '#b9c0c4'; c.fillText('R$ --', w / 2, h / 2 + 16); c.globalAlpha = k; c.fillStyle = '#ff7a5a'; c.fillText('R$ 0', w / 2, h / 2 + 16); c.globalAlpha = 1; });
  const toggle = buildToggle(zeroTex, grain), plaques = buildPlaques(['Kokoro', 'Ollama', 'Whisper', 'three.js']);
  const guide = buildGuide(pagesImg), mark = buildMark(); mark.add(contact(5.2, 1.3, 0.6, 1.0));
  const phoneC = contact(PHONE.w, PHONE.d, 0.62, 1.1), laptopC = contact(LAPTOP.w, LAPTOP.d, 0.5, 1.8);
  const PROPS = [phone, laptop, timeline, pins, tiles, meter, toggle, plaques, guide, mark, phoneC, laptopC];
  scene.add(...PROPS);
  const bokeh = [];
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), new THREE.MeshBasicMaterial()); m.layers.enable(1); scene.add(m); bokeh.push(m); }
  const setBokeh = (list) => bokeh.forEach((m, i) => { const b = list[i]; m.visible = !!b; if (b) { m.position.set(b[0], b[1], b[2]); m.scale.setScalar(b[3]); m.material.color.set(b[4]).multiplyScalar(b[5]); } });

  const PY = PHONE.h / 2 + 0.03;
  const place = (o, x, y, z, ry = 0, rx = 0, rz = 0) => {
    o.position.set(x, y, z); o.rotation.set(rx, ry, rz, 'YXZ'); o.scale.setScalar(1); o.visible = true; o.updateMatrixWorld(true);
    const c = o === phone ? phoneC : o === laptop ? laptopC : null;
    if (c) { c.position.set(x, 0.012, z); c.rotation.set(-Math.PI / 2, 0, ry + (o === phone && Math.abs(rx) > 0.5 ? 0 : 0), 'YXZ'); c.rotation.set(-Math.PI / 2, ry, 0, 'YXZ'); c.visible = true; }
    return o;
  };
  const onPhone = (x, y) => phone.localToWorld(V(x, y, PHONE.d / 2 + 0.07));
  const lapPt = (q) => laptop.userData.lid.localToWorld(V(q.x, q.v, 0.03));
  const lapAt = (lx, ly) => lapPt(lapScr.at(lx, ly));
  const normalOf = (o) => V(0, 0, 1).transformDirection(o.matrixWorld);
  const camOf = (pos, target, mm, focusPt, stop, extra = {}) => { const f = target.clone().sub(pos).normalize(); return { pos, target, fov: fovOf(mm), focus: Math.max(4, focusPt.clone().sub(pos).dot(f)), aperture: apertureOf(mm, stop), ...extra }; };
  // a two-frame punch-in on a hard cut (1.04 -> 1.0), or a small push on an accent
  const punch = (cam, t, tc, amt = 0.04, len = 2 / 30) => { cam.fov *= 1 - amt * (1 - prog(t, tc, tc + len)) * (t >= tc ? 1 : 0); return cam; };
  const pinsFrom = (t, dt = 0.045, forced = null) => { const n = pins.userData.n, hs = [], cs = []; for (let i = 0; i < n; i++) { const q = t - (n - 1 - i) * dt; hs.push(env(q)); cs.push(forced ?? (VO.voiceAt(q) === 'f1' ? 0xff6b4a : TEAL)); } pins.userData.set(hs, cs); };

  let world = WORLD.dark;
  const setWorld = (name) => {
    const w = WORLD[name]; world = w; S.setWorld(w);
    const L = pipe.look; Object.assign(L, { exposure: w.look.exposure, bloom: w.look.bloom, halation: w.look.halation, vignette: w.look.vignette, grain: w.look.grain, sat: w.look.sat, contrast: w.look.contrast, cat: 0.3 });
    L.shadowTint.fromArray(GRADE.shadowTint); L.highTint.fromArray(GRADE.highTint);
    const dk = name === 'dark';
    phone.userData.metal.color.set(dk ? 0x6a6a6c : 0x4a4b4e); phone.userData.back.color.set(0x2a2b2e);
    laptop.userData.alu.color.set(dk ? 0x45474c : name === 'grafite' ? 0x303236 : 0x9a9da2); laptop.userData.pad.color.copy(laptop.userData.alu.color);
    laptop.userData.legends.material.color.set(dk ? 0xffe9d2 : 0xffffff).multiplyScalar(0.8); laptop.userData.enterLegend.material.color.setScalar(1.2);
    screenGlow.intensity = dk ? 2.2 : 0.6; screenGlow.color.set(0x6fb3b0);
    DIRECT_SPEC.value = dk ? 1 : 0.12;
    key.color.set(dk ? 0xfff1e2 : 0xfff4e6); rim.color.set(0xbfeef0); accent.color.set(0xff6b4a);
    const ck = w.dark ? 0 : 1; [phoneC, laptopC].forEach((c) => { c.material.uniforms.k.value = c.userData.k * ck; });
  };
  const lightsDark = (c) => { aim(key, V(-64, 96, 58).add(c), V(0, 4, 0).add(c), 3.2, 0.34, 44); aim(rim, V(60, 62, -84).add(c), V(2, 6, -2).add(c), 7.5, 0.24, 18); aim(accent, V(92, 12, -20).add(c), V(6, 0, -12).add(c), 2.0, 0.5, 10); dome.intensity = 0.2; S.mirror.pivot.copy(c).setY(0); };
  // light world: a tight key (0.22) makes a pool; the sky dome is the fill
  const lightsLight = (c) => { aim(key, V(72, 106, -76).add(c), V(0, 4, 0).add(c), 5.2, 0.22, 34); aim(rim, V(-80, 70, 60).add(c), V(0, 6, 0).add(c), 0.8, 0.4, 40); aim(accent, V(92, 12, -20).add(c), V(6, 0, -12).add(c), 0, 0.5, 10); dome.intensity = 2.6; S.mirror.pivot.copy(c).setY(0); };

  const envs = {};
  const envShare = () => { const d = world.dark; return [[S.floorMat, 0], [phone.userData.glass.material, d ? 1 : 0.5], [laptop.userData.glass.material, d ? 0.1 : 0.08], [laptop.userData.alu, d ? 1 : 0.5], [laptop.userData.pad, d ? 1 : 0.5], [phone.userData.metal, d ? 1 : 0.7]]; };
  const sweepCard = (cam, obj, at, corner, k, roll, w = 16, h = 30) => { const n = normalOf(obj), c0 = mirrorDir(cam.pos, at(0, 0), n), c1 = mirrorDir(cam.pos, at(...corner), n); return { dir: c1.clone().addScaledVector(c1.clone().sub(c0), 1.25), w, h, roll, k, soft: 0.14, color: 0xfff6ec }; };

  // ------------------------------------------------------------------------------------------ shots
  const hideAll = () => { PROPS.forEach((o) => { o.visible = false; }); setBokeh([]); laptop.userData.setOpen(108); laptop.userData.enter.position.copy(laptop.userData.enter.userData.home); stage.shutter = 0.5; };
  // 1a + 1b are ONE camera move: push in on the timeline, swing to the code while "Ele foi" is said.
  const collapse = (t) => (t >= T.prog ? 1 : t >= T.prog - 2 / 60 ? lerp(0.85, 1, prog(t, T.prog - 2 / 60, T.prog)) : 0.85 * easeIn(prog(t, T.prog - 0.27, T.prog - 2 / 60)));
  const cam1 = (t) => {
    const k = ease(prog(t, T.prog - 0.44, T.prog + 0.02)), push = easeOut(prog(t, 0, 1.25)) + 0.25 * prog(t, 1.25, T.prog - 0.44), settle = ease(prog(t, T.prog, CUT.s2));
    const f = vlerp(lapAt(700, 850), lapPt(lapScr.codeAt(4, 0.55)), k), tgt = f.clone().add(vlerp(V(0.4, 1.4, 0), V(0.9, 0.5, 0), k));
    const off = vlerp(V(7.6, 4.9, 34.5 - 6 * push), V(-6.2, 3.6, 25.5), k).multiplyScalar(1 - 0.045 * settle);
    return camOf(tgt.clone().add(off), tgt, 100, f, 4.0, { near: 0.5 });
  };
  const light1 = (t) => {
    place(laptop, 0, 0, 0, 0); lightsDark(V(0, 0, 0));
    const hit = prog(t, T.prog, T.prog + 0.1);
    aim(key, V(-60, 34, -52), V(2, 1.5, -3), 16 + 10 * hit, 0.3, 12); key.color.set(0xffa860); aim(rim, V(60, 70, -70), V(0, 2, -4), 3.0, 0.34, 18); aim(accent, V(0, 0, 0), V(1, 0, 0), 0); dome.intensity = 0.12;
    screenGlow.color.set(hit > 0.5 ? 0xffb38a : 0x6fb3b0); screenGlow.intensity = 2.2 + 1.6 * hit;
  };
  const screen1 = (t) => lapScr.editor({ play: 0.17 + 0.15 * prog(t, 0, T.still - 0.02), k: collapse(t), drag: 1 - easeOut(prog(t, 0.06, 0.42)), blink: ((t - T.prog) * 2.2) % 1 < 0.6 });
  const SH = {
    '1a': { world: 'dark', envKey: 'lapDark', screen: screen1, at: (t) => { light1(t); return cam1(t); },
      cap: () => ({ lines: [[['Esse', -9], ['vídeo', -9], ['não', -9, 1]], [['foi', -9], ['editado.', -9, 0, T.editado + 0.12]]], scrim: 0.86 }) },
    '1b': { world: 'dark', envKey: 'lapDark', screen: screen1, at: (t) => { light1(t); return cam1(t); },
      cap: () => ({ lines: [[['Ele', T.ele], ['foi', wt('foi', 1)]], [['programado.', T.prog - 0.07, 1]]], scrim: 0.6 }) },
    // ninguém abriu um editor: a tampa cai e quica
    '2': { world: 'dark', envKey: 'dark',
      screen: () => lapScr.editor({ play: 0.32, k: 1, blink: true }),
      at(t) {
        place(laptop, 0, 0, 0, 30 * RAD); lightsDark(V(0, 0, 0)); aim(rim, V(-30, 70, -84), V(0, 4, 0), 16, 0.34, 18); aim(key, V(-64, 96, 58), V(0, 4, 0), 7, 0.34, 44); laptop.userData.alu.color.set(0x6d7075);
        const shut = T.editor, c = prog(t, T.abriu, shut), a = t - shut, open = 108 * (1 - easeIn(c)) + (a >= 0 ? 6.5 * Math.exp(-a * 9) * Math.abs(Math.cos(a * 17)) : 0);
        laptop.userData.setOpen(open); screenGlow.intensity = 2.2 * clamp(open / 60);
        setBokeh([[-44, 50, -230, 3.4, 0xffb070, 1.5], [14, 68, -260, 3.8, 0xffa860, 1.1], [58, 42, -215, 3.0, 0xffc890, 1.4], [-86, 72, -280, 3.6, 0xff9a50, 0.9], [96, 76, -300, 3.2, 0xffb070, 0.8]]);
        const k = ease(prog(t, CUT.s2, CUT.s3)), pos = vlerp(V(-15, 13, 60), V(-12, 12, 55), k), tgt = V(0.4, 10.5 - 5.5 * easeIn(c), 0);
        return punch(camOf(pos, tgt, 50, V(0, 4, 6), 4.0), t, shut, 0.02, 0.1);
      },
      cap: () => ({ lines: [[['Ninguém', fr(2).t0], ['abriu', T.abriu]], [['um', wt('um', 0)], ['editor.', T.editor - 0.07, 1]]], scrim: 0.55 }) },
    // ninguém arrastou um clipe: clipes de vidro saem dos trilhos sozinhos; o último, coral, varre a lente
    '3': { world: 'dark', envKey: 'dark',
      at(t) {
        place(timeline, 0, 0, 0, 0); lightsDark(V(0, 0, 0));
        aim(rim, V(-30, 10, -90), V(0, 0.5, 0), 18, 0.3, 14); aim(key, V(-40, 100, 50), V(0, 0, 0), 7.5, 0.34, 40); aim(accent, V(92, 14, -30), V(6, 0, -6), 1.6, 0.5, 10);
        const k = ease(prog(t, CUT.s3, CUT.s4)), pos = V(-10 + 5 * k, 9, 30), tgt = V(-2.4 + 5 * k, 0.5, 0), fwd = tgt.clone().sub(pos).normalize();
        const B = timeline.userData.blocks, order = [4, 9, 3, 8, 2, 6, 1, 5, 0];           // right to left; the coral one in front (7) goes last
        order.forEach((bi, i) => { const b = B[bi], q = easeIn(prog(t, T.arrastou + i * 0.055, T.arrastou + i * 0.055 + 0.4)); b.position.copy(b.userData.home); b.position.x += 75 * q; b.rotation.set(0, 0, 0); });
        const b = B[7], q = easeIn(prog(t, T.clipeEnd - 0.12, CUT.s4 + 0.02)), near = pos.clone().addScaledVector(fwd, 4.6).add(V(0, -0.6, 0));
        b.position.lerpVectors(b.userData.home, near, q); b.rotation.set(q * 1.15, 0, q * 0.4);
        timeline.userData.needle.position.x = 2.2 + 0.25 * Math.sin(t * 3);
        stage.shutter = t > T.arrastou ? 0.9 : 0.5;
        return camOf(pos, tgt, 100, V(tgt.x, 0.9, 1.9), 2.8, { near: 0.5 });
      },
      cap: () => ({ lines: [[['Ninguém', fr(3).t0], ['arrastou', T.arrastou - 0.07]], [['um', wt('um', 1)], ['clipe.', T.clipe, 1]]], scrim: 0.88 }) },
    // mundo claro. você escreve o roteiro: notebook prata em 3/4 no ciclorama; a linha real aparece na fala
    '4': { world: 'light', envKey: 'light',
      screen(t) { const f = fr(4); let n = 0; for (let i = f.words[0]; i <= f.words[1]; i++) { const w = VO.words[i]; if (t >= w.t0) n += Math.round((w.w.length + 1) * prog(t, w.t0, Math.min(w.t1, w.t0 + 0.22))); } lapScr.roteiro({ typed: n, blink: (t * 2.4) % 1 < 0.6 }); },
      at(t) {
        place(laptop, 0, 0, 0, 22 * RAD); lightsLight(V(0, 0, -6));
        const k = ease(prog(t, CUT.s4, CUT.s5)), f = lapPt(lapScr.rotLine(0.3)), tgt = f.clone().add(V(-1.0, 5.6, 0));
        return camOf(V(-20, 9, 44).lerp(tgt, 0.04 * k), tgt, 85, f, 5.6, { near: 0.5 });
      },
      cap: () => ({ lines: [[['Você', T.voce], ['escreve', wt('escreve')]], [['o', wt('o', 0)], ['roteiro.', T.roteiro, 1]]] }) },
    // a IA narra: régua de pinos em profundidade, movida pela envoltória REAL da narração
    '5': { world: 'light', envKey: 'light',
      at(t) {
        place(pins, 0, 0, 0, 28 * RAD); lightsLight(V(0, 0, 0)); pinsFrom(t);
        aim(key, V(-120, 40, -60), V(0, 2, 0), 6.0, 0.24, 6); aim(rim, V(70, 80, 60), V(0, 3, 0), 1.4, 0.4, 30); dome.intensity = 1.5; stage.shutter = 0.25;
        const k = prog(t, CUT.s5, CUT.s6), pos = V(22 - 8 * ease(k), 9, 34), tgt = V(1.0, 3.6, 0);
        return camOf(pos, tgt, 100, pins.localToWorld(V(lerp(3, 12, k), 4, 0)), 2.8);
      },
      cap: () => ({ lines: [[['A', T.ia], ['IA', wt('inteligencia')], ['narra.', T.narra - 0.07, 1]]] }) },
    // cada cena entra na palavra falada: a ficha acende NA palavra e, no mesmo quadro, a tela troca de cena
    '6': { world: 'light', envKey: 'light',
      screen(t) { let i = 0; T.tiles.forEach((w, j) => { if (t >= w) i = j; }); phScr.image(demo[i]); },
      at(t) {
        place(phone, 0, PY, -5, 0, -7 * RAD); place(tiles, 0, 0, 0, 0); lightsLight(V(0, 0, 2));
        let cur = 0, pk = 0; const TL = tiles.userData.tiles;
        TL.forEach((tl, i) => { tl.position.set(0, 0, 0.6 + i * 2.78); const a = t - T.tiles[i]; if (a >= 0) { cur = i; pk = Math.max(pk, Math.exp(-a * 7)); } const lit = a < 0 ? 0 : 0.45 + 0.55 * Math.exp(-a * 3.2);
          tl.userData.on.material.opacity = lit; tl.userData.off.material.opacity = 1 - clamp(lit * 1.6); tl.userData.cap.position.y = 0.5 - 0.18 * (a >= 0 ? Math.exp(-a * 14) : 0); });
        const k = ease(prog(t, CUT.s6, CUT.s7a)), pos = vlerp(V(3.5, 58, 78), V(2.5, 55, 74), k), tgt = V(0, 10.4, 6.2);
        const fz = lerp(TL[Math.max(0, cur - 1)].position.z, TL[cur].position.z, easeOut(prog(t, T.tiles[cur], T.tiles[cur] + 0.2)));
        const cam = camOf(pos, tgt, 85, V(0, 1, fz), 5.6); cam.fov *= 1 - 0.015 * pk; return cam;
      },
      cap: () => ({ lines: [], tag: 'sincronia por palavra' }) },
    // três cortes secos no MESMO enquadramento: cor (tema), estilo (tipografia), voz
    '7a': { world: 'coral', envKey: 'phLight', screen: () => phScr.image(variants[1], true), at: (t) => shot7(t, 0), cap: () => ({ lines: [[['Outra', wt('outra', 0)], ['cor?', on('cor'), 1]]] }) },
    '7b': { world: 'grafite', envKey: 'phGraf', screen: () => phScr.image(variants[2], true), at: (t) => shot7(t, 1), cap: () => ({ lines: [[['Outro', T.estilo], ['estilo?', on('estilo'), 1]]] }) },
    '7c': { world: 'teal', envKey: 'phLight', screen: () => phScr.image(variants[0]), at: (t) => shot7(t, 2), cap: (t) => ({ lines: [[['Outra', T.voz], ['voz?', T.vozW, 1]]], accent: TEAL_INK, chip: ['voz 1', 'voz 2', prog(t, T.vozW, T.vozW + 0.12)] }) },
    // um comando só: a tecla Enter afunda, a legenda acende, o foco sobe para a saída do comando
    '8': { world: 'light', envKey: 'enter',
      screen: (t) => lapScr.terminal({ ran: prog(t, T.so + 0.08, T.so + 0.45), blink: (t * 2.4) % 1 < 0.6 }),
      at(t) {
        place(laptop, 0, 0, 0, 0); lightsLight(V(10, 0, -2)); aim(key, V(-40, 96, 60), V(12, 1, -2), 7.0, 0.3, 30); dome.intensity = 2.0;
        const en = laptop.userData.enter, a = t - T.so, dip = a < 0 ? 0 : a < 0.05 ? a / 0.05 : a < 0.15 ? 1 : Math.max(0, 1 - (a - 0.15) / 0.2);
        en.position.copy(en.userData.home); en.position.y -= 0.24 * dip; en.updateMatrixWorld(true); laptop.userData.enterLegend.material.color.setScalar(1.2 + 1.6 * Math.min(1, dip * 2) + (a > 0 ? 0.7 * Math.exp(-a * 3) : 0));
        const E = laptop.localToWorld(en.userData.home.clone()), k = ease(prog(t, CUT.s8, CUT.s9)), rk = ease(prog(t, T.so + 0.22, T.so + 0.6));
        const tgt = E.clone().add(V(-0.4, 0.8 + 1.6 * rk, -2.3 - 2.0 * rk));
        return punch(camOf(tgt.clone().add(V(9.2 - 0.8 * k, 11.5, 22 - 0.8 * k)), tgt, 135, vlerp(E.clone().add(V(0, 0.1, 0.3)), lapAt(700, 310), rk), 9.0, { near: 0.5 }), t, T.so, 0.025, 0.12);
      },
      cap: () => ({ lines: [[['Um', T.um], ['comando', wt('comando')], ['só.', T.so - 0.07, 1]]], scrim: 0.55, dark: true }) },
    // 60 quadros por segundo: giro com desfoque de movimento de verdade, trava com sobressalto, medidor
    '9': { world: 'light', envKey: 'phLight',
      screen(t) { phScr.image(play[Math.floor(clamp((t - CUT.s9) / (CUT.s10 - CUT.s9)) * (PLAYN - 1))]); meterTex.redraw(prog(t, T.pronto, T.pronto + 0.18)); },
      at(t) {
        const lock = T.segundo, t0 = lock - 0.72, sp = prog(t, t0, lock - 0.08), a = t - lock;
        const rem = t < lock - 0.08 ? 25 + 515 * (1 - sp) ** 1.7 : a < 0 ? 25 * (-a / 0.08) : -6 * Math.exp(-a * 24) * Math.cos(a * 34);
        place(phone, -3.4, PY, 0, (-14 - (t < t0 ? 540 : rem)) * RAD, -3.5 * RAD); place(meter, 4.2, 0, -4.5, -24 * RAD); meter.scale.setScalar(0.85); meter.updateMatrixWorld(true); lightsLight(V(0, 0, 0));
        meter.userData.setLevel(a >= 0 ? 0.8 + 0.2 * prog(t, T.pronto, T.pronto + 0.2) : sp * 0.7);
        stage.shutter = a < 0 && t > t0 ? 1.0 : 0.5;
        const k = ease(prog(t, CUT.s9, CUT.s10)), pos = vlerp(V(7.0, 14.5, 63), V(5.2, 13.6, 58.5), k), tgt = V(0.6, 9.4, 0), rk = ease(prog(t, T.pronto - 0.1, T.pronto + 0.4));
        return punch(camOf(pos, tgt, 85, vlerp(onPhone(0, 1), meter.localToWorld(V(-0.9, 3, 1.5)), rk), 4.0), t, lock, 0.02, 0.12);
      },
      cap: (t) => (t < T.pronto - 0.12 ? { lines: [[['60', T.sessenta], ['quadros', wt('quadros')]], [['por', wt('por')], ['segundo.', T.segundo - 0.07, 1]]] } : { lines: [[['Pronto', T.pronto - 0.07], ['pra', wt('pra')], ['postar.', on('postar'), 1]]] }) },
    // custa zero: a alavanca recua, estala de "pago" para "grátis" e balança; ao fundo, os modelos abertos
    '10': { world: 'light', envKey: 'light',
      screen: (t) => zeroTex.redraw(prog(t, T.zero + 0.03, T.zero + 0.16)),
      at(t) {
        place(toggle, 0, 0, 0, 6 * RAD); place(plaques, 0, 0, -11.5, 0); lightsLight(V(0, 0, -2)); aim(key, V(-90, 70, -40), V(0, 2, -2), 6.2, 0.24, 26);
        plaques.children.forEach((p, i) => { p.scale.setScalar(0.6); p.position.set([-2.6, 2.6, -2.9, 2.9][i], 0, i < 2 ? 2.4 : -1.4); p.rotation.y = (i % 2 ? -1 : 1) * 0.08; });
        const a = t - T.zero, sn = a < -0.21 ? 0 : a < -0.03 ? -0.1 * ease((a + 0.21) / 0.18) : a < 0.06 ? lerp(-0.1, 1, easeIn((a + 0.03) / 0.09)) : 1 + 0.25 * Math.exp(-(a - 0.06) * 12) * Math.cos((a - 0.06) * 38);
        toggle.userData.set(sn);
        const k = prog(t, CUT.s10, CUT.s11), tgt = V(0, 3.2, -0.6), pos = tgt.clone().add(V(3.2, 13, 34).multiplyScalar(1 - 0.08 * k)), rk = ease(prog(t, T.os - 0.05, T.os + 0.45));
        return punch(camOf(pos, tgt, 85, vlerp(toggle.localToWorld(V(0, 4.2, 0.2)), V(0, 1.2, -10.4), rk), 4.0), t, T.zero + 0.06, 0.02, 0.12);
      },
      cap: (t) => (t < T.os - 0.1 ? { lines: [[['Custa', wt('custa')], ['zero.', T.zero - 0.07, 1]]] } : { lines: [[['Modelos', T.modelos - 0.07], ['abertos.', on('abertos'), 1]]] }) },
    // entra a segunda voz. método, guia em PDF, código no GitHub: a capa inteira, depois a grua revela o notebook
    '11': { world: 'light', envKey: 'light',
      screen: () => { lapScr.github(); },
      at(t) {
        place(guide, -7.5, 0, 9, 0.16); place(laptop, 9.5, 0, -15, -24 * RAD); lightsLight(V(0, 0, 0));
        const k = ease(prog(t, T.guia + 0.1, T.codigo - 0.12)), d = prog(t, CUT.s11, CUT.s12a), rk = ease(prog(t, T.codigo - 0.45, T.codigo + 0.1));
        const pos = vlerp(V(-7.6, 62 - 3 * d, 21), V(-3, 36, 62 - 3 * d), k), tgt = vlerp(V(-7.5, 0.7, 4.4), V(3.5, 18.6, -5), k);
        return camOf(pos, tgt, 70, vlerp(V(-7.5, 0.8, 9), lapAt(890, 420), rk), 4.5);
      },
      cap: (t) => (t < T.guia - 0.12 ? { lines: [[['Método.', T.metodoW - 0.07, 1]]], chip: ['voz 1', 'voz 2', prog(t, T.metodo, T.metodo + 0.15)] } : t < T.codigo - 0.15 ? { lines: [[['Guia', T.guia], ['em', wt('em')], ['PDF.', T.pdf - 0.07, 1]]], scrim: 0.86 } : { lines: [[['Código', T.codigo - 0.07], ['aberto.', wt('inteiro'), 1]]] }) },
    // CTA: a busca digitada na fala, o resultado, a estrela (que fica acesa)
    '12a': { world: 'dark', envKey: 'phDark',
      screen(t) { const txt = 'fábrica de criativos', n = Math.round(txt.length * prog(t, T.procure + 0.15, T.criativosEnd - 0.15));
        phScr.search({ text: txt.slice(0, n), result: easeOut(prog(t, T.criativosEnd - 0.1, T.criativosEnd + 0.12)), star: prog(t, STAR, STAR + 0.12), tap: prog(t, STAR, STAR + 0.35), blink: (t * 2.4) % 1 < 0.6 }); },
      at(t) {
        place(phone, 0, PY, 0, -9 * RAD, -3 * RAD); lightsDark(V(0, 0, 0));
        setBokeh([[60, 60, -300, 1.3, 0xffd9b8, 1.4], [96, 34, -280, 1.0, 0xff6b4a, 2.2]]);
        const k = ease(prog(t, T.fabrica - 0.2, STAR)), tgt = vlerp(onPhone(0.1, 4.6), onPhone(0.1, 1.2), k);
        return punch(camOf(tgt.clone().add(V(5.2, 1.6, 32 - 2.5 * k)), tgt, 100, tgt, 4.0), t, STAR, 0.02, 0.12);
      },
      cap: () => ({ lines: [[['Procure', T.procure], ['no', T.fabrica], ['GitHub.', wt('criativos'), 1]]], y: 1500, maxW: 840, scrim: 0.6 }) },
    // cartão final: a bancada no escuro, tudo em silhueta com recorte coral, a marca à frente
    '12b': { world: 'dark', envKey: 'dark',
      screen: () => { lapScr.editor({ play: 0.32, k: 1, blink: true }); phScr.github(); },
      at(t) {
        place(mark, 0.4, 0, 15, 4 * RAD); place(phone, -7.5, PY, 2, 24 * RAD, -3.5 * RAD); place(laptop, 9, 0, -15, -18 * RAD); place(pins, -9, 0, -20, 14 * RAD);
        pinsFrom(Math.min(t, T.fim + 0.2));
        lightsDark(V(0, 0, 0)); aim(key, V(-40, 90, 80), V(0, 2, 12), 1.5 + 2.4 * ease(prog(t, CUT.s12b, CUT.s12b + 0.9)), 0.16, 30);
        aim(accent, V(-70, 30, -80), V(0, 4, 0), 7.0, 0.42, 14); aim(rim, V(70, 56, -84), V(0, 4, 0), 4.0, 0.4, 18);
        setBokeh([[70, 60, -300, 1.3, 0xffd9b8, 1.2], [-96, 44, -280, 1.0, 0xff6b4a, 2.0]]);
        const k = easeOut(prog(t, CUT.s12b, CUT.s12b + 1.2)), d = prog(t, CUT.s12b + 0.6, DUR);
        const pos = vlerp(V(1, 12, 76), V(1.6, 15.5, 106 - 10 * d), k), tgt = V(0.4, 9.8, 0);
        return camOf(pos, tgt, 85, V(0.4, 3, 15), 4.0);
      } },
  };
  function shot7(t, i) {
    place(phone, 0, PY, 0, -17 * RAD, -3.5 * RAD);
    if (WORLD[SH[['7a', '7b', '7c'][i]].world].dark) { lightsDark(V(0, 0, 0)); aim(key, V(-64, 96, 58), V(0, 4, 0), 4.2, 0.34, 44); aim(accent, V(0, 0, 0), V(1, 0, 0), 0); dome.intensity = 0.5; }
    else lightsLight(V(0, 0, 0));
    // "outra voz": the pins stand in the focus plane, coral, and turn teal as the word is heard
    if (i === 2) { place(pins, 0.9, 0, 4.6, -17 * RAD); pins.scale.setScalar(0.5); pins.updateMatrixWorld(true); pinsFrom(t, 0.03, t < T.vozW ? 0xff6b4a : TEAL); }
    const k = prog(t, CUT.s7a, CUT.s8), tc = [CUT.s7a, CUT.s7b, CUT.s7c][i];
    return punch(camOf(V(8.9, 13.6, 50).multiplyScalar(1 - 0.03 * k).setY(13.6), V(0.3, 9.6, 0), 85, onPhone(-0.2, 1.0), 4.0), t, tc);
  }

  const stage = {
    scene, camera: S.camera, floor: S.floor, floorUniforms: S.floorUniforms, mirror: S.mirror, shot: '1a', shutter: 0.5,
    emissiveHide: () => [],
    // glass seen through glass: the back rail is rendered first, then the front one (pipeline.renderMain)
    glassLayers: () => (stage.shot === '3' ? timeline.userData.layers : []),
    prepare(t) { const sh = SH[shotAt(t).id]; sh.screen?.(t); },
    update(t) {
      const s = shotAt(t), sh = SH[s.id];
      stage.shot = s.id; hideAll(); setWorld(sh.world);
      const cam = sh.at(t);
      const e = envs[sh.envKey]; if (e) S.applyEnv(e, envShare());
      if (params.has('exp')) pipe.look.exposure = Number(params.get('exp'));
      return cam;
    },
    sample(s) { S.sampleLights(s); },
  };
  { setWorld('dark'); const c = SH['1a'].at(0.8), n = normalOf(laptop.userData.lid), d = mirrorDir(c.pos, lapAt(330, 1010), n);
    envs.lapDark = bakeEnvironment({ floor: WORLD.dark.envFloor, gain: 0.7, cards: [{ dir: d, w: 16, h: 12, roll: -18, k: 55, soft: 0.3, color: 0xffc890 }] });
    envs.dark = bakeEnvironment({ floor: WORLD.dark.envFloor });
    const c12 = SH['12a'].at(STAR - 0.1); envs.phDark = bakeEnvironment({ floor: WORLD.dark.envFloor, cards: [sweepCard(c12, phone, onPhone, [3.3, 7.2], 3.2, 30)] });
    setWorld('light'); envs.light = bakeEnvironment({ floor: WORLD.light.envFloor });
    const c7 = shot7(T.quer + 0.3, 0); envs.phLight = bakeEnvironment({ floor: WORLD.light.envFloor, cards: [sweepCard(c7, phone, onPhone, [3.3, 7.2], 4, 28, 14, 24)] });
    envs.phGraf = bakeEnvironment({ floor: WORLD.grafite.envFloor, cards: [sweepCard(c7, phone, onPhone, [3.3, 7.2], 3.6, 30)] });
    // a softbox strip that the top of the Enter key mirrors into the lens
    const c8 = SH['8'].at(T.so - 0.2), E = laptop.localToWorld(laptop.userData.enter.userData.home.clone());
    envs.enter = bakeEnvironment({ floor: WORLD.light.envFloor, cards: [{ dir: mirrorDir(c8.pos, E, V(0, 1, 0)), w: 9, h: 26, roll: 20, k: 9, soft: 0.25, color: 0xfff6ec }] }); }

  // ------------------------------------------------------------------------------------------ captions
  // Geist 560 + one accent word in Instrument Serif italic. The accent is colour-coded by who speaks:
  // coral = voz 1 (f1), teal = voz 2 (m5). One baseline (y = 372); the subject stays below it.
  const typeCv = document.createElement('canvas'); typeCv.width = W; typeCv.height = H;
  const c2 = typeCv.getContext('2d'), K = W / 1080;
  const typeTex = new THREE.CanvasTexture(typeCv); typeTex.premultiplyAlpha = true; typeTex.generateMipmaps = false; typeTex.minFilter = typeTex.magFilter = THREE.LinearFilter;
  let capBox = null;
  function drawCaption(t, bare = false) {          // bare: scrim only, for the contrast measurement
    c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, W, H); c2.filter = 'none'; c2.globalAlpha = 1; capBox = null;
    const s = shotAt(t), sh = SH[s.id];
    if (s.id === '12b') return drawEndCard(t);
    const cp = sh.cap?.(t); if (!cp) return;
    const dk = cp.dark ?? WORLD[sh.world].dark, m5 = VO.voiceAt(t + 0.15) === 'm5';
    const ink = dk ? PAPER : INK, acc = cp.accent || (m5 ? (dk ? TEAL_LIT : TEAL_INK) : dk ? CORAL : CORAL_INK), y0 = (cp.y || 372) * K;
    c2.textBaseline = 'alphabetic'; c2.textAlign = 'left';
    if (cp.tag) { c2.font = `500 ${34 * K}px Mono`; c2.letterSpacing = `${0.6 * K}px`; c2.textAlign = 'center'; c2.fillStyle = dk ? '#C4D6D8' : INK; if (!bare) c2.fillText(cp.tag, W / 2, 300 * K); c2.letterSpacing = '0px'; capBox = { x: W / 2 - 250 * K, y: 268 * K, w: 500 * K, h: 44 * K, ink: dk ? '#C4D6D8' : INK, acc: null }; return; }
    if (cp.scrim) { const g = c2.createLinearGradient(0, y0 - 300 * K, 0, y0 + 330 * K), sc = dk ? '4,8,9' : '236,232,225';
      g.addColorStop(0, `rgba(${sc},0)`); g.addColorStop(0.35, `rgba(${sc},${cp.scrim})`); g.addColorStop(0.7, `rgba(${sc},${cp.scrim})`); g.addColorStop(1, `rgba(${sc},0)`);
      c2.fillStyle = g; c2.fillRect(0, Math.max(0, y0 - 300 * K), W, 630 * K); }
    const fontOf = (w, sz) => (w[2] ? `italic 400 ${sz * 1.2}px Serif` : `560 ${sz}px Sans`), track = (w, sz) => `${(w[2] ? -0.012 : -0.034) * sz}px`;
    const measure = (line, sz) => line.reduce((a, w, i) => { c2.font = fontOf(w, sz); c2.letterSpacing = track(w, sz); return a + c2.measureText(w[0]).width + (i ? sz * 0.27 : 0); }, 0);
    let sz = (cp.size || 104) * K; const lim = (cp.maxW || 900) * K, maxW = Math.max(...cp.lines.map((l) => measure(l, sz))); if (maxW > lim) sz *= lim / maxW;
    const bw = Math.min(lim, maxW);
    capBox = { x: W / 2 - bw / 2, y: y0 - sz * 0.8, w: bw, h: sz * (0.95 + 1.12 * (cp.lines.length - 1)), ink, acc };
    if (bare) return;
    cp.lines.forEach((line, li) => {
      let x = W / 2 - measure(line, sz) / 2; const y = y0 + li * sz * 1.12;
      line.forEach((w, i) => {
        c2.font = fontOf(w, sz); c2.letterSpacing = track(w, sz); if (i) x += sz * 0.27;
        const a = easeOut(prog(t, w[1] - 0.07, w[1] + 0.23)), ww = c2.measureText(w[0]).width;
        if (a > 0) { c2.globalAlpha = a; c2.filter = a < 1 ? `blur(${((1 - a) * 12 * K).toFixed(2)}px)` : 'none'; c2.fillStyle = w[2] ? acc : ink; c2.fillText(w[0], x, y + (1 - a) * 14 * K); c2.filter = 'none';
          if (w[3] !== undefined) { const sk = easeOut(prog(t, w[3], w[3] + 0.22)); if (sk > 0) { c2.globalAlpha = 1; c2.fillStyle = dk ? CORAL : CORAL_INK; c2.fillRect(x - 6 * K, y - sz * 0.3, (ww + 4 * K) * sk, 7 * K); } } }
        x += ww;
      });
    });
    // voice chip: which voice is on (the two are colour-coded everywhere)
    if (cp.chip) {
      const [a, b, k] = cp.chip, cy = y0 + (cp.lines.length - 1) * sz * 1.12 + 92 * K; c2.globalAlpha = 1; c2.font = `500 ${32 * K}px Mono`; c2.letterSpacing = '0px';
      const wa = c2.measureText(a).width, wb = c2.measureText(b).width, gap = 74 * K, tw = wa + wb + gap + 76 * K, x0 = W / 2 - tw / 2, pill = (x, w, col, on2) => { c2.globalAlpha = on2 ? 1 : 0.38; c2.fillStyle = col; c2.beginPath(); c2.roundRect(x, cy - 34 * K, w + 38 * K, 50 * K, 25 * K); c2.fill(); c2.fillStyle = '#fff'; c2.textAlign = 'left'; };
      pill(x0, wa, CORAL_INK, k < 0.5); c2.fillText(a, x0 + 19 * K, cy); pill(x0 + wa + 38 * K + gap, wb, TEAL_INK, k >= 0.5); c2.fillText(b, x0 + wa + 57 * K + gap, cy);
      c2.globalAlpha = 1; c2.fillStyle = dk ? PAPER : INK; c2.textAlign = 'center'; c2.fillText('→', x0 + wa + 38 * K + gap / 2, cy);
    }
    c2.filter = 'none'; c2.globalAlpha = 1; c2.letterSpacing = '0px';
  }
  function drawEndCard(t) {
    const t0 = CUT.s12b, cx = W / 2, y0 = 452 * K;
    const g = c2.createLinearGradient(0, 180 * K, 0, 1130 * K); g.addColorStop(0, 'rgba(4,8,9,0)'); g.addColorStop(0.2, 'rgba(4,8,9,0.62)'); g.addColorStop(0.8, 'rgba(4,8,9,0.62)'); g.addColorStop(1, 'rgba(4,8,9,0)');
    c2.fillStyle = g; c2.fillRect(0, 180 * K, W, 950 * K);
    const put = (txt, font, color, x, y, at, track = 0) => { const a = easeOut(prog(t, at, at + 0.3)); if (a <= 0) return; c2.font = font; c2.letterSpacing = `${track}px`; c2.textAlign = 'center'; c2.globalAlpha = a; c2.filter = a < 1 ? `blur(${((1 - a) * 12 * K).toFixed(2)}px)` : 'none'; c2.fillStyle = color; c2.fillText(txt, x, y + (1 - a) * 14 * K); c2.filter = 'none'; c2.globalAlpha = 1; };
    c2.textBaseline = 'alphabetic';
    put('open source · grátis', `500 ${34 * K}px Mono`, '#C4D6D8', cx, y0 - 150 * K, t0 + 0.25, 0.6 * K);
    put('Fábrica de', `560 ${122 * K}px Sans`, PAPER, cx, y0, t0 + 0.05, -4.2 * K);
    put('Criativos', `italic 400 ${160 * K}px Serif`, CORAL, cx - 4 * K, y0 + 140 * K, t0 + 0.16, -2.4 * K);
    const b = easeOut(prog(t, t0 + 0.4, t0 + 0.7));
    if (b > 0) {
      // the button breathes on two beats after the voice ends
      const pulse = 1 + 0.04 * (Math.exp(-Math.max(0, t - T.fim - 0.45) * 9) * (t >= T.fim + 0.45 ? 1 : 0) + Math.exp(-Math.max(0, t - T.fim - 1.1) * 9) * (t >= T.fim + 1.1 ? 1 : 0));
      c2.save(); c2.translate(cx, y0 + 284 * K); c2.scale(pulse, pulse); c2.translate(-cx, -(y0 + 284 * K));
      c2.globalAlpha = b; c2.font = `600 ${44 * K}px Sans`; c2.letterSpacing = `${-0.6 * K}px`; c2.textAlign = 'left';
      const lab = 'Procure no GitHub', tw = c2.measureText(lab).width, bw = tw + 190 * K, bh = 116 * K, bx = cx - bw / 2, by = y0 + 226 * K + (1 - b) * 14 * K;
      c2.fillStyle = CORAL; c2.beginPath(); c2.roundRect(bx, by, bw, bh, bh / 2); c2.fill();
      c2.fillStyle = '#1A0B07'; c2.fillText(lab, bx + 64 * K, by + bh / 2 + 15.5 * K);
      c2.strokeStyle = '#1A0B07'; c2.lineWidth = 4.2 * K; c2.lineCap = 'round'; c2.lineJoin = 'round';
      const ax = bx + bw - 74 * K, ay = by + bh / 2; c2.beginPath(); c2.moveTo(ax - 18 * K, ay); c2.lineTo(ax + 15 * K, ay); c2.moveTo(ax + 3 * K, ay - 12 * K); c2.lineTo(ax + 15 * K, ay); c2.lineTo(ax + 3 * K, ay + 12 * K); c2.stroke();
      c2.restore(); c2.globalAlpha = 1;
    }
    put('github.com/FilipeMolinariMoura/', `500 ${40 * K}px Mono`, '#C4D6D8', cx, y0 + 436 * K, t0 + 0.6, -0.4 * K);
    put('fabrica-de-criativos', `600 ${54 * K}px Mono`, PAPER, cx, y0 + 504 * K, t0 + 0.66, -0.8 * K);
    c2.letterSpacing = '0px';
  }

  // ------------------------------------------------------------------------------------------ sound
  // Every visual event, in seconds, with its sound (vendor sfx.mjs palette). Nothing loud sits on a word:
  // hits go on the audible onset or in the gap; sounds under speech stay small.
  const HS = [
    [0.07, 'clipe arrastado', 'whoosh', { len: 0.3, gain: 0.3 }], [0.42, 'clipe encaixa', 'click', { gain: 0.4 }], [T.editado + 0.14, 'risco em editado', 'tick', { gain: 0.5 }],
    [T.prog - 0.22, 'virada: câmera gira para o código', 'whoosh', { len: 0.44, from: 300, to: 2600, gain: 0.8 }],
    [T.prog, 'programado: vira código', 'thud+sub', { gain: 0.5, len: 0.12 }], [T.prog + 0.28, 'cursor', 'type', { len: 0.4, n: 4, gain: 0.35 }],
    [CUT.s2, 'corte: tampa', 'click', { gain: 0.2 }], [T.abriu + 0.1, 'tampa desce', 'whoosh', { len: T.editor - T.abriu - 0.1, from: 1800, to: 300, gain: 0.9 }], [T.editor, 'tampa fecha', 'thud', { gain: 0.5 }], [T.editor + 0.19, 'tampa quica', 'thud', { gain: 0.2 }],
    [CUT.s3, 'corte: trilhos', 'click', { gain: 0.2 }], [T.arrastou + 0.3, 'clipes saem (esq -> dir)', 'whoosh', { len: 0.62, from: 500, to: 2400, gain: 0.5 }], [CUT.s4 - 0.1, 'bloco na lente', 'whoosh', { len: 0.34, from: 500, to: 3000, gain: 0.5 }],
    [CUT.s4, 'corte: mundo claro', 'pop', { pitch: 'A4', gain: 0.4 }], [T.voce + 0.1, 'digita o roteiro', 'type', { len: T.roteiro + 0.5 - T.voce, n: 16, gain: 0.4 }],
    [CUT.s5, 'régua de pinos', 'tok', { pitch: 'D5', gain: 0.4 }], [T.narra, 'narra', 'tok', { pitch: 'A5', gain: 0.4 }],
    ...T.tiles.map((w, i) => [w, `ficha: ${TW[i]}`, 'click+blip', { pitch: ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6'][i], gain: 0.5 }]),
    [CUT.s7a, 'outra cor', 'click+pop', { pitch: 'D5', gain: 0.45 }], [CUT.s7b, 'outro estilo', 'click+pop', { pitch: 'F#5', gain: 0.45 }], [CUT.s7c, 'outra voz', 'click+pop', { pitch: 'A5', gain: 0.45 }], [T.vozW, 'pinos trocam de cor', 'blip', { pitch: 'E6', gain: 0.4 }],
    [CUT.s8, 'macro enter', 'tick', { gain: 0.4 }], [T.so, 'enter', 'thud+click', { gain: 0.5 }], [T.so + 0.3, 'saída do comando', 'blip', { pitch: 'E6', gain: 0.45 }],
    [T.segundo - 0.36, 'giro', 'whoosh', { len: 0.65, from: 400, to: 2800, gain: 0.5 }], [T.segundo, 'trava', 'click+thud', { gain: 0.45 }], [T.pronto, 'medidor', 'blip', { pitch: 'A5', gain: 0.45 }],
    [CUT.s10, 'corte: chave', 'click', { gain: 0.2 }], [T.zero + 0.06, 'chave estala', 'thud+click', { gain: 0.55 }], [T.zero + 0.15, 'led grátis', 'bell', { pitch: 'D6', gain: 0.35 }], [T.os, 'foco nos modelos', 'tick', { gain: 0.4 }],
    [CUT.s11, 'guia: segunda voz', 'pop', { pitch: 'D4', gain: 0.4 }], [T.codigo, 'foco no código', 'tick', { gain: 0.4 }],
    [CUT.s12a, 'subida para o CTA', 'riser', { len: 1.2, gain: 0.85 }], [T.procure + 0.15, 'busca', 'type', { len: T.criativosEnd - T.procure - 0.4, n: 20, gain: 0.35 }], [STAR, 'estrela', 'bell', { pitch: 'E6', gain: 0.45 }],
    [CUT.s12b, 'corte: cartão final', 'whoosh', { len: 0.3, gain: 0.3 }], [T.fim + 0.14, 'acorde final', 'impact', { gain: 0.6 }], [T.fim + 0.45, 'botão pulsa', 'pop', { pitch: 'D5', gain: 0.35 }], [T.fim + 1.1, 'botão pulsa', 'pop', { pitch: 'A4', gain: 0.3 }],
  ].sort((a, b) => a[0] - b[0]);
  window.HITS_S = HS; window.SHOTS = SHOTS; window.CUTS = CUT; window.TIMES = T;
  window.TRILHA = { dur: +DUR.toFixed(3), reveal: +T.ele.toFixed(3), cta: +T.procure.toFixed(3), hits: [+T.prog.toFixed(3), +T.so.toFixed(3), +(T.zero + 0.06).toFixed(3), +(T.fim + 0.14).toFixed(3)], mood: 'energetico' };
  window.HITS = beats ? HS.map(([t, l, s, o]) => [(t - beats.offset) / beats.period, l, s, o || {}]) : [];

  // ------------------------------------------------------------------------------------------ harness
  const render = (t, spp, type) => pipe.render(stage, t, { spp, fps: FPS, shutter: 0.5, typeTex: type ? typeTex : null, frame: Math.round(t * 30) + 1 });
  window.seek = (t, spp = SPP) => {
    const t0 = performance.now();
    t = Math.min(t, DUR - 1e-3);
    drawCaption(t); typeTex.needsUpdate = true;
    render(t, spp, true);
    const gl = pipe.R.getContext(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    return (window.lastMs = performance.now() - t0);
  };
  // WCAG contrast of the caption inks against what is really behind them (worst 5 % of the box)
  window.capContrast = (t) => {
    drawCaption(t, true); if (!capBox) return null; typeTex.needsUpdate = true;
    const prev = pipe.acabamento; pipe.acabamento = 'limpo'; render(t, 16, true); pipe.acabamento = prev;
    const b = capBox, x = Math.max(0, Math.floor(b.x)), y = Math.max(0, Math.floor(H - b.y - b.h)), w = Math.min(W - x, Math.ceil(b.w)), h = Math.ceil(b.h), px = new Uint8Array(w * h * 4), gl = pipe.R.getContext();
    gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }, lum = (r, g, bl) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl);
    const hex = (s) => lum(parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)), L = [];
    for (let i = 0; i < px.length; i += 16) L.push(lum(px[i], px[i + 1], px[i + 2]));
    const worst = (ink) => { const li = hex(ink), r = L.map((l) => (Math.max(l, li) + 0.05) / (Math.min(l, li) + 0.05)).sort((p, q) => p - q); return +r[Math.floor(r.length * 0.05)].toFixed(2); };
    return { shot: shotAt(t).id, ink: worst(b.ink), accent: b.acc ? worst(b.acc) : null };
  };
  window.refinish = (mode) => { pipe.refinish(mode); const gl = pipe.R.getContext(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); };
  window.DURATION = DUR; window.STAGE = stage; window.PIPE = pipe;
  window.seek(Number(params.get('t') || 0), RENDER ? 2 : SPP);
  window.filmReady = true;
  if (!RENDER) {
    const hud = document.getElementById('hud'); let t = Number(params.get('t') || 0);
    const show = () => { const ms = window.seek(t); hud.textContent = `t=${t.toFixed(2)} s · plano ${stage.shot} · ${SPP} spp · ${ms.toFixed(0)} ms · ←/→ 0,1 s · ↑/↓ plano`; };
    addEventListener('keydown', (e) => {
      const i = SHOTS.indexOf(shotAt(t));
      if (e.code === 'ArrowRight') t = Math.min(DUR - 0.01, t + 0.1); else if (e.code === 'ArrowLeft') t = Math.max(0, t - 0.1);
      else if (e.code === 'ArrowDown') t = SHOTS[Math.min(SHOTS.length - 1, i + 1)].t0 + 0.3; else if (e.code === 'ArrowUp') t = SHOTS[Math.max(0, i - 1)].t0 + 0.3; else return;
      show();
    });
    show();
  }
}
main().catch((e) => { console.error(e); window.filmError = String((e && e.stack) || e); });
