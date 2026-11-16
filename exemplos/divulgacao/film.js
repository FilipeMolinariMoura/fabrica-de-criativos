// Divulgação · Fábrica de Criativos. Anúncio vertical de ~32 s feito com o próprio kit.
//   S1 gancho     "ESSE VÍDEO NÃO FOI EDITADO." sobre uma linha do tempo de editor, que quebra em "editado"
//   S2 virada     corte seco + separação RGB (a única do filme): editor de código, "PROGRAMADO." cai letra a letra
//   S3            a linha do tempo volta pequena: risco em "timeline", o cursor arrasta um clipe e ele é descartado
//   S4            roteiro.json digitado -> forma de onda com karaokê -> palavras na trilha recebendo as cenas
//   S5            três variações REAIS do demo virando em "cor / estilo / voz" + o comando no terminal
//   S6            o demo tocando num celular, contador "60 FPS" e medidor parando em -14 LUFS
//   S7            "Pago" -> "Grátis", R$ 0 e os modelos abertos
//   S8            páginas reais do guia em leque, depois a página real do GitHub num celular
//   S9 CTA        marca, botão "Procure no GitHub", endereço do repositório, selo open source
// Identidade v2: tinta-petróleo com campos de luz, painéis de vidro de verdade (S.vidro), um destaque coral.
// As leis de design aplicadas estão em docs/design.md. Cada cena entra na palavra falada (vo.json via wt2,
// que aceita grafias alternativas porque a voz vai mudar). Tudo é função pura do tempo.
import * as M from '../../lib/motion.js';
import * as S from '../../lib/cena.js';

const { W, H, lerp, clamp, E, TAU } = M;
const { f, fd, txt, pr } = S;

const VO = await S.loadVO();
const GRID = await (await fetch('beats.json')).json();
const CFG = await (await fetch('film.json')).json();
const DUR = Number(CFG.duration || 31.8);
const B = (t) => (t - GRID.offset) / GRID.period;

// ------------------------------------------------------------------ tempos (presos à fala)
// Cada palavra é procurada DEPOIS da anterior (âncoras relativas, não segundos fixos) e aceita grafias
// alternativas: a narração vai trocar de voz (Kokoro com grafia fonética -> Fish Audio com grafia normal).
const w2 = (alts, o) => S.wt2(VO, Array.isArray(alts) ? alts : [alts], o);
const GH = ['github', 'guitirrabi', 'guitirabi', 'gitrabi', 'guithub', 'gitihub'];
const T = {};
T.esse = w2('esse');
T.video = w2(['video'], { after: T.esse });
T.nao = w2('nao', { after: T.video });
T.foi = w2('foi', { after: T.nao });
T.editado = w2('editado', { after: T.foi });
T.ele = w2('ele', { after: T.editado });
T.foi2 = w2('foi', { after: T.ele });
T.programado = w2('programado', { after: T.foi2 });
T.sem = w2('sem', { after: T.programado });
T.timeline = w2(['taimlain', 'timeline', 'taimlaine', 'taimilaine', 'timelaine', 'taimline'], { after: T.sem });
T.sem2 = w2('sem', { after: T.timeline + 0.01 });
T.arrastar = w2(['arrastar', 'arrasta'], { after: T.sem2 });
T.clipe = w2(['clipe', 'clip', 'clippe'], { after: T.arrastar });
T.clipe2 = w2(['clipe', 'clip', 'clippe'], { after: T.clipe + 0.01 });
T.voce = w2('voce', { after: T.clipe2 });
T.escreve = w2('escreve', { after: T.voce });
T.roteiro = w2('roteiro', { after: T.escreve });
T.a = w2(['a', 'ai'], { after: T.roteiro + 0.01 });
T.narra = w2(['narra', 'narrar'], { after: T.a });
T.narraFim = w2(['narra', 'narrar'], { after: T.a, end: true });
T.e1 = w2('e', { after: T.narra + 0.01 });
const TRKW = [['cada'], ['cena'], ['entra'], ['exatamente'], ['na'], ['palavra'], ['falada']];
{ let a = T.e1; TRKW.forEach((alts) => { a = w2(alts, { after: a + 0.01 }); T['_' + alts[0]] = a; }); }
T.cada = T._cada; T.palavra = T._palavra; T.falada = T._falada;
T.outra = w2('outra', { after: T.falada + 0.01 });
T.cor = w2('cor', { after: T.outra });
T.outro = w2('outro', { after: T.cor });
T.estilo = w2('estilo', { after: T.outro });
T.outra2 = w2('outra', { after: T.estilo });
T.voz = w2('voz', { after: T.outra2 });
T.um = w2(['um', '1'], { after: T.voz });
T.so = w2('so', { after: T.um });
T.sessenta = w2(['sessenta', '60'], { after: T.so });
T.audio = w2('audio', { after: T.sessenta });
T.padrao = w2('padrao', { after: T.audio });
T.das = w2(['das', 'da'], { after: T.padrao });
T.e2 = w2('e', { after: T.das + 0.01 });
T.tudo = w2('tudo', { after: T.e2 });
T.graca = w2(['graca', 'gratis'], { after: T.tudo });
T.com = w2('com', { after: T.graca });
T.metodo = w2('metodo', { after: T.com });
T.completo = w2('completo', { after: T.metodo });
T.guia = w2('guia', { after: T.completo });
T.pdf = w2(['pdf', 'pedeefe', 'pedefe', 'pdef'], { after: T.guia });
T.codigo = w2('codigo', { after: T.pdf });
T.aberto = w2('aberto', { after: T.codigo });
T.github = w2(GH, { after: T.aberto });
T.procura = w2(['procura', 'procure'], { after: T.github + 0.01 });
T.fabrica = w2('fabrica', { after: T.procura });
T.criativos = w2('criativos', { after: T.fabrica });
T.github2 = w2(GH, { after: T.criativos });
T.cria = w2(['cria', 'crie'], { after: T.github2 });
T.hoje = w2('hoje', { after: T.cria });
// cortes (s), todos relativos à fala
const CUT = {
  turn: T.ele, s3: T.sem - 0.16, s4a: T.voce - 0.06, s4b: T.a - 0.04, s4c: T.e1 + 0.1, s5: T.outra - 0.19,
  s6: T.sessenta - 0.15, s7: T.e2 - 0.12, s8: T.metodo - 0.1, gh: T.codigo - 0.1, cta: T.procura - 0.04,
};

// ------------------------------------------------------------------ tokens de design (docs/design.md)
const K = S.MARCA.cores;
const P = {
  base: K.escuro, mid: K.escuro2,
  text: K.texto, text2: K.texto2,          // primário (>= 7:1 no vidro) e secundário (>= 4,5:1)
  acc: K.destaque, accHi: K.destaqueClaro,  // coral: palavra-chave, estado ativo, CTA (e nada mais)
  ink: '#08161a',                           // texto sobre coral (6,5:1)
  decor: '#6F8C90', decor2: '#3E5A5E',      // texto-textura (interface de apoio): de propósito com menos contraste
  teal: '#2A9D8F', amber: '#F4A259',
  line: 'rgba(244,241,236,0.10)',
};
// escala tipográfica modular 1,25 (px a 1080 de largura). No máximo 2 tamanhos + 1 rótulo por cena.
const TY = { l: 36, m: 44, b: 56, h4: 70, h3: 88, h2: 110, h1: 138, d1: 172, d2: 216, d3: 270 };
// grade de 8 px e zonas de segurança (topo 220, base 380: nada importante em y < 220 nem y > 1540)
const SAFE = { top: 220, bot: H - 380 };
const Y1 = 432, Y2 = 600;                    // linhas de base dos títulos (1ª e 2ª linha)
const MONO = 'Menlo, Monaco, "Courier New", monospace';
const fm = (s, w = 500) => `${w} ${Math.round(s)}px ${MONO}`;
const DEMO = (n) => `assets/demo/f_${String(n).padStart(3, '0')}.jpg`;

// vidro: três receitas, uma por profundidade (painel de conteúdo, card, chip)
const GL = {
  panel: { r: 32, blur: 30, tint: 0.07, smoke: 0.42 },
  card: { r: 28, blur: 26, tint: 0.09, smoke: 0.3 },
  chip: { blur: 18, tint: 0.11, smoke: 0.3, shadow: 0.3, shadowY: 10, shadowBlur: 28, spec: 0.8, inner: 0.6 },
};
const glass = (g, x, y, w, h, kind = 'card', o = {}) => S.vidro(g, x, y, w, h, { ...GL[kind], ...o });

// ------------------------------------------------------------------ utilitários
function bg(ctx, t, glow = 1, cy = 0.5) { S.bgCampos(ctx, t, { glow, cy }); }
// palavra única, com escala / desfoque / rotação em torno do seu centro
function word(ctx, s, x, y, size, { color = P.text, weight = 800, align = 'center', track = -0.015, a = 1, sc = 1, blur = 0, rot = 0 } = {}) {
  if (a <= 0.003) return 0;
  const font = fd(size, weight), tw = S.measure(ctx, s, font, track * size);
  ctx.save(); ctx.globalAlpha *= a;
  if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
  const cx = align === 'center' ? x : align === 'left' ? x + tw / 2 : x - tw / 2, cy = y - size * 0.35;
  ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
  txt(ctx, s, x, y, font, color, align, track * size);
  ctx.restore();
  return tw;
}
const wid = (ctx, s, size, weight = 800, track = -0.015) => S.measure(ctx, s, fd(size, weight), track * size);
// entrada "slam" (palavra-chave): 1,3 -> 1 com mola pesada (sem passar do ponto), sai acelerando e desfocando
function slam(ctx, t, t0, s, x, y, size, o = {}) {
  if (t < t0) return;
  const k = M.spring(t - t0, { stiffness: 480, damping: 30, mass: 1.1 });
  const out = o.out ?? 99, po = E.inCubic(pr(t, out, out + 0.22));
  word(ctx, s, x, y - po * 32, size, { ...o, a: clamp((t - t0) / 0.05) * (1 - po) * (o.a ?? 1), sc: lerp(1.3, 1, k) + po * 0.05, blur: (1 - clamp(k)) * 8 + po * 16 });
}
// entrada com desfoque subindo (ease-out 380 ms); saída ease-in 220 ms
function rise(ctx, t, t0, s, x, y, size, o = {}) {
  if (t < t0) return;
  const pin = E.outCubic(pr(t, t0, t0 + 0.38)), out = o.out ?? 99, po = E.inCubic(pr(t, out, out + 0.22));
  word(ctx, s, x, y + (1 - pin) * 40 - po * 32, size, { ...o, a: pin * (1 - po) * (o.a ?? 1), blur: (1 - pin) * 16 + po * 16, sc: lerp(1.06, 1, pin) });
}
// linha com palavras que entram cada uma no seu tempo: [[texto, t0, cor?, modo?], ...]
function line(ctx, t, items, y, size, { out = 99, x = W / 2, weight = 800, maxW = W - 112 } = {}) {
  // nunca passa da largura útil (margem de 56 px): se não cabe, desce na escala em vez de vazar
  const full = items.reduce((a, it) => a + wid(ctx, it[0], size, weight), 0) + size * 0.26 * (items.length - 1);
  if (full > maxW) size *= maxW / full;
  const sp = size * 0.26, ws = items.map((it) => wid(ctx, it[0], size, weight));
  let cx = x - (ws.reduce((a, b) => a + b, 0) + sp * (items.length - 1)) / 2;
  items.forEach((it, i) => {
    (it[3] === 'rise' ? rise : slam)(ctx, t, it[1], it[0], cx, y, size, { align: 'left', color: it[2] || P.text, out, weight });
    cx += ws[i] + sp;
  });
}
// barra de janela (três pontos neutros + título): interface de apoio, em cor de textura
function winBar(g, x, y, w, title, { size = 24 } = {}) {
  [0, 1, 2].forEach((i) => { g.beginPath(); g.arc(x + 40 + i * 28, y + 36, 8, 0, TAU); g.fillStyle = 'rgba(244,241,236,0.22)'; g.fill(); });
  txt(g, title, x + w / 2, y + 44, fm(size), P.decor, 'center');
  g.fillStyle = P.line; g.fillRect(x + 16, y + 72, w - 32, 1.5);
}
// código com realce de sintaxe, digitado até n caracteres. É textura: menor, menos contraste, levemente fora de foco.
const COL = { k: P.amber, s: '#9ED9CF', f: P.text, p: P.text2, c: '#5F7A7E' };
function code(g, x, y, lines, n, { size = 32, lh = 52, t = 0, gutter = true, caret = true, a = 0.82, defocus = 0.6 } = {}) {
  const font = fm(size);
  let start = 0, car = null;
  g.save(); g.globalAlpha *= a; if (defocus > 0.3) g.filter = `blur(${defocus}px)`;
  lines.forEach((L, i) => {
    const ly = y + i * lh, len = L.reduce((s, k) => s + k[0].length, 0);
    if (gutter) txt(g, String(i + 1), x, ly, fm(size * 0.75), P.decor2, 'right');
    let vis = clamp(n - start, 0, len), cx = x + (gutter ? 32 : 0);
    if (n >= start && n <= start + len && !car) car = [cx, ly];
    for (const [s, k] of L) {
      if (vis <= 0) break;
      const part = s.slice(0, vis); vis -= part.length;
      txt(g, part, cx, ly, font, COL[k] || COL.p);
      cx += S.measure(g, part, font);
      if (car && car[1] === ly) car[0] = cx;
    }
    start += len + 1;
  });
  g.restore();
  if (caret && car && Math.floor(t * 3.5) % 2 === 0) { g.fillStyle = P.acc; g.fillRect(car[0] + 2, car[1] - size * 0.8, 4, size * 1.0); }
}
const nChars = (lines) => lines.reduce((s, L) => s + L.reduce((a, k) => a + k[0].length, 0) + 1, 0);
// forma de onda decorativa (ruído com semente)
function bars(g, x, y, w, h, t, { col = P.text, step = 12, bw = 6, seed = 1, speed = 1 } = {}) {
  g.fillStyle = col;
  for (let i = 0, xx = x; xx < x + w; i++, xx += step) {
    const v = 0.12 + 0.88 * Math.abs(M.noise1(i * 0.37 + t * 6 * speed, seed)) * (0.55 + 0.45 * Math.abs(M.noise1(i * 0.11 - t * 2, seed + 3)));
    const bh = Math.max(bw, v * h);
    M.rrect(g, xx, y - bh / 2, bw, bh, bw / 2); g.fill();
  }
}
// estrela do GitHub (ícone de linha, familiar)
function star(g, x, y, r, col, lw = 3) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke();
}
function checkDot(g, x, y, r, p) {
  g.beginPath(); g.arc(x, y, r * clamp(p * 3), 0, TAU); g.fillStyle = P.acc; g.fill();
  S.I.check(g, x, y + r * 0.05, r * 1.25, P.ink, clamp(p * 2 - 0.3));
}
// chip de vidro com texto (rótulo): devolve a largura
function glassChip(g, cx, cy, label, { size = TY.m, font = null, h = null, col = P.text, dot = null, on = 0, pad = null, a = 1, src = null } = {}) {
  const fnt = font || f(size, 700), tw = S.measure(g, label, fnt), hh = h || Math.round(size * 2), px = pad ?? size * 0.9;
  const ww = tw + px * 2 + (dot ? size * 0.9 : 0), x = cx - ww / 2, y = cy - hh / 2;
  g.save(); g.globalAlpha *= a;
  glass(g, x, y, ww, hh, 'chip', { r: hh / 2, src });
  if (on > 0.01) { g.save(); g.globalAlpha *= on; M.rrect(g, x, y, ww, hh, hh / 2); g.fillStyle = P.acc; g.fill(); g.restore(); }
  let tx = x + px;
  if (dot) { g.beginPath(); g.arc(tx + size * 0.22, cy, size * 0.17, 0, TAU); g.fillStyle = on > 0.5 ? P.ink : dot; g.fill(); tx += size * 0.9; }
  txt(g, label, tx, cy + size * 0.36, fnt, on > 0.5 ? P.ink : col);
  g.restore();
  return ww;
}
// tremor de câmera nos impactos (amplitude contida: peso, não terremoto)
const SHAKE = [];
function shakeCam(ctx, t) {
  let dx = 0, dy = 0;
  SHAKE.forEach(([t0, a], i) => {
    if (t < t0) return;
    const k = a * 0.6 * Math.exp(-(t - t0) / 0.09);
    if (k > 0.1) { dx += k * M.noise1(t * 55, 3 + i); dy += k * M.noise1(t * 55, 17 + i); }
  });
  ctx.translate(dx, dy);
}
// imagem com cantos arredondados, sombra suave e filete de luz
function framed(g, im, x, y, w, h, { r = 18, edge = 'rgba(244,241,236,0.28)', lw = 1.5, shadow = 0.4 } = {}) {
  g.save(); g.shadowColor = `rgba(0,0,0,${shadow})`; g.shadowBlur = 40; g.shadowOffsetY = 16;
  M.rrect(g, x, y, w, h, r); g.fillStyle = P.base; g.fill(); g.restore();
  g.save(); M.rrect(g, x, y, w, h, r); g.clip(); if (im) g.drawImage(im, x, y, w, h); g.restore();
  M.rrect(g, x + lw / 2, y + lw / 2, w - lw, h - lw, r); g.strokeStyle = edge; g.lineWidth = lw; g.stroke();
}

// ------------------------------------------------------------------ linha do tempo de editor (desenhada em código)
function tlGeo(x, y, w, h) {
  const hh = 64, rh = 40, lab = 80, top = y + hh + rh, bot = y + h - 16, gap = 8, tot = bot - top - gap * 3;
  let yy = top;
  const tracks = [0.2, 0.34, 0.23, 0.23].map((q) => { const r = { y: yy, h: tot * q }; yy += tot * q + gap; return r; });
  return { x, y, w, h, hh, rh, cx: x + lab, cw: w - lab - 16, tracks };
}
const CLIPS = [
  [[0.06, 0.3, 'TÍTULO'], [0.52, 0.8, 'LEGENDA']],
  [[0, 0.245, 50], [0.255, 0.5, 110], [0.51, 0.755, 200], [0.765, 1, 300]],
  [[0, 0.64, 'VO']],
  [[0, 1, 'MÚSICA']],
];
const clipRect = (G, tr, i) => { const c = CLIPS[tr][i], R = G.tracks[tr]; return { x: G.cx + c[0] * G.cw, y: R.y, w: (c[1] - c[0]) * G.cw - 4, h: R.h }; };
function drawClip(g, tr, i, r, IMG) {
  const c = CLIPS[tr][i];
  g.save(); M.rrect(g, r.x, r.y, r.w, r.h, 10); g.clip();
  if (tr === 1) {
    g.fillStyle = '#10262B'; g.fillRect(r.x, r.y, r.w, r.h);
    const th = r.h - 8, tw = th * 0.5625, im = IMG['d' + c[2]];
    for (let xx = r.x + 4; xx < r.x + r.w; xx += tw + 3) if (im) g.drawImage(im, xx, r.y + 4, tw, th);
  } else if (tr === 0) {
    g.fillStyle = 'rgba(244,162,89,0.24)'; g.fillRect(r.x, r.y, r.w, r.h);
    txt(g, c[2], r.x + 14, r.y + r.h / 2 + 8, f(22, 700), '#F6D7B8');
  } else {
    g.fillStyle = tr === 2 ? 'rgba(42,157,143,0.30)' : 'rgba(169,193,196,0.14)'; g.fillRect(r.x, r.y, r.w, r.h);
    bars(g, r.x + 6, r.y + r.h / 2 + 6, r.w - 12, r.h - 30, 0, { col: tr === 2 ? '#8FD3C8' : '#8FA7AA', step: 7, bw: 3, seed: 5 + tr, speed: 0 });
    txt(g, c[2], r.x + 12, r.y + 24, f(18, 700), 'rgba(244,241,236,0.7)');
  }
  g.restore();
  M.rrect(g, r.x + 0.75, r.y + 0.75, r.w - 1.5, r.h - 1.5, 10); g.strokeStyle = 'rgba(244,241,236,0.16)'; g.lineWidth = 1.5; g.stroke();
}
function timeline(g, G, t, IMG, { play = 0.2, skip = [], src = null } = {}) {
  glass(g, G.x, G.y, G.w, G.h, 'panel', { src });
  const fr = Math.floor(play * 12 * 30);
  const tc = `00:00:${String(Math.floor(fr / 30)).padStart(2, '0')}:${String(fr % 30).padStart(2, '0')}`;
  txt(g, tc, G.x + 32, G.y + 44, fm(26, 700), P.text2);
  txt(g, 'Sequência 01', G.x + G.w - 32, G.y + 44, f(22, 600), P.decor, 'right');
  // régua
  const ry = G.y + G.hh;
  g.fillStyle = 'rgba(8,22,26,0.35)'; g.fillRect(G.x + 2, ry, G.w - 4, G.rh);
  g.fillStyle = P.decor2;
  for (let i = 0; i <= 48; i++) { const xx = G.cx + (i / 48) * G.cw; g.fillRect(xx, ry + (i % 4 ? 26 : 14), 1.5, i % 4 ? 12 : 24); }
  for (let i = 0; i <= 12; i += 4) txt(g, `00:${String(i).padStart(2, '0')}`, G.cx + (i / 12) * G.cw + 6, ry + 24, fm(16), P.decor);
  ['V2', 'V1', 'A1', 'A2'].forEach((n, i) => {
    const R = G.tracks[i];
    g.fillStyle = i % 2 ? 'rgba(8,22,26,0.22)' : 'rgba(8,22,26,0.32)'; g.fillRect(G.x + 8, R.y, G.w - 16, R.h);
    txt(g, n, G.x + 28, R.y + R.h / 2 + 8, f(22, 700), P.decor);
    CLIPS[i].forEach((_, j) => { if (!skip.includes(`${i}:${j}`)) drawClip(g, i, j, clipRect(G, i, j), IMG); });
  });
  // agulha (estado ativo)
  const px = G.cx + play * G.cw;
  g.fillStyle = P.acc; g.fillRect(px - 1.5, ry, 3, G.h - G.hh - 12);
  g.beginPath(); g.moveTo(px - 12, ry); g.lineTo(px + 12, ry); g.lineTo(px + 12, ry + 12); g.lineTo(px, ry + 24); g.lineTo(px - 12, ry + 12); g.closePath(); g.fill();
}

// ------------------------------------------------------------------ S1 · gancho
const G1 = tlGeo(64, 904, 952, 560);
const T_SH = T.editado + 0.5;   // a linha do tempo estilhaça
function sceneHook(ctx, t, IMG) {
  bg(ctx, t, 1, 0.55);
  ctx.save(); M.zoomAbout(ctx, 1 + 0.03 * t, W / 2, 1100);
  const play = 0.1 + Math.min(t, T.editado) * 0.15;
  const [lc, lx] = S.layer('tl1');
  timeline(lx, G1, t, IMG, { play, src: ctx.canvas });
  if (t < T_SH) {
    const ge = t >= T.editado ? 1 : 0, fr = Math.floor(t * 30);
    const burst = ge && M.hash01(fr, 11) > 0.35 ? 1 : 0;
    if (burst) {
      // fatias deslocadas (sem fantasmas coloridos: a separação de cor é guardada para a virada)
      const n = 9;
      for (let i = 0; i < n; i++) {
        const y0 = G1.y + (i / n) * G1.h, hh = G1.h / n, dx = (M.hash01(i + fr * 13, 7) - 0.5) * 96 * (M.hash01(i * 5 + fr, 3) > 0.5 ? 1 : 0.15);
        ctx.drawImage(lc, 0, y0, W, hh, dx, y0, W, hh);
      }
    } else ctx.drawImage(lc, 0, 0);
  } else {
    // estilhaços: grade 6 x 4 voando com gravidade (a direção vem do centro: causa e efeito)
    const p = t - T_SH, cols = 6, rows = 4, pw = G1.w / cols, ph = G1.h / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const id = i * rows + j, x0 = G1.x + (i + 0.5) * pw, y0 = G1.y + (j + 0.5) * ph;
      const vx = (x0 - W / 2) * 2.4 + (M.hash01(id, 21) - 0.5) * 600, vy = -350 - M.hash01(id, 22) * 750 + (y0 - 1180) * 1.2;
      const x = x0 + vx * p, y = y0 + vy * p + 0.5 * 4200 * p * p, rot = (M.hash01(id, 23) - 0.5) * 7 * p;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1 - 0.25 * clamp(p * 2), 1 - 0.25 * clamp(p * 2));
      ctx.drawImage(lc, G1.x + i * pw, G1.y + j * ph, pw, ph, -pw / 2, -ph / 2, pw, ph);
      ctx.restore();
    }
  }
  ctx.restore();
  // título: "ESSE VÍDEO" já está no quadro 0 (gancho no primeiro quadro)
  shakeCam(ctx, t);
  const s1 = TY.h1;
  word(ctx, 'ESSE VÍDEO', W / 2, Y1 - 40, s1, { sc: 1 + 0.015 * t });
  const a1 = wid(ctx, 'NÃO', s1), a2 = wid(ctx, 'FOI', s1), gap = s1 * 0.26, x0 = W / 2 - (a1 + gap + a2) / 2;
  const s3 = Math.min(TY.d1, M.fitSize(ctx, 'EDITADO.', 800, S.DISPLAY, 952, TY.d1, -0.015));
  const yb = Y1 - 40 + 152, yc = yb + 200;
  // a frase inteira já está no quadro 0, apagada; cada palavra acende (slam) quando é dita
  if (t < T.nao) word(ctx, 'NÃO', x0, yb, s1, { align: 'left', color: P.text2, a: 0.2 });
  if (t < T.foi) word(ctx, 'FOI', x0 + a1 + gap, yb, s1, { align: 'left', color: P.text2, a: 0.2 });
  if (t < T.editado) word(ctx, 'EDITADO.', W / 2, yc, s3, { color: P.text2, a: 0.2 });
  slam(ctx, t, T.nao, 'NÃO', x0, yb, s1, { align: 'left' });
  slam(ctx, t, T.foi, 'FOI', x0 + a1 + gap, yb, s1, { align: 'left' });
  const fr = Math.floor(t * 30), gl = t > T.editado + 0.2 && t < T_SH + 0.1 && M.hash01(fr, 31) > 0.55;
  slam(ctx, t, T.editado, 'EDITADO.', W / 2 + (gl ? (M.hash01(fr, 32) - 0.5) * 18 : 0), yc, s3, { color: P.acc });
}

// ------------------------------------------------------------------ S2 · virada: programado
const CODE2 = [
  [['// o vídeo é uma função do tempo', 'c']],
  [['import', 'k'], [' * ', 'p'], ['as', 'k'], [' S ', 'p'], ['from', 'k'], [" './lib/cena.js'", 's'], [';', 'p']],
  [],
  [['function', 'k'], [' quadro', 'f'], ['(ctx, t) {', 'p']],
  [['  S.', 'p'], ['bgCampos', 'f'], ['(ctx, t);', 'p']],
  [['  S.', 'p'], ['headline', 'f'], ['(ctx, t, ', 'p'], ["'PROGRAMADO.'", 's'], [');', 'p']],
  [['}', 'p']],
  [],
  [['window', 'f'], ['.seek = (t) => ', 'p'], ['quadro', 'f'], ['(ctx, t);', 'p']],
];
const PRE2 = nChars(CODE2.slice(0, 8)), ALL2 = nChars(CODE2);
function sceneProg(ctx, t) {
  bg(ctx, t, 1, 0.5);
  shakeCam(ctx, t);
  ctx.save(); M.zoomAbout(ctx, 1.06 * (1 / 1.06) ** E.outCubic(pr(t, CUT.turn, CUT.turn + 0.5)) * (1 + 0.03 * pr(t, CUT.turn + 0.5, CUT.turn + 1.8)), W / 2, 1140);
  const X = 40, Y = 816, Wd = 1000, Hd = 632;
  glass(ctx, X, Y, Wd, Hd, 'panel');
  winBar(ctx, X, Y, Wd, 'film.js');
  // a linha executada acende (estado ativo) em "programado"
  const run = pr(t, T.programado - 0.04, T.programado + 0.5);
  if (run > 0) { ctx.save(); ctx.globalAlpha = Math.sin(Math.PI * run) * 0.6 + 0.22 * (run >= 1); ctx.fillStyle = S.rgba(P.acc, 0.4); ctx.fillRect(X + 8, Y + 120 + 8 * 54 - 40, Wd - 16, 54); ctx.restore(); }
  const n = PRE2 + (ALL2 - PRE2) * pr(t, CUT.turn + 0.06, T.programado - 0.08);
  code(ctx, X + 72, Y + 128, CODE2, n, { size: 32, lh: 54, t });
  ctx.restore();
  line(ctx, t, [['ELE', T.ele - 0.05], ['FOI', T.foi2]], Y1 - 40, TY.h1);
  // PROGRAMADO. cai letra a letra (stagger 28 ms, mola com peso)
  const str = 'PROGRAMADO.', size = Math.min(TY.d1, M.fitSize(ctx, str, 800, S.DISPLAY, 980, TY.d1, -0.015)), font = fd(size, 800);
  const L = M.layout(ctx, str, font, -0.015 * size), x0 = W / 2 - L.width / 2, by = Y1 - 40 + 200;
  L.glyphs.forEach((gl, i) => {
    const ti = T.programado + i * 0.028;
    if (t < ti) return;
    const k = M.spring(t - ti, { stiffness: 520, damping: 26, mass: 1.1 });
    ctx.save(); ctx.globalAlpha = clamp((t - ti) / 0.05);
    const bl = (1 - clamp(k)) * 10; if (bl > 0.3) ctx.filter = `blur(${bl.toFixed(1)}px)`;
    M.glyph(ctx, gl.ch, x0 + gl.cx, by - (1 - k) * 160, font, P.acc, lerp(1.5, 1, k), lerp(1.5, 1, k));
    ctx.restore();
  });
}

// ------------------------------------------------------------------ S3 · sem timeline, sem arrastar
const G3 = tlGeo(88, 872, 904, 520);
function sceneSem(ctx, t, IMG) {
  bg(ctx, t, 1, 0.55);
  shakeCam(ctx, t);
  // o painel já está no lugar durante o whip (a faixa nunca fica vazia)
  const ent = M.spring(t - CUT.s3 + 0.2, { stiffness: 170, damping: 22 });
  const dim = E.outCubic(pr(t, T.timeline + 0.05, T.timeline + 0.3));
  ctx.save(); M.zoomAbout(ctx, lerp(0.9, 1, ent), W / 2, 1132);
  const drag = { r: clipRect(G3, 1, 2) }, kill = { r: clipRect(G3, 1, 1) };
  const skip = [];
  if (t >= T.arrastar) skip.push('1:2');
  if (t >= T.clipe2) skip.push('1:1');
  timeline(ctx, G3, t, IMG, { play: 0.18 + (t - CUT.s3) * 0.05, skip });
  if (dim > 0) { ctx.save(); M.rrect(ctx, G3.x, G3.y, G3.w, G3.h, 32); ctx.fillStyle = S.rgba(P.base, 0.32 * dim); ctx.fill(); ctx.restore(); }
  // clipe arrastado: sobe, anda, ganha um X e voa
  const flyClip = (r, tGrab, tX, tFly, dxDrag, key) => {
    const lift = M.spring(t - tGrab, { stiffness: 300, damping: 20 });
    const dx = dxDrag * E.inOutCubic(pr(t, tGrab + 0.05, tX - 0.05));
    const fp = Math.max(0, t - tFly);
    const x = r.x + dx + fp * 900, y = r.y - 18 * lift - fp * 1300 + 0.5 * 3600 * fp * fp * 0.2, rot = fp * 2.4;
    ctx.save(); ctx.translate(x + r.w / 2, y + r.h / 2); ctx.rotate(rot); ctx.scale(1 + 0.06 * lift, 1 + 0.06 * lift); ctx.translate(-(x + r.w / 2), -(y + r.h / 2));
    ctx.globalAlpha = 1 - E.inQuad(clamp(fp * 2.2));
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 40 * lift; ctx.shadowOffsetY = 20 * lift;
    drawClip(ctx, 1, key, { x, y, w: r.w, h: r.h }, IMG);
    ctx.shadowColor = 'transparent';
    // X (descartado): branco quente, traço firme
    const kx = M.spring(t - tX, { stiffness: 560, damping: 26 });
    if (kx > 0) {
      ctx.strokeStyle = P.text; ctx.lineWidth = 10; ctx.lineCap = 'round';
      const cx = x + r.w / 2, cy = y + r.h / 2, s = Math.min(r.w, r.h) * 0.36 * lerp(1.5, 1, kx);
      ctx.beginPath(); ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s); ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s); ctx.stroke();
    }
    ctx.restore();
  };
  if (t >= T.arrastar) flyClip(drag.r, T.arrastar, T.clipe, T.clipe + 0.16, 150, 2);
  if (t >= T.clipe2 - 0.02) flyClip(kill.r, T.clipe2 - 0.02, T.clipe2, T.clipe2 + 0.14, 0, 1);
  // cursor
  const ca = Math.min(E.outCubic(pr(t, T.sem2 - 0.1, T.sem2 + 0.1)), 1 - E.inCubic(pr(t, T.clipe2 + 0.25, T.clipe2 + 0.45)));
  if (ca > 0) {
    const r = drag.r, gx = r.x + r.w * 0.5, gy = r.y + r.h * 0.6;
    const q = E.inOutCubic(pr(t, T.sem2 - 0.1, T.arrastar));
    let cx = lerp(980, gx, q) + Math.sin(q * Math.PI) * 50, cy = lerp(1560, gy, q);
    cx += 150 * E.inOutCubic(pr(t, T.arrastar + 0.05, T.clipe - 0.05));
    cy -= 18 * clamp((t - T.arrastar) * 6);
    const kr = kill.r, q2 = E.inOutCubic(pr(t, T.clipe + 0.1, T.clipe2 - 0.04));
    cx = lerp(cx, kr.x + kr.w * 0.5, q2); cy = lerp(cy, kr.y + kr.h * 0.6, q2);
    const press = t >= T.arrastar && t < T.clipe ? 1 : Math.max(0, Math.sin(clamp((t - T.clipe2 + 0.06) / 0.2) * Math.PI));
    S.ripple(ctx, t, T.arrastar, gx, gy, { r: 80, color: P.accHi });
    S.cursor(ctx, cx, cy, { press, a: ca, scale: 1.5 });
  }
  ctx.restore();
  // texto: 110 + 172 (dois tamanhos)
  const o1 = T.sem2 - 0.08;
  slam(ctx, t, T.sem, 'SEM', W / 2, Y1 - 40, TY.h2, { out: o1 });
  slam(ctx, t, T.timeline, 'TIMELINE', W / 2, Y1 + 168, TY.d1, { out: o1 });
  const sl = E.outCubic(pr(t, T.timeline + 0.08, T.timeline + 0.26)), so = 1 - E.inCubic(pr(t, o1, o1 + 0.22));
  if (sl > 0 && so > 0) {
    const tw = wid(ctx, 'TIMELINE', TY.d1) + 48, x0 = W / 2 - tw / 2, y0 = Y1 + 108;
    ctx.save(); ctx.globalAlpha = so; ctx.translate(W / 2, y0); ctx.rotate(-0.06); ctx.translate(-W / 2, -y0);
    M.rrect(ctx, x0, y0 - 12, tw * sl, 24, 12); ctx.fillStyle = P.acc; ctx.fill(); ctx.restore();
  }
  rise(ctx, t, T.sem2, 'SEM ARRASTAR', W / 2, Y1 - 40, TY.h2);
  rise(ctx, t, T.clipe, 'CLIPE POR CLIPE', W / 2, Y1 + 104, TY.h2, { color: P.acc });
}

// ------------------------------------------------------------------ S4a · roteiro
const CODE4 = [
  [['{', 'p']],
  [['  "falas"', 'k'], [': [', 'p']],
  [['    "Esse vídeo não foi editado."', 's'], [',', 'p']],
  [['    "Ele foi programado."', 's']],
  [['  ],', 'p']],
  [['  "tela"', 'k'], [': ', 'p'], ['"NÃO FOI EDITADO."', 's']],
  [['}', 'p']],
];
const ALL4 = nChars(CODE4);
function sceneRoteiro(ctx, t) {
  bg(ctx, t, 1, 0.6);
  const k = M.spring(t - CUT.s4a + 0.2, { stiffness: 170, damping: 22 });
  const X = 40, Y = 728, Wd = 1000, Hd = 624;
  ctx.save(); ctx.translate(0, (1 - k) * 120); M.zoomAbout(ctx, 1 + 0.03 * pr(t, CUT.s4a, CUT.s4b), W / 2, Y + Hd / 2);
  glass(ctx, X, Y, Wd, Hd, 'panel');
  winBar(ctx, X, Y, Wd, 'roteiro.json');
  const n = 2 + (ALL4 - 2) * pr(t, T.voce + 0.12, T.a - 0.25);
  code(ctx, X + 64, Y + 144, CODE4, n, { size: 32, lh: 66, t });
  ctx.restore();
  rise(ctx, t, T.voce, 'VOCÊ ESCREVE', W / 2, Y1 - 40, TY.h2);
  line(ctx, t, [['O', T.roteiro - 0.02], ['ROTEIRO', T.roteiro, P.acc]], Y1 + 128, TY.h1);
}

// ------------------------------------------------------------------ S4b · a IA narra (forma de onda com karaokê)
const NW = VO.words.filter((w) => w.t0 >= T.a - 0.05 && w.t0 <= T.narra + 0.01);
const WIN = [T.a - 0.12, T.narraFim + 0.12];
function voiceAmp(tw) {
  for (const w of VO.words) {
    if (tw >= w.t0 && tw <= w.t1) {
      const q = (tw - w.t0) / (w.t1 - w.t0);
      return Math.sin(Math.PI * q) ** 0.5 * (0.45 + 0.55 * Math.abs(M.noise1(tw * 38, 5)));
    }
  }
  return 0.05 + 0.04 * Math.abs(M.noise1(tw * 30, 7));
}
function sceneNarra(ctx, t) {
  bg(ctx, t, 1, 0.5);
  shakeCam(ctx, t);
  const X = 56, Y = 704, Wd = 968, Hd = 400, x0 = X + 56, x1 = X + Wd - 56, cy = Y + 232;
  glass(ctx, X, Y, Wd, Hd, 'panel');
  winBar(ctx, X, Y, Wd, 'audio/vo.wav  ·  voz: locutor 1');
  const xOf = (tw) => lerp(x0, x1, (tw - WIN[0]) / (WIN[1] - WIN[0]));
  const step = 13;
  for (let xx = x0; xx <= x1; xx += step) {
    const tw = lerp(WIN[0], WIN[1], (xx - x0) / (x1 - x0));
    // o arquivo inteiro já está carregado (como num editor real): forma de onda por vir em cor de textura
    let h = Math.max(6, voiceAmp(tw) * 240 * 0.55), col = 'rgba(169,193,196,0.26)';
    if (tw <= t) {
      const g = M.spring(t - tw, { stiffness: 420, damping: 22 });
      h = Math.max(6, voiceAmp(tw) * 240 * g);
      const cur = NW.find((w) => tw >= w.t0 && tw <= w.t1 && t >= w.t0 && t <= w.t1 + 0.05);
      col = cur ? P.acc : P.text;
    }
    M.rrect(ctx, xx - 3, cy - h / 2, 6, h, 3); ctx.fillStyle = col; ctx.fill();
  }
  const ph = clamp(t, WIN[0], WIN[1]);
  ctx.fillStyle = P.acc; ctx.fillRect(xOf(ph) - 1.5, Y + 96, 3, Hd - 128);
  // karaokê (rótulo de 56 px): dita = branco, atual = coral, por vir = apagada
  const size = TY.b, font = f(size, 700), spc = size * 0.3, maxW = 904;
  const rows = [[]]; let rw = 0;
  NW.forEach((w) => { const s = w.w.replace(/[.,]/g, ''), ww = S.measure(ctx, s, font); if (rw + ww > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push([s, ww, w]); rw += ww + spc; });
  rows.forEach((R, i) => {
    const tw = R.reduce((a, b) => a + b[1], 0) + spc * (R.length - 1);
    let xx = W / 2 - tw / 2;
    const yy = 1208 + i * 80;
    R.forEach(([s, ww, w]) => {
      const lit = E.outCubic(pr(t, w.t0 - 0.02, w.t0 + 0.08)), cur = t >= w.t0 - 0.02 && t <= w.t1 + 0.05;
      txt(ctx, s, xx, yy, font, cur ? P.acc : M.mix(P.decor2, P.text, lit));
      if (cur) { ctx.fillStyle = P.acc; ctx.fillRect(xx, yy + 16, ww * E.outCubic(pr(t, w.t0, w.t1)), 4); }
      xx += ww + spc;
    });
  });
  rise(ctx, t, T.a, 'A IA', W / 2, Y1 - 40, TY.h2);
  slam(ctx, t, T.narra, 'NARRA', W / 2, Y1 + 128, TY.h1, { color: P.acc });
}

// ------------------------------------------------------------------ S4c · cada cena na palavra falada
const TRK = TRKW.map((alts, i) => ({ w: alts[0], t: T['_' + alts[0]], img: [61, 91, 151, 181, 211, 241, 331][i] }));
const PX = 900, TRK_Y = 1336, TH_W = 208, TH_H = TH_W / 0.5625, TH_Y = 1072;
function scenePalavra(ctx, t, IMG) {
  bg(ctx, t, 1, 0.55);
  shakeCam(ctx, t);
  const hero = TRK[5];
  const PH_X = lerp(120, 304, E.inOutCubic(pr(t, CUT.s4c - 0.17, T.cada)));
  const xOf = (tw) => PH_X + (tw - t) * PX;
  // trilho de vidro (região comum: as palavras da fala moram nele)
  glass(ctx, 24, TRK_Y - 56, W - 48, 112, 'card', { r: 56 });
  const kh = M.spring(t - hero.t - 0.05, { stiffness: 180, damping: 22 });
  // fios e vagas (atrás das miniaturas)
  TRK.forEach((it) => {
    const x = xOf(it.t);
    if (x > W + 40 || x + TH_W < -40) return;
    if (t < it.t) {
      ctx.save(); ctx.setLineDash([12, 12]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(244,241,236,0.2)';
      M.rrect(ctx, x, TH_Y - TH_H / 2, TH_W, TH_H, 16); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(244,241,236,0.12)'; ctx.fillRect(x + 2, TH_Y + TH_H / 2, 2, TRK_Y - 40 - (TH_Y + TH_H / 2));
      ctx.restore();
    }
  });
  TRK.forEach((it) => {
    const x = xOf(it.t), font = f(TY.m, 700), tw = S.measure(ctx, it.w, font) + 48;
    const on = t >= it.t, cur = on && (it === TRK[TRK.length - 1] || t < TRK[TRK.indexOf(it) + 1].t);
    if (x < W + 40 && x + tw > -40) {
      if (cur) { M.rrect(ctx, x, TRK_Y - 36, tw, 72, 36); ctx.fillStyle = P.acc; ctx.fill(); }
      else if (on) { M.rrect(ctx, x, TRK_Y - 36, tw, 72, 36); ctx.fillStyle = 'rgba(244,241,236,0.10)'; ctx.fill(); }
      M.rrect(ctx, x + 0.75, TRK_Y - 35.25, tw - 1.5, 70.5, 35); ctx.strokeStyle = cur ? 'rgba(0,0,0,0)' : 'rgba(244,241,236,0.18)'; ctx.lineWidth = 1.5; ctx.stroke();
      txt(ctx, it.w, x + 24, TRK_Y + 15, font, cur ? P.ink : on ? P.text : P.text2);
    }
    // a cena cai sobre a palavra e pousa no instante em que ela é dita
    if (t < it.t - 0.16) return;
    const fall = E.inQuad(pr(t, it.t - 0.16, it.t));
    let cx = x + TH_W / 2, cy = lerp(TH_Y - 280, TH_Y, fall) + 14 * M.ring(t - it.t, 3, 9);
    let w = TH_W, h = TH_H, a = clamp((t - it.t + 0.16) / 0.06);
    if (it === hero) { cx = lerp(cx, W / 2, kh); cy = lerp(cy, 976, kh); w = lerp(TH_W, 360, kh); h = w / 0.5625; }
    else if (t > hero.t) a *= 1 - 0.7 * clamp(kh);
    if (cx + w / 2 < -40 || cx - w / 2 > W + 40) return;
    ctx.save(); ctx.globalAlpha = a;
    // fio ligando a cena à palavra
    if (it !== hero || kh <= 0) { ctx.fillStyle = on ? S.rgba(P.acc, 0.8) : 'rgba(244,241,236,0.18)'; ctx.fillRect(x + 2, cy + h / 2, 2, Math.max(0, TRK_Y - 36 - (cy + h / 2))); }
    const isHero = it === hero && kh > 0;
    framed(ctx, IMG['d' + it.img], cx - w / 2, cy - h / 2, w, h, { r: 18, edge: isHero ? P.acc : 'rgba(244,241,236,0.28)', lw: isHero ? 4 : 1.5 });
    ctx.restore();
  });
  // agulha fixa (estado ativo)
  ctx.fillStyle = P.acc; ctx.fillRect(PH_X - 1.5, TRK_Y - 72, 3, 144);
  ctx.beginPath(); ctx.moveTo(PH_X - 12, TRK_Y - 72); ctx.lineTo(PH_X + 12, TRK_Y - 72); ctx.lineTo(PH_X, TRK_Y - 56); ctx.closePath(); ctx.fill();
  // a chamada real que prende a cena na palavra (rótulo de vidro)
  const kl = E.outCubic(pr(t, hero.t + 0.12, hero.t + 0.4));
  if (kl > 0) {
    const s = `wt(VO, 'palavra') = ${hero.t.toFixed(2).replace('.', ',')} s`;
    glassChip(ctx, W / 2, 1464 + (1 - kl) * 16, s, { font: fm(TY.l, 700), size: TY.l, h: 80, a: kl });
  }
  rise(ctx, t, CUT.s4c - 0.05, 'CADA CENA', W / 2, Y1 - 40, TY.h2);
  line(ctx, t, [['NA', hero.t - 0.02], ['PALAVRA', hero.t, P.acc]], Y1 + 128, TY.h1);
}

// ------------------------------------------------------------------ S5 · variações reais
const VAR = [['vBase', 'exemplos/demo', -1], ['vEscuro', '--tema escuro', T.cor], ['vImpacto', '--estilo impacto', T.estilo], ['voz', '--voz locutor-2.wav', T.voz]];
// face "voz" do card: a forma de onda troca de voz (locutor 1 riscado -> locutor 2)
function vozFace(ctx, x, y, w, h, t) {
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, P.mid); g.addColorStop(1, P.base);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const kv = M.spring(t - T.voz, { stiffness: 480, damping: 24 });
  bars(ctx, x + 40, y + h / 2, w - 80, lerp(180, 360, clamp(kv)), t, { col: P.text, step: 16, bw: 8, seed: 9, speed: 1.4 });
  const f1 = f(TY.m, 600), cx = x + w / 2, y1 = y + 128, tw = S.measure(ctx, 'locutor 1', f1);
  txt(ctx, 'locutor 1', cx, y1, f1, P.text2, 'center');
  ctx.fillStyle = P.acc; ctx.fillRect(cx - tw / 2 - 8, y1 - 15, (tw + 16) * E.outCubic(pr(t, T.voz, T.voz + 0.15)), 4);
  txt(ctx, 'locutor 2', cx, y + h - 96, f(TY.b, 800), P.text, 'center');
}
function sceneVar(ctx, t, IMG) {
  bg(ctx, t, 1, 0.5);
  shakeCam(ctx, t);
  const tT = T.um - 0.06, up = E.inCubic(pr(t, tT, tT + 0.3));
  // bloco das variações (sai para cima no "Um comando só": ease-in, 300 ms)
  if (up < 1) {
    ctx.save(); ctx.translate(0, -1400 * up); ctx.globalAlpha = 1 - up * 0.5;
    // a troca acontece no meio do giro, e o giro termina na palavra
    let idx = 0; VAR.forEach((v, i) => { if (i && t >= v[2] - 0.11) idx = i; });
    let sx = 1;
    for (const tf of [T.cor, T.estilo, T.voz]) {
      const q = pr(t, tf - 0.22, tf);
      if (q > 0 && q < 1) sx = Math.abs(Math.cos(Math.PI * q));
    }
    const cw = 440, ch = cw / 0.5625, cx = W / 2, cy = 928, bz = 16;
    const ke = M.spring(t - CUT.s5 + 0.2, { stiffness: 180, damping: 20 });
    ctx.save(); ctx.translate(cx, cy); ctx.scale(Math.max(0.02, sx) * lerp(0.85, 1, ke), lerp(0.85, 1, ke)); ctx.translate(-cx, -cy);
    // moldura de vidro em volta da tela (profundidade: vidro no meio, conteúdo na frente)
    glass(ctx, cx - cw / 2 - bz, cy - ch / 2 - bz, cw + bz * 2, ch + bz * 2, 'card', { r: 30 + bz, accent: idx === 3 ? P.acc : null });
    ctx.save(); M.rrect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 30); ctx.clip();
    if (VAR[idx][0] === 'voz') vozFace(ctx, cx - cw / 2, cy - ch / 2, cw, ch, t);
    else { const img = IMG[VAR[idx][0]]; if (img) ctx.drawImage(img, cx - cw / 2, cy - ch / 2, cw, ch); }
    if (sx < 0.98) { ctx.fillStyle = `rgba(0,0,0,${0.5 * (1 - sx)})`; ctx.fillRect(cx - cw / 2, cy - ch / 2, cw, ch); }
    ctx.restore();
    ctx.restore();
    // opção da linha de comando: estado ativo = coral com texto tinta
    const kp = M.spring(t - (idx ? VAR[idx][2] : CUT.s5), { stiffness: 480, damping: 24 });
    const py = 1400;
    ctx.save(); M.zoomAbout(ctx, lerp(1.2, 1, kp), W / 2, py);
    glassChip(ctx, W / 2, py, VAR[idx][1], { font: fm(TY.m, 700), size: TY.m, h: 88, on: idx ? 1 : 0 });
    ctx.restore();
    ctx.restore();
    // palavras: 138 (a palavra-chave em coral)
    line(ctx, t, [['OUTRA', T.outra, P.text2, 'rise'], ['COR', T.cor, P.acc]], Y1 - 8, TY.h1, { out: T.outro - 0.04 });
    line(ctx, t, [['OUTRO', T.outro, P.text2, 'rise'], ['ESTILO', T.estilo, P.acc]], Y1 - 8, TY.h1, { out: T.outra2 - 0.04 });
    line(ctx, t, [['OUTRA', T.outra2, P.text2, 'rise'], ['VOZ', T.voz, P.acc]], Y1 - 8, TY.h1, { out: tT - 0.02 });
  }
  // terminal: um comando só (sobe com mola, ease-out)
  if (up > 0) {
    const ky = M.spring(t - tT, { stiffness: 200, damping: 22 });
    const X = 32, Y = 720, Wd = 1016, Hd = 368;
    ctx.save(); ctx.translate(0, (1 - ky) * 1200);
    // as três variações lado a lado ficam ATRÁS do terminal de vidro: o desfoque mostra o que passa por trás
    const tw3 = 200, th3 = tw3 / 0.5625, gp = 32, x3 = W / 2 - (tw3 * 3 + gp * 2) / 2, y3 = Y + Hd - 72;
    ['vBase', 'vEscuro', 'vImpacto'].forEach((k, i) => {
      const kt = M.spring(t - T.so - 0.12 - i * 0.06, { stiffness: 360, damping: 22 });
      if (kt <= 0) return;
      const xx = x3 + i * (tw3 + gp), yy = lerp(y3 - 60, y3 + 112, kt);
      ctx.save(); ctx.globalAlpha = clamp(kt * 2); M.zoomAbout(ctx, lerp(0.7, 1, kt), xx + tw3 / 2, yy + th3 / 2);
      framed(ctx, IMG[k], xx, yy, tw3, th3, { r: 18 });
      ctx.restore();
    });
    glass(ctx, X, Y, Wd, Hd, 'panel', { tint: 0.06, smoke: 0.34 });
    winBar(ctx, X, Y, Wd, 'zsh');
    const L1 = 'python3 scripts/variante.py', L2 = '  demo escuro --tema escuro', tot = L1.length + L2.length;
    const n = Math.floor(tot * pr(t, T.um, T.so + 0.02));
    const font = fm(40, 700), ly = Y + 144;
    txt(ctx, '$', X + 48, ly, font, P.text2);
    txt(ctx, L1.slice(0, n), X + 88, ly, font, P.text);
    txt(ctx, L2.slice(0, Math.max(0, n - L1.length)), X + 88, ly + 64, font, P.text);
    const done = T.so + 0.1;
    if (t < done && Math.floor(t * 4) % 2 === 0) {
      const cl = n < L1.length ? [X + 88 + S.measure(ctx, L1.slice(0, n), font), ly] : [X + 88 + S.measure(ctx, L2.slice(0, n - L1.length), font), ly + 64];
      ctx.fillStyle = P.acc; ctx.fillRect(cl[0] + 4, cl[1] - 30, 4, 38);
    }
    const ko = pr(t, done + 0.03, done + 0.25);
    if (ko > 0) { checkDot(ctx, X + 64, ly + 152 - 14, 24, ko); txt(ctx, 'ok  demo-escuro', X + 104, ly + 152, font, P.text2); }
    ctx.restore();
    rise(ctx, t, T.um, 'UM COMANDO', W / 2, Y1 - 40, TY.h2);
    slam(ctx, t, T.so, 'SÓ.', W / 2, Y1 + 128, TY.h1, { color: P.acc });
  }
}

// ------------------------------------------------------------------ S6 · 60 fps, -14 LUFS
const PLAY0 = 115, PLAYN = 100;   // trecho contínuo com a interface cheia (sem a transição branca do demo)
function lufs(t) {
  const s = T.audio - 0.1, k = pr(t, s, T.padrao + 0.05);
  const wild = -24 + 9 * M.noise1(t * 7, 3) + 4 * M.noise1(t * 19, 8);
  const calm = -14 + 3.2 * M.ring(t - T.padrao, 2.2, 3.5) + 0.35 * M.noise1(t * 9, 4);
  return lerp(wild, calm, E.inOutCubic(k));
}
function sceneFps(ctx, t, IMG) {
  bg(ctx, t, 1, 0.5);
  shakeCam(ctx, t);
  // contador rolando até 60 (270 + 110: dois tamanhos)
  const T60 = T.sessenta + 0.35, v = lerp(40, 60, E.outCubic(pr(t, T.sessenta, T60)));
  const size = TY.d3, font = fd(size, 800), dw = S.measure(ctx, '0', font) * 0.98, fps = fd(TY.h2, 800), fw = S.measure(ctx, 'FPS', fps);
  const tot = dw * 2 + 24 + fw, x0 = W / 2 - tot / 2, by = 568;
  const kIn = M.spring(t - CUT.s6 + 0.2, { stiffness: 200, damping: 22 });
  ctx.save(); ctx.globalAlpha = clamp(kIn * 1.5); M.zoomAbout(ctx, lerp(1.15, 1, kIn) * (1 + 0.06 * Math.exp(-Math.max(0, t - T60) * 6) * (t > T60)), W / 2, by - 96);
  // odômetro numa camada com máscara de fade em cima e embaixo (sem dígito cortado a seco)
  const [oc, ox] = S.layer('odo'), wy0 = by - size * 0.86, wh = size * 1.02;
  [v / 10, v].forEach((p, col) => {
    const d0 = Math.floor(p + 1e-6), fr = p - d0, cx = x0 + col * dw + dw / 2, step = size * 0.95;
    txt(ox, String(d0 % 10), cx, by - fr * step, font, P.text, 'center');
    if (fr > 0.001) txt(ox, String((d0 + 1) % 10), cx, by + (1 - fr) * step, font, P.text, 'center');
  });
  const mg = ox.createLinearGradient(0, wy0, 0, wy0 + wh);
  mg.addColorStop(0, 'rgba(0,0,0,0)'); mg.addColorStop(0.16, '#000'); mg.addColorStop(0.84, '#000'); mg.addColorStop(1, 'rgba(0,0,0,0)');
  ox.globalCompositeOperation = 'destination-in'; ox.fillStyle = mg; ox.fillRect(0, wy0, W, wh);
  ox.globalCompositeOperation = 'source-over'; ox.clearRect(0, 0, W, wy0); ox.clearRect(0, wy0 + wh, W, H);
  ctx.drawImage(oc, 0, 0);
  txt(ctx, 'FPS', x0 + dw * 2 + 24, by, fps, P.acc);
  ctx.restore();
  // celular tocando o demo (entra da esquerda; já está em cena durante o whip)
  const kp = M.spring(t - CUT.s6 + 0.2, { stiffness: 170, damping: 22 });
  const n = PLAY0 + clamp(Math.floor((t - CUT.s6) * 30), 0, PLAYN - 1);
  S.phone(ctx, 312 - (1 - kp) * 520, 1048, 320, (c, x, y, w, h) => { const im = IMG['d' + n]; if (im) c.drawImage(im, x, y, w, h); }, { tilt: -0.04 * (1 - kp), dark: true });
  // medidor de loudness num card de vidro; as redes moram no rodapé do mesmo card (região comum)
  const X = 560, Y = 704, Wd = 464, Hd = 584, km = M.spring(t - T.audio + 0.25, { stiffness: 190, damping: 22 });
  if (km > 0) {
    ctx.save(); ctx.translate((1 - km) * 480, 0); ctx.globalAlpha = clamp(km * 1.5);
    glass(ctx, X, Y, Wd, Hd, 'card');
    txt(ctx, 'LUFS', X + 40, Y + 72, f(TY.m, 800), P.text);
    txt(ctx, 'integrado', X + Wd - 40, Y + 72, f(24, 600), P.decor, 'right');
    const top = Y + 112, bot = Y + Hd - 168, dbY = (db) => lerp(top, bot, clamp(-db / 36));
    const lv = lufs(t);
    [[X + 48, 0], [X + 128, 0.6]].forEach(([bx, off]) => {
      const l = lv + off * M.noise1(t * 11, 6);
      ctx.fillStyle = 'rgba(8,22,26,0.45)'; M.rrect(ctx, bx, top, 56, bot - top, 12); ctx.fill();
      const g = ctx.createLinearGradient(0, bot, 0, top); g.addColorStop(0, '#2A6F69'); g.addColorStop(0.6, P.text2); g.addColorStop(0.62, P.acc); g.addColorStop(1, P.acc);
      ctx.save(); M.rrect(ctx, bx, top, 56, bot - top, 12); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(bx, dbY(l), 56, bot - dbY(l)); ctx.restore();
    });
    for (const db of [0, -14, -36]) {
      const yy = dbY(db), on = db === -14;
      ctx.fillStyle = on ? P.acc : P.decor2; ctx.fillRect(X + 40, yy - (on ? 1.5 : 0.75), on ? 168 : 152, on ? 3 : 1.5);
      txt(ctx, String(db), X + 224, yy + (on ? 16 : 12), f(on ? TY.m : 32, on ? 800 : 600), on ? P.text : P.decor);
    }
    // rodapé do card: as redes, uma a uma (stagger 80 ms)
    const fy = Y + Hd - 76;
    ctx.fillStyle = P.line; ctx.fillRect(X + 32, Y + Hd - 136, Wd - 64, 1.5);
    const redes = ['Reels', 'TikTok', 'Shorts'], rf = f(36, 700), rw = redes.map((r) => S.measure(ctx, r, rf)), rs = 28;
    let rx = X + Wd / 2 - (rw.reduce((a, b) => a + b, 0) + rs * 2) / 2;
    redes.forEach((r, i) => {
      const ti = T.das + i * 0.08, k = M.spring(t - ti, { stiffness: 420, damping: 22 });
      if (k > 0) { ctx.save(); ctx.globalAlpha *= clamp((t - ti) / 0.06); txt(ctx, r, rx, fy + 12 + (1 - k) * 16, rf, P.text); ctx.restore(); }
      rx += rw[i] + rs;
    });
    ctx.restore();
  }
  // selo PRONTO PRA POSTAR (o benefício): vidro + visto coral
  const kl = M.spring(t - T.padrao, { stiffness: 460, damping: 26 });
  if (kl > 0) {
    ctx.save(); M.zoomAbout(ctx, lerp(1.25, 1, kl), W / 2, 1480); ctx.globalAlpha = clamp((t - T.padrao) / 0.06);
    const s = 'PRONTO PRA POSTAR', font2 = fd(TY.b, 800), tw = S.measure(ctx, s, font2, 1.5) + 160;
    glass(ctx, W / 2 - tw / 2, 1424, tw, 112, 'chip', { r: 56 });
    checkDot(ctx, W / 2 - tw / 2 + 60, 1480, 26, clamp((t - T.padrao) * 3));
    txt(ctx, s, W / 2 - tw / 2 + 104, 1500, font2, P.text, 'left', 1.5);
    ctx.restore();
  }
}

// ------------------------------------------------------------------ S7 · de graça, modelos abertos
const MODELOS = ['Ollama', 'Qwen3-Coder', 'Whisper', 'ffmpeg'];   // Miller: 4, não 6
function sceneGratis(ctx, t) {
  bg(ctx, t, 1, 0.45);
  shakeCam(ctx, t);
  // chave Pago -> Grátis (componente familiar: toggle iOS)
  const kt = M.spring(t - CUT.s7 + 0.2, { stiffness: 190, damping: 22 });
  const flip = M.spring(t - T.graca, { stiffness: 420, damping: 26 });
  // a chave começa grande no centro e sobe quando o R$ 0 entra
  const ku = M.spring(t - T.graca - 0.04, { stiffness: 260, damping: 24 });
  const cx = W / 2, cy = lerp(904, 680, ku), tw = 640, th = 136;
  ctx.save(); ctx.globalAlpha = clamp(kt * 1.5); M.zoomAbout(ctx, lerp(0.88, 1, kt) * lerp(1.25, 1, ku), cx, cy);
  glass(ctx, cx - tw / 2, cy - th / 2, tw, th, 'card', { r: th / 2 });
  const kw = tw / 2 - 12, kx = lerp(cx - tw / 2 + 8, cx + 4, flip);
  M.rrect(ctx, kx, cy - th / 2 + 8, kw, th - 16, (th - 16) / 2);
  ctx.fillStyle = M.mix('#2B4549', P.acc, clamp(flip)); ctx.fill();
  const fl = f(TY.b, 800);
  txt(ctx, 'Pago', cx - tw / 4, cy + 20, fl, M.mix(P.text, P.decor, clamp(flip)), 'center');
  txt(ctx, 'Grátis', cx + tw / 4, cy + 20, fl, M.mix(P.decor, P.ink, clamp(flip)), 'center');
  ctx.restore();
  // cursor toca a chave
  const ca = Math.min(E.outCubic(pr(t, T.tudo - 0.2, T.tudo + 0.1)), 1 - E.inCubic(pr(t, T.graca + 0.3, T.graca + 0.55)));
  if (ca > 0) {
    const q = E.inOutCubic(pr(t, T.tudo - 0.2, T.graca - 0.06)), tx = cx + (tw / 4) * lerp(1.25, 1, ku) * lerp(0.88, 1, kt), ty = cy + 20;
    const press = Math.max(0, Math.sin(clamp((t - T.graca + 0.08) / 0.22) * Math.PI));
    S.ripple(ctx, t, T.graca - 0.02, tx, ty, { r: 110, color: P.accHi });
    S.cursor(ctx, lerp(960, tx, q) + Math.sin(q * Math.PI) * 40, lerp(1250, ty, q), { press, a: ca, scale: 1.5 });
  }
  // R$ 0 (110 + 270)
  const t0 = T.graca + 0.06;
  if (t >= t0) {
    const k = M.spring(t - t0, { stiffness: 480, damping: 28, mass: 1.1 });
    const f1 = fd(TY.h2, 800), f2 = fd(TY.d3, 800), w1 = S.measure(ctx, 'R$', f1), w2 = S.measure(ctx, '0', f2), x0 = W / 2 - (w1 + 24 + w2) / 2, by = 1096;
    ctx.save(); ctx.globalAlpha = clamp((t - t0) / 0.05); M.zoomAbout(ctx, lerp(1.3, 1, k), W / 2, by - 104);
    const bl = (1 - clamp(k)) * 8; if (bl > 0.3) ctx.filter = `blur(${bl.toFixed(1)}px)`;
    txt(ctx, 'R$', x0, by, f1, P.text2); txt(ctx, '0', x0 + w1 + 24, by, f2, P.text);
    ctx.restore();
  }
  // modelos abertos (4, em grade 2 x 2, chips de vidro)
  MODELOS.forEach((m, i) => {
    const ti = T.com + i * 0.17, k = M.spring(t - ti, { stiffness: 420, damping: 22 });
    if (k <= 0) return;
    const col = i % 2, row = Math.floor(i / 2), x = col ? 784 : 296, y = 1248 + row * 136;
    ctx.save(); ctx.globalAlpha = clamp((t - ti) / 0.06); ctx.translate(0, (1 - k) * 32);
    glass(ctx, x - 224, y - 52, 448, 104, 'chip', { r: 52 });
    txt(ctx, m, x, y + 20, f(TY.b, 700), P.text, 'center');
    ctx.restore();
  });
  rise(ctx, t, CUT.s7 - 0.12, 'DÁ PRA FAZER', W / 2, Y1 - 40, TY.h2, { out: T.tudo - 0.12 });
  line(ctx, t, [['TUDO', T.tudo, P.text, 'rise'], ['DE', T.graca - 0.06], ['GRAÇA', T.graca, P.acc]], Y1 - 40, TY.h2);
}

// ------------------------------------------------------------------ S8 · guia em PDF e GitHub
const PAGES = [['p01', -0.42], ['p02', -0.22], ['p10', 0.22], ['p15', 0.42], ['p04', 0]];
let GHC = null;   // página do GitHub sem a linha de contadores (montada uma vez no init)
const GH_SL = [[0, 600], [740, 1975], [2070, 2796]];
function buildGH(IMG) {
  const im = IMG.gh; if (!im) return;
  const h = GH_SL.reduce((s, [a, b]) => s + b - a, 0);
  GHC = document.createElement('canvas'); GHC.width = 1290; GHC.height = h;
  const g = GHC.getContext('2d'); g.fillStyle = '#0D1117'; g.fillRect(0, 0, 1290, h);
  let y = 0; for (const [a, b] of GH_SL) { g.drawImage(im, 0, a, 1290, b - a, 0, y, 1290, b - a); y += b - a; }
}
function ghScreen(c, x, y, w, h, t) {
  c.fillStyle = '#0D1117'; c.fillRect(x, y, w, h);
  if (!GHC) return;
  const sc = w / 1290;
  // chaves de câmera dentro da tela: topo inteiro -> nome do repositório -> tópicos
  const K2 = [[T.codigo + 0.2, 1, 645, (h / 2) / sc], [T.aberto, 1.85, 370, 545], [T.github + 0.3, 1.12, 645, 1250]];
  let z = K2[0][1], fx = K2[0][2], fy = K2[0][3];
  for (let i = 1; i < K2.length; i++) {
    const p = E.inOutCubic(pr(t, K2[i - 1][0], K2[i][0]));
    if (p <= 0) break;
    z = K2[i - 1][1] * (K2[i][1] / K2[i - 1][1]) ** p; fx = lerp(K2[i - 1][2], K2[i][2], p); fy = lerp(K2[i - 1][3], K2[i][3], p);
  }
  c.save(); c.translate(x + w / 2, y + h / 2); c.scale(sc * z, sc * z); c.translate(-fx, -fy);
  c.drawImage(GHC, 0, 0);
  // anéis de foco (estado ativo): nome do repositório e tópicos
  const ring = (r, t0) => {
    const a = Math.min(E.outCubic(pr(t, t0, t0 + 0.2)), 1);
    if (a <= 0) return;
    c.save(); c.globalAlpha = a; c.strokeStyle = P.acc; c.lineWidth = 8; M.rrect(c, r[0], r[1], r[2] * lerp(0.6, 1, a), r[3], 22); c.stroke(); c.restore();
  };
  ring([28, 492, 760, 110], T.aberto + 0.1);
  ring([28, 1160, 1236, 380], T.github + 0.25);
  c.restore();
}
function sceneAberto(ctx, t, IMG) {
  bg(ctx, t, 1, 0.5);
  shakeCam(ctx, t);
  const push = (1.12) ** E.inCubic(pr(t, CUT.cta - 0.35, CUT.cta));
  ctx.save(); M.zoomAbout(ctx, push, W / 2, 1000);
  // leque de páginas: na saída ele RECUA (escala, desfoque, some) no lugar, atrás do celular que sobe.
  // Nunca atravessa a zona do título.
  const out = E.inCubic(pr(t, CUT.gh - 0.05, CUT.gh + 0.35));
  if (out < 1) {
    const pcx = W / 2, pcy = 1000;
    ctx.save(); ctx.globalAlpha = 1 - out; M.zoomAbout(ctx, lerp(1, 0.8, out), pcx, pcy + 120); ctx.translate(0, 80 * out);
    if (out > 0.02) ctx.filter = `blur(${(14 * out).toFixed(1)}px)`;
    const pw = 456, phh = pw * 1287 / 909, pivY = pcy + phh / 2;
    PAGES.forEach(([k, ang], i) => {
      const kf = M.spring(t - T.completo - i * 0.06, { stiffness: 200, damping: 20 });
      if (kf <= 0) return;
      ctx.save(); ctx.translate(pcx, pivY); ctx.rotate(ang * kf); ctx.translate(0, -12 * kf - (ang === 0 ? 56 * kf : 0)); ctx.scale(0.88, 0.88);
      ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 48; ctx.shadowOffsetY = 20;
      ctx.fillStyle = '#fff'; ctx.fillRect(-pw / 2, -phh, pw, phh); ctx.shadowColor = 'transparent';
      if (IMG[k]) ctx.drawImage(IMG[k], -pw / 2, -phh, pw, phh);
      ctx.fillStyle = S.rgba(P.base, 0.3 * kf); ctx.fillRect(-pw / 2, -phh, pw, phh);
      ctx.restore();
    });
    const kc = M.spring(t - CUT.s8 - 0.1, { stiffness: 260, damping: 24 });
    ctx.save(); M.zoomAbout(ctx, lerp(1.25, 1, kc), pcx, pcy); ctx.globalAlpha *= clamp(kc * 2);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 56; ctx.shadowOffsetY = 24;
    ctx.fillStyle = P.base; ctx.fillRect(pcx - pw / 2, pcy - phh / 2, pw, phh); ctx.shadowColor = 'transparent';
    if (IMG.p00) ctx.drawImage(IMG.p00, pcx - pw / 2, pcy - phh / 2, pw, phh);
    ctx.restore();
    // selo PDF: chip de vidro sobre a capa (a palavra-chave coral fica no título)
    const kb = M.spring(t - T.pdf, { stiffness: 520, damping: 24 });
    if (kb > 0) {
      const bx = pcx + pw / 2 - 48, byy = pcy - phh / 2 + 48;
      ctx.save(); ctx.translate(bx, byy); ctx.rotate(-0.1); ctx.scale(lerp(1.8, 1, kb), lerp(1.8, 1, kb)); ctx.globalAlpha *= clamp((t - T.pdf) / 0.05);
      glass(ctx, -104, -52, 208, 104, 'chip', { r: 28 });
      txt(ctx, 'PDF', 0, 22, fd(TY.b, 800), P.text, 'center');
      ctx.restore();
    }
    ctx.restore();
  }
  // celular com a página real do GitHub
  const kg = M.spring(t - CUT.gh, { stiffness: 160, damping: 22 });
  if (kg > 0) {
    const py = lerp(2700, 1064, kg);
    S.phone(ctx, W / 2, py, 420, (c, x, y, w, h) => ghScreen(c, x, y, w, h, t), { dark: true, tilt: 0.05 * (1 - kg) });
  }
  ctx.restore();
  // títulos (110: um tamanho só, o destaque é a cor)
  const o1 = T.guia - 0.06, o2 = Math.min(CUT.gh, T.codigo - 0.26);   // um título sai antes do outro entrar
  rise(ctx, t, T.metodo, 'MÉTODO', W / 2, Y1 - 40, TY.h2, { out: o1 });
  rise(ctx, t, T.completo, 'COMPLETO', W / 2, Y1 + 88, TY.h2, { out: o1 });
  line(ctx, t, [['GUIA', T.guia, P.text, 'rise'], ['EM', T.guia + 0.08, P.text, 'rise'], ['PDF', T.pdf, P.acc]], Y1 - 40, TY.h2, { out: o2 });
  line(ctx, t, [['CÓDIGO', T.codigo, P.text, 'rise'], ['ABERTO', T.aberto, P.acc]], Y1 - 40, TY.h2, { out: CUT.cta - 0.2 });
  line(ctx, t, [['NO', T.github - 0.08, P.text2, 'rise'], ['GITHUB', T.github, P.text2, 'rise']], Y1 + 88, TY.h2, { out: CUT.cta - 0.2 });
}

// ------------------------------------------------------------------ S9 · CTA
// coluna do CTA um pouco à esquerda: o trilho de ícones do Reels/TikTok (curtir, comentar...) ocupa x > ~920
const CX = 496;
function logoTile(ctx, x, y, s, a = 1) {
  // ícone da marca: ladrilho de vidro com o "F" coral (marca, não texto corrido)
  ctx.save(); ctx.globalAlpha *= a;
  glass(ctx, x - s / 2, y - s / 2, s, s, 'card', { r: s * 0.26, tint: 0.12, smoke: 0.2 });
  txt(ctx, 'F', x, y + s * 0.21, fd(s * 0.6, 800), P.acc, 'center');
  ctx.restore();
}
function sceneCTA(ctx, t) {
  bg(ctx, t, 1.1, 0.42);
  shakeCam(ctx, t);
  ctx.save(); M.zoomAbout(ctx, 1.03 ** E.inOutSine(pr(t, CUT.cta, DUR)), CX, 900);
  // o logo já lê no quadro do corte
  const kl = M.spring(t - CUT.cta + 0.04, { stiffness: 320, damping: 26 });
  ctx.save(); const bl = (1 - clamp(kl)) * 6; if (bl > 0.3) ctx.filter = `blur(${bl.toFixed(1)}px)`;
  logoTile(ctx, CX, 432 - (1 - kl) * 40, 192 * lerp(0.8, 1, kl), 1);
  ctx.restore();
  // marca: 110 (um tamanho), "Criativos" é a palavra-chave
  rise(ctx, t, T.fabrica - 0.04, 'Fábrica de', CX, 688, TY.h2, { weight: 800 });
  slam(ctx, t, T.criativos, 'Criativos', CX, 816, TY.h2, { color: P.acc });
  // o CTA: um único botão, grande (Fitts), dentro de um card de vidro com o endereço (região comum)
  const kc = M.spring(t - CUT.cta + 0.02, { stiffness: 240, damping: 24 });
  if (kc > 0) {
    const cw = 832, chh = 336, x0 = CX - cw / 2, y0 = 904 + (1 - kc) * 48;
    ctx.save(); ctx.globalAlpha *= clamp(kc * 1.6);
    glass(ctx, x0, y0, cw, chh, 'card', { r: 40 });
    // botão coral (estado ativo / CTA): texto tinta 6,5:1
    const press = Math.max(0, Math.sin(clamp((t - T.github2 + 0.12) / 0.26) * Math.PI));
    const bx = x0 + 32, by = y0 + 32, bw = cw - 64, bh = 120;
    ctx.save(); M.zoomAbout(ctx, 1 - 0.035 * press, CX, by + bh / 2);
    ctx.save(); ctx.shadowColor = S.rgba(P.acc, 0.28); ctx.shadowBlur = 32; ctx.shadowOffsetY = 12;
    M.rrect(ctx, bx, by, bw, bh, bh / 2); ctx.fillStyle = M.mix(P.acc, P.accHi, press); ctx.fill(); ctx.restore();
    const bf = f(TY.b, 800), bt = 'Procure no GitHub', btw = S.measure(ctx, bt, bf);
    txt(ctx, bt, CX - 28, by + bh / 2 + 20, bf, P.ink, 'center');
    S.I.arrow(ctx, CX - 28 + btw / 2 + 44, by + bh / 2, 44, P.ink);
    // reflexo especular passando no botão uma vez (o vidro/verniz reage à luz; não é varredura de tela)
    const sw = pr(t, T.github2 + 0.5, T.github2 + 1.2);
    if (sw > 0 && sw < 1) {
      ctx.save(); M.rrect(ctx, bx, by, bw, bh, bh / 2); ctx.clip();
      const sx = lerp(bx - 160, bx + bw + 160, E.inOutSine(sw)), g = ctx.createLinearGradient(sx - 120, 0, sx + 120, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.28)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(bx, by, bw, bh); ctx.restore();
    }
    ctx.restore();
    // endereço do repositório (entra em "GitHub")
    const ku = E.outCubic(pr(t, CUT.cta + 0.2, CUT.cta + 0.55));   // o endereço fica legível o CTA inteiro (~5 s)
    ctx.save(); ctx.globalAlpha *= ku;
    const l1 = 'github.com/FilipeMolinariMoura/';
    txt(ctx, l1, CX, y0 + 216 + (1 - ku) * 12, f(TY.l, 600), P.text2, 'center');
    txt(ctx, 'fabrica-de-criativos', CX, y0 + 288 + (1 - ku) * 12, f(TY.b, 800), P.text, 'center');
    ctx.restore();
    ctx.restore();
  }
  // selo open source (chip de vidro, rótulo 36) + estrela do GitHub
  const kb = M.spring(t - T.cria, { stiffness: 320, damping: 22 });
  if (kb > 0) {
    const s = 'Open source · 100% grátis', font = f(TY.l, 700), tw = S.measure(ctx, s, font) + 136, by = 1336;
    ctx.save(); ctx.globalAlpha *= clamp(kb * 1.6); ctx.translate(0, (1 - kb) * 24);
    glass(ctx, CX - tw / 2, by - 40, tw, 80, 'chip', { r: 40 });
    const pulse = t > T.hoje ? 1 + 0.14 * Math.max(0, Math.sin((t - T.hoje) * 7)) * Math.exp(-(t - T.hoje) * 1.2) : 1;
    ctx.save(); M.zoomAbout(ctx, pulse, CX - tw / 2 + 52, by); star(ctx, CX - tw / 2 + 52, by, 20, P.text, 3); ctx.restore();
    txt(ctx, s, CX - tw / 2 + 92, by + 13, font, P.text);
    ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ montagem
const SCENES = [[0, sceneHook], [CUT.turn, sceneProg], [CUT.s3, sceneSem], [CUT.s4a, sceneRoteiro], [CUT.s4b, sceneNarra],
  [CUT.s4c, scenePalavra], [CUT.s5, sceneVar], [CUT.s6, sceneFps], [CUT.s7, sceneGratis], [CUT.s8, sceneAberto], [CUT.cta, sceneCTA]];
const sceneIdx = (t) => { let i = 0; SCENES.forEach(([t0], j) => { if (t >= t0) i = j; }); return i; };
const TR = [[CUT.s3, 'whip', [-1, 0]], [CUT.s4a, 'whip', [-1, 0]], [CUT.s4b, 'whip', [-1, 0]], [CUT.s4c, 'whip', [-1, 0]],
  [CUT.s5, 'bz'], [CUT.s6, 'whip', [-1, 0]], [CUT.s7, 'whip', [0, -1]], [CUT.s8, 'bz']];
const WIN_TR = (tc, kind) => (kind === 'whip' ? [tc - 0.17, tc + 0.13] : [tc - 0.2, tc + 0.2]);
// whip: os dois planos inteiros na tela (A sai enquanto B entra), com rastro direcional curto
function whip(ctx, p, drawA, drawB, dir) {
  const q = p < 0.5 ? 16 * p ** 5 : 1 - (-2 * p + 2) ** 5 / 2, v = Math.sin(Math.PI * p) ** 2;
  const [ca, xa] = S.layer('wA'); drawA(xa);
  const [cb, xb] = S.layer('wB'); drawB(xb);
  const [cc, xc] = S.layer('wC');
  xc.drawImage(ca, dir[0] * W * q, dir[1] * H * q); xc.drawImage(cb, dir[0] * W * (q - 1), dir[1] * H * (q - 1));
  const n = 4, Lm = 36 * v;
  for (let k = 0; k < n; k++) { const o = (k / (n - 1) - 0.5) * Lm; ctx.globalAlpha = 1 / (k + 1); ctx.drawImage(cc, dir[0] * o, dir[1] * o); }
  ctx.globalAlpha = 1;
}
// a única separação de cor do filme: na virada (~2,22 s)
function rgbSplit(ctx, draw, amt, t) {
  const [src, sx] = S.layer('gS'); draw(sx);
  const [sl, sl2] = S.layer('gL'); sl2.drawImage(src, 0, 0);
  const n = 16, fr = Math.floor(t * 30);
  for (let i = 0; i < n; i++) {
    const y0 = (i / n) * H, hh = H / n, on = M.hash01(i * 7 + fr, 9) > 0.55 ? 1 : 0;
    if (on) sl2.drawImage(src, 0, y0, W, hh, (M.hash01(i + fr * 31, 5) - 0.5) * amt * 4, y0, W, hh);
  }
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
  [['#ff0000', -amt, 0], ['#00ff00', 0, 0], ['#0000ff', amt, amt * 0.3]].forEach(([col, dx, dy], j) => {
    const [c, x] = S.layer('gC' + j); x.drawImage(sl, 0, 0); x.globalCompositeOperation = 'multiply'; x.fillStyle = col; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
    ctx.drawImage(c, dx, dy);
  });
  ctx.restore();
}
const scene = (i) => (c, t, IMG) => { c.fillStyle = P.base; c.fillRect(0, 0, W, H); c.save(); SCENES[i][1](c, t, IMG); c.restore(); };
// selo fixo com o benefício (de S3 até S7), por cima das cenas e dos whips: chip de vidro que refrata o que passa
function seloGratis(ctx, t) {
  const a0 = CUT.s3 + 0.15, k = M.spring(t - a0, { stiffness: 380, damping: 24 }), out = E.inCubic(pr(t, CUT.s7 - 0.2, CUT.s7));
  if (k <= 0 || out >= 1) return;
  ctx.save(); ctx.globalAlpha = clamp((t - a0) / 0.08) * (1 - out); M.zoomAbout(ctx, lerp(0.7, 1, k), W / 2, 256);
  const s = 'GRÁTIS · OPEN SOURCE', font = f(TY.l, 800), tw = S.measure(ctx, s, font, 1.5) + 104;
  glass(ctx, W / 2 - tw / 2, 220, tw, 72, 'chip', { r: 32, shadowY: 8, shadowBlur: 24 });
  S.I.check(ctx, W / 2 - tw / 2 + 40, 256, 30, P.text, 1);
  txt(ctx, s, W / 2 - tw / 2 + 68, 256 + 13, font, P.text, 'left', 1.5);
  ctx.restore();
}
function draw(ctx, u, t, IMG) { drawBody(ctx, u, t, IMG); seloGratis(ctx, t); }
function drawBody(ctx, u, t, IMG) {
  for (const [tc, kind, dir] of TR) {
    const [a, b] = WIN_TR(tc, kind);
    if (t >= a && t < b) {
      const p = (t - a) / (b - a), ib = SCENES.findIndex(([t0]) => t0 === tc);
      const dA = (x) => scene(ib - 1)(x, t, IMG), dB = (x) => scene(ib)(x, t, IMG);
      if (kind === 'whip') whip(ctx, p, dA, dB, dir);
      else S.blurZoom(ctx, p, dA, dB, { key: 'bz' + tc.toFixed(2), blur: 30 });
      return;
    }
  }
  const i = sceneIdx(t);
  // virada: corte seco com separação RGB (um dos dois momentos estruturais do filme)
  if (i === 1 && t < CUT.turn + 0.22) {
    const p = pr(t, CUT.turn, CUT.turn + 0.22);
    rgbSplit(ctx, (x) => scene(1)(x, t, IMG), 16 * (1 - p) ** 1.5, t);
    return;
  }
  scene(i)(ctx, t, IMG);
  // CTA: o segundo momento estrutural, só um respiro de luz quente (sem flash branco)
  if (i === SCENES.length - 1 && t < CUT.cta + 0.2) {
    const p = pr(t, CUT.cta, CUT.cta + 0.2);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(244,241,236,${0.12 * (1 - p) ** 3})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
}
SHAKE.push([T.nao, 9], [T.foi, 11], [T.editado, 24], [T.programado, 14], [T.timeline + 0.08, 9], [T.palavra, 9], [T.cor, 12], [T.estilo, 12],
  [T.voz, 10], [T.so, 9], [T.graca + 0.06, 16], [T.pdf, 10], [CUT.cta, 16]);

// ------------------------------------------------------------------ acentos sonoros (sfx.mjs)
const HS = [
  [T.esse, 'esse', 'tick', { gain: 0.5 }],
  [T.nao, 'NÃO', 'thud', { gain: 0.55 }], [T.foi, 'FOI', 'thud', { gain: 0.6 }],
  [T.editado, 'EDITADO', 'impact', { gain: 0.55 }],
  [T.editado + 0.2, 'glitch', 'click', { gain: 0.35 }], [T.editado + 0.35, 'glitch', 'click', { gain: 0.3 }],
  [T_SH, 'estilhaça', 'crash', { len: 0.7, gain: 0.3 }], [T_SH + 0.02, 'estilhaça', 'whoosh', { len: 0.4, from: 2500, to: 600 }],
  [CUT.turn - 0.01, 'virada', 'swell', { len: 0.5 }], [CUT.turn, 'drop', 'sub', { len: 0.9 }], [CUT.turn + 0.02, 'glitch', 'click', { gain: 0.45 }],
  [CUT.turn + 0.06, 'digita', 'type', { len: 0.7 }],
  [T.programado, 'PROGRAMADO', 'impact', { gain: 0.6 }],
  [CUT.s3, 'whip', 'whoosh', { len: 0.35 }], [CUT.s3 + 0.15, 'selo grátis', 'blip', { pitch: 'G5', gain: 0.18 }],
  [T.sem, 'SEM', 'thud', { gain: 0.4 }], [T.timeline + 0.08, 'risco', 'whoosh', { len: 0.25, from: 1800, to: 6000, gain: 0.35 }], [T.timeline + 0.1, 'risco', 'thud', { gain: 0.45 }],
  [T.arrastar, 'pega o clipe', 'click'], [T.clipe, 'X', 'pop', { pitch: 'A4', to: 'A3' }], [T.clipe + 0.16, 'clipe voa', 'whoosh', { len: 0.3, from: 600, to: 3000, gain: 0.25 }],
  [T.clipe2, 'X', 'pop', { pitch: 'F4', to: 'F3' }],
  [CUT.s4a, 'whip', 'whoosh', { len: 0.35 }], [T.escreve, 'digita roteiro', 'type', { len: 0.85 }], [T.roteiro, 'ROTEIRO', 'thud', { gain: 0.45 }],
  [CUT.s4b, 'whip', 'whoosh', { len: 0.35, from: 500, to: 2500 }], [T.narra, 'NARRA', 'thud', { gain: 0.5 }], [T.narra + 0.02, 'narra', 'bell', { pitch: 'E6', gain: 0.25 }],
  [CUT.s4c, 'whip', 'whoosh', { len: 0.35 }],
  ...TRK.filter((x) => x.w !== 'palavra').map((x) => [x.t, 'cena pousa', 'tick', { gain: 0.5 }]),
  [T.palavra, 'PALAVRA', 'thud', { gain: 0.6 }], [T.palavra + 0.02, 'palavra', 'bell', { pitch: 'A6', gain: 0.3 }],
  [CUT.s5, 'zoom', 'whoosh', { len: 0.45 }],
  [T.cor - 0.05, 'gira', 'whoosh', { len: 0.2, from: 1200, to: 4000, gain: 0.2 }], [T.cor, 'COR', 'thud', { gain: 0.65 }],
  [T.estilo - 0.05, 'gira', 'whoosh', { len: 0.2, from: 1200, to: 4000, gain: 0.2 }], [T.estilo, 'ESTILO', 'thud', { gain: 0.65 }],
  [T.voz, 'VOZ', 'thud', { gain: 0.65 }], [T.voz + 0.02, 'voz', 'blip', { pitch: 'E6' }],
  [T.um - 0.06, 'terminal sobe', 'whoosh', { len: 0.3, from: 400, to: 2400 }], [T.um, 'digita', 'type', { len: 0.38 }],
  [T.so + 0.1, 'enter', 'click', { gain: 0.45 }], [T.so + 0.2, 'ok', 'bell', { pitch: 'G6', gain: 0.3 }],
  ...[0, 1, 2].map((i) => [T.so + 0.12 + i * 0.06, 'variação', 'pop', { pitch: ['E5', 'G5', 'B5'][i], gain: 0.22 }]),
  [CUT.s6, 'whip', 'whoosh', { len: 0.35 }], [T.sessenta, 'contador', 'type', { len: 0.35, gain: 0.25 }], [T.sessenta + 0.35, '60', 'thud', { gain: 0.5 }],
  [T.padrao, 'PRONTO PRA POSTAR', 'thud', { gain: 0.45 }], [T.padrao + 0.02, 'pronto', 'bell', { pitch: 'C6', gain: 0.25 }],
  ...[0, 1, 2].map((i) => [T.das + i * 0.08, 'rede', 'pop', { pitch: ['C5', 'E5', 'G5'][i], gain: 0.22 }]),
  [CUT.s7, 'whip', 'whoosh', { len: 0.35, from: 500, to: 2500 }],
  [T.graca - 0.02, 'chave', 'click', { gain: 0.45 }], [T.graca + 0.06, 'R$ 0', 'thud', { gain: 0.6 }], [T.graca + 0.08, 'grátis', 'coins', { gain: 0.25 }],
  ...MODELOS.map((_, i) => [T.com + i * 0.17, 'modelo', 'pop', { pitch: ['C5', 'E5', 'G5', 'C6'][i], gain: 0.28 }]),
  [CUT.s8, 'zoom', 'whoosh', { len: 0.45 }], [T.completo, 'leque', 'whoosh', { len: 0.35, from: 900, to: 3500, gain: 0.25 }],
  [T.pdf, 'PDF', 'thud', { gain: 0.55 }],
  [CUT.gh, 'celular sobe', 'whoosh', { len: 0.45, from: 400, to: 2400 }], [T.aberto + 0.1, 'anel', 'tick'], [T.github + 0.25, 'anel', 'tick'],
  [CUT.cta, 'para o CTA', 'riser', { len: 1.4 }], [CUT.cta, 'CTA', 'impact', { gain: 0.7 }],
  [T.criativos, 'Criativos', 'thud', { gain: 0.35 }],
  [CUT.cta + 0.22, 'endereço', 'pop', { pitch: 'G5', gain: 0.3 }], [T.github2 + 0.01, 'botão', 'click', { gain: 0.35 }], [T.cria, 'selo', 'blip', { pitch: 'C6' }],
  [T.hoje, 'estrela', 'bell', { pitch: 'E6', gain: 0.3 }],
];
const HITS = HS.map(([t, l, s, o]) => [B(t), l, s, o || {}]);

// imagens: quadros reais do demo, variações, páginas do guia e a página do GitHub
const images = { vBase: 'assets/variantes/base.jpg', vEscuro: 'assets/variantes/escuro.jpg', vImpacto: 'assets/variantes/impacto.jpg', gh: 'assets/github-topo.png' };
for (const p of ['p00', 'p01', 'p02', 'p04', 'p10', 'p15']) images[p] = `assets/pdf/${p}.png`;
const quadros = new Set([50, 110, 200, 300, ...TRK.map((x) => x.img)]);
for (let i = 0; i < PLAYN; i++) quadros.add(PLAY0 + i);
for (const n of quadros) images['d' + n] = DEMO(n);

M.film({
  fonts: [fd(100, 800), fd(100, 900), f(40, 500), f(40, 600), f(40, 700), f(40, 800)],
  images,
  hits: HITS,
  init(ctx, IMG) { buildGH(IMG); },
  // a virada não leva desfoque de movimento: a separação RGB é um quadro nítido, não um véu médio
  samples: (t) => (t >= CUT.turn && t < CUT.turn + 0.24 ? 1 : TR.some(([tc]) => Math.abs(t - tc) < 0.25) ? 8 : 4),
  draw,
  // pós: grão fino em soft-light (não lava os pretos) + vinheta
  post(ctx, u, t) { S.grain(ctx, t, 0.05, true, 'soft-light'); },
});
