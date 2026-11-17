// html2pdf.mjs: HTML -> PDF (A4) com o Chromium do Playwright, com rodapé de título e número de página.
//
// uso: node scripts/util/html2pdf.mjs <entrada.html> <saida.pdf> ["Título no rodapé"]
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [src, out, title = ''] = process.argv.slice(2);
if (!src || !out || src === '--help' || src === '-h') {
  console.log('uso: node scripts/util/html2pdf.mjs <entrada.html> <saida.pdf> ["Título no rodapé"]');
  process.exit(src ? 0 : 1);
}
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(pathToFileURL(path.resolve(src)).href, { waitUntil: 'networkidle' });
await p.emulateMedia({ media: 'print', colorScheme: 'light' });
await p.evaluate(() => document.fonts.ready);
await p.pdf({
  path: out, format: 'A4', printBackground: true, margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
  displayHeaderFooter: true, headerTemplate: '<span></span>',
  footerTemplate: `<div style="font:8px Helvetica,Arial;color:#888;width:100%;padding:0 16mm;display:flex;justify-content:space-between"><span>${esc(title)}</span><span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`,
});
await b.close();
console.log('ok', out);
