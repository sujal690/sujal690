import { createTree } from './tree.js?v=20261007e';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };

// ---------------------------------------------------------------- statement that lights up as you read
const ST = 'I own production AI and full-stack systems [end to end.] I build OCR and vision-language pipelines, computer vision tools and LLM integrations, and turn multi-day manual processes into workflows that finish in [minutes.]';
(() => { const out = []; let hl = false, i = 0; ST.split(' ').forEach((w) => { if (w.startsWith('[')) { hl = true; w = w.slice(1); } const end = w.endsWith(']'); if (end) w = w.slice(0, -1); out.push(`<span class="wd${hl ? ' hl' : ''}" style="--i:${i++}">${w}</span>`); if (end) hl = false; }); $('#st').innerHTML = out.join(' '); $('#st').style.setProperty('--n', i); })();

// ---------------------------------------------------------------- work
const DIAG = {
  docs: `<svg viewBox="0 0 400 150"><rect x="38" y="22" width="66" height="86" rx="7" fill="#1f2a21" stroke="rgba(236,233,223,.2)"/>${[44, 36, 46, 30, 40, 26].map((w, i) => `<rect x="48" y="${36 + i * 11}" width="${w}" height="4" rx="2" fill="rgba(238,248,239,.22)"/>`).join('')}
    <g class="d-scan"><rect x="36" y="10" width="70" height="16" fill="url(#scanG)"/><rect x="34" y="25" width="74" height="2.4" rx="1.2" fill="#e3a868"/></g>
    ${[114, 250].map((x) => `<path class="d-flow" d="M${x} 65 H${x + 40}" stroke="#9cbf7e" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round"/><path d="M${x + 36} 60 L${x + 42} 65 L${x + 36} 70" fill="none" stroke="#9cbf7e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
    <rect x="164" y="38" width="76" height="54" rx="12" fill="rgba(227,168,104,.10)" stroke="rgba(227,168,104,.55)"/><rect class="d-blink" x="164" y="38" width="76" height="54" rx="12" fill="none" stroke="#e3a868"/>
    <text x="202" y="63" text-anchor="middle" font-family="Outfit" font-weight="700" font-size="15" fill="#e3a868">VLM</text><text x="202" y="80" text-anchor="middle" font-family="Outfit" font-size="9.5" fill="#c3c7b7">ocr + vision</text>
    ${Array.from({ length: 20 }, (_, k) => { const r = Math.floor(k / 4), c = k % 4, x = 298 + c * 22, y = 26 + r * 17; return r === 0 ? `<rect x="${x}" y="${y}" width="19" height="13" rx="3" fill="#d9a23a" fill-opacity=".75"/>` : `<rect x="${x}" y="${y}" width="19" height="13" rx="3" fill="rgba(255,255,255,.06)"/><rect class="d-cell" style="--dl:${(0.25 + (k - 4) * 0.19).toFixed(2)}s" x="${x}" y="${y}" width="19" height="13" rx="3" fill="#9cbf7e"/>`; }).join('')}
    <defs><linearGradient id="scanG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e3a868" stop-opacity=".55"/><stop offset="1" stop-color="#e3a868" stop-opacity="0"/></linearGradient></defs></svg>`,
  orders: `<svg viewBox="0 0 400 150"><path d="M44 66 H356" stroke="rgba(255,255,255,.08)" stroke-width="4" stroke-linecap="round"/><path class="d-line" d="M44 66 H356" stroke="#9cbf7e" stroke-width="4" stroke-linecap="round"/>
    ${[44, 122, 200, 278, 356].map((x, i) => `<circle cx="${x}" cy="66" r="10" fill="#1f2a21" stroke="rgba(236,233,223,.25)" stroke-width="2"/><circle class="lit${i}" cx="${x}" cy="66" r="6" fill="#e3a868"/>`).join('')}
    <g class="d-pk"><circle cx="44" cy="66" r="7" fill="#d9a23a"/><circle class="d-ring" cx="44" cy="66" r="7" fill="none" stroke="#d9a23a" stroke-width="1.5"/></g>
    <g transform="translate(316 12)"><rect width="56" height="22" rx="11" fill="rgba(156,191,126,.14)" stroke="rgba(156,191,126,.5)"/><circle class="d-blink" cx="13" cy="11" r="3.5" fill="#9cbf7e"/><text x="22" y="15" font-family="Outfit" font-weight="700" font-size="10.5" fill="#9cbf7e">live</text></g>
    ${[180, 140, 160].map((w, i) => `<rect x="44" y="${96 + i * 11}" width="${w}" height="5" rx="2.5" fill="rgba(255,255,255,.07)"/>`).join('')}</svg>`,
  search: `<svg viewBox="0 0 400 150"><rect x="30" y="16" width="104" height="96" rx="12" fill="#1f2a21" stroke="rgba(236,233,223,.2)"/><circle cx="82" cy="70" r="22" fill="none" stroke="#d9a23a" stroke-width="3"/><path d="M74 46 L82 38 L90 46 L82 54 Z" fill="#d9a23a" fill-opacity=".85"/>
    ${[[36, 22, 1, 1], [128, 22, -1, 1], [36, 106, 1, -1], [128, 106, -1, -1]].map(([x, y, dx, dy]) => `<path d="M${x} ${y + 10 * dy} V${y} H${x + 10 * dx}" fill="none" stroke="#e3a868" stroke-width="2" stroke-linecap="round"/>`).join('')}
    <rect class="d-hscan" x="34" y="20" width="2" height="88" fill="#e3a868" opacity=".85"/>
    <path class="d-flow" d="M142 64 H176" stroke="#9cbf7e" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round"/><path d="M172 59 L178 64 L172 69" fill="none" stroke="#9cbf7e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${Array.from({ length: 6 }, (_, k) => { const r = Math.floor(k / 3), c = k % 3, x = 192 + c * 62, y = 16 + r * 50, rr = [14, 11, 16, 12, 15, 10][k] * 0.7; return `<rect x="${x}" y="${y}" width="54" height="44" rx="8" fill="#1f2a21" stroke="rgba(236,233,223,.2)"/><circle cx="${x + 27}" cy="${y + 24}" r="${rr.toFixed(1)}" fill="none" stroke="#d9a23a" stroke-opacity=".55" stroke-width="2"/>`; }).join('')}
    <rect class="d-hop" x="189" y="13" width="60" height="50" rx="10" fill="none" stroke="#e3a868" stroke-width="2.4"/>
    <g class="d-pop"><circle cx="306" cy="68" r="9" fill="#9cbf7e"/><path d="M301.5 68 L305 71.5 L311 64.5" fill="none" stroke="#0c110d" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`,
  security: `<svg viewBox="0 0 400 150"><defs><linearGradient id="coneG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e3a868" stop-opacity=".35"/><stop offset="1" stop-color="#e3a868" stop-opacity="0"/></linearGradient></defs>
    <path class="d-sweep" d="M88 52 L258 10 L258 94 Z" fill="url(#coneG)"/>
    <rect x="38" y="38" width="50" height="28" rx="7" fill="#1f2a21" stroke="#c3c7b7" stroke-opacity=".7" stroke-width="1.6"/><circle cx="80" cy="52" r="7" fill="#0c110d" stroke="#e3a868" stroke-width="2"/><circle class="d-blink" cx="80" cy="52" r="2.5" fill="#e3a868"/><path d="M58 66 V82 M48 82 H68" stroke="#c3c7b7" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="290" cy="54" r="17" fill="none" stroke="#ece9df" stroke-opacity=".75" stroke-width="2"/><path d="M262 98 C264 76 316 76 318 98" fill="none" stroke="#ece9df" stroke-opacity=".75" stroke-width="2"/>
    ${[[250, 24, 1, 1], [330, 24, -1, 1], [250, 104, 1, -1], [330, 104, -1, -1]].map(([x, y, dx, dy]) => `<path d="M${x} ${y + 13 * dy} V${y} H${x + 13 * dx}" fill="none" stroke="#e3a868" stroke-width="2.4" stroke-linecap="round"/>`).join('')}
    <rect class="d-vscan" x="254" y="28" width="72" height="2" fill="#e3a868" opacity=".8"/>
    <g class="d-pop"><circle cx="330" cy="24" r="10" fill="#9cbf7e"/><path d="M325 24 L329 28 L335.5 20.5" fill="none" stroke="#0c110d" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></g>
    <g transform="translate(30 104)"><rect width="88" height="22" rx="11" fill="rgba(217,162,58,.12)" stroke="rgba(217,162,58,.5)"/><text x="44" y="15" text-anchor="middle" font-family="Outfit" font-weight="700" font-size="10" fill="#d9a23a">NVIDIA edge</text></g></svg>`,
};

const WORK = [
  ['docs', 'Intelligent Document Automation', 'An OCR-to-spreadsheet pipeline pairing state-of-the-art text recognition with a locally hosted vision-language model. A multi-day manual process now runs in minutes and is a core tool across the company.', ['OCR', 'VLM', 'Python']],
  ['orders', 'Enterprise Order Tracking', 'A real-time, full-stack platform spanning the entire order lifecycle, adopted company-wide as the single source of truth for order status.', ['Full-stack', 'Real-time']],
  ['search', 'Visual Product Search', 'Instant retrieval of gold design records from a rough photo or an SKU code, through a multi-model computer-vision pipeline built for accuracy and low latency.', ['Computer vision', 'Search']],
  ['security', 'AI Security Intelligence', 'In progress with an external technology firm: facial recognition plus a generative video-understanding model on NVIDIA edge hardware, verifying security-check compliance in real time.', ['Edge AI', 'Video understanding']],
];
$('#rows').innerHTML = WORK.map(([d, t, p, tags], i) => `<div class="row" data-open="${i === 0}"><button aria-expanded="${i === 0}"><span class="t">${t}</span><span class="pm"></span></button><div class="body"><div><p>${p}</p><div class="vis">${DIAG[d]}</div><div class="tags">${tags.map((x) => `<span>${x}</span>`).join('')}</div></div></div></div>`).join('');
const lit = document.createElement('style');
lit.textContent = [0, 1, 2, 3, 4].map((i) => { const a = (80 * i / 4).toFixed(1); return `@keyframes lk${i}{0%,${Math.max(0, a - 0.1)}%{opacity:0}${(+a + 1.5).toFixed(1)}%,96%{opacity:1}100%{opacity:0}}.lit${i}{opacity:0;animation:lk${i} 4.5s ease-in-out infinite}`; }).join('');
document.head.appendChild(lit);
$$('.row').forEach((row) => $('button', row).addEventListener('click', () => {
  const open = row.dataset.open === 'true';
  $$('.row').forEach((r) => { r.dataset.open = 'false'; $('button', r).setAttribute('aria-expanded', 'false'); });
  if (!open) { row.dataset.open = 'true'; $('button', row).setAttribute('aria-expanded', 'true'); }
}));

// ---------------------------------------------------------------- activity (real GitHub data)
const counters = [];
fetch('stats.json?v=' + Date.now().toString().slice(0, 7)).then((r) => r.json()).then((S) => {
  const nz = S.calendar.map((d) => d.count).filter(Boolean).sort((a, b) => a - b);
  const q = nz.length ? [0.25, 0.5, 0.75].map((p) => nz[Math.floor(nz.length * p)]) : [1, 2, 3];
  const lv = (c) => (c === 0 ? 0 : 1 + q.filter((t) => c > t).length);
  const pad = new Date(S.calendar[0].date + 'T00:00:00').getDay();
  const best = new Date(S.best_day.date + 'T00:00:00').toLocaleString('en', { month: 'short', day: 'numeric' });
  const tiles = [[S.contributions, 'contributions'], [S.commits, 'commits'], [S.repos, 'repositories'], [S.active_days, 'active days'], [S.longest_streak, 'day best streak'], [S.public_repos, 'public repositories']];
  $('#dash').insertAdjacentHTML('beforeend', `<div class="tiles">${tiles.map(([v, l]) => `<div class="tile"><div class="v" data-to="${v}">0</div><div class="l">${l}</div></div>`).join('')}</div>
    <div class="grid" id="grid">${'<span style="visibility:hidden"></span>'.repeat(pad)}${S.calendar.map((d, i) => `<span data-l="${lv(d.count)}" data-d="${d.date}" data-c="${d.count}" style="--c:${Math.floor((i + pad) / 7)}"></span>`).join('')}</div>
    <div class="cap"><span>${S.contributions} contributions</span><span>best day ${best}, ${S.best_day.count}</span></div>
    <div class="langs">${S.languages.slice(0, 6).map((l) => `<span><b>${l.name}</b> ${l.pct}%</span>`).join('')}</div>`);
  const tip = $('#tip');
  $('#grid').addEventListener('pointerover', (e) => { const s = e.target.closest('span[data-d]'); if (!s) return; const r = s.getBoundingClientRect(); tip.textContent = `${s.dataset.c} on ${new Date(s.dataset.d + 'T00:00:00').toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`; tip.style.left = r.left + r.width / 2 + 'px'; tip.style.top = r.top + 'px'; tip.classList.add('on'); });
  $('#grid').addEventListener('pointerleave', () => tip.classList.remove('on'));
  counters.push(...$$('#dash [data-to]'));
  measure();
}).catch((e) => console.warn('stats unavailable', e));
function countUp(el) { const to = +el.dataset.to, t0 = performance.now(); const step = (n) => { const k = clamp((n - t0) / 1200), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(step); }; reduce ? (el.textContent = to) : requestAnimationFrame(step); }

// ---------------------------------------------------------------- path
const PATH = [['June 2026 to now', 'AI Software Engineer, Sky Gold and Diamonds', 'Sole technical owner of the company’s AI and automation products, with Docker and CI/CD for every release.', true],
  ['May 2026', 'B.E. Computer Science', 'Saraswati College of Engineering, University of Mumbai. CGPA 9.0.'],
  ['2025', 'Full Stack Developer Intern, Chemtron Science Laboratories', 'A MERN and Electron desktop app that cut manual billing and order work by 40%.'],
  ['2025', '1st Place, SCOE Avishkar', 'The college’s flagship project competition.'],
  ['2024', 'Grand Finalist and Global Nominee', 'Smart India Hackathon (Ministry of Coal) and NASA Space Apps Challenge.']];
$('#steps').innerHTML = PATH.map(([y, h, p, now]) => `<div class="step${now ? ' now' : ''}"><div class="y">${y}</div><h3>${h}</h3><p>${p}</p></div>`).join('');

// ---------------------------------------------------------------- toolkit: hovering a skill names the projects that use it
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

// ---------------------------------------------------------------- reveals + nav indicator
const io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; e.target.classList.add('in'); $$('[data-to]', e.target).forEach(countUp); io.unobserve(e.target); }), { threshold: 0.15 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = (el.closest('#hero') ? i * 90 : 0) + 'ms'; io.observe(el); });
const links = $$('.links a:not(.ext)'), ind = $('.links .ind');
const navIO = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return; const a = links.find((l) => l.getAttribute('href') === '#' + e.target.id);
  links.forEach((l) => l.classList.toggle('on', l === a));
  if (a) { ind.style.opacity = 1; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft - 5}px)`; } else ind.style.opacity = 0;
}), { rootMargin: '-45% 0px -50% 0px' });
['hero', 'intro', 'work', 'stats', 'path', 'toolkit', 'contact'].forEach((id) => navIO.observe($('#' + id)));

// ---------------------------------------------------------------- the tree story, driven by scroll position
const tree = await createTree($('#tree'));
let M = {};
function measure() {
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  M = { max: Math.max(1, document.documentElement.scrollHeight - innerHeight), hero: $('#hero').offsetHeight, intro: top($('#intro')), introH: $('#intro').offsetHeight };
}
const S = { p: 0, fly: 0, fall: 0, grow: 0, fruit: 0, ripe: 0, autumn: 0 };
let t = 0, last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  t += dt;
  const y = scrollY, vh = innerHeight;
  const p = clamp(y / (M.max || 1));
  const heroP = clamp(y / ((M.hero || vh) * 0.9));
  const target = {
    p,
    fly: smooth(heroP / 0.35),              // the ladybug leaves first
    fall: smooth((heroP - 0.25) / 0.75),     // then the leaf drifts down and becomes the seed
    grow: smooth((p - 0.12) / 0.58),         // the tree grows through the middle of the page
    fruit: smooth((p - 0.62) / 0.18),        // fruit sets on the outer twigs
    ripe: smooth((p - 0.74) / 0.14),         // and ripens from green to apricot
    autumn: smooth((p - 0.88) / 0.11),       // the canopy turns gold at the end
  };
  const k = reduce ? 1 : 1 - Math.pow(0.0015, dt);
  for (const key in S) S[key] += (target[key] - S[key]) * k;
  if (M.intro !== undefined) $('#st').style.setProperty('--p', clamp((y + vh * 0.75 - M.intro) / (M.introH * 0.8), 0, 1.05).toFixed(4));
  tree.draw(S, t, reduce);
  requestAnimationFrame(frame);
}
addEventListener('resize', measure);
await document.fonts.ready;
measure();
new ResizeObserver(measure).observe(document.body);
requestAnimationFrame(frame);
