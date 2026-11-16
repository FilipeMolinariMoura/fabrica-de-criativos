// Builds the ebook PDF: cover (no margins, no footer) + body (A4, footer with page numbers) with a page-numbered TOC.
//   node ebook/build.mjs            -> dist/Fabrica-de-Criativos.pdf
// Pass 1 renders the body, ebook/paginas.py finds the page of each chapter, pass 2 writes the numbers into the TOC.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out'); fs.mkdirSync(out, { recursive: true });
const footer = `<div style="font:7.5px Helvetica,Arial;color:#9a9294;width:100%;padding:0 18mm;display:flex;justify-content:space-between;letter-spacing:.06em">
  <span>FÁBRICA DE CRIATIVOS · GUIA PRÁTICO</span><span><span class="pageNumber"></span></span></div>`;

const b = await chromium.launch();
async function body(toc, file) {
  const p = await b.newPage();
  await p.goto('file://' + path.join(here, 'miolo.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  if (toc) await p.evaluate((m) => { for (const [k, v] of Object.entries(m)) { const el = document.querySelector(`[data-toc="${k}"]`); if (el) el.textContent = v; } }, toc);
  await p.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: footer });
  await p.close();
}
await body(null, path.join(out, 'pass1.pdf'));
const toc = JSON.parse(execFileSync('uv', ['run', '-q', '--with', 'pymupdf', 'python', '-I', path.join(here, 'paginas.py'), path.join(out, 'pass1.pdf')], { encoding: 'utf8' }));
await body(toc, path.join(out, 'miolo.pdf'));
const c = await b.newPage();
await c.goto('file://' + path.join(here, 'capa.html'), { waitUntil: 'networkidle' });
await c.evaluate(() => document.fonts.ready);
await c.pdf({ path: path.join(out, 'capa.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
await b.close();
execFileSync('uv', ['run', '-q', '--with', 'pymupdf', 'python', '-I', '-c',
  `import fitz,sys; d=fitz.open(sys.argv[1]); d.insert_pdf(fitz.open(sys.argv[2])); d.set_metadata({"title":"Fábrica de Criativos","subject":"Guia prático de criativos em motion design com IA"}); d.save(sys.argv[3]); print(d.page_count)`,
  path.join(out, 'capa.pdf'), path.join(out, 'miolo.pdf'), path.join(here, '..', 'dist', 'Fabrica-de-Criativos.pdf')], { stdio: 'inherit' });
console.log('toc', JSON.stringify(toc));
