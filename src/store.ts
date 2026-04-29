import { AppState, CompletionRecord, Habit } from './types';

const STORAGE_KEY = 'habit-tree-state';

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // ignore
  }
  return { habits: [], completions: [] };
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

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

export function removeHabit(state: AppState, habitId: string): AppState {
  return {
    habits: state.habits.filter((h) => h.id !== habitId),
    completions: state.completions.filter((c) => c.habitId !== habitId),
  };
}

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

export function getCompletionsForHabit(
  state: AppState,
  habitId: string,
): CompletionRecord[] {
  return state.completions.filter((c) => c.habitId === habitId);
}
