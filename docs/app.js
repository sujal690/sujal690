import { createTree } from './tree.js?v=20261008c';
import { createSky, phaseName, greeting } from './sky.js?v=20261008c';
import { DIAG, WORK } from './diag.js?v=20261008c';

const BURST = ['#e6a965', '#a9c78b', '#7fa35a', '#f1d8a8', '#c98b4a']; let night = false;
const $ = (s, el = document) => el.querySelector(s);
const prog = document.getElementById('prog');
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- hero text: letters rise in, the greeting follows the clock
[['h1a', 'Sujal'], ['h1b', 'Shah']].forEach(([id, w], r) => { $('#' + id).innerHTML = [...w].map((c, i) => `<span class="ch" style="--i:${i + r * 5}">${c}</span>`).join(''); });
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('go')));

// ---------------------------------------------------------------- statement that lights up as you read
const ST = 'I own production AI and full-stack systems [end to end.] I build OCR and vision-language pipelines, computer vision tools and LLM integrations, and turn multi-day manual processes into workflows that finish in [minutes.]';
(() => { const out = []; let hl = false, i = 0; ST.split(' ').forEach((w) => { if (w.startsWith('[')) { hl = true; w = w.slice(1); } const end = w.endsWith(']'); if (end) w = w.slice(0, -1); out.push(`<span class="wd${hl ? ' hl' : ''}" style="--i:${i++}">${w}</span>`); if (end) hl = false; }); $('#st').innerHTML = out.join(' '); $('#st').style.setProperty('--n', i); })();

// ---------------------------------------------------------------- work
$('#rows').innerHTML = WORK.map(([d, t, p, tags], i) => `<div class="row" data-open="${i === 0}"><button aria-expanded="${i === 0}"><span class="t">${t}</span><span class="pm"></span></button><div class="body"><div><p>${p}</p><div class="vis">${DIAG[d]}</div><div class="tags">${tags.map((x) => `<span>${x}</span>`).join('')}</div></div></div></div>`).join('');
const lit = document.createElement('style');
lit.textContent = [0, 1, 2, 3, 4].map((i) => { const a = (80 * i / 4).toFixed(1); return `@keyframes lk${i}{0%,${Math.max(0, a - 0.1)}%{opacity:0}${(+a + 1.5).toFixed(1)}%,96%{opacity:1}100%{opacity:0}}.lit${i}{opacity:0;animation:lk${i} 4.5s ease-in-out infinite}`; }).join('');
document.head.appendChild(lit);
const openRow = (i) => { const rows = $$('.row'); rows.forEach((r, k) => { const on = k === i; r.dataset.open = on; $('button', r).setAttribute('aria-expanded', on); }); };
$$('.row').forEach((row, i) => $('button', row).addEventListener('click', () => openRow(row.dataset.open === 'true' ? -1 : i)));

// ---------------------------------------------------------------- activity: every year since the first day on GitHub, a ladybug that eats the green days and they sprout back
const counters = []; const crawl = { on: false, visible: false };
fetch('stats.json?v=' + Date.now().toString().slice(0, 8)).then((r) => r.json()).then((S) => {
  const cal = new Map(S.calendar.map((d) => [d.date, d.count]));
  const nz = S.calendar.map((d) => d.count).filter(Boolean).sort((a, b) => a - b);
  const q = nz.length ? [0.25, 0.5, 0.75].map((p) => nz[Math.floor(nz.length * p)]) : [1, 2, 3];
  const lv = (c) => (c === 0 ? 0 : 1 + q.filter((t) => c > t).length);
  const best = new Date(S.best_day.date + 'T00:00:00').toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  const since = new Date((S.since_date || S.calendar[0].date) + 'T00:00:00').toLocaleString('en', { month: 'short', year: 'numeric' });
  const tiles = [[S.contributions, 'contributions'], [S.commits, 'commits'], [S.repos, 'repositories'], [S.active_days, 'active days'], [S.longest_streak, 'day best streak'], [S.current_streak, 'day current streak'], [S.followers, 'follower'], [S.repos_contributed, 'repos contributed to']];
  const mon = (m) => new Date(m + '-01T00:00:00').toLocaleString('en', { month: 'short' });
  const mx = Math.max(...S.months.map((m) => m.count), 1), wd = S.weekday, wmx = Math.max(...wd, 1);
  const LC = ['#6aa0d8', '#e6c552', '#8f8fc0', '#c58ad8', '#e6a965', '#8fbf7a'];
  const years = [...new Set(S.calendar.map((d) => +d.date.slice(0, 4)))].sort();
  const yt = Object.fromEntries(years.map((y) => [y, S.calendar.filter((d) => d.date.startsWith(y)).reduce((s, d) => s + d.count, 0)]));
  const iso = (d) => d.toISOString().slice(0, 10);
  const grids = years.map((y, yi) => {
    const jan = new Date(Date.UTC(y, 0, 1)), pad = jan.getUTCDay(), cells = [];
    for (let i = 0; i < 371 && new Date(Date.UTC(y, 0, 1 + i)).getUTCFullYear() === y; i++) {
      const d = new Date(Date.UTC(y, 0, 1 + i)), ds = iso(d), has = cal.has(ds), c = has ? cal.get(ds) : 0, col = Math.floor((i + pad) / 7);
      cells.push(`<span${has ? ` data-l="${lv(c)}" data-d="${ds}" data-c="${c}"` : ' class="off"'}${S.best_day.date === ds ? ' data-best="1"' : ''} style="--c:${col};--y:${yi}"></span>`);
    }
    return `<div class="yr"><div class="yl"><b>${y}</b><span>${yt[y]}</span></div><div class="grid" data-y="${yi}">${'<span class="off" style="visibility:hidden"></span>'.repeat(pad)}${cells.join('')}</div></div>`;
  }).join('');
  const qmon = S.months.map((m, i) => (i % 3 === 0 ? `<span>${mon(m.month)}${m.month.slice(2, 4) !== (S.months[i - 3] || { month: '' }).month.slice(2, 4) ? ' ’' + m.month.slice(2, 4) : ''}</span>` : '<span></span>')).join('');
  $('#dash').insertAdjacentHTML('beforeend', `<div class="tiles">${tiles.map(([v, l]) => `<div class="tile"><div class="v" data-to="${v}">0</div><div class="l">${l}</div></div>`).join('')}</div>
    <div class="gw" id="gw">${grids}<div class="bug" id="bug"><img alt=""><img alt=""><img alt=""><img alt=""><img alt="" class="fl"></div></div>
    <div class="cap"><span>${S.contributions} contributions since ${since}</span><span>best day <b>${best}</b>, ${S.best_day.count}</span></div>
    <div class="two"><div class="mini"><h4>Every month</h4><div class="bars thin">${S.months.map((m, i) => `<i style="--h:${Math.max(5, m.count / mx * 100)};--k:${i * 0.4}" data-t="${mon(m.month)} ${m.month.slice(0, 4)}: ${m.count}"></i>`).join('')}</div><div class="axis thin">${qmon}</div></div>
    <div class="mini"><h4>Week rhythm</h4><div class="bars">${wd.map((n, i) => `<i style="--h:${Math.max(6, n / wmx * 100)};--k:${i}" data-t="${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}: ${n}"></i>`).join('')}</div><div class="axis">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<span>${d}</span>`).join('')}</div></div></div>
    <div class="mini" style="margin-top:28px"><h4>Languages</h4><div class="lang">${S.languages.slice(0, 6).map((l, i) => `<i style="--w:${l.pct};--c:${LC[i]};--k:${i}"></i>`).join('')}</div><div class="llist">${S.languages.slice(0, 6).map((l, i) => `<span style="--c:${LC[i]}"><b>${l.name}</b> ${l.pct}%</span>`).join('')}</div></div>`);
  const tip = $('#tip'), gw = $('#gw');
  gw.addEventListener('pointerover', (e) => { const s = e.target.closest('span[data-d]'); if (!s) return; const r = s.getBoundingClientRect(); tip.textContent = `${s.dataset.c} on ${new Date(s.dataset.d + 'T00:00:00').toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`; tip.style.left = r.left + r.width / 2 + 'px'; tip.style.top = r.top + 'px'; tip.classList.add('on'); });
  gw.addEventListener('pointerleave', () => tip.classList.remove('on'));
  counters.push(...$$('#dash [data-to]'));
  setupBug(gw);
  measure();
}).catch((e) => console.warn('stats unavailable', e));
function countUp(el) { const to = +el.dataset.to, t0 = performance.now(); const step = (n) => { const k = clamp((n - t0) / 1300), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(step); }; reduce ? (el.textContent = to) : requestAnimationFrame(step); }

// the ladybug hunts the active days in time order, flying down to the next year when a row is done; eaten days sprout back after the lap
function setupBug(wrap) {
  const bug = $('#bug'), walk = $$('img:not(.fl)', bug), flyImg = $('img.fl', bug);
  walk.forEach((im, i) => { im.src = `sprites/bug_walk${i}.webp`; }); flyImg.src = 'sprites/bug_fly0.webp';
  const cells = $$('span[data-d]', wrap).filter((s) => +s.dataset.c > 0);
  const byYear = {}; cells.forEach((s) => { (byYear[s.parentElement.dataset.y] ||= []).push(s); });
  const order = [];
  Object.keys(byYear).sort().forEach((y) => { const row = byYear[y]; row.sort((a, b) => (+a.style.getPropertyValue('--c') - +b.style.getPropertyValue('--c')) || 0); order.push(...row); });
  const CHEW = 0.3, SPEED = 190, FLY = 1.0, START = 1.4, END = 2.6;
  let centers = [], times = [], total = 0, u = 0, fed = null, heading = 0, gone = new Uint8Array(order.length), flights = [];
  const layout = () => {
    const wr = wrap.getBoundingClientRect(); centers = order.map((k) => { const r = k.getBoundingClientRect(); return [r.left - wr.left + r.width / 2, r.top - wr.top + r.height / 2]; });
    let t = START; times = []; flights = [];
    centers.forEach((c, i) => { if (i) { const p = centers[i - 1], d = Math.hypot(c[0] - p[0], c[1] - p[1]), fl = order[i].parentElement !== order[i - 1].parentElement; flights[i] = fl; t += fl ? FLY : Math.max(0.1, d / SPEED); } times.push(t); t += CHEW; });
    total = t + END;
    const s = Math.max(24, (order[0] ? order[0].getBoundingClientRect().width : 11) * 3.2); bug.style.width = bug.style.height = s + 'px'; bug.style.margin = `${-s / 2}px 0 0 ${-s / 2}px`;
  };
  layout(); addEventListener('resize', layout); new ResizeObserver(layout).observe(wrap);
  const crumb = (x, y) => { if (reduce) return; for (let i = 0; i < 4; i++) { const c = document.createElement('i'); c.className = 'crumb'; c.style.left = x + 'px'; c.style.top = y + 'px'; wrap.appendChild(c); const a = Math.random() * 6.28, d = 8 + Math.random() * 12; c.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 6}px) scale(0)`, opacity: 0 }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => c.remove(); } };
  wrap.addEventListener('pointerdown', (e) => {
    const s = e.target.closest('span[data-d]'); if (!s) return; let i = order.indexOf(s); if (i < 0) i = order.findIndex((o) => o.dataset.d > s.dataset.d); if (i < 0) return;
    fed = { from: u, to: times[i] - 0.05, t0: performance.now() };
  });
  crawl.step = (dt) => {
    if (!crawl.visible || !centers.length) return;
    if (fed) { const kk = clamp((performance.now() - fed.t0) / 800); u = lerp(fed.from, fed.to, 1 - Math.pow(1 - kk, 3)); if (kk >= 1) fed = null; } else u += dt;
    if (u >= total) u = 0;
    let lo = 0, hi = order.length; while (lo < hi) { const m = (lo + hi) >> 1; if (times[m] + CHEW <= u) lo = m + 1; else hi = m; }
    const i = Math.min(lo, order.length - 1);       // the cell being eaten or the next one on the route
    let x, y, flying = false, tx, ty;
    if (u < times[i]) { const p = i ? centers[i - 1] : centers[0], c = centers[i], a = i ? times[i - 1] + CHEW : START - 0.001, kk = clamp((u - a) / Math.max(1e-3, times[i] - a)); const e = flights[i] ? smooth(kk) : kk; x = lerp(p[0], c[0], e); y = lerp(p[1], c[1], e); tx = c[0] - p[0]; ty = c[1] - p[1]; flying = !!flights[i]; if (flying) y -= Math.sin(kk * Math.PI) * 26; }
    else { x = centers[i][0]; y = centers[i][1]; tx = 0; ty = 0; }
    bug.style.opacity = u < START - 0.6 ? 0 : clamp((u - (START - 0.6)) / 0.5) * (u > total - 0.7 ? clamp((total - u) / 0.5) : 1);
    if (Math.hypot(tx, ty) > 0.1) { const h = Math.atan2(tx, -ty); let d = h - heading; d = Math.atan2(Math.sin(d), Math.cos(d)); heading += d * 0.3; }
    bug.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${heading.toFixed(3)}rad) scale(${flying ? 1.45 : 1})`;
    const f = Math.floor(performance.now() / (u >= times[i] ? 120 : 80)) % 4; walk.forEach((im, n) => im.classList.toggle('on', !flying && n === f)); flyImg.classList.toggle('on', flying);
    for (let n = 0; n < order.length; n++) {
      const want = times[n] + CHEW * 0.4 <= u ? 1 : 0;
      if (want !== gone[n]) { gone[n] = want; order[n].classList.toggle('gone', !!want); if (want && !reduce) crumb(centers[n][0], centers[n][1]); }
    }
  };
}

// ---------------------------------------------------------------- path: the line grows with the scroll, milestones ripen
const PATH = [['June 2026 to now', 'AI Software Engineer, Sky Gold and Diamonds', 'Sole technical owner of the company’s AI and automation products, with Docker and CI/CD for every release.'],
  ['May 2026', 'B.E. Computer Science', 'Saraswati College of Engineering, University of Mumbai. CGPA 9.0.'],
  ['2025', 'Full Stack Developer Intern, Chemtron Science Laboratories', 'A MERN and Electron desktop app that cut manual billing and order work by 40%.'],
  ['2025', '1st Place, SCOE Avishkar', 'The college’s flagship project competition.'],
  ['2024', 'Grand Finalist and Global Nominee', 'Smart India Hackathon (Ministry of Coal) and NASA Space Apps Challenge.']];
$('#steps').innerHTML = PATH.map(([y, h, p]) => `<div class="step"><div class="y">${y}</div><h3>${h}</h3><p>${p}</p></div>`).join('');

// ---------------------------------------------------------------- toolkit: hovering a skill names the projects that use it and lights them up
const USED = { OCR: [0], VLM: [0], 'Computer vision': [2, 3], Python: [0], Docker: [0, 1, 2, 3], 'CI/CD': [0, 1, 2, 3] };
const GROUPS = [['Intelligence', ['OCR', 'Computer vision', 'VLM', 'LLM', 'RAG', 'NLP', 'Machine learning', 'Hugging Face']],
  ['Build', ['Python', 'TypeScript', 'JavaScript', 'React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL']],
  ['Ship', ['Docker', 'CI/CD', 'Git', 'Vercel', 'Render', 'System design']]];
$('#cloud').innerHTML = GROUPS.map(([g, list]) => `<div class="grp"><h4>${g}</h4><div class="chips">${list.map((n) => `<span class="chip" tabindex="0" data-n="${n}">${n}</span>`).join('')}</div></div>`).join('') + '<p class="note" id="used">&nbsp;</p>';
const usedEl = $('#used');
const show = (n) => { const ids = USED[n]; usedEl.textContent = ids ? `${n} is used in ${ids.map((i) => WORK[i][1]).join(', ')}.` : `${n}: part of my toolkit.`; };
$$('.chip').forEach((c) => { c.addEventListener('pointerenter', () => show(c.dataset.n)); c.addEventListener('focus', () => show(c.dataset.n)); });
$('#cloud').addEventListener('pointerleave', () => { usedEl.innerHTML = '&nbsp;'; });
$('#repos').innerHTML = [['Culturama', '.NET temple-heritage web app', 'Culturama'], ['Odoo Appointment Booking', 'multi-role booking system', 'Odoo_Appointment_Booking'], ['Weapon Detection', 'YOLOv8, 90.4% mAP@0.5', 'weapon_detection_assignment']]
  .map(([n, d, s]) => `<a href="https://github.com/sujal690/${s}"><b>${n}</b><span>${d} ↗</span></a>`).join('');
$('#copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText('sujalshah630@gmail.com'); } catch (e) { /* the toast still confirms */ } $('#toast').classList.add('on'); setTimeout(() => $('#toast').classList.remove('on'), 1800); });

// ---------------------------------------------------------------- buttons: magnetic pull, fill from the pointer, ripple and a burst of leaves on press

function burst(x, y) {
  if (reduce) return;
  for (let i = 0; i < 9; i++) {
    const l = document.createElement('i'); l.className = 'lf'; l.style.left = x + 'px'; l.style.top = y + 'px'; l.style.background = BURST[i % BURST.length]; document.body.appendChild(l);
    const a = (i / 9) * 6.283 + Math.random() * 0.6, d = 46 + Math.random() * 58;
    l.animate([{ transform: 'translate(0,0) rotate(0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 22}px) rotate(${(Math.random() - 0.5) * 540}deg) scale(.4)`, opacity: 0 }], { duration: 750 + Math.random() * 300, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => l.remove();
  }
}
$$('.btn').forEach((b) => {
  b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.setProperty('--x', e.clientX - r.left + 'px'); b.style.setProperty('--y', e.clientY - r.top + 'px'); if (fine && !reduce) { b.style.setProperty('--tx', (e.clientX - r.left - r.width / 2) * 0.12 + 'px'); b.style.setProperty('--ty', (e.clientY - r.top - r.height / 2) * 0.2 + 'px'); } });
  b.addEventListener('pointerleave', () => { b.style.setProperty('--tx', '0px'); b.style.setProperty('--ty', '0px'); });
  b.addEventListener('pointerdown', (e) => { const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, rp = document.createElement('i'); rp.className = 'rip'; rp.style.cssText = `left:${e.clientX - r.left}px;top:${e.clientY - r.top}px;width:${s}px;height:${s}px`; b.appendChild(rp); setTimeout(() => rp.remove(), 800); burst(e.clientX, e.clientY); });
});
// every press answers: a ring of light where you click, leaves by day and fireflies by night, and a springy pop on whatever was pressed
const MOODS = {
  Dawn: { n: 9, cls: 'pt', life: [1300, 700], dx: 1, dy: -34, spin: 200, ring: 'rgba(255,170,150,.8)' },
  Morning: { n: 8, cls: 'pt', life: [1200, 600], dx: 1, dy: -26, spin: 220, ring: 'rgba(255,200,130,.8)' },
  Day: { n: 8, cls: 'lf', life: [900, 500], dx: 1, dy: 24, spin: 520, ring: '' },
  Evening: { n: 10, cls: 'em', life: [1100, 600], dx: 0.6, dy: -58, spin: 0, ring: 'rgba(255,140,70,.85)' },
  Dusk: { n: 10, cls: 'em', life: [1200, 600], dx: 0.6, dy: -64, spin: 0, ring: 'rgba(255,120,90,.85)' },
  Night: { n: 7, cls: 'ff', life: [1500, 800], dx: 0.8, dy: -44, spin: 0, ring: 'rgba(200,236,120,.7)' },
};
function spark(x, y) {
  if (reduce) return;
  const m = MOODS[sky.phase().name] || MOODS.Day;
  const r = document.createElement('i'); r.className = 'ring'; r.style.left = x + 'px'; r.style.top = y + 'px'; if (m.ring) r.style.boxShadow = `0 0 0 1.5px ${m.ring}, 0 0 24px ${m.ring}`; document.body.appendChild(r);
  r.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 0.9 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => r.remove();
  for (let i = 0; i < m.n; i++) {
    const l = document.createElement('i'); l.className = m.cls; l.style.left = x + 'px'; l.style.top = y + 'px'; if (m.cls === 'lf') l.style.background = BURST[(i * 2) % BURST.length]; document.body.appendChild(l);
    const ang = Math.random() * 6.283, d = 22 + Math.random() * 46, wob = (Math.random() - 0.5) * 30;
    const end = { transform: `translate(${Math.cos(ang) * d * m.dx + wob}px,${Math.sin(ang) * d * 0.5 + m.dy * (0.6 + Math.random() * 0.8)}px) rotate(${(Math.random() - 0.5) * m.spin * 2}deg) scale(${m.cls === 'em' ? 0.1 : 0.4})`, opacity: 0 };
    l.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0 }, { opacity: m.cls === 'em' ? 0.9 : 1, offset: 0.4 }, end], { duration: m.life[0] + Math.random() * m.life[1], easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => l.remove();
  }
}
addEventListener('pointerdown', (e) => {
  const el = e.target.closest && e.target.closest('a, button, .chip, .tile, .grid span, .step, .bars i');
  if (el && !el.classList.contains('btn')) { spark(e.clientX, e.clientY); if (!reduce) el.animate([{ scale: '1' }, { scale: '.93' }, { scale: '1.04' }, { scale: '1' }], { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' }); }
  else if (!el && !e.target.closest('.card')) spark(e.clientX, e.clientY);
});
$$('.chip').forEach((c) => { if (!fine) return; c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); c.style.setProperty('--tx', (e.clientX - r.left - r.width / 2) * 0.12 + 'px'); c.style.setProperty('--ty', (e.clientY - r.top - r.height / 2) * 0.2 + 'px'); }); c.addEventListener('pointerleave', () => { c.style.setProperty('--tx', '0px'); c.style.setProperty('--ty', '0px'); }); });

// ---------------------------------------------------------------- reveals + nav indicator
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.target.id === 'stats' || e.target.closest('#stats')) crawl.visible = e.isIntersecting; if (!e.isIntersecting) return; e.target.classList.add('in'); $$('[data-to]', e.target).forEach(countUp); io.unobserve(e.target); }), { threshold: 0.15 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = (el.closest('#hero') ? i * 90 : 0) + 'ms'; io.observe(el); });
new IntersectionObserver((es) => es.forEach((e) => { crawl.visible = e.isIntersecting; }), { rootMargin: '0px 0px 0px 0px', threshold: 0.05 }).observe($('#stats'));
const links = $$('.links a:not(.ext)'), ind = $('.links .ind');
const navIO = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return; const a = links.find((l) => l.getAttribute('href') === '#' + e.target.id);
  links.forEach((l) => l.classList.toggle('on', l === a));
  if (a) { ind.style.opacity = 1; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft - 5}px)`; } else ind.style.opacity = 0;
}), { rootMargin: '-45% 0px -50% 0px' });
['hero', 'intro', 'work', 'stats', 'path', 'toolkit', 'contact'].forEach((id) => navIO.observe($('#' + id)));
const stepIO = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('on', e.isIntersecting || e.boundingClientRect.top < 0)), { rootMargin: '0px 0px -38% 0px' });
$$('.step').forEach((s) => stepIO.observe(s));
// card spotlight follows the pointer
addEventListener('pointermove', (e) => { const c = e.target.closest && e.target.closest('.card'); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px'); }, { passive: true });

// ---------------------------------------------------------------- the sky: follows the visitor's clock, can be set by hand
const root = document.documentElement, meta = $('meta[name=theme-color]');
const skyCanvas = document.createElement('canvas');
const sky = createSky(skyCanvas, (P) => {
  const c = P.card.map((v) => v | 0), ac = P.acc.map((v) => v | 0); root.style.setProperty('--card', `rgba(${c[0]},${c[1]},${c[2]},.93)`); root.style.setProperty('--acc', `rgb(${ac})`); root.style.setProperty('--accR', `${ac}`); root.style.setProperty('--accSoft', `rgba(${ac},.15)`); BURST[0] = `rgb(${ac})`; night = P.star > 0.45; root.style.setProperty('--bg', `rgb(${P.top.map((v) => v | 0)})`);
  meta.setAttribute('content', `rgb(${P.top.map((v) => v | 0)})`);
  updateGreeting();
});
const tsw = $('.tsw'), tind = $('.tsw .ind'), tbtn = $$('button', tsw);
function markMode(m) { tbtn.forEach((b) => b.setAttribute('aria-checked', b.dataset.m === m)); const a = tbtn.find((b) => b.dataset.m === m); requestAnimationFrame(() => { tind.style.opacity = 1; tind.style.width = a.offsetWidth + 'px'; tind.style.transform = `translateX(${a.offsetLeft - 5}px)`; }); }
tbtn.forEach((b) => b.addEventListener('click', () => { sky.setMode(b.dataset.m); markMode(b.dataset.m); }));
document.fonts.ready.then(() => markMode(sky.mode)); addEventListener('resize', () => markMode(sky.mode));
const SIGN = { Dawn: 'The first light is on the leaves.', Morning: 'A good morning for building.', Day: 'Bright and busy.', Evening: 'The light is turning gold.', Dusk: 'Fireflies soon.', Night: 'The tree is asleep. The fireflies are not.' };
function updateGreeting() {
  const ph = sky.phase(), hh = Math.floor(ph.hour), mm = Math.floor((ph.hour - hh) * 60);
  const g = ph.greet, c = sky.mode === 'auto' ? `· ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} your time` : `· ${ph.name.toLowerCase()}`, sg = `Sujal Shah · ${SIGN[ph.name]}`;
  if ($('#greet').textContent !== g) $('#greet').textContent = g; if ($('#clock').textContent !== c) $('#clock').textContent = c; if ($('#sign').textContent !== sg) $('#sign').textContent = sg;
}
setInterval(updateGreeting, 4000); updateGreeting();

// ---------------------------------------------------------------- the tree story, driven by scroll position
const tree = await createTree($('#tree'));
const ptr = sky.ptr; let lastPT = performance.now(); const tipEl = $('#tip'), boop = $('#boop');
const FRUIT_LABEL = ['Document automation', 'Order tracking', 'Visual search', 'Security intelligence', 'FamilyConnect', 'GreenMines', 'Schedulr', 'Weapon detection'];
addEventListener('pointermove', (e) => {
  const now = performance.now(), dt = Math.max(8, now - lastPT); lastPT = now;
  const dx = e.clientX - ptr.px, dy = e.clientY - ptr.py; ptr.px = e.clientX; ptr.py = e.clientY; ptr.x = e.clientX / innerWidth; ptr.y = e.clientY / innerHeight;
  ptr.speed = Math.hypot(dx, dy) / dt * 1000; ptr.gust = Math.max(ptr.gust, clamp(ptr.speed / 2400));
  const onCard = e.target.closest && e.target.closest('.card, nav, .btn, a, button, .chip');
  const h = onCard ? null : tree.hit(e.clientX, e.clientY);
  document.body.style.cursor = h ? 'pointer' : '';
  boop.classList.toggle('on', !!h && h.type === 'bug'); if (h && h.type === 'bug') { boop.style.left = e.clientX + 'px'; boop.style.top = e.clientY + 'px'; }
  if (h && h.type === 'fruit') { tipEl.textContent = `${FRUIT_LABEL[h.id % FRUIT_LABEL.length]}: open`; tipEl.style.left = e.clientX + 'px'; tipEl.style.top = e.clientY + 'px'; tipEl.classList.add('on'); } else if (!e.target.closest('#gw')) tipEl.classList.remove('on');
}, { passive: true });
addEventListener('pointerdown', (e) => {
  if (e.target.closest('.card, nav, .btn, a, button')) return; const h = tree.hit(e.clientX, e.clientY); if (!h) return;
  if (h.type === 'bug') { tree.buzz(T); burst(e.clientX, e.clientY); }
  else { const idx = h.id % FRUIT_LABEL.length; burst(e.clientX, e.clientY); if (idx < 4) { openRow(idx); $('#work').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); } else $('#repos').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); }
});
let M = {};
function measure() {
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  M = { max: Math.max(1, document.documentElement.scrollHeight - innerHeight), hero: $('#hero').offsetHeight, intro: top($('#intro')), introH: $('#intro').offsetHeight, path: top($('#path')), pathH: $('#path').offsetHeight };
}
const S = { p: 0, fly: 0, fall: 0, grow: 0, fruit: 0, ripe: 0, autumn: 0 };
const STAGES = [[0.07, 'The leaf'], [0.2, 'The seed'], [0.45, 'Growing'], [0.62, 'The tree'], [0.78, 'Fruit sets'], [0.9, 'Ripening'], [1.1, 'Harvest']];
let T = 0, last = performance.now(), stageIdx = -1, frameN = 0, lastY = 0, skyDt = 0, lastStep = 0, slowSum = 0, slowI = 0; const slowHist = new Uint8Array(90);
const env = { intro: reduce ? 1 : 0, back: skyCanvas, tint: [0, 0, 0, 0], fore: (c, w, h, t, p, r) => sky.fore(c, w, h, t, p, r), pointer: ptr, gust: 0 };
function frame(now) {
  const raw = (now - last) / 1000, dt = Math.min(0.05, raw); last = now; T += dt; frameN++;
  // adaptive resolution: if more than half of the last 90 frames took over 24ms, drop the canvas scale a step (never back up)
  if (document.visibilityState === 'visible' && raw < 0.25) { const f = raw > 0.024 ? 1 : 0; slowSum += f - slowHist[slowI]; slowHist[slowI] = f; slowI = (slowI + 1) % 90; if (slowSum > 45 && now - lastStep > 3000 && frameN > 120) { const cur = tree.scale; if (cur > 0.86) { tree.setScale(cur > 1.01 ? 1 : 0.85); lastStep = now; slowHist.fill(0); slowSum = 0; } } }
  const y = scrollY, vh = innerHeight, p = clamp(y / (M.max || 1)), heroP = clamp(y / ((M.hero || vh) * 0.9));
  const target = {
    p, fly: smooth(heroP / 0.35), fall: smooth((heroP - 0.25) / 0.75), grow: smooth((p - 0.12) / 0.58),
    fruit: smooth((p - 0.62) / 0.18), ripe: smooth((p - 0.74) / 0.14), autumn: smooth((p - 0.88) / 0.11),
  };
  const k = reduce ? 1 : 1 - Math.pow(0.0015, dt);
  for (const key in S) S[key] += (target[key] - S[key]) * k;
  ptr.gust *= Math.pow(0.12, dt);
  if (M.intro !== undefined) { $('#st').style.setProperty('--p', clamp((y + vh * 0.75 - M.intro) / (M.introH * 0.8), 0, 1.05).toFixed(4)); $('#steps').style.setProperty('--fill', clamp((y + vh * 0.62 - M.path) / (M.pathH * 0.92)).toFixed(3)); }
  if (frameN % 6 === 0) { const si = STAGES.findIndex(([m]) => p < m); if (si !== stageIdx) { stageIdx = si; $('#stn').textContent = si + 1; $('#stl').textContent = STAGES[si][1]; } $('#rail .bar i').style.setProperty('--p', p.toFixed(3)); }
  // the sky is soft and slow: redraw it every frame while the page moves, every other frame while it rests
  const moving = Math.abs(y - lastY) > 0.5 || ptr.speed > 20; lastY = y; ptr.speed *= 0.9;
  if ((moving || (frameN & 1) === 0)) { sky.frame(T, skyDt + dt, p, ptr); skyDt = 0; } else skyDt += dt;
  env.tint = sky.tint(); env.gust = ptr.gust; if (env.intro < 1) env.intro = reduce ? 1 : clamp((T - 0.35) / 2.6);
  prog.style.transform = `scaleX(${p.toFixed(4)})`;
  tree.draw(S, T, reduce, env);
  crawl.step && crawl.step(dt);
  requestAnimationFrame(frame);
}
addEventListener('resize', measure);
await document.fonts.ready;
measure();
new ResizeObserver(measure).observe(document.body);
requestAnimationFrame(frame);
