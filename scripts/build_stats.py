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


Q = '''query($login:String!){ user(login:$login){
  name login createdAt followers{totalCount} following{totalCount}
  contributionsCollection{ totalCommitContributions restrictedContributionsCount totalPullRequestContributions totalIssueContributions
    totalPullRequestReviewContributions totalRepositoriesWithContributedCommits contributionYears
    contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount weekday } } } }
  repositories(ownerAffiliations:OWNER, first:100, orderBy:{field:PUSHED_AT, direction:DESC}){ totalCount
    nodes{ name isPrivate isFork stargazerCount forkCount pushedAt languages(first:8, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name color } } } } }
}}'''

u = gql(Q, {'login': USER})['user']
cc = u['contributionsCollection']
days = [d for w in cc['contributionCalendar']['weeks'] for d in w['contributionDays']]
counts = [d['contributionCount'] for d in days]

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

months = {}
for d in days:
    k = d['date'][:7]
    months[k] = months.get(k, 0) + d['contributionCount']
weekday = [0] * 7
for d in days:
    weekday[d['weekday']] += d['contributionCount']

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

best = max(days, key=lambda d: d['contributionCount'])
stats = {
    'generated': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%d'),
    'user': USER, 'name': u['name'], 'since': u['createdAt'][:4],
    'followers': u['followers']['totalCount'],
    'repos': u['repositories']['totalCount'],
    'public_repos': sum(1 for n in repos if not n['isPrivate']),
    'stars': sum(n['stargazerCount'] for n in repos),
    'contributions': cc['contributionCalendar']['totalContributions'],
    'commits': cc['totalCommitContributions'],
    'private_contributions': cc['restrictedContributionsCount'],
    'prs': cc['totalPullRequestContributions'], 'issues': cc['totalIssueContributions'], 'reviews': cc['totalPullRequestReviewContributions'],
    'repos_contributed': cc['totalRepositoriesWithContributedCommits'],
    'years': cc['contributionYears'],
    'active_days': sum(1 for c in counts if c),
    'longest_streak': longest, 'current_streak': cur,
    'best_day': {'date': best['date'], 'count': best['contributionCount']},
    'months': [{'month': k, 'count': v} for k, v in sorted(months.items())][-12:],
    'weekday': weekday,
    'languages': [{'name': k, 'pct': round(v['bytes'] * 100 / total_bytes, 1), 'color': v['color']} for k, v in top[:8]],
    'calendar': [{'date': d['date'], 'count': d['contributionCount'], 'weekday': d['weekday']} for d in days],
}
json.dump(stats, open(OUT, 'w'), indent=1)
print(json.dumps({k: v for k, v in stats.items() if k not in ('calendar', 'months', 'languages', 'weekday')}))
