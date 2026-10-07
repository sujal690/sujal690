"""Pick the README banner for the current time of day (India time) and copy it over hero.webp in both themes.

Phases: dawn (morning, 05:00-11:30), day (afternoon, 11:30-16:30), dusk (evening, 16:30-20:00), night (otherwise).
Run by the scheduled workflow every 30 minutes; prints the chosen phase.
"""
import datetime as dt
import filecmp
import os
import shutil
import sys

IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')


def phase(now=None):
    now = now or dt.datetime.now(IST)
    h = now.hour + now.minute / 60
    return 'dawn' if 5 <= h < 11.5 else 'day' if h < 16.5 and h >= 11.5 else 'dusk' if 16.5 <= h < 20 else 'night'


if __name__ == '__main__':
    ph = sys.argv[1] if len(sys.argv) > 1 else phase()
    for theme in ('space', 'leaf'):
        src, dst = (os.path.join(ROOT, 'assets', theme, f) for f in (f'hero-{ph}.webp', 'hero.webp'))
        if not os.path.exists(dst) or not filecmp.cmp(src, dst, shallow=False):
            shutil.copyfile(src, dst)
    print(ph)
