import { AppState, CompletionRecord, Habit } from './types';

const STORAGE_KEY = 'habit-tree-state';

/**
 * Loads the persisted {@link AppState} from `localStorage`.
 *
 * Returns an empty state (`{ habits: [], completions: [] }`) when no saved data
 * exists or the stored JSON cannot be parsed.
 *
 * @returns The previously saved application state, or a blank initial state.
 */
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // ignore
  }
  return { habits: [], completions: [] };
}

/**
 * Persists the current {@link AppState} to `localStorage` as a JSON string.
 *
 * @param state - The application state to save.
 */
export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Returns a new state with a freshly created habit appended to the habits list.
 *
 * A UUID is generated for `id` and the current ISO timestamp is recorded as
 * `createdAt`; all other fields are taken from the supplied `habit` object.
 *
 * @param state - The current application state.
 * @param habit - The new habit's properties, excluding auto-generated `id` and `createdAt`.
 * @returns A new {@link AppState} with the habit added.
 */
export function addHabit(
  state: AppState,
  habit: Omit<Habit, 'id' | 'createdAt'>,
): AppState {
  const newHabit: Habit = {
    ...habit,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  return { ...state, habits: [...state.habits, newHabit] };
}

/**
 * Returns a new state with the specified habit and all of its completion records removed.
 *
 * @param state - The current application state.
 * @param habitId - The ID of the habit to remove.
 * @returns A new {@link AppState} without the habit or any of its completions.
 */
export function removeHabit(state: AppState, habitId: string): AppState {
  return {
    habits: state.habits.filter((h) => h.id !== habitId),
    completions: state.completions.filter((c) => c.habitId !== habitId),
  };
}

/**
 * Records a completion for the given habit on the specified local date.
 *
 * - If the habit does not exist the state is returned unchanged.
 * - **Daily habits** are idempotent per calendar day: if a completion with the
 *   same `habitId` and `date` already exists, the state is returned unchanged.
 * - **Interval habits** (weekly / monthly / yearly) allow multiple completions
 *   per day, so no deduplication is applied.
 * - Every new completion record stores a `completedAt` ISO 8601 timestamp
 *   (the exact moment Done was pressed) in addition to the local `date` string.
 *
 * @param state - The current application state.
 * @param habitId - The ID of the habit being completed.
 * @param date - The local calendar date of the completion in `YYYY-MM-DD` format.
 * @returns A new {@link AppState} with the completion appended, or the original state if unchanged.
 */
export function recordCompletion(
  state: AppState,
  habitId: string,
  date: string,
): AppState {
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit) return state;

  if (habit.frequencyType === 'daily') {
    const alreadyDone = state.completions.some(
      (c) => c.habitId === habitId && c.date === date,
    );
    if (alreadyDone) return state;
  }

  const newCompletion: CompletionRecord = { habitId, date, completedAt: new Date().toISOString() };
  return { ...state, completions: [...state.completions, newCompletion] };
}

/**
 * Returns all completion records that belong to the specified habit.
 *
 * @param state - The current application state.
 * @param habitId - The ID of the habit whose completions are requested.
 * @returns An array of {@link CompletionRecord} objects filtered to the given habit.
 */
export function getCompletionsForHabit(
  state: AppState,
  habitId: string,
): CompletionRecord[] {
  return state.completions.filter((c) => c.habitId === habitId);
}
