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
                  F={'H': 'Geist600', 'B': 'Geist400', 'BM': 'Geist500', 'BS': 'Geist600', 'M': 'GMono400'}),
    'leaf': dict(panel='#141b16', panel2='#101511', text='#efede4', soft='#cfd2c2', muted='#99a28d', dim='#68715b',
                 acc='#d79a5b', acc2='#a3bd8a', hair='rgba(239,237,228,.08)',
                 heat=['#1b231c', '#2d4527', '#4b6e37', '#80a04f', '#dcae63'],
                 pal=['#d79a5b', '#a3bd8a', '#c9b98a', '#7f9c6a', '#b59a7a', '#6b7562'],
                 F={'H': 'Out600', 'B': 'Out400', 'BM': 'Out500', 'BS': 'Out600', 'M': 'GMono400'}),
}[THEME]
P1, P2, TEXT, SOFT, MUTED, DIM, ACC, ACC2, HAIR, HEAT, PAL = (T[k] for k in ('panel', 'panel2', 'text', 'soft', 'muted', 'dim', 'acc', 'acc2', 'hair', 'heat', 'pal'))
F = T['F']
# the shared Svg class looks fonts up through G.F; map our roles plus the diagram roles gen3 uses
G.F = {**F, 'D': F['H'], 'D7': F['H'], 'BB': F['BS'], 'MB': F['BM'], 'S': F['BM'], 'M': F['B']}
G.LEAF, G.LIME, G.GOLD, G.MOSS = ACC2 if THEME == 'leaf' else ACC, ACC, T['acc2'] if THEME == 'space' else ACC, MUTED
G.CREAM, G.SOFT, G.MUTED, G.LINE = TEXT, SOFT, MUTED, HAIR
Svg, W, wrap, fade, EASE, SWAY = G.Svg, G.W, G.wrap, G.fade, G.EASE, G.SWAY


def panel(s, x, y, w, h, r=16, gid='pg'):
    if not any(f'id="{gid}"' in d for d in s.defs):
        s.d(f'<linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{P1}"/><stop offset="1" stop-color="{P2}"/></linearGradient>')
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="url(#{gid})"/>'
            f'<rect x="{x + .5}" y="{y + .5}" width="{w - 1}" height="{h - 1}" rx="{r - .5}" fill="none" stroke="{HAIR}"/>')


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
        s += f'<rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" rx="{h / 2 - .5}" fill="{ACC}"/>'
        tc = '#10141a' if THEME == 'space' else '#1a140c'
    else:
        s += f'<rect x=".75" y=".75" width="{w - 1.5}" height="{h - 1.5}" rx="{h / 2 - .75}" fill="{P1}" stroke="rgba(255,255,255,.14)" stroke-width="1.2"/>'
        tc = TEXT
    s += s.t(24, 27.5, label, 'BS', 14.5, tc)
    ax = w - 22
    s += f'<path d="M{ax - 5} 26 L{ax + 1} 20 M{ax - 3.5} 20 H{ax + 1} V24.5" fill="none" stroke="{tc}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
    s.save(name)


def header(slug, title):
    w, h = 880, 44
    s = Svg(w, h, title)
    s += s.t(2, 28, title, 'H', 21, TEXT)
    lx = 2 + W('H', title, 21) + 18
    s += f'<path d="M{lx:.0f} 21 H{w - 2}" stroke="{HAIR}"/>'
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


def activity():
    cal = S['calendar']
    first = dt.date.fromisoformat(cal[0]['date'])
    cell, gap = 11.4, 3.2
    st = cell + gap
    w = 880
    gx, gy = 60, 182
    h = int(gy + 7 * st + 76)
    best = dt.date.fromisoformat(S['best_day']['date'])
    s = Svg(w, h, f"GitHub activity, last 12 months: {S['contributions']} contributions, {S['commits']} commits, {S['repos']} repositories, {S['active_days']} active days, longest streak {S['longest_streak']} days. Best day {best.strftime('%b %d')} with {S['best_day']['count']}.")
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
    CYC = 10.0
    cells, lastm, ncol = '', None, 0
    rows = []
    for d in cal:
        dd = dt.date.fromisoformat(d['date'])
        col = ((dd - first).days + first.isoweekday() % 7) // 7
        ncol = max(ncol, col + 1)
        rows.append((col, d['weekday'], d['count'], d['date'], dd))
    for c, r, n, ds, dd in rows:
        x, y = gx + c * st, gy + r * st
        L = lvl(n)
        anim = ''
        if L:  # a soft light passes over active days once per cycle, left to right
            t = min(.9, c / ncol * .55)
            hi = '#e9f3fa' if THEME == 'space' else '#f3dfb6'
            anim = f'<animate attributeName="fill" values="{HEAT[L]};{HEAT[L]};{hi};{HEAT[L]};{HEAT[L]}" keyTimes="0;{t:.3f};{t + .025:.3f};{t + .1:.3f};1" dur="{CYC}s" begin="1.6s" repeatCount="indefinite"/>'
        cells += f'<rect x="{x:.1f}" y="{y:.1f}" width="{cell}" height="{cell}" rx="2.6" fill="{HEAT[L]}"><title>{ds}: {n}</title>{anim}</rect>'
        if dd.day <= 7 and r == 0 and dd.month != lastm and c < ncol - 2:
            s += s.t(x, gy - 10, dd.strftime('%b'), 'B', 11, DIM)
            lastm = dd.month
    gw = ncol * st
    s.d(f'<clipPath id="rv"><rect x="{gx - 4}" y="{gy - 4}" width="0" height="{7 * st + 8}"><animate attributeName="width" from="0" to="{gw + 8:.0f}" begin=".5s" dur="1.6s" fill="freeze" {EASE}/></rect></clipPath>')
    s += f'<g clip-path="url(#rv)">{cells}</g>'
    for r, lab in ((1, 'Mon'), (3, 'Wed'), (5, 'Fri')):
        s += s.t(28, gy + r * st + 9.5, lab, 'B', 11, DIM)
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
    for slug, title in [('about', 'About'), ('build', 'How I build'), ('activity', 'Activity'), ('work', 'Selected work'), ('earlier', 'Earlier projects'), ('experience', 'Experience'), ('contact', 'Contact')]:
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
    experience(); contact()
    print(THEME, len(os.listdir(OUT)), 'files', sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024, 'KB')
