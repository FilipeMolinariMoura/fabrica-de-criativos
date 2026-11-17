// voz_eleven.mjs: narração em bloco pela ElevenLabs para cada criativo do roteiro (caminho PAGO).
//
// uso:
//   node scripts/voz_eleven.mjs <id1,id2|all> <rotulo> <voice_id> <modelo> [tomadas] [--roteiros roteiros/roteiros.json]
//        [--tags] [--stab 0.5]
//
//   <rotulo>    nome curto da voz e do modelo, vira o nome do arquivo (ex.: grave-v3, suave-v2)
//   <voice_id>  id da voz na sua conta (node scripts/eleven.mjs vozes)
//   <modelo>    eleven_v3 | eleven_multilingual_v2 | ...
//   [tomadas]   quantas gerações por criativo (padrão 1); as que já existem são puladas
//   --roteiros  caminho do roteiro (padrão roteiros/roteiros.json; o formato está em templates/roteiro.json)
//   --tags      usa o campo "falas_dirigidas" (com marcações de tom do v3; o nome antigo "falas_v3" ainda vale)
//               quando existir. Para tomadas com semente, amostras de tom e diálogo: scripts/voz_dirigida.py
//   --stab      stability da voz (padrão 0.5)
//
// Saída (o mesmo formato da voz grátis, scripts/voz_kokoro.py):
//   voz/<id>/texto.txt               o texto limpo (sem marcações), que voz_avaliar.py e vo_montar.py conferem
//   voz/<id>/<rotulo>-<n>.mp3        a tomada como veio da API
//   voz/<id>/<rotulo>-<n>.wav        a mesma tomada em WAV 48 kHz mono (precisa de ffmpeg)
//   voz/<id>/<rotulo>-<n>.palavras.json
// Os caracteres gastos vão para voz/caracteres.log (todo plano tem limite mensal).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const a = process.argv.slice(2);
const opt = (n, d) => (a.includes(n) ? a[a.indexOf(n) + 1] : d);
const pos = a.filter((x, i) => !x.startsWith('--') && !['--roteiros', '--stab'].includes(a[i - 1]));
const [ids, rotulo, voz, modelo] = pos;
if (a.includes('--help') || a.includes('-h') || !ids || !rotulo || !voz || !modelo) {
  console.log('uso: node scripts/voz_eleven.mjs <id1,id2|all> <rotulo> <voice_id> <modelo> [tomadas] [--roteiros arq.json] [--tags] [--stab 0.5]');
  process.exit(ids ? 1 : 0);
}
const tomadas = Number(pos[4] || 1);
const tags = a.includes('--tags');
const stab = opt('--stab', '0.5');
const rot = path.resolve(opt('--roteiros', path.join(raiz, 'roteiros/roteiros.json')));
if (!fs.existsSync(rot)) { console.error(`roteiro não encontrado: ${rot} (modelo em templates/roteiro.json)`); process.exit(1); }
const dados = JSON.parse(fs.readFileSync(rot, 'utf8'));
const alvo = dados.criativos.filter((c) => ids === 'all' || ids.split(',').includes(c.id));
if (!alvo.length) { console.error(`nenhum criativo com id ${ids} em ${rot}`); process.exit(1); }
const temFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

for (const c of alvo) {
  const dirigidas = c.falas_dirigidas || c.falas_v3;
  const falas = (tags && dirigidas) ? [].concat(dirigidas).map((f) => (typeof f === 'string' ? f : (f.texto ?? f.frase))) : c.falas;
  const texto = falas.map((f) => (f === 'CTA' ? dados.cta_fala : f)).join(' ');
  const limpo = c.falas.map((f) => (f === 'CTA' ? dados.cta_fala : f)).join(' ');
  const pasta = path.join(raiz, 'voz', c.id);
  fs.mkdirSync(pasta, { recursive: true });
  fs.writeFileSync(path.join(pasta, 'texto.txt'), limpo + '\n');
  for (let n = 1; n <= tomadas; n++) {
    const saida = path.join(pasta, `${rotulo}${tags ? '-tags' : ''}-${n}.mp3`);
    if (fs.existsSync(saida)) continue;
    execFileSync(process.execPath, [path.join(raiz, 'scripts', 'eleven.mjs'), 'falar', voz, modelo, saida, texto, stab], { stdio: 'inherit' });
    fs.appendFileSync(path.join(raiz, 'voz/caracteres.log'), `${new Date().toISOString()} ${c.id} ${rotulo} ${texto.length}\n`);
    if (temFfmpeg) execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', saida, '-ar', '48000', '-ac', '1', saida.replace(/\.mp3$/, '.wav')]);
  }
}
console.log(`pronto. Próximo passo: uv run scripts/voz_avaliar.py voz/<id>`);
