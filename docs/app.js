import { createGrove } from './grove.js?v=20261007b';
import { phaseForHour } from './scene.js?v=20261006c';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mobile = () => innerWidth <= 860;

// ---------------------------------------------------------------- time of day
const GREET = { morning: 'good morning, I’m', afternoon: 'good afternoon, I’m', evening: 'good evening, I’m', night: 'still up? I’m' };
const HERE = { morning: 'morning light', afternoon: 'afternoon sun', evening: 'golden hour', night: 'firefly hours' };
const localHour = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
const ist = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
const istHour = () => { const [h, m] = ist().split(':').map(Number); return h + m / 60; };
let mode = 'auto', phase = phaseForHour(localHour()), grove = null;
const segBtns = $$('.seg button'), pill = $('.seg .pill');
function placePill() { const b = segBtns.find((x) => x.dataset.p === phase); if (b) { pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft - 4}px)`; } }
function clocks() {
  const d = new Date(), hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  $('#tm').innerHTML = mode === 'auto' ? `your time <b>${hm}</b>` : `previewing ${phase} · <button id="back">back to my time</button>`;
  const bk = $('#back'); if (bk) bk.onclick = () => { mode = 'auto'; setPhase(phaseForHour(localHour())); };
  $('#nclock').textContent = ist();
  $('#local').innerHTML = `It’s <b>${ist()}</b> in Navi Mumbai, ${HERE[phaseForHour(istHour())]}.`;
}
function setPhase(p, instant = false) {
  phase = p; root.dataset.phase = p; $('#greet').textContent = GREET[p];
  segBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.p === p))); placePill();
  if (grove) grove.setPhase(p, instant);
  clocks();
}
segBtns.forEach((b) => b.addEventListener('click', () => { mode = 'manual'; setPhase(b.dataset.p); }));
setInterval(() => { if (mode === 'auto') { const p = phaseForHour(localHour()); if (p !== phase) setPhase(p); } clocks(); }, 20000);
root.dataset.phase = phase;

// ---------------------------------------------------------------- the grove
const gl = $('#gl');
const gpu = (() => { try { const c = document.createElement('canvas').getContext('webgl2'); const e = c.getExtension('WEBGL_debug_renderer_info'); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : ''; } catch (e) { return ''; } })();
const weak = /Intel|UHD|Iris|Mali|Adreno|PowerVR|SwiftShader|llvmpipe/i.test(gpu);
let dpr = Math.min(devicePixelRatio || 1, mobile() || weak ? 1 : 1.5); const maxDpr = Math.min(devicePixelRatio || 1, weak ? 1.25 : 1.75);
try { grove = createGrove({ canvas: gl, width: innerWidth, height: innerHeight, dpr, phase }); } catch (e) { console.warn('3D disabled', e); gl.remove(); }
let ft = 0, fn = 0, calm = 0;
function adapt(dt) {
  ft += dt; fn++; if (fn < 40) return;
  const avg = ft / fn * 1000; ft = 0; fn = 0; let nd = dpr;
  if (avg > 17.6 && dpr > 0.65) nd = Math.max(0.65, +(dpr - 0.1).toFixed(2));
  else if (avg < 15.2 && dpr < maxDpr && ++calm > 3) { nd = Math.min(maxDpr, +(dpr + 0.05).toFixed(2)); calm = 0; }
  if (nd !== dpr) { dpr = nd; grove.resize(innerWidth, innerHeight, dpr); }
}
const ptr = { sx: 0, sy: 0 }; let tx = 0, ty = 0;
addEventListener('pointermove', (e) => {
  tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1;
  if (grove && !e.target.closest('a,button')) document.body.style.cursor = grove.hitBug(tx, -ty) ? 'pointer' : '';
}, { passive: true });
addEventListener('pointerdown', (e) => {
  if (!grove || e.target.closest('a,button,input')) return;
  const nx = e.clientX / innerWidth * 2 - 1, ny = -(e.clientY / innerHeight * 2 - 1);
  if (grove.hitBug(nx, ny)) { grove.poke(); $('#hint').classList.remove('on'); hinted = true; }
});
let hinted = false;
setTimeout(() => { if (!hinted && scrollY < innerHeight * 0.3) $('#hint').classList.add('on'); }, 9000);
setTimeout(() => $('#hint').classList.remove('on'), 16000);

// ---------------------------------------------------------------- statement
const ST = 'I own production AI and full-stack systems [end to end.] I build OCR and vision-language pipelines, computer vision tools and LLM integrations, and turn multi-day manual processes into workflows that finish in [minutes.]';
(() => { const out = []; let hl = false, i = 0; ST.split(' ').forEach((w) => { if (w.startsWith('[')) { hl = true; w = w.slice(1); } const end = w.endsWith(']'); if (end) w = w.slice(0, -1); out.push(`<span class="wd${hl ? ' hl' : ''}" style="--i:${i++}">${w}</span>`); if (end) hl = false; }); $('#st').innerHTML = out.join(' '); $('#st').style.setProperty('--n', i); })();

// ---------------------------------------------------------------- work
const DIAG = {
  docs: `<svg viewBox="0 0 400 150"><rect x="38" y="22" width="66" height="86" rx="7" fill="#11291d" stroke="rgba(158,232,180,.2)"/>${[44, 36, 46, 30, 40, 26].map((w, i) => `<rect x="48" y="${36 + i * 11}" width="${w}" height="4" rx="2" fill="rgba(238,248,239,.22)"/>`).join('')}
    <g class="d-scan"><rect x="36" y="10" width="70" height="16" fill="url(#scanG)"/><rect x="34" y="25" width="74" height="2.4" rx="1.2" fill="#c8f06a"/></g>
    ${[114, 250].map((x) => `<path class="d-flow" d="M${x} 65 H${x + 40}" stroke="#3fd17f" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round"/><path d="M${x + 36} 60 L${x + 42} 65 L${x + 36} 70" fill="none" stroke="#3fd17f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
    <rect x="164" y="38" width="76" height="54" rx="12" fill="rgba(200,240,106,.10)" stroke="rgba(200,240,106,.55)"/><rect class="d-blink" x="164" y="38" width="76" height="54" rx="12" fill="none" stroke="#c8f06a"/>
    <text x="202" y="63" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="15" fill="#c8f06a">VLM</text><text x="202" y="80" text-anchor="middle" font-family="JetBrains Mono" font-size="9.5" fill="#b9d8c3">ocr + vision</text>
    ${Array.from({ length: 20 }, (_, k) => { const r = Math.floor(k / 4), c = k % 4, x = 298 + c * 22, y = 26 + r * 17; return r === 0 ? `<rect x="${x}" y="${y}" width="19" height="13" rx="3" fill="#f2c14e" fill-opacity=".75"/>` : `<rect x="${x}" y="${y}" width="19" height="13" rx="3" fill="rgba(255,255,255,.06)"/><rect class="d-cell" style="--dl:${(0.25 + (k - 4) * 0.19).toFixed(2)}s" x="${x}" y="${y}" width="19" height="13" rx="3" fill="#3fd17f"/>`; }).join('')}
    <defs><linearGradient id="scanG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#c8f06a" stop-opacity=".55"/><stop offset="1" stop-color="#c8f06a" stop-opacity="0"/></linearGradient></defs></svg>`,
  orders: `<svg viewBox="0 0 400 150"><path d="M44 66 H356" stroke="rgba(255,255,255,.08)" stroke-width="4" stroke-linecap="round"/><path class="d-line" d="M44 66 H356" stroke="#3fd17f" stroke-width="4" stroke-linecap="round"/>
    ${[44, 122, 200, 278, 356].map((x, i) => `<circle cx="${x}" cy="66" r="10" fill="#11291d" stroke="rgba(158,232,180,.25)" stroke-width="2"/><circle class="lit${i}" cx="${x}" cy="66" r="6" fill="#c8f06a"/>`).join('')}
    <g class="d-pk"><circle cx="44" cy="66" r="7" fill="#f2c14e"/><circle class="d-ring" cx="44" cy="66" r="7" fill="none" stroke="#f2c14e" stroke-width="1.5"/></g>
    <g transform="translate(316 12)"><rect width="56" height="22" rx="11" fill="rgba(63,209,127,.14)" stroke="rgba(63,209,127,.5)"/><circle class="d-blink" cx="13" cy="11" r="3.5" fill="#3fd17f"/><text x="22" y="15" font-family="JetBrains Mono" font-weight="700" font-size="10.5" fill="#3fd17f">live</text></g>
    ${[180, 140, 160].map((w, i) => `<rect x="44" y="${96 + i * 11}" width="${w}" height="5" rx="2.5" fill="rgba(255,255,255,.07)"/>`).join('')}</svg>`,
  search: `<svg viewBox="0 0 400 150"><rect x="30" y="16" width="104" height="96" rx="12" fill="#11291d" stroke="rgba(158,232,180,.2)"/><circle cx="82" cy="70" r="22" fill="none" stroke="#f2c14e" stroke-width="3"/><path d="M74 46 L82 38 L90 46 L82 54 Z" fill="#f2c14e" fill-opacity=".85"/>
    ${[[36, 22, 1, 1], [128, 22, -1, 1], [36, 106, 1, -1], [128, 106, -1, -1]].map(([x, y, dx, dy]) => `<path d="M${x} ${y + 10 * dy} V${y} H${x + 10 * dx}" fill="none" stroke="#c8f06a" stroke-width="2" stroke-linecap="round"/>`).join('')}
    <rect class="d-hscan" x="34" y="20" width="2" height="88" fill="#c8f06a" opacity=".85"/>
    <path class="d-flow" d="M142 64 H176" stroke="#3fd17f" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round"/><path d="M172 59 L178 64 L172 69" fill="none" stroke="#3fd17f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${Array.from({ length: 6 }, (_, k) => { const r = Math.floor(k / 3), c = k % 3, x = 192 + c * 62, y = 16 + r * 50, rr = [14, 11, 16, 12, 15, 10][k] * 0.7; return `<rect x="${x}" y="${y}" width="54" height="44" rx="8" fill="#11291d" stroke="rgba(158,232,180,.2)"/><circle cx="${x + 27}" cy="${y + 24}" r="${rr.toFixed(1)}" fill="none" stroke="#f2c14e" stroke-opacity=".55" stroke-width="2"/>`; }).join('')}
    <rect class="d-hop" x="189" y="13" width="60" height="50" rx="10" fill="none" stroke="#c8f06a" stroke-width="2.4"/>
    <g class="d-pop"><circle cx="306" cy="68" r="9" fill="#3fd17f"/><path d="M301.5 68 L305 71.5 L311 64.5" fill="none" stroke="#0a1912" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`,
  security: `<svg viewBox="0 0 400 150"><defs><linearGradient id="coneG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c8f06a" stop-opacity=".35"/><stop offset="1" stop-color="#c8f06a" stop-opacity="0"/></linearGradient></defs>
    <path class="d-sweep" d="M88 52 L258 10 L258 94 Z" fill="url(#coneG)"/>
    <rect x="38" y="38" width="50" height="28" rx="7" fill="#11291d" stroke="#b9d8c3" stroke-opacity=".7" stroke-width="1.6"/><circle cx="80" cy="52" r="7" fill="#0a1912" stroke="#c8f06a" stroke-width="2"/><circle class="d-blink" cx="80" cy="52" r="2.5" fill="#c8f06a"/><path d="M58 66 V82 M48 82 H68" stroke="#b9d8c3" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="290" cy="54" r="17" fill="none" stroke="#eef8ef" stroke-opacity=".75" stroke-width="2"/><path d="M262 98 C264 76 316 76 318 98" fill="none" stroke="#eef8ef" stroke-opacity=".75" stroke-width="2"/>
    ${[[250, 24, 1, 1], [330, 24, -1, 1], [250, 104, 1, -1], [330, 104, -1, -1]].map(([x, y, dx, dy]) => `<path d="M${x} ${y + 13 * dy} V${y} H${x + 13 * dx}" fill="none" stroke="#c8f06a" stroke-width="2.4" stroke-linecap="round"/>`).join('')}
    <rect class="d-vscan" x="254" y="28" width="72" height="2" fill="#c8f06a" opacity=".8"/>
    <g class="d-pop"><circle cx="330" cy="24" r="10" fill="#3fd17f"/><path d="M325 24 L329 28 L335.5 20.5" fill="none" stroke="#0a1912" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></g>
    <g transform="translate(30 104)"><rect width="88" height="22" rx="11" fill="rgba(242,193,78,.12)" stroke="rgba(242,193,78,.5)"/><text x="44" y="15" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="10" fill="#f2c14e">NVIDIA edge</text></g></svg>`,
};

const WORK = [
  ['docs', 'Intelligent Document Automation', 'An OCR-to-spreadsheet pipeline pairing state-of-the-art text recognition with a locally hosted vision-language model. A multi-day manual process now runs in minutes, and it is a core tool across the company.', ['OCR', 'VLM', 'Python']],
  ['orders', 'Enterprise Order Tracking', 'A real-time, full-stack platform spanning the entire order lifecycle, adopted company-wide as the single source of truth for order status.', ['Full-stack', 'Real-time']],
  ['search', 'Visual Product Search', 'Instant retrieval of gold design records from a rough photo or an SKU code, through a multi-model computer-vision pipeline built for accuracy and low latency.', ['Computer vision', 'Search']],
  ['security', 'AI Security Intelligence', 'In progress with an external technology firm: facial recognition plus a generative video-understanding model on NVIDIA edge hardware, verifying security-check compliance in real time.', ['Edge AI', 'Video understanding']],
];
$('#rows').innerHTML = WORK.map(([d, t, p, tags], i) => `<div class="row" data-open="${i === 0}"><button aria-expanded="${i === 0}"><span class="t">${t}</span><span class="pm"></span></button><div class="body"><div><p>${p}</p><div class="vis">${DIAG[d]}</div><div class="tags">${tags.map((x) => `<span>${x}</span>`).join('')}</div></div></div></div>`).join('');
const lit = document.createElement('style');
lit.textContent = [0, 1, 2, 3, 4].map((i) => { const a = (80 * i / 4).toFixed(1); return `@keyframes lk${i}{0%,${Math.max(0, a - 0.1)}%{opacity:0}${(+a + 1.5).toFixed(1)}%,96%{opacity:1}100%{opacity:0}}.lit${i}{opacity:0;animation:lk${i} 4.5s var(--io) infinite}`; }).join('');
document.head.appendChild(lit);
$$('.row').forEach((row) => $('button', row).addEventListener('click', () => {
  const open = row.dataset.open === 'true';
  $$('.row').forEach((r) => { r.dataset.open = 'false'; $('button', r).setAttribute('aria-expanded', 'false'); });
  if (!open) { row.dataset.open = 'true'; $('button', row).setAttribute('aria-expanded', 'true'); }
}));

// ---------------------------------------------------------------- stats
fetch('stats.json?v=' + Date.now().toString().slice(0, 7)).then((r) => r.json()).then((S) => {
  const tiles = [[S.contributions, 'contributions'], [S.commits, 'commits'], [S.repos, 'repositories'], [S.active_days, 'active days'], [S.longest_streak + 'd', 'best streak'], [S.languages.length, 'languages']];
  const nz = S.calendar.map((d) => d.count).filter(Boolean).sort((a, b) => a - b);
  const q = nz.length ? [0.25, 0.5, 0.75].map((p) => nz[Math.floor(nz.length * p)]) : [1, 2, 3];
  const lv = (c) => (c === 0 ? 0 : 1 + q.filter((t) => c > t).length);
  const pad = new Date(S.calendar[0].date + 'T00:00:00').getDay();
  const best = new Date(S.best_day.date + 'T00:00:00').toLocaleString('en', { month: 'short', day: 'numeric' });
  $('#dash').innerHTML = `<div class="tiles">${tiles.map(([v, l]) => `<div class="tile"><div class="v" data-to="${parseInt(v, 10)}" data-suf="${String(v).endsWith('d') ? 'd' : ''}">0</div><div class="l">${l}</div></div>`).join('')}</div>
    <div class="heat"><div class="grid" id="grid">${'<span style="visibility:hidden"></span>'.repeat(pad)}${S.calendar.map((d) => `<span data-l="${lv(d.count)}" data-d="${d.date}" data-c="${d.count}"></span>`).join('')}</div>
    <div class="cap"><span>${S.contributions} contributions</span><span>best day ${best}, ${S.best_day.count}</span></div></div>
    <div class="langs">${S.languages.slice(0, 5).map((l, i) => `<div class="lang"><span>${l.name}</span><span class="b"><i style="--w:${(l.pct / S.languages[0].pct).toFixed(3)};--k:${i}"></i></span><span>${l.pct}%</span></div>`).join('')}</div>`;
  const tip = $('#tip');
  $('#grid').addEventListener('pointerover', (e) => { const s = e.target.closest('span[data-d]'); if (!s) return; const r = s.getBoundingClientRect(); tip.textContent = `${s.dataset.c} on ${new Date(s.dataset.d + 'T00:00:00').toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`; tip.style.left = r.left + r.width / 2 + 'px'; tip.style.top = r.top + 'px'; tip.classList.add('on'); });
  $('#grid').addEventListener('pointerleave', () => tip.classList.remove('on'));
  reveals.observe($('#dash'));
  measure();
}).catch((e) => console.warn('stats unavailable', e));
function countUp(el) { const to = +el.dataset.to, suf = el.dataset.suf || '', t0 = performance.now(); const step = (n) => { const k = clamp((n - t0) / 1300), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(to * e) + suf; if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }

// ---------------------------------------------------------------- path, toolkit, repos
const PATH = [['June 2026 to now', 'AI Software Engineer', 'Sky Gold and Diamonds. Sole technical owner of the company’s AI and automation products, with Docker and CI/CD for every release.', true],
  ['May 2026', 'B.E. Computer Science', 'Saraswati College of Engineering, University of Mumbai. CGPA 9.0.'],
  ['2025', 'Full Stack Developer Intern', 'Chemtron Science Laboratories. A MERN and Electron desktop app that cut manual billing and order work by 40%.'],
  ['2025', '1st Place, SCOE Avishkar', 'The college’s flagship project competition.'],
  ['2024', 'Grand Finalist and Global Nominee', 'Smart India Hackathon (Ministry of Coal) and NASA Space Apps Challenge.']];
$('#steps').innerHTML = PATH.map(([y, h, p, now]) => `<div class="step${now ? ' now' : ''}"><div class="y">${y}</div><h3>${h}</h3><p>${p}</p></div>`).join('');
const TOOLS = { ai: ['Machine learning', 'Computer vision', 'NLP', 'OCR', 'LLM', 'VLM', 'RAG', 'Hugging Face'], build: ['Python', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL'], ship: ['Docker', 'CI/CD', 'Git', 'Vercel', 'Render', 'System design'] };
$('#cloud').innerHTML = Object.entries(TOOLS).flatMap(([k, list]) => list.map((n) => `<span class="chip" data-k="${k}">${n}</span>`)).join('');
$$('.filters button').forEach((b) => b.addEventListener('click', () => { $$('.filters button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); $$('#cloud .chip').forEach((c) => c.classList.toggle('dim', b.dataset.f !== 'all' && c.dataset.k !== b.dataset.f)); }));
$('#repos').innerHTML = [['Culturama', '.NET temple-heritage web app', 'Culturama'], ['Odoo Appointment Booking', 'multi-role booking system', 'Odoo_Appointment_Booking'], ['Weapon Detection', 'YOLOv8, 90.4% mAP@0.5', 'weapon_detection_assignment']]
  .map(([n, d, s]) => `<a href="https://github.com/sujal690/${s}"><b>${n}</b><span>${d} ↗</span></a>`).join('');
$('#copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText('sujalshah630@gmail.com'); } catch (e) { /* the toast still shows the address was meant to be copied */ } $('#toast').classList.add('on'); setTimeout(() => $('#toast').classList.remove('on'), 1800); });

// ---------------------------------------------------------------- reveals, nav state
const reveals = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; e.target.classList.add('in'); $$('[data-to]', e.target).forEach(countUp); reveals.unobserve(e.target); }), { threshold: 0.2 });
$$('section.s .col').forEach((el) => reveals.observe(el));
const links = $$('nav .links a:not(.ext)');
const navIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((l) => l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
['hero', 'work', 'stats', 'path', 'toolkit', 'contact'].forEach((id) => navIO.observe($('#' + id)));

// ---------------------------------------------------------------- scroll story
let M = {};
function measure() {
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  M = { hero: $('#hero').offsetHeight, intro: top($('#intro')), introH: $('#intro').offsetHeight, contact: top($('#contact')), max: Math.max(1, document.documentElement.scrollHeight - innerHeight) };
}
const story = { fall: 0, grow: 0, gold: 0 };
let lenis = null;
if (!reduce) {
  try { const { default: Lenis } = await import('https://cdn.jsdelivr.net/npm/lenis@1.1.14/+esm'); lenis = new Lenis({ lerp: 0.09, smoothWheel: true }); root.classList.add('lenis'); }
  catch (e) { console.warn('smooth scroll unavailable', e); }
  if (lenis) $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const id = a.getAttribute('href'); if (id.length > 1) { e.preventDefault(); lenis.scrollTo(id, { offset: -10, duration: 1.4 }); } }));
}
let t = 0, last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (lenis) lenis.raf(now);
  const y = scrollY, vh = innerHeight;
  // the leaf falls through the first screen, the tree grows through the middle, and turns gold at the contact section
  const target = {
    fall: clamp(y / (M.hero * 0.85 || vh)),
    grow: clamp((y - (M.hero || vh) * 0.55) / Math.max(1, (M.contact || vh * 5) - (M.hero || vh) * 0.55 - vh * 0.6)),
    gold: clamp((y - ((M.contact || vh * 5) - vh * 0.9)) / (vh * 0.7)),
  };
  for (const k in story) story[k] += (target[k] - story[k]) * (reduce ? 1 : 1 - Math.pow(0.0008, dt));
  if (M.intro !== undefined) $('#st').style.setProperty('--p', clamp((y + vh * 0.8 - M.intro) / (M.introH * 0.8), 0, 1.05).toFixed(4));
  if (grove) {
    t += dt * (reduce ? 0.3 : 1);
    ptr.sx += (tx - ptr.sx) * 0.04; ptr.sy += (ty - ptr.sy) * 0.04;
    grove.frame(t, story, ptr, dt); adapt(dt);
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- boot
addEventListener('resize', () => { if (grove) grove.resize(innerWidth, innerHeight, dpr); placePill(); measure(); });
await document.fonts.ready;
measure(); setPhase(phase, true); clocks();
if (grove) { try { await grove.renderer.compileAsync(grove.scene, grove.camera); } catch (e) { /* compiles on first draw instead */ } }
requestAnimationFrame(frame);
new ResizeObserver(() => measure()).observe(document.body);
