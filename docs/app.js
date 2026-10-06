import { createScene, phaseForHour, DARK } from './scene.js?v=20261006c';
const T0 = performance.now(); window.__t = { moduleStart: Math.round(T0) };
const mark = (k) => { window.__t[k] = Math.round(performance.now()); };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const mobile = () => innerWidth <= 860;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const GK = 'M0 9 L0.3 4.6 C-6 4.2 -9.4 -0.9 -8.1 -5 C-6 -3.9 -4 -4.3 -2.5 -5.7 C-1.8 -4.3 -0.9 -4.3 0 -5.1 C0.9 -4.3 1.8 -4.3 2.5 -5.7 C4 -4.3 6 -3.9 8.1 -5 C9.4 -0.9 6 4.2 -0.3 4.6 Z';
const leafSVG = (c = 'currentColor', s = 1) => `<svg viewBox="-10 -10 20 20" aria-hidden="true"><path d="${GK}" fill="${c}" transform="scale(${s})"/></svg>`;

// ---------------------------------------------------------------- loader
const ln = $('#ln'); let lp = 0;
const lt = setInterval(() => { lp = Math.min(99, lp + 7 + Math.random() * 9); ln.textContent = String(Math.floor(lp)).padStart(2, '0'); }, 60);
function reveal() { clearInterval(lt); ln.textContent = '100'; setTimeout(() => $('#loader').classList.add('done'), 160); setTimeout(() => $('#loader').remove(), 1300); }

// ---------------------------------------------------------------- name
[['w1', 'Sujal', 0], ['w2', 'Shah', 5]].forEach(([id, t, o]) => { $('#' + id).innerHTML = [...t].map((c, i) => `<span class="c" style="--i:${i + o};--d:1.05s">${c}</span>`).join(''); });

// ---------------------------------------------------------------- time of day
const GREET = { morning: 'good morning, I’m', afternoon: 'good afternoon, I’m', evening: 'good evening, I’m', night: 'still up? I’m' };
const HERE = { morning: 'morning light', afternoon: 'afternoon sun', evening: 'golden hour', night: 'firefly hours' };
const localHour = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
const ist = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
const istHour = () => { const [h, m] = ist().split(':').map(Number); return h + m / 60; };
let mode = 'auto', phase = phaseForHour(localHour()), scene = null;
const segBtns = $$('.seg button'), pill = $('.seg .pill');
function placePill() { const b = segBtns.find((x) => x.dataset.p === phase); if (b) { pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft - 4}px)`; } }
function setPhase(p, instant = false) {
  phase = p; root.dataset.phase = p; $('#greet').textContent = GREET[p];
  segBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.p === p))); placePill();
  if (scene) scene.setPhase(p, instant);
  clocks();
}
function clocks() {
  const d = new Date(); const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  $('#tm').innerHTML = mode === 'auto' ? `your time <b>${hm}</b>, so it’s ${phase} here` : `previewing ${phase}. <button id="back">back to my time</button>`;
  const bk = $('#back'); if (bk) bk.onclick = () => { mode = 'auto'; setPhase(phaseForHour(localHour())); };
  $('#nclock').textContent = ist();
  $('#local').innerHTML = `It’s <b>${ist()}</b> in Navi Mumbai right now, ${HERE[phaseForHour(istHour())]}.`;
}
segBtns.forEach((b) => b.addEventListener('click', () => { mode = 'manual'; setPhase(b.dataset.p); burst(b.getBoundingClientRect().left + b.offsetWidth / 2, b.getBoundingClientRect().top, 8); }));
setInterval(() => { if (mode === 'auto') { const p = phaseForHour(localHour()); if (p !== phase) setPhase(p); } clocks(); }, 20000);
root.dataset.phase = phase; $('#greet').textContent = GREET[phase];

// ---------------------------------------------------------------- 3D hero (renders only while visible, adaptive resolution)
const hero = $('#hero'), gl = $('#gl');
// integrated GPUs start at 1x and earn resolution back if they keep up
const gpuName = (() => { try { const c = document.createElement('canvas').getContext('webgl2'); const e = c.getExtension('WEBGL_debug_renderer_info'); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : ''; } catch (e) { return ''; } })();
const weakGPU = /Intel|UHD|Iris|Mali|Adreno|PowerVR|SwiftShader|llvmpipe/i.test(gpuName);
let heroVisible = true, dpr = Math.min(devicePixelRatio || 1, mobile() || weakGPU ? 1 : 1.5); const maxDpr = Math.min(devicePixelRatio || 1, weakGPU ? 1.25 : 1.75);
const ptr = { sx: 0, sy: 0, scroll: 0 };
let tx = 0, ty = 0, t3 = 0, boost = 0;
try {
  scene = createScene({ canvas: gl, width: hero.clientWidth, height: hero.clientHeight, T: 40, live: true, dpr, leafCount: mobile() ? 18 : 30, phase, defs: DARK });
  scene.ptr.heroX = mobile() ? 2.2 : 3.2;
  Object.assign(ptr, scene.ptr);
  mark('sceneCreated');
} catch (e) { console.warn('3D disabled', e); gl.remove(); }
new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }, { threshold: 0 }).observe(hero);
addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
addEventListener('pointerdown', () => { boost = Math.max(boost, 5); }, { passive: true });
let ft = 0, fn = 0, calm = 0;
function adapt(dt) {
  ft += dt; fn++;
  if (fn < 40) return;
  const avg = ft / fn * 1000; ft = 0; fn = 0;
  let nd = dpr;
  if (avg > 17.6 && dpr > 0.65) nd = Math.max(0.65, +(dpr - 0.1).toFixed(2));
  else if (avg < 15.2 && dpr < maxDpr && ++calm > 3) { nd = Math.min(maxDpr, +(dpr + 0.05).toFixed(2)); calm = 0; }
  if (nd !== dpr) { dpr = nd; scene.resize(hero.clientWidth, hero.clientHeight, dpr); }
}

// ---------------------------------------------------------------- marquee
const words1 = ['Computer vision', 'OCR pipelines', 'Vision-language models', 'LLM integrations', 'RAG', 'Full-stack MERN', 'Next.js', 'Docker', 'CI/CD'];
const words2 = ['days into minutes', 'built end to end', 'shipped to production', 'used company-wide', 'grown in Navi Mumbai'];
function fillRow(el, words) { const seq = words.map((w) => `<span>${w}${leafSVG()}</span>`).join(''); el.innerHTML = seq + seq + seq; }
fillRow($('#m1'), words1); fillRow($('#m2'), words2);
let m1x = 0, m2x = 0, m1w = 1, m2w = 1, vel = 0, lastY = scrollY;

// ---------------------------------------------------------------- statement
const ST = 'I’m an AI Software Engineer who owns production AI and full-stack systems [end to end.] I build OCR and vision-language pipelines, computer vision tools and LLM integrations with Python and the MERN stack, and I turn multi-day manual processes into workflows that finish in [minutes.]';
(() => {
  const out = []; let hl = false, i = 0;
  ST.split(' ').forEach((w) => { if (w.startsWith('[')) { hl = true; w = w.slice(1); } const end = w.endsWith(']'); if (end) w = w.slice(0, -1); out.push(`<span class="wd${hl ? ' hl' : ''}" style="--i:${i++}">${w}</span>`); if (end) hl = false; });
  $('#st').innerHTML = out.join(' '); $('#st').style.setProperty('--n', i);
})();

// ---------------------------------------------------------------- work slides
const STK = 'stroke="currentColor"';
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
  { d: 'docs', t: 'Intelligent Document Automation', p: 'An enterprise OCR-to-spreadsheet pipeline that pairs state-of-the-art text recognition with a locally hosted vision-language model. It is now a core operational tool used across the company.', imp: 'days → minutes', tags: ['OCR', 'VLM', 'Python', 'Automation'] },
  { d: 'orders', t: 'Enterprise Order Tracking', p: 'A real-time, full-stack platform spanning the entire order lifecycle. Adopted company-wide as the single source of truth for order status, ending manual cross-team coordination.', imp: 'one source of truth', tags: ['Full-stack', 'Real-time', 'Production'] },
  { d: 'search', t: 'Visual Product Search', p: 'Instant retrieval of gold design records from a rough photo or an SKU code, orchestrating a multi-model computer-vision pipeline built for accuracy and low latency at scale.', imp: 'rough photo → exact design', tags: ['Computer vision', 'Search', 'Low latency'] },
  { d: 'security', t: 'AI Security Intelligence', p: 'Leading the design and integration, with an external technology firm, of facial recognition plus a generative video-understanding model on NVIDIA edge hardware that verifies security-check compliance in real time.', imp: 'compliance, verified live', tags: ['In progress', 'Face recognition', 'Video AI', 'Edge'] },
];
$('#track').innerHTML = WORK.map((w, i) => `<article class="slide"><div class="vis">${DIAG[w.d]}</div><div class="txt"><div class="co"><span>Sky Gold and Diamonds</span><span>${i + 1} of ${WORK.length}</span></div><h3>${w.t}</h3><p>${w.p}</p><div class="tags">${w.tags.map((t) => `<span class="${t === 'In progress' ? 'live' : ''}">${t}</span>`).join('')}</div><div class="imp">${w.imp}</div></div></article>`).join('');
// diagrams only animate while their slide is on screen (keeps paint work tiny)
const slideIO = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('on', e.isIntersecting)), { threshold: 0.05 });
$$('.slide').forEach((s) => slideIO.observe(s));
// order-tracking nodes light up as the packet passes them
const lit = document.createElement('style');
lit.textContent = [0, 1, 2, 3, 4].map((i) => { const a = (80 * i / 4).toFixed(1); return `@keyframes lk${i}{0%,${Math.max(0, a - 0.1)}%{opacity:0}${(+a + 1.5).toFixed(1)}%,96%{opacity:1}100%{opacity:0}}.lit${i}{opacity:0;animation:lk${i} 4.5s var(--io) infinite}`; }).join('');
document.head.appendChild(lit);

// ---------------------------------------------------------------- stats
const LV = (c, q) => (c === 0 ? 0 : 1 + q.filter((t) => c > t).length);
const PAL = ['#3fd17f', '#c8f06a', '#f2c14e', '#6fb39a', '#e0965a', '#a58fd6', '#7a8f84'];
let counters = [];
fetch('stats.json?v=' + Date.now().toString().slice(0, 7)).then((r) => r.json()).then((S) => {
  const tiles = [['contributions', S.contributions, '', 'last 12 months'], ['commits', S.commits, '', 'last 12 months'], ['repositories', S.repos, '', `${S.public_repos} public`],
    ['active days', S.active_days, '', 'of the last 365'], ['longest streak', S.longest_streak, 'd', 'days in a row'], ['current streak', S.current_streak, 'd', 'and counting']];
  const nz = S.calendar.map((d) => d.count).filter(Boolean).sort((a, b) => a - b);
  const q = nz.length ? [0.25, 0.5, 0.75].map((p) => nz[Math.floor(nz.length * p)]) : [1, 2, 3];
  const first = new Date(S.calendar[0].date + 'T00:00:00');
  const pad = first.getDay();
  const cells = Array.from({ length: pad }, () => '<span style="visibility:hidden"></span>').join('') +
    S.calendar.map((d, i) => `<span data-l="${LV(d.count, q)}" data-d="${d.date}" data-c="${d.count}" style="--c:${Math.floor((i + pad) / 7)}"></span>`).join('');
  const ncol = Math.ceil((S.calendar.length + pad) / 7); const months = []; let lm = -1;
  S.calendar.forEach((d, i) => { const dd = new Date(d.date + 'T00:00:00'); const col = Math.floor((i + pad) / 7); if (dd.getMonth() !== lm && dd.getDate() <= 7 && col < ncol - 2) { months.push([dd.toLocaleString('en', { month: 'short' }), (col / ncol * 100).toFixed(2)]); lm = dd.getMonth(); } });
  const mx = Math.max(...S.months.map((m) => m.count)) || 1;
  const W = 600, H = 220, pts = S.months.map((m, i) => [20 + (W - 40) * i / (S.months.length - 1), H - 26 - (H - 60) * m.count / mx]);
  let dPath = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2; dPath += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`; }
  const pk = S.months.reduce((a, b) => (b.count > a.count ? b : a));
  const pkLabel = new Date(pk.month + '-01T00:00:00').toLocaleString('en', { month: 'long', year: 'numeric' });
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], wmax = Math.max(...S.weekday);
  const langs = S.languages.slice(0, 6);
  $('#dash').innerHTML =
    tiles.map(([l, v, suf, x]) => `<div class="cardx tile"><div class="l">${l}</div><div class="v"><span data-to="${v}">0</span>${suf ? `<small>${suf}</small>` : ''}</div><div class="x">${x}</div></div>`).join('') +
    `<div class="cardx heat"><div class="top"><div><b>${S.contributions} contributions in the last year</b><em>best day ${new Date(S.best_day.date + 'T00:00:00').toLocaleString('en', { month: 'short', day: 'numeric' })}, ${S.best_day.count} commits</em></div><div class="leg">less <i style="background:#13281e"></i><i style="background:#1d5a38"></i><i style="background:#2c9455"></i><i style="background:#3fd17f"></i><i style="background:#c8f06a"></i> more</div></div><div class="gwrap"><div><div class="grid" id="grid">${cells}</div><div class="months">${months.map(([m, l]) => `<span style="left:${l}%">${m}</span>`).join('')}</div></div></div></div>` +
    `<div class="cardx chart"><h4>Contributions per month</h4><em>peak in ${pkLabel}</em><svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fd17f" stop-opacity=".45"/><stop offset="1" stop-color="#3fd17f" stop-opacity="0"/></linearGradient></defs>${[0, 1, 2].map((g) => `<path d="M20 ${H - 26 - (H - 60) * g / 2} H${W - 20}" stroke="rgba(158,232,180,.12)" stroke-dasharray="${g ? '2 5' : '0'}"/>`).join('')}<path class="ar" d="${dPath} L${W - 20} ${H - 26} L20 ${H - 26} Z" fill="url(#ag)"/><path class="ln" pathLength="1" d="${dPath}" fill="none" stroke="#c8f06a" stroke-width="3" stroke-linecap="round"/>${S.months.map((m, i) => `<text x="${pts[i][0]}" y="${H - 4}" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#8fae9c">${new Date(m.month + '-01T00:00:00').toLocaleString('en', { month: 'short' })}</text>`).join('')}</svg></div>` +
    `<div class="cardx langs"><h4>Top languages</h4><em>across all repositories</em>${langs.map((l, i) => `<div class="lang"><span>${l.name}</span><span class="b"><i style="--w:${(l.pct / langs[0].pct).toFixed(3)};--k:${i};background:${PAL[i]}"></i></span><span>${l.pct}%</span></div>`).join('')}</div>` +
    `<div class="cardx rhythm"><div><h4>Weekly rhythm</h4><em>most active on ${['Sundays','Mondays','Tuesdays','Wednesdays','Thursdays','Fridays','Saturdays'][S.weekday.indexOf(wmax)]}</em><span style="color:var(--soft);font-size:14px">updated ${S.generated} from the GitHub API</span></div><div class="bars">${S.weekday.map((v, i) => `<div><i class="${v === wmax ? 'top' : ''}" style="--h:${(v / wmax).toFixed(3)};--k:${i}"></i><span>${days[i]}</span></div>`).join('')}</div></div>`;
  counters = $$('#dash [data-to]');
  $$('#dash .cardx').forEach((c) => reveals.observe(c));
  // heatmap tooltips (one delegated listener)
  const tip = $('#tip');
  $('#grid').addEventListener('pointerover', (e) => { const s = e.target.closest('span[data-d]'); if (!s) return; const r = s.getBoundingClientRect(); const dd = new Date(s.dataset.d + 'T00:00:00').toLocaleString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); tip.textContent = `${s.dataset.c} contribution${s.dataset.c === '1' ? '' : 's'} on ${dd}`; tip.style.left = r.left + r.width / 2 + 'px'; tip.style.top = r.top + 'px'; tip.classList.add('on'); });
  $('#grid').addEventListener('pointerleave', () => tip.classList.remove('on'));
  measure();
}).catch((e) => console.warn('stats unavailable', e));
function countUp(el) {
  const to = +el.dataset.to, t0 = performance.now(), dur = 1400;
  const step = (now) => { const k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

// ---------------------------------------------------------------- path
const PATH = [
  ['June 2026 to now', 'AI Software Engineer', 'Sky Gold and Diamonds Pvt. Ltd.', 'Sole technical owner of the company’s AI and automation products, from requirements to production release and maintenance. Containerized services with Docker and set up CI/CD to standardize every release.'],
  ['May 2026', 'B.E. Computer Science', 'Saraswati College of Engineering, University of Mumbai', 'Graduated with a CGPA of 9.0 out of 10.'],
  ['2025', 'Full Stack Developer Intern', 'Chemtron Science Laboratories', 'Built a MERN + Electron desktop app for industrial gas cylinder management, automating billing and orders and cutting manual effort by 40%, with pressure-calculation modules, encrypted data and real-time dashboards.'],
  ['2025', '1st Place, SCOE Avishkar', 'Project Competition 2025', 'Took first place at the college’s flagship project competition.'],
  ['2024', 'Grand Finalist and Global Nominee', 'Smart India Hackathon 2024 · NASA Space Apps 2024', 'Grand Finalist at the Smart India Hackathon (Ministry of Coal) and a Global Nominee at the NASA Space Apps Challenge.'],
];
$('#vine').insertAdjacentHTML('beforeend', PATH.map(([w, t, o, p]) => `<div class="node"><div class="lf">${leafSVG('var(--acc)', 0.95)}</div><div class="when">${w}</div><h3>${t}</h3><div class="org">${o}</div><p>${p}</p></div>`).join(''));
const vine = $('#vine'), vgrow = $('#vgrow'), vstem = $('#vstem'), vnodes = $$('.node', vine);
let vineLen = 1, vineTop = 0, vineH = 1, nodeTops = [];
function layoutVine() {
  const h = vine.offsetHeight; nodeTops = vnodes.map((n) => n.offsetTop + 32);
  const pts = [0, ...nodeTops, h]; let d = 'M32 0 ';
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], m = (a + b) / 2, sw = i % 2 ? 18 : -18; d += `C ${32 + sw} ${m}, ${32 - sw} ${m}, 32 ${b} `; }
  vstem.setAttribute('d', d); vgrow.setAttribute('d', d); $('#vsvg').setAttribute('viewBox', `0 0 64 ${h}`);
  vineLen = vgrow.getTotalLength(); vgrow.style.strokeDasharray = vineLen; vineH = h;
}

// ---------------------------------------------------------------- toolkit
const TOOLS = { ai: ['#3fd17f', ['Machine learning', 'Computer vision', 'NLP', 'OCR', 'LLM', 'VLM', 'RAG', 'Hugging Face', 'Inference optimization']],
  build: ['#c8f06a', ['Python', 'TypeScript', 'JavaScript', 'SQL', 'React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'Redux', 'Tailwind CSS', 'REST APIs', 'Microservices']],
  ship: ['#f2c14e', ['Docker', 'CI/CD', 'Git', 'Vercel', 'Render', 'Postman', 'System design', 'Agile']] };
$('#cloud').innerHTML = Object.entries(TOOLS).flatMap(([k, [c, list]]) => list.map((n) => `<span class="chip" data-k="${k}" style="--c:${c}"><i></i>${n}</span>`)).join('');
$$('.filters button').forEach((b) => b.addEventListener('click', () => {
  const f = b.dataset.f; $$('.filters button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  const chips = $$('#cloud .chip'); const first = new Map(chips.map((c) => [c, c.getBoundingClientRect()]));
  chips.forEach((c) => c.classList.toggle('out', f !== 'all' && c.dataset.k !== f));
  chips.forEach((c) => {
    if (c.classList.contains('out')) return; const a = first.get(c), z = c.getBoundingClientRect();
    if (!a.width) { c.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.34,1.45,.64,1)' }); return; }
    c.animate([{ transform: `translate(${a.left - z.left}px,${a.top - z.top}px)` }, { transform: 'none' }], { duration: 560, easing: 'cubic-bezier(.23,1,.32,1)' });
  });
}));
$$('#cloud .chip').forEach((c) => c.addEventListener('click', () => { const r = c.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 7); c.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18) rotate(3deg)' }, { transform: 'scale(1)' }], { duration: 480, easing: 'cubic-bezier(.34,1.45,.64,1)' }); }));
const REPOS = [['Culturama', 'My first full-stack project: a .NET web app promoting India’s temple heritage, with temple info, nearby hotels and admin and user dashboards.', 'C#', '#a58fd6', 'Culturama'],
  ['Odoo Appointment Booking', 'Multi-role appointment booking with an admin panel, organizer and staff flows, custom booking questions and refund-safe cancellations.', 'TypeScript', '#3fd17f', 'Odoo_Appointment_Booking'],
  ['Weapon Detection', 'Real-time weapon detection with YOLOv8, reaching 90.4% mAP@0.5, with threat-level alerts for video streams and images.', 'Python', '#f2c14e', 'weapon_detection_assignment']];
$('#repos').innerHTML = REPOS.map(([n, d, l, c, slug]) => `<a class="repo" href="https://github.com/sujal690/${slug}" style="--c:${c}"><small>open source</small><h3>${n}</h3><p>${d}</p><div class="foot"><span><i></i>${l}</span><span class="go"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg></span></div></a>`).join('');
$$('.repo').forEach((r) => r.addEventListener('pointermove', (e) => { const b = r.getBoundingClientRect(); r.style.setProperty('--mx', e.clientX - b.left + 'px'); r.style.setProperty('--my', e.clientY - b.top + 'px'); }));

// ---------------------------------------------------------------- contact headline
(() => { const words = ['Let’s', 'build', 'something', '|that', '|thinks.']; $('#big').innerHTML = words.map((w) => w.startsWith('|') ? `<em>${w.slice(1)}</em>` : `<span style="white-space:nowrap">${[...w].map((c) => `<span class="ch">${c}</span>`).join('')}</span>`).join(' '); })();
$('#copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText('sujalshah630@gmail.com'); } catch (e) { /* clipboard blocked: the toast still confirms the address */ }
  $('#toast').classList.add('on'); setTimeout(() => $('#toast').classList.remove('on'), 1900);
  const ic = $('#cpi'); ic.innerHTML = '<path d="M5 12.5 10 17.5 19 7"/>'; setTimeout(() => { ic.innerHTML = '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'; }, 1900);
});

// ---------------------------------------------------------------- reveals + nav indicator
const reveals = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return; e.target.classList.add('in');
  $$('[data-to]', e.target).forEach(countUp); reveals.unobserve(e.target);
}), { threshold: 0.2 });
$$('section.s .wrap, #work .head').forEach((el) => reveals.observe(el));
const links = $$('nav .links a'), ind = $('nav .ind');
const navIO = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return; const a = links.find((l) => l.getAttribute('href') === '#' + e.target.id);
  links.forEach((l) => l.classList.toggle('on', l === a));
  if (a) { ind.style.opacity = 1; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft}px)`; } else ind.style.opacity = 0;
}), { rootMargin: '-45% 0px -50% 0px' });
['hero', 'intro', 'work', 'stats', 'path', 'toolkit', 'contact'].forEach((id) => navIO.observe($('#' + id)));

// ---------------------------------------------------------------- leaf bursts (canvas only runs while leaves are alive)
const fx = $('#fx'), fctx = fx.getContext('2d'); let parts = [], fxOn = false;
function fit() { const k = Math.min(2, devicePixelRatio || 1); fx.width = innerWidth * k; fx.height = innerHeight * k; fctx.setTransform(k, 0, 0, k, 0, 0); }
fit();
const gk = new Path2D('M0 12 L0.4 6 C-8 5.4 -12.5 -1.2 -10.8 -6.6 C-8 -5.2 -5.4 -5.8 -3.4 -7.6 C-2.4 -5.8 -1.2 -5.8 0 -6.8 C1.2 -5.8 2.4 -5.8 3.4 -7.6 C5.4 -5.8 8 -5.2 10.8 -6.6 C12.5 -1.2 8 5.4 -0.4 6 Z');
function burst(x, y, n = 14) {
  if (reduce) return; const cs = getComputedStyle(root); const cols = [cs.getPropertyValue('--acc').trim(), '#3fd17f', '#c8f06a', '#f2c14e'];
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4, v = 5 + Math.random() * 8; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, s: 0.6 + Math.random() * 0.8, life: 1, col: cols[i % 4] }); }
  if (!fxOn) { fxOn = true; requestAnimationFrame(fxLoop); }
}
function fxLoop() {
  fctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) { p.vy += 0.3; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.016; fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.r); fctx.scale(p.s, p.s); fctx.globalAlpha = Math.max(0, p.life); fctx.fillStyle = p.col; fctx.fill(gk); fctx.restore(); }
  if (parts.length) requestAnimationFrame(fxLoop); else { fxOn = false; fctx.clearRect(0, 0, innerWidth, innerHeight); }
}
$$('[data-burst]').forEach((b) => b.addEventListener('click', (e) => { const r = b.getBoundingClientRect(); burst(e.clientX || r.left + r.width / 2, e.clientY || r.top, 16); boost = 8; }));
$('.av').addEventListener('click', (e) => { burst(e.clientX, e.clientY, 22); boost = 9; });

// magnetic buttons
if (fine) $$('[data-magnet]').forEach((b) => {
  b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px)`; });
  b.addEventListener('pointerleave', () => { b.style.transform = ''; });
});
// cursor ring
const cur = $('#cur'); let cx = -99, cy = -99, mx = -99, my = -99;
if (fine) {
  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; cur.style.opacity = 1; }, { passive: true });
  document.addEventListener('pointerover', (e) => cur.classList.toggle('big', !!e.target.closest('a,button,.chip,.av,.grid span')));
}

// ---------------------------------------------------------------- layout cache (read once, not every frame)
let M = {};
function measure() {
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  const work = $('#work'), intro = $('#intro'), track = $('#track');
  M = { introTop: top(intro), introH: intro.offsetHeight, workTop: top(work), workH: work.offsetHeight, trackW: track.scrollWidth, vineTop: top(vine), heroH: hero.offsetHeight };
  m1w = $('#m1').scrollWidth / 3; m2w = $('#m2').scrollWidth / 3;
  layoutVine();
}

// ---------------------------------------------------------------- smooth scroll + single frame loop
let lenis = null;
if (!reduce) {
  try { const { default: Lenis } = await import('https://cdn.jsdelivr.net/npm/lenis@1.1.14/+esm'); lenis = new Lenis({ lerp: 0.1, smoothWheel: true }); root.classList.add('lenis'); }
  catch (e) { console.warn('smooth scroll unavailable', e); }
  if (lenis) $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const id = a.getAttribute('href'); if (id.length > 1) { e.preventDefault(); lenis.scrollTo(id, { offset: id === '#work' ? 0 : -20, duration: 1.4 }); } }));
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (lenis) lenis.raf(now);
  const y = scrollY, vh = innerHeight;
  vel += ((y - lastY) - vel) * 0.12; lastY = y;
  // 3D hero
  if (scene && heroVisible) {
    boost *= Math.pow(0.12, dt); t3 += dt * (reduce ? 0.2 : 1 + boost);
    ptr.sx += (tx - ptr.sx) * 0.05; ptr.sy += (ty - ptr.sy) * 0.05; ptr.scroll = clamp(y / (M.heroH || vh), 0, 1) * 0.35;
    Object.assign(scene.ptr, ptr);
    scene.frame(t3, scene.ptr, dt); adapt(dt);
  }
  // marquee drifts, speeds up with scroll velocity
  const sp = (0.6 + Math.min(6, Math.abs(vel) * 0.35)) * (reduce ? 0 : 1);
  m1x = (m1x - sp) % m1w; m2x = (m2x + sp * 0.8) % m2w;
  $('#m1').style.transform = `translate3d(${m1x}px,0,0)`; $('#m2').style.transform = `translate3d(${m2x - m2w}px,0,0)`;
  // statement words light up while reading
  if (M.introTop !== undefined) {
    const p = clamp((y + vh * 0.75 - M.introTop) / (M.introH * 0.85), 0, 1.05);
    $('#st').style.setProperty('--p', p.toFixed(4));
    // pinned horizontal gallery
    if (!mobile()) {
      const wp = clamp((y - M.workTop) / (M.workH - vh), 0, 1);
      $('#track').style.transform = `translate3d(${(-wp * Math.max(0, M.trackW - innerWidth)).toFixed(1)}px,0,0)`;
      $('#wbar').style.transform = `scaleX(${wp.toFixed(4)})`;
    }
    // vine grows with the reader
    const vp = clamp((y + vh * 0.62 - M.vineTop) / vineH, 0, 1);
    vgrow.style.strokeDashoffset = (vineLen * (1 - vp)).toFixed(1);
    const reach = y + vh * 0.66 - M.vineTop;
    vnodes.forEach((n, i) => n.classList.toggle('on', nodeTops[i] < reach));
  }
  if (fine) { cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2; cur.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`; }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- boot
addEventListener('resize', () => { if (scene) scene.resize(hero.clientWidth, hero.clientHeight, dpr); fit(); placePill(); measure(); });
await document.fonts.ready;
mark('fonts');
measure(); setPhase(phase, true); clocks();
// compile every shader and draw one frame behind the loader so the first visible frame never hitches
if (scene) {
  try { await scene.renderer.compileAsync(scene.scene, scene.camera); } catch (e) { /* older drivers: compile happens on first draw */ }
  mark('compiled');
  scene.frame(0, scene.ptr, 0.016);
  await Promise.race([new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))), new Promise((r) => setTimeout(r, 600))]);
  mark('firstFrame');
}
requestAnimationFrame(frame);
reveal();
mark('revealed');
new ResizeObserver(() => measure()).observe(document.body);
