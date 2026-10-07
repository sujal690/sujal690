"""Space theme for the profile README, matched to sujal-shah-portfolio.vercel.app (HUD, Orbitron, cyan + amber).

Usage: python gen5.py [stats.json] [outdir] [thumbs_dir]
Reuses the Canopy generator's helpers and live diagrams, re-skinned.
"""
import base64
import datetime as dt
import io
import json
import math
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
STATS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'stats.json')
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'out5')
THUMBS = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, 'thumbs')
sys.argv = [sys.argv[0], STATS, OUT]
import gen3 as G  # noqa: E402  (helpers + diagrams; its build only runs as __main__)

S = G.S
os.makedirs(OUT, exist_ok=True)
G.OUT = OUT

# ---------------------------------------------------------------- tokens (from the portfolio)
VOID, P1, P2 = '#070709', '#0c1017', '#08090d'
CYAN, CYAN_D, AMBER, BLUE = '#00d4ff', '#0e7490', '#e3a65b', '#4799eb'
CREAM, SOFT, MUTED = '#efede7', '#c9c5b9', '#989281'
HAIR, LINE = 'rgba(239,237,231,.08)', 'rgba(0,212,255,.22)'
HEAT = ['#11141a', '#0b3a4a', '#0b6a85', '#0aa8cc', '#7fe8ff']
SWAY, EASE = G.SWAY, G.EASE
F = {'O': 'Orb700', 'O8': 'Orb800', 'O6': 'Orb600', 'G': 'Geist400', 'GM': 'Geist500', 'GS': 'Geist600', 'M': 'GMono400', 'MM': 'GMono500',
     # aliases used by the borrowed Canopy diagrams
     'D': 'Orb800', 'D7': 'Orb700', 'B': 'Geist400', 'BB': 'Geist600', 'MB': 'GMono500', 'S': 'GMono400'}
G.F = F
G.LEAF, G.LIME, G.GOLD, G.MOSS = CYAN, '#7fe8ff', AMBER, BLUE
G.CREAM, G.SOFT, G.MUTED, G.LINE = CREAM, SOFT, MUTED, LINE
Svg, W, wrap, esc = G.Svg, G.W, G.wrap, G.esc


def hud(s, x, y, w, h, gid='hp', label=None, cut=12, br=16):
    """Chamfered HUD panel with cyan corner brackets and an optional module label."""
    if not any(f'id="{gid}"' in d for d in s.defs):
        s.d(f'<linearGradient id="{gid}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="{P1}"/><stop offset="1" stop-color="{P2}"/></linearGradient>')
    p = f'M{x + cut} {y} H{x + w} V{y + h - cut} L{x + w - cut} {y + h} H{x} V{y + cut} Z'
    o = f'<path d="{p}" fill="url(#{gid})" stroke="{HAIR}"/>'
    for (cx, cy, dx, dy) in ((x + w, y, -1, 1), (x, y + h, 1, -1)):
        o += f'<path d="M{cx + dx * br} {cy} H{cx} V{cy + dy * br}" fill="none" stroke="{CYAN}" stroke-opacity=".75" stroke-width="1.5"/>'
    o += f'<path d="M{x} {y + cut + br} V{y + cut} L{x + cut} {y} H{x + cut + br}" fill="none" stroke="{CYAN}" stroke-opacity=".75" stroke-width="1.5"/>'
    o += f'<path d="M{x + w} {y + h - cut - br} V{y + h - cut} L{x + w - cut} {y + h} H{x + w - cut - br}" fill="none" stroke="{CYAN}" stroke-opacity=".75" stroke-width="1.5"/>'
    if label:
        o += s.t(x + 22, y + 26, label, 'M', 10.5, CYAN_D, ls=1.2)
    return o


def fade(b, dy=10, d=0.7):
    return G.fade(b, dy, d)


# ================================================================ theme toggle
def toggle(active, name):
    w, h = 470, 60
    s = Svg(w, h, f'Theme switch. {active.title()} theme is active. Click to switch to the {"Leaf" if active == "space" else "Space"} theme.')
    s += f'<rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" rx="30" fill="#0b0e14" stroke="rgba(239,237,231,.14)"/>'
    s += s.t(28, 26, 'THEME', 'O6', 10.5, MUTED, ls=2.5) + s.t(28, 42, 'click to switch', 'M', 10.5, SOFT)
    tx, tw = 156, 304
    s += f'<rect x="{tx}" y="8" width="{tw}" height="44" rx="22" fill="#05070a" stroke="rgba(239,237,231,.10)"/>'
    half = tw / 2
    on_x = tx + (0 if active == 'space' else half)
    if active == 'space':
        s.d(f'<linearGradient id="kn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fe6ff"/><stop offset="1" stop-color="{CYAN}"/></linearGradient>')
    else:
        s.d('<linearGradient id="kn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9f77f"/><stop offset="1" stop-color="#7fdc8a"/></linearGradient>')
    s += f'<rect x="{on_x + 4}" y="12" width="{half - 8}" height="36" rx="18" fill="url(#kn)"/>'
    # icons
    planet = lambda cx, col: (f'<g transform="translate({cx} 30)"><circle r="6.5" fill="none" stroke="{col}" stroke-width="1.8"/>'
                              f'<ellipse rx="11" ry="3.6" fill="none" stroke="{col}" stroke-width="1.5" transform="rotate(-20)"/></g>')
    leafi = lambda cx, col: f'<g transform="translate({cx} 31) scale(1.05)"><path d="{G.GINKGO}" fill="{col}"/></g>'
    sp_on, lf_on = active == 'space', active == 'leaf'
    s += planet(tx + 34, '#03141b' if sp_on else MUTED) + s.t(tx + 52, 35, 'SPACE', 'O7' if False else 'O', 12.5, '#03141b' if sp_on else SOFT, ls=2)
    s += leafi(tx + half + 34, '#0b2416' if lf_on else MUTED) + s.t(tx + half + 52, 35, 'LEAF', 'O', 12.5, '#0b2416' if lf_on else SOFT, ls=2)
    # the inactive side invites the click with a soft ping and a nudging arrow
    ix = tx + (half + 34 if sp_on else 34)
    pc = '#c8f06a' if sp_on else CYAN
    s += (f'<circle cx="{ix}" cy="30" r="10" fill="none" stroke="{pc}" stroke-width="1.4"><animate attributeName="r" values="9;17" dur="2s" repeatCount="indefinite"/>'
          f'<animate attributeName="opacity" values=".8;0" dur="2s" repeatCount="indefinite"/></circle>')
    ax = tx + tw - 26 if sp_on else tx + half - 26
    s += (f'<path d="M{ax - 5} 25 L{ax} 30 L{ax - 5} 35" fill="none" stroke="{pc}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
          f'<animateTransform attributeName="transform" type="translate" values="0 0;4 0;0 0" dur="1.4s" repeatCount="indefinite" {SWAY}/></path>')
    s.save(name)


# ================================================================ buttons
def chamfer(w, h, c=10):
    return f'M{c} 0 H{w} V{h - c} L{w - c} {h} H0 V{c} Z'


def icon(kind, col):
    st = f'fill="none" stroke="{col}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"'
    if kind == 'crew':
        return (f'<g {st}><circle cx="0" cy="-2.5" r="3.3"/><path d="M-6 7 C-5.5 2.6 5.5 2.6 6 7"/></g>'
                f'<circle r="9.5" fill="none" stroke="{col}" stroke-opacity=".35" stroke-dasharray="3 4"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite"/></circle>')
    if kind == 'modules':
        out = ''
        for i, (x, y) in enumerate(((-4.5, -4.5), (4.5, -4.5), (-4.5, 4.5), (4.5, 4.5))):
            out += f'<rect x="{x - 3}" y="{y - 3}" width="6" height="6" rx="1" fill="{col}" opacity=".35"><animate attributeName="opacity" values=".35;1;.35" dur="2.4s" begin="{i * 0.6}s" repeatCount="indefinite"/></rect>'
        return out
    if kind == 'telemetry':
        return (f'<circle r="8" {st} stroke-opacity=".5"/><circle r="4" {st} stroke-opacity=".35"/>'
                f'<g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3s" repeatCount="indefinite"/><path d="M0 0 L8 0" {st}/><path d="M0 0 L8 0 A8 8 0 0 0 5.7 -5.7 Z" fill="{col}" fill-opacity=".25"/></g>')
    if kind == 'missions':
        return (f'<g {st}><path d="M0 -8 C4 -5 4 2 2 6 H-2 C-4 2 -4 -5 0 -8 Z"/><circle cx="0" cy="-2" r="1.6"/></g>'
                f'<path d="M-1.4 7 L0 11 L1.4 7 Z" fill="{AMBER}"><animate attributeName="opacity" values="1;.3;1" dur=".6s" repeatCount="indefinite"/></path>')
    if kind == 'flight':
        return (f'<path d="M-8 6 C-3 -6 3 6 8 -6" {st} stroke-dasharray="3 3"><animate attributeName="stroke-dashoffset" from="12" to="0" dur="1s" repeatCount="indefinite"/></path>'
                f'<circle cx="8" cy="-6" r="2" fill="{col}"/>')
    if kind == 'comms':
        return (f'<g {st}><path d="M-6 6 L0 -6 L6 6 M-3.5 1 H3.5"/></g>'
                f'<path d="M-9 -7 A11 11 0 0 1 9 -7" {st} stroke-opacity=".5"><animate attributeName="opacity" values=".2;1;.2" dur="1.6s" repeatCount="indefinite"/></path>')
    if kind == 'globe':
        return f'<g {st}><circle r="7.5"/><path d="M-7.5 0 H7.5"/><ellipse rx="3.5" ry="7.5"><animate attributeName="rx" values="7.5;0.6;7.5" dur="4s" repeatCount="indefinite" {SWAY}/></ellipse></g>'
    if kind == 'in':
        return f'<g {st}><rect x="-7.5" y="-7.5" width="15" height="15" rx="3"/><path d="M-3.8 -.5 V4.3 M-3.8 -3.4 V-3.2 M0 4.3 V-.5 M0 1.5 C0 -1.7 4 -1.7 4 1.5 V4.3"/></g>'
    if kind == 'mail':
        return f'<g {st}><rect x="-7.5" y="-5" width="15" height="10" rx="1.5"/><path d="M-7.5 -4 L0 1.5 L7.5 -4"/></g>'
    return ''


def hud_button(name, label, kind, w=None):
    lw = W('O6', label, 11.5) + 11.5 * 0.2 * len(label)
    w = w or int(48 + lw + 22)
    h = 44
    s = Svg(w, h, label.title())
    per = 2 * (w + h)
    s += f'<path d="{chamfer(w, h)}" fill="#0b0f15" stroke="rgba(0,212,255,.30)" stroke-width="1.2"/>'
    s += (f'<path d="{chamfer(w, h)}" fill="none" stroke="{CYAN}" stroke-width="1.4" stroke-dasharray="16 {per}" stroke-linecap="round" opacity=".8">'
          f'<animate attributeName="stroke-dashoffset" from="0" to="-{per}" dur="{7 + len(label) % 4}s" repeatCount="indefinite"/></path>')
    s += f'<g transform="translate(24 22)">{icon(kind, CYAN)}</g>'
    s += s.t(46, 26.5, label, 'O6', 11.5, CREAM, ls=2.2)
    s.save(name)


def launch_button(name):
    w, h = 470, 68
    s = Svg(w, h, 'Launch portfolio: sujal-shah-portfolio.vercel.app')
    s.d(f'<linearGradient id="lb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{CYAN}" stop-opacity=".14"/><stop offset="1" stop-color="{CYAN}" stop-opacity=".04"/></linearGradient>')
    s += f'<path d="{chamfer(w, h, 14)}" fill="#071118"/><path d="{chamfer(w, h, 14)}" fill="url(#lb)" stroke="{CYAN}" stroke-opacity=".7" stroke-width="1.4"/>'
    for (x, y, dx, dy) in ((5, 5, 1, 1), (w - 5, h - 5, -1, -1)):
        s += f'<path d="M{x + dx * 16} {y} H{x} V{y + dy * 16}" fill="none" stroke="{CYAN}" stroke-width="2"/>'
    for i in range(3):
        x = 34 + i * 9
        s += (f'<path d="M{x} 25 L{x + 7} 34 L{x} 43" fill="none" stroke="{CYAN}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity=".2">'
              f'<animate attributeName="opacity" values=".2;1;.2" dur="1.2s" begin="{i * 0.2}s" repeatCount="indefinite"/></path>')
    s += s.t(84, 33, 'LAUNCH PORTFOLIO', 'O', 17, CREAM, ls=3.5)
    s += s.t(84, 52, 'sujal-shah-portfolio.vercel.app', 'M', 11.5, CYAN, extra='fill-opacity=".75"')
    s += (f'<g transform="translate({w - 40} 34)"><circle r="15" fill="none" stroke="{CYAN}" stroke-opacity=".45"/>'
          f'<path d="M-4.5 4.5 L4.5 -4.5 M-2.5 -4.5 H4.5 V2.5" fill="none" stroke="{CYAN}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'
          f'<animateTransform attributeName="transform" type="translate" values="0 0;1.6 -1.6;0 0" dur="1.8s" repeatCount="indefinite" {SWAY}/></path></g>')
    s.save(name)


# ================================================================ section header
def header(slug, title, code):
    s = Svg(880, 58, title.title())
    s += hud(s, 0, 0, 880, 58, cut=10, br=12)
    s += s.t(30, 36, title, 'O', 19, CREAM, ls=3.5)
    tx = 30 + W('O', title, 19) + len(title) * 3.5 + 18
    s += s.t(tx, 35, code, 'M', 10.5, CYAN_D, ls=1.2)
    lx = tx + W('M', code, 10.5) + len(code) * 1.2 + 22
    if lx < 800:
        s += f'<path d="M{lx:.0f} 29 H850" stroke="{HAIR}"/>'
        for x in range(int(lx) + 10, 850, 22):
            s += f'<path d="M{x} 26 V32" stroke="rgba(239,237,231,.14)"/>'
        s += f'<rect x="844" y="25" width="8" height="8" fill="{CYAN}"><animate attributeName="opacity" values="1;.2;1" dur="2.4s" repeatCount="indefinite"/></rect>'
    s.save(f'h-{slug}.svg')


# ================================================================ console
def console():
    lines = [('whoami', 'Sujal Shah | AI Software Engineer @ Sky Gold and Diamonds'),
             ('status', 'ONLINE. Open to collaborations'),
             ('focus', 'OCR + vision-language pipelines, computer vision, LLM integrations'),
             ('impact', 'multi-day manual workflows  ->  automated runs that finish in minutes')]
    w, h = 880, 300
    s = Svg(w, h, 'Mission console: whoami. Sujal Shah, AI Software Engineer at Sky Gold and Diamonds.')
    s += hud(s, 0, 0, w, h)
    s += f'<path d="M0 48 H{w}" stroke="{HAIR}"/>'
    s += s.t(30, 30, 'MISSION_CONSOLE', 'O6', 11, CREAM, ls=2.5) + s.t(w - 30, 30, 'sujal@orbit:~', 'M', 11, MUTED, 'end')
    s += f'<circle cx="{30 + W("O6", "MISSION_CONSOLE", 11) + 15 * 2.5 + 14:.0f}" cy="26" r="3.5" fill="{CYAN}"><animate attributeName="opacity" values="1;.25;1" dur="1.6s" repeatCount="indefinite"/></circle>'
    CYC = 9.0
    for i, (cmd, out) in enumerate(lines):
        y = 86 + i * 52
        body = s.t(30, y, '>', 'MM', 14.5, CYAN) + s.t(48, y, cmd, 'MM', 14.5, AMBER) + s.t(48, y + 22, out, 'M', 14, SOFT)
        if i == len(lines) - 1:
            s.d(f'<clipPath id="ty"><rect x="40" y="{y - 18}" width="0" height="50"><animate attributeName="width" values="0;0;820;820;0" keyTimes="0;0.12;0.32;0.96;1" dur="{CYC}s" repeatCount="indefinite"/></rect></clipPath>')
            s += s.t(30, y, '>', 'MM', 14.5, CYAN) + f'<g clip-path="url(#ty)">' + s.t(48, y, cmd, 'MM', 14.5, AMBER) + s.t(48, y + 22, out, 'M', 14, SOFT) + '</g>'
        else:
            s += f'<g opacity="0">{fade(0.1 + i * 0.12, 6, 0.5)}{body}</g>'
    s += f'<rect x="30" y="{86 + 4 * 52 - 6}" width="9" height="16" fill="{CYAN}"><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.5;.5;1" dur="1.05s" repeatCount="indefinite"/></rect>'
    s.save('console.svg')


# ================================================================ crew card
def crew(avatar_b64):
    w, h = 880, 300
    s = Svg(w, h, 'Crew profile: Sujal Shah, AI Software Engineer at Sky Gold and Diamonds. B.E. Computer Science, CGPA 9.0.')
    s += hud(s, 0, 0, w, h, label='CREW_PROFILE_01')
    cx, cy, r = 150, 158, 78
    s.d(f'<clipPath id="av"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>')
    s.d(f'<radialGradient id="avb" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#17384a"/><stop offset="1" stop-color="#0a0e14"/></radialGradient>')
    s += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#avb)"/>'
    s += f'<image x="{cx - r - 8}" y="{cy - r + 4}" width="{2 * r + 16}" height="{2 * r + 16}" clip-path="url(#av)" href="data:image/png;base64,{avatar_b64}" xlink:href="data:image/png;base64,{avatar_b64}"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="{r + 6}" fill="none" stroke="{CYAN}" stroke-opacity=".6" stroke-width="1.3"/>'
    s += (f'<g transform="translate({cx} {cy})"><g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="40s" repeatCount="indefinite"/>'
          f'<circle r="{r + 16}" fill="none" stroke="{CYAN}" stroke-opacity=".55" stroke-width="1.3" stroke-dasharray="28 10 4 10"/></g>')
    for a in range(0, 360, 90):
        s += f'<path d="M{(r + 22) * math.cos(math.radians(a)):.1f} {(r + 22) * math.sin(math.radians(a)):.1f} L{(r + 30) * math.cos(math.radians(a)):.1f} {(r + 30) * math.sin(math.radians(a)):.1f}" stroke="{CYAN}" stroke-width="1.5"/>'
    s += '</g>'
    x0 = 300
    s += f'<g opacity="0">{fade(0.15)}' + s.t(x0, 80, 'SUJAL SHAH', 'O8', 30, CREAM, ls=3) + '</g>'
    s += f'<g opacity="0">{fade(0.25)}' + s.t(x0, 106, 'AI SOFTWARE ENGINEER', 'O6', 12, CYAN, ls=3.5) + s.t(x0 + W('O6', 'AI SOFTWARE ENGINEER', 12) + 20 * 3.5 + 14, 106, 'at Sky Gold and Diamonds', 'GM', 14, SOFT) + '</g>'
    facts = [('ROLE', 'Sole technical owner of AI products'), ('FOCUS', 'OCR, computer vision, LLM and VLM'),
             ('STACK', 'Python, MERN, Docker, CI/CD'), ('EDU_RECORD', 'B.E. Computer Science, CGPA 9.0')]
    for i, (k, v) in enumerate(facts):
        fx, fy = x0 + (i % 2) * 278, 130 + (i // 2) * 70
        s += (f'<g opacity="0" transform="translate({fx} {fy})">{fade(0.35 + i * 0.1, 8, 0.6)}'
              f'<rect width="264" height="58" fill="rgba(0,212,255,.035)" stroke="{HAIR}"/><rect width="3" height="58" fill="{CYAN if i % 2 == 0 else AMBER}"/>'
              + s.t(16, 22, k, 'M', 10.5, CYAN_D, ls=1.2) + s.t(16, 43, v, 'GM', 13.5, CREAM) + '</g>')
    s += s.t(cx, h - 22, 'SYSTEM_STATUS: ONLINE_FOR_HIRE', 'M', 10.5, MUTED, 'middle', ls=1)
    s.save('crew.svg')


# ================================================================ modules (toolkit)
MODS = [('MOD_INTELLIGENCE_v2.0', 'INTELLIGENCE', ['OCR', 'COMPUTER VISION', 'NLP', 'LLM', 'VLM', 'RAG', 'HUGGING FACE', 'INFERENCE OPT.', 'MACHINE LEARNING']),
        ('MOD_BUILD_v2.0', 'BUILD', ['PYTHON', 'TYPESCRIPT', 'JAVASCRIPT', 'SQL', 'REACT', 'NEXT.JS', 'NODE.JS', 'EXPRESS', 'MONGODB', 'POSTGRESQL', 'REDUX', 'TAILWIND']),
        ('MOD_SHIP_v2.0', 'SHIP', ['DOCKER', 'CI/CD', 'GIT', 'VERCEL', 'RENDER', 'POSTMAN', 'SYSTEM DESIGN', 'AGILE'])]


def modules():
    w, gap = 880, 14
    cw = (w - 2 * gap) / 3
    layouts, hmax = [], 0
    for code, title, chips in MODS:
        x, y, rows = 20, 0, []
        for c in chips:
            tw = W('MM', c, 10.5) + len(c) * 0.8 + 20
            if x + tw > cw - 18:
                x, y = 20, y + 32
            rows.append((c, x, y, tw)); x += tw + 7
        layouts.append(rows); hmax = max(hmax, y)
    h = int(92 + hmax + 30 + 22)
    s = Svg(w, h, 'Modules. ' + '. '.join(f'{t}: ' + ', '.join(c) for _, t, c in MODS))
    n = 0
    for i, ((code, title, chips), rows) in enumerate(zip(MODS, layouts)):
        x0 = i * (cw + gap)
        s += f'<g opacity="0" transform="translate({x0:.1f} 0)">{fade(0.1 + i * 0.12)}'
        s += hud(s, 0, 0, round(cw), h, label=code)
        s += s.t(22, 60, title, 'O', 16, CREAM, ls=3)
        for c, x, y, tw in rows:
            s += (f'<rect x="{x}" y="{78 + y}" width="{tw:.1f}" height="24" fill="rgba(0,212,255,.04)" stroke="rgba(0,212,255,.24)">'
                  f'<animate attributeName="stroke" values="rgba(0,212,255,.24);rgba(0,212,255,.24);{CYAN};rgba(0,212,255,.24)" keyTimes="0;{(n / 30):.3f};{min(.99, n / 30 + .02):.3f};1" dur="16s" begin="2s" repeatCount="indefinite"/></rect>'
                  + s.t(x + tw / 2, 78 + y + 16, c, 'MM', 10.5, CREAM, 'middle', ls=0.8))
            n += 1
        s += '</g>'
    s.save('modules.svg')


# ================================================================ telemetry
def tiles():
    w, h = 880, 120
    items = [('CONTRIBUTIONS', S['contributions'], '12 months'), ('COMMITS', S['commits'], '12 months'), ('REPOSITORIES', S['repos'], f"{S['public_repos']} public"),
             ('ACTIVE_DAYS', S['active_days'], 'of 365'), ('BEST_STREAK', f"{S['longest_streak']}d", 'consecutive'), ('CURRENT', f"{S['current_streak']}d", 'streak')]
    s = Svg(w, h, 'Telemetry: ' + ', '.join(f'{a.lower()} {b}' for a, b, _ in items))
    gap = 10
    tw = (w - gap * 5) / 6
    for i, (lab, val, sub) in enumerate(items):
        x = i * (tw + gap)
        s += f'<g opacity="0" transform="translate({x:.1f} 0)">{fade(0.1 + i * 0.07)}'
        s += hud(s, 0, 0, round(tw), h, cut=8, br=10)
        s += s.t(16, 28, lab, 'M', 9.5, CYAN_D, ls=1)
        s += s.t(16, 72, str(val), 'O8', 30, CREAM)
        s += s.t(16, 96, sub, 'G', 11.5, MUTED)
        s += '</g>'
    s.save('tiles.svg')


def grid():
    cal = S['calendar']
    first = dt.date.fromisoformat(cal[0]['date'])
    cell, gap = 11.6, 3.2
    st = cell + gap
    gx, gy = 60, 86
    w, h = 880, int(gy + 7 * st + 46)
    nz = sorted(d['count'] for d in cal if d['count'])
    q = [nz[int(len(nz) * p)] for p in (0.25, 0.5, 0.75)] if nz else [1, 2, 3]
    lvl = lambda c: 0 if c == 0 else 1 + sum(c > t for t in q)
    best = dt.date.fromisoformat(S['best_day']['date'])
    s = Svg(w, h, f"Contribution map: {S['contributions']} contributions in the last year. Best day {best.strftime('%b %d')} with {S['best_day']['count']}.")
    s += hud(s, 0, 0, w, h, label='CONTRIBUTION_MAP')
    s += s.t(w - 26, 26, f"{S['contributions']} CONTRIBUTIONS // BEST DAY {best.strftime('%b %d').upper()}, {S['best_day']['count']}", 'M', 10.5, MUTED, 'end', ls=0.8)
    ncol = 0
    cells, last_m = '', None
    for d in cal:
        dd = dt.date.fromisoformat(d['date'])
        col = ((dd - first).days + first.isoweekday() % 7) // 7
        ncol = max(ncol, col + 1)
        x, y = gx + col * st, gy + d['weekday'] * st
        cells += f'<rect x="{x:.1f}" y="{y:.1f}" width="{cell}" height="{cell}" rx="2" fill="{HEAT[lvl(d["count"])]}"><title>{d["date"]}: {d["count"]}</title></rect>'
        if dd.day <= 7 and d['weekday'] == 0 and dd.month != last_m:
            s += s.t(x, gy - 10, dd.strftime('%b').upper(), 'M', 9.5, MUTED, ls=0.8)
            last_m = dd.month
    s += cells
    for r, lab in ((1, 'MON'), (3, 'WED'), (5, 'FRI')):
        s += s.t(24, gy + r * st + 9.5, lab, 'M', 9.5, MUTED, ls=0.6)
    gw = ncol * st
    s.d(f'<linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{CYAN}" stop-opacity="0"/><stop offset=".8" stop-color="{CYAN}" stop-opacity=".22"/><stop offset="1" stop-color="{CYAN}" stop-opacity=".7"/></linearGradient>')
    s += (f'<g><animateTransform attributeName="transform" type="translate" values="0 0;{gw:.0f} 0" dur="7s" repeatCount="indefinite"/>'
          f'<rect x="{gx - 60}" y="{gy - 4}" width="60" height="{7 * st + 4:.0f}" fill="url(#beam)"/><rect x="{gx - 1}" y="{gy - 6}" width="1.5" height="{7 * st + 8:.0f}" fill="{CYAN}"/></g>')
    lx = w - 26 - 5 * 15 - 72
    s += s.t(lx, h - 16, 'LESS', 'M', 9.5, MUTED, ls=0.8)
    for i, c in enumerate(HEAT):
        s += f'<rect x="{lx + 36 + i * 15}" y="{h - 26}" width="11" height="11" rx="2" fill="{c}"/>'
    s += s.t(lx + 36 + 5 * 15 + 4, h - 16, 'MORE', 'M', 9.5, MUTED, ls=0.8)
    s += s.t(26, h - 16, f"{S['active_days']} ACTIVE DAYS // LONGEST STREAK {S['longest_streak']} DAYS // UPDATED {S['generated']}", 'M', 9.5, MUTED, ls=0.8)
    s.save('grid.svg')


def insights():
    w, h = 880, 300
    s = Svg(w, h, 'Monthly contributions, languages as orbits, and weekly rhythm.')
    # monthly trajectory
    s += hud(s, 0, 0, 430, h, label='MONTHLY_TRAJECTORY')
    ms = S['months']
    mx = max(m['count'] for m in ms) or 1
    pk = max(ms, key=lambda m: m['count'])
    x0, x1, y0, y1 = 26, 404, 70, 240
    for g in range(4):
        yy = y1 - (y1 - y0) * g / 3
        s += f'<path d="M{x0} {yy:.1f} H{x1}" stroke="{HAIR}" stroke-dasharray="{"2 5" if g else "0"}"/>'
    pts = [(x0 + (x1 - x0) * i / (len(ms) - 1), y1 - (y1 - y0) * m['count'] / mx) for i, m in enumerate(ms)]
    line = G.smooth(pts)
    s.d(f'<linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{CYAN}" stop-opacity=".3"/><stop offset="1" stop-color="{CYAN}" stop-opacity="0"/></linearGradient>')
    s.d(f'<clipPath id="arc"><rect x="{x0}" y="{y0 - 20}" width="0" height="{y1 - y0 + 24}"><animate attributeName="width" from="0" to="{x1 - x0 + 2}" begin=".3s" dur="1.8s" fill="freeze" {EASE}/></rect></clipPath>')
    s += f'<g clip-path="url(#arc)"><path d="{line} L{x1} {y1} L{x0} {y1} Z" fill="url(#ar)"/><path d="{line}" fill="none" stroke="{CYAN}" stroke-width="2.2"/></g>'
    for i, (px, py) in enumerate(pts):
        s += s.t(px, y1 + 22, dt.date.fromisoformat(ms[i]['month'] + '-01').strftime('%b').upper()[:3], 'M', 8.5, MUTED, 'middle')
    pi = ms.index(pk)
    px, py = pts[pi]
    s += (f'<circle cx="{px:.1f}" cy="{py:.1f}" r="4" fill="{AMBER}"/><circle cx="{px:.1f}" cy="{py:.1f}" r="4" fill="none" stroke="{AMBER}"><animate attributeName="r" values="4;12" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="2.2s" repeatCount="indefinite"/></circle>')
    s += s.t(px + 12, py + 4, f"PEAK {pk['count']}", 'MM', 10, AMBER, ls=0.8)
    # languages as orbits
    s += hud(s, 446, 0, 434, h, label='LANGUAGE_ORBITS')
    langs = S['languages'][:6]
    pal = [CYAN, '#7fe8ff', AMBER, BLUE, '#b8b3a6', '#6b7480']
    cx, cy = 560, 162
    s += f'<circle cx="{cx}" cy="{cy}" r="7" fill="{AMBER}"/><circle cx="{cx}" cy="{cy}" r="13" fill="{AMBER}" opacity=".15"/>'
    for i, l in enumerate(langs):
        r = 26 + i * 15
        C = 2 * math.pi * r
        L = max(3, C * l['pct'] / 100 * 1.6)
        dur = 18 + i * 9
        s += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{HAIR}"/>'
        s += (f'<g transform="translate({cx} {cy})"><g><animateTransform attributeName="transform" type="rotate" from="{i * 50}" to="{i * 50 + 360}" dur="{dur}s" repeatCount="indefinite"/>'
              f'<circle r="{r}" fill="none" stroke="{pal[i]}" stroke-width="3" stroke-linecap="round" stroke-dasharray="{L:.1f} {C:.1f}"/><circle cx="{r}" cy="0" r="3" fill="{pal[i]}"/></g></g>')
        ly = 78 + i * 30
        s += f'<circle cx="694" cy="{ly - 4}" r="4" fill="{pal[i]}"/>' + s.t(708, ly, l['name'], 'GM', 13, CREAM) + s.t(856, ly, f"{l['pct']}%", 'M', 11, MUTED, 'end')
    s.save('insights.svg')


def rhythm():
    w, h = 880, 130
    days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    full = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays']
    wk = S['weekday']; mx = max(wk) or 1
    s = Svg(w, h, f"Weekly rhythm: most active on {full[wk.index(mx)]}.")
    s += hud(s, 0, 0, w, h, label='WEEKLY_RHYTHM')
    s += s.t(22, 66, 'MOST ACTIVE', 'O6', 12, CREAM, ls=2.5) + s.t(22, 90, full[wk.index(mx)].upper(), 'O', 18, AMBER, ls=2.5)
    bx, bw = 300, 70
    for i, v in enumerate(wk):
        hh = 64 * v / mx
        x = bx + i * (bw + 8)
        col = AMBER if v == mx else CYAN
        s += f'<rect x="{x}" y="28" width="{bw}" height="64" fill="rgba(239,237,231,.03)"/>'
        s += (f'<rect x="{x}" y="92" width="{bw}" height="0" fill="{col}" fill-opacity="{1 if v == mx else .7}">'
              f'<animate attributeName="height" from="0" to="{hh:.1f}" begin="{.4 + i * .07:.2f}s" dur=".9s" fill="freeze" {EASE}/>'
              f'<animate attributeName="y" from="92" to="{92 - hh:.1f}" begin="{.4 + i * .07:.2f}s" dur=".9s" fill="freeze" {EASE}/><title>{days[i]}: {v}</title></rect>')
        s += s.t(x + bw / 2, 112, days[i], 'M', 10, CREAM if v == mx else MUTED, 'middle', ls=0.8)
    s.save('rhythm.svg')


# ================================================================ missions
def missions(name, items, start):
    w, h, cw = 880, 372, 433
    s = Svg(w, h, ' | '.join(f'{t}: {d}' for t, d, *_ in items))
    for i, (title, desc, tags, diag, badge) in enumerate(items):
        x = i * (cw + 14)
        s += f'<g opacity="0" transform="translate({x} 0)">{fade(0.1 + i * 0.15, 12, 0.9)}'
        s += hud(s, 0, 0, cw, h, label=f'MISSION_0{start + i}')
        s += f'<rect x="16" y="40" width="{cw - 32}" height="150" fill="#05070b" stroke="{HAIR}"/>'
        s += f'<g transform="translate(0 24)">{diag(s)}</g>'
        if badge:
            bw_ = W('MM', badge.upper(), 9.5) + 24
            s += f'<rect x="{cw - 22 - bw_:.0f}" y="13" width="{bw_:.0f}" height="19" fill="rgba(227,166,91,.12)" stroke="rgba(227,166,91,.5)"/>' + s.t(cw - 22 - bw_ / 2, 26, badge.upper(), 'MM', 9.5, AMBER, 'middle', ls=1)
        s += s.t(22, 220, 'SKY GOLD AND DIAMONDS', 'M', 10, AMBER, ls=1)
        s += s.t(22, 246, title.upper(), 'O', 14.5, CREAM, ls=1.5)
        for j, ln in enumerate(wrap(desc, 'G', 12.8, cw - 44)):
            s += s.t(22, 270 + j * 19, ln, 'G', 12.8, SOFT)
        s += s.t(22, h - 22, '  '.join('// ' + t.upper() for t in tags), 'MM', 10, CYAN, ls=0.6)
        s += '</g>'
    s.save(name)


def archive_card(slug, title, date, desc, stack, thumb_b64):
    w, h = 284, 316
    s = Svg(w, h, f'{title}, {date}: {desc}')
    s += hud(s, 0, 0, w, h, cut=10, br=12)
    s.d(f'<clipPath id="th"><rect x="12" y="12" width="{w - 24}" height="150"/></clipPath>')
    s += f'<image x="12" y="12" width="{w - 24}" height="150" preserveAspectRatio="xMidYMin slice" clip-path="url(#th)" href="data:image/jpeg;base64,{thumb_b64}" xlink:href="data:image/jpeg;base64,{thumb_b64}"/>'
    s += f'<rect x="12" y="12" width="{w - 24}" height="150" fill="none" stroke="{HAIR}"/>'
    s.d(f'<linearGradient id="tf" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="{P2}" stop-opacity="0"/><stop offset="1" stop-color="{P2}" stop-opacity=".85"/></linearGradient>')
    s += f'<rect x="12" y="12" width="{w - 24}" height="150" fill="url(#tf)"/>'
    s += s.t(22, 188, title.upper(), 'O', 14, CYAN, ls=1.5)
    dw = W('M', date, 10) + 16
    s += f'<rect x="{w - 20 - dw:.0f}" y="175" width="{dw:.0f}" height="18" fill="none" stroke="{HAIR}"/>' + s.t(w - 20 - dw / 2, 188, date, 'M', 10, SOFT, 'middle')
    for j, ln in enumerate(wrap(desc, 'G', 12, w - 44)[:3]):
        s += s.t(22, 212 + j * 17, ln, 'G', 12, SOFT)
    s += s.t(22, h - 44, '  '.join('// ' + x for x in stack), 'MM', 9.5, CYAN_D, ls=0.5)
    s += f'<path d="M22 {h - 32} H{w - 22}" stroke="{HAIR}"/>'
    s += s.t(22, h - 13, 'LAUNCH DEMO', 'O6', 10.5, CREAM, ls=2)
    s += (f'<path d="M{w - 36} {h - 17} L{w - 26} {h - 27} M{w - 33} {h - 27} H{w - 26} V{h - 20}" fill="none" stroke="{CYAN}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
          f'<animateTransform attributeName="transform" type="translate" values="0 0;2 -2;0 0" dur="1.8s" repeatCount="indefinite" {SWAY}/></path>')
    s.save(f'archive-{slug}.svg')


# ================================================================ flight log (timeline)
def flight_log():
    w, h = 880, 262
    nodes = [('2024', 'GRAND FINALIST', ['Smart India Hackathon,', 'Ministry of Coal.', 'NASA Space Apps', 'Global Nominee.']),
             ('2025', 'FULL STACK INTERN', ['Chemtron Science Labs.', 'MERN + Electron app,', '40% less manual work.', '1st, SCOE Avishkar.']),
             ('MAY 2026', 'B.E. COMPUTER SCI.', ['University of Mumbai.', 'CGPA 9.0']),
             ('JUN 2026 - NOW', 'AI SOFTWARE ENGINEER', ['Sky Gold and Diamonds.', 'Sole technical owner', 'of AI products.'])]
    s = Svg(w, h, 'Flight log. ' + ' '.join(f'{a}: {b}. ' + ' '.join(c) for a, b, c in nodes))
    s += hud(s, 0, 0, w, h, label='FLIGHT_LOG')
    xs = [116, 326, 536, 742]
    vy = 104
    d = f'M30 {vy + 30}'
    pts = [(30, vy + 30)] + [(x, vy) for x in xs] + [(856, vy - 18)]
    for i in range(1, len(pts)):
        (a, ay), (b, by) = pts[i - 1], pts[i]
        d += f' C{a + (b - a) * 0.5:.0f} {ay - 26} {a + (b - a) * 0.5:.0f} {by - 26} {b} {by}'
    s += f'<path d="{d}" fill="none" stroke="rgba(239,237,231,.12)" stroke-width="1.5" stroke-dasharray="3 6"/>'
    s += (f'<path d="{d}" fill="none" stroke="{CYAN}" stroke-width="1.8" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="1000">'
          f'<animate attributeName="stroke-dashoffset" from="1000" to="0" begin=".2s" dur="2.4s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.65 0 0.35 1"/></path>')
    s += (f'<g><animateMotion dur="14s" repeatCount="indefinite" path="{d}" rotate="auto"/>'
          f'<path d="M6 0 L-5 -4 L-2 0 L-5 4 Z" fill="{CREAM}"/><circle cx="-8" cy="0" r="2.2" fill="{AMBER}"><animate attributeName="opacity" values="1;.3;1" dur=".5s" repeatCount="indefinite"/></circle></g>')
    for i, (when, title, sub) in enumerate(nodes):
        x = xs[i]
        last = i == len(nodes) - 1
        col = AMBER if last else CYAN
        b = 0.4 + 2.2 * (x - 30) / 830
        s += (f'<g transform="translate({x} {vy})"><circle r="15" fill="none" stroke="{col}" stroke-opacity=".35"/>'
              f'<g transform="scale(0)"><animateTransform attributeName="transform" type="scale" values="0;1.2;1" keyTimes="0;.6;1" begin="{b:.2f}s" dur=".7s" fill="freeze"/>'
              f'<circle r="7" fill="{col}"/><ellipse rx="12" ry="3.5" fill="none" stroke="{col}" stroke-width="1.3" transform="rotate(-18)"/></g>')
        if last:
            s += (f'<circle r="15" fill="none" stroke="{AMBER}" opacity="0"><animate attributeName="r" values="15;30" begin="{b + .8:.2f}s" dur="2s" repeatCount="indefinite"/>'
                  f'<animate attributeName="opacity" values=".8;0" begin="{b + .8:.2f}s" dur="2s" repeatCount="indefinite"/></circle>')
        s += '</g>'
        s += f'<g opacity="0">{fade(b + .2, 8, .6)}'
        s += s.t(x, 62, when, 'M', 10.5, col, 'middle', ls=1)
        s += s.t(x, 152, title, 'O', 12, CREAM, 'middle', ls=1.2)
        for j, ln in enumerate(sub):
            s += s.t(x, 176 + j * 18, ln, 'G', 12.3, SOFT, 'middle')
        s += '</g>'
    s.save('flight.svg')


# ================================================================ comms + footer
def comms():
    w, h = 880, 210
    s = Svg(w, h, 'Open a channel. AI automation, computer vision and full-stack builds.')
    s += hud(s, 0, 0, w, h, label='COMMS_ARRAY')
    rnd = random.Random(11)
    for _ in range(60):
        s += f'<circle cx="{rnd.uniform(10, w - 10):.0f}" cy="{rnd.uniform(10, h - 10):.0f}" r="{rnd.choice((.6, .8, 1))}" fill="{CREAM}" opacity="{rnd.uniform(.1, .4):.2f}"/>'
    for k in range(3):
        s += (f'<circle cx="{w - 120}" cy="{h / 2}" r="20" fill="none" stroke="{CYAN}" stroke-width="1.2" opacity="0">'
              f'<animate attributeName="r" values="20;90" dur="3.6s" begin="{k * 1.2}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".6;0" dur="3.6s" begin="{k * 1.2}s" repeatCount="indefinite"/></circle>')
    s += f'<g transform="translate({w - 120} {h / 2})"><circle r="9" fill="{CYAN}"/><path d="M-4 3 L0 -5 L4 3" fill="none" stroke="#03141b" stroke-width="1.8" stroke-linejoin="round"/></g>'
    s += s.t(36, 92, 'OPEN A CHANNEL', 'O8', 34, CREAM, ls=4)
    s += s.t(36, 124, 'AI automation, computer vision and full-stack builds, from Navi Mumbai.', 'G', 15, SOFT)
    s += s.t(36, 160, 'SYSTEM_STATUS: ONLINE_FOR_HIRE', 'MM', 11, CYAN, ls=1.2)
    s.save('comms.svg')


def footer():
    w, h = 880, 90
    s = Svg(w, h, 'Transmitting from Navi Mumbai.')
    rnd = random.Random(5)
    for _ in range(90):
        s += f'<circle cx="{rnd.uniform(0, w):.0f}" cy="{rnd.uniform(0, h):.0f}" r="{rnd.choice((.6, .8, 1.1))}" fill="{CREAM}" opacity="{rnd.uniform(.1, .5):.2f}"/>'
    s += (f'<g opacity="0"><animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.05;.12;1" dur="9s" repeatCount="indefinite"/>'
          f'<animateTransform attributeName="transform" type="translate" values="-80 10;700 60;700 60" keyTimes="0;.12;1" dur="9s" repeatCount="indefinite"/>'
          f'<path d="M0 0 L-70 -6" stroke="{CREAM}" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round"/><circle r="1.8" fill="{CREAM}"/></g>')
    s += s.t(w / 2, 50, 'TRANSMITTING FROM NAVI MUMBAI  //  19.03°N 73.03°E', 'M', 11, MUTED, 'middle', ls=1.5)
    s.save('footer.svg')


# ================================================================ same-page theme switch
def _planet(cx, cy, col):
    return (f'<g transform="translate({cx} {cy})"><circle r="6" fill="none" stroke="{col}" stroke-width="1.7"/>'
            f'<g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="12s" repeatCount="indefinite"/>'
            f'<ellipse rx="11" ry="3.4" fill="none" stroke="{col}" stroke-width="1.4" transform="rotate(-22)"/></g></g>')


def _leafic(cx, cy, col):
    return (f'<g transform="translate({cx} {cy + 1})"><g><animateTransform attributeName="transform" type="rotate" values="-10;8;-10" dur="5s" repeatCount="indefinite" {SWAY}/>'
            f'<path d="{G.GINKGO}" fill="{col}" transform="scale(1.1)"/></g></g>')


def switch_halves():
    h = 58
    for side in ('space', 'leaf'):
        w = 228
        s = Svg(w, h, 'Show the Space theme' if side == 'space' else 'Show the Leaf theme')
        r = h / 2
        if side == 'space':
            path = f'M{r} .75 H{w} V{h - .75} H{r} A{r - .75} {r - .75} 0 0 1 {r} .75 Z'
            s += f'<path d="{path}" fill="#090d13" stroke="rgba(0,212,255,.45)" stroke-width="1.5"/>'
            s += f'<path d="M{w - .75} 12 V{h - 12}" stroke="rgba(239,237,231,.12)"/>'
            s += _planet(52, h / 2, CYAN)
            s += s.t(76, 27, 'SPACE', 'O', 14, CREAM, ls=3) + s.t(76, 43, 'default view', 'M', 10, MUTED)
        else:
            path = f'M0 .75 H{w - r} A{r - .75} {r - .75} 0 0 1 {w - r} {h - .75} H0 Z'
            s += f'<path d="{path}" fill="#0b130e" stroke="rgba(200,240,106,.45)" stroke-width="1.5"/>'
            s += _leafic(40, h / 2, '#c8f06a')
            s.chars['BB'] = s.chars.get('BB', '')
            s += s.t(64, 27, 'LEAF', 'O', 14, CREAM, ls=3) + s.t(64, 43, 'with a ladybug', 'M', 10, MUTED)
        s.save(f'switch-{side}.svg')


def fold_tab(side):
    w, h = 880, 38
    col = CYAN if side == 'space' else '#c8f06a'
    label = 'SPACE THEME' if side == 'space' else 'LEAF THEME'
    s = Svg(w, h, f'{label.title()}: tap to fold or unfold')
    lw = W('O', label, 11) + len(label) * 2.6
    cx = w / 2
    s += f'<path d="M24 {h / 2} H{cx - lw / 2 - 40}" stroke="rgba(239,237,231,.10)"/><path d="M{cx + lw / 2 + 40} {h / 2} H{w - 24}" stroke="rgba(239,237,231,.10)"/>'
    s += (_planet(cx - lw / 2 - 18, h / 2, col) if side == 'space' else _leafic(cx - lw / 2 - 18, h / 2, col))
    s += s.t(cx + 6, h / 2 + 4, label, 'O', 11, CREAM, 'middle', ls=2.6)
    s.save(f'tab-{side}.svg')


if __name__ == '__main__':
    from PIL import Image
    avp = os.path.join(HERE, 'avatar_cut.png')
    if not os.path.exists(avp):
        avp = os.path.join(os.environ['TEMP'], 'avatar_cut.png')
    av = Image.open(avp).resize((200, 200), Image.LANCZOS)
    b = io.BytesIO(); av.save(b, 'PNG', optimize=True); ab64 = base64.b64encode(b.getvalue()).decode()
    switch_halves(); fold_tab('space'); fold_tab('leaf')
    for slug, label, kind in [('crew', 'CREW', 'crew'), ('modules', 'MODULES', 'modules'), ('telemetry', 'TELEMETRY', 'telemetry'),
                              ('missions', 'MISSIONS', 'missions'), ('flight', 'FLIGHT LOG', 'flight'), ('comms', 'COMMS', 'comms')]:
        hud_button(f'nav-{slug}.svg', label, kind)
    launch_button('launch.svg')
    hud_button('btn-portfolio.svg', 'PORTFOLIO', 'globe'); hud_button('btn-linkedin.svg', 'LINKEDIN', 'in'); hud_button('btn-email.svg', 'EMAIL', 'mail')
    header('crew', 'CREW PROFILE', 'CREW_ID_01'); header('modules', 'MODULES', 'MOD_INDEX_v2.0'); header('telemetry', 'TELEMETRY', 'GITHUB_LAST_12_MONTHS')
    header('missions', 'MISSIONS', 'MISSION_LOG_v2.0'); header('archive', 'ARCHIVE', 'EARLIER_PROJECTS'); header('flight', 'FLIGHT LOG', 'TRAJECTORY_v1.0'); header('comms', 'COMMS', 'STATION_TX_v4.5')
    console(); crew(ab64); modules(); tiles(); grid(); insights(); rhythm()
    missions('missions-a.svg', G.WORK[:2], 1); missions('missions-b.svg', G.WORK[2:], 3)
    ARCH = [('familyconnect', 'FamilyConnect', 'June 2025', 'AI companion for children in orphanages, built on Gemini 1.5 Pro for emotional support and personal interaction.', ['NEXT.JS', 'SUPABASE']),
            ('greenmines', 'GreenMines', 'Dec 2024', 'Carbon-footprint tracking for mining operations, with impact analysis and sustainability reporting.', ['REACT', 'NODE', 'MONGODB']),
            ('schedulr', 'Schedulr', 'Dec 2025', 'Appointment booking with admin panel, staff management and refund-safe cancellations.', ['NEXT.JS', 'POSTGRESQL'])]
    for slug, t, d, desc, stack in ARCH:
        im = Image.open(os.path.join(THUMBS, f'thumb_{slug}.png')).convert('RGB').resize((520, 309), Image.LANCZOS)
        bb = io.BytesIO(); im.save(bb, 'JPEG', quality=72, optimize=True)
        archive_card(slug, t, d, desc, stack, base64.b64encode(bb.getvalue()).decode())
    flight_log(); comms(); footer()
    print(len(os.listdir(OUT)), 'files', sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024, 'KB')


