"""The profile's clock: makes the README follow the time of day without depending on GitHub's cron.

GitHub's `schedule` trigger is best effort and, for this repository, has never fired. `workflow_dispatch` is different: a run started
with the workflow's own GITHUB_TOKEN may start another workflow. So this job stays alive, tells "Refresh profile" to run at the exact
minute each edition changes (and every SAFETY_MIN minutes in between), and then starts a fresh copy of itself just before the six hour
job limit. Every run of "Refresh profile" and a watchdog schedule restart the clock if it ever dies, so it heals itself.

Only one clock keeps running: a clock that starts while an older one is alive stands down, except a hand-over (workflow_dispatch),
which waits for its predecessor to finish.

Usage (in Actions): python scripts/clock.py        Test locally: python scripts/clock.py --selftest
"""
import datetime as dt
import json
import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import phase as PH  # noqa: E402

LIFETIME_MIN = float(os.environ.get('CLOCK_MINUTES', 340))  # hand over before GitHub's 360 minute job limit
SAFETY_MIN = 30        # refresh at least this often, in case an edition change was missed
EDGE_SEC = 10          # wake this long after an edition changes
HANDOVER_WAIT_SEC = 6 * 60
ACTIVE = ('queued', 'in_progress', 'waiting', 'pending', 'requested')


def next_change(now):
    """The next minute at which phase.phase() returns a different edition (so the boundaries live in one place only)."""
    cur, t = PH.phase(now), now.replace(second=0, microsecond=0)
    for _ in range(24 * 60 + 1):
        t += dt.timedelta(minutes=1)
        if PH.phase(t) != cur:
            return t
    return now + dt.timedelta(hours=24)


def next_wake(now):
    return min(next_change(now) + dt.timedelta(seconds=EDGE_SEC), now + dt.timedelta(minutes=SAFETY_MIN))


def now_ist():
    return dt.datetime.fromtimestamp(time.time(), PH.IST)


def gh(*args):
    r = subprocess.run(('gh',) + args, capture_output=True, text=True)
    return r.returncode, (r.stdout or '') + (r.stderr or '')


def dispatch(workflow, tries=4):
    for i in range(tries):
        code, out = gh('workflow', 'run', workflow, '--ref', 'main')
        if code == 0:
            print(f'dispatched {workflow}', flush=True)
            return True
        print(f'dispatch {workflow} failed ({out.strip()[:200]}); retry {i + 1}', flush=True)
        time.sleep(5 * (i + 1))
    return False


def older_active():
    """Clock runs older than this one that are still alive."""
    repo, me = os.environ.get('GITHUB_REPOSITORY', ''), int(os.environ.get('GITHUB_RUN_ID', '0') or 0)
    code, out = gh('api', f'repos/{repo}/actions/workflows/clock.yml/runs?per_page=30')
    if code != 0:
        print('could not list clock runs:', out.strip()[:200], flush=True)
        return 0
    try:
        runs = json.loads(out)['workflow_runs']
    except Exception:
        return 0
    return sum(1 for r in runs if r['id'] < me and r['status'] in ACTIVE)


def my_turn(event):
    n = older_active()
    if n == 0:
        return True
    if event != 'workflow_dispatch':
        print('another clock is already running; standing down', flush=True)
        return False
    deadline = time.time() + HANDOVER_WAIT_SEC       # a hand-over: the previous clock is just finishing
    while time.time() < deadline:
        time.sleep(10)
        if older_active() == 0:
            return True
    print('the previous clock did not finish; standing down', flush=True)
    return False


def main():
    if not my_turn(os.environ.get('GITHUB_EVENT_NAME', '')):
        return
    end = time.time() + LIFETIME_MIN * 60
    dispatch('profile.yml')   # right away: every start of the clock also corrects the edition
    while True:
        now = now_ist()
        wake = next_wake(now)
        target = time.time() + (wake - now).total_seconds()
        if target >= end:
            break
        print(f'next refresh at {wake:%H:%M:%S} IST ({PH.phase(now)} now)', flush=True)
        while time.time() < target:
            time.sleep(min(30, max(0.0, target - time.time())))
        dispatch('profile.yml')
    print('handing over to a fresh clock', flush=True)
    dispatch('clock.yml')


def selftest():
    ist = PH.IST
    def at(h, m=0, s=0): return dt.datetime(2026, 10, 8, h, m, s, tzinfo=ist)
    assert next_change(at(11, 51)) == at(12), next_change(at(11, 51))
    assert next_change(at(12)) == at(16, 30)
    assert next_change(at(16, 30)) == at(20)
    assert next_change(at(21)) == at(5) + dt.timedelta(days=1)
    assert next_change(at(3)) == at(5)
    assert next_wake(at(11, 51)) == at(12, 0, EDGE_SEC)                       # the edition change wins over the safety tick
    assert next_wake(at(13)) == at(13, 30)                                    # otherwise the safety tick
    assert next_wake(at(19, 45)) == at(20, 0, EDGE_SEC)
    assert next_wake(at(23, 50)) == at(23, 50) + dt.timedelta(minutes=30)
    print('selftest ok')


if __name__ == '__main__':
    selftest() if '--selftest' in sys.argv else main()
