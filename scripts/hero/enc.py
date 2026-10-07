import sys, glob, os
from PIL import Image
src, out, fps, q = sys.argv[1], sys.argv[2], float(sys.argv[3]), int(sys.argv[4])
method = int(sys.argv[5]) if len(sys.argv) > 5 else 4
files = sorted(glob.glob(os.path.join(src, 'f*.png')))
fr = [Image.open(f).convert('RGB') for f in files]
fr[0].save(out, save_all=True, append_images=fr[1:], duration=int(round(1000 / fps)), loop=0, quality=q, method=method, minimize_size=False, allow_mixed=False)
print(out, len(fr), round(os.path.getsize(out) / 1e6, 2), 'MB')
