#!/usr/bin/env node
// fabrica.mjs: a Fábrica de Criativos num comando só, igual no Windows, no macOS e no Linux.
// Só precisa de Node (20 ou mais). Rode da pasta do projeto:
//
//   node fabrica.mjs verificar                         confere o que está instalado e diz como resolver o que falta
//   node fabrica.mjs demo                              exemplo 2D de ponta a ponta com a voz grátis
//   node fabrica.mjs novo <id> "<título>" [pasta]      cria um filme novo a partir do exemplo
//   node fabrica.mjs previa <pasta-do-filme>           áudio + prévia (30 fps)  -> entrega/previas/<nome>-previa.mp4
//   node fabrica.mjs final <pasta-do-filme>            áudio + final (60 fps)   -> entrega/finais/<nome>.mp4
//   node fabrica.mjs audio <pasta-do-filme>            só o áudio (trilha, efeitos, mixagem em -14 LUFS)
//   node fabrica.mjs contato <pasta-do-filme>          folha de contato e folha de celular
//   node fabrica.mjs checar <arquivo.mp4> [...]        confere resolução, fps, pixel, áudio, loudness e pico
//   node fabrica.mjs ajuda                             esta lista
//
// Os mesmos comandos pelo npm: npm run previa -- exemplos/bancada (o "--" separa o que é do npm).
// Nada aqui passa por bash: os programas são chamados direto (sem shell), com caminhos montados por path.join.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { argsChromium3D, renderizadorEmSoftware } from './lib/3d/gpu.mjs';

const RAIZ = fs.realpathSync(path.dirname(fileURLToPath(import.meta.url)));
const PLATAFORMA = process.platform;
const WIN = PLATAFORMA === 'win32', MAC = PLATAFORMA === 'darwin';
const SKILL = process.env.SKILL ? path.resolve(process.env.SKILL) : path.join(RAIZ, 'vendor', 'motion-reel', 'skills', 'motion-reel');
const RENDER2D = path.join(SKILL, 'scripts', 'render.mjs');
const SFX = path.join(SKILL, 'scripts', 'sfx.mjs');
const MIX = path.join(SKILL, 'scripts', 'mix.mjs');
const RENDER3D = path.join(RAIZ, 'lib', '3d', 'render.mjs');
// pelo npm, o comando roda na raiz do projeto; INIT_CWD é a pasta em que a pessoa estava
const PASTA_USUARIO = process.env.INIT_CWD && fs.existsSync(process.env.INIT_CWD) ? process.env.INIT_CWD : process.cwd();

// ------------------------------------------------------------------ saída no terminal
const COR = process.stdout.isTTY && !process.env.NO_COLOR;
const pinta = (c, s) => (COR ? `\x1b[${c}m${s}\x1b[0m` : s);
const verde = (s) => pinta(32, s), vermelho = (s) => pinta(31, s), amarelo = (s) => pinta(33, s), fraco = (s) => pinta(2, s), negrito = (s) => pinta(1, s);
// o console antigo do Windows 10 (conhost com Consolas) não tem ✔ e ✖; o Windows Terminal e o VS Code têm
const CONSOLE_ANTIGO = WIN && !process.env.WT_SESSION && !process.env.TERM_PROGRAM;
const SIMBOLO = CONSOLE_ANTIGO ? { ok: '√', erro: '×', aviso: '!', info: '·', pulado: '-' } : { ok: '✔', erro: '✖', aviso: '!', info: '·', pulado: '-' };
const passo = (s) => console.log(`\n${negrito('==')} ${negrito(s)}`);
const aviso = (s) => console.error(amarelo(`aviso: ${s}`));

class ErroAmigavel extends Error {}
const falhar = (msg) => { throw new ErroAmigavel(msg); };

const NOME_SO = { win32: 'Windows', darwin: 'macOS', linux: 'Linux' }[PLATAFORMA] || PLATAFORMA;
const INSTALADOR = WIN ? 'powershell -ExecutionPolicy Bypass -File instalar\\windows.ps1'
  : MAC ? 'bash instalar/macos.sh' : 'bash instalar/linux.sh';

// ------------------------------------------------------------------ achar e rodar programas (sem shell)
function chavePath(env) { return Object.keys(env).find((k) => k.toUpperCase() === 'PATH') || 'PATH'; }

let _binUv;
function pastasExtras() {
  // pastas onde os instaladores costumam pôr os programas, para funcionar mesmo antes de reabrir o terminal
  const casa = os.homedir();
  const extras = [path.join(casa, '.local', 'bin'), path.join(casa, '.cargo', 'bin')];
  if (WIN && process.env.LOCALAPPDATA) extras.push(path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links'));
  if (MAC) extras.push('/opt/homebrew/bin', '/usr/local/bin');
  if (_binUv) extras.unshift(_binUv);
  return extras;
}
function pastasDoPath() {
  const ja = (process.env[chavePath(process.env)] || '').split(path.delimiter).filter(Boolean);
  const vistos = new Set(ja.map((p) => (WIN ? p.toLowerCase() : p)));
  return [...ja, ...pastasExtras().filter((p) => !vistos.has(WIN ? p.toLowerCase() : p))];
}
function executavel(arq) {
  try {
    if (!fs.statSync(arq).isFile()) return false;
    if (!WIN) fs.accessSync(arq, fs.constants.X_OK);
    return true;
  } catch { return false; }
}
// o `which` em JavaScript: no Windows tenta as extensões do PATHEXT (.exe, .cmd, ...)
function achar(nome) {
  const exts = WIN ? (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean).map((e) => e.toLowerCase()) : [''];
  const temExt = WIN && exts.includes(path.extname(nome).toLowerCase());
  for (const dir of pastasDoPath()) {
    for (const ext of temExt ? [''] : exts) {
      const arq = path.join(dir.replace(/^"(.*)"$/, '$1'), nome + ext);
      if (executavel(arq)) return arq;
    }
  }
  return null;
}
// npm e npx no Windows são .cmd, que o Node não roda sem shell: roda o .js deles com o próprio Node
function cliDoNpm(qual) {
  const nomeJs = `${qual}-cli.js`;
  const cands = [];
  if (process.env.npm_execpath && /npm-cli\.js$/.test(process.env.npm_execpath)) cands.push(path.join(path.dirname(process.env.npm_execpath), nomeJs));
  const dirNode = path.dirname(process.execPath);
  cands.push(path.join(dirNode, 'node_modules', 'npm', 'bin', nomeJs), path.join(dirNode, '..', 'lib', 'node_modules', 'npm', 'bin', nomeJs));
  return cands.find((c) => fs.existsSync(c)) || null;
}
function resolverPrograma(nome) {
  if (nome === 'node') return { cmd: process.execPath, pre: [] };
  if (nome === 'npm' || nome === 'npx') {
    const js = cliDoNpm(nome);
    if (js) return { cmd: process.execPath, pre: [js] };
  }
  const arq = achar(nome);
  if (!arq) return null;
  if (WIN && /\.(cmd|bat)$/i.test(arq)) return { cmd: process.env.ComSpec || 'cmd.exe', pre: ['/d', '/c', arq] };
  return { cmd: arq, pre: [] };
}
function envFilho(extra = {}) {
  const env = { ...process.env, SKILL, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', ...extra };
  const k = chavePath(env);
  env[k] = pastasDoPath().join(path.delimiter);
  return env;
}
const COMO_INSTALAR = {
  node: { win32: 'winget install -e --id OpenJS.NodeJS.LTS', darwin: 'brew install node',
    linux: 'curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -  &&  sudo apt-get install -y nodejs' },
  npm: { win32: 'vem com o Node: winget install -e --id OpenJS.NodeJS.LTS', darwin: 'vem com o Node: brew install node', linux: 'vem com o Node (NodeSource 22.x)' },
  uv: { win32: 'winget install -e --id astral-sh.uv', darwin: 'brew install uv', linux: 'curl -LsSf https://astral.sh/uv/install.sh | sh' },
  ffmpeg: { win32: 'winget install -e --id Gyan.FFmpeg', darwin: 'brew install ffmpeg', linux: 'sudo apt install ffmpeg' },
};
COMO_INSTALAR.ffprobe = COMO_INSTALAR.ffmpeg;
const comoInstalar = (nome) => (COMO_INSTALAR[nome] || {})[PLATAFORMA] || COMO_INSTALAR[nome]?.linux || '';

// roda um programa; sem `capturar` a saída vai direto para o terminal
function rodar(nome, args, { capturar = false, cwd = RAIZ, env = {}, etapa } = {}) {
  const prog = resolverPrograma(nome);
  if (!prog) falhar(`não achei o ${nome}. Como instalar: ${comoInstalar(nome) || 'veja node fabrica.mjs verificar'}`);
  const r = spawnSync(prog.cmd, [...prog.pre, ...args], {
    cwd, env: envFilho(env), shell: false, windowsHide: true, encoding: 'utf8', maxBuffer: 1 << 28,
    stdio: capturar ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (r.error) falhar(`não consegui rodar ${nome}: ${r.error.message}`);
  if (etapa && r.status !== 0) {
    if (capturar) process.stderr.write([r.stdout, r.stderr].filter(Boolean).join('\n'));
    falhar(`a etapa "${etapa}" falhou (código ${r.status ?? r.signal}).`);
  }
  return r;
}
const ultimaLinha = (s) => (s || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).pop() || '';
const primeiraLinha = (s) => (s || '').split(/\r?\n/).map((l) => l.trim()).find(Boolean) || '';

function binDoUv() {
  if (_binUv !== undefined) return _binUv;
  _binUv = null;
  const uv = resolverPrograma('uv');
  if (uv) {
    const r = spawnSync(uv.cmd, [...uv.pre, 'tool', 'dir', '--bin'], { encoding: 'utf8', windowsHide: true });
    if (r.status === 0 && r.stdout.trim()) _binUv = r.stdout.trim();
  }
  return _binUv;
}

// ------------------------------------------------------------------ argumentos
const OPC_VALOR = new Set(['spp', 'fps', 'de', 'ate', 'saida', 'crf', 'q']);
const OPC_LIGA = new Set(['sem-audio', 'limpo', 'refazer-trilha']);
function lerArgs(argv) {
  const pos = [], o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help' || a === '--ajuda') { o.ajuda = true; continue; }
    if (!a.startsWith('--') || a === '--') { if (a !== '--') pos.push(a); continue; }
    let [nome, valor] = a.slice(2).split(/=(.*)/s);
    if (OPC_LIGA.has(nome)) { o[nome] = true; continue; }
    if (!OPC_VALOR.has(nome)) falhar(`opção desconhecida: ${a}. Opções: ${[...OPC_VALOR].map((x) => `--${x} N`).join(' ')} ${[...OPC_LIGA].map((x) => `--${x}`).join(' ')}`);
    if (valor === undefined) {
      valor = argv[++i];
      if (valor === undefined || (valor.startsWith('--') && valor !== '--')) falhar(`faltou o valor de --${nome}`);
    }
    o[nome] = valor;
  }
  return { pos, o };
}
function numero(v, nome, { inteiro = false, min = -Infinity } = {}) {
  if (v === undefined) return undefined;
  const n = Number(String(v).replace(',', '.'));   // aceita 1,5 além de 1.5
  if (!Number.isFinite(n) || (inteiro && !Number.isInteger(n)) || n < min) falhar(`--${nome} precisa ser ${inteiro ? 'um número inteiro' : 'um número'}${min > -Infinity ? ` a partir de ${min}` : ''} (veio "${v}")`);
  return n;
}
const doUsuario = (p) => path.resolve(PASTA_USUARIO, p);
// caminho para mostrar: relativo à pasta da pessoa quando fica dentro dela, senão o caminho inteiro
const mostrar = (p) => { const r = path.relative(PASTA_USUARIO, p); return r && !r.startsWith('..') && !path.isAbsolute(r) ? r : p; };

// ------------------------------------------------------------------ filmes
function lerJson(p, padrao = null) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return padrao; }
}
function eh3D(dir) {
  // filme 3D importa lib/3d (pipeline, estúdio, modelos); o 2D usa lib/cena.js e o motion-reel
  for (const f of ['film.js', 'index.html']) {
    const p = path.join(dir, f);
    if (fs.existsSync(p) && /lib\/3d\//.test(fs.readFileSync(p, 'utf8'))) return true;
  }
  return false;
}
function resolverFilme(arg) {
  if (!arg) falhar('faltou a pasta do filme (ex.: exemplos/bancada).');
  const abs = doUsuario(arg);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) falhar(`pasta não encontrada: ${arg}`);
  const real = fs.realpathSync(abs);
  const rel = path.relative(RAIZ, real);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) falhar(`o filme precisa ficar dentro da pasta da fábrica (${RAIZ}), porque o render serve essa pasta para o navegador achar lib/.`);
  const F = rel.split(path.sep).join('/');
  if (!fs.existsSync(path.join(real, 'index.html'))) falhar(`faltou ${F}/index.html: essa pasta não parece um filme.`);
  const tipo = eh3D(real) ? '3d' : '2d';
  const cfg = lerJson(path.join(real, 'film.json'), null);
  return { F, dir: real, nome: path.basename(real), tipo, cfg, audio: path.join(real, 'audio') };
}
const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');
const lerTexto = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);

// ------------------------------------------------------------------ áudio: eventos -> trilha -> efeitos -> mixagem
function rodarTrilha(filme, { preservar = false } = {}) {
  const music = path.join(filme.audio, 'music.wav'), copia = path.join(filme.audio, 'music.eleven-guardada.wav');
  if (preservar) fs.copyFileSync(music, copia);
  try {
    const r = rodar('uv', ['run', '-q', path.join('scripts', 'trilha.py'), filme.F], { capturar: true, etapa: 'trilha (scripts/trilha.py)' });
    for (const l of (r.stdout || '').split(/\r?\n/)) if (/^(andamento|loudness|->)/.test(l) && !(preservar && /music\.wav/.test(l))) console.log(l);
  } finally {
    if (preservar) fs.renameSync(copia, music);
  }
  if (!preservar) fs.rmSync(path.join(filme.audio, 'music.origem.json'), { force: true });
}
function fazerAudio(filme, o) {
  for (const [p, n] of [[SFX, 'sfx.mjs'], [MIX, 'mix.mjs']]) if (!fs.existsSync(p)) falhar(`não achei ${n} do motion-reel em ${SKILL} (defina SKILL ou restaure vendor/).`);
  if (!filme.cfg) falhar(`faltou ${filme.F}/film.json (a mixagem lê a duração dele).`);
  const trilhaJson = path.join(filme.dir, 'trilha.json'), music = path.join(filme.audio, 'music.wav'), beats = path.join(filme.dir, 'beats.json');
  const estadoArq = path.join(RAIZ, 'out', ...filme.F.split('/'), 'trilha.sha1');
  const antes = lerTexto(trilhaJson);
  if (filme.tipo === '3d') {
    passo('eventos e pontos da trilha');
    const r = rodar('node', [RENDER3D, '--film', filme.F, '--meta'], { capturar: true, etapa: 'eventos (lib/3d/render.mjs --meta)' });
    console.log(primeiraLinha(r.stdout));
  }
  const depois = lerTexto(trilhaJson);
  if (depois !== null) {
    const guardado = lerTexto(estadoArq)?.trim() || null;
    // 3D: o trilha.json sai do film.js (--meta); 2D: é escrito à mão, então a comparação é com o da última trilha
    const mudou = filme.tipo === '3d' ? antes !== depois || (guardado !== null && guardado !== sha1(depois)) : guardado !== sha1(depois);
    const eleven = fs.existsSync(music) && (fs.existsSync(path.join(filme.audio, 'music.origem.json')) || fs.existsSync(path.join(filme.dir, 'musica.json')));
    const guardar = () => { fs.mkdirSync(path.dirname(estadoArq), { recursive: true }); fs.writeFileSync(estadoArq, sha1(depois) + '\n'); };
    if (o['refazer-trilha'] || !fs.existsSync(music)) {
      passo('trilha'); rodarTrilha(filme); guardar();
    } else if (eleven) {
      if (!fs.existsSync(beats)) { passo('trilha: só o beats.json (a música do trilha_eleven.py fica)'); rodarTrilha(filme, { preservar: true }); }
      else passo('trilha: audio/music.wav mantida (veio do trilha_eleven.py)');
      if (mudou) {
        console.log(amarelo(`   o trilha.json mudou: realinhe a música com  uv run scripts/trilha_eleven.py alinhar ${filme.F} <tomada.raw.wav>`));
        console.log(amarelo('   (ou troque pela sintetizada com --refazer-trilha)'));
      }
      guardar();
    } else if (mudou || !fs.existsSync(beats)) {
      passo('trilha'); rodarTrilha(filme); guardar();
    } else {
      passo('trilha: audio/music.wav mantida (o trilha.json não mudou; --refazer-trilha refaz)');
    }
  } else if (!fs.existsSync(music) || !fs.existsSync(beats)) {
    falhar(`faltou ${filme.F}/trilha.json (ou audio/music.wav e beats.json prontos).`);
  }
  if (!fs.existsSync(path.join(filme.audio, 'vo.wav'))) aviso(`sem ${filme.F}/audio/vo.wav: a mixagem sai sem narração (gere a voz e rode scripts/vo_montar.py).`);
  passo('efeitos');
  console.log(ultimaLinha(rodar('node', [SFX, filme.F], { capturar: true, etapa: 'efeitos (sfx.mjs)' }).stdout));
  passo('mixagem (-14 LUFS)');
  const mix = [MIX, filme.F, '--no-mux'];
  if (filme.tipo === '3d') {
    // os mesmos valores do scripts/finalizar3d.sh (a música não some sob a voz)
    const env = process.env;
    mix.push('--music-db', env.MUSICA_DB || '2');
    if (/duck-threshold/.test(fs.readFileSync(MIX, 'utf8'))) {
      mix.push('--duck-threshold', env.DUCK_THRESHOLD || '0.08', '--duck-ratio', env.DUCK_RATIO || '3',
        '--duck-attack', env.DUCK_ATTACK || '15', '--duck-release', env.DUCK_RELEASE || '350');
    } else aviso(`o mix.mjs de ${SKILL} não aceita --duck-*; a trilha abaixa sob a voz com os valores originais (veja vendor/README.md).`);
  }
  console.log(ultimaLinha(rodar('node', mix, { capturar: true, etapa: 'mixagem (mix.mjs)' }).stdout));
}

// ------------------------------------------------------------------ vídeo
function duracao(filme) {
  const d = Number(filme.cfg?.duration);
  if (filme.tipo === '3d' && !(d > 0)) falhar(`não sei a duração: ponha "duration" em ${filme.F}/film.json.`);
  return d > 0 ? d : 15;
}
// lê e confere as opções do render antes de qualquer etapa demorada
function planejarRender(filme, modo, o) {
  const final = modo === 'final';
  const dur = duracao(filme);
  const de = numero(o.de, 'de', { min: 0 }) ?? 0;
  let ate = numero(o.ate, 'ate', { min: 0 }) ?? dur;
  if (ate > dur) { aviso(`--ate ${ate} passa da duração do filme (${dur} s); vou até ${dur}.`); ate = dur; }
  if (!(ate > de)) falhar(`--ate (${ate}) precisa ser maior que --de (${de}).`);
  const parcial = de > 0 || ate < dur;
  const fps = numero(o.fps, 'fps', { inteiro: true, min: 1 }) ?? (final ? 60 : 30);
  const spp = numero(o.spp, 'spp', { inteiro: true, min: 1 }) ?? (final ? 192 : 128);
  const crf = numero(o.crf, 'crf', { inteiro: true, min: 0 }) ?? (final ? 18 : 20);
  const trecho = parcial ? `_${de}-${ate}s` : '';
  const saida = o.saida ? doUsuario(o.saida)
    : path.join(RAIZ, 'entrega', final ? 'finais' : 'previas', `${filme.nome}${final ? '' : '-previa'}${trecho}.mp4`);
  return { final, dur, de, ate, parcial, fps, spp, crf, saida };
}
function renderizar(filme, o, plano) {
  const { final, de, ate, parcial, fps, spp, crf, saida } = plano;
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  const mixWav = path.join(filme.audio, 'mix.wav');
  const temMix = fs.existsSync(mixWav);
  if (!temMix) aviso(`sem ${filme.F}/audio/mix.wav: o vídeo sai sem áudio (e o checar vai reprovar).`);
  const mostrarSaida = mostrar(saida);

  if (filme.tipo === '3d') {
    passo(`render ${final ? 'final' : 'de prévia'} 3D (${fps} fps, ${spp} amostras por quadro${parcial ? `, de ${de} a ${ate} s` : ''})`);
    const args = [RENDER3D, '--film', filme.F, '--range', `${de}:${ate}`, '--fps', String(fps), '--spp', String(spp), '--crf', String(crf), '--mp4', saida];
    if (temMix) args.push('--audio', mixWav);
    if (o.q) args.push('--q', o.q);
    if (o.limpo && final) args.push('--limpo', path.join(RAIZ, 'out', ...filme.F.split('/'), `${filme.nome}-limpo.mp4`));
    rodar('node', args, { etapa: 'render 3D (lib/3d/render.mjs)' });
  } else {
    if (o.spp !== undefined) aviso('--spp só vale para filmes 3D; o filme 2D ignora.');
    if (!fs.existsSync(RENDER2D)) falhar(`não achei o render.mjs do motion-reel em ${SKILL}.`);
    if (!fs.existsSync(path.join(filme.dir, 'beats.json'))) falhar(`faltou ${filme.F}/beats.json: rode antes o áudio (node fabrica.mjs audio ${filme.F}).`);
    const outFilme = path.join(RAIZ, 'out', ...filme.F.split('/'));
    if (final && !parcial) {
      passo(`render final 2D (${fps} fps, com desfoque de movimento)`);
      rodar('node', [RENDER2D, '--film', filme.F, '--format', '9x16', '--video-only', '--fps', String(fps)], { etapa: 'render 2D (motion-reel render.mjs)' });
      const video = path.join(outFilme, 'video_9x16.mp4');
      if (temMix) {
        rodar('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', mixWav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k',
          '-shortest', '-movflags', '+faststart', saida], { etapa: 'juntar vídeo e áudio (ffmpeg)' });
      } else fs.copyFileSync(video, saida);
    } else {
      passo(`render ${final ? 'final' : 'de prévia'} 2D (${fps} fps, ${final ? 'com' : 'sem'} desfoque${parcial ? `, de ${de} a ${ate} s` : ''})`);
      const args = [RENDER2D, '--film', filme.F, '--format', '9x16', '--range', `${de}:${ate}`, '--fps', String(fps)];
      if (!final) args.push('--noblur');
      rodar('node', args, { etapa: 'render 2D (motion-reel render.mjs)' });
      // o render.mjs grava out/<filme>/range_9x16_<de>-<ate>.mp4 (com a mixagem por baixo, se houver)
      fs.copyFileSync(path.join(outFilme, `range_9x16_${Number(de)}-${Number(ate)}.mp4`), saida);
    }
  }
  console.log(`\n${verde(final ? 'final:' : 'prévia:')} ${mostrarSaida}`);
  console.log(fraco(`confira: node fabrica.mjs checar ${mostrarSaida.split(path.sep).join('/')}`));
  return saida;
}

// ------------------------------------------------------------------ comandos
function exigirDependenciasNpm() {
  for (const p of ['three', 'playwright']) {
    if (!fs.existsSync(path.join(RAIZ, 'node_modules', p))) falhar(`faltam as dependências do npm (${p}). Rode: npm install  e depois  npx playwright install chromium`);
  }
}
function exigirFfmpeg() {
  for (const p of ['ffmpeg', 'ffprobe']) if (!achar(p)) falhar(`não achei o ${p}. Como instalar: ${comoInstalar(p)}`);
}

function cmdPreviaFinal(modo, pos, o) {
  if (pos.length > 1) falhar(`recebi mais de uma pasta (${pos.join(', ')}). Se você usou npm run, ponha "--" antes dos argumentos: npm run ${modo} -- ${pos[0]} --de 0 --ate 2`);
  exigirDependenciasNpm(); exigirFfmpeg(); binDoUv();
  const filme = resolverFilme(pos[0]);
  const plano = planejarRender(filme, modo, o);
  console.log(`${negrito(modo === 'final' ? 'Final' : 'Prévia')} de ${filme.F} (filme ${filme.tipo.toUpperCase()})`);
  if (o['sem-audio']) passo('áudio: pulado (--sem-audio); uso o audio/mix.wav que já existe');
  else fazerAudio(filme, o);
  renderizar(filme, o, plano);
}
function cmdAudio(pos, o) {
  if (pos.length > 1) falhar('recebi mais de uma pasta. Pelo npm: npm run audio -- <pasta-do-filme>');
  exigirDependenciasNpm(); exigirFfmpeg(); binDoUv();
  const filme = resolverFilme(pos[0]);
  fazerAudio(filme, o);
  console.log(`\n${verde('áudio:')} ${filme.F}/audio/mix.wav`);
}
function cmdContato(pos, o) {
  if (pos.length > 1) falhar('recebi mais de uma pasta. Pelo npm: npm run contato -- <pasta-do-filme>');
  exigirDependenciasNpm(); exigirFfmpeg();
  const filme = resolverFilme(pos[0]);
  if (filme.tipo === '3d') {
    const spp = numero(o.spp, 'spp', { inteiro: true, min: 1 }) ?? 24;
    passo(`folha de contato 3D (2 quadros por plano, ${spp} amostras)`);
    const args = [RENDER3D, '--film', filme.F, '--contact', '--spp', String(spp)];
    if (o.q) args.push('--q', o.q);
    rodar('node', args, { etapa: 'folha de contato (lib/3d/render.mjs)' });
    console.log(`\n${verde('folha de contato:')} out/${filme.F}/contato.jpg  ${verde('celular:')} out/${filme.F}/celular.jpg`);
  } else {
    if (!fs.existsSync(path.join(filme.dir, 'beats.json'))) falhar(`faltou ${filme.F}/beats.json: rode antes o áudio (node fabrica.mjs audio ${filme.F}).`);
    passo('folha de contato 2D (um quadro por tempo da música)');
    rodar('node', [RENDER2D, '--film', filme.F, '--format', '9x16', '--contact'], { etapa: 'folha de contato (motion-reel render.mjs)' });
    console.log(`\n${verde('folha de contato:')} out/${filme.F}/contact_9x16.png (páginas contact_9x16_pN.png)  ${verde('celular:')} out/${filme.F}/phone_9x16_pN.png`);
  }
  console.log(fraco('crítica: templates/critica.md'));
}

function cmdDemo() {
  exigirDependenciasNpm(); exigirFfmpeg(); binDoUv();
  if (!resolverPrograma('uv')) falhar(`não achei o uv. Como instalar: ${comoInstalar('uv')}`);
  if (!achar('mlx_whisper') && !achar('whisper')) falhar(`falta o Whisper (marca o tempo de cada palavra da narração). Instale com: ${comandoWhisper()}`);
  console.log(negrito('Demo: exemplos/demo com a voz grátis (Kokoro), trilha, efeitos, mixagem e prévia'));
  console.log(fraco('Na primeira vez o uv instala o PyTorch (~1 GB) e o Kokoro baixa o modelo (~330 MB): pode levar alguns minutos.'));
  passo('voz grátis (Kokoro, pf_dora)');
  rodar('uv', ['run', path.join('scripts', 'voz_kokoro.py'), 'demo', 'pf_dora', '1', '--roteiros', path.join('exemplos', 'demo', 'roteiro.json')], { etapa: 'voz grátis (scripts/voz_kokoro.py)' });
  passo('narração no tempo (Whisper)');
  rodar('uv', ['run', path.join('scripts', 'vo_montar.py'), path.join('exemplos', 'demo'), path.join('voz', 'demo', 'pf_dora-1.wav'), '--tempo', '1.0', '--pausa-max', '0.45'],
    { etapa: 'narração (scripts/vo_montar.py)' });
  const filme = resolverFilme(path.join(RAIZ, 'exemplos', 'demo'));
  fazerAudio(filme, {});
  renderizar(filme, {}, planejarRender(filme, 'previa', {}));
}

function cmdNovo(pos) {
  const [id, titulo, destArg] = pos;
  if (!id || !titulo) falhar('uso: node fabrica.mjs novo <id> "<título>" [pasta]   (ex.: node fabrica.mjs novo c01-agenda-cheia "Agenda cheia")');
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(id)) falhar('id inválido: use letras minúsculas sem acento, números, - e _ (ex.: c01-agenda-cheia).');
  const dest = destArg ? doUsuario(destArg) : path.join(RAIZ, 'criativos', id);
  if (fs.existsSync(dest)) falhar(`já existe: ${mostrar(dest)}`);
  const relDest = path.relative(RAIZ, dest);
  if (relDest.startsWith('..') || path.isAbsolute(relDest)) aviso('a pasta fica fora da fábrica: para renderizar, o filme precisa estar dentro dela (ex.: criativos/<id>).');
  const demo = path.join(RAIZ, 'exemplos', 'demo');
  fs.mkdirSync(dest, { recursive: true });
  for (const f of ['index.html', 'film.js', 'film.json', 'trilha.json', 'roteiro.json']) fs.copyFileSync(path.join(demo, f), path.join(dest, f));
  // título, id e o caminho relativo até lib/ (o demo está a dois níveis da raiz: ../../lib/)
  const rel = path.relative(dest, path.join(RAIZ, 'lib')).split(path.sep).join('/') + '/';
  const fj = JSON.parse(fs.readFileSync(path.join(dest, 'film.json'), 'utf8'));
  fj.title = titulo;
  fs.writeFileSync(path.join(dest, 'film.json'), JSON.stringify(fj, null, 1) + '\n');
  for (const f of ['index.html', 'film.js']) {
    let s = fs.readFileSync(path.join(dest, f), 'utf8').split('../../lib/').join(rel);
    if (f === 'index.html') {
      s = s.replace(/<title>[^<]*<\/title>/, `<title>${titulo.replace(/</g, '&lt;')}</title>`);
      // a marca do demo (window.MARCA) sai: o filme novo usa lib/marca.json
      s = s.replace(/<script>\s*\/\/ A marca do demo[\s\S]*?<\/script>\n/, '');
    }
    fs.writeFileSync(path.join(dest, f), s);
  }
  const rp = path.join(dest, 'roteiro.json');
  const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
  if (r.criativos && r.criativos[0]) { r.criativos[0].id = id; r.criativos[0].titulo = titulo; }
  fs.writeFileSync(rp, JSON.stringify(r, null, 2) + '\n');
  const d = mostrar(dest).split(path.sep).join('/');
  console.log(`${verde('criado:')} ${d}`);
  console.log('próximos passos:');
  console.log(`  1. escreva o roteiro em ${d}/roteiro.json (modelo em templates/roteiro.json)`);
  console.log(`  2. narração grátis: uv run scripts/voz_kokoro.py ${id} pf_dora --roteiros ${d}/roteiro.json`);
  console.log(`  3. configure a marca em lib/marca.json; reescreva ${d}/film.js (as cenas do demo estão presas às palavras dele) e ${d}/trilha.json`);
  console.log(`  4. node fabrica.mjs previa ${d}`);
}

// glob simples (* e ?) no nome do arquivo: o PowerShell e o cmd não expandem entrega/finais/*.mp4
function expandir(padrao) {
  if (!/[*?]/.test(path.basename(padrao))) return [padrao];
  const dir = path.dirname(padrao);
  const re = new RegExp('^' + path.basename(padrao).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', WIN ? 'i' : '');
  const abs = doUsuario(dir);
  if (!fs.existsSync(abs)) return [padrao];
  const achados = fs.readdirSync(abs).filter((f) => re.test(f)).sort().map((f) => path.join(dir, f));
  return achados.length ? achados : [padrao];
}
function cmdChecar(pos) {
  exigirFfmpeg();
  const lista = (pos.length ? pos : ['entrega/finais/*.mp4']).flatMap(expandir);
  const ALVO = Number(process.env.ALVO_LUFS ?? -14), TOL = Number(process.env.TOL_LUFS ?? 1);
  const linha = (c) => console.log(`${c[0].padEnd(34)} ${c[1].padEnd(11)} ${c[2].padEnd(7)} ${c[3].padEnd(9)} ${c[4].padEnd(6)} ${c[5].padEnd(8)} ${c[6].padEnd(8)} ${c[7]}`);
  linha(['arquivo', 'resolução', 'fps', 'pixel', 'áudio', 'LUFS', 'dBTP', 'resultado']);
  console.log('-'.repeat(100));
  let falhas = 0;
  for (const v of lista) {
    const abs = doUsuario(v), nome = path.basename(v).slice(0, 34);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) { console.log(`${nome.padEnd(34)} não existe  ${vermelho('FALHA')}`); falhas++; continue; }
    const info = rodar('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,pix_fmt', '-of', 'default=nw=1', abs], { capturar: true }).stdout || '';
    const campo = (k) => (new RegExp(`^${k}=(.*)$`, 'm').exec(info) || [])[1]?.trim() ?? '';
    const w = campo('width'), h = campo('height'), pix = campo('pix_fmt');
    const [num, den] = campo('r_frame_rate').split('/').map(Number);
    const fps = (num / (den || 1)) || 0;
    const na = (rodar('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', abs], { capturar: true }).stdout || '').split(/\r?\n/).filter((l) => l.trim()).length;
    let lufs = '-', tp = '-';
    if (na > 0) {
      const err = rodar('ffmpeg', ['-hide_banner', '-nostats', '-i', abs, '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-'], { capturar: true }).stderr || '';
      const resumo = err.slice(err.lastIndexOf('Summary:'));
      lufs = (/I:\s+(-?[\d.]+|-inf)\s+LUFS/.exec(resumo) || [])[1] ?? '-';
      tp = (/Peak:\s+(-?[\d.]+|-inf)\s+dBFS/.exec(resumo) || [])[1] ?? '-';
    }
    const motivos = [];
    if (!(w === '1080' && h === '1920')) motivos.push('resolução');
    if (!(fps >= 23.9 && fps <= 60.01)) motivos.push('fps');
    if (pix !== 'yuv420p') motivos.push('pixel');
    if (na > 0) {
      if (!(Math.abs(Number(lufs) - ALVO) <= TOL)) motivos.push('loudness');
      if (!(tp !== '-' && Number(tp) <= -1.0)) motivos.push('pico');
    } else motivos.push('sem áudio');
    const res = motivos.length ? vermelho(`FALHA (${motivos.join(' ')})`) : verde('PASSA');
    if (motivos.length) falhas++;
    linha([nome, `${w}x${h}`, fps.toFixed(3), pix, String(na), lufs, tp, res]);
  }
  console.log();
  if (falhas) { console.log(vermelho(`${falhas} arquivo(s) com FALHA`)); return 1; }
  console.log(verde(`tudo PASSA (alvo ${ALVO} ± ${TOL} LUFS, pico <= -1 dBTP)`));
  return 0;
}

// ------------------------------------------------------------------ verificar
function appleSilicon() {
  if (!MAC) return false;
  if (process.arch === 'arm64') return true;
  const r = spawnSync('sysctl', ['-n', 'hw.optional.arm64'], { encoding: 'utf8' });   // Node x64 rodando no Rosetta
  return r.status === 0 && r.stdout.trim() === '1';
}
function comandoWhisper() {
  return appleSilicon() ? 'uv tool install --python 3.12 mlx-whisper' : 'uv tool install --python 3.12 openai-whisper';
}
function versaoDe(nome, args = ['--version']) {
  const p = resolverPrograma(nome);
  if (!p) return null;
  const r = spawnSync(p.cmd, [...p.pre, ...args], { encoding: 'utf8', windowsHide: true, env: envFilho() });
  if (r.error || r.status !== 0) return null;
  return primeiraLinha(r.stdout || r.stderr);
}
function lerDotEnv() {
  const p = path.join(RAIZ, '.env'), o = {};
  if (!fs.existsSync(p)) return o;
  for (const l of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(l);
    if (m) o[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return o;
}
async function testarChromium() {
  const req = createRequire(path.join(RAIZ, 'noop.js'));
  let chromium;
  try {
    const m = await import(pathToFileURL(req.resolve('playwright')).href);
    chromium = m.chromium || m.default?.chromium;
  } catch { return { semPlaywright: true }; }
  let browser;
  try {
    browser = await chromium.launch({ args: argsChromium3D(), timeout: 90000 });
  } catch (e) {
    return { erroLancar: String(e.message || e).split('\n').find((l) => l.trim()) || 'não abriu' };
  }
  try {
    const page = await browser.newPage();
    const renderer = await page.evaluate(() => {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return null;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return { nome: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), webgl2: typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext };
    });
    return { versao: browser.version(), renderer };
  } catch (e) {
    return { versao: browser.version(), erroWebGL: String(e.message || e) };
  } finally { await browser.close(); }
}
async function cmdVerificar() {
  binDoUv();
  const linhas = [];
  const add = (estado, item, detalhe, conserto) => linhas.push({ estado, item, detalhe, conserto });
  console.log(negrito(`Fábrica de Criativos: conferência do ambiente (${NOME_SO}, ${process.arch})`));
  console.log(fraco(`pasta: ${RAIZ}`));
  console.log();

  // Node e npm
  const maior = Number(process.versions.node.split('.')[0]);
  if (maior >= 20) add('ok', 'Node.js', process.versions.node);
  else if (maior >= 18) add('aviso', 'Node.js', `${process.versions.node} (funciona, mas use 20 ou mais)`, comoInstalar('node'));
  else add('erro', 'Node.js', `${process.versions.node} (precisa de 20 ou mais)`, comoInstalar('node'));
  const npm = versaoDe('npm');
  npm ? add('ok', 'npm', npm) : add('erro', 'npm', 'não encontrado', comoInstalar('npm'));

  // uv (Python sob demanda)
  const uv = versaoDe('uv');
  uv ? add('ok', 'uv', `${uv.replace(/^uv\s+/, '').split(' ')[0]} (baixa sozinho o Python que cada script pede)`) : add('erro', 'uv', 'não encontrado', comoInstalar('uv'));

  // ffmpeg e ffprobe
  const ff = versaoDe('ffmpeg', ['-hide_banner', '-version']);
  if (ff) {
    const v = (/version\s+(\S+)/.exec(ff) || [])[1] || ff;
    const p = resolverPrograma('ffmpeg');
    const enc = spawnSync(p.cmd, [...p.pre, '-hide_banner', '-encoders'], { encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 24 }).stdout || '';
    /\blibx264\b/.test(enc) ? add('ok', 'ffmpeg', `${v} (com libx264)`)
      : add('erro', 'ffmpeg', `${v}, mas sem o codificador libx264 (o render precisa dele)`, comoInstalar('ffmpeg'));
  } else add('erro', 'ffmpeg', 'não encontrado', comoInstalar('ffmpeg'));
  const fp = versaoDe('ffprobe', ['-hide_banner', '-version']);
  fp ? add('ok', 'ffprobe', (/version\s+(\S+)/.exec(fp) || [])[1] || fp) : add('erro', 'ffprobe', 'não encontrado', comoInstalar('ffprobe'));

  // dependências do npm
  const versaoPacote = (p) => lerJson(path.join(RAIZ, 'node_modules', p, 'package.json'))?.version;
  const vThree = versaoPacote('three'), vPw = versaoPacote('playwright');
  if (vThree && vPw) add('ok', 'dependências npm', `three ${vThree}, playwright ${vPw}`);
  else add('erro', 'dependências npm', `faltando: ${[!vThree && 'three', !vPw && 'playwright'].filter(Boolean).join(', ')}`, 'npm install');

  // Chromium do Playwright + WebGL de verdade (as mesmas flags do render 3D)
  const instalarChromium = PLATAFORMA === 'linux' ? 'npx playwright install --with-deps chromium' : 'npx playwright install chromium';
  if (!vPw) {
    add('pulado', 'Chromium', 'conferido depois do npm install');
    add('pulado', 'WebGL (3D)', 'conferido depois do npm install');
  } else {
    if (process.stdout.isTTY) process.stdout.write(fraco('abrindo o Chromium para testar o WebGL...\r'));
    const t = await testarChromium();
    if (process.stdout.isTTY) process.stdout.write(' '.repeat(50) + '\r');
    if (t.semPlaywright) { add('erro', 'Chromium', 'o playwright não carregou', 'npm install'); add('pulado', 'WebGL (3D)', 'sem Chromium'); }
    else if (t.erroLancar) {
      const faltaNavegador = /Executable doesn't exist|playwright install/i.test(t.erroLancar);
      add('erro', 'Chromium', faltaNavegador ? 'não instalado' : `não abriu: ${t.erroLancar.slice(0, 160)}`, instalarChromium);
      add('pulado', 'WebGL (3D)', 'sem Chromium');
    } else {
      add('ok', 'Chromium', `${t.versao} (do Playwright)`);
      const r = t.renderer;
      if (!r) add('erro', 'WebGL (3D)', `indisponível${t.erroWebGL ? `: ${t.erroWebGL.slice(0, 120)}` : ''} (os filmes 3D não renderizam; os 2D, sim)`,
        WIN ? 'atualize o driver de vídeo (site da Intel, AMD ou NVIDIA) e rode de novo' : 'atualize o driver de vídeo e rode de novo');
      else if (renderizadorEmSoftware(r.nome)) add('aviso', 'WebGL (3D)', `software: ${r.nome} (o 3D funciona, mas bem mais devagar; o 2D não muda)`,
        PLATAFORMA === 'linux' ? 'com placa de vídeo, instale o driver dela; para testar outro caminho: FABRICA_ANGLE=vulkan node fabrica.mjs verificar' : 'atualize o driver de vídeo');
      else add('ok', 'WebGL (3D)', `GPU: ${r.nome}${r.webgl2 ? '' : ' (só WebGL 1)'}`);
    }
  }

  // Whisper (marca o tempo de cada palavra da narração)
  const mlx = achar('mlx_whisper'), whisper = achar('whisper');
  if (appleSilicon()) {
    if (mlx) add('ok', 'Whisper', 'mlx_whisper (Apple Silicon)');
    else if (whisper) add('ok', 'Whisper', 'whisper (openai-whisper); no Apple Silicon o mlx-whisper é mais rápido', null);
    else add('erro', 'Whisper', 'não encontrado (o demo e a narração precisam dele)', `${comandoWhisper()}   e depois   uv tool update-shell`);
  } else if (whisper) add('ok', 'Whisper', 'whisper (openai-whisper)');
  else add('erro', 'Whisper', 'não encontrado (o demo e a narração precisam dele)', `${comandoWhisper()}   e depois   uv tool update-shell`);

  // chaves opcionais (nunca imprime o valor)
  const dotenv = lerDotEnv();
  for (const [k, nome, uso] of [['ELEVENLABS_API_KEY', 'ElevenLabs', 'voz dirigida e trilha por IA, pagas'], ['FISH_API_KEY', 'Fish Audio', 'voz frase a frase']]) {
    const deOnde = (process.env[k] || '').trim() ? 'no ambiente' : (dotenv[k] || '').trim() ? 'no .env' : null;
    add('info', nome, deOnde ? `chave configurada ${deOnde} (opcional: ${uso})` : `sem chave (opcional: ${uso}; copie .env.example para .env)`);
  }

  const cores = { ok: verde, erro: vermelho, aviso: amarelo, info: fraco, pulado: fraco };
  for (const l of linhas) {
    console.log(`  ${cores[l.estado](SIMBOLO[l.estado])} ${l.item.padEnd(18)} ${l.detalhe}`);
    if (l.conserto && l.estado !== 'ok') console.log(`      ${fraco('como resolver:')} ${l.conserto}`);
  }
  const erros = linhas.filter((l) => l.estado === 'erro').length, avisos = linhas.filter((l) => l.estado === 'aviso').length;
  console.log();
  if (erros) {
    console.log(vermelho(`Falta${erros > 1 ? 'm' : ''} ${erros} ${erros > 1 ? 'itens obrigatórios' : 'item obrigatório'}.`) +
      ` O jeito mais fácil é rodar o instalador:\n  ${INSTALADOR}\nDepois feche e abra o terminal e rode de novo: node fabrica.mjs verificar`);
    return 1;
  }
  console.log(verde(`Tudo pronto${avisos ? ` (${avisos} aviso${avisos > 1 ? 's' : ''} acima)` : ''}.`) + ' Próximo passo: node fabrica.mjs demo');
  return 0;
}

// ------------------------------------------------------------------ ajuda
function cmdAjuda() {
  console.log(`${negrito('Fábrica de Criativos')}: anúncios em vídeo feitos com código. Rode da pasta do projeto.

  ${negrito('node fabrica.mjs verificar')}
      confere Node, npm, uv, ffmpeg, Chromium, WebGL e Whisper, e diz como resolver o que falta
  ${negrito('node fabrica.mjs demo')}
      o exemplo 2D de ponta a ponta com a voz grátis -> entrega/previas/demo-previa.mp4
  ${negrito('node fabrica.mjs novo')} meu-anuncio "Meu anúncio" [pasta]
      cria criativos/meu-anuncio a partir do exemplo
  ${negrito('node fabrica.mjs previa')} exemplos/bancada
      áudio + prévia (30 fps; 3D com 128 amostras) -> entrega/previas/bancada-previa.mp4
  ${negrito('node fabrica.mjs final')} exemplos/bancada
      áudio + final (60 fps; 3D com 192 amostras) -> entrega/finais/bancada.mp4
  ${negrito('node fabrica.mjs audio')} exemplos/bancada
      só o áudio: trilha, efeitos e mixagem em -14 LUFS -> exemplos/bancada/audio/mix.wav
  ${negrito('node fabrica.mjs contato')} exemplos/bancada
      folha de contato e folha de celular -> out/exemplos/bancada/
  ${negrito('node fabrica.mjs checar')} entrega/finais/bancada.mp4
      confere resolução, fps, pixel, áudio, loudness (-14 LUFS) e pico; PASSA ou FALHA

Opções de previa e final:
  --de S --ate S     renderiza só esse trecho, em segundos (teste rápido; o arquivo ganha _<de>-<ate>s no nome)
  --spp N            amostras por quadro do 3D (menos = mais rápido e com mais ruído)
  --fps N            quadros por segundo
  --saida ARQ.mp4    grava em outro arquivo
  --sem-audio        não refaz o áudio (usa o audio/mix.wav que já existe)
  --refazer-trilha   refaz a trilha sintetizada mesmo sem mudança no trilha.json
  --crf N, --limpo, --q "x=1"   compressão, master limpo (3D) e parâmetros extras da página

Pelo npm é igual, com "--" antes dos argumentos:
  npm run verificar        npm run demo        npm run previa -- exemplos/bancada --de 0 --ate 2
  npm run final -- exemplos/bancada            npm run checar -- entrega/finais/bancada.mp4
  npm run novo -- meu-anuncio "Meu anúncio"    npm run audio -- exemplos/bancada    npm run contato -- exemplos/bancada`);
}

// ------------------------------------------------------------------ principal
const COMANDOS = {
  ajuda: () => cmdAjuda(),
  verificar: () => cmdVerificar(),
  demo: () => cmdDemo(),
  novo: (pos) => cmdNovo(pos),
  previa: (pos, o) => cmdPreviaFinal('previa', pos, o),
  final: (pos, o) => cmdPreviaFinal('final', pos, o),
  audio: (pos, o) => cmdAudio(pos, o),
  contato: (pos, o) => cmdContato(pos, o),
  checar: (pos) => cmdChecar(pos),
};
const SINONIMOS = { help: 'ajuda', '-h': 'ajuda', '--help': 'ajuda', 'prévia': 'previa', 'áudio': 'audio', verifica: 'verificar', check: 'verificar' };

async function principal() {
  const [bruto, ...resto] = process.argv.slice(2);
  const nome = SINONIMOS[bruto] || bruto || 'ajuda';
  const cmd = COMANDOS[nome];
  if (!cmd) { console.error(vermelho(`comando desconhecido: ${bruto}`)); cmdAjuda(); return 1; }
  const { pos, o } = lerArgs(resto);
  if (o.ajuda) { cmdAjuda(); return 0; }
  const r = await cmd(pos, o);
  return typeof r === 'number' ? r : 0;
}

// exportado para os testes (scripts/testar_fabrica.mjs); só roda o comando quando chamado direto
export const _interno = { achar, resolverPrograma, cliDoNpm, envFilho, lerArgs, numero, eh3D, expandir, chavePath, comoInstalar, INSTALADOR };
function chamadoDireto() {
  try { return fs.realpathSync(path.resolve(process.argv[1])) === fs.realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}
const direto = Boolean(process.argv[1]) && chamadoDireto();
if (direto) {
  try {
    process.exitCode = await principal();
  } catch (e) {
    if (e instanceof ErroAmigavel) console.error(`\n${vermelho(SIMBOLO.erro)} ${e.message}`);
    else console.error(e);
    process.exitCode = 1;
  }
}
