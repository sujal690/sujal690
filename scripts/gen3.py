"""Canopy design system: animated README SVGs with embedded, subset fonts.

Usage: python gen3.py [stats.json] [outdir]
"""
import base64
import datetime as dt
import io
import json
import math
import os
import sys
from xml.sax.saxutils import escape as _esc

import fontkit as FK

HERE = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'stats.json')))
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- tokens
LEAF, LIME, MOSS, GOLD = '#3fd17f', '#c8f06a', '#86b36a', '#f2c14e'
CREAM, SOFT, MUTED = '#eef8ef', '#b9d8c3', '#8fae9c'
LINE = 'rgba(158,232,180,.15)'
CELL = ['#13281e', '#1d5a38', '#2c9455', '#3fd17f', '#c8f06a']
EASE = 'calcMode="spline" keyTimes="0;1" keySplines="0.22 1 0.36 1"'
SWAY = 'calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"'
F = {'D': 'Syne800', 'D7': 'Syne700', 'B': 'Man500', 'BB': 'Man700', 'M': 'Mono500', 'MB': 'Mono700', 'S': 'InstrSerif'}
GINKGO = 'M0 9 L0.3 4.6 C-6 4.2 -9.4 -0.9 -8.1 -5 C-6 -3.9 -4 -4.3 -2.5 -5.7 C-1.8 -4.3 -0.9 -4.3 0 -5.1 C0.9 -4.3 1.8 -4.3 2.5 -5.7 C4 -4.3 6 -3.9 8.1 -5 C9.4 -0.9 6 4.2 -0.3 4.6 Z'


def esc(s):
    return _esc(str(s), {'"': '&quot;'})


class Svg:
    def __init__(self, w, h, label):
        self.w, self.h, self.label = w, h, label
        self.parts, self.defs, self.chars = [], [], {}

    def __iadd__(self, x):
        self.parts.append(x)
        return self

    def d(self, x):
        self.defs.append(x)

    def t(self, x, y, text, f='B', size=14, fill=CREAM, anchor=None, extra='', ls=None):
        self.chars[f] = self.chars.get(f, '') + str(text)
        a = f' text-anchor="{anchor}"' if anchor else ''
        l = f' letter-spacing="{ls}"' if ls is not None else ''
        return f'<text xml:space="preserve" x="{x:.1f}" y="{y:.1f}" font-family="{F[f]},sans-serif" font-size="{size}" fill="{fill}"{a}{l}{(" " + extra) if extra else ""}>{esc(text)}</text>'

    def save(self, name):
        style = ''.join(FK.face(F[k], v) for k, v in self.chars.items())
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{esc(self.label)}">'
               f'<style>{style}</style><defs>{"".join(self.defs)}</defs>{"".join(self.parts)}</svg>')
        with open(os.path.join(OUT, name), 'w', encoding='utf-8') as fh:
            fh.write(svg)
        return len(svg)


def W(f, text, size):
    return FK.width(F[f], text, size)


def wrap(text, f, size, maxw):
    lines, cur = [], ''
    for word in text.split():
        trial = (cur + ' ' + word).strip()
        if W(f, trial, size) <= maxw:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def panel(s, x, y, w, h, r=20, gid='pg'):
    if not any(f'id="{gid}"' in d for d in s.defs):
        s.d(f'<linearGradient id="{gid}" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#10291e"/><stop offset="1" stop-color="#0a1912"/></linearGradient>')
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="url(#{gid})"/>'
            f'<rect x="{x + .5}" y="{y + .5}" width="{w - 1}" height="{h - 1}" rx="{r - .5}" fill="none" stroke="{LINE}"/>'
            f'<path d="M{x + r} {y + 1.2} H{x + w - r}" stroke="rgba(255,255,255,.07)" stroke-width="1.2"/>')


def fade(begin, dy=12, dur=0.8):
    return (f'<animate attributeName="opacity" from="0" to="1" begin="{begin}s" dur="{dur}s" fill="freeze"/>'
            f'<animateTransform attributeName="transform" type="translate" additive="sum" from="0 {dy}" to="0 0" begin="{begin}s" dur="{dur}s" fill="freeze" {EASE}/>')


def leaf(x, y, sc=1, fill=LIME, rot=0, extra=''):
    return f'<g transform="translate({x} {y}) rotate({rot}) scale({sc})"><path d="{GINKGO}" fill="{fill}"/>{extra}</g>'


# ================================================================ buttons
def icon(kind, col):
    st = f'fill="none" stroke="{col}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'
    if kind == 'about':
        return (f'<g {st}><circle cx="0" cy="-3" r="3.6"/><path d="M-6.5 7 C-6 2.4 6 2.4 6.5 7"/></g>'
                f'<g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="5s" repeatCount="indefinite"/><circle cx="9.5" cy="0" r="1.6" fill="{col}"/></g>')
    if kind == 'stack':
        out = ''
        for i, y in enumerate((-4.5, 0, 4.5)):
            dy = (-1.8, 0, 1.8)[i]
            out += (f'<path d="M-7 {y} L0 {y - 3.4} L7 {y} L0 {y + 3.4} Z" stroke="{col}" stroke-width="1.8" stroke-linejoin="round" fill-opacity="{0.25 if i == 0 else 0}" fill="{col}">'
                    f'<animateTransform attributeName="transform" type="translate" values="0 0;0 {dy};0 0" dur="2.6s" repeatCount="indefinite" {SWAY}/></path>')
        return out
    if kind == 'stats':
        out = ''
        for i, x in enumerate((-5.5, 0, 5.5)):
            hs = ((6, 12, 8), (11, 6, 13), (8, 14, 5))[i]
            v = ';'.join(f'{h}' for h in hs + (hs[0],))
            yv = ';'.join(f'{7 - h}' for h in hs + (hs[0],))
            out += (f'<rect x="{x - 1.7}" y="{7 - hs[0]}" width="3.4" height="{hs[0]}" rx="1.2" fill="{col}">'
                    f'<animate attributeName="height" values="{v}" dur="2.4s" begin="{i * 0.2}s" repeatCount="indefinite"/>'
                    f'<animate attributeName="y" values="{yv}" dur="2.4s" begin="{i * 0.2}s" repeatCount="indefinite"/></rect>')
        return out
    if kind == 'work':
        return (f'<g {st}><path d="M-3 -6 L-8 0 L-3 6"><animateTransform attributeName="transform" type="translate" values="0 0;-1.6 0;0 0" dur="2.2s" repeatCount="indefinite" {SWAY}/></path>'
                f'<path d="M3 -6 L8 0 L3 6"><animateTransform attributeName="transform" type="translate" values="0 0;1.6 0;0 0" dur="2.2s" repeatCount="indefinite" {SWAY}/></path>'
                f'<path d="M1.6 -7.5 L-1.6 7.5" stroke="{GOLD}"/></g>')
    if kind == 'path':
        return (f'<path d="M0 8 C0 3 -1 0 0 -7" {st} stroke-dasharray="17" stroke-dashoffset="17"><animate attributeName="stroke-dashoffset" values="17;0;0;17" keyTimes="0;0.4;0.85;1" dur="3.2s" repeatCount="indefinite"/></path>'
                f'<g transform="translate(0 -1)"><path d="M0 0 C-5 -1 -7 -5 -6 -7 C-3 -7 0 -4 0 0Z" fill="{col}"><animateTransform attributeName="transform" type="scale" values="0;0;1;1;0" keyTimes="0;0.3;0.5;0.85;1" dur="3.2s" repeatCount="indefinite"/></path>'
                f'<path d="M0 -3 C5 -4 7 -8 6 -10 C3 -10 0 -7 0 -3Z" fill="{col}"><animateTransform attributeName="transform" type="scale" values="0;0;1;1;0" keyTimes="0;0.4;0.6;0.85;1" dur="3.2s" repeatCount="indefinite"/></path></g>')
    if kind == 'mail':
        return (f'<g {st}><rect x="-8" y="-5.5" width="16" height="11" rx="2"/>'
                f'<path d="M-8 -4.5 L0 1.5 L8 -4.5"><animate attributeName="d" values="M-8 -4.5 L0 1.5 L8 -4.5;M-8 -4.5 L0 -9 L8 -4.5;M-8 -4.5 L0 -9 L8 -4.5;M-8 -4.5 L0 1.5 L8 -4.5" keyTimes="0;0.3;0.7;1" dur="3s" repeatCount="indefinite"/></path></g>')
    if kind == 'in':
        return (f'<g {st}><rect x="-8" y="-8" width="16" height="16" rx="3.5"/><path d="M-4 -0.5 V4.5 M-4 -3.6 V-3.4 M0 4.5 V-0.5 M0 1.5 C0 -1.8 4.2 -1.8 4.2 1.5 V4.5"/></g>')
    if kind == 'globe':
        return (f'<g {st}><circle r="8"/><path d="M-8 0 H8"/><ellipse rx="3.5" ry="8"><animate attributeName="rx" values="8;0.6;8" dur="3.6s" repeatCount="indefinite" {SWAY}/></ellipse></g>')
    if kind == 'leaf':
        return f'<g><animateTransform attributeName="transform" type="rotate" values="-14;12;-14" dur="3.4s" repeatCount="indefinite" {SWAY}/><path d="{GINKGO}" fill="{col}" transform="scale(0.95)"/></g>'
    return ''


def button(name, label, kind, primary=False, w=None, size=15):
    lw = W('BB', label, size)
    w = w or int(16 + 32 + 12 + lw + 22 + (30 if primary else 0))
    h = 48
    s = Svg(w, h, label)
    per = 2 * (w - h) + math.pi * h
    if primary:
        s.d(f'<linearGradient id="bf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9f77f"/><stop offset="1" stop-color="#7fdc8a"/></linearGradient>')
        s += f'<rect x="0" y="0" width="{w}" height="{h}" rx="{h / 2}" fill="url(#bf)"/>'
        s += f'<rect x="1" y="1" width="{w - 2}" height="{h - 2}" rx="{h / 2 - 1}" fill="none" stroke="rgba(255,255,255,.35)"/>'
        ic, txt, circ = '#0b2416', '#0b2416', 'rgba(11,36,22,.12)'
    else:
        s += f'<rect x="0" y="0" width="{w}" height="{h}" rx="{h / 2}" fill="#0e2219"/>'
        s += f'<rect x=".75" y=".75" width="{w - 1.5}" height="{h - 1.5}" rx="{h / 2 - .75}" fill="none" stroke="{LINE}" stroke-width="1.5"/>'
        s += (f'<rect x=".75" y=".75" width="{w - 1.5}" height="{h - 1.5}" rx="{h / 2 - .75}" fill="none" stroke="{LIME}" stroke-opacity=".75" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="22 {per:.0f}">'
              f'<animate attributeName="stroke-dashoffset" from="0" to="-{per:.0f}" dur="{6 + (len(label) % 4)}s" repeatCount="indefinite"/></rect>')
        ic, txt, circ = LIME, CREAM, 'rgba(200,240,106,.12)'
    s += f'<circle cx="32" cy="24" r="16" fill="{circ}"/>'
    s += f'<g transform="translate(32 24)">{icon(kind, ic)}</g>'
    s += s.t(60, 29.5, label, 'BB', size, txt)
    if primary:
        s += (f'<g transform="translate({w - 30} 24)"><circle r="14" fill="#0b2416"/>'
              f'<path d="M-4.5 4.5 L4.5 -4.5 M-2.5 -4.5 H4.5 V2.5" fill="none" stroke="{LIME}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'
              f'<animateTransform attributeName="transform" type="translate" values="0 0;1.6 -1.6;0 0" dur="1.8s" repeatCount="indefinite" {SWAY}/></path></g>')
    s.save(name)


# ================================================================ section headers
def header(slug, title, sub):
    s = Svg(880, 66, f'{title}: {sub}')
    s += panel(s, 0, 0, 880, 66, 18)
    s += f'<circle cx="38" cy="33" r="19" fill="rgba(200,240,106,.10)"/>'
    s += f'<g transform="translate(38 35)"><g><animateTransform attributeName="transform" type="rotate" values="-12;10;-12" dur="4s" repeatCount="indefinite" {SWAY}/><path d="{GINKGO}" fill="{LIME}" transform="scale(1.25)"/></g></g>'
    s += s.t(72, 42, title, 'D7', 25, CREAM)
    tx = 72 + W('D7', title, 25) + 14
    s += s.t(tx, 41, sub, 'S', 20, LIME)
    lx = tx + W('S', sub, 20) + 22
    if lx < 820:
        s += (f'<path d="M{lx:.0f} 33 H852" stroke="{LINE}" stroke-width="1.5"/>'
              f'<path d="M{lx:.0f} 33 H852" stroke="{LEAF}" stroke-width="1.5" stroke-dasharray="{852 - lx:.0f}" stroke-dashoffset="{852 - lx:.0f}"><animate attributeName="stroke-dashoffset" to="0" dur="1.4s" begin="0.2s" fill="freeze" {EASE} from="{852 - lx:.0f}"/></path>'
              f'<circle cx="852" cy="33" r="3.5" fill="{LIME}"/>')
    s.save(f'h-{slug}.svg')


# ================================================================ terminal
def terminal():
    lines = [
        ('cmd', 'whoami'),
        ('out', 'Sujal Shah | AI Software Engineer @ Sky Gold and Diamonds'),
        ('cmd', 'cat focus.txt'),
        ('out', 'OCR + vision-language pipelines, computer vision, LLM integrations'),
        ('cmd', 'cat impact.log'),
        ('out', 'multi-day manual workflows  ->  automated runs that finish in minutes'),
        ('cmd', './ship --stack'),
        ('out', 'python  typescript  react  next.js  node  docker  ci/cd'),
    ]
    w, h = 880, 318
    s = Svg(w, h, 'Terminal: whoami. Sujal Shah, AI Software Engineer at Sky Gold and Diamonds.')
    s += panel(s, 0, 0, w, h, 18)
    s += f'<path d="M0 46 H{w}" stroke="{LINE}"/>'
    for i, c in enumerate(('#ff6b5e', '#f5c04a', '#3fd17f')):
        s += f'<circle cx="{26 + i * 20}" cy="23" r="6" fill="{c}"/>'
    s += s.t(w / 2, 28, 'sujal@canopy: ~/profile', 'M', 12.5, MUTED, 'middle')
    CYC, typed = 10.0, 6
    for i, (k, txt) in enumerate(lines):
        y = 82 + i * 28
        if k == 'cmd':
            body = (s.t(26, y, 'sujal', 'MB', 15, LEAF) + s.t(26 + W('MB', 'sujal', 15), y, '@canopy', 'M', 15, GOLD)
                    + s.t(26 + W('MB', 'sujal', 15) + W('M', '@canopy', 15), y, ' ~ % ', 'M', 15, MUTED)
                    + s.t(26 + W('MB', 'sujal', 15) + W('M', '@canopy ~ % ', 15), y, txt, 'MB', 15, CREAM))
        else:
            body = s.t(46, y, txt, 'M', 15, SOFT)
        if i >= typed:
            full = 820
            t0 = 1.0 if k == 'cmd' else 2.3
            d = 1.1
            s.d(f'<clipPath id="c{i}"><rect x="20" y="{y - 20}" width="0" height="28"><animate attributeName="width" values="0;0;{full};{full};0" keyTimes="0;{t0 / CYC:.3f};{(t0 + d) / CYC:.3f};0.96;1" dur="{CYC}s" repeatCount="indefinite"/></rect></clipPath>')
            s += f'<g clip-path="url(#c{i})">{body}</g>'
        else:
            s += f'<g opacity="0">{fade(0.15 + i * 0.08, 6, 0.5)}{body}</g>'
    yl = 82 + len(lines) * 28 - 6
    s += (f'<rect x="26" y="{yl - 12}" width="9" height="17" rx="1.5" fill="{LIME}">'
          f'<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1.05s" repeatCount="indefinite"/></rect>')
    s.save('terminal.svg')


# ================================================================ about (with avatar)
def about(avatar_b64):
    w, h = 880, 344
    s = Svg(w, h, 'About Sujal Shah: AI Software Engineer at Sky Gold and Diamonds. Sole technical owner of AI products; OCR, computer vision, LLM and VLM; ships with Python, MERN, Docker, CI/CD; B.E. Computer Science, CGPA 9.0.')
    s += panel(s, 0, 0, w, h, 22)
    cx, cy, r = 140, 176, 90
    s.d(f'<radialGradient id="disc" cx="0.32" cy="0.22" r="0.95"><stop offset="0" stop-color="#d9f77f"/><stop offset="0.38" stop-color="#46c46f"/><stop offset="0.78" stop-color="#14512f"/><stop offset="1" stop-color="#0c2a1c"/></radialGradient>')
    s.d(f'<clipPath id="pop"><path d="M{cx - r - 30} {cy - r - 60} H{cx + r + 30} V{cy} H{cx + r} A{r} {r} 0 0 1 {cx - r} {cy} H{cx - r - 30} Z"/></clipPath>')
    s += f'<g opacity="0">{fade(0.1, 14, 1.0)}'
    s += f'<circle cx="{cx}" cy="{cy}" r="{r + 16}" fill="none" stroke="rgba(200,240,106,.25)" stroke-width="1.2"/>'
    s += (f'<g transform="translate({cx} {cy})"><g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="16s" repeatCount="indefinite"/>'
          f'<circle r="{r + 16}" fill="none" stroke="{LIME}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="70 {2 * math.pi * (r + 16):.0f}"/>'
          f'{leaf(r + 16, 0, 1.1, LIME, 90)}</g>'
          f'<g><animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="24s" repeatCount="indefinite"/><circle cx="0" cy="{-(r + 16)}" r="3.2" fill="{GOLD}"/></g></g>')
    s += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#disc)"/>'
    size = 2 * r + 78
    s += f'<image x="{cx - size / 2}" y="{cy + r - size + 6}" width="{size}" height="{size}" clip-path="url(#pop)" href="data:image/png;base64,{avatar_b64}" xlink:href="data:image/png;base64,{avatar_b64}"/>'
    s += '</g>'
    # status pill
    sw = 22 + W('BB', 'Open to collaborations', 12.5) + 14
    s += (f'<g opacity="0" transform="translate({cx - sw / 2:.0f} 300)">{fade(0.6, 8, 0.6)}<rect width="{sw:.0f}" height="28" rx="14" fill="#0e2a1c" stroke="rgba(200,240,106,.35)"/>'
          f'<circle cx="14" cy="14" r="4" fill="{LIME}"/><circle cx="14" cy="14" r="4" fill="none" stroke="{LIME}"><animate attributeName="r" values="4;10" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;0" dur="1.8s" repeatCount="indefinite"/></circle>'
          + s.t(26, 18.5, 'Open to collaborations', 'BB', 12.5, CREAM) + '</g>')
    x0 = 300
    s += f'<g opacity="0">{fade(0.25)}' + s.t(x0, 76, 'Sujal Shah', 'D', 40, CREAM) + '</g>'
    s += f'<g opacity="0">{fade(0.35)}' + s.t(x0, 106, 'AI Software Engineer at Sky Gold and Diamonds', 'BB', 16.5, SOFT) + '</g>'
    s += f'<g opacity="0">{fade(0.45)}' + s.t(x0, 140, 'Turning multi-day manual work into minutes.', 'S', 23, LIME) + '</g>'
    facts = [('role', 'Sole technical owner of AI products'), ('focus', 'OCR, computer vision, LLM and VLM'),
             ('ships with', 'Python, MERN, Docker, CI/CD'), ('education', 'B.E. Computer Science, CGPA 9.0')]
    for i, (k, v) in enumerate(facts):
        fx, fy = x0 + (i % 2) * 284, 170 + (i // 2) * 78
        s += (f'<g opacity="0" transform="translate({fx} {fy})">{fade(0.55 + i * 0.1, 10, 0.7)}'
              f'<rect width="270" height="64" rx="14" fill="rgba(255,255,255,.025)" stroke="{LINE}"/>'
              f'<rect x="0" y="16" width="3" height="32" rx="1.5" fill="{(LEAF, LIME, GOLD, MOSS)[i]}"/>'
              + s.t(18, 25, k, 'M', 11.5, MUTED) + s.t(18, 47, v, 'BB', 14.2, CREAM) + '</g>')
    s.save('about.svg')


# ================================================================ stack
STACK = [
    ('Intelligence', 'models and vision', LEAF, ['Machine learning', 'Computer vision', 'NLP', 'OCR', 'LLM', 'VLM', 'RAG', 'Hugging Face', 'Inference optimization']),
    ('Build', 'apps and APIs', LIME, ['Python', 'TypeScript', 'JavaScript', 'SQL', 'React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'Redux', 'Tailwind CSS', 'REST APIs', 'Microservices']),
    ('Ship', 'delivery', GOLD, ['Docker', 'CI/CD', 'Git', 'Vercel', 'Render', 'Postman', 'System design', 'Agile']),
]


def stack():
    w, lw, x0, line = 880, 190, 214, 42
    rows, y = [], 26
    for cat, sub, col, chips in STACK:
        x, ln, placed = x0, 0, []
        for c in chips:
            cw = W('B', c, 13.5) + 36
            if x + cw > w - 24:
                x, ln = x0, ln + 1
            placed.append((c, x, ln, cw))
            x += cw + 8
        rh = (ln + 1) * line + 18
        rows.append((cat, sub, col, y, rh, placed))
        y += rh
    h = y + 10
    s = Svg(w, h, 'Tech stack. ' + '. '.join(f'{c}: ' + ', '.join(ch) for c, _, _, ch in STACK))
    s += panel(s, 0, 0, w, h, 22)
    total = sum(len(r[5]) for r in rows)
    cyc = total * 0.45
    n = 0
    for ri, (cat, sub, col, y, rh, placed) in enumerate(rows):
        if ri:
            s += f'<path d="M24 {y - 8} H{w - 24}" stroke="{LINE}"/>'
        s += f'<g opacity="0">{fade(0.1 + ri * 0.15)}' + s.t(26, y + 24, cat, 'D7', 19, CREAM) + s.t(26, y + 46, sub, 'S', 17, col) + '</g>'
        for c, x, ln, cw in placed:
            cy = y + ln * line
            a = n / total
            s += (f'<g opacity="0" transform="translate({x:.1f} {cy + 4})">{fade(0.2 + n * 0.03, 6, 0.5)}'
                  f'<rect width="{cw:.1f}" height="32" rx="16" fill="rgba(255,255,255,.03)" stroke="{LINE}">'
                  f'<animate attributeName="stroke" values="{LINE};{LINE};{col};{LINE};{LINE}" keyTimes="0;{a:.3f};{min(a + 0.02, 0.99):.3f};{min(a + 0.06, 0.995):.3f};1" dur="{cyc:.1f}s" begin="2s" repeatCount="indefinite"/></rect>'
                  f'<circle cx="16" cy="16" r="4" fill="{col}"/>'
                  + s.t(27, 21, c, 'B', 13.5, CREAM) + '</g>')
            n += 1
    s.save('stack.svg')


# ================================================================ stats: tiles
def tiles():
    w, h = 880, 132
    items = [('contributions', str(S['contributions']), 'last 12 months', LEAF), ('commits', str(S['commits']), 'last 12 months', LIME),
             ('repositories', str(S['repos']), f"{S['public_repos']} public", GOLD), ('active days', str(S['active_days']), 'of 365', LEAF),
             ('longest streak', f"{S['longest_streak']}", 'days in a row', LIME), ('current streak', f"{S['current_streak']}", 'days and counting', GOLD)]
    s = Svg(w, h, 'GitHub stats: ' + ', '.join(f'{a} {b}' for a, b, _, _ in items))
    gap = 12
    tw = (w - gap * 5) / 6
    mx = max(m['count'] for m in S['months']) or 1
    for i, (lab, val, sub, col) in enumerate(items):
        x = i * (tw + gap)
        s += f'<g opacity="0" transform="translate({x:.1f} 0)">{fade(0.1 + i * 0.08, 10, 0.7)}'
        s += panel(s, 0, 0, round(tw), h, 18)
        s += s.t(16, 28, lab, 'M', 11, MUTED)
        s += s.t(16, 72, val, 'D', 38, CREAM)
        s += s.t(16 + W('D', val, 38) + 6, 72, '' if lab not in ('longest streak', 'current streak') else 'd', 'D7', 18, col) if lab in ('longest streak', 'current streak') else ''
        s += s.t(16, 94, sub, 'B', 11.5, SOFT)
        # micro sparkline of monthly activity, drawn once
        pts = [(16 + j * (tw - 32) / 11, 118 - 14 * m['count'] / mx) for j, m in enumerate(S['months'])]
        d = 'M' + ' L'.join(f'{px:.1f} {py:.1f}' for px, py in pts)
        ln = sum(math.dist(pts[j], pts[j + 1]) for j in range(len(pts) - 1))
        s += (f'<path d="{d}" fill="none" stroke="{col}" stroke-opacity=".75" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="{ln:.0f}" stroke-dashoffset="{ln:.0f}">'
              f'<animate attributeName="stroke-dashoffset" from="{ln:.0f}" to="0" begin="{0.5 + i * 0.1}s" dur="1.4s" fill="freeze" {EASE}/></path>') if i in (0, 1, 3) else (
              f'<rect x="16" y="112" width="{tw - 32:.0f}" height="4" rx="2" fill="rgba(255,255,255,.06)"/>'
              f'<rect x="16" y="112" width="0" height="4" rx="2" fill="{col}"><animate attributeName="width" to="{(tw - 32) * (0.62 if i == 2 else min(1, int(val) / max(1, S["longest_streak"]))):.0f}" from="0" begin="{0.5 + i * 0.1}s" dur="1.2s" fill="freeze" {EASE}/></rect>')
        s += '</g>'
    s.save('stats-tiles.svg')


# ================================================================ stats: contribution grove (heatmap + caterpillar)
def contrib():
    cal = S['calendar']
    first = dt.date.fromisoformat(cal[0]['date'])
    cell, gap = 12, 3.2
    st = cell + gap
    gx, gy = 58, 74
    pos = {}
    for d in cal:
        dd = dt.date.fromisoformat(d['date'])
        col = ((dd - first).days + first.isoweekday() % 7) // 7
        pos[d['date']] = (col, d['weekday'], d['count'])
    ncol = max(c for c, _, _ in pos.values()) + 1
    w, h = 880, gy + 7 * st + 46
    nz = sorted(v[2] for v in pos.values() if v[2])
    q = [nz[int(len(nz) * p)] for p in (0.25, 0.5, 0.75)] if nz else [1, 2, 3]
    lvl = lambda c: 0 if c == 0 else 1 + sum(c > t for t in q)
    best = S['best_day']
    bd = dt.date.fromisoformat(best['date'])
    s = Svg(w, h, f"{S['contributions']} contributions in the last year. Best day: {best['count']} on {bd.strftime('%d %b %Y')}. A caterpillar crawls through the contribution grid eating each green square.")
    s += panel(s, 0, 0, w, h, 22)
    s += s.t(26, 38, f"{S['contributions']} contributions in the last year", 'BB', 16, CREAM)
    s += s.t(26 + W('BB', f"{S['contributions']} contributions in the last year", 16) + 12, 38, f"best day {bd.strftime('%b %d')}, {best['count']} commits", 'S', 17, LIME)
    lx = w - 26 - 5 * 15 - 70
    s += s.t(lx, 37, 'less', 'M', 10.5, MUTED)
    for i, c in enumerate(CELL):
        s += f'<rect x="{lx + 34 + i * 15}" y="27" width="12" height="12" rx="3" fill="{c}"/>'
    s += s.t(lx + 34 + 5 * 15 + 4, 37, 'more', 'M', 10.5, MUTED)
    for r, lab in ((1, 'Mon'), (3, 'Wed'), (5, 'Fri')):
        s += s.t(24, gy + r * st + 10, lab, 'M', 10, MUTED)
    last_m = None
    for d in cal:
        dd = dt.date.fromisoformat(d['date'])
        c, r, _ = pos[d['date']]
        if dd.day <= 7 and r == 0 and dd.month != last_m and c < ncol - 2:
            s += s.t(gx + c * st, gy - 10, dd.strftime('%b'), 'M', 10.5, MUTED)
            last_m = dd.month
    # serpentine crawl path through every grid slot
    order = []
    for c in range(ncol):
        rr = range(7) if c % 2 == 0 else range(6, -1, -1)
        for r in rr:
            order.append((c, r))
    idx = {p: i for i, p in enumerate(order)}
    CRAWL, START = 26.0, 1.6
    grid = ''
    for d in cal:
        c, r, cnt = pos[d['date']]
        x, y = gx + c * st, gy + r * st
        L = lvl(cnt)
        anim = ''
        if L:
            ti = idx[(c, r)] / (len(order) - 1) * 0.94
            back = min(0.995, ti + 3.2 / CRAWL)
            anim = f'<animate attributeName="fill" values="{CELL[L]};{CELL[0]};{CELL[L]}" keyTimes="0;{ti:.4f};{back:.4f}" calcMode="discrete" dur="{CRAWL}s" begin="{START}s" repeatCount="indefinite"/>'
        grid += f'<rect x="{x:.1f}" y="{y:.1f}" width="{cell}" height="{cell}" rx="3" fill="{CELL[L]}"><title>{d["date"]}: {cnt}</title>{anim}</rect>'
    gw = ncol * st
    s.d(f'<clipPath id="rv"><rect x="{gx - 4}" y="{gy - 4}" width="0" height="{7 * st + 8}"><animate attributeName="width" from="0" to="{gw + 8:.0f}" dur="1.3s" begin="0.2s" fill="freeze" {EASE}/></rect></clipPath>')
    s += f'<g clip-path="url(#rv)">{grid}</g>'
    pts = [(gx + c * st + cell / 2, gy + r * st + cell / 2) for c, r in order]
    path = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)
    seg = 7
    dtk = CRAWL * 0.94 / (len(order) - 1)
    body = ''
    for k in range(seg, 0, -1):
        rr = 5.6 - k * 0.32
        colr = LIME if k % 2 else LEAF
        body += (f'<circle r="{rr:.1f}" fill="{colr}" stroke="#0a1912" stroke-width="1.2" opacity="0">'
                 f'<set attributeName="opacity" to="1" begin="{START + k * dtk * 1.25:.2f}s"/>'
                 f'<animateMotion dur="{CRAWL}s" begin="{START - 0:.2f}s" repeatCount="indefinite" path="{path}" keyPoints="0;0;1;1" keyTimes="0;{min(0.05, k * dtk * 1.25 / CRAWL):.4f};{0.94 + min(0.05, k * dtk * 1.25 / CRAWL) * 0:.4f};1" calcMode="linear"/></circle>')
    head = (f'<g opacity="0"><set attributeName="opacity" to="1" begin="{START}s"/>'
            f'<animateMotion dur="{CRAWL}s" begin="{START}s" repeatCount="indefinite" path="{path}" keyPoints="0;1;1" keyTimes="0;0.94;1" calcMode="linear" rotate="auto"/>'
            f'<circle r="6.6" fill="{GOLD}" stroke="#0a1912" stroke-width="1.2"/><circle cx="2.4" cy="-2.4" r="1.4" fill="#0a1912"/><circle cx="2.4" cy="2.4" r="1.4" fill="#0a1912"/>'
            f'<path d="M4 -4 L8 -8 M4 4 L8 8" stroke="{GOLD}" stroke-width="1.3" stroke-linecap="round"/></g>')
    # body segments trail the head by delaying along the same timeline
    trail = ''
    for k in range(1, seg + 1):
        lag = k * dtk * 0.42
        rr = 5.8 - k * 0.35
        colr = LIME if k % 2 else LEAF
        trail += (f'<g opacity="0"><set attributeName="opacity" to="1" begin="{START + lag:.2f}s"/>'
                  f'<animateMotion dur="{CRAWL}s" begin="{START + lag:.2f}s" repeatCount="indefinite" path="{path}" keyPoints="0;1;1" keyTimes="0;0.94;1" calcMode="linear"/>'
                  f'<circle r="{rr:.1f}" fill="{colr}" stroke="#0a1912" stroke-width="1.2"/></g>')
    s += f'<g>{trail[::1]}{head}</g>'
    s += s.t(26, h - 16, f"{S['active_days']} active days, longest streak {S['longest_streak']} days, current streak {S['current_streak']} day{'s' if S['current_streak'] != 1 else ''}", 'B', 12.5, SOFT)
    s += s.t(w - 26, h - 16, f"updated {S['generated']}", 'M', 10.5, MUTED, 'end')
    s.save('contrib.svg')


# ================================================================ stats: insights (monthly chart, languages, rhythm)
def smooth(pts):
    d = f'M{pts[0][0]:.1f} {pts[0][1]:.1f}'
    for i in range(len(pts) - 1):
        p0 = pts[i - 1] if i else pts[i]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < len(pts) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f' C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}'
    return d


def insights():
    w, h = 880, 420
    s = Svg(w, h, 'Contributions per month, top languages and weekly rhythm.')
    # monthly chart
    s += panel(s, 0, 0, 490, 280, 22)
    ms = S['months']
    mx = max(m['count'] for m in ms) or 1
    pk = max(ms, key=lambda m: m['count'])
    pkd = dt.date.fromisoformat(pk['month'] + '-01')
    s += s.t(24, 38, 'Contributions per month', 'BB', 15.5, CREAM)
    s += s.t(24, 62, f"peak in {pkd.strftime('%B %Y')}", 'S', 18, LIME)
    x0, x1, y0, y1 = 36, 466, 92, 232
    for g in range(4):
        yy = y1 - (y1 - y0) * g / 3
        s += f'<path d="M{x0} {yy:.1f} H{x1}" stroke="{LINE}" stroke-dasharray="{2 if g else 0} 5"/>'
        s += s.t(x1, yy - 5, str(round(mx * g / 3)), 'M', 9.5, MUTED, 'end') if g else ''
    pts = [(x0 + (x1 - x0) * i / (len(ms) - 1), y1 - (y1 - y0) * m['count'] / mx) for i, m in enumerate(ms)]
    line = smooth(pts)
    s.d(f'<linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{LEAF}" stop-opacity=".45"/><stop offset="1" stop-color="{LEAF}" stop-opacity="0"/></linearGradient>')
    s.d(f'<clipPath id="arc"><rect x="{x0}" y="{y0 - 20}" width="0" height="{y1 - y0 + 24}"><animate attributeName="width" from="0" to="{x1 - x0 + 2}" begin="0.3s" dur="1.8s" fill="freeze" {EASE}/></rect></clipPath>')
    s += f'<g clip-path="url(#arc)"><path d="{line} L{x1} {y1} L{x0} {y1} Z" fill="url(#ar)"/><path d="{line}" fill="none" stroke="{LIME}" stroke-width="2.6" stroke-linecap="round"/></g>'
    for i, (px, py) in enumerate(pts):
        m = ms[i]
        s += f'<circle cx="{px:.1f}" cy="{py:.1f}" r="3.2" fill="#0a1912" stroke="{LIME}" stroke-width="1.6" opacity="0"><animate attributeName="opacity" to="1" from="0" begin="{0.3 + 1.8 * i / (len(ms) - 1):.2f}s" dur=".3s" fill="freeze"/><title>{m["month"]}: {m["count"]}</title></circle>'
        s += s.t(px, y1 + 20, dt.date.fromisoformat(m['month'] + '-01').strftime('%b')[:3], 'M', 9.5, MUTED, 'middle')
    pi = ms.index(pk)
    px, py = pts[pi]
    s += (f'<circle cx="{px:.1f}" cy="{py:.1f}" r="5" fill="{GOLD}"/><circle cx="{px:.1f}" cy="{py:.1f}" r="5" fill="none" stroke="{GOLD}"><animate attributeName="r" values="5;14" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="2s" repeatCount="indefinite"/></circle>')
    lab = f"{pk['count']}"
    s += f'<rect x="{px - 18:.1f}" y="{py - 34:.1f}" width="36" height="20" rx="10" fill="{GOLD}"/>' + s.t(px, py - 20, lab, 'MB', 11, '#0a1912', 'middle')

    # languages donut
    s += panel(s, 506, 0, 374, 280, 22)
    s += s.t(530, 38, 'Top languages', 'BB', 15.5, CREAM)
    s += s.t(530, 62, 'across all repositories', 'S', 18, LIME)
    langs = S['languages'][:6]
    other = max(0, 100 - sum(l['pct'] for l in langs))
    pal = [LEAF, LIME, GOLD, '#6fb39a', '#e0965a', '#a58fd6', '#7a8f84']
    segs = [(l['name'], l['pct'], pal[i]) for i, l in enumerate(langs)]
    if other > 0.5:
        segs.append(('Other', round(other, 1), pal[6]))
    cx, cy, r = 610, 176, 62
    C = 2 * math.pi * r
    acc = 0
    s += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="20"/>'
    for i, (n, p, col) in enumerate(segs):
        L = C * p / 100
        gap = 2.5 if L > 6 else 0
        s += (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{col}" stroke-width="20" stroke-dasharray="0 {C:.1f}" stroke-dashoffset="{-acc:.1f}" transform="rotate(-90 {cx} {cy})">'
              f'<animate attributeName="stroke-dasharray" from="0 {C:.1f}" to="{max(0.1, L - gap):.1f} {C:.1f}" begin="{0.3 + i * 0.18:.2f}s" dur=".9s" fill="freeze" {EASE}/><title>{n} {p}%</title></circle>')
        acc += L
    top = segs[0]
    s += s.t(cx, cy - 2, f'{round(top[1])}%', 'D', 26, CREAM, 'middle') + s.t(cx, cy + 18, top[0], 'B', 12, SOFT, 'middle')
    for i, (n, p, col) in enumerate(segs):
        ly = 110 + i * 25
        s += (f'<g opacity="0">{fade(0.5 + i * 0.08, 6, 0.5)}<rect x="700" y="{ly - 9}" width="10" height="10" rx="3" fill="{col}"/>'
              + s.t(718, ly, n, 'B', 13, CREAM) + s.t(858, ly, f'{p}%', 'M', 11.5, MUTED, 'end') + '</g>')

    # weekly rhythm
    s += panel(s, 0, 296, 880, 124, 22)
    days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    wk = S['weekday']
    mxw = max(wk) or 1
    top_day = days[wk.index(mxw)]
    s += s.t(24, 336, 'Weekly rhythm', 'BB', 15.5, CREAM)
    s += s.t(24, 362, f"most active on {['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][wk.index(mxw)]}", 'S', 18, LIME)
    s += s.t(24, 392, f'{S["contributions"]} contributions spread across the week', 'B', 12, SOFT)
    bx, bw = 300, 64
    for i, v in enumerate(wk):
        hh = 62 * v / mxw
        x = bx + i * (bw + 12)
        col = GOLD if v == mxw else LEAF
        s += f'<rect x="{x}" y="{318}" width="{bw}" height="62" rx="10" fill="rgba(255,255,255,.035)"/>'
        s += (f'<rect x="{x}" y="{380}" width="{bw}" height="0" rx="10" fill="{col}" fill-opacity="{1 if v == mxw else .75}">'
              f'<animate attributeName="height" from="0" to="{hh:.1f}" begin="{0.4 + i * 0.07:.2f}s" dur=".9s" fill="freeze" {EASE}/>'
              f'<animate attributeName="y" from="380" to="{380 - hh:.1f}" begin="{0.4 + i * 0.07:.2f}s" dur=".9s" fill="freeze" {EASE}/><title>{days[i]}: {v}</title></rect>')
        s += s.t(x + bw / 2, 403, days[i], 'M', 10.5, CREAM if v == mxw else MUTED, 'middle')
    s.save('insights.svg')


# ================================================================ work cards with live diagrams
def diag_docs(s):
    o = '<g transform="translate(16 16)">'
    o += f'<rect x="38" y="22" width="66" height="86" rx="7" fill="#11291d" stroke="{LINE}"/>'
    for i, ww in enumerate((44, 36, 46, 30, 40, 26)):
        o += f'<rect x="48" y="{36 + i * 11}" width="{ww}" height="4" rx="2" fill="rgba(238,248,239,.22)"/>'
    s.d(f'<linearGradient id="scan" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="{LIME}" stop-opacity=".55"/><stop offset="1" stop-color="{LIME}" stop-opacity="0"/></linearGradient>')
    o += (f'<g><animateTransform attributeName="transform" type="translate" values="0 0;0 74;0 0" dur="2.8s" repeatCount="indefinite" {SWAY}/>'
          f'<rect x="36" y="10" width="70" height="16" fill="url(#scan)"/><rect x="34" y="25" width="74" height="2.4" rx="1.2" fill="{LIME}"/></g>')
    for x1 in (114, 250):
        o += (f'<path d="M{x1} 65 H{x1 + 40}" stroke="{LEAF}" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round"><animate attributeName="stroke-dashoffset" from="18" to="0" dur=".9s" repeatCount="indefinite"/></path>'
              f'<path d="M{x1 + 36} 60 L{x1 + 42} 65 L{x1 + 36} 70" fill="none" stroke="{LEAF}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>')
    o += (f'<rect x="164" y="38" width="76" height="54" rx="12" fill="rgba(200,240,106,.10)" stroke="rgba(200,240,106,.55)"/>'
          f'<rect x="164" y="38" width="76" height="54" rx="12" fill="none" stroke="{LIME}"><animate attributeName="opacity" values=".9;0;.9" dur="1.8s" repeatCount="indefinite"/></rect>')
    o += s.t(202, 63, 'VLM', 'MB', 15, LIME, 'middle') + s.t(202, 80, 'ocr + vision', 'M', 9.5, SOFT, 'middle')
    for r in range(5):
        for c in range(4):
            x, y = 298 + c * 22, 26 + r * 17
            base = f'<rect x="{x}" y="{y}" width="19" height="13" rx="3" fill="{GOLD if r == 0 else "rgba(255,255,255,.06)"}" fill-opacity="{0.75 if r == 0 else 1}"/>'
            if r:
                k = (r - 1) * 4 + c
                a = 0.05 + k * 0.04
                base += f'<rect x="{x}" y="{y}" width="19" height="13" rx="3" fill="{LEAF}" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;{a:.2f};{a + 0.05:.2f};0.9;1" dur="4.8s" repeatCount="indefinite"/></rect>'
            o += base
    o += s.t(200, 132, 'days  →  minutes', 'S', 17, LIME, 'middle')
    return o + '</g>'


def diag_orders(s):
    o = '<g transform="translate(16 16)">'
    xs = [44, 122, 200, 278, 356]
    o += f'<path d="M44 66 H356" stroke="rgba(255,255,255,.08)" stroke-width="4" stroke-linecap="round"/>'
    o += (f'<path d="M44 66 H356" stroke="{LEAF}" stroke-width="4" stroke-linecap="round" stroke-dasharray="312" stroke-dashoffset="312">'
          f'<animate attributeName="stroke-dashoffset" values="312;0;0" keyTimes="0;0.8;1" dur="4.5s" repeatCount="indefinite"/></path>')
    for i, x in enumerate(xs):
        ti = 0.8 * i / 4
        o += (f'<circle cx="{x}" cy="66" r="10" fill="#11291d" stroke="{LINE}" stroke-width="2"/>'
              f'<circle cx="{x}" cy="66" r="6" fill="{LIME}" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;{max(0, ti - 0.001):.3f};{ti + 0.02:.3f};0.96;1" dur="4.5s" repeatCount="indefinite"/></circle>')
    o += (f'<g><animateTransform attributeName="transform" type="translate" values="44 66;356 66;356 66" keyTimes="0;0.8;1" dur="4.5s" repeatCount="indefinite"/>'
          f'<circle r="7" fill="{GOLD}"/><circle r="7" fill="none" stroke="{GOLD}"><animate attributeName="r" values="7;15" dur="1.1s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;0" dur="1.1s" repeatCount="indefinite"/></circle></g>')
    o += (f'<g transform="translate(316 12)"><rect width="56" height="22" rx="11" fill="rgba(63,209,127,.14)" stroke="rgba(63,209,127,.5)"/>'
          f'<circle cx="13" cy="11" r="3.5" fill="{LEAF}"><animate attributeName="opacity" values="1;.2;1" dur="1.2s" repeatCount="indefinite"/></circle>' + s.t(22, 15, 'live', 'MB', 10.5, LEAF) + '</g>')
    for i in range(3):
        y = 96 + i * 11
        o += f'<rect x="44" y="{y}" width="{[180, 140, 160][i]}" height="5" rx="2.5" fill="rgba(255,255,255,.07)"/>'
    o += s.t(200, 132, 'one source of truth', 'S', 17, LIME, 'middle')
    return o + '</g>'


def diag_search(s):
    o = '<g transform="translate(16 16)">'
    o += f'<rect x="30" y="16" width="104" height="96" rx="12" fill="#11291d" stroke="{LINE}"/>'
    o += f'<circle cx="82" cy="70" r="22" fill="none" stroke="{GOLD}" stroke-width="3"/><path d="M74 46 L82 38 L90 46 L82 54 Z" fill="{GOLD}" fill-opacity=".85"/>'
    for (x, y, dx, dy) in ((36, 22, 1, 1), (128, 22, -1, 1), (36, 106, 1, -1), (128, 106, -1, -1)):
        o += f'<path d="M{x} {y + 10 * dy} V{y} H{x + 10 * dx}" fill="none" stroke="{LIME}" stroke-width="2" stroke-linecap="round"/>'
    o += (f'<rect x="34" y="20" width="2" height="88" fill="{LIME}" opacity=".85"><animate attributeName="x" values="34;128;34" dur="2.6s" repeatCount="indefinite" {SWAY}/></rect>')
    o += (f'<path d="M142 64 H176" stroke="{LEAF}" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round"><animate attributeName="stroke-dashoffset" from="18" to="0" dur=".9s" repeatCount="indefinite"/></path>'
          f'<path d="M172 59 L178 64 L172 69" fill="none" stroke="{LEAF}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>')
    tiles = []
    for r in range(2):
        for c in range(3):
            x, y = 192 + c * 62, 16 + r * 50
            tiles.append((x, y))
            rr = (14, 11, 16, 12, 15, 10)[r * 3 + c]
            o += f'<rect x="{x}" y="{y}" width="54" height="44" rx="8" fill="#11291d" stroke="{LINE}"/><circle cx="{x + 27}" cy="{y + 24}" r="{rr * 0.7:.1f}" fill="none" stroke="{GOLD}" stroke-opacity=".55" stroke-width="2"/>'
    seq = [0, 2, 3, 1, 4, 4, 4]
    xv = ';'.join(str(tiles[i][0] - 3) for i in seq)
    yv = ';'.join(str(tiles[i][1] - 3) for i in seq)
    o += (f'<rect width="60" height="50" rx="10" fill="none" stroke="{LIME}" stroke-width="2.4">'
          f'<animate attributeName="x" values="{xv}" dur="4.2s" calcMode="discrete" repeatCount="indefinite"/><animate attributeName="y" values="{yv}" dur="4.2s" calcMode="discrete" repeatCount="indefinite"/></rect>')
    mx, my = tiles[4]
    o += (f'<g opacity="0"><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.6;0.65;1" dur="4.2s" repeatCount="indefinite"/>'
          f'<circle cx="{mx + 52}" cy="{my + 2}" r="9" fill="{LEAF}"/><path d="M{mx + 47.5} {my + 2} L{mx + 51} {my + 5.5} L{mx + 57} {my - 1.5}" fill="none" stroke="#0a1912" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>')
    o += s.t(200, 132, 'rough photo or SKU  →  match', 'S', 17, LIME, 'middle')
    return o + '</g>'


def diag_security(s):
    o = '<g transform="translate(16 16)">'
    s.d(f'<linearGradient id="cone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{LIME}" stop-opacity=".35"/><stop offset="1" stop-color="{LIME}" stop-opacity="0"/></linearGradient>')
    o += (f'<g transform="translate(88 52)"><g><animateTransform attributeName="transform" type="rotate" values="-9;9;-9" dur="4s" repeatCount="indefinite" {SWAY}/>'
          f'<path d="M0 0 L170 -42 L170 42 Z" fill="url(#cone)"/></g></g>')
    o += (f'<rect x="38" y="38" width="50" height="28" rx="7" fill="#11291d" stroke="{SOFT}" stroke-opacity=".7" stroke-width="1.6"/>'
          f'<circle cx="80" cy="52" r="7" fill="#0a1912" stroke="{LIME}" stroke-width="2"/><circle cx="80" cy="52" r="2.5" fill="{LIME}"><animate attributeName="opacity" values="1;.3;1" dur="1.6s" repeatCount="indefinite"/></circle>'
          f'<path d="M58 66 V82 M48 82 H68" stroke="{SOFT}" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/>')
    fx, fy = 290, 62
    o += (f'<circle cx="{fx}" cy="{fy - 8}" r="17" fill="none" stroke="{CREAM}" stroke-opacity=".75" stroke-width="2"/>'
          f'<path d="M{fx - 28} {fy + 36} C{fx - 26} {fy + 14} {fx + 26} {fy + 14} {fx + 28} {fy + 36}" fill="none" stroke="{CREAM}" stroke-opacity=".75" stroke-width="2"/>')
    bx, by, bw, bh = fx - 40, fy - 38, 80, 80
    for (x, y, dx, dy) in ((bx, by, 1, 1), (bx + bw, by, -1, 1), (bx, by + bh, 1, -1), (bx + bw, by + bh, -1, -1)):
        o += f'<path d="M{x} {y + 13 * dy} V{y} H{x + 13 * dx}" fill="none" stroke="{LIME}" stroke-width="2.4" stroke-linecap="round"/>'
    o += f'<rect x="{bx + 4}" y="{by + 4}" width="{bw - 8}" height="2" fill="{LIME}" opacity=".8"><animate attributeName="y" values="{by + 4};{by + bh - 6};{by + 4}" dur="2.4s" repeatCount="indefinite" {SWAY}/></rect>'
    o += (f'<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.45;0.5;0.92;1" dur="3.6s" repeatCount="indefinite"/>'
          f'<circle cx="{bx + bw}" cy="{by}" r="10" fill="{LEAF}"/><path d="M{bx + bw - 5} {by} L{bx + bw - 1} {by + 4} L{bx + bw + 5.5} {by - 3.5}" fill="none" stroke="#0a1912" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></g>')
    o += (f'<g transform="translate(30 98)"><rect width="88" height="22" rx="11" fill="rgba(242,193,78,.12)" stroke="rgba(242,193,78,.5)"/>' + s.t(44, 15, 'NVIDIA edge', 'MB', 10, GOLD, 'middle') + '</g>')
    o += s.t(200, 132, 'compliance, verified in real time', 'S', 17, LIME, 'middle')
    return o + '</g>'


WORK = [
    ('Intelligent Document Automation', 'An OCR-to-spreadsheet pipeline pairing state-of-the-art text recognition with a locally hosted vision-language model. A multi-day manual process now runs in minutes and is used company-wide.', ['OCR', 'VLM', 'Python', 'Automation'], diag_docs, None),
    ('Enterprise Order Tracking', 'A real-time, full-stack platform spanning the whole order lifecycle. Adopted company-wide as the single source of truth for order status, ending manual cross-team coordination.', ['Full-stack', 'Real-time', 'Production'], diag_orders, None),
    ('Visual Product Search', 'Instant retrieval of gold design records from a rough photo or SKU code, orchestrating a multi-model computer-vision pipeline built for accuracy and low latency at scale.', ['Computer vision', 'Search', 'Low latency'], diag_search, None),
    ('AI Security Intelligence', 'Facial recognition plus a generative video-understanding model on NVIDIA edge hardware, verifying security-check compliance in real time. Built with an external technology firm.', ['Face recognition', 'Video AI', 'Edge'], diag_security, 'in progress'),
]


def work_pair(name, items):
    w, h, cw = 880, 372, 432
    s = Svg(w, h, ' | '.join(f'{t}: {d}' for t, d, *_ in items))
    for i, (title, desc, tags, diag, badge) in enumerate(items):
        x = i * (cw + 16)
        s += f'<g opacity="0" transform="translate({x} 0)">{fade(0.1 + i * 0.15, 14, 0.9)}'
        s += panel(s, 0, 0, cw, h, 22)
        s += f'<rect x="16" y="16" width="{cw - 32}" height="152" rx="14" fill="#08150f" stroke="{LINE}"/>'
        s += diag(s)
        s += s.t(24, 198, 'Sky Gold and Diamonds', 'M', 11, GOLD)
        if badge:
            bw_ = W('MB', badge, 10) + 22
            s += f'<rect x="{cw - 24 - bw_:.0f}" y="185" width="{bw_:.0f}" height="20" rx="10" fill="rgba(242,193,78,.14)" stroke="rgba(242,193,78,.5)"/>' + s.t(cw - 24 - bw_ / 2, 199, badge, 'MB', 10, GOLD, 'middle')
        s += s.t(24, 226, title, 'D7', 20, CREAM)
        for j, ln in enumerate(wrap(desc, 'B', 13.2, cw - 48)):
            s += s.t(24, 252 + j * 20, ln, 'B', 13.2, SOFT)
        tx = 24
        for tg in tags:
            tw_ = W('M', tg, 11) + 20
            s += f'<rect x="{tx:.0f}" y="{h - 42}" width="{tw_:.0f}" height="24" rx="12" fill="rgba(255,255,255,.03)" stroke="{LINE}"/>' + s.t(tx + 10, h - 26, tg, 'M', 11, CREAM)
            tx += tw_ + 7
        s += '</g>'
    s.save(name)


REPOS = [
    ('Culturama', 'My first full-stack project: a .NET web app promoting India\'s temple heritage, with temple info, nearby hotels and dashboards.', 'C#', '#a58fd6'),
    ('Odoo Appointment Booking', 'Multi-role appointment booking with admin panel, organizer and staff flows, and refund-safe cancellations.', 'TypeScript', LEAF),
    ('Weapon Detection', 'Real-time weapon detection with YOLOv8, reaching 90.4% mAP@0.5, with threat-level alerts for video and images.', 'Python', GOLD),
]


def repo_card(slug, name, desc, lang, col):
    w, h = 284, 198
    s = Svg(w, h, f'{name}: {desc}')
    s += panel(s, 0, 0, w, h, 20)
    s += (f'<g transform="translate(22 30)" fill="none" stroke="{LIME}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
          f'<path d="M-6 -8 H5 A2 2 0 0 1 7 -6 V8 H-4 A2 2 0 0 1 -6 6 Z"/><path d="M-6 4 H7"/></g>')
    s += s.t(40, 35, 'open source', 'M', 10.5, MUTED)
    lines = wrap(name, 'D7', 17, w - 44)
    for j, ln in enumerate(lines[:2]):
        s += s.t(22, 66 + j * 21, ln, 'D7', 17, CREAM)
    y = 66 + len(lines[:2]) * 21 + 4
    for j, ln in enumerate(wrap(desc, 'B', 12.2, w - 44)[:4]):
        s += s.t(22, y + j * 17, ln, 'B', 12.2, SOFT)
    s += f'<circle cx="28" cy="{h - 22}" r="5" fill="{col}"/>' + s.t(40, h - 18, lang, 'M', 11, CREAM)
    s += (s.t(w - 44, h - 18, 'view', 'BB', 12, LIME, 'end')
          + f'<path d="M{w - 36} {h - 22} H{w - 24} M{w - 29} {h - 27} L{w - 24} {h - 22} L{w - 29} {h - 17}" fill="none" stroke="{LIME}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
          f'<animateTransform attributeName="transform" type="translate" values="0 0;3 0;0 0" dur="1.6s" repeatCount="indefinite" {SWAY}/></path>')
    s.save(f'repo-{slug}.svg')


# ================================================================ path timeline
def path_timeline():
    w, h = 880, 292
    nodes = [
        ('2024', 'Grand Finalist', ['Smart India Hackathon,', 'Ministry of Coal.', 'NASA Space Apps', 'Global Nominee.']),
        ('2025', 'Full Stack Intern', ['Chemtron Science Labs:', 'MERN + Electron app,', '40% less manual work.', '1st, SCOE Avishkar.']),
        ('May 2026', 'B.E. Computer Science', ['Saraswati College of', 'Engineering, University', 'of Mumbai. CGPA 9.0']),
        ('Jun 2026 to now', 'AI Software Engineer', ['Sky Gold and Diamonds.', 'Sole technical owner of', 'AI and automation', 'products.']),
    ]
    s = Svg(w, h, 'The path so far. ' + ' '.join(f'{a}: {b}, ' + ' '.join(c) for a, b, c in nodes))
    s += panel(s, 0, 0, w, h, 22)
    xs = [120, 340, 560, 780]
    vy = 96
    d = f'M30 {vy}'
    pts = [30] + xs + [850]
    for i in range(1, len(pts)):
        a, b = pts[i - 1], pts[i]
        sw = 18 if i % 2 else -18
        d += f' C{a + (b - a) * 0.35:.0f} {vy + sw} {a + (b - a) * 0.65:.0f} {vy - sw} {b} {vy}'
    L = 1000
    s += f'<path d="{d}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="3" stroke-linecap="round"/>'
    s += (f'<path d="{d}" fill="none" stroke="{LEAF}" stroke-width="3" stroke-linecap="round" pathLength="{L}" stroke-dasharray="{L}" stroke-dashoffset="{L}">'
          f'<animate attributeName="stroke-dashoffset" from="{L}" to="0" begin="0.2s" dur="2.6s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.65 0 0.35 1"/></path>')
    for i, (when, title, sub) in enumerate(nodes):
        x = xs[i]
        b = 0.4 + 2.4 * (x - 30) / 820
        last = i == len(nodes) - 1
        col = GOLD if last else LIME
        s += (f'<g transform="translate({x} {vy})"><g transform="scale(0)">'
              f'<animateTransform attributeName="transform" type="scale" values="0;1.25;1" keyTimes="0;0.6;1" begin="{b:.2f}s" dur=".7s" fill="freeze"/>'
              f'<circle r="15" fill="#0a1912" stroke="{col}" stroke-width="2.4"/><g transform="translate(0 1)">{leaf(0, 0, 1.0, col)}</g></g>')
        if last:
            s += (f'<circle r="15" fill="none" stroke="{GOLD}" opacity="0"><animate attributeName="r" values="15;30" begin="{b + .8:.2f}s" dur="2s" repeatCount="indefinite"/>'
                  f'<animate attributeName="opacity" values=".8;0" begin="{b + .8:.2f}s" dur="2s" repeatCount="indefinite"/></circle>')
        s += '</g>'
        s += f'<g opacity="0">{fade(b + 0.2, 10, 0.7)}'
        s += s.t(x, 52, when, 'M', 11.5, col, 'middle')
        s += s.t(x, 146, title, 'D7', 16, CREAM, 'middle')
        for j, ln in enumerate(sub):
            s += s.t(x, 172 + j * 19, ln, 'B', 12.6, SOFT, 'middle')
        s += '</g>'
    s += s.t(w / 2, h - 22, 'growing one season at a time', 'S', 18, LIME, 'middle')
    s.save('path.svg')


# ================================================================ contact + footer
def contact():
    w, h = 880, 210
    s = Svg(w, h, 'Let us build something that thinks. AI automation, computer vision and full-stack builds.')
    s += panel(s, 0, 0, w, h, 24)
    s.d('<clipPath id="cc"><rect width="880" height="210" rx="24"/></clipPath>')
    s.d(f'<radialGradient id="g1"><stop offset="0" stop-color="{LEAF}" stop-opacity=".35"/><stop offset="1" stop-color="{LEAF}" stop-opacity="0"/></radialGradient>')
    s.d(f'<radialGradient id="g2"><stop offset="0" stop-color="{GOLD}" stop-opacity=".22"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>')
    s += (f'<g clip-path="url(#cc)"><ellipse cx="200" cy="120" rx="260" ry="120" fill="url(#g1)"><animateTransform attributeName="transform" type="translate" values="0 0;260 -10;0 0" dur="16s" repeatCount="indefinite" {SWAY}/></ellipse>'
          f'<ellipse cx="700" cy="90" rx="240" ry="110" fill="url(#g2)"><animateTransform attributeName="transform" type="translate" values="0 0;-240 20;0 0" dur="19s" repeatCount="indefinite" {SWAY}/></ellipse>')
    for i in range(7):
        x = 70 + i * 120
        dur = 9 + (i % 3) * 2
        s += (f'<g opacity=".7"><animateTransform attributeName="transform" type="translate" values="{x} 240;{x + 30 * ((-1) ** i)} -30" dur="{dur}s" begin="-{i * 1.3:.1f}s" repeatCount="indefinite"/>'
              f'<g><animateTransform attributeName="transform" type="rotate" values="0;360" dur="{dur * 0.8:.1f}s" repeatCount="indefinite"/><path d="{GINKGO}" fill="{(LIME, LEAF, GOLD)[i % 3]}" transform="scale(.8)"/></g></g>')
    s += '</g>'
    hl = 'Let’s build something that thinks.'
    hs = min(36, 36 * 790 / W('D', hl, 36))
    s += s.t(w / 2, 92, hl, 'D', round(hs, 1), CREAM, 'middle')
    s += s.t(w / 2, 130, 'AI automation, computer vision and full-stack builds, from Navi Mumbai.', 'B', 15.5, SOFT, 'middle')
    s += s.t(w / 2, 166, 'say hello below', 'S', 19, LIME, 'middle')
    s.save('contact.svg')


def footer():
    w, h = 880, 120
    s = Svg(w, h, 'Crafted in Navi Mumbai with code and chlorophyll.')
    import random
    rnd = random.Random(4)
    blades = ''
    for i in range(110):
        x = 4 + i * 8 + rnd.uniform(-2, 2)
        hh = rnd.uniform(18, 46)
        col = (LEAF, '#2c9455', MOSS, LIME)[rnd.randrange(4)]
        dur = rnd.uniform(2.6, 4.2)
        blades += (f'<path d="M{x:.1f} {h} Q{x + 2:.1f} {h - hh * 0.6:.1f} {x + rnd.uniform(-3, 5):.1f} {h - hh:.1f} Q{x + 3:.1f} {h - hh * 0.5:.1f} {x + 4:.1f} {h} Z" fill="{col}" fill-opacity=".8">'
                   f'<animateTransform attributeName="transform" type="rotate" values="-4 {x:.1f} {h};4 {x:.1f} {h};-4 {x:.1f} {h}" dur="{dur:.1f}s" begin="-{rnd.uniform(0, 3):.1f}s" repeatCount="indefinite" {SWAY}/></path>')
    s += blades
    s += s.t(w / 2, 40, 'crafted in Navi Mumbai with code and chlorophyll', 'S', 20, CREAM, 'middle')
    s.save('footer.svg')


# ================================================================ build
if __name__ == '__main__':
    from PIL import Image
    av = Image.open(os.path.join(HERE, 'avatar_cut.png')).resize((236, 236), Image.LANCZOS)
    buf = io.BytesIO(); av.save(buf, 'PNG', optimize=True)
    ab64 = base64.b64encode(buf.getvalue()).decode()
    for slug, label, kind in [('about', 'About', 'about'), ('stack', 'Stack', 'stack'), ('stats', 'Stats', 'stats'), ('work', 'Work', 'work'), ('path', 'Path', 'path'), ('contact', 'Contact', 'mail')]:
        button(f'nav-{slug}.svg', label, kind)
    button('cta-main.svg', 'Visit my main portfolio', 'globe', primary=True, size=15.5)
    button('cta-site.svg', 'Walk through the 3D leaf portfolio', 'leaf', size=15)
    button('btn-portfolio.svg', 'Main portfolio', 'globe')
    button('btn-linkedin.svg', 'LinkedIn', 'in')
    button('btn-email.svg', 'Email', 'mail')
    button('btn-site.svg', '3D leaf site', 'leaf')
    header('about', 'About', 'the person behind the pipelines')
    header('stack', 'Toolkit', 'what I reach for')
    header('stats', 'GitHub stats', 'a year in the canopy')
    header('work', 'Selected work', 'systems that replaced busywork')
    header('path', 'Path', 'how it grew')
    header('contact', 'Contact', 'come say hello')
    terminal(); about(ab64); stack(); tiles(); contrib(); insights()
    work_pair('work-a.svg', WORK[:2]); work_pair('work-b.svg', WORK[2:])
    for (n, d, l, c), slug in zip(REPOS, ('culturama', 'odoo', 'weapon')):
        repo_card(slug, n, d, l, c)
    path_timeline(); contact(); footer()
    tot = 0
    for f in sorted(os.listdir(OUT)):
        tot += os.path.getsize(os.path.join(OUT, f))
    print(len(os.listdir(OUT)), 'files', round(tot / 1024), 'KB')
