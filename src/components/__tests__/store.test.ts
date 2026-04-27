import {
  loadState,
  saveState,
  addHabit,
  removeHabit,
  recordCompletion,
  getCompletionsForHabit,
} from '../../store';
import { AppState, Habit } from '../../types';

const emptyState: AppState = { habits: [], completions: [] };

function makeHabit(overrides: Partial<Habit> = {}): Omit<Habit, 'id' | 'createdAt'> {
  return {
    title: 'Test Habit',
    frequencyType: 'daily',
    frequencyTarget: 1,
    ...overrides,
  };
}

describe('loadState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty state when nothing in localStorage', () => {
    const state = loadState();
    expect(state.habits).toEqual([]);
    expect(state.completions).toEqual([]);
  });

  it('returns saved state', () => {
    const saved: AppState = {
      habits: [{ id: '1', title: 'H', frequencyType: 'daily', frequencyTarget: 1, createdAt: '' }],
      completions: [],
    };
    localStorage.setItem('habit-tree-state', JSON.stringify(saved));
    expect(loadState().habits.length).toBe(1);
  });
});

describe('saveState / loadState round-trip', () => {
  beforeEach(() => localStorage.clear());

  it('persists and restores state', () => {
    const state = addHabit(emptyState, makeHabit({ title: 'Run' }));
    saveState(state);
    const loaded = loadState();
    expect(loaded.habits[0].title).toBe('Run');
  });
});

describe('addHabit', () => {
  it('adds a habit with id and createdAt', () => {
    const state = addHabit(emptyState, makeHabit());
    expect(state.habits.length).toBe(1);
    expect(state.habits[0].id).toBeTruthy();
    expect(state.habits[0].createdAt).toBeTruthy();
  });

  it('does not mutate original state', () => {
    addHabit(emptyState, makeHabit());
    expect(emptyState.habits.length).toBe(0);
  });
});

describe('removeHabit', () => {
  it('removes the specified habit', () => {
    let state = addHabit(emptyState, makeHabit({ title: 'A' }));
    state = addHabit(state, makeHabit({ title: 'B' }));
    const idToRemove = state.habits[0].id;
    const next = removeHabit(state, idToRemove);
    expect(next.habits.length).toBe(1);
    expect(next.habits[0].title).toBe('B');
  });

  it('removes completions for the deleted habit', () => {
    let state = addHabit(emptyState, makeHabit());
    const habitId = state.habits[0].id;
    state = recordCompletion(state, habitId, '2024-01-01');
    const next = removeHabit(state, habitId);
    expect(next.completions.length).toBe(0);
  });
});

describe('recordCompletion', () => {
  it('adds a completion for daily habit', () => {
    const state = addHabit(emptyState, makeHabit());
    const habitId = state.habits[0].id;
    const next = recordCompletion(state, habitId, '2024-01-01');
    expect(next.completions.length).toBe(1);
  });

  it('does not duplicate daily completion for same date', () => {
    let state = addHabit(emptyState, makeHabit());
    const habitId = state.habits[0].id;
    state = recordCompletion(state, habitId, '2024-01-01');
    state = recordCompletion(state, habitId, '2024-01-01');
    expect(state.completions.length).toBe(1);
  });

  it('allows multiple completions for weekly habit on same day', () => {
    let state = addHabit(emptyState, makeHabit({ frequencyType: 'weekly', frequencyTarget: 3 }));
    const habitId = state.habits[0].id;
    state = recordCompletion(state, habitId, '2024-01-01');
    state = recordCompletion(state, habitId, '2024-01-01');
    expect(state.completions.length).toBe(2);
  });

  it('returns unchanged state for unknown habitId', () => {
    const next = recordCompletion(emptyState, 'non-existent', '2024-01-01');
    expect(next).toEqual(emptyState);
  });
});

describe('getCompletionsForHabit', () => {
  it('returns only completions for the given habit', () => {
    let state = addHabit(emptyState, makeHabit({ title: 'A' }));
    state = addHabit(state, makeHabit({ title: 'B' }));
    const idA = state.habits[0].id;
    const idB = state.habits[1].id;
    state = recordCompletion(state, idA, '2024-01-01');
    state = recordCompletion(state, idB, '2024-01-01');
    expect(getCompletionsForHabit(state, idA).length).toBe(1);
    expect(getCompletionsForHabit(state, idA)[0].habitId).toBe(idA);
  });
});
