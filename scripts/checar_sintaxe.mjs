// checar_sintaxe.mjs: confere a sintaxe de todo .js/.mjs (node --check) e .py (python -m py_compile) do repositório.
// Usado pelo `npm run check` e pela CI. Ignora node_modules, vendor, out e entrega.
//
// uso: node scripts/checar_sintaxe.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PULAR = new Set(['node_modules', 'vendor', 'out', 'entrega', 'voz', '.git', 'dist', 'skill']);
const arquivos = [];
(function andar(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (PULAR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) andar(p);
    else if (/\.(m?js|py)$/.test(e.name)) arquivos.push(p);
  }
})(raiz);

const py = spawnSync('python3', ['--version']).status === 0 ? 'python3' : 'python';
let falhas = 0;
for (const f of arquivos) {
  const r = f.endsWith('.py')
    ? spawnSync(py, ['-c', 'import sys, ast; ast.parse(open(sys.argv[1], encoding="utf-8").read(), sys.argv[1])', f], { encoding: 'utf8' })
    : spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) { falhas++; console.error(`FALHA ${path.relative(raiz, f)}\n${r.stderr}`); }
}
console.log(`${arquivos.length - falhas}/${arquivos.length} arquivos ok`);
process.exit(falhas ? 1 : 0);
