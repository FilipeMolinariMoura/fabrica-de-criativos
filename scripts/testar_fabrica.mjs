// testar_fabrica.mjs: testes rápidos do fabrica.mjs e de lib/3d/gpu.mjs, sem rodar render nem instalar nada.
// Simula Windows, macOS e Linux trocando process.platform antes de carregar o módulo: confere como cada
// sistema acha os programas (PATHEXT, .cmd, npm), as flags de GPU e a leitura dos argumentos.
// Não substitui um teste numa máquina Windows de verdade (o módulo path continua o do sistema que roda o teste).
//
// uso: node scripts/testar_fabrica.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const plataformaReal = Object.getOwnPropertyDescriptor(process, 'platform');
const envReal = { ...process.env };
let n = 0;
const teste = async (nome, fn) => { await fn(); n++; console.log(`ok  ${nome}`); };

async function carregarComo(plataforma, env = {}) {
  Object.defineProperty(process, 'platform', { value: plataforma, configurable: true });
  for (const k of Object.keys(process.env)) if (!(k in envReal)) delete process.env[k];
  Object.assign(process.env, envReal, env);
  try {
    const url = pathToFileURL(path.join(RAIZ, 'fabrica.mjs')).href + `?p=${plataforma}&n=${Math.random()}`;
    return (await import(url))._interno;
  } finally {
    Object.defineProperty(process, 'platform', plataformaReal);
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fabrica-teste-'));
const bin = path.join(tmp, 'bin');
fs.mkdirSync(bin);
for (const f of ['uv.exe', 'ffmpeg.exe', 'whisper.EXE', 'algo.cmd', 'uv']) { fs.writeFileSync(path.join(bin, f), ''); fs.chmodSync(path.join(bin, f), 0o755); }

try {
  const { argsChromium3D, renderizadorEmSoftware } = await import(pathToFileURL(path.join(RAIZ, 'lib', '3d', 'gpu.mjs')).href);
  await teste('gpu: ANGLE Metal no macOS, D3D11 no Windows, padrão no Linux', () => {
    assert.deepEqual(argsChromium3D('darwin', ''), ['--font-render-hinting=none', '--disable-lcd-text', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']);
    assert.ok(argsChromium3D('win32', '').includes('--use-angle=d3d11'));
    assert.ok(!argsChromium3D('linux', '').some((a) => a.startsWith('--use-angle')));
    assert.ok(argsChromium3D('linux', 'vulkan').includes('--use-angle=vulkan'));
    assert.ok(renderizadorEmSoftware('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)'));
    assert.ok(renderizadorEmSoftware('ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0)'));
    assert.ok(!renderizadorEmSoftware('ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)'));
    assert.ok(!renderizadorEmSoftware('ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)'));
  });

  const win = await carregarComo('win32', { PATH: bin, PATHEXT: '.COM;.EXE;.BAT;.CMD', ComSpec: 'C:\\Windows\\system32\\cmd.exe' });
  await teste('win32: acha uv.exe, ffmpeg.exe e WHISPER.EXE pelo PATHEXT (sem diferenciar maiúsculas)', () => {
    assert.equal(win.achar('uv'), path.join(bin, 'uv.exe'));
    assert.equal(win.achar('ffmpeg'), path.join(bin, 'ffmpeg.exe'));
    assert.equal(win.achar('whisper')?.toLowerCase(), path.join(bin, 'whisper.exe').toLowerCase());   // o disco do Windows não diferencia
    assert.equal(win.achar('programa-que-nao-existe'), null);
  });
  await teste('win32: .cmd roda pelo cmd.exe (o Node não roda .cmd sem shell)', () => {
    const r = win.resolverPrograma('algo');
    assert.equal(r.cmd, 'C:\\Windows\\system32\\cmd.exe');
    assert.deepEqual(r.pre, ['/d', '/c', path.join(bin, 'algo.cmd')]);
  });
  await teste('win32: node é o próprio Node; npm e npx viram node + npm-cli.js', () => {
    assert.deepEqual(win.resolverPrograma('node'), { cmd: process.execPath, pre: [] });
    const npm = win.resolverPrograma('npm');
    if (npm) assert.ok(npm.cmd === process.execPath && /npm-cli\.js$/.test(npm.pre[0]), JSON.stringify(npm));
  });
  await teste('win32: o PATH dos filhos usa a chave que já existe (Path), sem duplicar', () => {
    assert.equal(win.chavePath({ Path: 'a', OTHER: 'b' }), 'Path');
    const env = win.envFilho();
    const chaves = Object.keys(env).filter((k) => k.toUpperCase() === 'PATH');
    assert.equal(chaves.length, 1);
    assert.equal(env.PYTHONUTF8, '1');
    assert.equal(env.PYTHONIOENCODING, 'utf-8');
    assert.ok(env.SKILL.endsWith(path.join('vendor', 'motion-reel', 'skills', 'motion-reel')));
  });
  await teste('win32: instruções do winget e do instalador PowerShell', () => {
    assert.match(win.comoInstalar('ffmpeg'), /winget install -e --id Gyan\.FFmpeg/);
    assert.match(win.comoInstalar('uv'), /astral-sh\.uv/);
    assert.match(win.comoInstalar('node'), /OpenJS\.NodeJS\.LTS/);
    assert.equal(win.INSTALADOR, 'powershell -ExecutionPolicy Bypass -File instalar\\windows.ps1');
  });
  await teste('win32: glob de entrega/finais/*.MP4 sem diferenciar maiúsculas', () => {
    const d = path.join(tmp, 'finais'); fs.mkdirSync(d);
    for (const f of ['a.mp4', 'b.MP4', 'c.txt']) fs.writeFileSync(path.join(d, f), '');
    assert.deepEqual(win.expandir(path.join(d, '*.mp4')).map((f) => path.basename(f)), ['a.mp4', 'b.MP4']);
  });

  const mac = await carregarComo('darwin', { PATH: bin });
  await teste('darwin: só acha executável com permissão, sem extensão', () => {
    fs.chmodSync(path.join(bin, 'ffmpeg.exe'), 0o644);
    assert.equal(mac.achar('uv'), path.join(bin, 'uv'));
    assert.equal(mac.achar('ffmpeg.exe'), null);   // sem permissão de execução
    assert.equal(mac.achar('programa-que-nao-existe'), null);
    assert.match(mac.comoInstalar('ffmpeg'), /brew install ffmpeg/);
  });
  const lin = await carregarComo('linux', { PATH: bin });
  await teste('linux: instruções do apt, NodeSource e instalador do uv', () => {
    assert.match(lin.comoInstalar('ffmpeg'), /apt install ffmpeg/);
    assert.match(lin.comoInstalar('node'), /deb\.nodesource\.com\/setup_22\.x/);
    assert.match(lin.comoInstalar('uv'), /astral\.sh\/uv\/install\.sh/);
    assert.equal(lin.INSTALADOR, 'bash instalar/linux.sh');
  });

  await teste('argumentos: opções com e sem =, vírgula decimal, erro em opção desconhecida', () => {
    const { pos, o } = mac.lerArgs(['exemplos/bancada', '--de', '0', '--ate=1,5', '--spp', '8', '--sem-audio']);
    assert.deepEqual(pos, ['exemplos/bancada']);
    assert.equal(mac.numero(o.ate, 'ate'), 1.5);
    assert.equal(mac.numero(o.spp, 'spp', { inteiro: true, min: 1 }), 8);
    assert.equal(o['sem-audio'], true);
    assert.throws(() => mac.lerArgs(['--velocidade', '2']), /opção desconhecida/);
    assert.throws(() => mac.lerArgs(['--spp']), /faltou o valor/);
    assert.throws(() => mac.numero('abc', 'fps'), /precisa ser/);
  });
  await teste('filmes: bancada é 3D, demo e divulgacao são 2D', () => {
    assert.equal(mac.eh3D(path.join(RAIZ, 'exemplos', 'bancada')), true);
    assert.equal(mac.eh3D(path.join(RAIZ, 'exemplos', 'demo')), false);
    assert.equal(mac.eh3D(path.join(RAIZ, 'exemplos', 'divulgacao')), false);
  });
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
  for (const k of Object.keys(process.env)) if (!(k in envReal)) delete process.env[k];
  Object.assign(process.env, envReal);
}
console.log(`\n${n} testes ok`);
