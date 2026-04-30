# Completions & Streaks

This document explains how Habit Tree records completions, calculates streaks, and decides when to reset the Done button each day.

---

## Data model

All app state is stored in `localStorage` under the key `habit-tree-state` as a single JSON object (`AppState`).

### `Habit`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID generated at creation |
| `title` | `string` | Display name |
| `description` | `string?` | Optional subtitle |
| `frequencyType` | `'daily' \| 'weekly' \| 'monthly' \| 'yearly'` | How often the goal repeats |
| `frequencyTarget` | `number` | Required completions per interval (always `1` for daily) |
| `createdAt` | `string` | ISO 8601 creation timestamp |

### `CompletionRecord`

| Field | Type | Notes |
|---|---|---|
| `habitId` | `string` | References the parent `Habit` |
| `date` | `string` | Local calendar date (`YYYY-MM-DD`) on which Done was pressed |
| `completedAt` | `string?` | Full ISO 8601 timestamp of the Done press; absent on records created before this field was introduced |

---

## Recording a completion

When the user presses **Done**, `recordCompletion()` in `store.ts`:

1. Looks up the habit by ID.  If not found, returns the state unchanged.
2. **Daily habits only** – checks whether a record with the same `date` already exists.  If so, no duplicate is added (one completion per calendar day).
3. Appends a new `CompletionRecord` with:
   - `date` – the local `YYYY-MM-DD` string returned by `getTodayString()`.
   - `completedAt` – `new Date().toISOString()`, the exact UTC instant the button was pressed.

Interval habits (weekly / monthly / yearly) allow multiple completions per day because the user may need to log, say, 3 workouts in one week.

---

## Daily reset (00:00 local time)

The Done button and panel disabled state are driven by `hasDoneToday()`:

```
todayStart = new Date(year, month - 1, day)   ← local midnight, unambiguous
```

For each completion belonging to the habit:

- **If `completedAt` is present** – the record is considered "today" when `completedAt ≥ todayStart`.
- **If `completedAt` is absent** (legacy record) – falls back to `date === todayStr`.

Because `todayStart` is constructed with the `Date(year, month, day)` constructor (local timezone), the reset fires at exactly 00:00 in the user's local timezone regardless of their UTC offset.

`getTodayString()` likewise uses `getFullYear() / getMonth() / getDate()` (local components) rather than slicing a UTC ISO string, so the date label is always the user's local calendar date.

---

## Streak calculation (daily habits)

`getDailyStreak(completions, todayStr)` computes the current streak at call time — no streak value is persisted.

```
cursor = today (if done today) OR yesterday (if not yet done today)
streak = 0

while completions contains cursor date:
    streak++
    cursor = cursor - 1 day
```

Key behaviours:

- **Not done today yet** – the streak walks back from yesterday, so an active streak is preserved until midnight.
- **Gap of 1 day** (missed yesterday, done the day before) – the while-loop exits immediately after the first step, streak = 0.
- **Gap of 2+ days** – streak is also 0.

`getPersonalBestStreak(completions)` iterates the sorted completion dates once, tracking the longest consecutive run, and ignores same-day duplicates (which occur for interval habits).

---

## Panel colour

### Daily habits (`getDailyPanelColor`)

| Condition | Colour |
|---|---|
| `streak ≥ personalBest` and both > 0 | 🟢 `good` |
| Last completion ≥ 3 days ago | 🔴 `bad` |
| Otherwise | ⚪ `neutral` |

### Interval habits (`getIntervalPanelColor`)

| Condition | Colour |
|---|---|
| Target completions already reached this interval | 🟢 `good` |
| Not enough days remain in the interval to reach the target | 🔴 `bad` |
| Completion count is ahead of the linear pace | 🟢 `good` |
| Otherwise | ⚪ `neutral` |

The pace threshold is `target × elapsedDays / totalDays`.  Interval boundaries:

- **Weekly** – Monday–Sunday (ISO week).
- **Monthly** – first to last day of the calendar month.
- **Yearly** – 1 Jan – 31 Dec (leap years use 366 days).

---

## Streak reset on missed days

Streaks are not stored — they are recomputed on every render from the raw `completions` array.  If a user misses a day, `getDailyStreak` naturally returns 0 the next time it is called.  There is no stored counter to reset.

For interval habits the panel simply shows `done / remaining` within the current interval window, which resets automatically as the interval rolls over.
