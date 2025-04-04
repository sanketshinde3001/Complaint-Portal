import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Example predefined tags
const PREDEFINED_TAGS = ['hostel', 'college', 'academics', 'infrastructure', 'boys only', 'girls only'];

function SubmitComplaintPage() {
  const fileInputRef = useRef(null);
  const [text, setText] = useState('');
  const [tags, setTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleTagChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setTags([...tags, value]);
    } else {
      setTags(tags.filter(tag => tag !== value));
    }
  };

  const handleAddCustomTag = () => {
    const newTag = customTag.trim().toLowerCase();
    if (newTag && !tags.includes(newTag) && !PREDEFINED_TAGS.includes(newTag)) {
      setTags([...tags, newTag]);
      setCustomTag('');
    } else if (newTag) {
      console.warn("Tag already exists or is predefined:", newTag);
      setCustomTag('');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 5) {
      setError("You can upload a maximum of 5 files.");
      setMediaFiles([]);
      e.target.value = null;
      return;
    }
    
    const newFiles = Array.from(e.target.files);
    const combinedFiles = [...mediaFiles, ...newFiles];

    if (combinedFiles.length > 5) {
      setError("You can upload a maximum of 5 files in total.");
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      return;
    }

    const uniqueFiles = combinedFiles.reduce((acc, current) => {
      const x = acc.find(item => item.name === current.name && item.size === current.size);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    if (uniqueFiles.length > 5) {
      setError("You can upload a maximum of 5 unique files.");
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      return;
    }

    setError('');
    setMediaFiles(uniqueFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setMediaFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    if (mediaFiles.length === 1 && fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!text.trim()) {
      setError('Complaint text cannot be empty.');
      return;
    }
    if (tags.length === 0) {
      setError('Please select or add at least one tag.');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('text', text);
    tags.forEach(tag => formData.append('tags[]', tag));
    mediaFiles.forEach(file => {
      formData.append('media', file);
    });

    try {
      const response = await api.post('/complaints', formData);
      setSuccessMessage('Complaint submitted successfully! It will be reviewed by an admin.');
      setText('');
      setTags([]);
      setCustomTag('');
      setMediaFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    } catch (err) {
      console.error("Complaint submission failed:", err);
      setError(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-6 p-6 bg-gray-900 rounded-lg shadow-lg text-gray-200">
      <h1 className="text-2xl font-bold text-center mb-6 text-white">Submit a New Complaint</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>}
        
        {successMessage && <div className="bg-green-900/40 border border-green-500 text-green-300 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>}

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="text">
            Complaint Details
          </label>
          <textarea
            id="text"
            name="text"
            rows="6"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            className="shadow-sm bg-gray-800 border border-gray-700 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your complaint in detail..."
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Tags</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {PREDEFINED_TAGS.map(tag => (
              <div key={tag} className="flex items-center">
                <input
                  type="checkbox"
                  id={`tag-${tag}`}
                  value={tag}
                  checked={tags.includes(tag)}
                  onChange={handleTagChange}
                  className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-700 rounded bg-gray-800"
                />
                <label htmlFor={`tag-${tag}`} className="ml-2 text-sm capitalize text-gray-300">{tag}</label>
              </div>
            ))}
          </div>
          
          <div className="flex items-center mt-3">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="Add custom tag (e.g., department name)"
              className="shadow-sm bg-gray-800 border border-gray-700 rounded flex-1 py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddCustomTag}
              className="ml-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Add
            </button>
          </div>
          
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-800 hover:text-blue-200 focus:outline-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="media">
            Attach Media (Images/Videos, max 5 files, 20MB each)
          </label>
          <input
            type="file"
            id="media"
            name="media"
            multiple
            accept="image/jpeg,image/png,image/gif,video/mp4,video/mpeg,video/quicktime"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Choose Files ({mediaFiles.length}/5)
          </button>

          {mediaFiles.length > 0 && (
            <div className="mt-4 border border-gray-700 rounded p-3 bg-gray-800/50">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Selected Files:</h4>
              <ul className="space-y-2">
                {mediaFiles.map((file, index) => (
                  <li key={index} className="flex justify-between items-center text-sm bg-gray-800 p-2 rounded border border-gray-700">
                    <span className="truncate max-w-xs">
                      {file.name} <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="ml-2 text-red-400 hover:text-red-300 focus:outline-none"
                      aria-label={`Remove ${file.name}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-md bg-gray-800 p-4 border border-gray-700">
          <p className="text-sm text-gray-400">
            Your identity will remain anonymous to other students. Only administrators can see who submitted the complaint for verification purposes.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitComplaintPage;