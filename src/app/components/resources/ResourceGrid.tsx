// src/app/resources/components/ResourceGrid.tsx
import React from 'react';
import { Search } from 'lucide-react';
import ResourceCard from './ResourceCard';
import { Resource } from '@/app/utils/resourceUtils'; // Assuming types are in utils

interface ResourceGridProps {
  resources: Resource[];
  loading: boolean;
  error: string | null;
  darkMode: boolean;
  onBookmark: (id: string) => void;
  onView: (resource: Resource) => void;
  onRetry: () => void;
}

const ResourceGrid: React.FC<ResourceGridProps> = ({
  resources,
  loading,
  error,
  darkMode,
  onBookmark,
  onView,
  onRetry
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-indigo-400' : 'border-indigo-500'}`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
        <p>{error}</p>
        <button
          className={`mt-4 px-4 py-2 ${darkMode ? 'bg-indigo-700' : 'bg-indigo-600'} text-white rounded-lg hover:opacity-90`}
          onClick={onRetry}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className={`col-span-1 md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-12 px-4 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <Search className={`h-12 w-12 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mb-4`} />
        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>No resources found</h3>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          Try adjusting your filters or search terms to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          darkMode={darkMode}
          onBookmark={onBookmark}
          onView={(resource) => onView({ ...resource, category: resource.category as "article" | "audio" | "video" | "exercise" })}
        />
      ))}
    </div>
  );
};

export default ResourceGrid;