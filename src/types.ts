export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequencyType: FrequencyType;
  frequencyTarget: number; // 1 for daily (unused), target count for others
  createdAt: string;
}

export interface CompletionRecord {
  habitId: string;
  date: string; // YYYY-MM-DD (local date)
  completedAt?: string; // ISO 8601 timestamp of when Done was pressed
}

export interface AppState {
  habits: Habit[];
  completions: CompletionRecord[];
}
