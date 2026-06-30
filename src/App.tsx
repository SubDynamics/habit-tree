import { useState } from 'react';
import {
  loadState,
  saveState,
  addHabit,
  removeHabit,
  recordCompletion,
  getCompletionsForHabit,
} from './store';
import { getTodayString, hasDoneToday } from './utils';
import { AppState } from './types';
import HabitPanel from './components/HabitPanel';
import AddHabitForm from './components/AddHabitForm';
import './App.scss';

/** Maximum number of habits the UI allows before hiding the add button. */
const MAX_HABITS = 6;

/**
 * Root application component for Habit Tree. Manages application state,
 * persistence (via `loadState` / `saveState`), and top-level handlers for
 * adding, removing and recording completions for habits.
 *
 * Internal handlers:
 * - `handleAddHabit`: Adds a new habit to state, persists it and closes the form.
 * - `handleRemoveHabit`: Removes a habit by id and persists the new state.
 * - `handleComplete`: Records a completion for a habit for the current day and persists.
 */
export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [showForm, setShowForm] = useState(false);
  const today = getTodayString();

  /**
   * Add a habit to the current app state and persist the change.
   * @param data - New habit data (see `addHabit` helper for expected shape).
   */
  function handleAddHabit(data: Parameters<typeof addHabit>[1]) {
    const next = addHabit(state, data);
    saveState(next);
    setState(next);
    setShowForm(false);
  }

  /**
   * Remove a habit by id from app state and persist the change.
   * @param habitId - The id of the habit to remove.
   */
  function handleRemoveHabit(habitId: string) {
    const next = removeHabit(state, habitId);
    saveState(next);
    setState(next);
  }

  /**
   * Record a completion for the given habit for today's date and persist.
   * @param habitId - The id of the habit that was completed.
   */
  function handleComplete(habitId: string) {
    const next = recordCompletion(state, habitId, today);
    saveState(next);
    setState(next);
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>🌳 Habit Tree</h1>
      </header>

      <main className="app__main">
        {state.habits.length === 0 && <p className="app__empty">No habits yet. Add one below!</p>}
        {state.habits.map((habit) => {
          const completions = getCompletionsForHabit(state, habit.id);
          const doneToday = hasDoneToday(completions, habit.id, today);
          return (
            <HabitPanel
              key={habit.id}
              habit={habit}
              completions={completions}
              doneToday={doneToday}
              today={today}
              onComplete={() => handleComplete(habit.id)}
              onRemove={() => handleRemoveHabit(habit.id)}
            />
          );
        })}
      </main>

      {showForm ? (
        <AddHabitForm onSubmit={handleAddHabit} onCancel={() => setShowForm(false)} />
      ) : (
        state.habits.length < MAX_HABITS && (
          <button className="app__add-btn" onClick={() => setShowForm(true)}>
            +
          </button>
        )
      )}
    </div>
  );
}
