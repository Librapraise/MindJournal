// types.ts
export type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening' | 'Night';
export type Mood = 'Happy' | 'Calm' | 'Good' | 'Neutral' | 'Unsure' | 'Sad' | 'Stressed' | 'Angry';
export type WritingPrompt = {
  text: string;
  type: 'stress' | 'gratitude' | 'collaboration' | 'intentions' | string;
};

export interface JournalEntryCreate {
  title: string;
  content: string;
  date: string;
  time_of_day: TimeOfDay;
  mood?: Mood;
  mood_rating?: number;
  tags: string[];
  is_draft: boolean;
}