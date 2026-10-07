"""Refined profile visuals: quiet, space-themed, matched to sujal-shah-portfolio.vercel.app.

Usage: python gen4.py [stats.json] [outdir]
"""
import base64
import datetime as dt
import io
import json
import math
import os
import random
import sys
from xml.sax.saxutils import escape as _esc

import fontkit as FK

HERE = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'stats.json')))
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'out4')
os.makedirs(OUT, exist_ok=True)

# tokens taken from the portfolio
VOID, PANEL = '#070709', '#0b0b0f'
TEXT, MUTED, DIM = '#efede7', '#989281', '#5d5a51'
CYAN, AMBER = '#00d4ff', '#e3a65b'
HAIR = 'rgba(239,237,231,.09)'
HEAT = ['#14151a', '#0a3442', '#0a6580', '#0aa2c8', '#7fe6ff']
F = {'O': 'Orb600', 'G': 'Geist400', 'GM': 'Geist500', 'GS': 'Geist600', 'M': 'GMono400', 'MM': 'GMono500'}


def esc(s):
    return _esc(str(s), {'"': '&quot;'})


class Svg:
    def __init__(self, w, h, label):
        self.w, self.h, self.label, self.parts, self.defs, self.chars = w, h, label, [], [], {}

    def __iadd__(self, x):
        self.parts.append(x)
        return self

    def t(self, x, y, text, f='G', size=14, fill=TEXT, anchor=None, ls=None, extra=''):
        self.chars[f] = self.chars.get(f, '') + str(text)
        a = f' text-anchor="{anchor}"' if anchor else ''
        l = f' letter-spacing="{ls}"' if ls is not None else ''
        return f'<text xml:space="preserve" x="{x:.1f}" y="{y:.1f}" font-family="{F[f]},sans-serif" font-size="{size}" fill="{fill}"{a}{l}{(" " + extra) if extra else ""}>{esc(text)}</text>'

    def save(self, name):
        style = ''.join(FK.face(F[k], v) for k, v in self.chars.items())
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{esc(self.label)}">'
               f'<style>{style}</style><defs>{"".join(self.defs)}</defs>{"".join(self.parts)}</svg>')
        open(os.path.join(OUT, name), 'w', encoding='utf-8').write(svg)


def W(f, text, size):
    return FK.width(F[f], text, size)


def frame(s, w, h, r=14):
    return (f'<rect width="{w}" height="{h}" rx="{r}" fill="{PANEL}"/>'
            f'<rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" rx="{r - .5}" fill="none" stroke="{HAIR}"/>')


# ---------------------------------------------------------------- header
def header(avatar_b64):
    w, h = 880, 248
    s = Svg(w, h, 'Sujal Shah, AI Software Engineer at Sky Gold and Diamonds, Navi Mumbai.')
    s.d = s.defs.append
    s.d(f'<radialGradient id="neb" cx="0.78" cy="0.35" r="0.6"><stop offset="0" stop-color="{CYAN}" stop-opacity=".07"/><stop offset="1" stop-color="{CYAN}" stop-opacity="0"/></radialGradient>')
    s.d(f'<radialGradient id="sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffd59a"/><stop offset=".45" stop-color="{AMBER}"/><stop offset="1" stop-color="{AMBER}" stop-opacity="0"/></radialGradient>')
    s.d('<radialGradient id="avbg" cx="0.35" cy="0.25" r="0.9"><stop offset="0" stop-color="#16303d"/><stop offset="1" stop-color="#0a0d12"/></radialGradient>')
    s.d('<clipPath id="fr"><rect width="880" height="248" rx="14"/></clipPath>')
    s += frame(s, w, h)
    s += f'<g clip-path="url(#fr)"><rect width="{w}" height="{h}" fill="url(#neb)"/>'
    rnd = random.Random(7)
    for _ in range(70):
        x, y, r = rnd.uniform(8, w - 8), rnd.uniform(8, h - 8), rnd.choice((0.6, 0.7, 0.8, 1.0, 1.2))
        s += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{TEXT}" opacity="{rnd.uniform(.12, .45):.2f}"/>'
    # orbit line drawing, one slow planet
    cx, cy = 724, 124
    orbits = [(48, 15), (86, 27), (128, 41), (172, 55)]
    for i, (rx, ry) in enumerate(orbits):
        s += f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="{TEXT}" stroke-opacity="{.10 if i < 3 else .06}" stroke-width="1"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="22" fill="url(#sun)" opacity=".55"/><circle cx="{cx}" cy="{cy}" r="6.5" fill="{AMBER}"/>'
    for (rx, ry), ang, rr, col in ((orbits[0], 200, 2.4, MUTED), (orbits[1], 320, 3.2, '#8fb4c4'), (orbits[3], 150, 3.0, MUTED)):
        a = math.radians(ang)
        s += f'<circle cx="{cx + rx * math.cos(a):.1f}" cy="{cy + ry * math.sin(a):.1f}" r="{rr}" fill="{col}"/>'
    rx, ry = orbits[2]
    path = f'M{cx + rx} {cy} A{rx} {ry} 0 1 1 {cx - rx} {cy} A{rx} {ry} 0 1 1 {cx + rx} {cy}'
    s += (f'<g><animateMotion dur="80s" repeatCount="indefinite" path="{path}"/>'
          f'<circle r="9" fill="{CYAN}" opacity=".12"/><circle r="3.8" fill="{CYAN}"/></g>')
    s += '</g>'
    # identity
    ax, ay, ar = 74, 124, 40
    s.d(f'<clipPath id="av"><circle cx="{ax}" cy="{ay}" r="{ar}"/></clipPath>')
    s += f'<circle cx="{ax}" cy="{ay}" r="{ar}" fill="url(#avbg)"/>'
    s += f'<image x="{ax - ar - 4}" y="{ay - ar + 2}" width="{2 * ar + 8}" height="{2 * ar + 8}" clip-path="url(#av)" href="data:image/png;base64,{avatar_b64}" xlink:href="data:image/png;base64,{avatar_b64}"/>'
    s += f'<circle cx="{ax}" cy="{ay}" r="{ar + 4.5}" fill="none" stroke="{CYAN}" stroke-opacity=".55" stroke-width="1.2"/>'
    x0 = 140
    s += s.t(x0, 112, 'SUJAL SHAH', 'O', 27, TEXT, ls=5)
    s += s.t(x0, 142, 'AI Software Engineer at Sky Gold and Diamonds', 'GM', 16, TEXT, extra='fill-opacity=".86"')
    s += s.t(x0, 168, 'Navi Mumbai, India   19.03° N  73.03° E', 'M', 11.5, MUTED, ls=0.4)
    s.save('header.svg')


# ---------------------------------------------------------------- work index
WORK = [
    ('Intelligent Document Automation', 'OCR and a locally hosted VLM turn a multi-day manual process into minutes.', 'OCR / VLM'),
    ('Enterprise Order Tracking', 'Real-time order lifecycle, the company’s single source of truth.', 'FULL-STACK'),
    ('Visual Product Search', 'Find a gold design from a rough photo or an SKU code.', 'COMPUTER VISION'),
    ('AI Security Intelligence', 'Face recognition and video understanding on NVIDIA edge. In progress.', 'EDGE AI'),
]


def work():
    w, row = 880, 58
    h = 52 + row * len(WORK) + 8
    s = Svg(w, h, 'Production systems at Sky Gold and Diamonds: ' + '; '.join(f'{a}: {b}' for a, b, _ in WORK))
    s += frame(s, w, h)
    s += s.t(28, 34, 'Sky Gold and Diamonds', 'MM', 11.5, MUTED, ls=0.3)
    s += s.t(w - 28, 34, 'production, 2026', 'M', 11.5, DIM, 'end')
    for i, (name, desc, tag) in enumerate(WORK):
        y = 52 + i * row
        s += f'<path d="M28 {y} H{w - 28}" stroke="{HAIR}"/>'
        s += s.t(28, y + 35, name, 'GS', 15.5, TEXT)
        s += s.t(300, y + 35, desc, 'G', 13.2, MUTED)
        tw = W('MM', tag, 10) + 16
        s += f'<rect x="{w - 28 - tw:.1f}" y="{y + 20}" width="{tw:.1f}" height="21" rx="10.5" fill="none" stroke="{CYAN}" stroke-opacity=".28"/>'
        s += s.t(w - 28 - tw / 2, y + 34.5, tag, 'MM', 10, CYAN, 'middle', ls=0.6, extra='fill-opacity=".85"')
    s.save('work.svg')


# ---------------------------------------------------------------- stats
def stats():
    cal = S['calendar']
    first = dt.date.fromisoformat(cal[0]['date'])
    cell, gap = 11.6, 3
    st = cell + gap
    w = 880
    gx, gy = 58, 146
    h = gy + 7 * st + 92
    s = Svg(w, h, f"GitHub, last 12 months: {S['contributions']} contributions, {S['commits']} commits, {S['repos']} repositories, {S['active_days']} active days, longest streak {S['longest_streak']} days. Top languages: " + ', '.join(f"{l['name']} {l['pct']}%" for l in S['languages'][:6]))
    s += frame(s, w, h)
    s += s.t(28, 34, 'GitHub, last 12 months', 'MM', 11.5, MUTED, ls=0.3)
    s += s.t(w - 28, 34, f"updated {S['generated']}", 'M', 11.5, DIM, 'end')
    nums = [(S['contributions'], 'contributions'), (S['commits'], 'commits'), (S['repos'], 'repositories'), (S['active_days'], 'active days'), (S['longest_streak'], 'day best streak')]
    colw = (w - 56) / len(nums)
    for i, (v, lab) in enumerate(nums):
        x = 28 + i * colw
        if i:
            s += f'<path d="M{x - 1:.1f} 54 V96" stroke="{HAIR}"/>'
        s += s.t(x + (14 if i else 0), 80, str(v), 'GS', 26, TEXT)
        s += s.t(x + (14 if i else 0), 98, lab, 'M', 11, MUTED)
    nz = sorted(d['count'] for d in cal if d['count'])
    q = [nz[int(len(nz) * p)] for p in (0.25, 0.5, 0.75)] if nz else [1, 2, 3]
    lvl = lambda c: 0 if c == 0 else 1 + sum(c > t for t in q)
    last_m = None
    ncol = 0
    for d in cal:
        dd = dt.date.fromisoformat(d['date'])
        col = ((dd - first).days + first.isoweekday() % 7) // 7
        ncol = max(ncol, col + 1)
        x, y = gx + col * st, gy + d['weekday'] * st
        s += f'<rect x="{x:.1f}" y="{y:.1f}" width="{cell}" height="{cell}" rx="2.5" fill="{HEAT[lvl(d["count"])]}"><title>{d["date"]}: {d["count"]}</title></rect>'
        if dd.day <= 7 and d['weekday'] == 0 and dd.month != last_m:
            s += s.t(x, gy - 9, dd.strftime('%b'), 'M', 10, DIM)
            last_m = dd.month
    for r, lab in ((1, 'Mon'), (3, 'Wed'), (5, 'Fri')):
        s += s.t(28, gy + r * st + 9.5, lab, 'M', 10, DIM)
    # languages: one hairline bar
    ly = gy + 7 * st + 34
    langs = S['languages'][:6]
    pal = [CYAN, '#5fa9c4', AMBER, '#8a8f98', '#b8b3a6', '#4f5966']
    bw = w - 56
    x = 28
    s += f'<rect x="28" y="{ly}" width="{bw}" height="4" rx="2" fill="#16171c"/>'
    tot = sum(l['pct'] for l in langs) or 1
    for i, l in enumerate(langs):
        sw = bw * l['pct'] / 100
        s += f'<rect x="{x:.1f}" y="{ly}" width="{max(1.5, sw - 2):.1f}" height="4" rx="2" fill="{pal[i]}"/>'
        x += sw
    lx = 28
    for i, l in enumerate(langs):
        label = f"{l['name']} {l['pct']}%"
        s += f'<circle cx="{lx + 4}" cy="{ly + 27}" r="3.5" fill="{pal[i]}"/>' + s.t(lx + 13, ly + 31, label, 'M', 11, MUTED)
        lx += 13 + W('M', label, 11) + 26
    s.save('stats.svg')


if __name__ == '__main__':
    from PIL import Image
    av = Image.open(os.path.join(HERE, 'avatar_cut.png') if os.path.exists(os.path.join(HERE, 'avatar_cut.png')) else os.path.join(os.environ['TEMP'], 'avatar_cut.png'))
    av = av.resize((176, 176), Image.LANCZOS)
    buf = io.BytesIO(); av.save(buf, 'PNG', optimize=True)
    header(base64.b64encode(buf.getvalue()).decode())
    work(); stats()
    print(sorted(os.listdir(OUT)), sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024, 'KB')
