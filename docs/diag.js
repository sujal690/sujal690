// Animated work diagrams (inline SVG) and the work list.
const DIAG = {
  docs: `<svg viewBox="0 0 400 150"><rect x="38" y="22" width="66" height="86" rx="7" fill="#1f2a21" stroke="rgba(236,233,223,.2)"/>${[44, 36, 46, 30, 40, 26].map((w, i) => `<rect x="48" y="${36 + i * 11}" width="${w}" height="4" rx="2" fill="rgba(238,248,239,.22)"/>`).join('')}
    <g class="d-scan"><rect x="36" y="10" width="70" height="16" fill="url(#scanG)"/><rect x="34" y="25" width="74" height="2.4" rx="1.2" fill="#e3a868"/></g>
    ${[114, 250].map((x) => `<path class="d-flow" d="M${x} 65 H${x + 40}" stroke="#9cbf7e" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round"/><path d="M${x + 36} 60 L${x + 42} 65 L${x + 36} 70" fill="none" stroke="#9cbf7e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
    <rect x="164" y="38" width="76" height="54" rx="12" fill="rgba(227,168,104,.10)" stroke="rgba(227,168,104,.55)"/><rect class="d-blink" x="164" y="38" width="76" height="54" rx="12" fill="none" stroke="#e3a868"/>
    <text x="202" y="63" text-anchor="middle" font-family="Manrope" font-weight="700" font-size="15" fill="#e3a868">VLM</text><text x="202" y="80" text-anchor="middle" font-family="Manrope" font-size="9.5" fill="#c3c7b7">ocr + vision</text>
    ${Array.from({ length: 20 }, (_, k) => { const r = Math.floor(k / 4), c = k % 4, x = 298 + c * 22, y = 26 + r * 17; return r === 0 ? `<rect x="${x}" y="${y}" width="19" height="13" rx="3" fill="#d9a23a" fill-opacity=".75"/>` : `<rect x="${x}" y="${y}" width="19" height="13" rx="3" fill="rgba(255,255,255,.06)"/><rect class="d-cell" style="--dl:${(0.25 + (k - 4) * 0.19).toFixed(2)}s" x="${x}" y="${y}" width="19" height="13" rx="3" fill="#9cbf7e"/>`; }).join('')}
    <defs><linearGradient id="scanG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e3a868" stop-opacity=".55"/><stop offset="1" stop-color="#e3a868" stop-opacity="0"/></linearGradient></defs></svg>`,
  orders: `<svg viewBox="0 0 400 150"><path d="M44 66 H356" stroke="rgba(255,255,255,.08)" stroke-width="4" stroke-linecap="round"/><path class="d-line" d="M44 66 H356" stroke="#9cbf7e" stroke-width="4" stroke-linecap="round"/>
    ${[44, 122, 200, 278, 356].map((x, i) => `<circle cx="${x}" cy="66" r="10" fill="#1f2a21" stroke="rgba(236,233,223,.25)" stroke-width="2"/><circle class="lit${i}" cx="${x}" cy="66" r="6" fill="#e3a868"/>`).join('')}
    <g class="d-pk"><circle cx="44" cy="66" r="7" fill="#d9a23a"/><circle class="d-ring" cx="44" cy="66" r="7" fill="none" stroke="#d9a23a" stroke-width="1.5"/></g>
    <g transform="translate(316 12)"><rect width="56" height="22" rx="11" fill="rgba(156,191,126,.14)" stroke="rgba(156,191,126,.5)"/><circle class="d-blink" cx="13" cy="11" r="3.5" fill="#9cbf7e"/><text x="22" y="15" font-family="Manrope" font-weight="700" font-size="10.5" fill="#9cbf7e">live</text></g>
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
    <g transform="translate(30 104)"><rect width="88" height="22" rx="11" fill="rgba(217,162,58,.12)" stroke="rgba(217,162,58,.5)"/><text x="44" y="15" text-anchor="middle" font-family="Manrope" font-weight="700" font-size="10" fill="#d9a23a">NVIDIA edge</text></g></svg>`,
};

export const WORK = [
  ['docs', 'Intelligent Document Automation', 'An OCR-to-spreadsheet pipeline pairing state-of-the-art text recognition with a locally hosted vision-language model. A multi-day manual process now runs in minutes and is a core tool across the company.', ['OCR', 'VLM', 'Python']],
  ['orders', 'Enterprise Order Tracking', 'A real-time, full-stack platform spanning the entire order lifecycle, adopted company-wide as the single source of truth for order status.', ['Full-stack', 'Real-time']],
  ['search', 'Visual Product Search', 'Instant retrieval of gold design records from a rough photo or an SKU code, through a multi-model computer-vision pipeline built for accuracy and low latency.', ['Computer vision', 'Search']],
  ['security', 'AI Security Intelligence', 'In progress with an external technology firm: facial recognition plus a generative video-understanding model on NVIDIA edge hardware, verifying security-check compliance in real time.', ['Edge AI', 'Video understanding']],
];
export { DIAG };
