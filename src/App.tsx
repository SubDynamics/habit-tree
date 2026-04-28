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

const MAX_HABITS = 6;

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [showForm, setShowForm] = useState(false);
  const today = getTodayString();

  function handleAddHabit(data: Parameters<typeof addHabit>[1]) {
    const next = addHabit(state, data);
    saveState(next);
    setState(next);
    setShowForm(false);
  }

  function handleRemoveHabit(habitId: string) {
    const next = removeHabit(state, habitId);
    saveState(next);
    setState(next);
  }

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
        {state.habits.length === 0 && (
          <p className="app__empty">No habits yet. Add one below!</p>
        )}
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
