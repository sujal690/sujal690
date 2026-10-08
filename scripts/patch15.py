g = open('gen8.py', encoding='utf-8').read()


def rep(a, b, cnt=1):
    global g
    assert g.count(a) == cnt, (a[:80], g.count(a))
    g = g.replace(a, b)


# ---------------------------------------------------------------- panel: a glowing accent edge and a light catch along the top
rep("""    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="url(#{gid})"/>' + decor(s, x, y, w, h, r, _pc[0]) +
            f'<rect x="{x + .5}" y="{y + .5}" width="{w - 1}" height="{h - 1}" rx="{r - .5}" fill="none" stroke="{HAIR}"/>' + brackets(x, y, w, h))""",
    """    k = _pc[0]
    s.d(f'<linearGradient id="bd{k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{ACC}" stop-opacity=".85"/><stop offset=".35" stop-color="#ffffff" stop-opacity=".10"/><stop offset=".7" stop-color="#ffffff" stop-opacity=".06"/><stop offset="1" stop-color="{ACC}" stop-opacity=".55"/></linearGradient>')
    s.d(f'<linearGradient id="tl{k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".30"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>')
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="url(#{gid})"/>' + decor(s, x, y, w, h, r, k) +
            f'<rect x="{x + .6}" y="{y + .6}" width="{w - 1.2}" height="{h - 1.2}" rx="{r - .6}" fill="none" stroke="url(#bd{k})" stroke-width="1.2"/>'
            f'<path d="M{x + r} {y + 1.2} H{x + w - r}" stroke="url(#tl{k})" stroke-width="1.2"/>' + brackets(x, y, w, h))""")

# ---------------------------------------------------------------- a few stars on the leaf night cards
rep("""        if w > 300:  # leaf veins fanning from the lower right corner""", """        if PHASE == 'night':  # just a sprinkling of stars
            for i in range(max(5, int(w * h / 42000))):
                px, py, rr = x + R() * w, y + R() * h * 0.6, 0.5 + R() * 0.55
                a0 = 0.30 + R() * 0.35
                if i % 3 == 0:
                    d = 3 + R() * 3
                    o += f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{rr + .15:.2f}" fill="#eef8ff" opacity="{a0:.2f}"><animate attributeName="opacity" values="{a0:.2f};{min(.9, a0 + .4):.2f};{a0:.2f}" dur="{d:.1f}s" begin="-{R() * d:.1f}s" repeatCount="indefinite"/></circle>'
                else:
                    o += f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{rr:.2f}" fill="#eef8ff" opacity="{a0:.2f}"/>'
        if w > 300:  # leaf veins fanning from the lower right corner""")

# ---------------------------------------------------------------- the activity chart with a caterpillar (Leaf) / space worm (Space) that eats the days
a = g.index("def _lift(")
b = g.index("# ================================================================ earlier projects")
ACT = r'''def _lift(hexcol, k=0.55):
    h = hexcol.lstrip('#')
    r, gg, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return '#%02x%02x%02x' % tuple(int(c + (255 - c) * k) for c in (r, gg, b))


def _crom(pts, per=7):
    """Catmull-Rom through pts; returns (polyline, index of each input point inside the polyline)."""
    out, idx = [], []
    n = len(pts)
    for i in range(n - 1):
        p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, n - 1)]
        idx.append(len(out))
        for k in range(per):
            t = k / per
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)))
    idx.append(len(out))
    out.append(pts[-1])
    return out, idx


def _critter(kind):
    """Segments of the crawler, head first: (radius, svg) in a frame facing +x."""
    segs = []
    if kind == 'leaf':
        cols = ['#9fe05c', '#76c040', '#9fe05c', '#76c040', '#9fe05c', '#76c040', '#8fd152']
        for i, c in enumerate(cols):
            r = 5.4 - i * 0.28
            segs.append((r, f'<circle r="{r:.1f}" fill="{c}" stroke="#2c5a1c" stroke-width=".9"/><circle cx="{-r * .25:.1f}" cy="{-r * .3:.1f}" r="{r * .38:.1f}" fill="#d6f6a8" opacity=".55"/><path d="M{-r * .2:.1f} {r * .55:.1f} v{r * .75:.1f} M{r * .35:.1f} {r * .5:.1f} v{r * .8:.1f}" stroke="#2c5a1c" stroke-width="1" stroke-linecap="round"/>'))
        head = (f'<circle r="6.4" fill="#f4b840" stroke="#7a4a10" stroke-width=".9"/><circle cx="-1.5" cy="-2" r="2.4" fill="#ffe08a" opacity=".6"/>'
                f'<path d="M4 -3.2 Q7 -8 10.5 -7.5 M4 3.2 Q7 8 10.5 7.5" stroke="#7a4a10" stroke-width="1" fill="none" stroke-linecap="round"/><circle cx="10.6" cy="-7.5" r="1.3" fill="#e05a3a"/><circle cx="10.6" cy="7.5" r="1.3" fill="#e05a3a"/>'
                f'<circle cx="2.4" cy="-3" r="2.1" fill="#fff"/><circle cx="2.4" cy="3" r="2.1" fill="#fff"/><circle cx="3.1" cy="-3" r="1" fill="#1a1208"/><circle cx="3.1" cy="3" r="1" fill="#1a1208"/>'
                f'<ellipse cx="5.4" cy="0" rx="1.6" ry="1.2" fill="#5a2a0c"><animateTransform attributeName="transform" type="scale" values="1 1;1 .35;1 1" dur=".28s" repeatCount="indefinite"/></ellipse>')
    else:
        for i in range(7):
            r = 5.2 - i * 0.42
            segs.append((r, f'<circle r="{r * 2.6:.1f}" fill="url(#wg)" opacity="{.85 - i * .09:.2f}"/><circle r="{r:.1f}" fill="{ACC}" opacity="{.95 - i * .08:.2f}"/><circle cx="{-r * .2:.1f}" cy="{-r * .25:.1f}" r="{r * .45:.1f}" fill="#ffffff" opacity=".8"/>'))
        head = (f'<circle r="15" fill="url(#wg)"/><circle r="6.6" fill="#ffffff"/><circle r="6.6" fill="none" stroke="{ACC}" stroke-width="1.6"/>'
                f'<path d="M1.5 -4.2 Q6.2 0 1.5 4.2" fill="{ACC}" opacity=".9"/><path d="M3 -8.5 L8 -12 M3 8.5 L8 12" stroke="{ACC}" stroke-width="1.2" stroke-linecap="round"/><circle cx="8.4" cy="-12.3" r="1.2" fill="#fff"/><circle cx="8.4" cy="12.3" r="1.2" fill="#fff"/>')
    return head, segs


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
    bandh = 7 * st + 36
    gy0 = 204
    h = int(gy0 + bandh * len(years) + 88)
    kind = 'leaf' if THEME == 'leaf' else 'space'
    s = Svg(w, h, f"GitHub activity since the first day on GitHub ({since.strftime('%b %Y')}): {S['contributions']} contributions, {S['commits']} commits, {S['repos']} repositories, {S['active_days']} active days, longest streak {S['longest_streak']} days. Best day {best.strftime('%b %d, %Y')} with {S['best_day']['count']}. "
            + ('A caterpillar crawls through every year and eats the green days, which sprout back.' if kind == 'leaf' else 'A glowing space worm sweeps through every year and collects the lit days, which light up again.'))
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
    # gradients and glows for the day squares
    for L in range(1, 5):
        s.d(f'<linearGradient id="cl{L}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{_lift(HEAT[L], .38)}"/><stop offset="1" stop-color="{HEAT[L]}"/></linearGradient>')
        s.d(f'<radialGradient id="cg{L}"><stop offset="0" stop-color="{HEAT[L]}" stop-opacity=".55"/><stop offset="1" stop-color="{HEAT[L]}" stop-opacity="0"/></radialGradient>')
    s.d(f'<radialGradient id="wg"><stop offset="0" stop-color="{ACC}" stop-opacity=".55"/><stop offset="1" stop-color="{ACC}" stop-opacity="0"/></radialGradient>')
    NCOL = 53
    WAVE = 14.0
    # ---- geometry of every active day, in the order the crawler visits them (right, then left, then right again)
    pos = {}
    order_pts = []
    for yi, y in enumerate(years):
        gy = gy0 + yi * bandh
        jan1 = dt.date(y, 1, 1)
        row = []
        for d in by[y]:
            if d['count'] <= 0:
                continue
            dd = dt.date.fromisoformat(d['date'])
            c = ((dd - jan1).days + jan1.isoweekday() % 7) // 7
            r = d['weekday']
            cx, cy = gx + c * st + cell / 2, gy + r * st + cell / 2
            pos[d['date']] = (yi, c, r, cx, cy, d['count'])
            row.append((c, r, d['date'], cx, cy))
        row.sort(key=lambda t: (t[0], t[1]))
        if yi % 2 == 1:
            row.sort(key=lambda t: (-t[0], t[1]))
        order_pts.append(row)
    route, kinds = [], []                      # kinds: date for a day, None for a bend
    for yi, row in enumerate(order_pts):
        if not row:
            continue
        if route:
            prev_y = gy0 + (yi - 1) * bandh + 3.5 * st
            this_y = gy0 + yi * bandh + 3.5 * st
            edge = gx + NCOL * st + 8 if (yi - 1) % 2 == 0 else gx - 16
            route += [(edge, prev_y), (edge, (prev_y + this_y) / 2), (edge, this_y)]
            kinds += [None, None, None]
        for c, r, ds, cx, cy in row:
            route.append((cx, cy))
            kinds.append(ds)
    poly, idx = _crom(route, 6)
    cumlen = [0.0]
    for i in range(1, len(poly)):
        cumlen.append(cumlen[-1] + math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]))
    total_len = cumlen[-1]
    START, END, CHEW, SPEED, REGROW = 1.8, 2.4, 0.26, 230.0, 5.0
    kt, kp, tarr = [0.0], [0.0], {}
    t = START
    kt.append(t); kp.append(0.0)
    prev_len = 0.0
    for i, ds in enumerate(kinds):
        L0 = cumlen[idx[i]]
        t += (L0 - prev_len) / SPEED
        prev_len = L0
        kt.append(t); kp.append(L0 / total_len)
        if ds is not None:
            tarr[ds] = t
            t += CHEW
            kt.append(t); kp.append(L0 / total_len)
    t += (total_len - prev_len) / SPEED
    kt.append(t); kp.append(1.0)
    CYC = t + END
    kt.append(CYC); kp.append(1.0)
    keyt = ';'.join(f'{x / CYC:.5f}' for x in kt)
    keyp = ';'.join(f'{x:.5f}' for x in kp)
    d_path = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in poly)
    s.d(f'<path id="crawl" d="{d_path}"/>')
    # ---- the calendar: one column at a time rides a gentle wave; active days bloom in, get eaten, and sprout back
    out = ''
    for yi, y in enumerate(years):
        gy = gy0 + yi * bandh
        jan1 = dt.date(y, 1, 1)
        s += s.t(28, gy + 20, str(y), 'H', 16, TEXT) + s.t(28, gy + 40, f'{ytot[y]}', 'BS', 13, ACC) + s.t(28, gy + 56, 'in total', 'B', 11, DIM)
        s += f'<path d="M28 {gy + 66} h34" stroke="{ACC}" stroke-width="2" stroke-linecap="round" stroke-opacity=".7"/>'
        cols = {c: [] for c in range(NCOL)}
        lastm = None
        for d in by[y]:
            dd = dt.date.fromisoformat(d['date'])
            c = ((dd - jan1).days + jan1.isoweekday() % 7) // 7
            cols[c].append(d)
            if dd.day <= 7 and d['weekday'] == 0 and dd.month != lastm:
                s += s.t(gx + c * st, gy - 7, dd.strftime('%b'), 'B', 10.5, DIM)
                lastm = dd.month
        for c in range(NCOL):
            x = gx + c * st
            tw = (yi * 1.4 + 0.5 + c / NCOL * 4.0) / WAVE
            kts = f'0;{tw:.4f};{tw + .03:.4f};{tw + .08:.4f};1'
            body = ''.join(f'<rect x="{x:.1f}" y="{gy + r * st:.1f}" width="{cell}" height="{cell}" rx="2.6" fill="{HEAT[0]}" opacity=".55"/>' for r in range(7))
            for d in cols[c]:
                if d['count'] <= 0:
                    continue
                r = d['weekday']
                L = lvl(d['count'])
                yi_, c_, r_, cx, cy, n = pos[d['date']]
                is_best = d['date'] == bestk
                begin = .5 + yi * .5 + c * .02
                te = tarr.get(d['date'], 0) + 0.12
                tr = min(te + REGROW, CYC - 1.0)
                e0, e1, r1 = te / CYC, (te + .12) / CYC, tr / CYC
                inner = f'<rect x="{-cell / 2}" y="{-cell / 2}" width="{cell}" height="{cell}" rx="2.6" fill="url(#cl{L})"><title>{d["date"]}: {d["count"]}</title></rect>'
                if L >= 3:
                    inner = f'<circle r="{cell * .95:.1f}" fill="url(#cg{L})"/>' + inner
                if kind == 'space':
                    per = 3.2 + (c * 7 + r * 3) % 9 * .55
                    inner = f'<g><animate attributeName="opacity" values="1;1;.4;1;1" keyTimes="0;.7;.78;.86;1" dur="{per:.1f}s" begin="-{(c * 5 + r * 11) % 17 * .4:.1f}s" repeatCount="indefinite"/>{inner}</g>'
                else:
                    inner = (f'<g><animateTransform attributeName="transform" type="rotate" values="-6;6;-6" dur="{3.6 + (c % 5) * .5:.1f}s" begin="-{(c * 3 + r) % 7 * .5:.1f}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"/>{inner}</g>')
                if is_best:
                    inner = f'<g><animateTransform attributeName="transform" type="scale" values="1;1.4;1" dur="2.2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"/>{inner}</g>'
                    body += f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="9" fill="none" stroke="{ACC}" stroke-width="1.3"><animate attributeName="r" values="7;17;7" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0;.9" dur="2.2s" repeatCount="indefinite"/></circle>'
                eat = (f'<g><animateTransform attributeName="transform" type="scale" values="1;1;0;0;1.3;1" keyTimes="0;{e0:.4f};{min(.998, e1):.4f};{min(.998, r1):.4f};{min(.999, r1 + .012):.4f};1" dur="{CYC:.1f}s" repeatCount="indefinite"/>{inner}</g>')
                body += f'<g transform="translate({cx:.1f} {cy:.1f})"><g><animateTransform attributeName="transform" type="scale" values="0;1.35;1" keyTimes="0;.6;1" dur=".6s" begin="{begin:.2f}s" fill="freeze"/>{eat}</g></g>'
                # a little burst where it was eaten
                body += (f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="3" fill="none" stroke="{HEAT[L] if L < 4 else ACC}" stroke-width="1.2" opacity="0"><animate attributeName="opacity" values="0;0;.9;0;0" keyTimes="0;{e0:.4f};{e0 + .0005:.4f};{min(.999, e0 + .022):.4f};1" dur="{CYC:.1f}s" repeatCount="indefinite"/>'
                         f'<animate attributeName="r" values="3;3;3;15;15" keyTimes="0;{e0:.4f};{e0 + .0005:.4f};{min(.999, e0 + .022):.4f};1" dur="{CYC:.1f}s" repeatCount="indefinite"/></circle>')
            out += f'<g><animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 -5;0 0;0 0" keyTimes="{kts}" dur="{WAVE}s" repeatCount="indefinite"/>{body}</g>'
    s += out
    # ---- the crawler: a head and a trail of segments, each following the same route a moment later
    head, segs = _critter(kind)
    LAG = 0.034
    parts = [(head, 0.0, True)] + [(sv, LAG * (i + 1), False) for i, (r, sv) in enumerate(segs)]
    for k in range(len(parts) - 1, -1, -1):          # draw the tail first so the head ends up on top
        svg, lag, is_head = parts[k]
        fade = f'values="0;1;1;0;0" keyTimes="0;{(START - .5) / CYC:.4f};{(CYC - END + .3) / CYC:.4f};{(CYC - END + .9) / CYC:.4f};1"'
        rot = ' rotate="auto"' if is_head else ''
        wig = '' if is_head else f'<animateTransform attributeName="transform" type="scale" values="1;1.22;1" dur=".5s" begin="{k * .07:.2f}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"/>'
        s += (f'<g opacity="0"><animate attributeName="opacity" {fade} dur="{CYC:.1f}s" begin="{lag:.3f}s" repeatCount="indefinite"/>'
              f'<g><animateMotion dur="{CYC:.1f}s" begin="{lag:.3f}s" repeatCount="indefinite" keyPoints="{keyp}" keyTimes="{keyt}" calcMode="linear"{rot}><mpath href="#crawl" xlink:href="#crawl"/></animateMotion>'
              f'<g>{wig}{svg}</g></g></g>')
    # ---- languages: the bar grows in segment by segment, then a soft light travels along it
    ly = gy0 + bandh * len(years) + 6
    langs = S['languages'][:6]
    x, bw = 28, w - 56
    for i, l in enumerate(langs):
        sw = max(1.5, bw * l['pct'] / 100 - 2)
        s += (f'<rect x="{x:.1f}" y="{ly}" width="0" height="7" rx="3.5" fill="{PAL[i]}"><animate attributeName="width" from="0" to="{sw:.1f}" begin="{.6 + i * .14:.2f}s" dur=".9s" fill="freeze" {EASE}/>'
              f'<animate attributeName="opacity" values="1;1;.55;1;1" keyTimes="0;{(i / len(langs)):.3f};{min(.99, i / len(langs) + .08):.3f};{min(.995, i / len(langs) + .16):.3f};1" dur="{WAVE}s" begin="2s" repeatCount="indefinite"/></rect>')
        x += bw * l['pct'] / 100
    lx = 28
    for i, l in enumerate(langs):
        lab = f"{l['name']} {l['pct']}%"
        s += f'<circle cx="{lx + 4}" cy="{ly + 27}" r="3.5" fill="{PAL[i]}"/>' + s.t(lx + 13, ly + 31.5, lab, 'B', 12.5, MUTED)
        lx += 13 + W('B', lab, 12.5) + 24
    s.save('activity.svg')


'''
g = g[:a] + ACT + g[b:]
open('gen8.py', 'w', encoding='utf-8').write(g)
print('patched')
