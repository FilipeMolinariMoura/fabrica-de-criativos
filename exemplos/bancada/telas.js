// telas.js: o que as telas mostram, quadro a quadro. Dois canvases dinâmicos (notebook e celular),
// redesenhados UMA vez por quadro em stage.prepare(t). Só conteúdo real do projeto: quadros da demo,
// variantes, roteiro.json, comandos do kit, a página do GitHub (retocada: sem contadores zerados).
import * as THREE from 'three';
import { PHONE, LAPTOP } from '../../lib/3d/models.js';

const MONO = 'Mono, Menlo, monospace', SANS = 'Sans';
const C = { bg: '#0A1316', side: '#081013', bar: '#060D0F', line: '#14252A', text: '#C9D6D8', mute: '#5E777C', dim: '#3A5257',
  key: '#7FD4C6', str: '#F1C9A2', punct: '#8FA6AA', coral: '#FF6B4A', teal: '#2A9D8F', amber: '#F4A259', term: '#070E10' };
const lerp = (a, b, k) => a + (b - a) * k, clamp = (x) => Math.min(1, Math.max(0, x));
const ease = (k) => k * k * (3 - 2 * k);

function dynTex(cv) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  return t;
}
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return c; };
export function textTexture(w, h, draw) {
  const cv = canvas(w, h), c = cv.getContext('2d'); draw(c, w, h);
  const t = dynTex(cv); t.premultiplyAlpha = false; return t;
}

// one JSON line -> coloured runs
function jsonRuns(line) {
  const runs = []; const re = /("(?:[^"\\]|\\.)*"?)(\s*:)?|([{}\[\],:])|(\s+)|([^\s"{}\[\],:]+)/g; let m;
  while ((m = re.exec(line))) {
    if (m[1]) { runs.push([m[1], m[2] ? C.key : C.str]); if (m[2]) runs.push([m[2], C.punct]); }
    else if (m[3]) runs.push([m[3], C.punct]); else runs.push([m[0], C.text]);
  }
  return runs;
}

// ------------------------------------------------------------------ notebook
export function makeLaptopScreen(IMG, roteiro) {
  const L = LAPTOP, K = 160, pw = L.w - 0.36, ph = L.d - 0.36;
  const cv = canvas(pw * K, ph * K), c = cv.getContext('2d');
  const bx = L.bezel * K, by = L.bezel * K, W = Math.round(pw * K - 2 * bx), H = Math.round(ph * K - 2 * by - L.chin * K);
  const s = K / 60, w = W / s, h = H / s;                                   // logical px (1784 x 1217)
  const tex = dynTex(cv);
  const toLid = (lx, ly) => ({ x: (bx + lx * s) / K - pw / 2, v: (L.d / 2 - 0.1) - ph / 2 + (cv.height - (by + ly * s)) / K });
  const falas = roteiro.criativos[0].falas;
  // the code the timeline collapses into, and that the laptop later types: the real roteiro
  const CODE = ['{', '  "titulo": "Esse vídeo não foi editado",', '  "falas": [', ...falas.map((f, i) => `    "${f}"${i < falas.length - 1 ? ',' : ''}`), '  ]', '}'];
  const CX = 150, CY = 196, LH = 46, FS = 28;                                // code zone (where the timeline is)
  const chrome = (title) => {
    c.fillStyle = C.bar; c.fillRect(0, 0, w, 40);
    ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(22 + i * 21, 20, 6.2, 0, 7); c.fill(); });
    c.fillStyle = C.mute; c.font = `500 13px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(title, w / 2, 20.5); c.textAlign = 'left';
  };
  const codeLine = (i, y, x0, fs, upto = 1e9, cursor = false, alpha = 1) => {
    c.font = `400 ${fs}px ${MONO}`; c.textBaseline = 'middle'; c.globalAlpha = alpha;
    c.fillStyle = C.dim; c.textAlign = 'right'; c.fillText(String(i + 1), x0 - 28, y); c.textAlign = 'left';
    let x = x0, n = 0;
    for (const [str, col] of jsonRuns(CODE[i])) {
      const part = str.slice(0, Math.max(0, upto - n)); n += str.length;
      c.fillStyle = col; c.fillText(part, x, y); x += c.measureText(part).width;
      if (n >= upto) break;
    }
    if (cursor) { c.fillStyle = C.coral; c.fillRect(x + 2, y - fs * 0.62, 3, fs * 1.24); }
    c.globalAlpha = 1;
    return x;
  };
  const begin = () => {
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#0b0d10'; c.beginPath(); c.arc(cv.width / 2, by / 2, K * 0.075, 0, 7); c.fill();
    c.save(); c.translate(bx, by); c.beginPath(); c.roundRect(0, 0, W, H, K * 0.22); c.clip(); c.scale(s, s);
    c.fillStyle = C.bg; c.fillRect(0, 0, w, h);
  };
  const end = () => { c.restore(); tex.needsUpdate = true; };
  // the clips of the video editor: [track y, height, x, width, colour, thumbnail index or -1]
  const CLIPS = [];
  { const tr = [[658, 62], [734, 128], [876, 92], [982, 92]]; let seed = 5;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    [[C.coral, 4, 0], [C.teal, 6, 1], [C.amber, 3, 2], ['#6C7FD8', 2, 3]].forEach(([col, n, ti]) => {
      let x = 150 + rnd() * 60;
      for (let i = 0; i < n; i++) { const cw = (w - 260) / n * (0.62 + rnd() * 0.3); CLIPS.push([tr[ti][0], tr[ti][1], x, cw, col, ti === 1 ? i : -1]); x += cw + 10 + rnd() * 40; }
    });
    CLIPS.sort((a, b) => a[2] - b[2]); }
  const screen = {
    tex, at: toLid, w, h, codeAt: (i, k = 0) => toLid(CX + k * 420, CY + i * LH),
    // video editor whose timeline collapses into code. play: playhead 0..1, k: collapse 0..1
    editor({ play = 0.3, k = 0, blink = true, drag = 0 }) {
      begin();
      const ui = clamp(1 - k * 1.7), cd = clamp((k - 0.72) / 0.28);
      chrome(k < 0.5 ? 'promo.mp4 — Sequência 01' : 'roteiro.json — fabrica-de-criativos');
      if (ui > 0) {
        c.globalAlpha = ui;
        // bin, monitor, inspector
        c.fillStyle = C.side; c.fillRect(0, 40, 300, 560); c.fillRect(w - 330, 40, 330, 560);
        c.font = `500 13px ${SANS}`; c.textBaseline = 'middle';
        ['f_030.jpg', 'f_090.jpg', 'f_150.jpg', 'f_210.jpg', 'vo.wav', 'music.wav'].forEach((n, i) => {
          const y = 84 + i * 76; c.fillStyle = '#0f1c20'; c.fillRect(18, y - 26, 84, 56);
          if (i < 4) c.drawImage(IMG.demo[i], 0, 300, 540, 360, 18, y - 26, 84, 56); else { c.fillStyle = i === 4 ? C.amber : '#6C7FD8'; for (let q = 0; q < 20; q++) c.fillRect(22 + q * 4, y - Math.abs(Math.sin(q * 1.7 + i)) * 18, 2, Math.abs(Math.sin(q * 1.7 + i)) * 36 + 2); }
          c.fillStyle = C.text; c.fillText(n, 116, y - 6); c.fillStyle = C.mute; c.fillText(i < 4 ? '540 × 960' : '48 kHz', 116, y + 14);
        });
        c.fillStyle = '#000'; c.fillRect(310, 50, w - 650, 540);
        const mh = 520, mw = mh * 9 / 16; c.globalAlpha = ui * 0.3; c.drawImage(IMG.demo[Math.min(6, Math.floor(play * 9) % 7)], (310 + (w - 650) / 2) - mw / 2, 60, mw, mh); c.globalAlpha = ui;
        ['Posição', 'Escala', 'Rotação', 'Opacidade', 'Volume'].forEach((n, i) => {
          const y = 90 + i * 70; c.fillStyle = C.mute; c.fillText(n, w - 306, y); c.fillStyle = C.line; c.fillRect(w - 306, y + 20, 270, 4);
          c.fillStyle = C.text; c.beginPath(); c.arc(w - 306 + 270 * (0.25 + 0.13 * i), y + 22, 7, 0, 7); c.fill();
        });
        // timeline chrome
        c.fillStyle = C.bar; c.fillRect(0, 606, w, h - 606); c.fillStyle = C.line; c.fillRect(0, 606, w, 1.5);
        c.fillStyle = C.mute; c.font = `400 12px ${MONO}`;
        for (let i = 0; i < 12; i++) { const x = 150 + i * (w - 180) / 12; c.fillRect(x, 622, 1, 14); c.fillText(`00:${String(i * 3).padStart(2, '0')}`, x + 6, 630); }
        c.font = `600 14px ${SANS}`; ['V2', 'V1', 'A1', 'A2'].forEach((n, i) => { c.fillStyle = C.mute; c.fillText(n, 44, [689, 798, 922, 1028][i]); });
        c.fillStyle = 'rgba(255,255,255,0.03)'; [[658, 62], [734, 128], [876, 92], [982, 92]].forEach(([y, hh]) => c.fillRect(120, y, w - 120, hh));
        c.globalAlpha = 1;
      }
      // clips -> code lines
      const N = CLIPS.length;
      c.font = `400 ${FS}px ${MONO}`;
      CLIPS.forEach(([ty, th, x, cw, col, thumb], i) => {
        const li = Math.min(CODE.length - 1, i), ki = ease(clamp((k * 1.25 - (i / N) * 0.25)));
        const ind = CODE[li].match(/^ */)[0].length * c.measureText(' ').width, tw = c.measureText(CODE[li].trim()).width;
        const dg = i === 5 ? drag : 0;                                   // the clip being dragged in at the start
        const rx = lerp(x + dg * 170, CX + ind, ki), ry = lerp(ty - dg * 26, CY + li * LH - 8, ki), rw = lerp(cw, tw, ki), rh = lerp(th, 16, ki);
        if (dg > 0.02 && ki < 0.1) { c.globalAlpha = 0.35; c.fillStyle = '#fff'; c.beginPath(); c.roundRect(rx - 3, ry - 3, rw + 6, rh + 6, 10); c.fill(); c.globalAlpha = 1; }
        const a = 1 - clamp((k - 0.8) / 0.2);
        if (a <= 0) return;
        c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.roundRect(rx, ry, rw, rh, lerp(8, 4, ki)); c.fill();
        if (thumb >= 0 && ki < 0.5) { c.globalAlpha = a * (1 - ki * 2) * 0.92; for (let q = 0; q * 76 < rw - 8; q++) c.drawImage(IMG.demo[(thumb + q) % 7], 0, 250, 540, 460, rx + 4 + q * 76, ry + 4, Math.min(72, rw - 8 - q * 76), rh - 8); }
        else if (thumb < 0 && ki < 0.5 && th > 80) { c.globalAlpha = a * (1 - ki * 2) * 0.55; c.fillStyle = '#081013'; for (let q = 0; q < rw - 8; q += 5) { const e = Math.abs(Math.sin(q * 0.31 + i * 2.1) * Math.sin(q * 0.047 + i)); c.fillRect(rx + 4 + q, ry + rh / 2 - e * rh * 0.42, 2.5, e * rh * 0.84 + 1.5); } }
        c.globalAlpha = 1;
      });
      if (ui > 0) { c.globalAlpha = ui; const px = 150 + play * (w - 200); c.fillStyle = C.coral; c.fillRect(px - 1.5, 612, 3, 470); c.beginPath(); c.moveTo(px - 9, 608); c.lineTo(px + 9, 608); c.lineTo(px, 624); c.fill(); c.globalAlpha = 1; }
      if (cd > 0) for (let i = 0; i < Math.min(CODE.length, 19); i++) codeLine(i, CY + i * LH, CX, FS, 1e9, i === 4 && blink, cd);
      end();
    },
    // the editor typing falas[4] as it is spoken. typed: characters of that line shown so far
    roteiro({ typed = 0, blink = true }) {
      begin(); chrome('roteiro.json — fabrica-de-criativos');
      c.fillStyle = C.bar; c.fillRect(0, 40, w, 38); c.fillStyle = C.bg; c.fillRect(0, 40, 190, 38); c.fillStyle = C.coral; c.fillRect(0, 40, 190, 2);
      c.fillStyle = '#EEF4F4'; c.font = `400 14px ${SANS}`; c.textBaseline = 'middle'; c.fillText('roteiro.json', 20, 60);
      const fs = 34, lh = 56, y0 = 134;
      for (let i = 0; i < 8; i++) {
        const y = y0 + i * lh; if (i === 7) { c.fillStyle = 'rgba(255,255,255,0.04)'; c.fillRect(0, y - lh / 2, w, lh); }
        if (i < 7) codeLine(i, y, 120, fs); else codeLine(7, y, 120, fs, 5 + typed, blink);
      }
      // the terminal below, with the kit's real preview command
      c.fillStyle = C.term; c.fillRect(0, 760, w, h - 760); c.fillStyle = C.line; c.fillRect(0, 760, w, 1.5);
      c.font = `600 13px ${SANS}`; c.fillStyle = '#EEF4F4'; c.fillText('TERMINAL', 28, 790); c.fillStyle = C.coral; c.fillRect(28, 803, 66, 2);
      c.font = `400 26px ${MONO}`; c.fillStyle = C.coral; c.fillText('$', 28, 860); c.fillStyle = '#EEF4F4'; c.fillText('make previa FILME=exemplos/bancada', 60, 860);
      c.fillStyle = C.mute; c.fillText('== trilha  == efeitos  == mixagem', 28, 912);
      end();
    },
    rotLine: (k = 0.2) => toLid(120 + k * 900, 134 + 7 * 56),
    // terminal with the real variant command; ran: 0..1 output reveal
    terminal({ ran = 0, blink = true }) {
      begin(); chrome('zsh — fabrica-de-criativos');
      c.fillStyle = C.term; c.fillRect(0, 40, w, h - 40);
      const fs = 30, x = 70; c.font = `400 ${fs}px ${MONO}`; c.textBaseline = 'middle';
      c.fillStyle = C.mute; c.fillText('~/fabrica-de-criativos', x, 130);
      c.fillStyle = C.coral; c.fillText('$', x, 190); c.fillStyle = '#EEF4F4'; c.fillText('python3 scripts/variante.py \\', x + 36, 190);
      c.fillText('  exemplos/demo escuro --tema escuro', x + 36, 240);
      const cx = x + 36 + c.measureText('  exemplos/demo escuro --tema escuro').width;
      if (ran <= 0) { if (blink) { c.fillStyle = '#EEF4F4'; c.fillRect(cx + 8, 222, 16, 36); } }
      else {
        c.fillStyle = C.key; c.fillText('-> exemplos/demo-escuro/', x, 310);
        if (ran > 0.5) { c.fillStyle = C.coral; c.fillText('$', x, 370); c.fillStyle = '#EEF4F4'; c.fillText('scripts/finalizar.sh exemplos/demo-escuro', x + 36, 370); }
      }
      end();
    },
    // the repository page in a narrow browser window
    github() {
      begin(); chrome('fabrica-de-criativos — GitHub');
      c.fillStyle = '#0d1117'; c.fillRect(0, 40, w, h - 40);
      c.fillStyle = '#161b22'; c.fillRect(0, 40, w, 44); c.fillStyle = '#0d1117'; c.beginPath(); c.roundRect(260, 48, w - 520, 28, 14); c.fill();
      c.fillStyle = C.text; c.font = `400 14px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('github.com/FilipeMolinariMoura/fabrica-de-criativos', w / 2, 62.5); c.textAlign = 'left';
      const pw2 = 640, ph2 = h - 84, sc = pw2 / IMG.gh.width;
      c.fillStyle = '#010409'; c.fillRect(0, 84, w, 112 * 1.4 * sc);
      c.drawImage(IMG.gh, 0, 0, IMG.gh.width, ph2 / sc, (w - pw2) / 2, 84, pw2, ph2);
      end();
    },
  };
  return screen;
}

// The GitHub screenshot without the zeroed counters: the Fork/Star buttons and the "0 stars / 0 watching /
// 0 forks" row are painted out with the page's own background and the rows below move up.
export function retouchGitHub(img) {
  const cv = canvas(img.width, img.height), c = cv.getContext('2d');
  c.drawImage(img, 0, 0);
  const bg = c.getImageData(1200, 760, 1, 1).data, col = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
  c.fillStyle = col; c.fillRect(398, 600, 892, 108);                                   // Fork 0 + star button
  const y0 = 1968, cut = 92; c.drawImage(img, 0, y0 + cut, img.width, img.height - y0 - cut, 0, y0, img.width, img.height - y0 - cut);
  c.fillStyle = col; c.fillRect(0, img.height - cut, img.width, cut);
  return cv;
}

// ------------------------------------------------------------------ celular
export function makePhoneScreen(IMG) {
  const P = PHONE, pw = P.w - 2 * P.glassInset - 0.02, ph = P.h - 2 * P.glassInset - 0.02;
  const aw = pw - 2 * P.bezel, ah = ph - 2 * P.bezel, k = 1290 / aw;
  const cv = canvas(pw * k, ph * k), c = cv.getContext('2d');
  const bx = P.bezel * k, by = P.bezel * k, W = aw * k, H = ah * k, SB = 150;
  const tex = dynTex(cv);
  const begin = (bg) => {
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
    c.save(); c.beginPath(); c.roundRect(bx, by, W, H, (P.r - P.glassInset - 0.01 - P.bezel) * k); c.clip();
    c.fillStyle = bg; c.fillRect(bx, by, W, H);
  };
  const end = (dark = true, bar = true) => {
    const ink = dark ? '#fff' : '#111';
    if (bar) {
      c.fillStyle = ink; c.font = '600 50px Chrome'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText('9:41', bx + 96, by + 84);
      const rx = bx + W - 96; c.globalAlpha = 0.45; c.strokeStyle = ink; c.lineWidth = 3.5; c.beginPath(); c.roundRect(rx - 78, by + 66, 72, 36, 11); c.stroke(); c.globalAlpha = 1;
      c.beginPath(); c.roundRect(rx - 73, by + 71, 50, 26, 7); c.fill();
      for (let i = 0; i < 4; i++) { const hh = 14 + i * 8; c.beginPath(); c.roundRect(rx - 190 + i * 15, by + 102 - hh, 10, hh, 3); c.fill(); }
    }
    c.fillStyle = '#000'; c.beginPath(); c.arc(bx + W / 2, by + 80, 36, 0, 7); c.fill();
    c.fillStyle = dark ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.7)'; c.beginPath(); c.roundRect(bx + W / 2 - 215, by + H - 36, 430, 15, 8); c.fill();
    c.restore(); tex.needsUpdate = true;
  };
  return {
    tex,
    // a real frame (demo ad, variant): fills the screen
    image(img, dark = false) { begin('#000'); const sc = Math.max(W / img.width, H / img.height); c.drawImage(img, bx + W / 2 - img.width * sc / 2, by + H / 2 - img.height * sc / 2, img.width * sc, img.height * sc); end(dark, false); },
    github() { begin('#010409'); c.drawImage(IMG.gh, 0, 0, IMG.gh.width, H - SB, bx, by + SB, W, H - SB); end(true); },
    // search: typed characters, result card 0..1, star 0..1
    search({ text = '', result = 0, star = 0, tap = 0, blink = true }) {
      begin('#0d1117');
      c.fillStyle = '#010409'; c.fillRect(bx, by, W, 420);
      const fx = bx + 60, fy = by + 210, fw = W - 120, fh = 150;
      c.fillStyle = '#0d1117'; c.strokeStyle = text ? '#4493f8' : '#3d444d'; c.lineWidth = text ? 6 : 4; c.beginPath(); c.roundRect(fx, fy, fw, fh, 26); c.fill(); c.stroke();
      c.strokeStyle = '#9198a1'; c.lineWidth = 8; c.beginPath(); c.arc(fx + 78, fy + fh / 2 - 6, 26, 0, 7); c.moveTo(fx + 97, fy + fh / 2 + 14); c.lineTo(fx + 118, fy + fh / 2 + 36); c.stroke();
      c.font = `400 78px ${SANS}`; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillStyle = '#f0f6fc'; c.fillText(text, fx + 150, fy + fh / 2 + 4);
      if (blink) { c.fillStyle = '#f0f6fc'; c.fillRect(fx + 156 + c.measureText(text).width, fy + 34, 5, fh - 68); }
      if (result > 0) {
        const ry = by + 520 + (1 - result) * 60; c.globalAlpha = result;
        c.fillStyle = '#9198a1'; c.font = `600 44px ${SANS}`; c.fillText('Repositórios', bx + 70, ry);
        c.fillStyle = '#151b23'; c.strokeStyle = '#3d444d'; c.lineWidth = 3; c.beginPath(); c.roundRect(bx + 50, ry + 60, W - 100, 900, 30); c.fill(); c.stroke();
        c.drawImage(IMG.ghRaw, 44, 505, 80, 80, bx + 96, ry + 112, 96, 96);
        c.font = `400 58px ${SANS}`; c.fillStyle = '#4493f8'; c.fillText('FilipeMolinariMoura/', bx + 220, ry + 136);
        c.font = `600 76px ${SANS}`; c.fillText('fabrica-de-criativos', bx + 96, ry + 268);
        c.font = `400 50px ${SANS}`; c.fillStyle = '#d1d7e0';
        ['Método aberto e reprodutível para anúncios', 'em vídeo vertical com motion design e IA:', 'trilha gratuita e paga. Guia em PDF,', 'relatório técnico e kit de scripts.'].forEach((l, i) => c.fillText(l, bx + 96, ry + 390 + i * 68));
        ['claude-code', 'kokoro-tts', 'video-ads'].reduce((x, tname) => { c.font = `500 42px ${SANS}`; const tw = c.measureText(tname).width + 56; c.fillStyle = '#121d2f'; c.beginPath(); c.roundRect(x, ry + 668, tw, 70, 35); c.fill(); c.fillStyle = '#4493f8'; c.fillText(tname, x + 28, ry + 705); return x + tw + 18; }, bx + 96);
        // star button
        const sx = bx + 96, sy = ry + 790, sw = W - 192, sh = 124;
        c.fillStyle = star > 0.5 ? '#2a2412' : '#212830'; c.strokeStyle = star > 0.5 ? '#9e7b1f' : '#3d444d'; c.beginPath(); c.roundRect(sx, sy, sw, sh, 22); c.fill(); c.stroke();
        const cxs = sx + sw / 2 - 110, cys = sy + sh / 2, R1 = 34 * (1 + 0.35 * Math.sin(Math.min(1, star) * Math.PI));
        c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R1 * 0.42 : R1; c.lineTo(cxs + r * Math.cos(a), cys + r * Math.sin(a)); } c.closePath();
        if (star > 0.5) { c.fillStyle = '#e3b341'; c.fill(); } else { c.strokeStyle = '#9198a1'; c.lineWidth = 6; c.lineJoin = 'round'; c.stroke(); }
        c.fillStyle = '#f0f6fc'; c.font = `600 56px ${SANS}`; c.fillText(star > 0.5 ? 'Com estrela' : 'Estrela', cxs + 62, cys + 3);
        if (tap > 0 && tap < 1) { c.globalAlpha = (1 - tap) * 0.5; c.fillStyle = '#fff'; c.beginPath(); c.arc(sx + sw / 2, cys, 60 + tap * 240, 0, 7); c.fill(); }
        c.globalAlpha = 1;
      }
      end(true);
    },
  };
}

// small readouts and engravings
export const oled = (w, h, draw) => { const cv = canvas(w, h), c = cv.getContext('2d'); const t = dynTex(cv); t.redraw = (...a) => { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#020303'; c.fillRect(0, 0, w, h); draw(c, w, h, ...a); t.needsUpdate = true; }; t.redraw(); return t; };
export function label(text, { w = 512, h = 160, size = 96, color = '#fff', font = SANS, weight = 500, align = 'center', track = -2 } = {}) {
  return textTexture(w, h, (c) => { c.font = `${weight} ${size}px ${font}`; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; c.letterSpacing = `${track}px`; c.fillText(text, align === 'center' ? w / 2 : align === 'left' ? 12 : w - 12, h / 2 + size * 0.04); });
}
