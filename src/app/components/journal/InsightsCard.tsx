// components/InsightsCard.tsx
import React from 'react';

interface InsightsCardProps {
  darkMode?: boolean;
}

const InsightsCard: React.FC<InsightsCardProps> = ({ darkMode = false }) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <h3 className={`text-medium font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-3`}>Journal Insights</h3>
      <p className={`text-xs ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-3`}>
        View patterns and trends from your journal entries
      </p>
      <a 
        href="/insights"
        className={`w-full inline-block text-center px-4 py-2 rounded-md text-sm font-medium 
          ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
      >
        View Insights
      </a>
    </div>
  );
};

export default InsightsCard;