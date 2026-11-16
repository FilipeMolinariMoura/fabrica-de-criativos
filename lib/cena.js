// cena.js: o sistema visual compartilhado por todos os criativos.
//
// Visual de "lançamento de app": espaço claro e arejado, cards de vidro flutuando em profundidades diferentes
// (profundidade de campo), botões em pílula que acendem, palavras que entram e saem com desfoque, um cursor
// que clica, varreduras de luz e transições com zoom e desfoque.
// Tudo aqui é função pura do tempo (t em segundos). Nada de Math.random: só ruído com semente.
//
// A marca (cores, nomes das fontes, textos do cartão final) vem de um objeto MARCA montado assim, do mais
// fraco para o mais forte:
//   1. o padrão abaixo (vermelho neutro, papel quente, tinta grafite);
//   2. lib/marca.json, se existir (é o lugar de configurar a sua marca);
//   3. window.MARCA definido no index.html do filme ANTES do film.js (para um filme fugir do padrão).
// Variações sem reescrever o filme: window.TEMA = 'escuro' e/ou window.ESTILO = 'impacto' no index.html.
import * as M from './motion.js';

const { W, H, clamp, lerp, E, rrect, noise1 } = M;

// ------------------------------------------------------------------ marca
const PADRAO = {
  nome: 'Sua Marca',
  cores: {
    destaque: '#D7263D', destaqueEscuro: '#A51D2F', destaqueClaro: '#EF4259',
    papel: '#F4F1EE', papel2: '#E9E4DF', tinta: '#1E1C1D', tinta2: '#57524F', mudo: '#9B948F',
    escuro: '#0B0A0A', escuro2: '#171314',
  },
  fontes: { display: 'Display', ui: 'UI' },
  fim: { titulo: 'Comece *hoje*', sub: 'Uma frase curta sobre o que a marca entrega', cta: 'Saiba mais', rodape: '' },
};
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function fundir(...objs) {
  const out = {};
  for (const o of objs) for (const [k, v] of Object.entries(o || {})) out[k] = isObj(v) && isObj(out[k]) ? fundir(out[k], v) : v;
  return out;
}
let doArquivo = {};
try {
  const r = await fetch(new URL('./marca.json', import.meta.url));
  if (r.ok) doArquivo = await r.json();
} catch { /* sem marca.json: fica o padrão */ }
export const MARCA = fundir(PADRAO, doArquivo, globalThis.MARCA || {});

// rgba() a partir de um hex
export const rgba = (hex, a) => { const [r, g, b] = M.hexRgb(hex); return `rgba(${r},${g},${b},${a})`; };
const rgbStr = (hex) => M.hexRgb(hex).join(',');

const K = MARCA.cores;
// Paleta usada pelas primitivas. acc* = cor de destaque da marca (botões acesos, chips, brilhos).
export const C = {
  paper: K.papel, paper2: K.papel2, glass: 'rgba(255,255,255,0.78)', glassHi: 'rgba(255,255,255,0.92)',
  ink: K.tinta, ink2: K.tinta2, mute: K.mudo, line: rgba(K.tinta, 0.09),
  acc: K.destaque, accDeep: K.destaqueEscuro, accHi: K.destaqueClaro, accGlow: rgba(K.destaqueClaro, 0.55),
  accSoft: M.mix('#ffffff', K.destaque, 0.12), accSoft2: M.mix('#ffffff', K.destaque, 0.26),
  dark: K.escuro, dark2: K.escuro2, warn: K.destaqueClaro,
};
export const DISPLAY = MARCA.fontes.display, UI = MARCA.fontes.ui;
export const THEME = globalThis.TEMA || 'claro';      // 'claro' | 'escuro'
export const STYLE = globalThis.ESTILO || 'limpo';    // 'limpo' | 'impacto' (títulos em itálico pesado, caixa alta)
const ESCURO = THEME === 'escuro' || THEME === 'dark';
C.head = ESCURO ? '#F6F3F1' : C.ink;
// cor para texto desenhado direto no fundo (fora de um card): no tema escuro vira um tom claro
const NO_ESCURO = { [C.ink]: '#F6F3F1', [C.ink2]: '#CFC7C4', [C.mute]: '#A39B98' };
export const bgText = (c) => (ESCURO ? (NO_ESCURO[c] || c) : c);
export const f = (size, weight = 600, fam = UI) => M.font(size, weight, fam);
export const fd = (size, weight = 800) => M.font(size, weight, DISPLAY);
export const fdi = (size, weight = 900) => `italic ${M.font(size, weight, DISPLAY)}`;

// ------------------------------------------------------------------ tempo (segundos)
export const pr = (t, a, b) => clamp((t - a) / (b - a));
export const win = (t, a, b) => t >= a && t < b;
// envelope: 0 antes de a, sobe até 1 em din, mantém, desce a 0 em dout terminando em b
export function env(t, a, b, din = 0.45, dout = 0.35, ein = E.outCubic, eout = E.inCubic) {
  if (t < a || t > b) return 0;
  const i = ein(pr(t, a, a + din));
  const o = 1 - eout(pr(t, b - dout, b));
  return Math.min(i, o);
}
// mola a partir do tempo a (segundos), 0 -> 1 com um toque de passada
export function sp(t, a, stiff = 170, damp = 18) {
  if (t <= a) return 0;
  return M.spring(t - a, { stiffness: stiff, damping: damp });
}

// ------------------------------------------------------------------ fundos
// Claro: papel quente com manchas de cor lentas e suaves (tom da marca, pedra, branco).
export function bgLight(ctx, t, { warmth = 1, drift = 1 } = {}) {
  if (ESCURO) {
    bgDark(ctx, t, { glow: 0.75, cy: 0.45 });
    // uma poça de luz quente atrás do conteúdo, para cards brancos e o celular ficarem num espaço iluminado
    const g = ctx.createRadialGradient(W / 2, H * 0.52, 0, W / 2, H * 0.52, W * 0.95);
    g.addColorStop(0, 'rgba(255,235,230,0.07)'); g.addColorStop(1, 'rgba(255,235,230,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    return;
  }
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  const tom = rgbStr(M.mix(C.paper, C.acc, 0.22)), tom2 = rgbStr(M.mix(C.paper, C.acc, 0.1)), pedra = rgbStr(M.mix(C.paper, C.ink2, 0.12));
  const blobs = [
    [0.18, 0.22, 0.75, `rgba(${tom},`, 0.55 * warmth, 1],
    [0.85, 0.38, 0.65, 'rgba(255,255,255,', 0.9, 2],
    [0.7, 0.82, 0.8, `rgba(${pedra},`, 0.7, 3],
    [0.2, 0.75, 0.55, `rgba(${tom2},`, 0.6 * warmth, 4],
  ];
  for (const [bx, by, br, col, a, s] of blobs) {
    const x = (bx + 0.06 * drift * noise1(t * 0.07, s)) * W;
    const y = (by + 0.05 * drift * noise1(t * 0.06, s + 9)) * H;
    const r = br * W * (1 + 0.08 * noise1(t * 0.05, s + 4));
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col + a + ')'); g.addColorStop(1, col + '0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
}
// Escuro: quase preto com um brilho de brasa na cor da marca (cenas de problema, tensão).
export function bgDark(ctx, t, { glow = 1, cx = 0.5, cy = 0.42 } = {}) {
  ctx.fillStyle = C.dark; ctx.fillRect(0, 0, W, H);
  const brasa = rgbStr(M.mix(C.accDeep, '#000000', 0.15)), fundo = rgbStr(M.mix(C.accDeep, '#000000', 0.55));
  const x = (cx + 0.04 * noise1(t * 0.1, 2)) * W, y = (cy + 0.03 * noise1(t * 0.08, 5)) * H;
  let g = ctx.createRadialGradient(x, y, 0, x, y, W * 1.1);
  g.addColorStop(0, `rgba(${brasa},${0.6 * glow})`); g.addColorStop(0.45, `rgba(${fundo},${0.38 * glow})`); g.addColorStop(1, rgba(C.dark, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  g = ctx.createRadialGradient(W * 0.8, H * 0.9, 0, W * 0.8, H * 0.9, W * 0.9);
  g.addColorStop(0, `rgba(${fundo},${0.3 * glow})`); g.addColorStop(1, rgba(C.dark, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// Granulação + vinheta. Rode no post() para o desfoque de movimento não apagar o grão.
export function grain(ctx, t, amt = 0.035, dark = false) {
  if (ESCURO) { dark = true; amt = Math.max(amt, 0.045); }
  const n = Math.floor(t * 30);
  ctx.save();
  ctx.globalAlpha = amt;
  ctx.globalCompositeOperation = dark ? 'screen' : 'multiply';
  const tile = grainTile(n % 6);
  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, dark ? 'rgba(0,0,0,0.45)' : 'rgba(60,40,40,0.10)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
const grainCache = [];
function grainTile(i) {
  if (grainCache[i]) return grainCache[i];
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'); const d = x.createImageData(256, 256); const r = M.mulberry32(1000 + i);
  for (let k = 0; k < d.data.length; k += 4) { const v = 128 + (r() - 0.5) * 160; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255; }
  x.putImageData(d, 0, 0); grainCache[i] = c; return c;
}

// ------------------------------------------------------------------ camadas
// Desenha numa camada fora da tela (reaproveitada por chave) para um grupo inteiro poder levar desfoque,
// transparência e escala juntos.
const layers = new Map();
export function layer(key) {
  let c = layers.get(key);
  if (!c) { c = document.createElement('canvas'); c.width = W; c.height = H; layers.set(key, c); }
  const x = c.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.globalAlpha = 1; x.filter = 'none';
  return [c, x];
}
// compõe uma camada com desfoque / alfa / escala em torno de (cx, cy) / deslocamento / rotação
export function put(ctx, c, { a = 1, blur = 0, s = 1, cx = W / 2, cy = H / 2, dx = 0, dy = 0, rot = 0, comp } = {}) {
  if (a <= 0.002) return;
  ctx.save();
  ctx.globalAlpha *= a;
  if (comp) ctx.globalCompositeOperation = comp;
  if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
  ctx.translate(cx + dx, cy + dy); ctx.rotate(rot); ctx.scale(s, s); ctx.translate(-cx, -cy);
  ctx.drawImage(c, 0, 0);
  ctx.restore();
}
// group(ctx, chave, opts, desenho): desenha numa camada e compõe com as opções acima
export function group(ctx, key, opts, draw) {
  if ((opts.a ?? 1) <= 0.002) return;
  const [c, x] = layer(key);
  draw(x);
  put(ctx, c, opts);
}

// ------------------------------------------------------------------ card de vidro
export function card(ctx, x, y, w, h, { r = 34, fill = C.glass, shadow = 0.10, stroke = 'rgba(255,255,255,0.9)', lift = 1 } = {}) {
  ctx.save();
  ctx.shadowColor = `rgba(70,40,40,${shadow})`; ctx.shadowBlur = 60 * lift; ctx.shadowOffsetY = 24 * lift;
  rrect(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  ctx.restore();
  ctx.save();
  rrect(ctx, x + 1, y + 1, w - 2, h - 2, r - 1); ctx.lineWidth = 2; ctx.strokeStyle = stroke; ctx.stroke();
  ctx.restore();
}
export function clipR(ctx, x, y, w, h, r) { rrect(ctx, x, y, w, h, r); ctx.clip(); }

// ------------------------------------------------------------------ texto
export function txt(ctx, s, x, y, font, color, align = 'left', track = 0) { M.text(ctx, s, x, y, font, color, align, track); }
export function measure(ctx, s, font, track = 0) { return M.layout(ctx, s, font, track).width; }

// Título cinético. words: [['Zero', 0], ['caos.', 1]] (1 = destaque). Linhas separadas pelo token '\n'.
// Cada palavra entra com desfoque (26 -> 0), sobe 40 px e escala 1,08 -> 1, em cascata; a saída desfoca e sobe.
export function headline(ctx, t, words, { x = W / 2, y = H / 2, size = 120, weight = 800, italic = false, t0 = 0, t1 = 99, stagger = 0.07,
  color = C.head, accent = C.acc, align = 'center', lh = 1.08, track = -0.02, din = 0.5, dout = 0.32, fam = DISPLAY, accentStyle = 'color' } = {}) {
  if (t < t0 - 0.01 || t > t1 + 0.6) return;
  if (STYLE === 'impacto' && fam === DISPLAY) { italic = true; weight = 900; track = 0; size *= 1.08; words = words.map((w) => [w[0].toUpperCase(), w[1]]); }
  if (ESCURO && color === C.ink) color = C.head;
  const font = (italic ? 'italic ' : '') + M.font(size, weight, fam);
  const lines = [[]];
  for (const w of words) { if (w[0] === '\n') lines.push([]); else lines[lines.length - 1].push(w); }
  ctx.font = font; ctx.letterSpacing = `${track * size}px`;
  const space = ctx.measureText(' ').width;
  const lw = lines.map((L) => L.reduce((s, w) => s + ctx.measureText(w[0]).width, 0) + space * (L.length - 1));
  ctx.letterSpacing = '0px';
  let k = 0;
  lines.forEach((L, li) => {
    let cx = align === 'center' ? x - lw[li] / 2 : align === 'right' ? x - lw[li] : x;
    const by = y + (li - (lines.length - 1) / 2) * size * lh + size * 0.35;
    L.forEach((w) => {
      ctx.font = font; ctx.letterSpacing = `${track * size}px`;
      const ww = ctx.measureText(w[0]).width;
      ctx.letterSpacing = '0px';
      const ti = t0 + k * stagger, to = t1 + k * stagger * 0.5;
      const pin = E.outCubic(pr(t, ti, ti + din)), pout = E.inCubic(pr(t, to, to + dout));
      const a = pin * (1 - pout);
      if (a > 0.003) {
        ctx.save();
        const bl = (1 - pin) * 26 + pout * 22;
        if (bl > 0.3) ctx.filter = `blur(${bl.toFixed(1)}px)`;
        ctx.globalAlpha *= a;
        const s = lerp(1.08, 1, pin) + pout * 0.06;
        const yy = by + (1 - pin) * 40 - pout * 30;
        ctx.translate(cx + ww / 2, yy); ctx.scale(s, s); ctx.translate(-(cx + ww / 2), -yy);
        if (w[1] && accentStyle === 'pill') {
          const pad = size * 0.22;
          ctx.save(); ctx.shadowColor = C.accGlow; ctx.shadowBlur = 50 * pin;
          rrect(ctx, cx - pad, yy - size * 0.86, ww + pad * 2, size * 1.12, size * 0.56); ctx.fillStyle = accent; ctx.fill(); ctx.restore();
          M.text(ctx, w[0], cx, yy, font, '#fff', 'left', track * size);
        } else {
          M.text(ctx, w[0], cx, yy, font, w[1] ? accent : color, 'left', track * size);
        }
        ctx.restore();
      }
      cx += ww + space + (w[1] && accentStyle === 'pill' ? size * 0.44 : 0);
      k++;
    });
  });
}
// atalho: 'Zero *caos.*' -> palavras com marca de destaque; '|' = quebra de linha
export function W_(s) {
  const out = [];
  s.split(' ').forEach((tok) => {
    if (tok === '|') { out.push(['\n', 0]); return; }
    const acc = tok.startsWith('*');
    out.push([tok.replace(/\*/g, ''), acc ? 1 : 0]);
  });
  return out;
}

// ------------------------------------------------------------------ botão em pílula
// on: 0 = pílula de vidro, 1 = pílula acesa na cor da marca, com brilho; press: 0..1 apertão; sweep: 0..1 reflexo
export function pill(ctx, cx, cy, label, { on = 0, size = 44, press = 0, icon = null, w = null, sweep = -1, a = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= a;
  const font = f(size, 600);
  const tw = measure(ctx, label, font) + (icon ? size * 1.2 : 0);
  const pw = w || tw + size * 1.6, ph = size * 2.1;
  const s = 1 - 0.06 * press;
  ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
  const x = cx - pw / 2, y = cy - ph / 2;
  if (on > 0.01) {
    ctx.save(); ctx.globalAlpha *= on;
    ctx.shadowColor = C.accGlow; ctx.shadowBlur = 70; ctx.shadowOffsetY = 14;
    rrect(ctx, x, y, pw, ph, ph / 2); ctx.fillStyle = C.acc; ctx.fill();
    ctx.restore();
  }
  ctx.save(); ctx.shadowColor = 'rgba(70,40,40,0.10)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
  rrect(ctx, x, y, pw, ph, ph / 2); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill(); ctx.restore();
  if (on > 0.01) {
    ctx.save(); ctx.globalAlpha *= on;
    const g = ctx.createLinearGradient(0, y, 0, y + ph); g.addColorStop(0, C.accHi); g.addColorStop(1, C.acc);
    rrect(ctx, x, y, pw, ph, ph / 2); ctx.fillStyle = g; ctx.fill();
    rrect(ctx, x + 3, y + 3, pw - 6, ph * 0.5, ph / 2); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fill();
    ctx.restore();
  }
  if (sweep >= 0 && sweep <= 1) {
    ctx.save(); rrect(ctx, x, y, pw, ph, ph / 2); ctx.clip();
    const sx = x - pw * 0.3 + sweep * pw * 1.6;
    const g = ctx.createLinearGradient(sx - 80, 0, sx + 80, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y, pw, ph); ctx.restore();
  }
  const col = M.mix(C.ink, '#ffffff', on);
  let tx = cx - tw / 2;
  if (icon) { icon(ctx, tx + size * 0.45, cy, size * 0.95, col); tx += size * 1.2; }
  txt(ctx, label, tx, cy + size * 0.36, font, col, 'left');
  ctx.restore();
  return { x, y, w: pw, h: ph };
}

// chip de status. tone: 'destaque' | 'escuro' | 'alerta' | 'neutro'
export function chip(ctx, x, y, label, { tone = 'destaque', size = 26, align = 'left' } = {}) {
  const font = f(size, 600);
  const tw = measure(ctx, label, font), pw = tw + size * 1.6 + size * 0.8, ph = size * 1.7;
  const x0 = align === 'right' ? x - pw : align === 'center' ? x - pw / 2 : x;
  const bg = { destaque: C.accSoft, escuro: C.ink, alerta: C.accSoft2, neutro: '#EEEAE6' }[tone] || C.accSoft;
  const fg = { destaque: C.acc, escuro: '#fff', alerta: C.warn, neutro: C.ink2 }[tone] || C.acc;
  rrect(ctx, x0, y - ph / 2, pw, ph, ph / 2); ctx.fillStyle = bg; ctx.fill();
  ctx.beginPath(); ctx.arc(x0 + size * 0.9, y, size * 0.26, 0, M.TAU); ctx.fillStyle = fg; ctx.fill();
  txt(ctx, label, x0 + size * 1.5, y + size * 0.36, font, fg);
  return pw;
}

// ------------------------------------------------------------------ cursor, clique, toque
export function cursor(ctx, x, y, { press = 0, a = 1, scale = 1.25 } = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(scale * (1 - 0.12 * press), scale * (1 - 0.12 * press));
  ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.lineTo(11, 35); ctx.lineTo(19, 53); ctx.lineTo(27, 49); ctx.lineTo(19, 32); ctx.lineTo(34, 32); ctx.closePath();
  ctx.fillStyle = '#111'; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 3.5; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
// onda de clique em (x, y), começando em t0
export function ripple(ctx, t, t0, x, y, { color = C.accHi, r = 90 } = {}) {
  const p = pr(t, t0, t0 + 0.55);
  if (p <= 0 || p >= 1) return;
  ctx.save(); ctx.globalAlpha = (1 - p) * 0.8;
  ctx.beginPath(); ctx.arc(x, y, 12 + r * E.outCubic(p), 0, M.TAU); ctx.lineWidth = 6 * (1 - p) + 1; ctx.strokeStyle = color; ctx.stroke();
  ctx.restore();
}
// toque de dedo (cenas de celular): disco suave
export function tap(ctx, t, t0, x, y) {
  const p = pr(t, t0 - 0.12, t0 + 0.45);
  if (p <= 0 || p >= 1) return;
  const k = p < 0.25 ? p / 0.25 : 1 - (p - 0.25) / 0.75;
  ctx.save(); ctx.globalAlpha = 0.45 * k;
  ctx.beginPath(); ctx.arc(x, y, 34 + 30 * p, 0, M.TAU); ctx.fillStyle = rgba(C.ink, 0.5); ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ celular
// Desenha um celular moderno centrado em (cx, cy) com tela de largura sw; screen(ctx, x, y, w, h) pinta a interface.
export function phone(ctx, cx, cy, sw, screen, { tilt = 0, a = 1, shadow = 1, dark = false, island = true } = {}) {
  const sh = sw * 2.165, bez = sw * 0.035, R = sw * 0.16;
  const x = cx - sw / 2, y = cy - sh / 2;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.translate(cx, cy); ctx.rotate(tilt); ctx.translate(-cx, -cy);
  ctx.save(); ctx.shadowColor = `rgba(40,20,20,${0.28 * shadow})`; ctx.shadowBlur = 90; ctx.shadowOffsetY = 50;
  rrect(ctx, x - bez, y - bez, sw + bez * 2, sh + bez * 2, R + bez); ctx.fillStyle = '#121112'; ctx.fill(); ctx.restore();
  rrect(ctx, x - bez, y - bez, sw + bez * 2, sh + bez * 2, R + bez); ctx.lineWidth = 3; ctx.strokeStyle = '#4a4648'; ctx.stroke();
  ctx.save(); clipR(ctx, x, y, sw, sh, R);
  ctx.fillStyle = dark ? '#121012' : '#F7F5F3'; ctx.fillRect(x, y, sw, sh);
  screen(ctx, x, y, sw, sh);
  const g = ctx.createLinearGradient(x, y, x + sw, y + sh);
  g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x, y, sw, sh);
  ctx.restore();
  if (island) { rrect(ctx, cx - sw * 0.15, y + sw * 0.035, sw * 0.3, sw * 0.085, sw * 0.045); ctx.fillStyle = '#050505'; ctx.fill(); }
  ctx.restore();
  return { x, y, w: sw, h: sh };
}
// barra de status dentro de uma tela
export function statusBar(ctx, x, y, w, { dark = false, hora = '9:41' } = {}) {
  const col = dark ? '#fff' : C.ink, s = w / 400;
  txt(ctx, hora, x + 34 * s, y + 38 * s, f(17 * s, 600), col);
  rrect(ctx, x + w - 62 * s, y + 25 * s, 30 * s, 14 * s, 4 * s); ctx.strokeStyle = col; ctx.lineWidth = 1.6 * s; ctx.stroke();
  rrect(ctx, x + w - 60 * s, y + 27 * s, 22 * s, 10 * s, 2 * s); ctx.fillStyle = col; ctx.fill();
  for (let i = 0; i < 4; i++) { rrect(ctx, x + w - 112 * s + i * 7 * s, y + 37 * s - (i + 1) * 3.2 * s, 4.5 * s, (i + 1) * 3.2 * s, 1 * s); ctx.fill(); }
}

// ------------------------------------------------------------------ ícones (de linha, desenhados em código)
function stroke(ctx, col, lw) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
export const I = {
  check(ctx, x, y, s, col = '#fff', p = 1) {
    ctx.save(); stroke(ctx, col, s * 0.14);
    ctx.beginPath(); ctx.moveTo(x - s * 0.3, y);
    const a = clamp(p * 2), b = clamp(p * 2 - 1);
    ctx.lineTo(x - s * 0.3 + (s * 0.18) * a, y + s * 0.2 * a);
    if (b > 0) ctx.lineTo(x - s * 0.12 + s * 0.44 * b, y + s * 0.2 - s * 0.45 * b);
    ctx.stroke(); ctx.restore();
  },
  pin(ctx, x, y, s, col = C.acc) {
    ctx.save(); ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y - s * 0.15, s * 0.32, Math.PI, 0); ctx.lineTo(x, y + s * 0.42); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - s * 0.15, s * 0.13, 0, M.TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
  },
  clock(ctx, x, y, s, col = C.ink2) {
    ctx.save(); stroke(ctx, col, s * 0.09);
    ctx.beginPath(); ctx.arc(x, y, s * 0.4, 0, M.TAU); ctx.moveTo(x, y - s * 0.22); ctx.lineTo(x, y); ctx.lineTo(x + s * 0.16, y + s * 0.1); ctx.stroke(); ctx.restore();
  },
  user(ctx, x, y, s, col = C.ink2) {
    ctx.save(); stroke(ctx, col, s * 0.09);
    ctx.beginPath(); ctx.arc(x, y - s * 0.14, s * 0.18, 0, M.TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + s * 0.42, s * 0.34, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); ctx.restore();
  },
  camera(ctx, x, y, s, col = C.ink2) {
    ctx.save(); stroke(ctx, col, s * 0.09);
    rrect(ctx, x - s * 0.42, y - s * 0.26, s * 0.84, s * 0.58, s * 0.1); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + s * 0.03, s * 0.15, 0, M.TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * 0.16, y - s * 0.26); ctx.lineTo(x - s * 0.1, y - s * 0.38); ctx.lineTo(x + s * 0.1, y - s * 0.38); ctx.lineTo(x + s * 0.16, y - s * 0.26); ctx.stroke(); ctx.restore();
  },
  qr(ctx, x, y, s, col = C.ink2) {
    ctx.save(); stroke(ctx, col, s * 0.09);
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1]]) { ctx.strokeRect(x + dx * s * 0.24 - s * 0.12, y + dy * s * 0.24 - s * 0.12, s * 0.24, s * 0.24); }
    ctx.fillStyle = col; ctx.fillRect(x + s * 0.14, y + s * 0.14, s * 0.2, s * 0.2); ctx.restore();
  },
  truck(ctx, x, y, s, col = C.ink2) {
    ctx.save(); stroke(ctx, col, s * 0.085);
    ctx.strokeRect(x - s * 0.45, y - s * 0.22, s * 0.55, s * 0.4);
    ctx.beginPath(); ctx.moveTo(x + s * 0.1, y - s * 0.08); ctx.lineTo(x + s * 0.32, y - s * 0.08); ctx.lineTo(x + s * 0.45, y + s * 0.06); ctx.lineTo(x + s * 0.45, y + s * 0.18); ctx.lineTo(x + s * 0.1, y + s * 0.18); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - s * 0.25, y + s * 0.26, s * 0.09, 0, M.TAU); ctx.arc(x + s * 0.28, y + s * 0.26, s * 0.09, 0, M.TAU); ctx.fillStyle = col; ctx.fill(); ctx.restore();
  },
  box(ctx, x, y, s, col = C.ink2) {
    ctx.save(); stroke(ctx, col, s * 0.085);
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.4); ctx.lineTo(x + s * 0.38, y - s * 0.2); ctx.lineTo(x + s * 0.38, y + s * 0.22); ctx.lineTo(x, y + s * 0.42); ctx.lineTo(x - s * 0.38, y + s * 0.22); ctx.lineTo(x - s * 0.38, y - s * 0.2); ctx.closePath();
    ctx.moveTo(x - s * 0.38, y - s * 0.2); ctx.lineTo(x, y); ctx.lineTo(x + s * 0.38, y - s * 0.2); ctx.moveTo(x, y); ctx.lineTo(x, y + s * 0.42); ctx.stroke(); ctx.restore();
  },
  gear(ctx, x, y, s, col = C.ink2) {
    ctx.save(); ctx.fillStyle = col; ctx.beginPath();
    for (let i = 0; i < 16; i++) { const a = (i / 16) * M.TAU, r = i % 2 ? s * 0.32 : s * 0.42; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(x, y, s * 0.14, 0, M.TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
  },
  search(ctx, x, y, s, col = C.mute) {
    ctx.save(); stroke(ctx, col, s * 0.1); ctx.beginPath(); ctx.arc(x - s * 0.06, y - s * 0.06, s * 0.26, 0, M.TAU); ctx.moveTo(x + s * 0.13, y + s * 0.13); ctx.lineTo(x + s * 0.34, y + s * 0.34); ctx.stroke(); ctx.restore();
  },
  warn(ctx, x, y, s, col = C.warn) {
    ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - s * 0.42); ctx.lineTo(x + s * 0.45, y + s * 0.36); ctx.lineTo(x - s * 0.45, y + s * 0.36); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(x - s * 0.04, y - s * 0.16, s * 0.08, s * 0.28); ctx.beginPath(); ctx.arc(x, y + s * 0.22, s * 0.05, 0, M.TAU); ctx.fill(); ctx.restore();
  },
  doc(ctx, x, y, s, col = C.ink2) {
    ctx.save(); stroke(ctx, col, s * 0.085); ctx.strokeRect(x - s * 0.3, y - s * 0.4, s * 0.6, s * 0.8);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - s * 0.17, y - s * 0.18 + i * s * 0.18); ctx.lineTo(x + s * 0.17, y - s * 0.18 + i * s * 0.18); ctx.stroke(); } ctx.restore();
  },
  shield(ctx, x, y, s, col = C.acc) {
    ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - s * 0.45); ctx.lineTo(x + s * 0.38, y - s * 0.3); ctx.lineTo(x + s * 0.34, y + s * 0.12);
    ctx.quadraticCurveTo(x + s * 0.2, y + s * 0.38, x, y + s * 0.48); ctx.quadraticCurveTo(x - s * 0.2, y + s * 0.38, x - s * 0.34, y + s * 0.12); ctx.lineTo(x - s * 0.38, y - s * 0.3); ctx.closePath(); ctx.fill(); ctx.restore();
  },
  calendar(ctx, x, y, s, col = C.ink2) {
    ctx.save(); stroke(ctx, col, s * 0.085);
    rrect(ctx, x - s * 0.38, y - s * 0.3, s * 0.76, s * 0.7, s * 0.1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * 0.38, y - s * 0.1); ctx.lineTo(x + s * 0.38, y - s * 0.1);
    ctx.moveTo(x - s * 0.18, y - s * 0.42); ctx.lineTo(x - s * 0.18, y - s * 0.22); ctx.moveTo(x + s * 0.18, y - s * 0.42); ctx.lineTo(x + s * 0.18, y - s * 0.22); ctx.stroke(); ctx.restore();
  },
  bell(ctx, x, y, s, col = C.ink2) {
    ctx.save(); stroke(ctx, col, s * 0.085);
    ctx.beginPath(); ctx.moveTo(x - s * 0.32, y + s * 0.22); ctx.quadraticCurveTo(x - s * 0.26, y + s * 0.1, x - s * 0.26, y - s * 0.05);
    ctx.arc(x, y - s * 0.05, s * 0.26, Math.PI, 0); ctx.quadraticCurveTo(x + s * 0.26, y + s * 0.1, x + s * 0.32, y + s * 0.22); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + s * 0.3, s * 0.08, 0, Math.PI); ctx.stroke(); ctx.restore();
  },
  plus(ctx, x, y, s, col = '#fff') {
    ctx.save(); stroke(ctx, col, s * 0.12);
    ctx.beginPath(); ctx.moveTo(x - s * 0.28, y); ctx.lineTo(x + s * 0.28, y); ctx.moveTo(x, y - s * 0.28); ctx.lineTo(x, y + s * 0.28); ctx.stroke(); ctx.restore();
  },
  list(ctx, x, y, s, col = C.ink2) {
    ctx.save(); stroke(ctx, col, s * 0.085);
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.arc(x - s * 0.3, y + i * s * 0.24, s * 0.04, 0, M.TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - s * 0.15, y + i * s * 0.24); ctx.lineTo(x + s * 0.36, y + i * s * 0.24); ctx.stroke();
    }
    ctx.restore();
  },
  spark(ctx, x, y, s, col = C.acc) {
    ctx.save(); ctx.fillStyle = col; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * M.TAU - Math.PI / 2, r = i % 2 ? s * 0.12 : s * 0.45; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  },
  chat(ctx, x, y, s, col = '#fff') {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.11; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.arc(x, y - s * 0.04, s * 0.38, Math.PI * 0.72, Math.PI * 2.55); ctx.lineTo(x - s * 0.42, y + s * 0.4); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = col; for (const d of [-0.16, 0, 0.16]) { ctx.beginPath(); ctx.arc(x + d * s, y - s * 0.04, s * 0.05, 0, M.TAU); ctx.fill(); }
    ctx.restore();
  },
  arrow(ctx, x, y, s, col = '#fff') {
    ctx.save(); stroke(ctx, col, s * 0.12);
    ctx.beginPath(); ctx.moveTo(x - s * 0.3, y); ctx.lineTo(x + s * 0.3, y); ctx.moveTo(x + s * 0.08, y - s * 0.22); ctx.lineTo(x + s * 0.3, y); ctx.lineTo(x + s * 0.08, y + s * 0.22); ctx.stroke(); ctx.restore();
  },
};

// avatar com iniciais
export function avatar(ctx, x, y, r, initials, { bg = C.accSoft, fg = C.acc } = {}) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fillStyle = bg; ctx.fill();
  txt(ctx, initials, x, y + r * 0.36, f(r * 0.9, 700), fg, 'center');
}

// QR code desenhado a partir de uma matriz com semente (decorativo: não é um código legível)
export function qrCode(ctx, x, y, s, { seed = 7, col = C.ink, p = 1 } = {}) {
  const n = 25, c = s / n, r = M.mulberry32(seed);
  ctx.fillStyle = col;
  const finder = (i, j) => (i < 7 && j < 7) || (i >= n - 7 && j < 7) || (i < 7 && j >= n - 7);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = r();
    if (finder(i, j)) continue;
    if (v > 0.52 && (i + j) / (2 * n) <= p) ctx.fillRect(x + i * c, y + j * c, c * 0.92, c * 0.92);
  }
  for (const [i, j] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
    ctx.fillRect(x + i * c, y + j * c, c * 7, c * 7);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + (i + 1) * c, y + (j + 1) * c, c * 5, c * 5);
    ctx.fillStyle = col; ctx.fillRect(x + (i + 2) * c, y + (j + 2) * c, c * 3, c * 3);
  }
}
// visor de leitura com laser varrendo
export function scanner(ctx, t, x, y, s, { t0 = 0, done = 99 } = {}) {
  const L = s * 0.18, lw = s * 0.03;
  ctx.save(); stroke(ctx, done < t ? C.acc : '#fff', lw);
  for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + s, y, -1, 1], [x, y + s, 1, -1], [x + s, y + s, -1, -1]]) {
    ctx.beginPath(); ctx.moveTo(cx, cy + dy * L); ctx.lineTo(cx, cy); ctx.lineTo(cx + dx * L, cy); ctx.stroke();
  }
  if (t > t0 && t < done) {
    const p = (Math.sin((t - t0) * 4) + 1) / 2;
    const ly = y + s * 0.1 + p * s * 0.8;
    const g = ctx.createLinearGradient(0, ly - 30, 0, ly + 30);
    g.addColorStop(0, rgba(C.accHi, 0)); g.addColorStop(0.5, rgba(C.accHi, 0.9)); g.addColorStop(1, rgba(C.accHi, 0));
    ctx.fillStyle = g; ctx.fillRect(x + s * 0.05, ly - 30, s * 0.9, 60);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ transições
// Varredura de luz: uma faixa suave e iridescente cruzando o quadro, alfa por p (0..1). tint: 'marca' | 'branco'
export function lightSweep(ctx, p, { angle = -0.5, width = 0.55, tint = 'marca' } = {}) {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.rotate(angle);
  const span = Math.hypot(W, H);
  const cx = lerp(-span * 0.8, span * 0.8, E.inOutSine(p));
  const bw = span * width;
  const g = ctx.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0);
  const c1 = tint === 'branco' ? '255,255,255' : rgbStr(M.mix('#ffffff', C.acc, 0.28));
  const c2 = rgbStr(M.mix('#ffffff', C.accHi, 0.15));
  g.addColorStop(0, `rgba(${c1},0)`); g.addColorStop(0.35, `rgba(${c1},0.55)`); g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.65, `rgba(${c2},0.55)`); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(-span, -span, span * 2, span * 2);
  ctx.restore();
}
// Anel iridescente que floresce a partir de (x, y)
export function bloomRing(ctx, p, x = W / 2, y = H / 2, { maxR = H * 0.75, a = 1 } = {}) {
  if (p <= 0 || p >= 1) return;
  const r = lerp(60, maxR, E.outCubic(p)), th = lerp(40, 260, p);
  ctx.save(); ctx.globalAlpha = a * Math.sin(Math.PI * p) * 0.9;
  ctx.filter = `blur(${lerp(6, 40, p).toFixed(0)}px)`;
  const g = ctx.createConicGradient(p * 3, x, y);
  const ac = rgba(C.accHi, 0.8), cl = rgba(M.mix('#ffffff', C.acc, 0.25), 0.9);
  g.addColorStop(0, ac); g.addColorStop(0.3, 'rgba(255,255,255,1)'); g.addColorStop(0.55, cl);
  g.addColorStop(0.8, 'rgba(255,248,244,1)'); g.addColorStop(1, ac);
  ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.lineWidth = th; ctx.strokeStyle = g; ctx.stroke();
  ctx.restore();
}
// Fusão com zoom e desfoque entre dois pintores de cena. p 0..1 ao longo da janela da transição.
export function blurZoom(ctx, p, drawA, drawB, { zoomA = 1.18, zoomB = 0.9, blur = 34, key = 'bz' } = {}) {
  const q = E.inOutCubic(p);
  if (q < 1) group(ctx, key + 'A', { a: 1 - E.inQuad(q), blur: q * blur, s: lerp(1, zoomA, E.inCubic(q)) }, drawA);
  if (q > 0) group(ctx, key + 'B', { a: E.outQuad(q), blur: (1 - q) * blur, s: lerp(zoomB, 1, E.outCubic(q)) }, drawB);
}

// ------------------------------------------------------------------ logo e cartão final
// Ícone de app da marca desenhado em código (quando não há imagem de logo): bloco arredondado + inicial.
export function logoMarca(ctx, x, y, s, { a = 1, letra = (MARCA.nome || '?').trim()[0] || '?', glow = 1 } = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.save(); ctx.shadowColor = rgba(C.accDeep, 0.35 * glow); ctx.shadowBlur = s * 0.3; ctx.shadowOffsetY = s * 0.1;
  const g = ctx.createLinearGradient(x, y - s / 2, x, y + s / 2); g.addColorStop(0, C.accHi); g.addColorStop(1, C.accDeep);
  rrect(ctx, x - s / 2, y - s / 2, s, s, s * 0.24); ctx.fillStyle = g; ctx.fill(); ctx.restore();
  rrect(ctx, x - s / 2 + 3, y - s / 2 + 3, s - 6, s * 0.48, s * 0.22); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
  txt(ctx, letra.toUpperCase(), x, y + s * 0.2, fd(s * 0.58, 800), '#fff', 'center');
  ctx.restore();
}
// Cartão final. Textos padrão em MARCA.fim; IMG.logo (se houver) no lugar do ícone desenhado.
export function endCard(ctx, t, t0, IMG = {}, { dark = false, title = MARCA.fim.titulo, sub = MARCA.fim.sub, cta = MARCA.fim.cta, foot = MARCA.fim.rodape, icon = I.arrow, logoSize = 300 } = {}) {
  const k = sp(t, t0, 120, 16);
  const cy = H * 0.34;
  const bl = (1 - clamp(k)) * 22;
  if (IMG.logo) {
    const lh = logoSize * lerp(0.82, 1, k), lw = lh * IMG.logo.width / IMG.logo.height;
    ctx.save(); ctx.globalAlpha = clamp(k * 1.4);
    if (bl > 0.3) ctx.filter = `blur(${bl}px)`;
    ctx.shadowColor = rgba(C.accDeep, dark ? 0.45 : 0.25); ctx.shadowBlur = 80; ctx.shadowOffsetY = 20;
    ctx.drawImage(IMG.logo, W / 2 - lw / 2, cy - lh / 2 - (1 - k) * 50, lw, lh);
    ctx.restore();
  } else {
    ctx.save(); if (bl > 0.3) ctx.filter = `blur(${bl}px)`;
    logoMarca(ctx, W / 2, cy - (1 - k) * 50, logoSize * 0.8 * lerp(0.82, 1, k), { a: clamp(k * 1.4) });
    ctx.restore();
  }
  headline(ctx, t, W_(title), { y: cy + 330, size: 128, weight: 900, t0: t0 + 0.3, color: dark ? '#fff' : C.ink, accent: dark ? C.accHi : C.acc, track: -0.01 });
  const k2 = E.outCubic(pr(t, t0 + 0.65, t0 + 1.15));
  ctx.save(); ctx.globalAlpha = k2;
  txt(ctx, sub, W / 2, cy + 470 + (1 - k2) * 20, f(42, 500), dark ? 'rgba(255,255,255,0.78)' : bgText(C.ink2), 'center');
  ctx.restore();
  const k3 = sp(t, t0 + 1.0, 200, 16);
  if (k3 > 0 && cta) {
    const press = Math.max(0, Math.sin(clamp((t - (t0 + 2.3)) / 0.3) * Math.PI));
    pill(ctx, W / 2, cy + 620 + (1 - k3) * 60, cta, { on: 1, size: 46, a: clamp(k3 * 1.3), sweep: pr(t, t0 + 1.5, t0 + 2.3), press, icon });
  }
  if (foot) {
    const k4 = E.outCubic(pr(t, t0 + 1.35, t0 + 1.85));
    ctx.save(); ctx.globalAlpha = k4 * 0.85;
    txt(ctx, foot, W / 2, cy + 770, f(32, 500), dark ? 'rgba(255,255,255,0.6)' : bgText(C.mute), 'center');
    ctx.restore();
  }
}

// Sequência de PNG (por exemplo o logo 3D do After Effects, ae/logo3d) tocada como um sprite.
// logoSeqImages('../../ae/logo3d/saida', 180, { passo: 2 }) -> { ls0: '.../logo_00000.png', ls1: '.../logo_00002.png', ... }
export function logoSeqImages(pasta, total, { prefixo = 'logo_', digitos = 5, passo = 2 } = {}) {
  const out = {};
  for (let i = 0, j = 0; i < total; i += passo, j++) out['ls' + j] = `${pasta}/${prefixo}${String(i).padStart(digitos, '0')}.png`;
  return out;
}
// Desenha o quadro da sequência que corresponde a (t - t0), centrado em (x, y). fps = quadros/s da sequência JÁ
// reduzida pelo passo (render de 60 fps com passo 2 = 30). Depois do último quadro, mantém o último.
export function logoSeq(ctx, IMG, t, t0, x, y, size = 576, { fps = 30, a = 1 } = {}) {
  if (t < t0 || a <= 0) return;
  let n = 0; while (IMG['ls' + n]) n++;
  if (!n) return;
  const im = IMG['ls' + Math.min(n - 1, Math.floor((t - t0) * fps))];
  ctx.save(); ctx.globalAlpha *= a;
  ctx.drawImage(im, x - size / 2, y - size / 2, size, size * im.height / im.width);
  ctx.restore();
}

// ------------------------------------------------------------------ telas de app desenhadas em código
// Coordenadas dentro de uma tela são normalizadas (0..1): r = [x0, y0, x1, y1].
export const box = (r, x, y, w, h) => [x + r[0] * w, y + r[1] * h, (r[2] - r[0]) * w, (r[3] - r[1]) * h];
export const pt = (nx, ny, x, y, w, h) => [x + nx * w, y + ny * h];

// anel de foco num elemento da tela (o destaque "é este aqui")
export function focusRing(ctx, r, x, y, w, h, a = 1, { radius = 0.025 } = {}) {
  if (a <= 0) return;
  const [X, Y, Wd, Hd] = box(r, x, y, w, h);
  ctx.save(); ctx.globalAlpha *= a;
  ctx.shadowColor = C.accGlow; ctx.shadowBlur = 40;
  rrect(ctx, X - 6, Y - 6, Wd + 12, Hd + 12, w * radius + 6); ctx.lineWidth = 6; ctx.strokeStyle = C.accHi; ctx.stroke();
  ctx.restore();
}
// Moldura de app: fundo, barra de status, cabeçalho em degradê da marca (título + subtítulo) e barra de abas.
// abas: lista de nomes de ícones em I; ativa = índice aceso. Devolve a área útil {x, y, w, h}.
export function chrome(ctx, x, y, w, h, title, { sub = '', tab = true, back = false, abas = ['list', 'calendar', 'bell', 'user'], ativa = 0, fundo = '#F2F0EE' } = {}) {
  const s = w / 400;
  ctx.fillStyle = fundo; ctx.fillRect(x, y, w, h);
  const hh = (sub ? 128 : 108) * s;
  const g = ctx.createLinearGradient(x, y, x + w, y + hh); g.addColorStop(0, C.accHi); g.addColorStop(1, C.accDeep);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, hh);
  statusBar(ctx, x, y, w, { dark: true });
  txt(ctx, title, x + 22 * s, y + 88 * s, fd(28 * s, 800), '#fff');
  if (sub) txt(ctx, sub, x + 22 * s, y + 113 * s, f(13 * s, 500), 'rgba(255,255,255,0.82)');
  if (back) I.arrow(ctx, x + w - 34 * s, y + 80 * s, 26 * s, '#fff');
  let topo = y + hh;
  let base = y + h;
  if (tab) {
    const th = 74 * s;
    base = y + h - th;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 16 * s;
    ctx.fillStyle = '#fff'; ctx.fillRect(x, base, w, th); ctx.restore();
    abas.forEach((ic, i) => {
      const cx = x + (w / abas.length) * (i + 0.5), cy = base + th * 0.42;
      (I[ic] || I.list)(ctx, cx, cy, 26 * s, i === ativa ? C.acc : C.mute);
      if (i === ativa) { ctx.beginPath(); ctx.arc(cx, cy + 22 * s, 2.5 * s, 0, M.TAU); ctx.fillStyle = C.acc; ctx.fill(); }
    });
  }
  return { x, y: topo, w, h: base - topo };
}
// card branco arredondado de app (s = escala da tela, w / 400)
export function appCard(ctx, X, Y, Wd, Hd, s, { outline = false, fill = '#FFFFFF', r = 18 } = {}) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 14 * s; ctx.shadowOffsetY = 4 * s;
  rrect(ctx, X, Y, Wd, Hd, r * s); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  if (outline) { rrect(ctx, X, Y, Wd, Hd, r * s); ctx.lineWidth = 2 * s; ctx.strokeStyle = C.acc; ctx.stroke(); }
}
// texto sendo digitado num campo (p 0..1 = fração digitada), com cursor piscando
export function fieldText(ctx, X, Y, Wd, Hd, str, p = 1, { size = Hd * 0.42, color = C.ink, caret = true, t = 0, weight = 500 } = {}) {
  const n = Math.floor(str.length * clamp(p));
  const s = str.slice(0, n), font = f(size, weight);
  txt(ctx, s, X, Y + Hd / 2 + size * 0.36, font, color);
  if (caret && p > 0 && p < 1.05 && Math.floor(t * 3) % 2 === 0) {
    const cw = measure(ctx, s, font);
    ctx.fillStyle = C.acc; ctx.fillRect(X + cw + 3, Y + Hd * 0.22, Math.max(2, size * 0.08), Hd * 0.56);
  }
}

// Trajeto estilizado num mapa (pontos normalizados) e o ponto ao longo dele (p 0..1).
export function routePath(x, y, w, h, pts = [[0.18, 0.86], [0.22, 0.74], [0.38, 0.70], [0.42, 0.58], [0.62, 0.55], [0.66, 0.42], [0.58, 0.32], [0.74, 0.24], [0.80, 0.18]]) {
  return pts.map(([a, b]) => [x + a * w, y + b * h]);
}
export function along(pts, p) {
  const L = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let r = clamp(p) * tot;
  for (let i = 0; i < L.length; i++) { if (r <= L[i]) { const q = r / L[i]; return { x: lerp(pts[i][0], pts[i + 1][0], q), y: lerp(pts[i][1], pts[i + 1][1], q), i, ang: Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]) }; } r -= L[i]; }
  const n = pts.length - 1; return { x: pts[n][0], y: pts[n][1], i: n - 1, ang: 0 };
}

// ------------------------------------------------------------------ narração (vo.json de scripts/vo_montar.py)
// Cada cena é presa às palavras da narração aprovada, então a imagem segue a voz exatamente.
export async function loadVO(path = 'vo.json') { const r = await fetch(path); return r.json(); }
const normW = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
// início (ou fim) da primeira palavra igual a w a partir do tempo `after`
export function wt(VO, w, { after = 0, end = false, nth = 0 } = {}) {
  const k = normW(w); let n = 0;
  for (const x of VO.words) {
    if (x.t0 + 1e-3 < after) continue;
    if (normW(x.w) === k) { if (n === nth) return end ? x.t1 : x.t0; n++; }
  }
  console.error('wt: palavra não encontrada', w, after);
  return after;
}
// frase i: {t0, t1, texto}
export const ph = (VO, i) => VO.frases[Math.max(0, Math.min(VO.frases.length - 1, i))];
