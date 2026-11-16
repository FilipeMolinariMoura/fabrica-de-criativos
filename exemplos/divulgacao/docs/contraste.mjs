// Contraste WCAG do filme de divulgação: calcula e registra a razão de contraste de cada papel de texto contra
// o que está ATRÁS dele, no pior caso (o ponto mais claro do fundo ao longo do filme inteiro).
//
//   node exemplos/divulgacao/docs/contraste.mjs          (da raiz do repositório)
//
// Reproduz a composição de lib/cena.js (bgCampos: base + meio-tom radial + campos de luz que derivam) e de
// S.vidro (fundo desfocado + fumê + branco). O desfoque só faz médias, então o fundo de um vidro nunca é mais
// claro que o ponto mais claro da região: usar o máximo é conservador. A grade de 8 px é amostrada a cada 24 px,
// a cada 0,25 s, de 0 a 31,8 s. Cores e receitas são as mesmas de index.html (window.MARCA) e film.js (P, GL).
globalThis.location = { search: '?format=9x16' };
const M = await import('../../../lib/motion.js');
const { W, H } = M;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const over = (dst, src, a) => dst.map((d, i) => src[i] * a + d * (1 - a));

const C = {
  base: hex('#08161A'), mid: hex('#0E2A30'), text: hex('#F4F1EC'), text2: hex('#A9C1C4'),
  acc: hex('#FF6B4A'), accHi: hex('#FF8466'), ink: hex('#08161A'), decor: hex('#6F8C90'), white: [255, 255, 255],
};
const CAMPOS = [['#2A9D8F', 0.25], ['#F4A259', 0.12], ['#FF6B4A', 0.08]];
const POS = [[0.32, 0.62, 0.78], [0.88, 0.8, 0.6], [0.1, 0.94, 0.55]];
// alfa de um degradê radial com paradas [pos, alfa] na distância d (raio r)
function stopA(d, r, stops) {
  const q = Math.min(1, d / r);
  for (let i = 1; i < stops.length; i++) if (q <= stops[i][0]) { const [p0, a0] = stops[i - 1], [p1, a1] = stops[i]; return a0 + (a1 - a0) * ((q - p0) / (p1 - p0)); }
  return stops[stops.length - 1][1];
}
// cor do fundo no ponto (x, y) no tempo t (bgCampos com glow 1, cy 0.5)
function bgAt(x, y, t, glow = 1) {
  let c = C.base.slice();
  const my = H * 0.5;
  c = over(c, C.mid, stopA(Math.hypot(x - W / 2, y - my), H * 0.78, [[0, 1], [0.55, 0.55], [1, 0]]));
  CAMPOS.forEach(([h, a], i) => {
    const P = POS[i];
    const fx = (P[0] + 0.07 * M.noise1(t * 0.045, 11 + i)) * W, fy = (P[1] + 0.05 * M.noise1(t * 0.04, 23 + i)) * H;
    const r = P[2] * W * (1 + 0.06 * M.noise1(t * 0.05, 31 + i)), al = a * glow;
    c = over(c, hex(h), stopA(Math.hypot(x - fx, y - fy), r, [[0, al], [0.4, al * 0.55], [0.75, al * 0.14], [1, 0]]));
  });
  return c;
}
// ponto mais claro (luminância) de uma zona ao longo do filme
function brightest(x0, y0, x1, y1, glow = 1.1) {
  let best = null, bl = -1;
  for (let t = 0; t <= 31.8; t += 0.25) for (let y = y0; y <= y1; y += 24) for (let x = x0; x <= x1; x += 24) {
    const c = bgAt(x, y, t, glow), l = L(c); if (l > bl) { bl = l; best = c; }
  }
  return best;
}
const glassOver = (bg, { smoke, tint }) => over(over(bg, C.base, smoke), C.white, tint);
const GL = { panel: { smoke: 0.42, tint: 0.07 }, card: { smoke: 0.3, tint: 0.09 }, chip: { smoke: 0.3, tint: 0.11 } };

const zTitle = brightest(56, 220, W - 56, 660);   // zona dos títulos (sobre o fundo): linhas de base 392..600
const zCta = brightest(200, 700, 800, 832);       // "Criativos" no CTA (coral, y 816)
const zBody = brightest(24, 700, W - 24, 1540);   // zona do conteúdo (atrás dos vidros)
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
const rows = [];
const add = (papel, fg, bgc, alvo, onde) => { const r = ratio(fg, bgc); rows.push([papel, onde, toHex(bgc), r.toFixed(2), alvo, r >= alvo ? 'ok' : 'FALHA']); };
add('título (branco quente #F4F1EC)', C.text, zTitle, 4.5, 'fundo, zona de títulos');
add('palavra-chave coral #FF6B4A', C.acc, zTitle, 4.5, 'fundo, zona de títulos');
add('secundário #A9C1C4', C.text2, zTitle, 4.5, 'fundo, zona de títulos');
add('palavra-chave coral no CTA ("Criativos")', C.acc, zCta, 4.5, 'fundo, CTA y 700-832');
add('karaokê / rótulos #F4F1EC', C.text, zBody, 4.5, 'fundo, zona de conteúdo');
for (const [k, g] of Object.entries(GL)) {
  const b = glassOver(zBody, g);
  add(`texto #F4F1EC no vidro ${k}`, C.text, b, 4.5, `vidro ${k} (pior fundo)`);
  add(`secundário #A9C1C4 no vidro ${k}`, C.text2, b, 4.5, `vidro ${k} (pior fundo)`);
}
add('texto tinta #08161A no coral (chip ativo, botão CTA)', C.ink, C.acc, 4.5, 'preenchimento coral');
add('texto tinta #08161A no coral ativo #FF8466', C.ink, C.accHi, 4.5, 'botão pressionado');
add('textura #6F8C90 no vidro panel (de propósito < 4,5)', C.decor, glassOver(zBody, GL.panel), 2.0, 'vidro panel (só textura)');
add('coral #FF6B4A no vidro card (só >= 70 px ou ícone)', C.acc, glassOver(zBody, GL.card), 3.0, 'vidro card (texto grande)');

console.log(`pior fundo, zona de títulos: ${toHex(zTitle)} (L = ${L(zTitle).toFixed(4)})`);
console.log(`pior fundo, zona de conteúdo: ${toHex(zBody)} (L = ${L(zBody).toFixed(4)})\n`);
console.log('| papel | onde | fundo | contraste | alvo | |');
console.log('|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]}:1 | ${r[4]}:1 | ${r[5]} |`);
