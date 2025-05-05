// src/app/resources/components/PageHeader.tsx
import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface PageHeaderProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ darkMode, toggleTheme }) => {
  return (
    <div className="flex justify-between items-center mb-6 mt-6 lg:mt-0">
      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Mental Health Resources
      </h2>
      <button
        onClick={toggleTheme}
        className={`cursor-pointer p-2 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-700'} hover:opacity-80 transition-colors`}
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </div>
  );
};

export default PageHeader;