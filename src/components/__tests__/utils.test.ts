import {
  getTodayString,
  getDailyStreak,
  getPersonalBestStreak,
  getCurrentIntervalCompletions,
  getDailyPanelColor,
  getIntervalPanelColor,
  hasDoneToday,
} from '../../utils';
import { CompletionRecord } from '../../types';

function rec(habitId: string, date: string, completedAt?: string): CompletionRecord {
  return completedAt !== undefined ? { habitId, date, completedAt } : { habitId, date };
}

describe('getTodayString', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(getTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns local date, not UTC date', () => {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(getTodayString()).toBe(localDate);
  });
});

describe('getDailyStreak', () => {
  it('returns 0 for empty completions', () => {
    expect(getDailyStreak([], '2024-01-10')).toBe(0);
  });

  it('counts streak ending today', () => {
    const completions = [
      rec('h1', '2024-01-08'),
      rec('h1', '2024-01-09'),
      rec('h1', '2024-01-10'),
    ];
    expect(getDailyStreak(completions, '2024-01-10')).toBe(3);
  });

  it('counts streak ending yesterday when not done today', () => {
    const completions = [
      rec('h1', '2024-01-08'),
      rec('h1', '2024-01-09'),
    ];
    expect(getDailyStreak(completions, '2024-01-10')).toBe(2);
  });

  it('returns 0 when streak is broken', () => {
    const completions = [rec('h1', '2024-01-07')];
    expect(getDailyStreak(completions, '2024-01-10')).toBe(0);
  });
});

describe('getPersonalBestStreak', () => {
  it('returns 0 for empty completions', () => {
    expect(getPersonalBestStreak([])).toBe(0);
  });

  it('finds the longest consecutive streak', () => {
    const completions = [
      rec('h1', '2024-01-01'),
      rec('h1', '2024-01-02'),
      rec('h1', '2024-01-03'),
      rec('h1', '2024-01-05'),
      rec('h1', '2024-01-06'),
    ];
    expect(getPersonalBestStreak(completions)).toBe(3);
  });

  it('handles single entry', () => {
    expect(getPersonalBestStreak([rec('h1', '2024-01-01')])).toBe(1);
  });

  it('handles duplicate dates without resetting streak', () => {
    const completions = [
      rec('h1', '2024-01-01'),
      rec('h1', '2024-01-01'),
      rec('h1', '2024-01-02'),
    ];
    expect(getPersonalBestStreak(completions)).toBe(2);
  });
});

describe('getCurrentIntervalCompletions', () => {
  it('counts weekly completions', () => {
    // 2024-01-15 is a Monday
    const refDate = new Date('2024-01-17T00:00:00'); // Wednesday
    const completions = [
      rec('h1', '2024-01-15'),
      rec('h1', '2024-01-16'),
      rec('h1', '2024-01-14'), // last Sunday — outside this week (Mon start)
    ];
    expect(getCurrentIntervalCompletions(completions, 'weekly', refDate)).toBe(2);
  });

  it('counts monthly completions', () => {
    const refDate = new Date('2024-01-15T00:00:00');
    const completions = [
      rec('h1', '2024-01-01'),
      rec('h1', '2024-01-10'),
      rec('h1', '2024-02-01'),
    ];
    expect(getCurrentIntervalCompletions(completions, 'monthly', refDate)).toBe(2);
  });

  it('counts yearly completions', () => {
    const refDate = new Date('2024-06-01T00:00:00');
    const completions = [
      rec('h1', '2024-01-01'),
      rec('h1', '2024-05-01'),
      rec('h1', '2023-12-31'),
    ];
    expect(getCurrentIntervalCompletions(completions, 'yearly', refDate)).toBe(2);
  });
});

describe('getDailyPanelColor', () => {
  it('returns good when streak equals personal best', () => {
    const completions = [rec('h1', '2024-01-09'), rec('h1', '2024-01-10')];
    // streak=2, personalBest=2 → good
    expect(getDailyPanelColor(2, 2, completions, '2024-01-10')).toBe('good');
  });

  it('returns bad when last completion was 3+ days ago', () => {
    const completions = [rec('h1', '2024-01-05')];
    expect(getDailyPanelColor(0, 1, completions, '2024-01-10')).toBe('bad');
  });

  it('returns neutral when streak not at best and not broken long ago', () => {
    const completions = [rec('h1', '2024-01-10')];
    // streak=1, personal best will be 3 from different data
    expect(getDailyPanelColor(1, 3, completions, '2024-01-10')).toBe('neutral');
  });
});

describe('getIntervalPanelColor', () => {
  it('returns good when already hit target', () => {
    const completions = [
      rec('h1', '2024-01-15'),
      rec('h1', '2024-01-16'),
      rec('h1', '2024-01-17'),
    ];
    // target 3, done 3 → good
    const ref = new Date('2024-01-17T00:00:00');
    expect(getIntervalPanelColor(completions, 'weekly', 3, ref)).toBe('good');
  });

  it('returns bad when impossible to hit goal', () => {
    // Last day of month, need 5 more completions
    const ref = new Date('2024-01-31T00:00:00');
    const completions: CompletionRecord[] = [];
    expect(getIntervalPanelColor(completions, 'monthly', 5, ref)).toBe('bad');
  });

  it('returns good when ahead of pace', () => {
    // Month of 31 days, day 5 (elapsed=5), target=10, done=3
    // pace = 10 * 5/31 ≈ 1.6, done=3 > 1.6 → good
    const ref = new Date('2024-01-05T00:00:00');
    const completions = [rec('h1', '2024-01-01'), rec('h1', '2024-01-02'), rec('h1', '2024-01-03')];
    expect(getIntervalPanelColor(completions, 'monthly', 10, ref)).toBe('good');
  });
});

describe('hasDoneToday', () => {
  it('returns true when done today (date-only record)', () => {
    const completions = [rec('h1', '2024-01-10')];
    expect(hasDoneToday(completions, 'h1', '2024-01-10')).toBe(true);
  });

  it('returns false when not done today (date-only record)', () => {
    const completions = [rec('h1', '2024-01-09')];
    expect(hasDoneToday(completions, 'h1', '2024-01-10')).toBe(false);
  });

  it('returns true when completedAt is after local midnight today', () => {
    // Build a timestamp 1 hour after local midnight on 2024-01-10
    const localMidnight = new Date(2024, 0, 10).getTime(); // Jan 10, 00:00 local
    const afterMidnight = new Date(localMidnight + 3600_000).toISOString(); // +1 h
    const completions = [rec('h1', '2024-01-10', afterMidnight)];
    expect(hasDoneToday(completions, 'h1', '2024-01-10')).toBe(true);
  });

  it('returns false when completedAt is before local midnight today', () => {
    // Build a timestamp 1 hour before local midnight on 2024-01-10 (i.e. yesterday 23:00)
    const localMidnight = new Date(2024, 0, 10).getTime(); // Jan 10, 00:00 local
    const beforeMidnight = new Date(localMidnight - 3600_000).toISOString(); // -1 h
    const completions = [rec('h1', '2024-01-09', beforeMidnight)];
    expect(hasDoneToday(completions, 'h1', '2024-01-10')).toBe(false);
  });

  it('prefers completedAt over date field when present', () => {
    // date says today but completedAt was 1 hour before local midnight — should be false
    const localMidnight = new Date(2024, 0, 10).getTime();
    const beforeMidnight = new Date(localMidnight - 3600_000).toISOString();
    const completions = [rec('h1', '2024-01-10', beforeMidnight)];
    expect(hasDoneToday(completions, 'h1', '2024-01-10')).toBe(false);
  });
});
