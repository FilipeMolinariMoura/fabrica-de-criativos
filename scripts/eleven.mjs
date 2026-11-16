// eleven.mjs: ElevenLabs pela API (caminho PAGO de narração).
//
// A chave vem da variável de ambiente ELEVENLABS_API_KEY ou de um arquivo .env na raiz do repositório
// (ELEVENLABS_API_KEY=...). Nunca coloque a chave no código, no chat ou no git (.env já está no .gitignore).
//
// uso:
//   node scripts/eleven.mjs conta                          plano e caracteres usados no mês
//   node scripts/eleven.mjs vozes                          vozes da conta (inclusive as prontas da biblioteca)
//   node scripts/eleven.mjs falar <voice_id> <modelo> <saida.mp3> "<texto>" [stability] [style] [speed]
//        grava <saida.mp3> e <saida>.palavras.json (início e fim de cada palavra, do alinhamento da API)
//   modelos comuns: eleven_v3 (mais expressivo), eleven_multilingual_v2 (mais estável)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AJUDA = `uso:
  node scripts/eleven.mjs conta
  node scripts/eleven.mjs vozes
  node scripts/eleven.mjs falar <voice_id> <modelo> <saida.mp3> "<texto>" [stability] [style] [speed]
chave: ELEVENLABS_API_KEY no ambiente ou no arquivo .env da raiz`;

const [cmd, ...r] = process.argv.slice(2);
if (!cmd || cmd === '--help' || cmd === '-h') { console.log(AJUDA); process.exit(0); }

function lerChave() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  const arq = path.join(raiz, '.env');
  if (!fs.existsSync(arq)) return null;
  const env = fs.readFileSync(arq, 'utf8');
  return env.match(/^\s*ELEVENLABS_API_KEY\s*=\s*"?([^"\r\n]+)"?/m)?.[1]?.trim() ?? null;
}
const chave = lerChave();
if (!chave) { console.error('falta ELEVENLABS_API_KEY (no ambiente ou no .env da raiz). Sem chave? Use a voz grátis: scripts/voz_kokoro.py'); process.exit(1); }
const API = 'https://api.elevenlabs.io';

async function chamar(metodo, rota, corpo) {
  const resp = await fetch(API + rota, { method: metodo, headers: { 'xi-api-key': chave, ...(corpo ? { 'content-type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined });
  if (!resp.ok) throw new Error(`${metodo} ${rota}: ${resp.status} ${(await resp.text()).slice(0, 400)}`);
  return resp.json();
}
// alinhamento por caractere -> palavras com tempo
function palavras(al) {
  const out = []; let a = null;
  al.characters.forEach((c, i) => {
    if (/\s/.test(c)) { if (a) out.push(a); a = null; return; }
    if (!a) a = { w: '', t0: al.character_start_times_seconds[i], t1: 0 };
    a.w += c; a.t1 = al.character_end_times_seconds[i];
  });
  if (a) out.push(a);
  return out;
}

if (cmd === 'conta') {
  const u = await chamar('GET', '/v1/user/subscription');
  console.log(`plano ${u.tier} · ${u.character_count}/${u.character_limit} caracteres · clone instantâneo: ${u.can_use_instant_voice_cloning} · status ${u.status}`);
} else if (cmd === 'vozes') {
  const j = await chamar('GET', '/v2/voices?page_size=100');
  for (const v of j.voices) console.log(`${v.voice_id}  ${v.name} · ${v.category} · ${Object.values(v.labels || {}).join(', ')}`);
} else if (cmd === 'falar') {
  const [voz, modelo, saida, texto, stab = '0.4', style = '0.3', speed = '1.0'] = r;
  if (!voz || !modelo || !saida || !texto) { console.error(AJUDA); process.exit(1); }
  const vs = modelo === 'eleven_v3' ? { stability: Number(stab) } : { stability: Number(stab), similarity_boost: 0.8, style: Number(style), use_speaker_boost: true, speed: Number(speed) };
  const j = await chamar('POST', `/v1/text-to-speech/${voz}/with-timestamps?output_format=mp3_44100_128`, { text: texto, model_id: modelo, language_code: 'pt', voice_settings: vs });
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, Buffer.from(j.audio_base64, 'base64'));
  fs.writeFileSync(saida.replace(/\.mp3$/, '.palavras.json'), JSON.stringify(palavras(j.alignment)));
  console.log('ok', saida);
} else { console.error(AJUDA); process.exit(1); }
