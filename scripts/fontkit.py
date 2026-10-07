import base64, io, os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

FD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts')
SPEC = {
    'Syne600':  ('Syne[wght].ttf', {'wght': 600}),
    'Man400':   ('Manrope[wght].ttf', {'wght': 400}),
    'Man600':   ('Manrope[wght].ttf', {'wght': 600}),
    'Syne800':  ('Syne[wght].ttf', {'wght': 800}),
    'Syne700':  ('Syne[wght].ttf', {'wght': 700}),
    'Man500':   ('Manrope[wght].ttf', {'wght': 500}),
    'Man700':   ('Manrope[wght].ttf', {'wght': 700}),
    'Mono500':  ('JetBrainsMono[wght].ttf', {'wght': 500}),
    'Mono700':  ('JetBrainsMono[wght].ttf', {'wght': 700}),
    'InstrSerif': ('InstrumentSerif-Italic.ttf', None),
    'Orb600':   ('Orbitron[wght].ttf', {'wght': 600}),
    'Out300':   ('Outfit[wght].ttf', {'wght': 300}),
    'Out400':   ('Outfit[wght].ttf', {'wght': 400}),
    'Out500':   ('Outfit[wght].ttf', {'wght': 500}),
    'Out600':   ('Outfit[wght].ttf', {'wght': 600}),
    'Out700':   ('Outfit[wght].ttf', {'wght': 700}),
    'Orb700':   ('Orbitron[wght].ttf', {'wght': 700}),
    'Orb800':   ('Orbitron[wght].ttf', {'wght': 800}),
    'Geist400': ('Geist[wght].ttf', {'wght': 400}),
    'Geist500': ('Geist[wght].ttf', {'wght': 500}),
    'Geist600': ('Geist[wght].ttf', {'wght': 600}),
    'GMono400': ('GeistMono[wght].ttf', {'wght': 400}),
    'GMono500': ('GeistMono[wght].ttf', {'wght': 500}),
}
_cache = {}

def _instance(key):
    if key not in _cache:
        fn, loc = SPEC[key]
        f = TTFont(os.path.join(FD, fn))
        if loc:
            f = instancer.instantiateVariableFont(f, loc)
        buf = io.BytesIO(); f.save(buf); _cache[key] = buf.getvalue()
    return _cache[key]

def face(key, text):
    """Return an @font-face rule embedding `key` subset to `text` as woff2."""
    f = TTFont(io.BytesIO(_instance(key)))
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['kern', 'liga']; opts.name_IDs = []; opts.notdef_outline = True
    s = subset.Subsetter(opts); s.populate(text=''.join(sorted(set(text + ' ')))); s.subset(f)
    buf = io.BytesIO(); f.flavor = 'woff2'; f.save(buf)
    b = base64.b64encode(buf.getvalue()).decode()
    return f"@font-face{{font-family:'{key}';src:url(data:font/woff2;base64,{b}) format('woff2')}}"

if __name__ == '__main__':
    r = face('Syne800', 'Sujal Shah'); print(len(r), 'bytes for Syne800 subset')

_metrics = {}
def width(key, text, size):
    """Advance width of `text` in px for font `key` at `size` (no kerning)."""
    if key not in _metrics:
        f = TTFont(io.BytesIO(_instance(key)))
        cmap = f.getBestCmap(); hmtx = f['hmtx']; upm = f['head'].unitsPerEm
        _metrics[key] = (cmap, hmtx, upm)
    cmap, hmtx, upm = _metrics[key]
    tot = 0
    for ch in text:
        g = cmap.get(ord(ch))
        tot += hmtx[g][0] if g else upm * 0.5
    return tot * size / upm
