// A realistic 2D ginkgo for the page background, built from rendered sprites.
// Scroll-driven story: the ladybug flies off, the leaf falls and lands, a tree grows across the page,
// fruit sets and ripens, then the canopy turns autumn gold leaf by leaf.
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const easeOut = (v) => 1 - Math.pow(1 - clamp(v), 3);
const backOut = (v) => { v = clamp(v); const c = 1.4; return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2); };
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const hex = (h) => { h = h.trim().replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

function buildTree(seed = 33) {
  const R = rand(seed); let id = 0; const all = [];
  function branch(len, width, depth, t0, ang) {
    const dur = depth === 0 ? 0.17 : 0.12 + 0.02 * depth;
    const b = { id: id++, len, width, depth, t0, t1: t0 + dur, ang, bend: (R() - 0.5) * 0.4, sway: R() * TAU, kids: [], leaves: [], fruit: null };
    all.push(b);
    if (depth >= 2) { const n = depth >= 4 ? 3 : 2; for (let i = 0; i < n; i++) b.leaves.push({ f: 0.3 + R() * 0.65, side: R() < 0.5 ? -1 : 1, rot: (R() - 0.5) * 0.9, s: 0.85 + R() * 0.4, tone: R(), auto: R() }); }
    if (depth >= 6) {
      for (let i = 0; i < 5; i++) b.leaves.push({ f: 1, side: i % 2 ? 1 : -1, rot: (i - 2) * 0.42 + (R() - 0.5) * 0.3, s: 0.9 + R() * 0.4, tone: R(), auto: R() });
      if (R() < 0.45) b.fruit = { s: 0.85 + R() * 0.3, hang: R() };
      return b;
    }
    const kids = depth === 0 ? 2 : (R() < 0.7 ? 2 : 3);
    for (let k = 0; k < kids; k++) {
      const spread = (k - (kids - 1) / 2) * (0.78 + R() * 0.3) - 0.2;
      b.kids.push(branch(len * (0.75 + R() * 0.1), width * 0.66, depth + 1, b.t1 - 0.02, spread + (R() - 0.5) * 0.18));
    }
    return b;
  }
  const root = branch(1, 0.15, 0, 0, 0);
  const tmax = Math.max(...all.map((b) => b.t1)) * 1.12;
  for (const b of all) { b.t0 /= tmax; b.t1 /= tmax; for (const l of b.leaves) l.t = b.t0 + (b.t1 - b.t0) * l.f + 0.01; }
  return { root, count: all.length, order: [...all].sort((p, q) => p.depth - q.depth) };
}

export async function createTree(canvas, base = 'sprites/') {
  const ctx = canvas.getContext('2d');
  const meta = await (await fetch(base + 'meta.json')).json();
  const names = ['g1', 'g2', 'g3', 'a1', 'a2', 'a3'];
  const L = {};
  await Promise.all([...names.map(async (n) => { L[n] = await load(`${base}leaf_${n}.webp`); }),
    load(base + 'leaf_hero.webp').then((i) => { L.hero = i; }),
    ...[0, 1, 2, 3].map((i) => load(`${base}bug_walk${i}.webp`).then((im) => { (L.walk ||= [])[i] = im; })),
    ...[0, 1].map((i) => load(`${base}bug_fly${i}.webp`).then((im) => { (L.fly ||= [])[i] = im; })),
    load(base + 'fruit_green.webp').then((i) => { L.fg = i; }), load(base + 'fruit_ripe.webp').then((i) => { L.fr = i; })]);
  // pre-scale every leaf to a small canvas once: drawing 1000 downsampled 700px images per frame is what made scrolling slow
  const SMALL = {};
  for (const n of names) {
    const m = meta.leaves[n], tw = 200, k = tw / m.w, c = document.createElement('canvas'); c.width = tw; c.height = Math.ceil(m.h * k);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(L[n], 0, 0, c.width, c.height);
    SMALL[n] = { c, ax: m.anchor[0] * k, ay: m.anchor[1] * k, blade: 3.0 * m.unit * k };
  }
  const SF = { fg: document.createElement('canvas'), fr: document.createElement('canvas') };
  for (const [key, img] of [['fg', L.fg], ['fr', L.fr]]) { SF[key].width = SF[key].height = 96; const x = SF[key].getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, 96, 96); }
  const SB = { walk: L.walk.map((im) => { const c = document.createElement('canvas'); c.width = c.height = 192; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, 192, 192); return c; }), fly: L.fly.map((im) => { const c = document.createElement('canvas'); c.width = c.height = 192; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, 192, 192); return c; }) };
  // stem colours and width sampled from the rendered petiole so the continued stem matches it exactly
  const stem = (() => {
    const m = meta.hero, c = document.createElement('canvas'); c.width = m.w; c.height = 1; const x = c.getContext('2d'); x.drawImage(L.hero, 0, -(m.anchor[1] - 10)); 
    const row = x.getImageData(0, 0, m.w, 1).data; let x0 = -1, x1 = -1; for (let i = 0; i < m.w; i++) if (row[i * 4 + 3] > 200) { if (x0 < 0) x0 = i; x1 = i; }
    const cols = []; for (let i = x0; i <= x1; i += Math.max(1, Math.floor((x1 - x0) / 6))) cols.push([(i - x0) / Math.max(1, x1 - x0), `rgb(${row[i * 4]},${row[i * 4 + 1]},${row[i * 4 + 2]})`]);
    return { x0, x1, cols, mid: (x0 + x1) / 2 - m.anchor[0], w: x1 - x0 };
  })();
  const css = () => { const s = getComputedStyle(document.documentElement); return { bark: hex(s.getPropertyValue('--bark') || '#6b5848'), ground: hex(s.getPropertyValue('--ground') || '#000000') }; };
  let C = css();
  let W = 0, H = 0, dpr = 1;
  const { root, order: ORDER, count: NB } = buildTree();
  const SX = new Float32Array(NB), SY = new Float32Array(NB), EX = new Float32Array(NB), EY = new Float32Array(NB), AN = new Float32Array(NB), FR = new Float32Array(NB), VIS = new Uint8Array(NB);
  const FRUITS = new Array(80), FFF = new Float32Array(80); let nF = 0;
  const AU = ['a1', 'a2', 'a3'];
  const BK = {};
  const paintBark = () => { BK.dark = rgb(mix(C.bark, [8, 6, 4], 0.5)); BK.light = rgb(mix(C.bark, [255, 240, 220], 0.16)); BK.mid = rgb(C.bark); BK.edge = rgb(mix(C.bark, [8, 6, 4], 0.6)); BK.fissure = rgb(mix(C.bark, [0, 0, 0], 0.55), 0.5); BK.root = rgb(mix(C.bark, [8, 6, 4], 0.35)); };
  paintBark();
  function resize() { dpr = Math.min(devicePixelRatio || 1, 1.25); W = innerWidth; H = innerHeight; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; }
  resize(); addEventListener('resize', resize);

  // draw a leaf sprite so its blade is `px` wide, with the petiole base at (0,0)
  const blit = (name, px) => { const m = name === 'hero' ? meta.hero : meta.leaves[name]; const k = px / (3.0 * m.unit); ctx.drawImage(L[name], -m.anchor[0] * k, -m.anchor[1] * k, m.w * k, m.h * k); };
  const layout = () => {
    const mobile = W < 860;
    return { mobile, baseX: mobile ? W * 0.74 : W * 0.7, baseY: H * 1.0, unit: mobile ? Math.min(W * 0.22, H * 0.13) : Math.min(W * 0.15, H * 0.2),
      heroX: mobile ? W * 0.56 : W * 0.7, heroY: mobile ? H * 0.365 : H * 0.62, heroPx: mobile ? Math.min(W * 0.74, 330) : Math.min(W * 0.36, H * 0.74, 560) };
  };
  const bugOnLeaf = (t) => {
    const k = 0.5 - 0.5 * Math.cos(t * 0.42);
    const a = lerp(-0.42, 0.48, k), rho = lerp(0.5, 0.66, Math.sin(k * Math.PI));
    const th = a * 1.22, r = rho * 1.5 * (1 - 0.1 * Math.pow(Math.abs(a), 3));
    const k2 = 0.5 - 0.5 * Math.cos((t + 0.04) * 0.42), a2 = lerp(-0.42, 0.48, k2), rho2 = lerp(0.5, 0.66, Math.sin(k2 * Math.PI));
    const th2 = a2 * 1.22, r2 = rho2 * 1.5 * (1 - 0.1 * Math.pow(Math.abs(a2), 3));
    const p = [r * Math.sin(th) * 1.18, r * Math.cos(th) + 0.18], q = [r2 * Math.sin(th2) * 1.18, r2 * Math.cos(th2) + 0.18];
    const dx = q[0] - p[0], dy = q[1] - p[1], moving = Math.min(1, Math.hypot(dx, dy) * 60);
    return { lx: p[0], ly: p[1], head: Math.atan2(dx, dy), moving };
  };
  const drawBug = (img, size, ang) => { ctx.save(); ctx.rotate(ang); ctx.drawImage(img, -size / 2, -size / 2, size, size); ctx.restore(); };
  const bugImg = (kind, i) => SB[kind][i];

  function draw(S, t, reduce) {
    const { fly, fall, grow, fruit, ripe, autumn } = S;
    const Lo = layout();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const sw = reduce ? 0 : 1;

    // ground contact shadow that spreads with the crown
    if (grow > 0.001 || fall > 0.9) {
      const gw = Lo.unit * (0.5 + 3.2 * easeOut(grow));
      const g = ctx.createRadialGradient(Lo.baseX, Lo.baseY, 0, Lo.baseX, Lo.baseY, gw);
      g.addColorStop(0, rgb(C.ground, 0.4)); g.addColorStop(1, rgb(C.ground, 0));
      ctx.save(); ctx.translate(0, Lo.baseY); ctx.scale(1, 0.1); ctx.translate(0, -Lo.baseY); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(Lo.baseX, Lo.baseY, gw, 0, TAU); ctx.fill(); ctx.restore();
    }

    // ---- tree: limbs first, then leaves inner to outer, then fruit (no per-frame allocation)
    if (grow > 0.001) {
      const scaleW = 0.4 + 0.6 * smooth(grow * 1.3), cullM = 70;
      nF = 0;
      const walk = (b, x, y, ang) => {
        const id = b.id;
        if (grow <= b.t0) { VIS[id] = 0; return; }
        const f = smooth((grow - b.t0) / (b.t1 - b.t0));
        const a = ang + b.ang + sw * Math.sin(t * 0.6 + b.sway) * 0.01 * b.depth;
        const len = b.len * Lo.unit * f, ex = x + Math.sin(a) * len, ey = y - Math.cos(a) * len;
        VIS[id] = 1; SX[id] = x; SY[id] = y; EX[id] = ex; EY[id] = ey; AN[id] = a; FR[id] = f;
        const mx = (x + ex) / 2 + Math.cos(a) * b.bend * len * 0.25, my = (y + ey) / 2 + Math.sin(a) * b.bend * len * 0.25;
        const w0 = Math.max(0.8, b.width * Lo.unit * scaleW), w1 = Math.max(0.6, w0 * 0.68), nx = Math.cos(a), ny = Math.sin(a);
        ctx.beginPath();
        ctx.moveTo(x - nx * w0 / 2, y - ny * w0 / 2);
        ctx.quadraticCurveTo(mx - nx * (w0 + w1) / 4, my - ny * (w0 + w1) / 4, ex - nx * w1 / 2, ey - ny * w1 / 2);
        ctx.lineTo(ex + nx * w1 / 2, ey + ny * w1 / 2);
        ctx.quadraticCurveTo(mx + nx * (w0 + w1) / 4, my + ny * (w0 + w1) / 4, x + nx * w0 / 2, y + ny * w0 / 2);
        ctx.closePath();
        if (w0 > 2.2) {
          const g = ctx.createLinearGradient(x - nx * w0 / 2, y - ny * w0 / 2, x + nx * w0 / 2, y + ny * w0 / 2);
          g.addColorStop(0, BK.dark); g.addColorStop(0.35, BK.light); g.addColorStop(0.7, BK.mid); g.addColorStop(1, BK.edge);
          ctx.fillStyle = g;
        } else ctx.fillStyle = BK.mid;
        ctx.fill();
        if (w0 > 6) {
          ctx.strokeStyle = BK.fissure; ctx.lineWidth = 0.8;
          for (const o of [-0.28, 0.05, 0.3]) { ctx.beginPath(); ctx.moveTo(x + nx * w0 * o, y + ny * w0 * o); ctx.quadraticCurveTo(mx + nx * w0 * o * 0.8, my + ny * w0 * o * 0.8, ex + nx * w1 * o, ey + ny * w1 * o); ctx.stroke(); }
        }
        if (b.depth === 0) {
          ctx.fillStyle = BK.root;
          for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sd * w0 * 0.3, y - w0 * 0.2); ctx.quadraticCurveTo(x + sd * w0 * 0.75, y - w0 * 0.05, x + sd * w0 * 1.5, y + w0 * 0.1); ctx.quadraticCurveTo(x + sd * w0 * 0.7, y + w0 * 0.12, x, y + w0 * 0.12); ctx.closePath(); ctx.fill(); }
        }
        if (b.fruit && fruit > 0 && nF < FRUITS.length) { const ff = backOut((fruit - b.fruit.hang * 0.45) / 0.35) * clamp((grow - b.t1) * 30); if (ff > 0.01) { FRUITS[nF++] = b; FFF[nF - 1] = ff; } }
        for (const c of b.kids) walk(c, ex, ey, a);
      };
      walk(root, Lo.baseX, Lo.baseY, -0.04);
      // leaves, inner branches first (so the crown reads dark inside and bright at the tips)
      for (let oi = 0; oi < ORDER.length; oi++) {
        const b = ORDER[oi]; if (!VIS[b.id]) continue;
        const id = b.id, a = AN[id], f = FR[id], depth = b.depth;
        for (let li = 0; li < b.leaves.length; li++) {
          const l = b.leaves[li], lf = backOut((grow - l.t) / 0.06); if (lf <= 0.01) continue;
          const u = l.f * f, x = SX[id] + (EX[id] - SX[id]) * u, y = SY[id] + (EY[id] - SY[id]) * u;
          if (x < -cullM || x > W + cullM || y < -cullM || y > H + cullM) continue;
          const ang = a + l.side * (0.95 + l.rot) + sw * Math.sin(t * 1.2 + l.tone * 9) * 0.05, px = Lo.unit * 0.165 * l.s * lf;
          const n = autumn > l.auto * 0.7 + 0.04 ? (autumn > l.auto * 0.7 + 0.2 ? AU[Math.floor(l.tone * 3) % 3] : 'g3') : (depth < 4 ? (l.tone < 0.5 ? 'g1' : 'g2') : (l.tone < 0.5 ? 'g2' : 'g3'));
          const sp = SMALL[n], k = px / sp.blade, cs = Math.cos(ang) * k * dpr, sn = Math.sin(ang) * k * dpr;
          ctx.setTransform(cs, sn, -sn, cs, x * dpr, y * dpr); ctx.drawImage(sp.c, -sp.ax, -sp.ay);
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let i = 0; i < nF; i++) {
        const b = FRUITS[i], fr = b.fruit, ff = FFF[i], id = b.id, x = EX[id], y = EY[id];
        const hang = (0.5 + fr.hang * 0.6) * Lo.unit * 0.11, sway = sw * Math.sin(t * 1.0 + fr.hang * 7) * 0.1;
        const fx = x + Math.sin(sway) * hang, fy = y + Math.cos(sway) * hang, r = Lo.unit * 0.068 * fr.s * ff;
        ctx.strokeStyle = BK.mid; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(fx, fy - r * 0.6); ctx.stroke();
        ctx.globalAlpha = 0.28; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(fx + r * 0.18, fy + r * 0.2, r * 0.9, r * 0.95, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
        ctx.drawImage(SF.fg, fx - r, fy - r * 0.8, 2 * r, 2 * r); if (ripe > 0) { ctx.globalAlpha = ripe; ctx.drawImage(SF.fr, fx - r, fy - r * 0.8, 2 * r, 2 * r); ctx.globalAlpha = 1; }
      }
      // autumn: a few golden leaves let go and drift to the ground
      if (autumn > 0.2) {
        for (let i = 0; i < 12; i++) {
          const k = ((t * (0.035 + (i % 5) * 0.006) * (reduce ? 0 : 1) + i * 0.083) % 1), a2 = clamp((autumn - 0.2) / 0.5);
          const px = Lo.baseX - Lo.unit * 2.2 + ((i * 97) % 100) / 100 * Lo.unit * 3.6 + Math.sin(k * 9 + i) * Lo.unit * 0.22, py = Lo.baseY - Lo.unit * 3.0 + k * Lo.unit * 3.0;
          ctx.save(); ctx.globalAlpha = a2 * Math.min(1, (1 - k) * 6); ctx.translate(px, py); ctx.rotate(k * 7 + i); { const sp = SMALL['a' + (1 + i % 3)], kk = Lo.unit * 0.18 / sp.blade; ctx.drawImage(sp.c, -sp.ax * kk, -sp.ay * kk, sp.c.width * kk, sp.c.height * kk); } ctx.restore();
        }
      }
    }

    // ---- hero leaf: on its stem, then it falls, lands at the foot of the future tree and fades as the sprout rises
    if (fall < 0.999) {
      const e = smooth(fall);
      const sx = Lo.heroX, sy = Lo.heroY, tx = Lo.baseX - Lo.unit * 0.55, ty = Lo.baseY - 6;
      const cx = lerp(sx, tx, e) + Math.sin(e * Math.PI * 2) * Lo.heroPx * 0.22 * (1 - e), cy = lerp(sy, ty, e * e);
      const px = Lo.heroPx * lerp(1, 0.1, e);
      const rot = (reduce ? 0 : Math.sin(t * 0.5) * (Lo.mobile ? 0.05 : 0.018)) + e * Math.PI * 1.7 * 0.5;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.globalAlpha = 1 - smooth((fall - 0.9) / 0.1);
      if (e < 0.5) { // warm backlight so the leaf reads as translucent
        const gl = ctx.createRadialGradient(0, -px * 0.45, 0, 0, -px * 0.45, px * 0.95); gl.addColorStop(0, 'rgba(236,205,120,0.20)'); gl.addColorStop(1, 'rgba(236,205,120,0)');
        ctx.globalAlpha *= 1 - e * 2; ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, -px * 0.45, px * 0.95, 0, TAU); ctx.fill(); ctx.globalAlpha = 1 - smooth((fall - 0.9) / 0.1);
      }
      blit('hero', px);
      if (e < 0.06 && !Lo.mobile) { // the stem it hangs from, continuing the rendered petiole with its own colours
        const m = meta.hero, k = px / (3.0 * m.unit), wpx = stem.w * k, mx = stem.mid * k;
        const g = ctx.createLinearGradient(mx - wpx / 2, 0, mx + wpx / 2, 0); for (const [o, col] of stem.cols) g.addColorStop(o, col);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(mx - wpx / 2, -1); ctx.lineTo(mx + wpx / 2, -1); ctx.quadraticCurveTo(mx + wpx / 2 + px * 0.01, H * 0.25, mx + wpx / 2 - px * 0.012, H); ctx.lineTo(mx - wpx / 2 - px * 0.012, H); ctx.quadraticCurveTo(mx - wpx / 2 + px * 0.01, H * 0.25, mx - wpx / 2, -1); ctx.closePath(); ctx.fill();
      }
      if (fly < 0.999) {
        const bp = bugOnLeaf(reduce ? 2 : t), m = meta.hero, k = px / (3.0 * m.unit);
        const bx = (m.w / 2 + bp.lx * m.unit - m.anchor[0]) * k, by = (m.unit * (1.8 - bp.ly) - m.anchor[1]) * k;
        const size = px * 0.21 / 0.62;
        const fe = easeOut(fly), ph = Math.floor(t * 9) % 4;
        ctx.save();
        if (fly <= 0.01) {
          ctx.translate(bx, by);
          ctx.globalAlpha = 0.16; ctx.fillStyle = '#0b1408'; ctx.save(); ctx.translate(size * 0.03, size * 0.05); ctx.rotate(bp.head); ctx.beginPath(); ctx.ellipse(0, 0, size * 0.2, size * 0.25, 0, 0, TAU); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
          drawBug(bp.moving > 0.2 && !reduce ? L.walk[ph] : L.walk[0], size, bp.head);
        } else {
          const x0 = bx, y0 = by, x1 = Lo.heroPx * 0.9 + fe * W * 0.45, y1 = -Lo.heroPx * 0.9 - fe * H * 0.8;
          const px2 = lerp(x0, x1, fe) + Math.sin(fe * 9) * 18 * (1 - fe), py2 = lerp(y0, y1, fe) - Math.sin(fe * Math.PI) * 60;
          ctx.translate(px2, py2); ctx.globalAlpha = 1 - smooth((fly - 0.8) / 0.2);
          drawBug(L.fly[Math.floor(t * 28) % 2], size * (1 + fe * 0.4), bp.head * (1 - fe) + 0.7 * fe);
        }
        ctx.restore();
      }
      ctx.restore();
    }
    // the fallen leaf stays on the ground beside the trunk
    if (fall > 0.9) { ctx.save(); ctx.globalAlpha = 0.85 * smooth((fall - 0.9) / 0.1) * (1 - smooth(grow / 0.3) * 0.3); ctx.translate(Lo.baseX - Lo.unit * 0.55, Lo.baseY - 4); ctx.scale(1, 0.32); ctx.rotate(0.6); { const sp = SMALL.a2, kk = Lo.unit * 0.2 / sp.blade; ctx.drawImage(sp.c, -sp.ax * kk, -sp.ay * kk, sp.c.width * kk, sp.c.height * kk); } ctx.restore(); }
  }
  return { draw };
}
