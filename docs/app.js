import { createTree } from './tree.js?v=20261008b';
import { createSky, phaseName, greeting } from './sky.js?v=20261008b';
import { DIAG, WORK } from './diag.js?v=20261008b';

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

// ---------------------------------------------------------------- activity: real GitHub data, a ladybug that eats the green days
const counters = []; const crawl = { on: false, visible: false };
fetch('stats.json?v=' + Date.now().toString().slice(0, 7)).then((r) => r.json()).then((S) => {
  const nz = S.calendar.map((d) => d.count).filter(Boolean).sort((a, b) => a - b);
  const q = nz.length ? [0.25, 0.5, 0.75].map((p) => nz[Math.floor(nz.length * p)]) : [1, 2, 3];
  const lv = (c) => (c === 0 ? 0 : 1 + q.filter((t) => c > t).length);
  const pad = new Date(S.calendar[0].date + 'T00:00:00').getDay();
  const best = new Date(S.best_day.date + 'T00:00:00').toLocaleString('en', { month: 'short', day: 'numeric' });
  const tiles = [[S.contributions, 'contributions'], [S.commits, 'commits'], [S.repos, 'repositories'], [S.active_days, 'active days'], [S.longest_streak, 'day best streak'], [S.current_streak, 'day current streak'], [S.followers, 'follower'], [S.repos_contributed, 'repos contributed to']];
  const mx = Math.max(...S.months.map((m) => m.count), 1), wd = S.weekday, wmx = Math.max(...wd, 1);
  const mon = (m) => new Date(m + '-01T00:00:00').toLocaleString('en', { month: 'short' });
  const LC = ['#6aa0d8', '#e6c552', '#8f8fc0', '#c58ad8', '#e6a965', '#8fbf7a'];
  $('#dash').insertAdjacentHTML('beforeend', `<div class="tiles">${tiles.map(([v, l]) => `<div class="tile"><div class="v" data-to="${v}">0</div><div class="l">${l}</div></div>`).join('')}</div>
    <div class="gw"><div class="grid" id="grid">${'<span style="visibility:hidden"></span>'.repeat(pad)}${S.calendar.map((d, i) => `<span data-l="${lv(d.count)}" data-d="${d.date}" data-c="${d.count}" style="--c:${Math.floor((i + pad) / 7)}"></span>`).join('')}</div>
      <div class="bug" id="bug"><img alt=""><img alt=""><img alt=""><img alt=""></div></div>
    <div class="cap"><span>${S.contributions} contributions in the last year</span><span>best day <b>${best}</b>, ${S.best_day.count}</span></div>
    <div class="two"><div class="mini"><h4>Per month</h4><div class="bars">${S.months.map((m, i) => `<i style="--h:${Math.max(6, m.count / mx * 100)};--k:${i}" data-t="${mon(m.month)}: ${m.count}"></i>`).join('')}</div><div class="axis">${S.months.map((m) => `<span>${mon(m.month)[0]}</span>`).join('')}</div></div>
    <div class="mini"><h4>Week rhythm</h4><div class="bars">${wd.map((n, i) => `<i style="--h:${Math.max(6, n / wmx * 100)};--k:${i}" data-t="${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}: ${n}"></i>`).join('')}</div><div class="axis">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<span>${d}</span>`).join('')}</div></div></div>
    <div class="mini" style="margin-top:28px"><h4>Languages</h4><div class="lang">${S.languages.slice(0, 6).map((l, i) => `<i style="--w:${l.pct};--c:${LC[i]};--k:${i}"></i>`).join('')}</div><div class="llist">${S.languages.slice(0, 6).map((l, i) => `<span style="--c:${LC[i]}"><b>${l.name}</b> ${l.pct}%</span>`).join('')}</div></div>`);
  const tip = $('#tip'), grid = $('#grid');
  grid.addEventListener('pointerover', (e) => { const s = e.target.closest('span[data-d]'); if (!s) return; const r = s.getBoundingClientRect(); tip.textContent = `${s.dataset.c} on ${new Date(s.dataset.d + 'T00:00:00').toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`; tip.style.left = r.left + r.width / 2 + 'px'; tip.style.top = r.top + 'px'; tip.classList.add('on'); });
  grid.addEventListener('pointerleave', () => tip.classList.remove('on'));
  counters.push(...$$('#dash [data-to]'));
  setupBug(grid, pad);
  measure();
}).catch((e) => console.warn('stats unavailable', e));
function countUp(el) { const to = +el.dataset.to, t0 = performance.now(); const step = (n) => { const k = clamp((n - t0) / 1300), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(step); }; reduce ? (el.textContent = to) : requestAnimationFrame(step); }

function setupBug(grid, pad) {
  const bug = $('#bug'), imgs = $$('img', bug), cells = $$('span', grid).slice(pad);
  imgs.forEach((im, i) => { im.src = `sprites/bug_walk${i}.webp`; });
  const ncol = Math.ceil((cells.length + pad) / 7), order = [];
  for (let c = 0; c < ncol; c++) { const col = []; for (let r = 0; r < 7; r++) { const k = c * 7 + r - pad; if (k >= 0 && k < cells.length) col.push(k); } if (c % 2) col.reverse(); order.push(...col); }
  const act = order.map((k) => +cells[k].dataset.l > 0), CH = 0.28, FAST = 0.05, START = 1.4, END = 2.4;
  const cum = [START]; order.forEach((k, i) => cum.push(cum[i] + (act[i] ? CH : FAST)));
  const total = cum[cum.length - 1] + END;
  let centers = [], u = 0, fedFrom = null, gone = new Uint8Array(order.length), lastFrame = -1, heading = 0;
  const wrap = grid.parentElement;
  const layout = () => { const wr = wrap.getBoundingClientRect(); centers = order.map((k) => { const r = cells[k].getBoundingClientRect(); return [r.left - wr.left + r.width / 2, r.top - wr.top + r.height / 2]; }); const s = Math.max(24, cells[0].getBoundingClientRect().width * 3.2); bug.style.width = bug.style.height = s + 'px'; bug.style.margin = `${-s / 2}px 0 0 ${-s / 2}px`; };
  layout(); addEventListener('resize', layout); new ResizeObserver(layout).observe(wrap);
  const crumb = (x, y) => { if (reduce) return; for (let i = 0; i < 4; i++) { const c = document.createElement('i'); c.className = 'crumb'; c.style.left = x + 'px'; c.style.top = y + 'px'; wrap.appendChild(c); const a = Math.random() * 6.28, d = 8 + Math.random() * 12; c.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 6}px) scale(0)`, opacity: 0 }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => c.remove(); } };
  grid.addEventListener('pointerdown', (e) => { const s = e.target.closest('span[data-d]'); if (!s) return; const k = cells.indexOf(s), i = order.indexOf(k); if (i >= 0) fedFrom = { from: u, to: cum[i], t0: performance.now() }; });
  crawl.step = (dt) => {
    if (!crawl.visible || !centers.length) return;
    if (fedFrom) { const kk = clamp((performance.now() - fedFrom.t0) / 700); u = lerp(fedFrom.from, fedFrom.to, 1 - Math.pow(1 - kk, 3)); if (kk >= 1) fedFrom = null; }
    else u += dt;
    if (u >= total) { u = 0; }
    // which cell the bug is on (binary search over cumulative times)
    let lo = 0, hi = order.length; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m + 1] <= u) lo = m + 1; else hi = m; }
    const i = Math.min(lo, order.length - 1), j = Math.min(i + 1, order.length - 1);
    const tt = clamp((u - cum[i]) / Math.max(1e-3, cum[i + 1] - cum[i])), pa = centers[i], pb = centers[j];
    const x = lerp(pa[0], pb[0], act[i] ? smooth(tt * 0.6 + 0.4 * tt) : tt), y = lerp(pa[1], pb[1], act[i] ? smooth(tt * 0.6 + 0.4 * tt) : tt);
    if (u < START) { bug.style.opacity = clamp(u / 0.5); } else bug.style.opacity = 1;
    const dx = pb[0] - pa[0], dy = pb[1] - pa[1]; if (Math.hypot(dx, dy) > 0.1) { const h = Math.atan2(dx, -dy); let d = h - heading; d = Math.atan2(Math.sin(d), Math.cos(d)); heading += d * 0.35; }
    bug.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${heading.toFixed(3)}rad)`;
    const f = Math.floor(performance.now() / (act[i] ? 140 : 80)) % 4; imgs.forEach((im, n) => im.classList.toggle('on', n === f));
    // cells flip to eaten when the bug reaches them, and all grow back when it starts over
    for (let n = 0; n < order.length; n++) {
      const want = act[n] && cum[n] + 0.1 <= u ? 1 : 0;
      if (want !== gone[n]) { gone[n] = want; cells[order[n]].classList.toggle('gone', !!want); if (want && !reduce) crumb(centers[n][0], centers[n][1]); }
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
function spark(x, y) {
  if (reduce) return;
  const r = document.createElement('i'); r.className = 'ring'; r.style.left = x + 'px'; r.style.top = y + 'px'; document.body.appendChild(r);
  r.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 0.9 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => r.remove();
  for (let i = 0; i < 6; i++) {
    const l = document.createElement('i'); l.className = night ? 'ff' : 'lf'; l.style.left = x + 'px'; l.style.top = y + 'px'; if (!night) l.style.background = BURST[(i * 2) % BURST.length]; document.body.appendChild(l);
    const ang = Math.random() * 6.283, d = 24 + Math.random() * 40;
    l.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d - (night ? 30 : 10)}px) rotate(${(Math.random() - 0.5) * 360}deg) scale(.3)`, opacity: 0 }], { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => l.remove();
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
  if (h && h.type === 'fruit') { tipEl.textContent = `${FRUIT_LABEL[h.id % FRUIT_LABEL.length]}: open`; tipEl.style.left = e.clientX + 'px'; tipEl.style.top = e.clientY + 'px'; tipEl.classList.add('on'); } else if (!e.target.closest('#grid')) tipEl.classList.remove('on');
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
