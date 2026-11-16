// Renderer for the 3-D films (lib/3d pipeline). Run from the repository root:
//
//   node lib/3d/render.mjs --film exemplos/bancada --meta                      -> <film>/trilha.json + out/<film>/hits.json
//   node lib/3d/render.mjs --film exemplos/bancada --contact --spp 24          -> out/<film>/contato.jpg + celular.jpg (half size)
//   node lib/3d/render.mjs --film exemplos/bancada --at 2.6,10.5 --spp 256     -> out/<film>/stills/
//   node lib/3d/render.mjs --film exemplos/bancada --range 0:32.3 --fps 30 --spp 128 --mp4 out/x.mp4 [--audio <film>/audio/mix.wav]
//        [--limpo out/limpo.mp4 --crf-limpo 14]   second master from the SAME render, finished 'limpo' (no grain, vignette, halation, CA), no audio
//
// Flags: --out <dir>  --q "acabamento=limpo&exp=1"  --per 2 (contact frames per shot)
// The film must honour window.seek(t) / filmReady and may expose SHOTS, HITS_S (seconds) and TRILHA.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const req = createRequire(path.join(ROOT, 'noop.js'));
const { chromium } = await import(pathToFileURL(req.resolve('playwright')).href).then((m) => (m.chromium ? m : m.default));

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] !== undefined && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const FILM = opt('film');
if (!FILM || !fs.existsSync(path.join(ROOT, FILM, 'index.html'))) { console.error('uso: node lib/3d/render.mjs --film <pasta> [--meta | --contact | --at t,t | --range a:b --mp4 f]'); process.exit(1); }
const W = Number(opt('w', 1080)), H = Number(opt('h', 1920)), FPS = Number(opt('fps', 30)), SPP = Number(opt('spp', 128));
const OUT = path.resolve(ROOT, opt('out', path.join('out', FILM)));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.hdr': 'application/octet-stream', '.wav': 'audio/wav' };
const server = http.createServer((q, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/${FILM}/index.html?render=1&fps=${FPS}&spp=${SPP}&w=${W}&h=${H}${opt('q') ? '&' + opt('q') : ''}`;
const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ff = (argv) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...argv], { stdio: 'inherit' }); if (r.status !== 0) throw new Error('ffmpeg falhou'); };
try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[page]', e.message));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/favicon|GPU stall|GL Driver Message|beats\.json/.test(m.text())) console.error(`[${m.type()}]`, m.text()); });
  page.on('response', (r) => { if (r.status() === 404 && !/favicon|beats\.json/.test(r.url())) console.error('[404]', r.url()); });
  await page.goto(url);
  await page.waitForFunction(() => window.filmReady === true || window.filmError, null, { timeout: 240000 });
  const err = await page.evaluate(() => window.filmError);
  if (err) throw new Error(err);
  fs.mkdirSync(OUT, { recursive: true });
  const shoot = async (t) => { const ms = await page.evaluate((t) => window.seek(t), t); return { ms, buf: await page.locator('#film').screenshot({ type: 'png' }) }; };
  if (flag('meta')) {
    const { hits, trilha, shots } = await page.evaluate(() => ({ hits: window.HITS_S, trilha: window.TRILHA, shots: window.SHOTS }));
    const beatsP = path.join(ROOT, FILM, 'beats.json'), b = fs.existsSync(beatsP) ? JSON.parse(fs.readFileSync(beatsP, 'utf8')) : null;
    fs.writeFileSync(path.join(OUT, 'hits.json'), JSON.stringify(hits.map(([t, label, sfx, o]) => ({ beat: b ? +((t - b.offset) / b.period).toFixed(3) : 0, t: +t.toFixed(4), label, ...(sfx ? { sfx } : {}), ...(o ? { opts: o } : {}) })), null, 1));
    fs.writeFileSync(path.join(ROOT, FILM, 'trilha.json'), JSON.stringify(trilha) + '\n');
    fs.writeFileSync(path.join(OUT, 'planos.json'), JSON.stringify(shots, null, 1));
    console.log(`${hits.length} eventos -> ${path.relative(ROOT, OUT)}/hits.json · trilha.json ${JSON.stringify(trilha)}`);
    console.log(shots.map((s) => `${s.id} ${s.t0.toFixed(2)}-${s.t1.toFixed(2)}`).join(' | '));
  } else if (flag('contrast')) {
    // WCAG contrast of every caption against the rendered frame behind it (window.capContrast)
    const shots = await page.evaluate(() => window.SHOTS);
    for (const s of shots) for (const k of [0.5, 0.92]) { const r = await page.evaluate((t) => window.capContrast && window.capContrast(t), s.t0 + (s.t1 - s.t0) * k); if (r) console.log(`${r.shot.padEnd(4)} t=${(s.t0 + (s.t1 - s.t0) * k).toFixed(2)}  tinta ${r.ink}:1  acento ${r.accent ?? '-'}${r.accent ? ':1' : ''}`); }
  } else if (flag('contact')) {
    const shots = await page.evaluate(() => window.SHOTS), per = Number(opt('per', 2)), dir = path.join(OUT, 'contato');
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const times = shots.flatMap((s) => Array.from({ length: per }, (_, i) => s.t0 + (s.t1 - s.t0) * (per === 1 ? 0.6 : 0.22 + 0.62 * i / (per - 1))));
    let sum = 0;
    for (let i = 0; i < times.length; i++) { const { ms, buf } = await shoot(times[i]); sum += ms; fs.writeFileSync(path.join(dir, `c${String(i).padStart(3, '0')}.png`), buf); }
    const cols = Number(opt('cols', 8)), rows = Math.ceil(times.length / cols);
    ff(['-framerate', '1', '-i', path.join(dir, 'c%03d.png'), '-frames:v', '1', '-vf', `scale=270:480:flags=area,pad=278:488:4:4:0x777777,tile=${cols}x${rows}`, '-q:v', '3', path.join(OUT, 'contato.jpg')]);
    ff(['-i', path.join(OUT, 'contato.jpg'), '-vf', 'scale=iw/2:-2:flags=area', '-q:v', '3', path.join(OUT, 'celular.jpg')]);
    console.log(`${times.length} quadros, ${(sum / times.length / 1000).toFixed(2)} s/quadro -> ${path.relative(ROOT, OUT)}/contato.jpg, celular.jpg`);
    console.log(times.map((t) => t.toFixed(2)).join(' '));
  } else if (opt('at')) {
    const dir = path.join(OUT, 'stills'); fs.mkdirSync(dir, { recursive: true });
    for (const t of opt('at').split(',').map(Number)) { const { ms, buf } = await shoot(t); const f = path.join(dir, `t${t.toFixed(2)}.png`); fs.writeFileSync(f, buf); console.log(`${path.relative(ROOT, f)}  ${(ms / 1000).toFixed(2)} s`); }
  } else if (opt('range')) {
    const [a, b] = opt('range').split(':').map(Number), mp4 = path.resolve(ROOT, opt('mp4', path.join(OUT, 'range.mp4'))), audio = opt('audio');
    fs.mkdirSync(path.dirname(mp4), { recursive: true });
    const argv = ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-'];
    if (audio) argv.push('-ss', String(a), '-t', String(b - a), '-i', path.resolve(ROOT, audio));
    argv.push('-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', opt('crf', '16'), '-profile:v', 'high',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', ...(audio ? ['-c:a', 'aac', '-b:a', '320k', '-shortest'] : ['-an']), '-movflags', '+faststart', mp4);
    const enc = spawn('ffmpeg', argv, { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => enc.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c}`)))));
    const limpo = opt('limpo') ? path.resolve(ROOT, opt('limpo')) : null;
    const enc2 = limpo ? spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', opt('crf-limpo', '14'), '-profile:v', 'high',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-an', '-movflags', '+faststart', limpo], { stdio: ['pipe', 'inherit', 'inherit'] }) : null;
    const done2 = enc2 ? new Promise((res, rej) => enc2.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg(limpo) ${c}`))))) : null;
    const f0 = Math.round(a * FPS), f1 = Math.round(b * FPS), t0 = Date.now(); let sum = 0;
    for (let f = f0; f < f1; f++) {
      const { ms, buf } = await shoot(f / FPS); sum += ms;
      if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once('drain', r));
      if (enc2) { await page.evaluate(() => window.refinish('limpo')); const b2 = await page.locator('#film').screenshot({ type: 'png' }); if (!enc2.stdin.write(b2)) await new Promise((r) => enc2.stdin.once('drain', r)); }
      if ((f - f0) % 30 === 29) process.stdout.write(`\r  ${f - f0 + 1}/${f1 - f0}  ${(sum / (f - f0 + 1) / 1000).toFixed(2)} s/quadro  restam ${(((Date.now() - t0) / (f - f0 + 1)) * (f1 - f - 1) / 60000).toFixed(1)} min   `);
    }
    enc.stdin.end(); await done; if (enc2) { enc2.stdin.end(); await done2; }
    console.log(`\n-> ${path.relative(ROOT, mp4)}  ${f1 - f0} quadros, ${(sum / (f1 - f0) / 1000).toFixed(2)} s/quadro de render, ${((Date.now() - t0) / 1000).toFixed(0)} s no total`);
  }
} finally { await browser.close(); server.close(); }
