// svg2png.mjs: rasteriza um SVG em PNG com fundo transparente, na altura pedida (Chromium do Playwright).
// Útil para levar um logo vetorial para o filme (IMG.logo) ou para o After Effects (ae/logo3d).
//
// uso: node scripts/util/svg2png.mjs <entrada.svg> <saida.png> [altura_px=1200]
import { chromium } from 'playwright';
import fs from 'node:fs';

const [src, out, h = '1200'] = process.argv.slice(2);
if (!src || !out || src === '--help' || src === '-h') {
  console.log('uso: node scripts/util/svg2png.mjs <entrada.svg> <saida.png> [altura_px=1200]');
  process.exit(src ? 0 : 1);
}
const svg = fs.readFileSync(src, 'utf8');
const b = await chromium.launch();
const p = await b.newPage({ deviceScaleFactor: 1 });
await p.setContent(`<html><body style="margin:0;background:transparent"><img id=i style="height:${Number(h)}px;display:block" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body></html>`);
const el = await p.$('#i');
await el.screenshot({ path: out, omitBackground: true });
await b.close();
console.log('ok', out);
