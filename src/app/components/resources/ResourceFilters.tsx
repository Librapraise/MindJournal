// src/app/resources/components/ResourceFilters.tsx
import React from 'react';
import { Search, Bookmark, Filter } from 'lucide-react';

interface ResourceFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  savedOnly: boolean;
  setSavedOnly: (saved: boolean) => void;
  darkMode: boolean;
}

const ResourceFilters: React.FC<ResourceFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  savedOnly,
  setSavedOnly,
  darkMode,
}) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <input
            type="text"
            placeholder="Search resources..."
            className={`pl-10 pr-4 py-2 border ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
              savedOnly
                ? 'bg-indigo-100 text-indigo-700'
                : darkMode
                ? 'bg-gray-800 text-gray-300 border border-gray-700'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
            onClick={() => setSavedOnly(!savedOnly)}
          >
            <Bookmark className={`h-4 w-4 ${savedOnly ? 'text-indigo-700' : darkMode ? 'text-gray-400' : 'text-gray-500'} mr-1`} />
            Saved
          </button>
          {/* Placeholder for More Filters functionality */}
          <button className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
            darkMode
              ? 'bg-gray-800 text-gray-300 border border-gray-700'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}>
            <Filter className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-1`} />
            More Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceFilters;