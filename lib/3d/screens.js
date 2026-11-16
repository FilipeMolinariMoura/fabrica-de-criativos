// screens.js: what the devices show. Real content only: the phone shows the real GitHub page
// (exemplos/divulgacao/assets/github-topo.png); the laptop shows the repository's real roteiro.json
// in a code editor drawn to a canvas, with the real render command and log format in the terminal.
import * as THREE from 'three';
import { PHONE, LAPTOP } from './models.js';

function tex(cv) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  return t;
}
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return c; };
const MONO = 'Mono, Menlo, monospace', SANS = 'Sans';

// ------------------------------------------------------------------ phone: the real GitHub page
export function phoneScreen(shot) {
  const P = PHONE, pw = P.w - 2 * P.glassInset - 0.02, ph = P.h - 2 * P.glassInset - 0.02;
  const aw = pw - 2 * P.bezel, ah = ph - 2 * P.bezel, k = shot.width / aw;       // px per cm
  const cv = canvas(pw * k, ph * k), c = cv.getContext('2d');
  const bx = P.bezel * k, by = P.bezel * k, W = aw * k, H = ah * k;
  c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
  c.save();
  c.beginPath(); c.roundRect(bx, by, W, H, (P.r - P.glassInset - 0.01 - P.bezel) * k); c.clip();
  const SB = 150;                                   // status bar, in the page's own header colour
  c.fillStyle = '#010409'; c.fillRect(bx, by, W, H);
  c.drawImage(shot, 0, 0, shot.width, H - SB, bx, by + SB, W, H - SB);
  // status bar: clock, signal, battery (system chrome, not product UI)
  c.fillStyle = '#fff'; c.font = `600 50px Chrome`; c.textBaseline = 'middle';
  c.fillText('9:41', bx + 96, by + 84);
  const rx = bx + W - 96;
  c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 3.5;
  c.beginPath(); c.roundRect(rx - 78, by + 66, 72, 36, 11); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.roundRect(rx - 3, by + 77, 6, 14, 3); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.roundRect(rx - 73, by + 71, 50, 26, 7); c.fill();
  for (let i = 0; i < 4; i++) { const h = 14 + i * 8; c.beginPath(); c.roundRect(rx - 190 + i * 15, by + 102 - h, 10, h, 3); c.fill(); }
  // front camera: a punch hole with a faint lens ring
  const cx = bx + W / 2, cy = by + 80;
  c.fillStyle = '#000'; c.beginPath(); c.arc(cx, cy, 36, 0, 7); c.fill();
  const g = c.createRadialGradient(cx - 6, cy - 8, 2, cx, cy, 22);
  g.addColorStop(0, 'rgba(70,84,120,0.55)'); g.addColorStop(0.5, 'rgba(18,22,34,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 22, 0, 7); c.fill();
  // home indicator
  c.fillStyle = 'rgba(255,255,255,0.82)'; c.beginPath(); c.roundRect(cx - 215, by + H - 36, 430, 15, 8); c.fill();
  c.restore();
  return tex(cv);
}

// ------------------------------------------------------------------ laptop: code editor
const C = { bg: '#0A1316', side: '#081013', bar: '#060D0F', line: '#14252A', text: '#C9D6D8', mute: '#5E777C', dim: '#3A5257',
  key: '#7FD4C6', str: '#F1C9A2', punct: '#8FA6AA', num: '#E7A56B', coral: '#FF6B4A', sel: 'rgba(42,157,143,0.20)', term: '#070E10' };

// one JSON line -> coloured runs
function jsonRuns(line) {
  const runs = []; const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?)|(true|false|null)|([{}\[\],:])|(\s+)|([^\s"{}\[\],:]+)/g;
  let m;
  while ((m = re.exec(line))) {
    if (m[1]) { runs.push([m[1], m[2] ? C.key : C.str]); if (m[2]) runs.push([m[2], C.punct]); }
    else if (m[3]) runs.push([m[3], C.num]);
    else if (m[4]) runs.push([m[4], C.coral]);
    else if (m[5]) runs.push([m[5], C.punct]);
    else runs.push([m[0], C.text]);
  }
  return runs;
}

export function laptopScreen(src, { firstLine = 4, cursorLine = 41 } = {}) {
  const L = LAPTOP, K = 168, pw = L.w - 0.36, ph = L.d - 0.36;
  const cv = canvas(pw * K, ph * K), c = cv.getContext('2d');
  c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
  const bx = L.bezel * K, by = L.bezel * K, W = Math.round(pw * K - 2 * bx), H = Math.round(ph * K - 2 * by - L.chin * K);
  // camera dot in the top bezel
  c.fillStyle = '#0b0d10'; c.beginPath(); c.arc(cv.width / 2, by / 2, K * 0.075, 0, 7); c.fill();
  c.fillStyle = '#1a2233'; c.beginPath(); c.arc(cv.width / 2 - K * 0.016, by / 2 - K * 0.016, K * 0.03, 0, 7); c.fill();
  c.save(); c.translate(bx, by); c.beginPath(); c.roundRect(0, 0, W, H, K * 0.22); c.clip();
  const s = K / 60; c.scale(s, s); const w = W / s, h = H / s;                 // logical px
  c.fillStyle = C.bg; c.fillRect(0, 0, w, h);
  c.textBaseline = 'middle';
  // title bar
  c.fillStyle = C.bar; c.fillRect(0, 0, w, 40);
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(22 + i * 21, 20, 6.2, 0, 7); c.fill(); });
  c.fillStyle = C.mute; c.font = '500 13px Sans'; c.textAlign = 'center';
  c.fillText('roteiro.json — fabrica-de-criativos', w / 2, 20.5); c.textAlign = 'left';
  // sidebar: the repository's real tree
  const SW = 248; c.fillStyle = C.side; c.fillRect(0, 40, SW, h - 40);
  c.fillStyle = C.line; c.fillRect(SW, 40, 1, h - 40);
  c.fillStyle = C.dim; c.font = '600 11px Sans'; c.letterSpacing = '0.8px'; c.fillText('FABRICA-DE-CRIATIVOS', 20, 64); c.letterSpacing = '0px';
  const tree = [['.github', 0, 'd'], ['ae', 0, 'd'], ['docs', 0, 'd'], ['ebook', 0, 'd'], ['exemplos', 0, 'o'], ['demo', 1, 'd'], ['divulgacao', 1, 'o'], ['assets', 2, 'd'], ['audio', 2, 'd'],
    ['beats.json', 2, 'f'], ['film.js', 2, 'f'], ['film.json', 2, 'f'], ['index.html', 2, 'f'], ['narracao.json', 2, 'f'], ['roteiro.json', 2, 'a'], ['trilha.json', 2, 'f'], ['vo.json', 2, 'f'],
    ['lib', 0, 'd'], ['scripts', 0, 'd'], ['templates', 0, 'd'], ['vendor', 0, 'd'], ['CHANGELOG.md', 0, 'f'], ['CITATION.cff', 0, 'f'], ['CONTRIBUTING.md', 0, 'f'], ['LICENSE', 0, 'f'], ['Makefile', 0, 'f'], ['README.md', 0, 'f'], ['package.json', 0, 'f']];
  tree.forEach(([name, depth, kind], i) => {
    const y = 92 + i * 25, x = 20 + depth * 16;
    if (kind === 'a') { c.fillStyle = 'rgba(127,212,198,0.09)'; c.fillRect(0, y - 12.5, SW, 25); c.fillStyle = C.coral; c.fillRect(0, y - 12.5, 2, 25); }
    c.font = '400 13.5px Sans';
    if (kind === 'd' || kind === 'o') {
      c.strokeStyle = C.mute; c.lineWidth = 1.3; c.beginPath();
      if (kind === 'o') { c.moveTo(x, y - 2); c.lineTo(x + 4, y + 2); c.lineTo(x + 8, y - 2); } else { c.moveTo(x + 2, y - 4); c.lineTo(x + 6, y); c.lineTo(x + 2, y + 4); }
      c.stroke();
    }
    c.fillStyle = kind === 'a' ? '#EEF4F4' : kind === 'f' ? '#9DB2B6' : C.text;
    c.fillText(name, x + 16, y + 0.5);
  });
  // tabs
  const EX = SW + 1, TH = 38;
  c.fillStyle = C.bar; c.fillRect(EX, 40, w - EX, TH);
  let tx = EX;
  [['roteiro.json', true], ['film.js', false], ['Makefile', false]].forEach(([name, on]) => {
    c.font = '400 13.5px Sans'; const tw = c.measureText(name).width + 54;
    if (on) { c.fillStyle = C.bg; c.fillRect(tx, 40, tw, TH); c.fillStyle = C.coral; c.fillRect(tx, 40, tw, 2); }
    c.fillStyle = on ? '#EEF4F4' : C.mute; c.fillText(name, tx + 18, 40 + TH / 2 + 1);
    c.fillStyle = C.dim; c.fillText('×', tx + tw - 24, 40 + TH / 2);
    c.fillStyle = C.line; c.fillRect(tx + tw, 40, 1, TH);
    tx += tw + 1;
  });
  // terminal panel
  const PH = 156, SBH = 26, py = h - SBH - PH;
  // editor
  const lines = src.split('\n'), LH = 24, top = 40 + TH + 12, GUT = 66;
  c.font = `400 15px ${MONO}`;
  const CHW = c.measureText('0').width, pos = {};
  const rows = Math.floor((py - top) / LH);
  for (let i = 0; i < rows; i++) {
    const n = firstLine + i, y = top + i * LH + LH / 2;
    if (n > lines.length) break;
    if (n === cursorLine) { c.fillStyle = 'rgba(255,255,255,0.035)'; c.fillRect(EX, y - LH / 2, w - EX, LH); }
    c.fillStyle = n === cursorLine ? C.text : C.dim; c.textAlign = 'right'; c.fillText(String(n), EX + GUT - 18, y + 0.5); c.textAlign = 'left';
    let x = EX + GUT;
    for (const [str, col] of jsonRuns(lines[n - 1])) { c.fillStyle = col; c.fillText(str, x, y + 0.5); x += c.measureText(str).width; }
    if (n === cursorLine) { c.fillStyle = C.coral; c.fillRect(x + 1, y - 10, 2.2, 20); }
    pos[n] = { x0: EX + GUT, x1: x, y };
    // indent guides
    const ind = lines[n - 1].match(/^ */)[0].length;
    c.fillStyle = 'rgba(255,255,255,0.045)';
    for (let k = 2; k < ind; k += 2) c.fillRect(EX + GUT + k * CHW, y - LH / 2, 1, LH);
  }
  c.fillStyle = C.term; c.fillRect(EX, py, w - EX, PH);
  c.fillStyle = C.line; c.fillRect(EX, py, w - EX, 1);
  c.font = '600 11px Sans'; c.letterSpacing = '0.8px';
  c.fillStyle = '#EEF4F4'; c.fillText('TERMINAL', EX + 22, py + 22); c.fillStyle = C.coral; c.fillRect(EX + 22, py + 34, 58, 1.5);
  c.fillStyle = C.dim; c.fillText('PROBLEMS', EX + 112, py + 22); c.fillText('OUTPUT', EX + 206, py + 22); c.letterSpacing = '0px';
  c.font = `400 14.5px ${MONO}`;
  const term = [
    [['$ ', C.coral], ['make final FILME=exemplos/divulgacao', '#EEF4F4']],
    [['rendering 1943 frames (0-32.38s) 1080x1920 @ 60fps, 6 workers, motion blur on', C.text]],
    [['  1320/1943 frames  3.4 fps  eta 3.1 min', C.str]],
  ];
  term.forEach((runs, i) => { let x = EX + 22; const y = py + 64 + i * 26; if (i === 0) pos.term = { x0: EX + 22, y }; for (const [str, col] of runs) { c.fillStyle = col; c.fillText(str, x, y); x += c.measureText(str).width; } });
  c.fillStyle = '#EEF4F4'; c.fillRect(EX + 22 + c.measureText('  1320/1943 frames  3.4 fps  eta 3.1 min ').width, py + 64 + 2 * 26 - 9, 8.5, 18);
  // status bar
  c.fillStyle = C.bar; c.fillRect(0, h - SBH, w, SBH); c.fillStyle = C.line; c.fillRect(0, h - SBH, w, 1);
  c.font = '400 12px Sans'; c.fillStyle = C.mute;
  c.fillText('main', 20, h - SBH / 2 + 1); c.textAlign = 'right';
  c.fillText(`Ln ${cursorLine}, Col 30     Spaces: 2     UTF-8     JSON`, w - 20, h - SBH / 2 + 1); c.textAlign = 'left';
  c.restore();
  const t = tex(cv);
  // where things are on the lid, in centimetres (x across from the centre, v up from the hinge line)
  const toLid = (lx, ly) => ({ x: (bx + lx * s) / K - pw / 2, v: (L.d / 2 - 0.1) - ph / 2 + (cv.height - (by + ly * s)) / K });
  t.userData.at = (n, k = 0) => { const q = pos[n]; return toLid(q.x0 + ((q.x1 ?? q.x0) - q.x0) * k, q.y); };
  return t;
}


// ------------------------------------------------------------------ laptop: back-lit key legends
export function legendTexture() {
  const K = 110; let cv = canvas(8, 8);
  const t = tex(cv);
  t.drawLegends = (legends, wellW, wellD, wellZ) => {
    cv.width = Math.round(wellW * K); cv.height = Math.round(wellD * K);
    const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height);
    c.fillStyle = 'rgba(232,240,244,0.92)'; c.textBaseline = 'middle';
    c.shadowColor = 'rgba(200,225,255,0.55)'; c.shadowBlur = 5;
    for (const { label, x, z, w, d } of legends) {
      if (!label) continue;
      const px = (x + wellW / 2) * K, py = (z - wellZ + wellD / 2) * K;
      if (label.length === 1 && !'<>^v'.includes(label)) { c.textAlign = 'center'; c.font = `500 ${0.52 * K}px Sans`; c.fillText(label, px, py + 2); }
      else if (label.length <= 3 && /^F\d|^[<>^v]$/.test(label)) {
        c.textAlign = 'center'; c.font = `500 ${0.25 * K}px Sans`;
        c.fillText({ '<': '◀', '>': '▶', '^': '▲', v: '▼' }[label] || label, px, py + 1);
      } else { c.textAlign = x < 0 ? 'left' : 'right'; c.font = `500 ${0.26 * K}px Sans`; c.fillText(label, px + (x < 0 ? -1 : 1) * (w / 2 - 0.22) * K, py + (d / 2 - 0.3) * K); }
    }
    t.image = cv; t.needsUpdate = true;
  };
  return t;
}

// "printed on glass" labels for the glass cards (sentence case, the film's two families)
export function labelTexture(num, title, sub, w = 8.2, h = 14.6) {
  const K = 150, cv = canvas(w * K, h * K), c = cv.getContext('2d');
  c.textBaseline = 'alphabetic';
  c.fillStyle = 'rgba(255,255,255,0.92)'; c.font = `500 ${0.36 * K}px ${MONO}`; c.fillText(num, 0.85 * K, 1.25 * K);
  c.font = `500 ${1.28 * K}px ${SANS}`; c.letterSpacing = `${-0.035 * K}px`; c.fillText(title, 0.8 * K, h * K - 1.9 * K);
  c.letterSpacing = '0px'; c.fillStyle = 'rgba(255,255,255,0.66)'; c.font = `400 ${0.37 * K}px ${MONO}`; c.fillText(sub, 0.85 * K, h * K - 1.15 * K);
  const t = tex(cv); t.premultiplyAlpha = false;
  return t;
}

// ------------------------------------------------------------------ imperfection maps (roughness, green channel)
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function dataTex(cv) {
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}
// Finger grease on glass. The material's roughness is the smudged value; the map scales it down to
// clean glass everywhere else. Source: a real fingerprint scan (ambientCG Fingerprints004, CC0) plus
// a few wipe streaks.
export function smudgeTexture(img, { clean = 0.11, k = 0.42, seed = 7 } = {}) {
  const N = 1024, cv = canvas(N, N), c = cv.getContext('2d'), rnd = mulberry32(seed);
  c.fillStyle = '#000'; c.fillRect(0, 0, N, N);
  c.globalAlpha = 0.85; c.drawImage(img, 0, 0, N, N); c.globalAlpha = 1;
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  for (let i = 0; i < 9; i++) {                       // wipe streaks: long, faint, slightly curved
    const x = rnd() * N, y = rnd() * N, a = rnd() * Math.PI, len = 200 + rnd() * 500, wd = 30 + rnd() * 90;
    c.strokeStyle = `rgba(255,255,255,${0.05 + rnd() * 0.08})`; c.lineWidth = wd; c.filter = `blur(${10 + rnd() * 14}px)`;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a + 0.4) * len / 2, y + Math.sin(a + 0.4) * len / 2, x + Math.cos(a) * len, y + Math.sin(a) * len); c.stroke();
  }
  c.filter = 'none'; c.globalCompositeOperation = 'source-over';
  const d = c.getImageData(0, 0, N, N), p = d.data;
  for (let i = 0; i < p.length; i += 4) { const v = Math.min(1, p[i + 1] / 255); const g = Math.round(255 * Math.min(1, clean + k * v)); p[i] = p[i + 1] = p[i + 2] = g; p[i + 3] = 255; }
  c.putImageData(d, 0, 0);
  return dataTex(cv);
}
// Bead-blasted anodised aluminium: fine grain + slow clouds, roughness x [0.86, 1.0]
export function grainTexture(seed = 3) {
  const N = 512, cv = canvas(N, N), c = cv.getContext('2d'), rnd = mulberry32(seed);
  const d = c.createImageData(N, N), p = d.data;
  for (let i = 0; i < p.length; i += 4) { const g = 205 + Math.round(rnd() * 50); p[i] = p[i + 1] = p[i + 2] = g; p[i + 3] = 255; }
  c.putImageData(d, 0, 0);
  c.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 40; i++) {
    const x = rnd() * N, y = rnd() * N, r = 40 + rnd() * 110, g = c.createRadialGradient(x, y, 0, x, y, r), v = 215 + Math.round(rnd() * 40);
    g.addColorStop(0, `rgb(${v},${v},${v})`); g.addColorStop(1, 'rgb(255,255,255)');
    for (const [ox, oy] of [[0, 0], [N, 0], [-N, 0], [0, N], [0, -N]]) { c.save(); c.translate(ox, oy); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore(); }
  }
  c.globalCompositeOperation = 'source-over';
  return dataTex(cv);
}
