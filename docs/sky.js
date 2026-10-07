// Living sky for the leaf portfolio. The page follows the visitor's local time (dawn, morning, day, evening, dusk, night)
// and can be set by hand; changing it runs a short time-lapse. Everything here is 2D canvas drawn from a few cached layers.
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const hx = (h) => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixK = (a, b, t) => (Array.isArray(a) ? a.map((v, i) => mixK(v, b[i], t)) : lerp(a, b, t));

// key looks over a 24 hour day (hours are local clock hours)
const K = [
  { h: 0, acc: '#dfe878', top: '#050a14', mid: '#0b1626', hor: '#16282f', hill: ['#0d1a16', '#09130f', '#050c09'], card: '#0b1311', tint: [14, 26, 70, 0.42], star: 1, cloudC: '#3a4a66', cloudA: 0.22, sunI: 0, rays: 0, mist: 0.10, mistC: '#2a3c52' },
  { h: 5, acc: '#dfe878', top: '#060b16', mid: '#0d1828', hor: '#1a2b34', hill: ['#0d1a16', '#09130f', '#050c09'], card: '#0b1311', tint: [14, 26, 70, 0.42], star: 1, cloudC: '#3a4a66', cloudA: 0.22, sunI: 0, rays: 0, mist: 0.12, mistC: '#2a3c52' },
  { h: 6.3, acc: '#ffa985', top: '#2a4c63', mid: '#b48c8e', hor: '#f4bf80', hill: ['#34463a', '#2a3b2f', '#1b2a20'], card: '#15221a', tint: [255, 168, 108, 0.15], star: 0.1, cloudC: '#ffd2b4', cloudA: 0.55, sunI: 1, rays: 0.10, mist: 0.34, mistC: '#f2cdb0' },
  { h: 8.6, acc: '#f6b85a', top: '#3f7aa0', mid: '#8fbcc6', hor: '#f1dcae', hill: ['#456a45', '#385a3b', '#26442d'], card: '#13241a', tint: [255, 236, 200, 0.06], star: 0, cloudC: '#ffffff', cloudA: 0.6, sunI: 1, rays: 0.09, mist: 0.2, mistC: '#e8eed8' },
  { h: 12, acc: '#f4c94e', top: '#2f6f9e', mid: '#78b3d0', hor: '#c6e2e6', hill: ['#44703f', '#37603a', '#264a2e'], card: '#12251a', tint: [255, 255, 240, 0.02], star: 0, cloudC: '#ffffff', cloudA: 0.7, sunI: 1, rays: 0.06, mist: 0.1, mistC: '#dcecec' },
  { h: 16, acc: '#f6b45a', top: '#3a76a2', mid: '#86b3c8', hor: '#ead9b0', hill: ['#46683c', '#385836', '#26442b'], card: '#13241a', tint: [255, 230, 190, 0.05], star: 0, cloudC: '#fff6e6', cloudA: 0.62, sunI: 1, rays: 0.09, mist: 0.12, mistC: '#ecdcb8' },
  { h: 17.9, acc: '#ff9a5a', top: '#445f86', mid: '#cf9a7c', hor: '#f6b25e', hill: ['#4f4a30', '#3d4430', '#2a3626'], card: '#221a17', tint: [255, 160, 84, 0.16], star: 0, cloudC: '#ffc08a', cloudA: 0.6, sunI: 1, rays: 0.12, mist: 0.24, mistC: '#f0b88a' },
  { h: 19.1, acc: '#ff8a72', top: '#262c52', mid: '#86486a', hor: '#e07a4e', hill: ['#2c2531', '#221f2b', '#161922'], card: '#201919', tint: [255, 118, 84, 0.12], star: 0.35, cloudC: '#e8907c', cloudA: 0.45, sunI: 0.6, rays: 0.08, mist: 0.2, mistC: '#c88a8a' },
  { h: 20.6, acc: '#c9b0ff', top: '#0e1630', mid: '#27294a', hor: '#583a4c', hill: ['#171a24', '#101520', '#0a0e16'], card: '#0f1514', tint: [56, 76, 150, 0.22], star: 0.85, cloudC: '#4c5478', cloudA: 0.3, sunI: 0, rays: 0, mist: 0.14, mistC: '#3a3a5a' },
  { h: 22, acc: '#dfe878', top: '#050a14', mid: '#0b1626', hor: '#16282f', hill: ['#0d1a16', '#09130f', '#050c09'], card: '#0b1311', tint: [14, 26, 70, 0.42], star: 1, cloudC: '#3a4a66', cloudA: 0.22, sunI: 0, rays: 0, mist: 0.10, mistC: '#2a3c52' },
  { h: 24, acc: '#dfe878', top: '#050a14', mid: '#0b1626', hor: '#16282f', hill: ['#0d1a16', '#09130f', '#050c09'], card: '#0b1311', tint: [14, 26, 70, 0.42], star: 1, cloudC: '#3a4a66', cloudA: 0.22, sunI: 0, rays: 0, mist: 0.10, mistC: '#2a3c52' },
];
const KP = K.map((k) => ({ h: k.h, top: hx(k.top), mid: hx(k.mid), hor: hx(k.hor), hill: k.hill.map(hx), card: hx(k.card), tint: k.tint, star: k.star, cloudC: hx(k.cloudC), cloudA: k.cloudA, sunI: k.sunI, rays: k.rays, mist: k.mist, mistC: hx(k.mistC), acc: hx(k.acc) }));
function sample(h) {
  h = ((h % 24) + 24) % 24; let i = 0; while (i < KP.length - 2 && h >= KP[i + 1].h) i++;
  const a = KP[i], b = KP[i + 1], f = smooth((h - a.h) / (b.h - a.h)), o = {};
  for (const k in a) if (k !== 'h') o[k] = mixK(a[k], b[k], f);
  return o;
}
export const MODES = { dawn: 6.6, day: 12.8, dusk: 18.7, night: 22.8 };
export function phaseName(h) { h = ((h % 24) + 24) % 24; return h < 5 ? 'Night' : h < 7.5 ? 'Dawn' : h < 11.5 ? 'Morning' : h < 16.2 ? 'Day' : h < 18.8 ? 'Evening' : h < 20.6 ? 'Dusk' : 'Night'; }
export function greeting(h) { h = ((h % 24) + 24) % 24; return h < 4.5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night'; }
const nowHour = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; };

export function createSky(canvas, onVars) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, mode = 'auto', hour = nowHour(), P = sample(hour), tw = null, lastVarKey = '', lastBuild = -1, buildKey = '';
  const ptr = { x: 0.5, y: 0.5, px: 0, py: 0, speed: 0, gust: 0 };
  let stars = null, hills = [], clouds = [], cloudSprites = [], birds = null, shoot = null, nextShoot = 6, nextBird = 9;
  const R = rand(5);
  const COL = (c) => rgb(c);

  // ---- cached layers
  const drawCloudSprite = (c, col) => {
    const w = 460, h = 170; c.width = w; c.height = h; const x = c.getContext('2d'); const r = rand(c.__seed || 1);
    for (let i = 0; i < 26; i++) { const cx = 90 + r() * 280, cy = 96 - Math.abs(cx - 230) * 0.12 - r() * 36, rad = 26 + r() * 46; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, rgb(col, 0.5)); g.addColorStop(0.6, rgb(col, 0.2)); g.addColorStop(1, rgb(col, 0)); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rad, 0, TAU); x.fill(); }
  };
  const ridge = (c, base, amp, seed, colTop, colBot, density, rmin, rmax, blur, lightC) => {
    c.width = W; c.height = Math.ceil(H * 0.5); const x = c.getContext('2d'), r = rand(seed), ph = [r() * 9, r() * 9, r() * 9, r() * 9];
    const yAt = (px) => base + amp * (0.5 * Math.sin(px * 0.0042 + ph[0]) + 0.28 * Math.sin(px * 0.011 + ph[1]) + 0.14 * Math.sin(px * 0.027 + ph[2]) + 0.06 * Math.sin(px * 0.071 + ph[3]));
    if (blur) x.filter = `blur(${blur}px)`;
    const g = x.createLinearGradient(0, base - amp, 0, c.height); g.addColorStop(0, rgb(colTop)); g.addColorStop(1, rgb(colBot)); x.fillStyle = g;
    x.beginPath(); x.moveTo(0, c.height); for (let px = 0; px <= W; px += 6) x.lineTo(px, yAt(px)); x.lineTo(W, c.height); x.closePath(); x.fill();
    // a woodland canopy: many small crowns, lit on their upper side, so the ridge reads as trees and not as a shape
    const n = Math.ceil(W / 2 * density);
    for (let i = 0; i < n; i++) {
      const px = r() * W, rad = rmin + r() * (rmax - rmin), cy = yAt(px) + rad * 0.2 + r() * rad * 1.6, s = 0.84 + r() * 0.3;
      x.fillStyle = rgb([colTop[0] * s, colTop[1] * s, colTop[2] * s]); x.beginPath(); x.ellipse(px, cy, rad, rad * 0.9, 0, 0, TAU); x.fill();
      if (rad > 3.2) { x.fillStyle = rgb(lightC, 0.20 + r() * 0.12); x.beginPath(); x.ellipse(px - rad * 0.22, cy - rad * 0.3, rad * 0.62, rad * 0.5, 0, 0, TAU); x.fill(); }
    }
    x.filter = 'none';
  };
  function build() {
    const c = P.hill, ground = H * 0.5, hz = P.hor, warm = [P.hor[0], P.hor[1], P.hor[2]], mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
    const cols = [mixc(c[0], hz, 0.42), mixc(c[1], hz, 0.18), c[2]], dark = (k, f) => [k[0] * f, k[1] * f, k[2] * f];
    const spec = [[ground * 0.46, ground * 0.15, 11, 0.9, 2.2, 3.6, 1.6], [ground * 0.62, ground * 0.12, 18, 0.9, 3.4, 6.5, 1.0], [ground * 0.8, ground * 0.07, 25, 0.75, 5, 10, 0.5]];
    hills = [0, 1, 2].map((i) => { const cv = hills[i] || document.createElement('canvas'); const [b, am, sd, dn, r0, r1, bl] = spec[i]; ridge(cv, b, am, sd, cols[i], dark(cols[i], 0.5), dn, r0, r1, bl, mixc(cols[i], hz, 0.55)); return cv; });
    cloudSprites = cloudSprites.length ? cloudSprites : [0, 1, 2, 3, 4].map((i) => { const cv = document.createElement('canvas'); cv.__seed = 40 + i * 13; return cv; });
    cloudSprites.forEach((cv) => drawCloudSprite(cv, P.cloudC));
  }
  function buildStars() {
    stars = document.createElement('canvas'); stars.width = W; stars.height = Math.ceil(H * 0.78); const x = stars.getContext('2d'), r = rand(77);
    for (let i = 0; i < 260; i++) { const a = 0.25 + r() * 0.75, s = r() < 0.08 ? 1.6 : r() < 0.3 ? 1.1 : 0.7; x.fillStyle = `rgba(${r() < 0.3 ? '255,232,200' : '214,228,255'},${a})`; x.beginPath(); x.arc(r() * W, Math.pow(r(), 1.3) * stars.height, s, 0, TAU); x.fill(); }
    clouds = Array.from({ length: 7 }, (_, i) => ({ x: r() * W * 1.2, y: H * (0.06 + r() * 0.3), s: 0.5 + r() * 0.8, v: 4 + r() * 8, i: i % 5, z: 0.4 + r() * 0.6 }));
    twk = Array.from({ length: 34 }, () => ({ x: r() * W, y: Math.pow(r(), 1.3) * H * 0.7, ph: r() * TAU, k: 0.6 + r() * 1.5 }));
  }
  let twk = [];
  function resize() { W = innerWidth; H = innerHeight; canvas.width = W; canvas.height = H; buildStars(); P = sample(hour); build(); buildKey = ''; }
  resize(); addEventListener('resize', resize);

  // ---- control
  function setMode(m) {
    mode = m;
    const to = m === 'auto' ? nowHour() : MODES[m];
    const from = hour, d = (((to - from) % 24) + 24) % 24;
    tw = { from, to: from + (d < 0.01 ? 0 : d), t0: performance.now(), dur: m === 'auto' && d < 0.2 ? 500 : Math.min(2600, 900 + d * 160) };
  }
  const phase = () => ({ hour: ((hour % 24) + 24) % 24, name: phaseName(hour), greet: greeting(hour), mode, night: P.star > 0.5, light: P.sunI > 0.5 });

  // ---- celestial positions
  const sunPos = () => { const t = clamp((((hour % 24) + 24) % 24 - 6) / 12.8, -0.12, 1.12); return { x: W * (0.1 + 0.8 * t), y: H * (0.84 - 0.7 * Math.sin(Math.PI * clamp(t, 0, 1))) , t }; };
  const moonPos = () => { const hh = ((hour % 24) + 24) % 24, u = ((hh - 19 + 24) % 24) / 11.5, t = clamp(u, -0.1, 1.1); return { x: W * (0.12 + 0.76 * t), y: H * (0.8 - 0.62 * Math.sin(Math.PI * clamp(t, 0, 1))), t }; };

  function frame(t, dt, scroll, pointer) {
    // time
    if (tw) { const k = clamp((performance.now() - tw.t0) / tw.dur), e = smooth(k); hour = lerp(tw.from, tw.to, e); if (k >= 1) { hour = tw.to; tw = null; } }
    else if (mode === 'auto') hour = nowHour();
    P = sample(hour);
    // keep derived layers in step with the palette, but not every frame
    const key = P.hill[0].map((v) => v >> 3).join() + P.cloudC.map((v) => v >> 3).join() + (P.hill[1][1] >> 3);
    if (key !== buildKey && t - lastBuild > 0.12) { build(); buildKey = key; lastBuild = t; }
    // css variables follow the sky
    const vk = P.card.map((v) => v | 0).join() + '|' + P.acc.map((v) => v | 0).join() + '|' + P.tint[3].toFixed(2);
    if (vk !== lastVarKey) { lastVarKey = vk; onVars && onVars(P, phase()); }

    const px = (pointer.x - 0.5), sc = scroll;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.82); g.addColorStop(0, COL(P.top)); g.addColorStop(0.55, COL(P.mid)); g.addColorStop(1, COL(P.hor)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // stars + twinkle + shooting star
    if (P.star > 0.02) {
      ctx.globalAlpha = P.star; ctx.drawImage(stars, px * -8, sc * -20);
      for (const s of twk) { const a = (0.35 + 0.65 * Math.abs(Math.sin(t * s.k + s.ph))) * P.star; ctx.fillStyle = `rgba(255,248,230,${a})`; ctx.beginPath(); ctx.arc(s.x + px * -8, s.y + sc * -20, 1.5, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (t > nextShoot && !shoot && P.star > 0.7) { shoot = { x: W * (0.3 + Math.random() * 0.6), y: H * (0.05 + Math.random() * 0.25), t0: t }; nextShoot = t + 9 + Math.random() * 9; }
      if (shoot) { const k = (t - shoot.t0) / 0.8; if (k > 1) shoot = null; else { const x0 = shoot.x - k * 260, y0 = shoot.y + k * 120, gg = ctx.createLinearGradient(x0, y0, x0 + 90, y0 - 42); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(1, `rgba(255,255,255,${0.85 * (1 - k)})`); ctx.strokeStyle = gg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + 90, y0 - 42); ctx.stroke(); } }
    }
    // sun
    const S = sunPos();
    if (P.sunI > 0.01) {
      const r = Math.max(W, H) * (0.5 + 0.15 * (1 - Math.sin(Math.PI * clamp(S.t, 0, 1))));
      const warm = 1 - Math.sin(Math.PI * clamp(S.t, 0, 1)); // redder near the horizon
      const gg = ctx.createRadialGradient(S.x + px * -14, S.y, 0, S.x + px * -14, S.y, r);
      gg.addColorStop(0, `rgba(255,${236 - warm * 70 | 0},${190 - warm * 90 | 0},${0.55 * P.sunI})`); gg.addColorStop(0.12, `rgba(255,${200 - warm * 50 | 0},${140 - warm * 60 | 0},${0.22 * P.sunI})`); gg.addColorStop(1, 'rgba(255,170,110,0)');
      ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
      const d = ctx.createRadialGradient(S.x + px * -14, S.y, 0, S.x + px * -14, S.y, 34); d.addColorStop(0, `rgba(255,252,236,${P.sunI})`); d.addColorStop(0.55, `rgba(255,${240 - warm * 40 | 0},${200 - warm * 60 | 0},${0.9 * P.sunI})`); d.addColorStop(1, 'rgba(255,220,160,0)'); ctx.fillStyle = d; ctx.beginPath(); ctx.arc(S.x + px * -14, S.y, 34, 0, TAU); ctx.fill();
    }
    // moon
    if (P.star > 0.3) {
      const M = moonPos(), a = clamp((P.star - 0.3) / 0.5), mx = M.x + px * -10, my = M.y;
      const hg = ctx.createRadialGradient(mx, my, 10, mx, my, 150); hg.addColorStop(0, `rgba(190,208,255,${0.30 * a})`); hg.addColorStop(1, 'rgba(190,208,255,0)'); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(mx, my, 150, 0, TAU); ctx.fill();
      ctx.globalAlpha = a; const mg = ctx.createRadialGradient(mx - 6, my - 6, 2, mx, my, 26); mg.addColorStop(0, '#fbfbf2'); mg.addColorStop(1, '#cdd3dc'); ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, 24, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(150,158,176,.34)'; for (const [dx, dy, rr] of [[-7, -5, 6], [8, 4, 5], [-2, 10, 4], [9, -9, 3]]) { ctx.beginPath(); ctx.arc(mx + dx, my + dy, rr, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    // light shafts
    if (P.rays > 0.01 && P.sunI > 0.3) {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) { const ang = 0.5 + i * 0.22 + 0.05 * Math.sin(t * 0.18 + i), L = Math.max(W, H) * 1.3, x1 = S.x + Math.cos(ang) * L, y1 = S.y + Math.sin(ang) * L, spread = 0.07 + i * 0.02; const rg = ctx.createLinearGradient(S.x, S.y, x1, y1); rg.addColorStop(0, `rgba(255,228,170,${P.rays * P.sunI * (0.8 - i * 0.12)})`); rg.addColorStop(1, 'rgba(255,228,170,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(S.x + Math.cos(ang - spread) * L, S.y + Math.sin(ang - spread) * L); ctx.lineTo(S.x + Math.cos(ang + spread) * L, S.y + Math.sin(ang + spread) * L); ctx.closePath(); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
    }
    // clouds drift on the breeze and parallax with the pointer
    for (const c of clouds) {
      c.x += c.v * dt * c.z; if (c.x > W + 260) c.x = -480 * c.s;
      ctx.globalAlpha = P.cloudA * (0.55 + 0.45 * c.z); const w = 460 * c.s, h = 170 * c.s; ctx.drawImage(cloudSprites[c.i], c.x + px * -22 * c.z, c.y + sc * -34 * c.z, w, h);
    }
    ctx.globalAlpha = 1;
    // distant birds by day
    nextBird = nextBird; if (P.sunI > 0.4 && P.star < 0.2) {
      if (!birds && t > nextBird) { birds = { t0: t, y: H * (0.14 + Math.random() * 0.14), dir: Math.random() < 0.5 ? 1 : -1 }; nextBird = t + 30 + Math.random() * 25; }
      if (birds) { const k = (t - birds.t0) / 16; if (k > 1) birds = null; else { ctx.strokeStyle = 'rgba(20,34,30,.55)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; for (let i = 0; i < 5; i++) { const lag = (i % 3) * 0.018 + (i > 2 ? 0.01 : 0), kk = k - lag, bx = birds.dir > 0 ? -60 + kk * (W + 120) : W + 60 - kk * (W + 120), by = birds.y + Math.abs(i - 2) * 14 + Math.sin(kk * 14 + i) * 5, f = Math.sin(t * 9 + i * 1.3) * 5; ctx.beginPath(); ctx.moveTo(bx - 9, by - f); ctx.quadraticCurveTo(bx - 4, by - 4 - f * 0.4, bx, by); ctx.quadraticCurveTo(bx + 4, by - 4 - f * 0.4, bx + 9, by - f); ctx.stroke(); } } }
    } else birds = null;
    // ridges with mist between them
    const hy = H * 0.5;
    for (let i = 0; i < 3; i++) {
      const par = [0.25, 0.5, 0.8][i];
      ctx.drawImage(hills[i], px * -26 * par, H - hills[i].height + sc * -26 * par - 6 + [-0.04 * H, 0.04 * H, 0.12 * H][i] * 0.5);
      if (i < 2) { const my = H - hy * 0.9 + sc * -20 * par + i * H * 0.07; const mg = ctx.createLinearGradient(0, my - 90, 0, my + 70); mg.addColorStop(0, rgb(P.mistC, 0)); mg.addColorStop(0.55, rgb(P.mistC, P.mist * (i ? 0.7 : 1))); mg.addColorStop(1, rgb(P.mistC, 0)); ctx.fillStyle = mg; ctx.fillRect(0, my - 90, W, 160); }
    }
  }

  // ---- foreground drawn in front of the tree: grass, drifting pollen, fireflies
  const blades = Array.from({ length: 140 }, (_, i) => ({ x: (i + R() * 0.8) / 140, h: 14 + R() * 30, k: R() * TAU, w: 0.8 + R() * 1.2, tone: R() }));
  const motes = Array.from({ length: 46 }, () => ({ x: R(), y: R(), z: 0.3 + R() * 0.7, ph: R() * TAU, v: 0.004 + R() * 0.01 }));
  const flies = Array.from({ length: 16 }, () => ({ x: R(), y: 0.35 + R() * 0.6, ph: R() * TAU, k: 0.2 + R() * 0.4, bl: 0.6 + R() * 1.4 }));
  const glow = (() => { const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d'), g = x.createRadialGradient(24, 24, 0, 24, 24, 24); g.addColorStop(0, 'rgba(255,250,180,1)'); g.addColorStop(0.2, 'rgba(236,246,120,.7)'); g.addColorStop(1, 'rgba(180,230,70,0)'); x.fillStyle = g; x.fillRect(0, 0, 48, 48); return c; })();
  function fore(c, w, h, t, pointer, reduce) {
    const gust = reduce ? 0 : pointer.gust, g0 = P.hill[2];
    // grass along the bottom edge
    c.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      c.strokeStyle = rgb(pass ? [g0[0] * 0.8, g0[1] * 0.8, g0[2] * 0.8] : [g0[0] * 1.5 + 6, g0[1] * 1.6 + 8, g0[2] * 1.4 + 4]); c.beginPath();
      for (const b of blades) { if ((b.tone > 0.5) !== (pass === 1)) continue; const x = b.x * w, sway = reduce ? 0 : Math.sin(t * 1.3 + b.k + b.x * 6) * (3 + gust * 9) + gust * 6; c.lineWidth = b.w; c.moveTo(x, h + 2); c.quadraticCurveTo(x + sway * 0.4, h - b.h * 0.55, x + sway, h - b.h); }
      c.stroke();
    }
    const day = P.star < 0.45;
    if (day && P.sunI > 0.2) { // pollen and dust motes in the light
      c.fillStyle = `rgba(255,240,200,${0.5 * P.sunI})`;
      for (const m of motes) { m.y -= m.v * 0.016 * (reduce ? 0 : 1); if (m.y < -0.02) m.y = 1.02; const x = (m.x + 0.02 * Math.sin(t * 0.5 + m.ph)) * w, y = m.y * h; c.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 0.8 + m.ph)); c.beginPath(); c.arc(x, y, 0.9 + m.z * 1.3, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
    }
    if (P.star > 0.45 && !reduce) { // a soft lantern glow follows the pointer at night
      const a = clamp((P.star - 0.45) / 0.4), lx = pointer.x * w, ly = pointer.y * h, lg = c.createRadialGradient(lx, ly, 0, lx, ly, 180);
      lg.addColorStop(0, `rgba(255,214,140,${0.16 * a})`); lg.addColorStop(1, 'rgba(255,214,140,0)'); c.globalCompositeOperation = 'lighter'; c.fillStyle = lg; c.fillRect(lx - 180, ly - 180, 360, 360); c.globalCompositeOperation = 'source-over';
    }
    if (P.star > 0.45) { // fireflies; they drift toward the pointer
      const a = clamp((P.star - 0.45) / 0.4);
      for (const f of flies) {
        let x = (f.x + 0.08 * Math.sin(t * f.k + f.ph) + 0.03 * Math.sin(t * f.k * 2.3 + f.ph * 2)) * w, y = (f.y + 0.05 * Math.cos(t * f.k * 1.3 + f.ph)) * h;
        const dx = pointer.x * w - x, dy = pointer.y * h - y, dd = Math.hypot(dx, dy); if (dd < 260 && !reduce) { const k = (1 - dd / 260) * 38; x += dx / dd * k; y += dy / dd * k; }
        const bl = Math.pow(Math.max(0, Math.sin(t * f.bl + f.ph)), 3); c.globalAlpha = a * (0.25 + 0.75 * bl); c.drawImage(glow, x - 12, y - 12, 24, 24);
      }
      c.globalAlpha = 1;
    }
  }
  return { frame, fore, setMode, phase, ptr, get P() { return P; }, get hour() { return hour; }, get mode() { return mode; }, tint: () => P.tint };
}
