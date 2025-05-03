// components/TagManager.tsx
import React, { useState } from 'react';
import { TagIcon } from 'lucide-react';

interface TagManagerProps {
  tags: string[];
  updateTags: (tags: string[]) => void;
  darkMode?: boolean;
}

const TagManager: React.FC<TagManagerProps> = ({ tags, updateTags, darkMode = false }) => {
  const [newTag, setNewTag] = useState('');

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        updateTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <div className="flex items-center mb-3">
        <TagIcon size={16} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`} />
        <h3 className={`text-medium font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Tags</h3>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag) => (
          <div
            key={tag}
            className={`${
              darkMode 
                ? 'bg-blue-900 text-blue-200' 
                : 'bg-blue-50 text-blue-700'
            } text-xs px-2 py-1 rounded-md flex items-center`}
          >
            <span>{tag}</span>
            <button
              onClick={() => removeTag(tag)}
              className={`cursor-pointer ml-1 ${
                darkMode 
                  ? 'text-blue-300 hover:text-blue-100' 
                  : 'text-blue-500 hover:text-blue-700'
              }`}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <div>
        <input
          type="text"
          value={newTag}
          onChange={handleTagInputChange}
          onKeyDown={handleTagKeyDown}
          placeholder="Add tags..."
          className={`mt-1 block w-full border ${
            darkMode 
              ? 'border-gray-700 bg-gray-800 text-gray-200 focus:ring-indigo-400 focus:border-indigo-400' 
              : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800'
          } p-2 rounded-md sm:text-sm`}
        />
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
          Type a tag and press Enter
        </p>
      </div>
    </div>
  );
};

export default TagManager;