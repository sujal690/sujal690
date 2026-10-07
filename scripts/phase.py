"""Switch the whole README to the current time of day (India time): banner, card colours and accents.

Each theme keeps four complete sets in assets/<theme>/phase/<dawn|day|dusk|night>/; the current one is copied
over assets/<theme>/, which is what README.md shows. Phases: dawn 05:00-11:30 (morning), day 11:30-16:30
(afternoon), dusk 16:30-20:00 (evening), night otherwise. Run every 30 minutes by the scheduled workflow.
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
    return 'dawn' if 5 <= h < 11.5 else 'day' if 11.5 <= h < 16.5 else 'dusk' if 16.5 <= h < 20 else 'night'


if __name__ == '__main__':
    ph = sys.argv[1] if len(sys.argv) > 1 else phase()
    for theme in ('space', 'leaf'):
        src_dir = os.path.join(ROOT, 'assets', theme, 'phase', ph)
        for f in os.listdir(src_dir):
            src, dst = os.path.join(src_dir, f), os.path.join(ROOT, 'assets', theme, f)
            if not os.path.exists(dst) or not filecmp.cmp(src, dst, shallow=False):
                shutil.copyfile(src, dst)
    print(ph)
