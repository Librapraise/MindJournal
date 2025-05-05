// src/app/resources/components/ResourceCard.tsx
import React from 'react';
import { Clock, Star, Bookmark, ArrowRight } from 'lucide-react';
import { Resource, createSnippet, getCategoryIcon } from '@/app/utils/resourceUtils'; // Assuming types/utils are in utils

interface LocalResource {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  category: string;
  duration: string;
  tags: string[]; // Ensure tags is typed as an array of strings
  rating: number;
  isSaved: boolean;
}

interface ResourceCardProps {
  resource: LocalResource;
  darkMode: boolean;
  onBookmark: (id: string) => void;
  onView: (resource: LocalResource) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, darkMode, onBookmark, onView }) => {
  return (
    <div key={resource.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
      {resource.imageUrl && (
        <div className="h-48 overflow-hidden">
          {/* Use next/image for optimization if using Next.js */}
          <img src={resource.imageUrl} alt={resource.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center mb-3">
          {getCategoryIcon(resource.category)}
          <span className={`ml-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} capitalize`}>{resource.category}</span>
          <div className="ml-auto flex items-center">
            <Clock className={`h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'} mr-1`} />
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{resource.duration}</span>
          </div>
        </div>

        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{resource.title}</h3>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-4`}>{createSnippet(resource.body)}</p>

        <div className="flex flex-wrap gap-1 mb-4">
          {resource.tags.map((tag, index) => (
            <span
              key={index}
              className={`text-xs px-2 py-1 ${
                darkMode
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              } rounded-full`}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{resource.rating}</span>
          </div>

          <div className="flex space-x-2">
            <button
              className={`p-2 ${darkMode ? 'text-gray-400 hover:text-indigo-400' : 'text-gray-500 hover:text-indigo-600'}`}
              onClick={() => onBookmark(resource.id)}
              aria-label={resource.isSaved ? 'Unsave resource' : 'Save resource'}
            >
              <Bookmark
                className={`h-5 w-5 ${
                  resource.isSaved
                    ? 'text-indigo-600 fill-indigo-600'
                    : darkMode
                    ? 'text-gray-400'
                    : 'text-gray-400'
                }`}
              />
            </button>
            <button
              className={`cursor-pointer flex items-center ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} font-medium text-sm hover:text-indigo-800`}
              onClick={() => onView(resource)}
            >
              View
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;