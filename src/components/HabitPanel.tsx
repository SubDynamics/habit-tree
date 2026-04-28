import { Habit, CompletionRecord } from '../types';
import {
  getDailyStreak,
  getPersonalBestStreak,
  getDailyPanelColor,
  getIntervalPanelColor,
  getCurrentIntervalCompletions,
} from '../utils';
import './HabitPanel.scss';

interface HabitPanelProps {
  habit: Habit;
  completions: CompletionRecord[];
  doneToday: boolean;
  today: string;
  onComplete: () => void;
  onRemove: () => void;
}

export default function HabitPanel({
  habit,
  completions,
  doneToday,
  today,
  onComplete,
  onRemove,
}: HabitPanelProps) {
  const isDaily = habit.frequencyType === 'daily';

  const color = isDaily
    ? getDailyPanelColor(
        getDailyStreak(completions, today),
        getPersonalBestStreak(completions),
        completions,
        today,
      )
    : getIntervalPanelColor(
        completions,
        habit.frequencyType,
        habit.frequencyTarget,
        new Date(today + 'T00:00:00'),
      );

  const streak = isDaily ? getDailyStreak(completions, today) : 0;

  const intervalDone = isDaily
    ? 0
    : getCurrentIntervalCompletions(
        completions,
        habit.frequencyType,
        new Date(today + 'T00:00:00'),
      );
  const remaining = isDaily ? 0 : Math.max(0, habit.frequencyTarget - intervalDone);

  return (
    <div className={`habit-panel habit-panel--${color}`}>
      <div className="habit-panel__header">
        <div className="habit-panel__titles">
          <h2 className="habit-panel__title">{habit.title}</h2>
          {habit.description && (
            <p className="habit-panel__description">{habit.description}</p>
          )}
        </div>
        <button
          className="habit-panel__delete"
          onClick={onRemove}
          aria-label="Delete habit"
          title="Delete"
        >
          ✕
        </button>
      </div>

      <div className="habit-panel__footer">
        <span className="habit-panel__stat">
          {isDaily ? (
            <span>🔥 {streak} day streak</span>
          ) : (
            <span>
              {intervalDone} / {remaining} to go
            </span>
          )}
        </span>
        <button
          className="habit-panel__done"
          onClick={onComplete}
          disabled={isDaily && doneToday}
        >
          {isDaily && doneToday ? '✓ Done' : 'Done!'}
        </button>
      </div>
    </div>
  );
}
