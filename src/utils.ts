import { CompletionRecord, FrequencyType } from './types';

export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDailyStreak(
  completions: CompletionRecord[],
  todayStr: string,
): number {
  const dates = new Set(completions.map((c) => c.date));
  const today = new Date(todayStr + 'T00:00:00');
  let streak = 0;
  let cursor = dates.has(todayStr) ? today : new Date(today.getTime() - 86400000);
  let s = cursor.toISOString().slice(0, 10);

  while (dates.has(s)) {
    streak++;
    cursor = new Date(cursor.getTime() - 86400000);
    s = cursor.toISOString().slice(0, 10);
  }
  return streak;
}

export function getPersonalBestStreak(completions: CompletionRecord[]): number {
  if (completions.length === 0) return 0;
  const sorted = [...completions].sort((a, b) => a.date.localeCompare(b.date));
  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date + 'T00:00:00');
    const curr = new Date(sorted[i].date + 'T00:00:00');
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      current++;
      if (current > best) best = current;
    } else if (diff > 1) {
      current = 1;
    }
    // diff === 0 means same day duplicate — skip without resetting
  }
  return best;
}

export function getCurrentIntervalCompletions(
  completions: CompletionRecord[],
  frequencyType: FrequencyType,
  referenceDate: Date,
): number {
  if (frequencyType === 'daily') return 0;

  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0-based

  return completions.filter((c) => {
    const d = new Date(c.date + 'T00:00:00');
    if (frequencyType === 'weekly') {
      // Week starts on Monday
      const refMonday = new Date(referenceDate);
      const offset = (referenceDate.getDay() + 6) % 7; // days since Monday
      refMonday.setDate(referenceDate.getDate() - offset);
      refMonday.setHours(0, 0, 0, 0);
      const refSunday = new Date(refMonday);
      refSunday.setDate(refMonday.getDate() + 6);
      refSunday.setHours(23, 59, 59, 999);
      return d >= refMonday && d <= refSunday;
    }
    if (frequencyType === 'monthly') {
      return d.getFullYear() === year && d.getMonth() === month;
    }
    if (frequencyType === 'yearly') {
      return d.getFullYear() === year;
    }
    return false;
  }).length;
}

export function getDailyPanelColor(
  streak: number,
  personalBest: number,
  completions: CompletionRecord[],
  todayStr: string,
): 'good' | 'bad' | 'neutral' {
  if (streak > 0 && personalBest > 0 && streak >= personalBest) return 'good';

  // Check if streak was broken 3+ days ago
  if (completions.length > 0) {
    const dates = completions.map((c) => c.date).sort();
    const lastDate = dates[dates.length - 1];
    const today = new Date(todayStr + 'T00:00:00');
    const last = new Date(lastDate + 'T00:00:00');
    const diff = (today.getTime() - last.getTime()) / 86400000;
    if (diff >= 3) return 'bad';
  }

  return 'neutral';
}

export function getIntervalPanelColor(
  completions: CompletionRecord[],
  frequencyType: FrequencyType,
  target: number,
  referenceDate: Date,
): 'good' | 'bad' | 'neutral' {
  const done = getCurrentIntervalCompletions(completions, frequencyType, referenceDate);
  const remaining = target - done;

  if (remaining <= 0) return 'good';

  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  let totalDays: number;
  let elapsedDays: number;
  let remainingDays: number;

  if (frequencyType === 'weekly') {
    totalDays = 7;
    const dayOfWeek = (referenceDate.getDay() + 6) % 7; // 0=Mon
    elapsedDays = dayOfWeek + 1; // today counts
    remainingDays = totalDays - elapsedDays;
  } else if (frequencyType === 'monthly') {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    totalDays = daysInMonth;
    elapsedDays = referenceDate.getDate();
    remainingDays = totalDays - elapsedDays;
  } else {
    // yearly
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    totalDays = isLeap ? 366 : 365;
    const startOfYear = new Date(year, 0, 1);
    elapsedDays =
      Math.floor((referenceDate.getTime() - startOfYear.getTime()) / 86400000) + 1;
    remainingDays = totalDays - elapsedDays;
  }

  // Impossible to hit goal: remaining days < remaining needed
  if (remainingDays < remaining) return 'bad';

  // Ahead of pace: completions > target * elapsedDays / totalDays
  const pace = (target * elapsedDays) / totalDays;
  if (done > pace) return 'good';

  return 'neutral';
}

export function hasDoneToday(
  completions: CompletionRecord[],
  habitId: string,
  todayStr: string,
): boolean {
  const [y, mo, d] = todayStr.split('-').map(Number);
  const todayStart = new Date(y, mo - 1, d).getTime(); // local midnight
  return completions.some((c) => {
    if (c.habitId !== habitId) return false;
    if (c.completedAt !== undefined) {
      return new Date(c.completedAt).getTime() >= todayStart;
    }
    return c.date === todayStr;
  });
}
