// components/MoodRatingSlider.tsx
import React from 'react';

interface MoodRatingSliderProps {
  moodRating: number;
  setMoodRating: (rating: number) => void;
  isSubmitting: boolean;
  darkMode?: boolean;
}

const MoodRatingSlider: React.FC<MoodRatingSliderProps> = ({ 
  moodRating, 
  setMoodRating, 
  isSubmitting,
  darkMode = false 
}) => {
  // Mood rating options
  const moodOptions = [
    { value: 1, label: '😞 Very Bad (1)' },
    { value: 2, label: '🙁 Bad (2)' },
    { value: 3, label: '😐 Not Great (3)' },
    { value: 4, label: '😐 Okay (4)' },
    { value: 5, label: '😐 Neutral (5)' },
    { value: 6, label: '🙂 Fine (6)' },
    { value: 7, label: '🙂 Good (7)' },
    { value: 8, label: '😊 Very Good (8)' },
    { value: 9, label: '😄 Great (9)' },
    { value: 10, label: '😄 Excellent (10)' }
  ];

  const handleMoodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMoodRating(parseInt(e.target.value, 10));
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <label htmlFor="mood-rating" className={`block text-medium font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
        Mood Rating: {moodRating}/10
      </label>
      <input
        type="range"
        id="mood-rating"
        min="1"
        max="10"
        value={moodRating}
        onChange={handleMoodChange}
        className={`w-full h-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-lg appearance-none cursor-pointer`}
        disabled={isSubmitting}
      />
      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
        {moodOptions.find(option => option.value === moodRating)?.label}
      </div>
    </div>
  );
};

export default MoodRatingSlider;