// components/TagManager.tsx
import React, { useState } from 'react';
import { TagIcon } from 'lucide-react';

interface TagManagerProps {
  tags: string[];
  updateTags: (tags: string[]) => void;
}

const TagManager: React.FC<TagManagerProps> = ({ tags, updateTags }) => {
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-3">
        <TagIcon size={16} className="text-gray-500 mr-2" />
        <h3 className="text-medium font-bold text-gray-700">Tags</h3>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag) => (
          <div
            key={tag}
            className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md flex items-center"
          >
            <span>{tag}</span>
            <button
              onClick={() => removeTag(tag)}
              className="cursor-pointer ml-1 text-blue-500 hover:text-blue-700"
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
          className="mt-1 block w-full border border-gray-300 p-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <p className="text-xs text-gray-500 mt-2">
          Type a tag and press Enter
        </p>
      </div>
    </div>
  );
};

export default TagManager;