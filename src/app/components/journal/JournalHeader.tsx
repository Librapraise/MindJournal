// components/JournalHeader.tsx
import React from 'react';

interface JournalHeaderProps {
  isSubmitting: boolean;
  onSave: () => void;
  onSaveDraft: () => void;
}

const JournalHeader: React.FC<JournalHeaderProps> = ({ isSubmitting, onSave, onSaveDraft }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-xl font-semibold text-gray-800">New Journal Entry</h1>
      <div className="flex space-x-2">
        <button
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="cursor-pointer px-4 py-2 bg-white border border-blue-300 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          Save Draft
        </button>
        <button
          onClick={onSave}
          disabled={isSubmitting}
          className="cursor-pointer px-3 py-2 text-[12px] md:px-4 md:py-2 md:text-sm bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700"
        >
          {isSubmitting ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
    </div>
  );
};

export default JournalHeader;