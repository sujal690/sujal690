"""Fetch GitHub profile stats into stats.json (stdlib only, runs locally or in Actions)."""
import datetime as dt
import json
import os
import subprocess
import sys
import urllib.request

USER = os.environ.get('PROFILE_USER', 'sujal690')
OUT = sys.argv[1] if len(sys.argv) > 1 else 'stats.json'


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


Q_USER = '''query($login:String!){ user(login:$login){
  name login createdAt followers{totalCount} following{totalCount}
  contributionsCollection{ contributionYears }
  repositories(ownerAffiliations:OWNER, first:100, orderBy:{field:PUSHED_AT, direction:DESC}){ totalCount
    nodes{ name isPrivate isFork stargazerCount forkCount pushedAt languages(first:8, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name color } } } } }
}}'''
Q_YEAR = '''query($login:String!,$from:DateTime!,$to:DateTime!){ user(login:$login){
  contributionsCollection(from:$from, to:$to){ totalCommitContributions restrictedContributionsCount totalPullRequestContributions totalIssueContributions
    totalPullRequestReviewContributions
    commitContributionsByRepository(maxRepositories:100){ repository{ nameWithOwner } contributions{ totalCount } }
    contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount weekday } } } }
}}'''

u = gql(Q_USER, {'login': USER})['user']
now = dt.datetime.now(dt.timezone.utc)
since = u['createdAt'][:10]
years = sorted(u['contributionsCollection']['contributionYears'])

# every contribution year from the first day on GitHub to today
by_year, days, repos_seen = [], {}, set()
tot = dict(contributions=0, commits=0, private=0, prs=0, issues=0, reviews=0)
for y in years:
    to = min(dt.datetime(y, 12, 31, 23, 59, 59, tzinfo=dt.timezone.utc), now)
    c = gql(Q_YEAR, {'login': USER, 'from': f'{y}-01-01T00:00:00Z', 'to': to.strftime('%Y-%m-%dT%H:%M:%SZ')})['user']['contributionsCollection']
    cal = c['contributionCalendar']
    by_year.append({'year': y, 'total': cal['totalContributions'], 'commits': c['totalCommitContributions'], 'prs': c['totalPullRequestContributions'],
                    'issues': c['totalIssueContributions'], 'reviews': c['totalPullRequestReviewContributions'], 'private': c['restrictedContributionsCount']})
    tot['contributions'] += cal['totalContributions']; tot['commits'] += c['totalCommitContributions']; tot['private'] += c['restrictedContributionsCount']
    tot['prs'] += c['totalPullRequestContributions']; tot['issues'] += c['totalIssueContributions']; tot['reviews'] += c['totalPullRequestReviewContributions']
    for r in c['commitContributionsByRepository']:
        repos_seen.add(r['repository']['nameWithOwner'])
    for w in cal['weeks']:
        for d in w['contributionDays']:
            if d['date'] >= since:
                days[d['date']] = {'date': d['date'], 'count': d['contributionCount'], 'weekday': d['weekday']}

repos = u['repositories']['nodes']
langs = {}
for n in repos:
    if n['isFork']:
        continue
    for e in n['languages']['edges']:
        l = langs.setdefault(e['node']['name'], {'bytes': 0, 'color': e['node']['color'] or '#888888'})
        l['bytes'] += e['size']
total_bytes = sum(v['bytes'] for v in langs.values()) or 1
top = sorted(langs.items(), key=lambda kv: -kv[1]['bytes'])

# a token with less visibility (the Actions token cannot see private repositories) must never make the numbers shrink
old = {}
if os.path.exists(OUT):
    try:
        old = json.load(open(OUT))
    except Exception:
        old = {}
for d in old.get('calendar', []):
    cur = days.get(d['date'])
    if cur is None or d['count'] > cur['count']:
        days[d['date']] = d
cal = [days[k] for k in sorted(days)]
counts = [d['count'] for d in cal]

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
months, weekday = {}, [0] * 7
for d in cal:
    months[d['date'][:7]] = months.get(d['date'][:7], 0) + d['count']
    weekday[d['weekday']] += d['count']
best = max(cal, key=lambda d: d['count'])

def keep(key, new):
    return max(new, old.get(key, 0) or 0)

lang_list = [{'name': k, 'pct': round(v['bytes'] * 100 / total_bytes, 1), 'color': v['color']} for k, v in top[:8]]
if old.get('repos', 0) > u['repositories']['totalCount']:  # limited token: keep the richer repository view
    repos_total, public_total, stars, lang_list = old['repos'], old.get('public_repos', 0), old.get('stars', 0), old.get('languages', lang_list)
else:
    repos_total, public_total, stars = u['repositories']['totalCount'], sum(1 for n in repos if not n['isPrivate']), sum(n['stargazerCount'] for n in repos)
stats = {
    'generated': now.strftime('%Y-%m-%d'), 'refreshed_at': now.strftime('%Y-%m-%dT%H:%M:%SZ'),
    'user': USER, 'name': u['name'], 'since': u['createdAt'][:4], 'since_date': since,
    'followers': u['followers']['totalCount'], 'repos': repos_total, 'public_repos': public_total, 'stars': stars,
    'contributions': keep('contributions', sum(counts) if sum(counts) >= tot['contributions'] else tot['contributions']),
    'commits': keep('commits', tot['commits']),
    'private_contributions': keep('private_contributions', tot['private']),
    'prs': keep('prs', tot['prs']), 'issues': keep('issues', tot['issues']), 'reviews': keep('reviews', tot['reviews']),
    'repos_contributed': keep('repos_contributed', len(repos_seen)),
    'years': years, 'by_year': by_year,
    'active_days': sum(1 for c in counts if c),
    'longest_streak': longest, 'current_streak': cur,
    'best_day': {'date': best['date'], 'count': best['count']},
    'months': [{'month': k, 'count': v} for k, v in sorted(months.items())],
    'weekday': weekday,
    'languages': lang_list,
    'calendar': cal,
}
json.dump(stats, open(OUT, 'w'), indent=1)
print(json.dumps({k: v for k, v in stats.items() if k not in ('calendar', 'months', 'languages', 'weekday')}))
