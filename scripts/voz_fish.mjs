// Narração pela Fish Audio (https://fish.audio), com o mesmo formato de saída de voz_eleven.mjs e voz_kokoro.py,
// para voz_avaliar.py e vo_montar.py funcionarem sem mudança.
//
//   node scripts/voz_fish.mjs <id1,id2|all> <rotulo> <voice_id> [tomadas] [--modelo s2.1-pro-free] [--roteiros roteiros/roteiros.json] [--campo falas_fish] [--temperatura 0.7] [--top-p 0.7]
//   node scripts/voz_fish.mjs vozes [busca]          lista vozes em português da biblioteca (id | título | tags)
//
// A chave fica em .env (FISH_API_KEY=...), nunca no chat nem no git.
// Modelos (cabeçalho "model"): s2.1-pro-free (gratuito, uso justo), s2.1-pro, s2-pro, s1, drama-3.
// --temperatura  mais baixa (0,5–0,6) = entonação mais estável; mais alta = mais variação.
// --campo  usa outro campo do roteiro para o texto falado (ex.: falas_fish com a grafia natural, quando "falas"
//          tem grafia fonética para outra voz); sem ele, usa "falas".
// Saída: voz/<id>/texto.txt, voz/<id>/<rotulo>-<n>.mp3 e .wav (48 kHz mono). Licença: confira os termos do seu
// plano na Fish Audio antes de veicular anúncio pago; não use vozes que imitam pessoas reais.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const API = 'https://api.fish.audio';
const args = process.argv.slice(2);
const opt = (nome, padrao) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : padrao; };
const pos = args.filter((x, i) => !x.startsWith('--') && !['--modelo', '--roteiros', '--campo', '--temperatura', '--top-p'].includes(args[i - 1]));

if (!pos.length || args.includes('--help') || args.includes('-h')) {
  console.log(fs.readFileSync(new URL(import.meta.url)).toString().split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
  process.exit(pos.length ? 0 : 1);
}

function chave() {
  if (process.env.FISH_API_KEY) return process.env.FISH_API_KEY.trim();
  const env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
  const m = env.match(/^FISH_API_KEY=(.+)$/m);
  if (!m || !m[1].trim()) { console.error('Falta FISH_API_KEY no .env (veja .env.example).'); process.exit(1); }
  return m[1].trim().replace(/^["']|["']$/g, '');
}
const KEY = chave();

if (pos[0] === 'vozes') {
  const q = new URLSearchParams({ language: 'pt', page_size: '40', sort_by: 'score', ...(pos[1] ? { title: pos[1] } : {}) });
  const r = await fetch(`${API}/model?${q}`, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`GET /model: ${r.status} ${(await r.text()).slice(0, 300)}`);
  for (const m of (await r.json()).items || []) console.log(`${m._id} | ${m.title} | ${(m.tags || []).join(', ')}`);
  process.exit(0);
}

const [ids, rotulo, voz, tomadas = '2'] = pos;
const modelo = opt('--modelo', 's2.1-pro-free');
const campo = opt('--campo', 'falas');
const roteiros = JSON.parse(fs.readFileSync(opt('--roteiros', 'roteiros/roteiros.json'), 'utf8'));
const lista = ids === 'all' ? roteiros.criativos : roteiros.criativos.filter((c) => ids.split(',').includes(c.id));
if (!lista.length) { console.error(`Nenhum criativo encontrado para "${ids}".`); process.exit(1); }

for (const c of lista) {
  const falas = (c[campo] || c.falas).map((f) => (f === 'CTA' ? roteiros.cta_fala : f));
  const texto = falas.join(' ');
  const pasta = path.join('voz', c.id);
  fs.mkdirSync(pasta, { recursive: true });
  fs.writeFileSync(path.join(pasta, 'texto.txt'), texto + '\n');
  for (let n = 1; n <= Number(tomadas); n++) {
    const r = await fetch(`${API}/v1/tts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', model: modelo },
      body: JSON.stringify({ text: texto, reference_id: voz, format: 'mp3', mp3_bitrate: 192, normalize: true, latency: 'normal',
        temperature: Number(opt('--temperatura', '0.7')), top_p: Number(opt('--top-p', '0.7')) }),
    });
    if (!r.ok) throw new Error(`POST /v1/tts: ${r.status} ${(await r.text()).slice(0, 400)}`);
    const mp3 = path.join(pasta, `${rotulo}-${n}.mp3`);
    fs.writeFileSync(mp3, Buffer.from(await r.arrayBuffer()));
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', mp3, '-ar', '48000', '-ac', '1', mp3.replace(/\.mp3$/, '.wav')]);
    fs.appendFileSync(path.join('voz', 'caracteres.log'), `${new Date().toISOString()} fish ${modelo} ${c.id} ${rotulo} ${texto.length}\n`);
    console.log('ok', mp3);
  }
}
console.log('próximo passo: uv run scripts/voz_avaliar.py voz/<id>  e depois  uv run scripts/vo_montar.py <filme> voz/<id>/<tomada>.wav');
