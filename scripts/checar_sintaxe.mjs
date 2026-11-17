// checar_sintaxe.mjs: conferência rápida do repositório inteiro, sem renderizar nada e sem instalar dependência.
// Usado pelo `make sintaxe`, pelo `npm run check` e pela CI. Olha os arquivos que o git enxerga (rastreados e
// novos não ignorados), fora de node_modules, vendor, dist, out, entrega e voz.
//
//   1. sintaxe: todo .js/.mjs (node --check), todo .py (ast.parse) e todo .sh (bash -n)
//   2. todo .json é JSON válido
//   3. imports: todo pacote importado pelo nome (ex.: 'three') está no package.json, e o importmap de cada
//      index.html aponta para um pacote declarado
//   4. filmes: as fontes e os scripts locais que cada exemplos/*/index.html pede existem
//   5. as peças da versão 2 estão no lugar (lib/3d, exemplos/bancada, voz dirigida)
//   6. nenhum arquivo de texto traz caminho de pasta pessoal ou temporária da máquina de alguém, nem chave de API
//
// uso: node scripts/checar_sintaxe.mjs
import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PULAR = new Set(['node_modules', 'vendor', 'out', 'entrega', 'voz', '.git', 'dist', 'skill', '__pycache__', '.venv']);
const rel = (f) => path.relative(raiz, f).split(path.sep).join('/');

// ------------------------------------------------------------------ arquivos
function doGit() {
  const r = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: raiz, encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) return null;
  return r.stdout.split('\0').filter(Boolean);
}
function andando() {
  const out = [];
  (function andar(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (PULAR.has(e.name) || (/^\.env(\..*)?$/.test(e.name) && e.name !== '.env.example')) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) andar(p); else if (e.isFile()) out.push(path.relative(raiz, p));
    }
  })(raiz);
  return out;
}
const arquivos = (doGit() ?? andando())
  .filter((f) => !f.split('/').some((seg) => PULAR.has(seg)))
  .map((f) => path.join(raiz, f))
  .filter((f) => { try { return fs.lstatSync(f).isFile(); } catch { return false; } });
const com = (re) => arquivos.filter((f) => re.test(f));

const falhas = [];
const falhar = (onde, msg) => falhas.push(`FALHA ${onde}: ${msg}`);
const linhas = [];

// ------------------------------------------------------------------ 1. sintaxe
const js = com(/\.m?js$/), py = com(/\.py$/), sh = com(/\.sh$/);
for (const f of js) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) falhar(rel(f), `sintaxe\n${r.stderr.trim()}`);
}
if (py.length) {
  // python3 (macOS/Linux), python (Windows) ou, sem nenhum dos dois, o Python que o uv baixa
  const roda = (c, a) => spawnSync(c, a, { encoding: 'utf8', windowsHide: true });
  const [cmd, pre] = roda('python3', ['--version']).status === 0 ? ['python3', []]
    : roda('python', ['--version']).status === 0 ? ['python', []] : ['uv', ['run', '--no-project', '-q', 'python']];
  const prog = 'import sys, ast\nfor f in sys.argv[1:]:\n    try:\n        ast.parse(open(f, encoding="utf-8").read(), f)\n'
    + '    except SyntaxError as e:\n        print(f"{f}\\t{e.msg} (linha {e.lineno})")\n';
  const r = spawnSync(cmd, [...pre, '-c', prog, ...py], { encoding: 'utf8', windowsHide: true });
  if (r.status !== 0) falhar('python', `não consegui rodar ${cmd}: ${(r.stderr || '').trim().slice(0, 300)}`);
  for (const l of (r.stdout || '').split('\n').filter(Boolean)) { const [f, m] = l.split('\t'); falhar(rel(f), `sintaxe: ${m}`); }
}
// no Windows (o bash ali pode ser o do WSL, que não entende C:\...) e sem bash, a sintaxe dos .sh fica para a CI
const temBash = sh.length > 0 && process.platform !== 'win32' && !spawnSync('bash', ['--version']).error;
for (const f of temBash ? sh : []) {
  const r = spawnSync('bash', ['-n', f], { encoding: 'utf8' });
  if (r.status !== 0) falhar(rel(f), `sintaxe\n${(r.stderr || '').trim()}`);
}
linhas.push(`sintaxe: ${js.length} js/mjs, ${py.length} py, ${sh.length} sh${sh.length && !temBash ? ' (sh pulados aqui; a CI confere)' : ''}`);

// ------------------------------------------------------------------ 2. JSON
const json = com(/\.json$/);
for (const f of json) {
  try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { falhar(rel(f), `JSON inválido: ${e.message}`); }
}
linhas.push(`json: ${json.length} arquivos`);

// ------------------------------------------------------------------ 3. imports
const pkg = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'));
const declarados = new Set([...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})]);
const nativos = new Set(builtinModules);
const pacote = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
const usados = new Set();
for (const f of js) {
  const src = fs.readFileSync(f, 'utf8');
  const specs = [...src.matchAll(/^\s*import\s+(?:[^'"\n;]*?\s+from\s+)?['"]([^'"\n]+)['"]/gm), ...src.matchAll(/^\s*export\s+[^'"\n;]*?\s+from\s+['"]([^'"\n]+)['"]/gm),
    ...src.matchAll(/\bimport\(\s*['"]([^'"\n]+)['"]\s*\)/g)].map((m) => m[1]);
  for (const s of specs) {
    if (/^(\.|\/|node:|https?:|data:)/.test(s) || nativos.has(pacote(s))) continue;
    usados.add(pacote(s));
    if (!declarados.has(pacote(s))) falhar(rel(f), `importa '${s}', mas '${pacote(s)}' não está no package.json`);
  }
}
const html = com(/\.html$/);
for (const f of html) {
  const m = /<script[^>]*type=["']importmap["'][^>]*>([\s\S]*?)<\/script>/i.exec(fs.readFileSync(f, 'utf8'));
  if (!m) continue;
  let mapa;
  try { mapa = JSON.parse(m[1]).imports || {}; } catch (e) { falhar(rel(f), `importmap não é JSON válido: ${e.message}`); continue; }
  for (const [nome, alvo] of Object.entries(mapa)) {
    const nm = /^\/?node_modules\/((?:@[^/]+\/)?[^/]+)\//.exec(alvo);
    if (nm && !declarados.has(nm[1])) falhar(rel(f), `importmap '${nome}' aponta para ${nm[1]}, que não está no package.json`);
  }
}
linhas.push(`imports: pacotes usados pelo nome: ${[...usados].sort().join(', ') || 'nenhum'}`);

// ------------------------------------------------------------------ 4. o que cada filme de exemplo pede
let pedidos = 0;
for (const f of html.filter((h) => /^exemplos\/[^/]+\/index\.html$/.test(rel(h)))) {
  const src = fs.readFileSync(f, 'utf8');
  const refs = [...src.matchAll(/url\(\s*['"]?([^'")\s]+)['"]?\s*\)/g), ...src.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/g)].map((m) => m[1]);
  for (const r of refs) {
    if (/^(https?:|data:|\/|#)/.test(r)) continue;
    pedidos++;
    const alvo = path.resolve(path.dirname(f), r.split(/[?#]/)[0]);
    if (!fs.existsSync(alvo)) falhar(rel(f), `pede ${r}, que não existe`);
  }
}
linhas.push(`filmes de exemplo: ${pedidos} fontes e scripts locais conferidos`);

// ------------------------------------------------------------------ 5. peças da versão 2
const PECAS = ['lib/3d/render.mjs', 'exemplos/bancada/index.html', 'exemplos/bancada/film.js', 'exemplos/bancada/film.json',
  'scripts/voz_dirigida.py', 'scripts/finalizar3d.sh', 'templates/roteiro.json'];
const vistos = new Set(arquivos.map(rel));
for (const p of PECAS) if (!vistos.has(p)) falhar(p, 'faltou (ou está ignorado pelo git)');
const em = (pasta) => [...vistos].filter((f) => f.startsWith(pasta + '/') && /\.(m?js|json|html)$/.test(f)).length;
linhas.push(`versão 2: lib/3d com ${em('lib/3d')} arquivos conferidos, exemplos/bancada com ${em('exemplos/bancada')}`);
if (!declarados.has('three')) falhar('package.json', "lib/3d precisa de 'three' nas dependências");

// ------------------------------------------------------------------ 6. caminhos locais e chaves
const TEXTO = /\.(m?js|jsx|py|sh|json|md|html|css|svg|ya?ml|cff|txt|toml)$|(^|\/)(Makefile|\.env\.example|\.gitignore|LICENSE)$/;
const PROIBIDO = [
  [/(?:^|[\s"'`(=:<>])\/(?:Users|home)\/(?!runner\/|voce\/|usuario\/)[A-Za-z][\w.-]*\//, 'caminho de pasta pessoal'],
  [/\/private\/(?:tmp|var)\//, 'caminho de pasta temporária local'],
  [/\b[A-Za-z]:\\Users\\[A-Za-z]/, 'caminho de pasta pessoal'],
  [/\bsk_[A-Za-z0-9]{24,}/, 'parece chave de API'],
  [/\bsk-[A-Za-z0-9_-]{32,}/, 'parece chave de API'],
  [/^\s*(?:ELEVENLABS_API_KEY|FISH_API_KEY|ANTHROPIC_API_KEY)\s*=\s*["']?[A-Za-z0-9_-]{16,}/m, 'chave de API preenchida'],
];
let lidos = 0;
for (const f of arquivos.filter((a) => TEXTO.test(rel(a)))) {
  if (fs.statSync(f).size > 1_500_000) continue;
  lidos++;
  const partes = fs.readFileSync(f, 'utf8').split('\n');
  partes.forEach((l, i) => {
    for (const [re, oque] of PROIBIDO) if (re.test(l)) falhar(`${rel(f)}:${i + 1}`, `${oque} (tire antes de publicar)`);
  });
}
linhas.push(`caminhos locais e chaves: ${lidos} arquivos de texto lidos`);

// ------------------------------------------------------------------ resultado
for (const l of linhas) console.log(l);
if (falhas.length) {
  console.error('\n' + falhas.join('\n'));
  console.error(`\n${falhas.length} problema(s).`);
  process.exit(1);
}
console.log(`${arquivos.length} arquivos conferidos, tudo ok`);
