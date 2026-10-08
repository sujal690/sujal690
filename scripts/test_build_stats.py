import datetime as dt
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_stats as bs


class BuildStatsAggregationTests(unittest.TestCase):
    def test_year_range_caps_current_year(self):
        today = dt.date(2026, 10, 8)
        y0, y1 = bs.year_range(2026, today)
        self.assertEqual(y0.isoformat(), '2026-01-01')
        self.assertEqual(y1.isoformat(), '2026-10-08')

    def test_merge_days_deduplicates_dates(self):
        merged = bs.merge_days([
            [{'date': '2025-12-31', 'contributionCount': 2, 'weekday': 3},
             {'date': '2026-01-01', 'contributionCount': 1, 'weekday': 4}],
            [{'date': '2026-01-01', 'contributionCount': 4, 'weekday': 4},
             {'date': '2026-01-02', 'contributionCount': 0, 'weekday': 5}],
        ])
        self.assertEqual([d['date'] for d in merged], ['2025-12-31', '2026-01-01', '2026-01-02'])
        self.assertEqual([d['count'] for d in merged], [2, 4, 0])

    def test_summarize_calendar_totals_and_streaks(self):
        days = [
            {'date': '2026-01-01', 'count': 0, 'weekday': 4},
            {'date': '2026-01-02', 'count': 2, 'weekday': 5},
            {'date': '2026-01-03', 'count': 3, 'weekday': 6},
            {'date': '2026-01-04', 'count': 0, 'weekday': 0},
            {'date': '2026-01-05', 'count': 1, 'weekday': 1},
            {'date': '2026-01-06', 'count': 2, 'weekday': 2},
            {'date': '2026-01-07', 'count': 0, 'weekday': 3},
        ]
        s = bs.summarize_calendar(days)
        self.assertEqual(s['contributions'], 8)
        self.assertEqual(s['active_days'], 4)
        self.assertEqual(s['longest_streak'], 2)
        self.assertEqual(s['current_streak'], 2)
        self.assertEqual(s['best_day'], {'date': '2026-01-03', 'count': 3})
        self.assertEqual(s['months'], [{'month': '2026-01', 'count': 8}])
        self.assertEqual(sum(s['weekday']), 8)

    def test_current_streak_ignores_today_if_zero(self):
        longest, current = bs.streaks([1, 1, 0])
        self.assertEqual(longest, 2)
        self.assertEqual(current, 2)


if __name__ == '__main__':
    unittest.main()
