import puppeteer from 'puppeteer-core';
import fs from 'fs';
fs.mkdirSync('sp', { recursive: true });
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: 1200, height: 900 });
p.on('pageerror', (e) => console.log('pageerror', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('err', m.text()); });
await p.goto('http://127.0.0.1:8766/sprites.html?v=' + Date.now()); await p.waitForFunction('window.ready===true', { timeout: 60000 });
const save = (name, url) => fs.writeFileSync(`sp/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
const tones = {
  g1: { base: '#2b5424', mid: '#487a30', edge: '#86a644', trans: 0.28 },
  g2: { base: '#386a2e', mid: '#66963f', edge: '#a8c45a', trans: 0.3 },
  g3: { base: '#47742f', mid: '#86a63c', edge: '#cdc05a', trans: 0.32 },
  a1: { base: '#855614', mid: '#d09421', edge: '#efc650', trans: 0.34 },
  a2: { base: '#965712', mid: '#dd9d28', edge: '#f2d36a', trans: 0.34 },
  a3: { base: '#78460f', mid: '#c4841f', edge: '#e6b848', trans: 0.3 },
};
const meta = { leaves: {} };
for (const [k, t] of Object.entries(tones)) { const r = await p.evaluate((t) => window.sprites.renderLeaf(t, 700, 509), t); save('leaf_' + k, r.url); meta.leaves[k] = { anchor: r.anchor, w: r.w, h: r.h, unit: r.unit }; }
const hero = await p.evaluate((t) => window.sprites.renderLeaf(t, 1320, 960), { base: '#2c5a26', mid: '#5f9040', edge: '#c3c15a', trans: 0.32 });
save('leaf_hero', hero.url); meta.hero = { anchor: hero.anchor, w: hero.w, h: hero.h, unit: hero.unit };
const walk = [0, 1.6, 3.2, 4.8];
for (let i = 0; i < 4; i++) save('bug_walk' + i, await p.evaluate((ph) => window.sprites.renderBug({ open: 0, leg: 1, ph, wing: 0 }), walk[i]));
save('bug_fly0', await p.evaluate(() => window.sprites.renderBug({ open: 1, leg: 0.2, ph: 0, wing: 0.6 })));
save('bug_fly1', await p.evaluate(() => window.sprites.renderBug({ open: 1, leg: 0.2, ph: 1, wing: -0.2 })));
save('fruit_green', await p.evaluate(() => window.sprites.renderFruit(false)));
save('fruit_ripe', await p.evaluate(() => window.sprites.renderFruit(true)));
fs.writeFileSync('sp/meta.json', JSON.stringify(meta, null, 1));
console.log(JSON.stringify(meta.hero), Object.keys(meta.leaves).length, 'leaves');
await b.close();
