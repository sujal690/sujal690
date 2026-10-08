g = open('gen8.py', encoding='utf-8').read()


def rep(a, b, cnt=1):
    global g
    assert g.count(a) == cnt, (a[:80], g.count(a))
    g = g.replace(a, b)


# ---------------------------------------------------------------- unmistakable palettes per time of day (panel, glow, text tones)
a = g.index("PHASES = {")
b = g.index("T.update(PHASES[THEME][PHASE])")
PAL = '''PHASES = {
    'space': {
        'dawn': dict(panel='#522a58', panel2='#1f1032', acc='#ffb08a', acc2='#ffe0a8', soft='#f0d8e0', muted='#cdb0c8', dim='#a88aa6', text='#fff4f0', hair='rgba(255,220,230,.16)',
                     heat=['#2e1a3a', '#5a2c58', '#8e4468', '#e07a78', '#ffe2b8'], nebA='#ff9a7a', nebB='#9a6ae8', hz='#ffb08a', hza=.55),
        'day': dict(panel='#0f64a0', panel2='#073258', acc='#8fe6ff', acc2='#ffe08a', soft='#dcf0fb', muted='#a8d0ea', dim='#7eb0d2', text='#f4fbff', hair='rgba(220,244,255,.20)',
                    heat=['#0d3c62', '#12608f', '#1f8cc4', '#52c8f4', '#e2faff'], nebA='#7fe0ff', nebB='#40e8d0', hz='#a0ecff', hza=.55),
        'dusk': dict(panel='#62214e', panel2='#26102e', acc='#ff9a6a', acc2='#e0b0ff', soft='#f4d8e4', muted='#d2a8c4', dim='#ac84a4', text='#fff2ee', hair='rgba(255,210,220,.16)',
                     heat=['#3a1838', '#6a2656', '#a03a60', '#ee6a5c', '#ffcc8a'], nebA='#ff5a7a', nebB='#b050e8', hz='#ff9a50', hza=.6),
        'night': dict(panel='#0a1236', panel2='#03060f', acc='#7fdcff', acc2='#f0b264', soft='#c2cde0', muted='#8a96b4', dim='#5d6a88', text='#eaf0fa', hair='rgba(200,220,255,.10)',
                      heat=['#121a30', '#16345a', '#1d62a0', '#3aa6e8', '#c4efff'], nebA='#4f7fd0', nebB='#8a5ad0', hz='#2f55b8', hza=.4),
    },
    'leaf': {
        'dawn': dict(panel='#4e302c', panel2='#231411', acc='#ffa985', acc2='#c4e6a0', soft='#f0dcd2', muted='#c4a89c', dim='#9c8478', text='#fff3ec', hair='rgba(255,226,210,.16)',
                     heat=['#33231f', '#5a4a30', '#86a04a', '#c4e07e', '#ffb590'], nebA='#ffb08a', nebB='#b4dc8a', hz='#ffc7a0', hza=.55),
        'day': dict(panel='#1f7040', panel2='#0d3a1f', acc='#ffe066', acc2='#b4f088', soft='#e0f6dc', muted='#a8d8a4', dim='#78b074', text='#f6fff2', hair='rgba(220,255,210,.18)',
                    heat=['#174a2a', '#2a8a3e', '#46b448', '#92e070', '#ffe066'], nebA='#f4e060', nebB='#6fe05a', hz='#c4f48a', hza=.55),
        'dusk': dict(panel='#62301a', panel2='#2a1209', acc='#ffa05a', acc2='#ffd08a', soft='#f6dcc6', muted='#d0a888', dim='#a88060', text='#fff4ea', hair='rgba(255,220,190,.16)',
                     heat=['#371f14', '#643c1e', '#9a6228', '#e0963c', '#ffb060'], nebA='#ff8a4a', nebB='#e0705a', hz='#ff8a3a', hza=.6),
        'night': dict(panel='#0f3646', panel2='#05141c', acc='#e4ee7a', acc2='#8fd0ee', soft='#c8dce0', muted='#8aacb4', dim='#5e808a', text='#eef6f6', hair='rgba(190,230,240,.12)',
                      heat=['#10242e', '#1c5048', '#2a8468', '#58c488', '#e4ee7a'], nebA='#8fd0ff', nebB='#5fb090', hz='#2c8a9a', hza=.45),
    },
}
'''
g = g[:a] + PAL + g[b:]
rep("NEB_A, NEB_B, HZ = T['nebA'], T['nebB'], T['hz']", "NEB_A, NEB_B, HZ, HZA = T['nebA'], T['nebB'], T['hz'], T['hza']")
rep('stop-color="{HZ}" stop-opacity=".30"/><stop offset="1" stop-color="{HZ}" stop-opacity="0"/>', 'stop-color="{HZ}" stop-opacity="{HZA}"/><stop offset="1" stop-color="{HZ}" stop-opacity="0"/>')
rep('stop-color="{HZ}" stop-opacity=".26"/><stop offset="1" stop-color="{HZ}" stop-opacity="0"/>', 'stop-color="{HZ}" stop-opacity="{HZA}"/><stop offset="1" stop-color="{HZ}" stop-opacity="0"/>')

# ---------------------------------------------------------------- the activity chart, nothing but the chart, with better motion
a = g.index("def ladybug_shape(")
b = g.index("# ================================================================ earlier projects")
ACT = r'''def _lift(hexcol, k=0.55):
    h = hexcol.lstrip('#')
    r, gg, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return '#%02x%02x%02x' % tuple(int(c + (255 - c) * k) for c in (r, gg, b))


def activity():
    cal = S['calendar']
    cell, gap = 11.2, 3.0
    st = cell + gap
    w = 880
    gx = 88
    years = sorted({int(d['date'][:4]) for d in cal})
    by = {y: [d for d in cal if int(d['date'][:4]) == y] for y in years}
    ytot = {y: sum(d['count'] for d in by[y]) for y in years}
    best = dt.date.fromisoformat(S['best_day']['date'])
    since = dt.date.fromisoformat(S.get('since_date', cal[0]['date']))
    bandh = 7 * st + 34
    gy0 = 200
    h = int(gy0 + bandh * len(years) + 86)
    s = Svg(w, h, f"GitHub activity since the first day on GitHub ({since.strftime('%b %Y')}): {S['contributions']} contributions, {S['commits']} commits, {S['repos']} repositories, {S['active_days']} active days, longest streak {S['longest_streak']} days. Best day {best.strftime('%b %d, %Y')} with {S['best_day']['count']}. A calendar for every year; a wave runs through the columns and the busiest day glows.")
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
    lab0 = f"All time, since {since.strftime('%b %Y')}"
    s += s.t(28, 160, lab0, 'BS', 14, TEXT)
    ox = 28 + W('BS', lab0, 14) + 22
    for y in years:
        lab = f'{y}  {ytot[y]}'
        s += f'<circle cx="{ox + 3}" cy="156" r="3" fill="{ACC}" opacity="{.45 + .55 * ytot[y] / max(ytot.values()):.2f}"/>' + s.t(ox + 12, 160.5, lab, 'B', 12.5, MUTED)
        ox += 12 + W('B', lab, 12.5) + 20
    s += s.t(w - 28, 160, f"best day {best.strftime('%b %d, %Y')}, {S['best_day']['count']} contributions", 'B', 12.5, MUTED, 'end')
    nz = sorted(d['count'] for d in cal if d['count'])
    q = [nz[int(len(nz) * p)] for p in (.25, .5, .75)] if nz else [1, 2, 3]
    lvl = lambda c: 0 if c == 0 else 1 + sum(c > t for t in q)
    bestk = S['best_day']['date']
    CYC = 12.0
    NCOL = 53
    out = ''
    for yi, y in enumerate(years):
        gy = gy0 + yi * bandh
        jan1 = dt.date(y, 1, 1)
        s += s.t(28, gy + 20, str(y), 'H', 16, TEXT) + s.t(28, gy + 40, f'{ytot[y]}', 'BS', 13, ACC) + s.t(28, gy + 56, 'in total', 'B', 11, DIM)
        # group the active days by column so each column can ride the wave as one piece
        cols = {c: [] for c in range(NCOL)}
        lastm = None
        for d in by[y]:
            dd = dt.date.fromisoformat(d['date'])
            c = ((dd - jan1).days + jan1.isoweekday() % 7) // 7
            cols[c].append((d, dd))
            if dd.day <= 7 and d['weekday'] == 0 and dd.month != lastm:
                s += s.t(gx + c * st, gy - 7, dd.strftime('%b'), 'B', 10.5, DIM)
                lastm = dd.month
        for c in range(NCOL):
            x = gx + c * st
            tw = (yi * 1.2 + 0.5 + c / NCOL * 3.2) / CYC            # when the crest reaches this column
            kts = f'0;{tw:.4f};{tw + .028:.4f};{tw + .07:.4f};1'
            body = ''.join(f'<rect x="{x:.1f}" y="{gy + r * st:.1f}" width="{cell}" height="{cell}" rx="2.6" fill="{HEAT[0]}" opacity=".5"/>' for r in range(7))
            for d, dd in cols[c]:
                r = d['weekday']
                L = lvl(d['count'])
                cx, cy = x + cell / 2, gy + r * st + cell / 2
                is_best = d['date'] == bestk
                begin = .5 + yi * .5 + c * .02
                hi = _lift(HEAT[L], .6)
                inner = f'<rect x="{-cell / 2}" y="{-cell / 2}" width="{cell}" height="{cell}" rx="2.6" fill="{HEAT[L]}"><title>{d["date"]}: {d["count"]}</title>'
                inner += f'<animate attributeName="fill" values="{HEAT[L]};{HEAT[L]};{hi};{HEAT[L]};{HEAT[L]}" keyTimes="{kts}" dur="{CYC}s" repeatCount="indefinite"/>'
                if THEME == 'space' and d['count'] > 0:   # stars blink now and then
                    per = 3.2 + (c * 7 + r * 3) % 9 * .55
                    inner += f'<animate attributeName="opacity" values="1;1;.35;1;1" keyTimes="0;.7;.78;.86;1" dur="{per:.1f}s" begin="-{(c * 5 + r * 11) % 17 * .4:.1f}s" repeatCount="indefinite"/>'
                inner += '</rect>'
                node = inner
                if THEME == 'leaf':                       # leaves sway in the breeze
                    node = (f'<g><animateTransform attributeName="transform" type="rotate" values="-7;7;-7" dur="{3.6 + (c % 5) * .5:.1f}s" begin="-{(c * 3 + r) % 7 * .5:.1f}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"/>' + inner + '</g>')
                if is_best:                               # the busiest day breathes with a halo
                    node = (f'<g><animateTransform attributeName="transform" type="scale" values="1;1.45;1" dur="2.2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"/>' + node + '</g>')
                    body += f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="9" fill="none" stroke="{ACC}" stroke-width="1.3"><animate attributeName="r" values="7;17;7" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0;.9" dur="2.2s" repeatCount="indefinite"/></circle>'
                body += (f'<g transform="translate({cx:.1f} {cy:.1f})"><g><animateTransform attributeName="transform" type="scale" values="0;1.35;1" keyTimes="0;.6;1" dur=".6s" begin="{begin:.2f}s" fill="freeze"/>{node}</g></g>')
            out += (f'<g><animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 -6;0 0;0 0" keyTimes="{kts}" dur="{CYC}s" repeatCount="indefinite"/>{body}</g>')
    s += out
    # languages: the bar grows in segment by segment, then a soft light travels along it
    ly = gy0 + bandh * len(years) + 4
    langs = S['languages'][:6]
    x, bw = 28, w - 56
    for i, l in enumerate(langs):
        sw = max(1.5, bw * l['pct'] / 100 - 2)
        s += (f'<rect x="{x:.1f}" y="{ly}" width="0" height="6" rx="3" fill="{PAL[i]}"><animate attributeName="width" from="0" to="{sw:.1f}" begin="{.6 + i * .14:.2f}s" dur=".9s" fill="freeze" {EASE}/>'
              f'<animate attributeName="opacity" values="1;1;.55;1;1" keyTimes="0;{(i / len(langs)):.3f};{min(.99, i / len(langs) + .08):.3f};{min(.995, i / len(langs) + .16):.3f};1" dur="{CYC}s" begin="2s" repeatCount="indefinite"/></rect>')
        x += bw * l['pct'] / 100
    lx = 28
    for i, l in enumerate(langs):
        lab = f"{l['name']} {l['pct']}%"
        s += f'<circle cx="{lx + 4}" cy="{ly + 26}" r="3.5" fill="{PAL[i]}"/>' + s.t(lx + 13, ly + 30.5, lab, 'B', 12.5, MUTED)
        lx += 13 + W('B', lab, 12.5) + 24
    s.save('activity.svg')


'''
g = g[:a] + ACT + g[b:]
open('gen8.py', 'w', encoding='utf-8').write(g)
print('patched')
