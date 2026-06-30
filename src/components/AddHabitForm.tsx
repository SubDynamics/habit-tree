import { useState } from 'react';
import { FrequencyType, Habit } from '../types';
import './AddHabitForm.scss';

/**
 * Props for `AddHabitForm` component.
 *
 * @property onSubmit - Called with the new habit data (excluding `id` and `createdAt`) when the form is submitted.
 * @property onCancel - Called when the user cancels adding a new habit.
 */
interface AddHabitFormProps {
  onSubmit: (data: Omit<Habit, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

/**
 * `AddHabitForm` renders a modal-like form to create a new habit.
 * It manages local form state for title, description, frequency type and
 * frequency target. On submit it validates required fields and passes a
 * normalized payload to `onSubmit`.
 *
 * Internal function:
 * - `handleSubmit`: prevents default, validates title, normalizes the payload
 *   (ensuring daily habits always have `frequencyTarget` of 1) and calls
 *   `onSubmit` with the new habit data.
 */
export default function AddHabitForm({ onSubmit, onCancel }: AddHabitFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
  const [frequencyTarget, setFrequencyTarget] = useState(1);

  /**
   * Handle form submission.
   * @param e - Form event from the browser.
   */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      frequencyType,
      frequencyTarget: frequencyType === 'daily' ? 1 : frequencyTarget,
    });
  }

  return (
    <div className="add-habit-overlay">
      <form className="add-habit-form" onSubmit={handleSubmit}>
        <h2 className="add-habit-form__title">New Habit</h2>

        <label className="add-habit-form__label">
          Title *
          <input
            className="add-habit-form__input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Morning run"
            required
            maxLength={60}
          />
        </label>

        <label className="add-habit-form__label">
          Description
          <textarea
            className="add-habit-form__textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            rows={2}
            maxLength={200}
          />
        </label>

        <label className="add-habit-form__label">
          Frequency
          <select
            className="add-habit-form__select"
            value={frequencyType}
            onChange={(e) => setFrequencyType(e.target.value as FrequencyType)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly (min times per week)</option>
            <option value="monthly">Monthly (min times per month)</option>
            <option value="yearly">Yearly (min times per year)</option>
          </select>
        </label>

        {frequencyType !== 'daily' && (
          <label className="add-habit-form__label">
            Target count
            <input
              className="add-habit-form__input"
              type="number"
              min={1}
              max={365}
              value={frequencyTarget}
              onChange={(e) => setFrequencyTarget(Number(e.target.value))}
            />
          </label>
        )}

        <div className="add-habit-form__actions">
          <button type="button" className="add-habit-form__btn--cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="add-habit-form__btn--submit">
            Add Habit
          </button>
        </div>
      </form>
    </div>
  );
}
