import puppeteer from 'puppeteer-core';
import fs from 'fs';
// node frames2.mjs page.html outdir W H FPS T  -- crops nothing, one PNG per frame via canvas toDataURL not needed: screenshot
const [page, out, W, H, FPS, T] = process.argv.slice(2);
const N = +FPS * +T;
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: +W, height: +H });
p.on('pageerror', (e) => console.log('pageerror', e.message));
await p.goto('http://127.0.0.1:8766/' + page); await p.waitForFunction('window.ready===true', { timeout: 120000 });
fs.mkdirSync(out, { recursive: true }); const t0 = Date.now();
for (let i = 0; i < N; i++) { await p.evaluate(`renderAt(${(i / +FPS).toFixed(5)})`); await p.screenshot({ path: `${out}/f${String(i).padStart(3, '0')}.png`, type: 'png' }); }
console.log('done', N, ((Date.now() - t0) / 1000).toFixed(1) + 's'); await b.close();
