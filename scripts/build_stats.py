"""Fetch GitHub profile stats into stats.json (stdlib only, runs locally or in Actions)."""
import datetime as dt
import json
import os
import subprocess
import sys
import urllib.request

USER = os.environ.get('PROFILE_USER', 'sujal690')
OUT = sys.argv[1] if len(sys.argv) > 1 else 'stats.json'

BASE_Q = '''query($login:String!){ user(login:$login){
  name login createdAt followers{totalCount} following{totalCount}
  contributionsCollection{ contributionYears }
  repositories(ownerAffiliations:OWNER, first:100, orderBy:{field:PUSHED_AT, direction:DESC}){ totalCount
    nodes{ name isPrivate isFork stargazerCount forkCount pushedAt languages(first:8, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name color } } } } }
}}'''

RANGE_Q = '''query($login:String!, $from:DateTime!, $to:DateTime!){ user(login:$login){
  contributionsCollection(from:$from, to:$to){
    totalCommitContributions restrictedContributionsCount totalPullRequestContributions totalIssueContributions
    totalPullRequestReviewContributions totalRepositoriesWithContributedCommits
    contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount weekday } } }
  }
}}'''


def token():
    for k in ('GH_TOKEN', 'GITHUB_TOKEN'):
        if os.environ.get(k):
            return os.environ[k]
    return subprocess.check_output(['gh', 'auth', 'token'], text=True).strip()


def gql(query, variables=None):
    req = urllib.request.Request('https://api.github.com/graphql', data=json.dumps({'query': query, 'variables': variables or {}}).encode(),
                                 headers={'Authorization': f'bearer {token()}', 'Content-Type': 'application/json', 'User-Agent': 'profile-stats'})
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.load(r)
    if 'errors' in d:
        raise SystemExit(d['errors'])
    return d['data']


def year_range(year, today):
    start = dt.date(year, 1, 1)
    end = min(dt.date(year, 12, 31), today)
    return start, end


def iso_start(d):
    return f'{d.isoformat()}T00:00:00Z'


def iso_end(d):
    return f'{d.isoformat()}T23:59:59Z'


def flatten_days(cc):
    return [d for w in cc['contributionCalendar']['weeks'] for d in w['contributionDays']]


def merge_days(day_lists):
    by_date = {}
    for days in day_lists:
        for d in days:
            cur = by_date.get(d['date'])
            if cur is None or d['contributionCount'] > cur['count']:
                by_date[d['date']] = {'date': d['date'], 'count': d['contributionCount'], 'weekday': d['weekday']}
    return [by_date[k] for k in sorted(by_date)]


def streaks(counts):
    longest = run = 0
    for c in counts:
        run = run + 1 if c else 0
        longest = max(longest, run)
    cur = 0
    for i, c in enumerate(reversed(counts)):
        if c:
            cur += 1
        elif i == 0:
            continue  # today may not have activity yet
        else:
            break
    return longest, cur


def summarize_calendar(days):
    counts = [d['count'] for d in days]
    months = {}
    weekday = [0] * 7
    for d in days:
        k = d['date'][:7]
        months[k] = months.get(k, 0) + d['count']
        weekday[d['weekday']] += d['count']
    longest, cur = streaks(counts)
    best = max(days, key=lambda d: d['count']) if days else {'date': '', 'count': 0}
    return {
        'counts': counts,
        'months': [{'month': k, 'count': v} for k, v in sorted(months.items())],
        'weekday': weekday,
        'active_days': sum(1 for c in counts if c),
        'longest_streak': longest,
        'current_streak': cur,
        'best_day': {'date': best['date'], 'count': best['count']},
        'contributions': sum(counts),
    }


def build_stats(user):
    now_utc = dt.datetime.now(dt.timezone.utc)
    today = now_utc.date()
    u = gql(BASE_Q, {'login': user})['user']
    years = sorted(u['contributionsCollection']['contributionYears'])
    if not years:
        years = [today.year]
    earliest = dt.date(years[0], 1, 1)
    overall_cc = gql(RANGE_Q, {'login': user, 'from': iso_start(earliest), 'to': iso_end(today)})['user']['contributionsCollection']

    all_day_lists = []
    for year in years:
        y0, y1 = year_range(year, today)
        if y0 > y1:
            continue
        cc = gql(RANGE_Q, {'login': user, 'from': iso_start(y0), 'to': iso_end(y1)})['user']['contributionsCollection']
        all_day_lists.append(flatten_days(cc))
    days = merge_days(all_day_lists)
    cal = summarize_calendar(days)

    langs = {}
    repos = u['repositories']['nodes']
    for n in repos:
        if n['isFork']:
            continue
        for e in n['languages']['edges']:
            l = langs.setdefault(e['node']['name'], {'bytes': 0, 'color': e['node']['color'] or '#888888'})
            l['bytes'] += e['size']
    total_bytes = sum(v['bytes'] for v in langs.values()) or 1
    top = sorted(langs.items(), key=lambda kv: -kv[1]['bytes'])

    stats = {
        'generated': now_utc.strftime('%Y-%m-%d'),
        'user': user, 'name': u['name'], 'since': u['createdAt'][:4],
        'followers': u['followers']['totalCount'],
        'repos': u['repositories']['totalCount'],
        'public_repos': sum(1 for n in repos if not n['isPrivate']),
        'stars': sum(n['stargazerCount'] for n in repos),
        'contributions': cal['contributions'],
        'commits': overall_cc['totalCommitContributions'],
        'private_contributions': overall_cc['restrictedContributionsCount'],
        'prs': overall_cc['totalPullRequestContributions'],
        'issues': overall_cc['totalIssueContributions'],
        'reviews': overall_cc['totalPullRequestReviewContributions'],
        'repos_contributed': overall_cc['totalRepositoriesWithContributedCommits'],
        'years': years,
        'range': {'from': days[0]['date'], 'to': days[-1]['date']} if days else {'from': '', 'to': ''},
        'active_days': cal['active_days'],
        'longest_streak': cal['longest_streak'],
        'current_streak': cal['current_streak'],
        'best_day': cal['best_day'],
        'months': cal['months'],
        'weekday': cal['weekday'],
        'languages': [{'name': k, 'pct': round(v['bytes'] * 100 / total_bytes, 1), 'color': v['color']} for k, v in top[:8]],
        'calendar': days,
    }
    return stats


def main():
    stats = build_stats(USER)
    json.dump(stats, open(OUT, 'w'), indent=1)
    print(json.dumps({k: v for k, v in stats.items() if k not in ('calendar', 'months', 'languages', 'weekday')}))


if __name__ == '__main__':
    main()
