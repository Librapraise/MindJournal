// components/InsightsCard.tsx
import React from 'react';

const InsightsCard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-medium font-bold text-gray-700 mb-3">Journal Insights</h3>
      <p className="text-xs text-gray-600 mb-3">
        View patterns and trends from your journal entries
      </p>
      <a 
        href="/insights"
        className="w-full inline-block text-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-100"
      >
        View Insights
      </a>
    </div>
  );
};

export default InsightsCard;