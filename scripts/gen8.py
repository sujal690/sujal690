"""Realistic, modern README card system for both themes. No HUD, no mono labels, one muted accent per theme.

Usage: python gen7.py space|leaf stats.json outdir thumbs_dir
"""
import base64
import datetime as dt
import io
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
THEME, STATS, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
THUMBS = sys.argv[4] if len(sys.argv) > 4 else os.path.join(HERE, 'thumbs')
PHASE = sys.argv[5] if len(sys.argv) > 5 else 'night'
sys.argv = [sys.argv[0], STATS, OUT]
import gen3 as G  # noqa: E402  helpers + project diagrams

S = G.S
os.makedirs(OUT, exist_ok=True)
G.OUT = OUT

T = {
    'space': dict(panel='#10141a', panel2='#0c1015', text='#eceff2', soft='#c2c9d1', muted='#8a94a1', dim='#5d6673',
                  acc='#86b4d6', acc2='#d6a35e', hair='rgba(236,239,242,.08)',
                  heat=['#161b22', '#1d3445', '#2c5874', '#5a8db0', '#b2d3ea'],
                  pal=['#86b4d6', '#b6cfe2', '#d6a35e', '#8b9fbe', '#b8b0a2', '#5f6c7c'],
                  F={'H': 'Orb700', 'B': 'Geist400', 'BM': 'Geist500', 'BS': 'Geist600', 'M': 'GMono400'}),
    'leaf': dict(panel='#141b16', panel2='#101511', text='#efede4', soft='#cfd2c2', muted='#99a28d', dim='#68715b',
                 acc='#d79a5b', acc2='#a3bd8a', hair='rgba(239,237,228,.08)',
                 heat=['#1b231c', '#2d4527', '#4b6e37', '#80a04f', '#dcae63'],
                 pal=['#d79a5b', '#a3bd8a', '#c9b98a', '#7f9c6a', '#b59a7a', '#6b7562'],
                 F={'H': 'Syne700', 'B': 'Man400', 'BM': 'Man500', 'BS': 'Man600', 'M': 'GMono400'}),
}[THEME]
PHASES = {
    'space': {
        'night': dict(panel='#0c1220', panel2='#080c17', acc='#7fdcff', acc2='#f0b264', heat=['#141b2a', '#16344f', '#1d5d86', '#3aa0d8', '#bfeaff'], nebA='#4f7fd0', nebB='#8a5ad0'),
        'dawn': dict(panel='#171320', panel2='#0f0c17', acc='#ffb38a', acc2='#9fd8ff', heat=['#1d1824', '#3c2838', '#6c3e52', '#c07070', '#ffd0a8'], nebA='#e08a7a', nebB='#7a6ad0'),
        'day': dict(panel='#0d1a28', panel2='#09131e', acc='#6fd6ff', acc2='#ffd166', heat=['#132131', '#143f5a', '#1a6e94', '#38b2dc', '#c4f2ff'], nebA='#3fa0d8', nebB='#4ad0c0'),
        'dusk': dict(panel='#1b1222', panel2='#120c18', acc='#ffa070', acc2='#c79bff', heat=['#1f1626', '#3c2140', '#6c3356', '#d0665e', '#ffc078'], nebA='#e0706a', nebB='#a060d0'),
    },
    'leaf': {
        'dawn': dict(panel='#1c1b1a', panel2='#141312', acc='#ffa985', acc2='#a9cf8a', heat=['#22221f', '#3e4a30', '#62803f', '#a9c86a', '#ffb08a'], nebA='#ff9f80', nebB='#a9cf8a'),
        'day': dict(panel='#13211a', panel2='#0e1913', acc='#f4c94e', acc2='#8fd16a', heat=['#182619', '#265c2b', '#3c8c3a', '#78c45a', '#f4c94e'], nebA='#f4c94e', nebB='#6fbf5a'),
        'dusk': dict(panel='#211816', panel2='#181110', acc='#ff9a5a', acc2='#d9a65e', heat=['#271d19', '#4a3622', '#7a542a', '#c4823a', '#ff9a5a'], nebA='#ff8a5a', nebB='#c9705a'),
        'night': dict(panel='#0e1619', panel2='#0a1113', acc='#dfe878', acc2='#8fc0dc', heat=['#131c1e', '#1c3a35', '#2a5e4e', '#4f9a6e', '#dfe878'], nebA='#9fd0ff', nebB='#5fa080'),
    },
}
T.update(PHASES[THEME][PHASE])
T['pal'] = [T['acc'], T['acc2'], '#b6cfe2' if THEME == 'space' else '#c9b98a', '#8b9fbe' if THEME == 'space' else '#7f9c6a', '#b8b0a2', '#6b7562']
NEB_A, NEB_B = T['nebA'], T['nebB']
P1, P2, TEXT, SOFT, MUTED, DIM, ACC, ACC2, HAIR, HEAT, PAL = (T[k] for k in ('panel', 'panel2', 'text', 'soft', 'muted', 'dim', 'acc', 'acc2', 'hair', 'heat', 'pal'))
F = T['F']
# the shared Svg class looks fonts up through G.F; map our roles plus the diagram roles gen3 uses
G.F = {**F, 'D': F['H'], 'D7': F['H'], 'BB': F['BS'], 'MB': F['BM'], 'S': F['BM'], 'M': F['B']}
G.F['MO'] = 'GMono500'
G.LEAF, G.LIME, G.GOLD, G.MOSS = ACC2 if THEME == 'leaf' else ACC, ACC, T['acc2'] if THEME == 'space' else ACC, MUTED
G.CREAM, G.SOFT, G.MUTED, G.LINE = TEXT, SOFT, MUTED, HAIR
Svg, W, wrap, fade, EASE, SWAY = G.Svg, G.W, G.wrap, G.fade, G.EASE, G.SWAY


_pc = [0]


def _rng(seed):
    st = [seed & 0xffffffff]

    def f():
        st[0] = (st[0] * 1664525 + 1013904223) & 0xffffffff
        return st[0] / 4294967296
    return f


def decor(s, x, y, w, h, r, k):
    """Quiet theme texture inside a card: nebula glow and twinkling stars (Space), pollen and leaf veins (Leaf)."""
    cid = f'cl{k}'
    s.d(f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/></clipPath>')
    R = _rng(int(x * 7 + y * 13 + w * 31 + h * 17 + 5))
    o = f'<g clip-path="url(#{cid})">'
    if THEME == 'space':
        s.d(f'<radialGradient id="nb{k}a" cx="1" cy="0" r="1"><stop offset="0" stop-color="{NEB_A}" stop-opacity=".22"/><stop offset=".55" stop-color="{NEB_A}" stop-opacity=".06"/><stop offset="1" stop-color="{NEB_A}" stop-opacity="0"/></radialGradient>'
            f'<radialGradient id="nb{k}b" cx="0" cy="1" r="1"><stop offset="0" stop-color="{NEB_B}" stop-opacity=".14"/><stop offset="1" stop-color="{NEB_B}" stop-opacity="0"/></radialGradient>')
        o += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#nb{k}a)"/><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#nb{k}b)"/>'
        n = max(14, int(w * h / 5200))
        for i in range(n):
            px, py, rr = x + R() * w, y + R() * h, 0.45 + R() * 0.7
            a0 = 0.16 + R() * 0.34
            if i % 5 == 0:
                d = 2.6 + R() * 3.4
                o += (f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{rr + .1:.2f}" fill="#eaf2ff" opacity="{a0:.2f}"><animate attributeName="opacity" values="{a0:.2f};{min(.62, a0 + .3):.2f};{a0:.2f}" dur="{d:.1f}s" begin="-{R() * d:.1f}s" repeatCount="indefinite"/></circle>')
            else:
                o += f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{rr:.2f}" fill="#eaf2ff" opacity="{a0:.2f}"/>'
        if w > 600:  # a faint orbit with one small body travelling it
            cx, cy = x + w * 0.9, y + h * 1.05
            rx, ry = w * 0.36, h * 0.62
            o += (f'<g transform="translate({cx:.0f} {cy:.0f}) rotate(-18)"><ellipse rx="{rx:.0f}" ry="{ry:.0f}" fill="none" stroke="rgba(190,214,255,.10)"/>'
                  f'<circle r="2.6" fill="#cfe0f8" opacity=".75"><animateMotion dur="38s" repeatCount="indefinite" path="M{rx:.0f} 0 A{rx:.0f} {ry:.0f} 0 1 1 {-rx:.0f} 0 A{rx:.0f} {ry:.0f} 0 1 1 {rx:.0f} 0"/></circle></g>')
    else:
        s.d(f'<radialGradient id="nb{k}a" cx="1" cy="0" r="1"><stop offset="0" stop-color="{NEB_A}" stop-opacity=".15"/><stop offset="1" stop-color="{NEB_A}" stop-opacity="0"/></radialGradient>'
            f'<radialGradient id="nb{k}b" cx="0" cy="1" r="1"><stop offset="0" stop-color="{NEB_B}" stop-opacity=".16"/><stop offset="1" stop-color="{NEB_B}" stop-opacity="0"/></radialGradient>')
        o += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#nb{k}a)"/><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#nb{k}b)"/>'
        if w > 300:  # leaf veins fanning from the lower right corner
            cx, cy = x + w + 10, y + h + 34
            for i in range(11):
                ang = math.radians(196 + i * 10.5)
                o += f'<path d="M{cx:.0f} {cy:.0f} L{cx + math.cos(ang) * w * 0.55:.0f} {cy + math.sin(ang) * w * 0.55:.0f}" stroke="rgba(190,214,150,.055)" stroke-width="1"/>'
        for i in range(max(6, int(w * h / 16000))):  # pollen drifting up
            px, d = x + R() * w, 14 + R() * 12
            o += (f'<circle cx="{px:.1f}" cy="{y + h:.1f}" r="{0.8 + R() * 1.1:.2f}" fill="#f2e1b3" opacity="0"><animateTransform attributeName="transform" type="translate" values="0 0;{(R() - .5) * 26:.0f} {-h - 10:.0f}" dur="{d:.1f}s" begin="-{R() * d:.1f}s" repeatCount="indefinite"/>'
                  f'<animate attributeName="opacity" values="0;.5;.5;0" keyTimes="0;.12;.8;1" dur="{d:.1f}s" begin="-{R() * d:.1f}s" repeatCount="indefinite"/></circle>')
    if THEME == 'space':
        s.d(f'<linearGradient id="sc{k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{ACC}" stop-opacity="0"/><stop offset=".9" stop-color="{ACC}" stop-opacity=".05"/><stop offset="1" stop-color="{ACC}" stop-opacity=".13"/></linearGradient>')
        d = 7 + (k % 4) * 1.3
        o += (f'<rect x="{x}" y="{y - 70}" width="{w}" height="70" fill="url(#sc{k})"><animateTransform attributeName="transform" type="translate" values="0 0;0 {h + 70}" dur="{d:.1f}s" begin="-{(k * 1.7) % d:.1f}s" repeatCount="indefinite"/></rect>')
    else:
        s.d(f'<radialGradient id="dp{k}"><stop offset="0" stop-color="#fff3c8" stop-opacity=".09"/><stop offset="1" stop-color="#fff3c8" stop-opacity="0"/></radialGradient>')
        rr = min(w, h) * 0.6
        o += (f'<ellipse cx="{x + w * 0.3:.0f}" cy="{y + h * 0.4:.0f}" rx="{rr:.0f}" ry="{rr * 0.7:.0f}" fill="url(#dp{k})"><animateTransform attributeName="transform" type="translate" values="0 0;{w * 0.4:.0f} {h * 0.15:.0f};0 0" dur="{18 + k % 5 * 3}s" repeatCount="indefinite" {SWAY}/></ellipse>')
    return o + '</g>'


def brackets(x, y, w, h, arm=16):
    if THEME != 'space':
        return ''
    o = f'<g stroke="{ACC}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"><animate attributeName="opacity" values=".75;.4;.75" dur="5s" repeatCount="indefinite"/>'
    for px, py, sx, sy in ((x + 6, y + 6, 1, 1), (x + w - 6, y + 6, -1, 1), (x + 6, y + h - 6, 1, -1), (x + w - 6, y + h - 6, -1, -1)):
        o += f'<path d="M{px} {py + sy * arm} V{py} H{px + sx * arm}"/>'
    return o + '</g>'


def panel(s, x, y, w, h, r=16, gid='pg'):
    if not any(f'id="{gid}"' in d for d in s.defs):
        s.d(f'<linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{P1}"/><stop offset="1" stop-color="{P2}"/></linearGradient>')
    _pc[0] += 1
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="url(#{gid})"/>' + decor(s, x, y, w, h, r, _pc[0]) +
            f'<rect x="{x + .5}" y="{y + .5}" width="{w - 1}" height="{h - 1}" rx="{r - .5}" fill="none" stroke="{HAIR}"/>' + brackets(x, y, w, h))


G.panel = panel  # project diagram cards from gen3 use this panel


# ================================================================ switch + fold tabs
def planet_icon(cx, cy, col, sw=1.6):
    return (f'<g transform="translate({cx} {cy})"><circle r="6.5" fill="none" stroke="{col}" stroke-width="{sw}"/>'
            f'<ellipse rx="12" ry="3.6" fill="none" stroke="{col}" stroke-width="{sw * .8}" transform="rotate(-22)"/></g>')


def leaf_icon(cx, cy, col):
    return f'<g transform="translate({cx} {cy + 1}) scale(1.15)"><path d="{G.GINKGO}" fill="{col}"/></g>'


def switch():
    """Two halves of one segmented control. The theme each half shows uses its own accent."""
    h, w = 54, 196
    SP, LF = '#86b4d6', '#d79a5b'
    for side in ('space', 'leaf'):
        s = Svg(w, h, 'Show the Space theme' if side == 'space' else 'Show the Leaf theme')
        r = h / 2
        if side == 'space':
            s += f'<path d="M{r} .75 H{w} V{h - .75} H{r} A{r - .75} {r - .75} 0 0 1 {r} .75 Z" fill="#11161d" stroke="rgba(236,239,242,.16)" stroke-width="1.2"/>'
            s += f'<path d="M{w - .5} 13 V{h - 13}" stroke="rgba(236,239,242,.14)"/>'
            s += planet_icon(46, h / 2, SP) + s.t(70, 33, 'Space', 'H', 17, '#eceff2')
        else:
            s += f'<path d="M0 .75 H{w - r} A{r - .75} {r - .75} 0 0 1 {w - r} {h - .75} H0 Z" fill="#141b16" stroke="rgba(239,237,228,.16)" stroke-width="1.2"/>'
            s += leaf_icon(34, h / 2, LF) + s.t(56, 33, 'Leaf', 'H', 17, '#efede4')
        s.save(f'switch-{side}.svg')


def tab(side):
    w, h = 880, 34
    label = 'Space theme' if side == 'space' else 'Leaf theme'
    s = Svg(w, h, f'{label}: tap to fold or unfold')
    lw = W('BM', label, 13)
    cx = w / 2
    s += f'<path d="M24 {h / 2} H{cx - lw / 2 - 34}" stroke="{HAIR}"/><path d="M{cx + lw / 2 + 34} {h / 2} H{w - 24}" stroke="{HAIR}"/>'
    s += planet_icon(cx - lw / 2 - 16, h / 2, MUTED, 1.3) if side == 'space' else leaf_icon(cx - lw / 2 - 16, h / 2, MUTED)
    s += s.t(cx + 4, h / 2 + 4.5, label, 'BM', 13, MUTED, 'middle')
    s.save(f'tab-{side}.svg')


# ================================================================ link pills (static: GitHub images cannot hover)
def pill(name, label, primary=False):
    lw = W('BS', label, 14.5)
    w, h = int(lw + 56), 44
    s = Svg(w, h, label)
    if primary:
        # a soft ring breathes outwards now and then
        s += (f'<rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" rx="{h / 2 - .5}" fill="none" stroke="{ACC}" stroke-width="1.4" opacity="0">'
              f'<animate attributeName="opacity" values="0;.55;0;0" keyTimes="0;.05;.55;1" dur="3.6s" repeatCount="indefinite"/>'
              f'<animate attributeName="x" values=".5;-5;-5" keyTimes="0;.55;1" dur="3.6s" repeatCount="indefinite"/><animate attributeName="y" values=".5;-5;-5" keyTimes="0;.55;1" dur="3.6s" repeatCount="indefinite"/>'
              f'<animate attributeName="width" values="{w - 1};{w + 9};{w + 9}" keyTimes="0;.55;1" dur="3.6s" repeatCount="indefinite"/><animate attributeName="height" values="{h - 1};{h + 9};{h + 9}" keyTimes="0;.55;1" dur="3.6s" repeatCount="indefinite"/>'
              f'<animate attributeName="rx" values="{h / 2 - .5};{h / 2 + 4.5};{h / 2 + 4.5}" keyTimes="0;.55;1" dur="3.6s" repeatCount="indefinite"/></rect>')
        s += f'<rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" rx="{h / 2 - .5}" fill="{ACC}"/>'
        tc = '#10141a' if THEME == 'space' else '#1a140c'
    else:
        s += (f'<rect x=".75" y=".75" width="{w - 1.5}" height="{h - 1.5}" rx="{h / 2 - .75}" fill="{P1}" stroke="rgba(255,255,255,.14)" stroke-width="1.2">'
              f'<animate attributeName="stroke" values="rgba(255,255,255,.14);rgba(255,255,255,.34);rgba(255,255,255,.14)" dur="4.4s" repeatCount="indefinite"/></rect>')
        tc = TEXT
    s += s.t(24, 27.5, label, 'BS', 14.5, tc)
    ax = w - 22
    s += (f'<g><animateTransform attributeName="transform" type="translate" values="0 0;1.8 -1.8;0 0" dur="2.6s" repeatCount="indefinite" {SWAY}/>'
          f'<path d="M{ax - 5} 26 L{ax + 1} 20 M{ax - 3.5} 20 H{ax + 1} V24.5" fill="none" stroke="{tc}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g>')
    s.save(name)


IDX = {'about': '01', 'build': '02', 'activity': '03', 'work': '04', 'earlier': '05', 'toolkit': '06', 'experience': '07', 'contact': '08'}


def header(slug, title):
    w, h = 880, 44
    s = Svg(w, h, title)
    n = IDX.get(slug, '')
    s += s.t(2, 28, n, 'MO', 12, ACC, ls=2) if THEME == 'space' else s.t(2, 28, n, 'BS', 13, ACC)
    tx = 2 + W('MO' if THEME == 'space' else 'BS', n, 12 if THEME == 'space' else 13) + (16 if THEME == 'space' else 12)
    s += s.t(tx, 28, title, 'H', 21, TEXT)
    lx = tx + W('H', title, 21) + 18
    s += f'<path d="M{lx:.0f} 21 H{w - 54}" stroke="{HAIR}"/>'
    ox, oy = w - 26, 21
    if THEME == 'space':   # a planet with a moon that keeps orbiting
        s += (f'<g transform="translate({ox} {oy}) rotate(-24)"><ellipse rx="15" ry="5.2" fill="none" stroke="{MUTED}" stroke-opacity=".5"/><circle r="5.2" fill="{ACC}"/>'
              f'<circle r="2.1" fill="{TEXT}"><animateMotion dur="7s" repeatCount="indefinite" path="M15 0 A15 5.2 0 1 1 -15 0 A15 5.2 0 1 1 15 0"/></circle></g>')
    else:                  # a ginkgo leaf swaying on its stem
        s += (f'<g transform="translate({ox} {oy + 8})"><g><animateTransform attributeName="transform" type="rotate" values="-14;12;-14" dur="4.2s" repeatCount="indefinite" {SWAY}/>'
              f'<path d="{G.GINKGO}" fill="{ACC2}" transform="translate(0 -9) scale(1.35)"/></g></g>')
    s.save(f'h-{slug}.svg')


# ================================================================ about
def about():
    w, h = 880, 232
    s = Svg(w, h, 'About: AI Software Engineer at Sky Gold and Diamonds. Sole technical owner of AI and automation products; OCR, computer vision, LLM and VLM work; Python, MERN, Docker, CI/CD; B.E. Computer Science, CGPA 9.0.')
    s += panel(s, 0, 0, w, h)
    para = ('I’m the sole technical owner of the AI and automation products at Sky Gold and Diamonds, from requirements to production '
            'and maintenance. I build OCR and vision-language pipelines, computer vision tools and LLM integrations, and I’ve turned '
            'multi-day manual processes into workflows that finish in minutes.')
    for i, ln in enumerate(wrap(para, 'B', 16, 470)):
        s += f'<g opacity="0">{fade(.1 + i * .05, 6, .6)}' + s.t(30, 52 + i * 26, ln, 'B', 16, SOFT) + '</g>'
    s += f'<path d="M540 30 V{h - 30}" stroke="{HAIR}"/>'
    facts = [('Role', 'AI Software Engineer, since June 2026'), ('Focus', 'OCR, computer vision, LLM and VLM'), ('Stack', 'Python, TypeScript, MERN, Docker'), ('Education', 'B.E. Computer Science, CGPA 9.0')]
    for i, (k, v) in enumerate(facts):
        y = 48 + i * 46
        s += s.t(568, y, k, 'B', 12.5, MUTED) + s.t(568, y + 21, v, 'BM', 14.5, TEXT)
    s += (f'<circle cx="36" cy="{h - 32}" r="4" fill="{ACC2 if THEME == "leaf" else ACC}"><animate attributeName="opacity" values="1;.35;1" dur="2.6s" repeatCount="indefinite"/></circle>'
          + s.t(48, h - 27.5, 'Open to collaborations', 'BM', 13.5, SOFT))
    s.save('about.svg')


# ================================================================ how I build: the data stream
NODES = [('Input', ['documents, photos,', 'SKUs, camera feeds']), ('Vision', ['OCR and computer', 'vision models']),
         ('VLM', ['locally hosted', 'vision-language model']), ('RAG', ['retrieval over', 'company records']),
         ('LLM', ['reasoning and', 'structured output']), ('Automation', ['spreadsheets, orders,', 'compliance checks'])]


def pipeline():
    w, h = 880, 236
    s = Svg(w, h, 'How the systems are built: Input, Vision, VLM, RAG, LLM, Automation. ' + ' '.join(f'{n}: {" ".join(c)}.' for n, c in NODES))
    s += panel(s, 0, 0, w, h)
    xs = [86 + i * (708 / 5) for i in range(6)]
    y = 82
    line = f'M{xs[0]} {y} H{xs[-1]}'
    s += f'<path d="{line}" stroke="{HAIR}" stroke-width="2"/>'
    CYC, travel = 7.0, 5.0
    for i, (nm, cap) in enumerate(NODES):
        x = xs[i]
        ta = travel * i / 5 / CYC
        kt = f'0;{max(0, ta - .001):.4f};{ta + .012:.4f};{min(.999, ta + .14):.4f};1'
        s += f'<circle cx="{x:.1f}" cy="{y}" r="22" fill="{P2}" stroke="rgba(255,255,255,.14)" stroke-width="1.3"/>'
        s += (f'<circle cx="{x:.1f}" cy="{y}" r="22" fill="{ACC}" fill-opacity="0" stroke="{ACC}" stroke-opacity="0" stroke-width="1.5">'
              f'<animate attributeName="stroke-opacity" values="0;0;1;.3;.3" keyTimes="{kt}" dur="{CYC}s" repeatCount="indefinite"/>'
              f'<animate attributeName="fill-opacity" values="0;0;.18;.05;.05" keyTimes="{kt}" dur="{CYC}s" repeatCount="indefinite"/></circle>')
        s += f'<circle cx="{x:.1f}" cy="{y}" r="4" fill="{SOFT}"/>'
        s += s.t(x, y + 54, nm, 'BS', 15, TEXT, 'middle')
        for j, c in enumerate(cap):
            s += s.t(x, y + 77 + j * 18, c, 'B', 12.5, MUTED, 'middle')
    s += (f'<g><animateMotion dur="{CYC}s" repeatCount="indefinite" path="{line} H{xs[-1] + .1}" keyPoints="0;1;1" keyTimes="0;{travel / CYC:.3f};1" calcMode="linear"/>'
          f'<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;{travel / CYC:.3f};{travel / CYC + .03:.3f};1" dur="{CYC}s" repeatCount="indefinite"/>'
          f'<circle r="8" fill="{ACC}" opacity=".22"/><circle r="3.5" fill="{TEXT}"/></g>')
    s.save('pipeline.svg')


# ================================================================ activity: count-up + contribution sweep + languages
def countup(s, x, y, value, size, start, dur=1.3, suffix=''):
    o, steps = '', 12
    for k in range(1, steps + 1):
        v = round(value * (1 - (1 - k / steps) ** 3))
        b, en = start + dur * (k - 1) / steps, start + dur * k / steps
        o += f'<g opacity="0"><set attributeName="opacity" to="1" begin="{b:.2f}s"/>' + ('' if k == steps else f'<set attributeName="opacity" to="0" begin="{en:.2f}s"/>') + s.t(x, y, f'{v}{suffix}', 'H', size, TEXT) + '</g>'
    return o


def ladybug_shape(sz=1.0):
    """Top-down ladybug facing +x."""
    legs = ''.join(f'<path d="M{lx} 0 L{lx - 1.6} {s * 5.2}" />' for lx in (-3.2, 0.4, 3.6) for s in (-1, 1))
    return (f'<g transform="scale({sz})"><ellipse cx="0.6" cy="1.4" rx="7.4" ry="6.2" fill="#000" opacity=".28"/>'
            f'<g stroke="#17110f" stroke-width="1" stroke-linecap="round" fill="none"><animateTransform attributeName="transform" type="scale" values="1 1;1 .82;1 1" dur=".24s" repeatCount="indefinite"/>{legs}</g>'
            f'<path d="M9.4 -1.6 L12.4 -3.6 M9.4 1.6 L12.4 3.6" stroke="#17110f" stroke-width=".8" stroke-linecap="round"/>'
            f'<ellipse rx="7.4" ry="6.2" fill="#c8302b"/><ellipse cx="-1.4" cy="-1.8" rx="4.2" ry="2.4" fill="#ea6a5a" opacity=".5"/><path d="M-7.2 0 H6.2" stroke="#2a0b09" stroke-width=".9"/>'
            f'<g fill="#16100e"><circle cx="-3.4" cy="-2.7" r="1.25"/><circle cx="-3.4" cy="2.7" r="1.25"/><circle cx="0.6" cy="-3.1" r="1.1"/><circle cx="0.6" cy="3.1" r="1.1"/><circle cx="-6" cy="0" r=".9"/></g>'
            f'<circle cx="7.4" cy="0" r="3.2" fill="#17110f"/><circle cx="8.6" cy="-1.3" r=".7" fill="#f4efe6"/><circle cx="8.6" cy="1.3" r=".7" fill="#f4efe6"/></g>')


def probe_shape():
    """A small survey probe facing +x: gold body, two solar wings, a soft engine glow."""
    return (f'<g><rect x="-1.5" y="-8.4" width="3" height="16.8" rx="1" fill="#2d4f86"/><rect x="-7.5" y="-3.4" width="3" height="6.8" rx="1" fill="#2d4f86" opacity="0"/>'
            f'<rect x="-6.5" y="-3.6" width="13" height="7.2" rx="2.4" fill="#d6c19a" stroke="#8c7850" stroke-width=".6"/><circle cx="3" cy="0" r="2" fill="#2a3340"/><circle cx="3" cy="0" r=".9" fill="{ACC}"><animate attributeName="opacity" values="1;.3;1" dur="1.4s" repeatCount="indefinite"/></circle>'
            f'<ellipse cx="-8.4" cy="0" rx="3.2" ry="1.8" fill="{ACC}" opacity=".6"><animate attributeName="rx" values="3.2;4.8;3.2" dur=".5s" repeatCount="indefinite"/></ellipse></g>')


def activity():
    cal = S['calendar']
    first = dt.date.fromisoformat(cal[0]['date'])
    cell, gap = 11.4, 3.2
    st = cell + gap
    w = 880
    gx, gy = 60, 182
    h = int(gy + 7 * st + 76)
    best = dt.date.fromisoformat(S['best_day']['date'])
    s = Svg(w, h, f"GitHub activity, last 12 months: {S['contributions']} contributions, {S['commits']} commits, {S['repos']} repositories, {S['active_days']} active days, longest streak {S['longest_streak']} days. Best day {best.strftime('%b %d')} with {S['best_day']['count']}. "
            + ('A ladybug crawls across the grid and eats the green days, which grow back.' if THEME == 'leaf' else 'A survey probe scans across the grid and collects the lit days, which light up again.'))
    s += panel(s, 0, 0, w, h)
    tiles = [(S['contributions'], 'contributions', ''), (S['commits'], 'commits', ''), (S['repos'], 'repositories', ''), (S['active_days'], 'active days', ''), (S['longest_streak'], 'day best streak', '')]
    cw = (w - 56) / len(tiles)
    for i, (v, lab, suf) in enumerate(tiles):
        x = 28 + i * cw
        if i:
            s += f'<path d="M{x:.1f} 32 V104" stroke="{HAIR}"/>'
        xx = x + (20 if i else 0)
        s += countup(s, xx, 78, v, 36, .3 + i * .08, suffix=suf)
        s += s.t(xx, 100, lab, 'B', 13, MUTED)
    s += f'<path d="M28 128 H{w - 28}" stroke="{HAIR}"/>'
    s += s.t(28, 160, 'Last 12 months', 'BS', 14, TEXT) + s.t(w - 28, 160, f"best day {best.strftime('%b %d')}, {S['best_day']['count']} contributions", 'B', 12.5, MUTED, 'end')
    nz = sorted(d['count'] for d in cal if d['count'])
    q = [nz[int(len(nz) * p)] for p in (.25, .5, .75)] if nz else [1, 2, 3]
    lvl = lambda c: 0 if c == 0 else 1 + sum(c > t for t in q)
    rows, ncol = [], 0
    for d in cal:
        dd = dt.date.fromisoformat(d['date'])
        col = ((dd - first).days + first.isoweekday() % 7) // 7
        ncol = max(ncol, col + 1)
        rows.append((col, d['weekday'], d['count'], d['date'], dd))
    # the crawler visits every cell column by column, lingering on active days
    order = []
    for c in range(ncol):
        cs = sorted([r for r in rows if r[0] == c], key=lambda r: r[1], reverse=(c % 2 == 1))
        order += cs
    START, END, EMPTY, CHEW, REGROW = 1.4, 2.4, 0.05, 0.30, 3.6
    cum = [0.0]
    for r in order:
        cum.append(cum[-1] + (CHEW if lvl(r[2]) else EMPTY))
    CYC = START + cum[-1] + END
    tcell = {r[3]: START + cum[i] + 0.1 for i, r in enumerate(order)}
    cells, lastm = '', None
    for c, r, n, ds, dd in rows:
        x, y = gx + c * st, gy + r * st
        L = lvl(n)
        anim = ''
        if L:
            t0 = tcell[ds] / CYC
            t1 = min(0.985, t0 + REGROW / CYC)
            anim = (f'<animate attributeName="fill" values="{HEAT[L]};{HEAT[L]};{HEAT[0]};{HEAT[0]};{HEAT[L]}" keyTimes="0;{t0:.4f};{min(.995, t0 + .006):.4f};{t1:.4f};{min(.999, t1 + .03):.4f}" dur="{CYC:.1f}s" repeatCount="indefinite"/>')
        cells += f'<rect x="{x:.1f}" y="{y:.1f}" width="{cell}" height="{cell}" rx="2.6" fill="{HEAT[L]}"><title>{ds}: {n}</title>{anim}</rect>'
        if dd.day <= 7 and r == 0 and dd.month != lastm and c < ncol - 2:
            s += s.t(x, gy - 10, dd.strftime('%b'), 'B', 11, DIM)
            lastm = dd.month
    gw = ncol * st
    s.d(f'<clipPath id="rv"><rect x="{gx - 4}" y="{gy - 4}" width="0" height="{7 * st + 8}"><animate attributeName="width" from="0" to="{gw + 8:.0f}" begin=".5s" dur="1.6s" fill="freeze" {EASE}/></rect></clipPath>')
    s += f'<g clip-path="url(#rv)">{cells}</g>'
    for r, lab in ((1, 'Mon'), (3, 'Wed'), (5, 'Fri')):
        s += s.t(28, gy + r * st + 9.5, lab, 'B', 11, DIM)
    # crawler path, heading and timing
    pts = [(gx + r[0] * st + cell / 2, gy + r[1] * st + cell / 2) for r in order]
    kt = [(START + cum[i]) / CYC for i in range(len(order))]
    keyt = '0;' + ';'.join(f'{k:.5f}' for k in kt) + ';1'
    vals = [pts[0]] + pts + [pts[-1]]
    angs = []
    for i in range(len(order)):
        j = min(i + 1, len(order) - 1)
        dx, dy = pts[j][0] - pts[i][0], pts[j][1] - pts[i][1]
        angs.append(angs[-1] if (abs(dx) + abs(dy) < .1 and angs) else (math.degrees(math.atan2(dy, dx)) if abs(dx) + abs(dy) > .1 else 0))
    angv = [angs[0]] + angs + [angs[-1]]
    trans = ';'.join(f'{x:.1f} {y:.1f}' for x, y in vals)
    rot = ';'.join(f'{a:.0f}' for a in angv)
    show = f'<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;{(START - .5) / CYC:.4f};{(CYC - .7) / CYC:.4f};{(CYC - .4) / CYC:.4f};1" dur="{CYC:.1f}s" repeatCount="indefinite"/>'
    if THEME == 'leaf':
        body = ladybug_shape(1.3)
    else:
        mid = gy + 3.5 * st
        s.d(f'<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{ACC}" stop-opacity="0"/><stop offset=".5" stop-color="{ACC}" stop-opacity=".22"/><stop offset="1" stop-color="{ACC}" stop-opacity="0"/></linearGradient>')
        bx = ';'.join(f'{x:.1f} {mid:.1f}' for x, y in vals)
        s += (f'<g opacity="0">{show}<g><animateTransform attributeName="transform" type="translate" values="{bx}" keyTimes="{keyt}" calcMode="linear" dur="{CYC:.1f}s" repeatCount="indefinite"/>'
              f'<rect x="-6" y="{-3.9 * st:.1f}" width="12" height="{7.8 * st:.1f}" fill="url(#beam)"/></g></g>')
        body = '<g transform="scale(1.35)">' + probe_shape() + '</g>'
    s += (f'<g opacity="0">{show}<g><animateTransform attributeName="transform" type="translate" values="{trans}" keyTimes="{keyt}" calcMode="linear" dur="{CYC:.1f}s" repeatCount="indefinite"/>'
          f'<g><animateTransform attributeName="transform" type="rotate" values="{rot}" keyTimes="{keyt}" calcMode="discrete" dur="{CYC:.1f}s" repeatCount="indefinite"/>{body}</g></g></g>')
    ly = gy + 7 * st + 32
    langs = S['languages'][:6]
    x, bw = 28, w - 56
    for i, l in enumerate(langs):
        sw = bw * l['pct'] / 100
        s += f'<rect x="{x:.1f}" y="{ly}" width="{max(1.5, sw - 2):.1f}" height="5" rx="2.5" fill="{PAL[i]}"/>'
        x += sw
    lx = 28
    for i, l in enumerate(langs):
        lab = f"{l['name']} {l['pct']}%"
        s += f'<circle cx="{lx + 4}" cy="{ly + 25}" r="3.5" fill="{PAL[i]}"/>' + s.t(lx + 13, ly + 29.5, lab, 'B', 12.5, MUTED)
        lx += 13 + W('B', lab, 12.5) + 24
    s.save('activity.svg')


# ================================================================ earlier projects with real screenshots
def project_card(slug, title, date, desc, stack, thumb_b64):
    w, h = 284, 318
    s = Svg(w, h, f'{title}, {date}: {desc} Opens the live demo.')
    s += panel(s, 0, 0, w, h)
    s.d(f'<clipPath id="th"><rect x="10" y="10" width="{w - 20}" height="158" rx="10"/></clipPath>')
    s += f'<image x="10" y="10" width="{w - 20}" height="158" preserveAspectRatio="xMidYMin slice" clip-path="url(#th)" href="data:image/jpeg;base64,{thumb_b64}" xlink:href="data:image/jpeg;base64,{thumb_b64}"/>'
    s += f'<rect x="10.5" y="10.5" width="{w - 21}" height="157" rx="9.5" fill="none" stroke="rgba(255,255,255,.08)"/>'
    s += s.t(22, 198, title, 'H', 18, TEXT) + s.t(w - 22, 198, date, 'B', 12.5, MUTED, 'end')
    for j, ln in enumerate(wrap(desc, 'B', 13, w - 44)[:3]):
        s += s.t(22, 222 + j * 18, ln, 'B', 13, SOFT)
    s += s.t(22, h - 22, ' · '.join(stack), 'B', 12, MUTED)
    ax = w - 26
    s += f'<path d="M{ax - 5} {h - 21} L{ax + 1} {h - 27} M{ax - 3.5} {h - 27} H{ax + 1} V{h - 22.5}" fill="none" stroke="{ACC}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
    s.save(f'project-{slug}.svg')


# ================================================================ time-of-day bar
def timebar():
    w, h = 880, 54
    names = [('dawn', 'Morning'), ('day', 'Afternoon'), ('dusk', 'Evening'), ('night', 'Night')]
    cur = [n for n, _ in names].index(PHASE)
    s = Svg(w, h, f'This profile follows the time of day in India. Now showing: {names[cur][1].lower()}.')
    s += panel(s, 0, 0, w, h, 27)
    x0, x1, y = 230, 870, 27
    s += s.t(24, y + 5, 'India time', 'BS', 13, MUTED) + s.t(24 + W('BS', 'India time', 13) + 10, y + 5, f'· {names[cur][1].lower()} edition', 'B', 13, DIM)
    step = (x1 - x0) / 4
    cx = x0 + step * (cur + 0.5)
    for i, (n, lab) in enumerate(names):
        x = x0 + step * (i + 0.5)
        on = i == cur
        if on:
            if n == 'night':
                icon = f'<path d="M5 -6 A7.5 7.5 0 1 0 6 5 A6 6 0 0 1 5 -6 Z" fill="{ACC}"/>'
            else:
                icon = f'<circle r="5.5" fill="{ACC}"/>' + ''.join(f'<path d="M{7.5 * __import__("math").cos(a):.1f} {7.5 * __import__("math").sin(a):.1f} L{10.5 * __import__("math").cos(a):.1f} {10.5 * __import__("math").sin(a):.1f}" stroke="{ACC}" stroke-width="1.6" stroke-linecap="round"/>' for a in [k * 0.785 for k in range(8)])
            s += f'<rect x="{x - W("BS", lab, 13) / 2 - 38:.0f}" y="{y - 15}" width="{W("BS", lab, 13) + 50:.0f}" height="30" rx="15" fill="{ACC}" fill-opacity=".10" stroke="{ACC}" stroke-opacity=".4"/>'
            s += (f'<g transform="translate({x - W("BS", lab, 13) / 2 - 18:.0f} {y})"><circle r="15" fill="{ACC}" opacity=".18"><animate attributeName="r" values="11;17;11" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values=".25;.06;.25" dur="3s" repeatCount="indefinite"/></circle>'
                  f'<g><animateTransform attributeName="transform" type="rotate" values="0;{-20 if n == "night" else 45};0" dur="6s" repeatCount="indefinite" {SWAY}/>{icon}</g></g>')
            s += s.t(x + 4, y + 4.5, lab, 'BS', 13, TEXT, 'middle')
        else:
            s += f'<circle cx="{x - W("B", lab, 12.5) / 2 - 10:.0f}" cy="{y}" r="2.5" fill="{DIM}"/>' + s.t(x, y + 4.5, lab, 'B', 12.5, MUTED, 'middle')
    s.save('timebar.svg')


# ================================================================ toolkit
TOOL = [('Intelligence', ['OCR', 'Computer vision', 'VLM', 'LLM', 'RAG', 'Hugging Face']),
        ('Build', ['Python', 'TypeScript', 'React', 'Next.js', 'Node.js', 'MongoDB', 'PostgreSQL']),
        ('Ship', ['Docker', 'CI/CD', 'Git', 'Vercel', 'System design'])]


def toolkit():
    w, h = 880, 360
    s = Svg(w, h, 'Toolkit. ' + ' '.join(f'{g}: {", ".join(l)}.' for g, l in TOOL))
    s += panel(s, 0, 0, w, h)
    cols = [ACC, ACC2, SOFT]
    # legend
    for i, (g, l) in enumerate(TOOL if THEME == 'space' else []):
        s += f'<circle cx="34" cy="{36 + i * 24}" r="4" fill="{cols[i]}"/>' + s.t(46, 40.5 + i * 24, g, 'BS', 13, TEXT) + s.t(46 + W('BS', g, 13) + 8, 40.5 + i * 24, f'{len(l)}', 'B', 12, MUTED)
    if THEME == 'space':
        cx, cy = 470, 196
        orbits = [(150, 48, 70), (262, 86, 100), (378, 124, 130)]
        s.d(f'<radialGradient id="core"><stop offset="0" stop-color="#fff6e0"/><stop offset=".35" stop-color="{ACC2}"/><stop offset="1" stop-color="{ACC2}" stop-opacity="0"/></radialGradient>')
        for rx, ry, _ in orbits:
            s += f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="{ACC}" stroke-opacity=".16" stroke-dasharray="2 5"/>'
        s += (f'<circle cx="{cx}" cy="{cy}" r="34" fill="url(#core)"><animate attributeName="r" values="32;37;32" dur="4s" repeatCount="indefinite"/></circle>'
              f'<circle cx="{cx}" cy="{cy}" r="13" fill="{ACC2}"/>' + s.t(cx, cy + 4.5, 'AI', 'H', 12, '#1a1206', 'middle'))
        for i, (g, l) in enumerate(TOOL):
            rx, ry, dur = orbits[i]
            path = f'M{cx + rx} {cy} A{rx} {ry} 0 1 1 {cx - rx} {cy} A{rx} {ry} 0 1 1 {cx + rx} {cy}'
            for j, name in enumerate(l):
                lw = W('BM', name, 12) + 22
                beg = -dur * j / len(l)
                s += (f'<g><animateMotion dur="{dur}s" begin="{beg:.1f}s" repeatCount="indefinite" path="{path}"/>'
                      f'<rect x="{-lw / 2:.1f}" y="-12" width="{lw:.1f}" height="24" rx="12" fill="{P2}" stroke="{cols[i]}" stroke-opacity=".55"/>'
                      f'<circle cx="{-lw / 2 + 11:.1f}" cy="0" r="3" fill="{cols[i]}"/>' + s.t(-lw / 2 + 18, 4.2, name, 'BM', 12, TEXT) + '</g>')
    else:
        rows = [96, 196, 296]
        for i, (g, l) in enumerate(TOOL):
            y0 = rows[i]
            x0, x1 = 200, w - 30
            vine = f'M{x0} {y0}' + ''.join(f' Q{x0 + (k + .5) * (x1 - x0) / 8:.0f} {y0 + (10 if k % 2 else -10)} {x0 + (k + 1) * (x1 - x0) / 8:.0f} {y0}' for k in range(8))
            s += f'<path d="{vine}" fill="none" stroke="{ACC2}" stroke-opacity=".45" stroke-width="2" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" begin="{.2 + i * .3:.1f}s" dur="1.6s" fill="freeze" {EASE}/></path>'
            s += f'<circle cx="34" cy="{y0}" r="4" fill="{cols[i]}"/>' + s.t(46, y0 + 5, g, 'BS', 14, TEXT)
            step = (x1 - x0 - 40) / len(l)
            for j, name in enumerate(l):
                lx = x0 + 20 + j * step
                b = .6 + i * .3 + j * .12
                s += (f'<g transform="translate({lx:.0f} {y0})" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="{b:.2f}s" dur=".5s" fill="freeze"/>'
                      f'<g><animateTransform attributeName="transform" type="rotate" values="-10;10;-10" dur="{3.4 + (j % 3) * .6:.1f}s" begin="-{j * .7:.1f}s" repeatCount="indefinite" {SWAY}/>'
                      f'<path d="{G.GINKGO}" fill="{cols[i]}" transform="translate(0 -15) scale(1.7)"/></g>' + s.t(0, 26, name, 'BM', 12, SOFT, 'middle') + '</g>')
    s.save('toolkit.svg')


# ================================================================ experience
def experience():
    w, h = 880, 236
    items = [('2024', 'Grand Finalist', 'Smart India Hackathon, and a', 'NASA Space Apps Global Nominee'),
             ('2025', 'Full Stack Intern', 'Chemtron Science Labs; 1st place', 'at SCOE Avishkar'),
             ('2026', 'B.E. Computer Science', 'University of Mumbai,', 'CGPA 9.0'),
             ('Now', 'AI Software Engineer', 'Sky Gold and Diamonds,', 'since June 2026')]
    s = Svg(w, h, 'Experience. ' + ' '.join(f'{a}: {b}, {c} {d}' for a, b, c, d in items))
    s += panel(s, 0, 0, w, h)
    xs = [30 + i * 214 for i in range(4)]
    y = 64
    s += f'<path d="M30 {y} H{w - 30}" stroke="{HAIR}" stroke-width="1.5"/>'
    s += f'<path d="M30 {y} H{w - 30}" stroke="{ACC}" stroke-width="1.5" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" begin=".3s" dur="1.8s" fill="freeze" {EASE}/></path>'
    for i, (yr, t1, l1, l2) in enumerate(items):
        x = xs[i]
        now = i == len(items) - 1
        b = .4 + i * .4
        if THEME == 'leaf':  # milestones as fruit ripening on the branch
            r = 9 if now else 7
            mark = (f'<circle cx="{x + r}" cy="{y + r + 1}" r="{r}" fill="{ACC if now else "#c9b07a"}"/>'
                    f'<path d="M{x + r} {y + 1} q3 -6 8 -5" fill="none" stroke="{ACC2}" stroke-width="1.6" stroke-linecap="round"/>')
        else:
            mark = f'<circle cx="{x + 6}" cy="{y}" r="{6 if now else 4.5}" fill="{ACC if now else SOFT}"/>'
        s += f'<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="{b:.1f}s" dur=".5s" fill="freeze"/>{mark}</g>'
        s += f'<g opacity="0">{fade(b + .1, 8, .6)}'
        s += s.t(x, 32, yr, 'BM', 13, ACC if now else MUTED)
        s += s.t(x, 116, t1, 'BS', 16, TEXT) + s.t(x, 142, l1, 'B', 13, SOFT) + s.t(x, 162, l2, 'B', 13, SOFT)
        s += '</g>'
    s.save('experience.svg')


# ================================================================ contact
def contact():
    w, h = 880, 190
    s = Svg(w, h, 'Contact: let’s build something that thinks. sujalshah630@gmail.com')
    s += panel(s, 0, 0, w, h)
    s += s.t(30, 70, 'Let’s build something that thinks.', 'H', 30, TEXT)
    s += s.t(30, 104, 'AI automation, computer vision, or a full-stack build that should run itself.', 'B', 16, SOFT)
    s += s.t(30, 148, 'sujalshah630@gmail.com', 'BM', 15, ACC)
    s.save('contact.svg')


if __name__ == '__main__':
    from PIL import Image
    switch(); tab('space'); tab('leaf')
    pill('btn-portfolio.svg', 'Portfolio', primary=True); pill('btn-linkedin.svg', 'LinkedIn'); pill('btn-email.svg', 'Email')
    if THEME == 'leaf':
        pill('btn-site.svg', 'Leaf site')
    for slug, title in [('about', 'About'), ('build', 'How I build'), ('activity', 'Activity'), ('work', 'Selected work'), ('earlier', 'Earlier projects'), ('toolkit', 'Toolkit'), ('experience', 'Experience'), ('contact', 'Contact')]:
        header(slug, title)
    about(); pipeline(); activity()
    G.work_pair('work-a.svg', G.WORK[:2]); G.work_pair('work-b.svg', G.WORK[2:])
    # the diagram screens were drawn for the old green theme; retint them to this theme's neutrals
    tint = {'space': {'#08150f': '#0b0f14', '#11291d': '#18202a', '#0a1912': '#0b0f14', '#05070b': '#0b0f14', 'rgba(158,232,180,': 'rgba(236,239,242,'},
            'leaf': {'#08150f': '#0f1510', '#11291d': '#1e2a1f', '#0a1912': '#0f1510', '#05070b': '#0f1510', 'rgba(158,232,180,': 'rgba(239,237,228,'}}[THEME]
    for fn in ('work-a.svg', 'work-b.svg'):
        p = os.path.join(OUT, fn); txt = open(p, encoding='utf-8').read()
        for k, v in tint.items():
            txt = txt.replace(k, v)
        open(p, 'w', encoding='utf-8').write(txt)
    ARCH = [('familyconnect', 'FamilyConnect', 'Jun 2025', 'AI companion for children in orphanages, built on Gemini 1.5 Pro.', ['Next.js', 'Supabase']),
            ('greenmines', 'GreenMines', 'Dec 2024', 'Carbon-footprint tracking and sustainability reporting for mining.', ['React', 'Node', 'MongoDB']),
            ('schedulr', 'Schedulr', 'Dec 2025', 'Appointment booking with staff management and refund-safe cancellations.', ['Next.js', 'PostgreSQL'])]
    for slug, t, d, desc, stack in ARCH:
        im = Image.open(os.path.join(THUMBS, f'thumb_{slug}.png')).convert('RGB').resize((540, 321), Image.LANCZOS)
        bb = io.BytesIO(); im.save(bb, 'JPEG', quality=74, optimize=True)
        project_card(slug, t, d, desc, stack, base64.b64encode(bb.getvalue()).decode())
    timebar(); toolkit(); experience(); contact()
    print(THEME, len(os.listdir(OUT)), 'files', sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024, 'KB')
