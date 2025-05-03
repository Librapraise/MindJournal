// components/JournalHeader.tsx
import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface JournalHeaderProps {
  isSubmitting: boolean;
  onSave: () => void;
  onSaveDraft: () => void;
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

const JournalHeader: React.FC<JournalHeaderProps> = ({
  isSubmitting,
  onSave,
  onSaveDraft,
  darkMode,
  toggleDarkMode,
}) => {
  const handleToggleDarkMode = () => {
    if (toggleDarkMode) {
      toggleDarkMode();
    }
  };

  return (
    <div className="flex justify-between items-center mb-6 mt-6 lg:mt-0">
      <h1 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>New Journal</h1>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleToggleDarkMode}
          className={`cursor-pointer p-2 rounded-full ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'
          } hover:bg-gray-300 dark:hover:bg-gray-600 transition`}
          aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
        >
          {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-800" />}
        </button>

        <button
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className={`cursor-pointer px-2 py-2 rounded-md text-[12px] font-medium border 
            ${darkMode 
              ? 'bg-gray-700 text-blue-200 border-blue-400 hover:bg-gray-600' 
              : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
            }`}
        >
          Save Draft
        </button>

        <button
          onClick={onSave}
          disabled={isSubmitting}
          className={`cursor-pointer px-2 py-2 text-[12px] md:px-4 md:py-2 md:text-sm rounded-md text-sm font-medium 
            ${darkMode 
              ? 'bg-blue-700 text-white hover:bg-blue-600' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          {isSubmitting ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
    </div>
  );
};

export default JournalHeader;
