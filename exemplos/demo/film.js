// Demo · "Fluxo", um app de tarefas FICTÍCIO. Filme vertical de ~14 s que mostra a fábrica inteira:
//   0      problema (cena escura): tarefas caindo umas sobre as outras, contador de pendências subindo
//   virada blur-zoom + varredura de luz + anel: a marca entra e o celular sobe
//   app    tudo num lugar só: lista organizada, pílulas de categoria acendendo nas palavras da narração
//   toque  o cursor toca uma tarefa, o card de vidro sai do celular e ganha hora e dono
//   CTA    cartão final com o ícone da marca, título com desfoque e botão aceso
// Toda a interface é desenhada em código com lib/cena.js. Cada cena é presa a uma palavra da narração
// (vo.json, feito por scripts/vo_montar.py) e a virada / o CTA vêm de trilha.json (via beats.json).
import * as M from '../../lib/motion.js';
import * as S from '../../lib/cena.js';

const { W, H, lerp, clamp, E, TAU } = M;
const { C, f, fd, txt, pr, sp, card, pill, I, headline, W_, group } = S;

const VO = await S.loadVO();
const GRID = await (await fetch('beats.json')).json();
const B = (t) => (t - GRID.offset) / GRID.period;
const wt = (w, o) => S.wt(VO, w, o);
const T = {
  sua: wt('sua'), pilha: wt('pilha'), tarefas: wt('tarefas', { end: true }),
  com: wt('com'), fluxo: wt('fluxo'), tudo: wt('tudo'), lugar: wt('lugar'), so: wt('so', { end: true }),
  um: wt('um'), toque: wt('toque'), cada: wt('cada'), hora: wt('hora'), dono: wt('dono'), donoFim: wt('dono', { end: true }),
  baixe: wt('baixe'),
};
const REVEAL = GRID.reveal ?? T.com - 0.08;   // trilha.json -> beats.json: o golpe da virada
const CTA = GRID.cta ?? T.baixe - 0.15;         // início do cartão final
const DIM = '#F6F3F1';

// ------------------------------------------------------------------ 0 · problema: a pilha de tarefas
// [título, ícone, x, y, rotação, profundidade 0 (perto)..1 (longe), atrasada]
const CAOS = [
  ['Comprar presente', 'box', 790, 990, -0.06, 0.85, false],
  ['Reunião às 9h', 'calendar', 320, 1060, -0.11, 0.25, false],
  ['Pagar boleto', 'doc', 770, 1185, 0.12, 0.5, true],
  ['Ligar pro contador', 'bell', 520, 1290, -0.04, 0.1, false],
  ['Responder cliente', 'chat', 360, 1420, 0.07, 0.0, true],
  ['Academia 18h', 'clock', 760, 1500, -0.14, 0.7, false],
  ['Revisar proposta', 'doc', 420, 1620, 0.13, 0.35, true],
];
const chegada = (i) => 0.12 + i * 0.29;
function atrasada(g, x, y, s) {
  const font = f(22 * s, 700), tw = S.measure(g, 'Atrasada', font);
  M.rrect(g, x - tw - 30 * s, y - 19 * s, tw + 30 * s, 38 * s, 19 * s); g.fillStyle = '#FDE4E4'; g.fill();
  txt(g, 'Atrasada', x - 15 * s, y + 8 * s, font, '#D3303A', 'right');
}
function tarefaCaos(g, [titulo, ic, , , , , late], x, y, s) {
  const w = 540 * s, h = 128 * s, X = x - w / 2, Y = y - h / 2;
  card(g, X, Y, w, h, { r: 30 * s, fill: 'rgba(255,255,255,0.93)', shadow: 0.45, lift: 1.2 });
  g.beginPath(); g.arc(X + 64 * s, y, 36 * s, 0, TAU); g.fillStyle = C.accSoft; g.fill();
  (I[ic] || I.doc)(g, X + 64 * s, y, 42 * s, C.acc);
  txt(g, titulo, X + 120 * s, y + 12 * s, f(34 * s, 600), C.ink);
  if (late) atrasada(g, X + w - 22 * s, y - 28 * s, s * 0.9);
}
function sceneProblema(ctx, t) {
  S.bgDark(ctx, t, { glow: 0.9, cy: 0.55 });
  const zoom = 1 + 0.05 * E.inOutSine(pr(t, 0, REVEAL));
  ctx.save(); M.zoomAbout(ctx, zoom, W / 2, 1250);
  // de trás para a frente: as distantes ficam menores e desfocadas
  const ordem = CAOS.map((c, i) => [c, i]).sort((a, b) => b[0][5] - a[0][5]);
  for (const [c, i] of ordem) {
    const t0 = chegada(i), k = sp(t, t0, 210, 15);
    if (k <= 0) continue;
    const [, , x, y, rot, depth] = c;
    const s = 1 - 0.26 * depth;
    const dy = (1 - k) * -620, wob = M.wobble(t - t0 - 0.12, 2.4, 4.5) * 0.05;
    const drift = 10 * M.noise1(t * 0.6, i + 3);
    group(ctx, 'caos' + i, { a: clamp(k * 2), blur: depth * 9, cx: x, cy: y + dy, rot: rot + wob, dx: 0, dy: 0 },
      (g) => tarefaCaos(g, c, x + drift, y + dy, s));
  }
  ctx.restore();
  // contador de pendências: sobe a cada tarefa que cai
  const n = CAOS.filter((_, i) => t >= chegada(i) + 0.1).length;
  const kc = sp(t, 0.35, 180, 16);
  if (kc > 0) {
    const bump = n ? Math.max(0, 1 - (t - (chegada(n - 1) + 0.1)) / 0.25) : 0;
    ctx.save(); ctx.globalAlpha = clamp(kc * 1.4) * (1 - E.inCubic(pr(t, REVEAL - 0.35, REVEAL)));
    M.zoomAbout(ctx, 1 + 0.08 * bump, W / 2, 742);
    pill(ctx, W / 2, 742 + (1 - kc) * 40, `${14 + n} pendentes`, { size: 34, icon: I.warn });
    ctx.restore();
  }
  headline(ctx, t, W_('Sua semana virou | uma *pilha?*'), { y: 450, size: 118, weight: 800, t0: T.sua - 0.15, t1: REVEAL - 0.42, color: DIM, accent: C.accHi });
}

// ------------------------------------------------------------------ app: o Fluxo na tela do celular
const TAREFAS = [
  ['Enviar proposta', 'Trabalho', ''],
  ['Reunião de equipe', 'Trabalho', '09:00'],
  ['Pagar boleto', 'Casa', '12:00'],
  ['Revisar capítulo 3', 'Estudos', '15:00'],
  ['Academia', 'Casa', '18:00'],
];
const COR_CAT = { Trabalho: C.acc, Casa: '#E08A2E', Estudos: '#1FA97A' };
const SW = 500, SH = SW * 2.165;
const phoneY = (t) => lerp(2550, 1398, sp(t, REVEAL - 0.05, 110, 16));
// retângulo (em coordenadas do quadro) da linha i da lista, para o card de vidro sair dali
function linha(i, py) {
  const s = SW / 400, x = W / 2 - SW / 2, y = py - SH / 2;
  return { x: x + 14 * s, y: y + 128 * s + 62 * s + i * 74 * s, w: SW - 28 * s, h: 64 * s };
}
function telaApp(ctx, x, y, w, h, t) {
  const s = w / 400;
  const area = S.chrome(ctx, x, y, w, h, 'Hoje', { sub: 'Terça-feira · 5 tarefas', ativa: 0 });
  // filtros
  let fx = x + 14 * s;
  ['Todas', 'Trabalho', 'Casa', 'Estudos'].forEach((nome, i) => {
    const font = f(12.5 * s, 600), tw = S.measure(ctx, nome, font), pw = tw + 22 * s;
    M.rrect(ctx, fx, area.y + 16 * s, pw, 28 * s, 14 * s);
    ctx.fillStyle = i === 0 ? C.ink : '#FFFFFF'; ctx.fill();
    txt(ctx, nome, fx + 11 * s, area.y + 34.5 * s, font, i === 0 ? '#fff' : C.ink2);
    fx += pw + 7 * s;
  });
  const agendada = t >= T.hora;
  TAREFAS.forEach(([titulo, cat, hora], i) => {
    const k = sp(t, REVEAL + 0.35 + i * 0.11, 210, 20);
    if (k <= 0) return;
    const r = linha(i, y + h / 2);
    const rx = r.x + (1 - k) * w * 0.7;
    ctx.save(); ctx.globalAlpha *= clamp(k * 1.5);
    S.appCard(ctx, rx, r.y, r.w, r.h, s, { r: 16 });
    ctx.fillStyle = COR_CAT[cat]; M.rrect(ctx, rx, r.y + 14 * s, 4 * s, r.h - 28 * s, 2 * s); ctx.fill();
    const feita = i === 0 && t >= T.dono + 0.4;
    ctx.beginPath(); ctx.arc(rx + 30 * s, r.y + r.h / 2, 10 * s, 0, TAU);
    if (feita) { ctx.fillStyle = C.acc; ctx.fill(); I.check(ctx, rx + 30 * s, r.y + r.h / 2 + 1 * s, 15 * s, '#fff', clamp((t - T.dono - 0.4) * 4)); }
    else { ctx.lineWidth = 2 * s; ctx.strokeStyle = '#C9C7D3'; ctx.stroke(); }
    txt(ctx, titulo, rx + 50 * s, r.y + 27 * s, f(15 * s, 600), C.ink);
    const det = i === 0 ? (agendada ? `${cat} · 09:30 · Ana` : `${cat} · sem hora`) : `${cat} · ${hora}`;
    txt(ctx, det, rx + 50 * s, r.y + 46 * s, f(11.5 * s, 500), i === 0 && !agendada ? C.accHi : C.mute);
    ctx.restore();
  });
  // botão flutuante de nova tarefa
  const kb = sp(t, REVEAL + 0.9, 220, 14);
  if (kb > 0) {
    const bx = x + w - 52 * s, by = y + h - 74 * s - 40 * s, br = 24 * s * kb;
    ctx.save(); ctx.shadowColor = C.accGlow; ctx.shadowBlur = 24 * s;
    ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fillStyle = C.acc; ctx.fill(); ctx.restore();
    I.plus(ctx, bx, by, 22 * s * kb, '#fff');
  }
}

// pílulas de categoria flutuando em volta do celular, em profundidades diferentes
const PILULAS = [
  ['Trabalho · 2', 'list', 262, 1035, 0, () => T.tudo],
  ['Casa · 2', 'calendar', 842, 1215, 0.45, () => T.tudo + 0.3],
  ['Estudos · 1', 'doc', 250, 1395, 0.2, () => T.lugar],
];
function pilulas(ctx, t) {
  const sai = E.inCubic(pr(t, T.um - 0.35, T.um + 0.15));
  PILULAS.forEach(([rotulo, ic, x, y, depth, aceso], i) => {
    const k = sp(t, REVEAL + 0.55 + i * 0.12, 170, 15);
    if (k <= 0) return;
    const lado = x < W / 2 ? -1 : 1;
    const px = x + lado * (1 - k) * 420 + 8 * M.noise1(t * 0.5, 11 + i), py = y + 10 * M.noise1(t * 0.45, 21 + i);
    const on = E.outCubic(pr(t, aceso(), aceso() + 0.22));
    const sc = (1 - 0.12 * depth) * (1 + 0.06 * Math.sin(Math.PI * clamp((t - aceso()) / 0.3)));
    group(ctx, 'pil' + i, { a: clamp(k * 1.6) * (1 - sai), blur: depth * 5 + sai * 16, s: sc, cx: px, cy: py },
      (g) => pill(g, px, py, rotulo, { on, size: 36, icon: (gg, ix, iy, is, col) => I[ic](gg, ix, iy, is, col), sweep: pr(t, aceso() + 0.15, aceso() + 0.75) }));
  });
}

// o card de vidro que sai da primeira linha e ganha hora e dono
const ALVO = { x: 96, y: 880, w: 888, h: 600 };
function cardDetalhe(ctx, t, py) {
  const t0 = T.toque + 0.1, k = sp(t, t0, 150, 17);
  if (k <= 0) return;
  const r0 = linha(0, py);
  const x = lerp(r0.x, ALVO.x, k), y = lerp(r0.y, ALVO.y, k), w = lerp(r0.w, ALVO.w, k), h = lerp(r0.h, ALVO.h, k);
  card(ctx, x, y, w, h, { r: lerp(16, 46, clamp(k)), fill: 'rgba(255,255,255,0.9)', shadow: 0.16 * k + 0.04, lift: lerp(0.3, 1.4, clamp(k)) });
  const a = E.outCubic(pr(t, t0 + 0.18, t0 + 0.5));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  M.rrect(ctx, x + 2, y + 2, w - 4, h * 0.45, 44); const hl = ctx.createLinearGradient(0, y, 0, y + h * 0.45);
  hl.addColorStop(0, 'rgba(255,255,255,0.7)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = hl; ctx.fill();
  const X = x + 56, dy = (1 - a) * 18;
  S.chip(ctx, X, y + 74 + dy, 'Trabalho', { size: 26 });
  txt(ctx, 'Enviar proposta', X, y + 170 + dy, fd(66, 800), C.ink, 'left', -1);
  ctx.fillStyle = C.line; ctx.fillRect(X, y + 214, w - 112, 2);
  // linhas: hora e dono, cada uma entra na sua palavra
  const linhaInfo = (i, ic, rotulo, tFala, valor) => {
    const ly = y + 290 + i * 120;
    ctx.beginPath(); ctx.arc(X + 38, ly, 38, 0, TAU); ctx.fillStyle = C.accSoft; ctx.fill();
    I[ic](ctx, X + 38, ly, 44, C.acc);
    txt(ctx, rotulo, X + 104, ly - 12, f(28, 500), C.mute);
    if (t < tFala - 0.05) {
      ctx.fillStyle = '#ECEAF3'; M.rrect(ctx, X + 104, ly + 4, 260, 34, 17); ctx.fill();
    } else valor(X + 104, ly + 32);
  };
  linhaInfo(0, 'clock', 'Hora', T.hora, (vx, vy) => S.fieldText(ctx, vx, vy - 34, 400, 46, 'Hoje, 09:30', pr(t, T.hora - 0.05, T.hora + 0.3), { size: 40, weight: 700, t }));
  linhaInfo(1, 'user', 'Dono', T.dono, (vx, vy) => {
    const ka = sp(t, T.dono - 0.05, 260, 14);
    ctx.save(); M.zoomAbout(ctx, lerp(0.4, 1, clamp(ka)), vx + 26, vy - 14);
    S.avatar(ctx, vx + 26, vy - 14, 27, 'AL');
    ctx.restore();
    ctx.save(); ctx.globalAlpha *= clamp(ka * 1.4);
    txt(ctx, 'Ana Lima', vx + 68, vy, f(40, 700), C.ink);
    ctx.restore();
  });
  // botão "Agendar" que acende e é apertado logo depois de "dono"
  const tb = T.dono + 0.12, kb = sp(t, T.dono - 0.05, 220, 16);
  if (kb > 0) {
    const press = Math.max(0, Math.sin(clamp((t - tb) / 0.28) * Math.PI));
    pill(ctx, x + w / 2, y + h - 74 + (1 - kb) * 30, t >= tb + 0.25 ? 'Agendada' : 'Agendar', {
      on: E.outCubic(pr(t, tb, tb + 0.2)), size: 38, w: w - 112, press, a: clamp(kb * 1.5),
      icon: t >= tb + 0.25 ? (g, ix, iy, is, col) => I.check(g, ix, iy, is, col, clamp((t - tb - 0.25) * 4)) : null,
      sweep: pr(t, tb + 0.3, tb + 0.9),
    });
  }
  ctx.restore();
}

function sceneApp(ctx, t) {
  S.bgLight(ctx, t);
  const py = phoneY(t);
  // brilho na cor da marca atrás do celular
  const gk = E.outCubic(pr(t, REVEAL, REVEAL + 0.8));
  const g = ctx.createRadialGradient(W / 2, 1300, 0, W / 2, 1300, 620);
  g.addColorStop(0, S.rgba(C.accHi, 0.22 * gk)); g.addColorStop(1, S.rgba(C.accHi, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // marca: ícone + nome, entra em "Fluxo"
  const km = sp(t, T.fluxo - 0.25, 200, 15);
  if (km > 0) {
    const nome = 'Fluxo', font = fd(86, 800), tw = S.measure(ctx, nome, font, -1), ic = 104, x0 = W / 2 - (ic + 26 + tw) / 2;
    ctx.save(); ctx.globalAlpha = clamp(km * 1.5);
    const bl = (1 - clamp(km)) * 18; if (bl > 0.3) ctx.filter = `blur(${bl.toFixed(1)}px)`;
    S.logoMarca(ctx, x0 + ic / 2, 318, ic * lerp(0.6, 1, km), { glow: 0.8 });
    txt(ctx, nome, x0 + ic + 26, 318 + 30, font, C.ink, 'left', -1);
    ctx.restore();
  }
  headline(ctx, t, W_('Tudo num | *lugar só.*'), { y: 560, size: 104, weight: 800, t0: T.tudo - 0.22, t1: T.um - 0.5 });
  headline(ctx, t, W_('Um toque: | *hora e dono.*'), { y: 560, size: 104, weight: 800, t0: T.um - 0.12, t1: CTA - 0.45 });
  // celular (fica mais distante e desfocado quando o card de vidro sai dele)
  const kd = E.inOutCubic(pr(t, T.toque + 0.05, T.toque + 0.6));
  const tilt = 0.05 * (1 - sp(t, REVEAL, 90, 12));
  group(ctx, 'fone', { a: 1 - 0.18 * kd, blur: 7 * kd, s: 1 - 0.035 * kd, cx: W / 2, cy: py }, (gc) => {
    S.phone(gc, W / 2, py, SW, (c, x, y, w, h) => telaApp(c, x, y, w, h, t), { tilt, shadow: 0.9 });
    // anel de foco na linha tocada, antes de ela "sair"
    const ra = Math.min(E.outCubic(pr(t, T.toque - 0.05, T.toque + 0.1)), 1 - pr(t, T.toque + 0.3, T.toque + 0.6));
    if (ra > 0) {
      const r = linha(0, py);
      gc.save(); gc.globalAlpha = ra; gc.shadowColor = C.accGlow; gc.shadowBlur = 30;
      M.rrect(gc, r.x - 5, r.y - 5, r.w + 10, r.h + 10, 22); gc.lineWidth = 5; gc.strokeStyle = C.accHi; gc.stroke(); gc.restore();
    }
  });
  pilulas(ctx, t);
  cardDetalhe(ctx, t, py);
  // cursor: entra pela direita, toca a primeira tarefa e sai
  const r = linha(0, py), alvoX = r.x + r.w * 0.55, alvoY = r.y + r.h * 0.55;
  const ca = Math.min(E.outCubic(pr(t, T.um - 0.25, T.um + 0.1)), 1 - E.inCubic(pr(t, T.toque + 0.45, T.toque + 0.8)));
  if (ca > 0) {
    const q = E.inOutCubic(pr(t, T.um - 0.25, T.toque - 0.04));
    const cx = lerp(1010, alvoX, q) + Math.sin(q * Math.PI) * 60, cy = lerp(1820, alvoY, q);
    const press = Math.max(0, Math.sin(clamp((t - (T.toque - 0.05)) / 0.22) * Math.PI));
    S.ripple(ctx, t, T.toque, alvoX, alvoY, { r: 110 });
    S.cursor(ctx, cx, cy, { press, a: ca, scale: 1.5 });
  }
}

// ------------------------------------------------------------------ CTA
function sceneFim(ctx, t, IMG) {
  S.bgLight(ctx, t);
  S.bloomRing(ctx, pr(t, CTA - 0.05, CTA + 1.3), W / 2, H * 0.34, { maxR: 760, a: 0.8 });
  // o cartão final nunca fica parado: aproximação lenta e um segundo reflexo de luz
  ctx.save(); M.zoomAbout(ctx, 1 + 0.035 * E.inOutSine(pr(t, CTA, CTA + 4.4)), W / 2, H * 0.45);
  S.endCard(ctx, t, CTA + 0.05, IMG, { logoSize: 280 });
  ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.3; S.lightSweep(ctx, pr(t, CTA + 2.7, CTA + 3.9), { angle: -0.5, width: 0.45, tint: 'branco' }); ctx.restore();
}

// ------------------------------------------------------------------ montagem
function scene(ctx, t, IMG) {
  if (t < REVEAL) return sceneProblema(ctx, t);
  if (t < CTA) return sceneApp(ctx, t);
  return sceneFim(ctx, t, IMG);
}
const CORTES = [[REVEAL, 0.55, 'luz'], [CTA, 0.5, 'bz']];
function draw(ctx, u, t, IMG) {
  for (const [tc, d, tipo] of CORTES) {
    if (t >= tc - d / 2 && t < tc + d / 2) {
      const p = (t - (tc - d / 2)) / d;
      S.blurZoom(ctx, p, (x) => scene(x, Math.min(t, tc - 1e-3), IMG), (x) => scene(x, Math.max(t, tc), IMG), { key: 'corte' + tc.toFixed(2), blur: 30 });
      if (tipo === 'luz') { S.lightSweep(ctx, p, { angle: -0.55, width: 0.7 }); S.bloomRing(ctx, pr(t, tc - 0.1, tc + 0.7), W / 2, 1250, { maxR: 900, a: 0.7 }); }
      return;
    }
  }
  scene(ctx, t, IMG);
}

// acentos: cada um vira um efeito sonoro no quadro certo (sfx.mjs)
const HS = [
  ...CAOS.map((c, i) => [chegada(i) + 0.1, 'tarefa cai', 'thud', { gain: 0.5 - c[5] * 0.25, pan: (c[2] - W / 2) / W }]),
  [REVEAL - 0.02, 'virada', 'whoosh', { len: 0.6 }],
  [T.fluxo - 0.1, 'marca', 'bell', { pitch: 'E6' }],
  [REVEAL + 0.35, 'celular sobe', 'whoosh', { len: 0.5, from: 400, to: 2400 }],
  ...TAREFAS.map((_, i) => [REVEAL + 0.42 + i * 0.11, 'linha', 'tick', { gain: 0.6 }]),
  [T.tudo, 'pílula', 'blip', { pitch: 'C6' }], [T.tudo + 0.3, 'pílula', 'blip', { pitch: 'E6' }], [T.lugar, 'pílula', 'blip', { pitch: 'G6' }],
  [T.toque - 0.02, 'toque', 'click'],
  [T.toque + 0.3, 'card sobe', 'whoosh', { len: 0.4, from: 900, to: 3000 }],
  [T.hora, 'digita a hora', 'type', { len: 0.35 }],
  [T.dono, 'avatar', 'pop', { pitch: 'A5' }],
  [T.dono + 0.12, 'agendar', 'tick'], [T.dono + 0.37, 'agendada', 'bell', { pitch: 'G6', gain: 0.7 }],
  [CTA - 0.05, 'para o CTA', 'whoosh', { len: 0.5 }],
  [CTA + 0.1, 'ícone', 'bell', { pitch: 'D6' }],
  [CTA + 0.05 + 2.3, 'aperta o botão', 'click'],
];
const HITS = HS.map(([t, l, s, o]) => [B(t), l, s, o || {}]);

M.film({
  fonts: [fd(100, 800), fd(100, 900), f(40, 400), f(40, 500), f(40, 600), f(40, 700)],
  images: {},
  hits: HITS,
  samples: (t) => (CORTES.some(([tc, d]) => Math.abs(t - tc) < d) ? 12 : 6),
  draw,
  post(ctx, u, t) { S.grain(ctx, t, 0.028, t < REVEAL); },
});
