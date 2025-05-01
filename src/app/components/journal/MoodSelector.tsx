// components/MoodSelector.tsx
import React from 'react';
import { Mood } from '@/app/types';

interface MoodSelectorProps {
  selectedMood: Mood | null;
  setSelectedMood: (mood: Mood) => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, setSelectedMood }) => {
  // Moods data
  const moods: { icon: string; label: Mood }[] = [
    { icon: '😊', label: 'Happy' },
    { icon: '😌', label: 'Calm' },
    { icon: '🙂', label: 'Good' },
    { icon: '😐', label: 'Neutral' },
    { icon: '😕', label: 'Unsure' },
    { icon: '😔', label: 'Sad' },
    { icon: '😩', label: 'Stressed' },
    { icon: '😠', label: 'Angry' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-medium font-bold text-gray-700 mb-3">How are you feeling?</h3>
      <div className="grid grid-cols-4 gap-4">
        {moods.map((mood) => (
          <button
            key={mood.label}
            className={`cursor-pointer flex flex-col items-center justify-center p-2 rounded-md transition ${
              selectedMood === mood.label
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => setSelectedMood(mood.label)}
          >
            <span className="text-2xl mb-1">{mood.icon}</span>
            <span className="text-xs">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;