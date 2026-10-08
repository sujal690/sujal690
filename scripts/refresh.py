"""One idempotent refresh, safe to run as often as you like (the scheduled workflow runs it every 10 minutes).

1. Switch the whole README to the edition for the current time of day in India (scripts/phase.py).
2. Rebuild the all-time stats and every edition of every card when the stats are older than STALE_HOURS (or with --force).
   A failure here (API hiccup, rate limit) never breaks the run: the previous cards stay in place and the next run tries again.
3. Touch docs/heartbeat.txt once a day so the repository always shows recent activity (GitHub pauses scheduled workflows after 60 quiet days).

Usage: python scripts/refresh.py [--force]
"""
import datetime as dt
import json
import os
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
STALE_HOURS = 5
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import phase as PH  # noqa: E402


def run(*cmd):
    print('+', ' '.join(cmd), flush=True)
    return subprocess.run(cmd, cwd=ROOT, text=True).returncode


def stats_age_hours():
    try:
        t = json.load(open(os.path.join(ROOT, 'docs', 'stats.json'))).get('refreshed_at')
        return (dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(t.replace('Z', '+00:00'))).total_seconds() / 3600
    except Exception:
        return 1e9


def main():
    force = '--force' in sys.argv
    ph = PH.phase()
    subprocess.run([sys.executable, os.path.join('scripts', 'phase.py'), ph], cwd=ROOT)
    if force or stats_age_hours() > STALE_HOURS:
        stats = os.path.join('docs', 'stats.json')
        backup = open(os.path.join(ROOT, stats), 'rb').read() if os.path.exists(os.path.join(ROOT, stats)) else None
        if run(sys.executable, os.path.join('scripts', 'build_stats.py'), stats) != 0:
            print('stats refresh failed; keeping the previous numbers, will retry on the next run')
            if backup is not None:
                open(os.path.join(ROOT, stats), 'wb').write(backup)
        else:
            ok = True
            for theme in ('space', 'leaf'):
                for p in ('dawn', 'day', 'dusk', 'night'):
                    if run(sys.executable, os.path.join('scripts', 'gen8.py'), theme, stats, os.path.join('assets', theme, 'phase', p), os.path.join('scripts', 'thumbs'), p) != 0:
                        ok = False
            print('cards rebuilt' if ok else 'some cards failed to rebuild; the others are updated')
            subprocess.run([sys.executable, os.path.join('scripts', 'phase.py'), ph], cwd=ROOT)
    beat = os.path.join(ROOT, 'docs', 'heartbeat.txt')
    today = dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%d')
    if not os.path.exists(beat) or open(beat).read().strip() != today:
        open(beat, 'w').write(today + '\n')
    print('edition:', ph)


if __name__ == '__main__':
    main()
