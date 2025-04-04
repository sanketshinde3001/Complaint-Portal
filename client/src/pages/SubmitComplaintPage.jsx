import React, { useState, useRef } from 'react'; // Import useRef
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Use the configured Axios instance

// Example predefined tags (can be fetched from backend later if dynamic)
const PREDEFINED_TAGS = ['hostel', 'college', 'academics', 'infrastructure', 'boys only', 'girls only'];
// Add department names or allow custom tags
function SubmitComplaintPage() {
  const fileInputRef = useRef(null); // Create a ref for the file input
  const [text, setText] = useState('');
  const [tags, setTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]); // Store File objects
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
      setCustomTag(''); // Clear input after adding
    } else if (newTag) {
        // Optionally alert user if tag already exists or is predefined
        console.warn("Tag already exists or is predefined:", newTag);
        setCustomTag(''); // Clear input anyway
    }
  };

  const handleFileChange = (e) => {
    // Handle multiple files, limit count if needed
    if (e.target.files.length > 5) {
        setError("You can upload a maximum of 5 files.");
        setMediaFiles([]); // Clear selection
        e.target.value = null; // Reset file input
        return;
    }
    const newFiles = Array.from(e.target.files); // Get newly selected files

    // Combine existing and new files
    const combinedFiles = [...mediaFiles, ...newFiles];

    // Check total file count limit
    if (combinedFiles.length > 5) {
        setError("You can upload a maximum of 5 files in total.");
        // Optionally, reset the input to prevent adding the last batch
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
        return;
    }

    // Optional: Check for duplicates (based on name and size, for example)
    // This is a basic check, more robust checks might be needed
    const uniqueFiles = combinedFiles.reduce((acc, current) => {
        const x = acc.find(item => item.name === current.name && item.size === current.size);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, []);

     // Check if duplicates were removed and adjust limit check if necessary
    if (uniqueFiles.length > 5) {
        setError("You can upload a maximum of 5 unique files.");
         if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
        // Do not update state if limit exceeded after deduplication
        return;
    }


    setError(''); // Clear previous errors
    setMediaFiles(uniqueFiles); // Update state with combined and potentially deduplicated list

    // Important: Reset the file input's value after processing.
    // This allows selecting the same file again if it was removed or if the user wants to re-add it after clearing.
    if (fileInputRef.current) {
        fileInputRef.current.value = null;
    }
  };

  // Function to remove a selected file
  const handleRemoveFile = (indexToRemove) => {
    setMediaFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    // Reset the file input value if all files are removed to allow re-selection of the same file(s)
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

    // Use FormData for multipart request (including files)
    const formData = new FormData();
    formData.append('text', text);
    tags.forEach(tag => formData.append('tags[]', tag)); // Send tags as an array
    mediaFiles.forEach(file => {
      formData.append('media', file); // Append each file with the same field name 'media'
    });

    try {
      // Use api instance, content-type will be set automatically for FormData
      const response = await api.post('/complaints', formData, {
         headers: {
           // Axios sets Content-Type to multipart/form-data automatically
           // when you pass FormData as the body.
           // Ensure backend (Multer) is configured for field name 'media'.
         }
      });

      setSuccessMessage('Complaint submitted successfully! It will be reviewed by an admin.');
      // Clear form
      setText('');
      setTags([]);
      setCustomTag('');
      setMediaFiles([]);
      if (fileInputRef.current) { // Clear the file input visually
        fileInputRef.current.value = null;
      }
      // Optionally redirect after delay
      // setTimeout(() => navigate('/'), 3000);

    } catch (err) {
      console.error("Complaint submission failed:", err);
      setError(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold text-center mb-6">Submit a New Complaint</h1>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="text">
            Complaint Details
          </label>
          <textarea
            id="text"
            name="text"
            rows="6"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Describe your complaint in detail..."
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Tags</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
            {PREDEFINED_TAGS.map(tag => (
              <div key={tag} className="flex items-center">
                <input
                  type="checkbox"
                  id={`tag-${tag}`}
                  value={tag}
                  checked={tags.includes(tag)}
                  onChange={handleTagChange}
                  className="mr-2"
                />
                <label htmlFor={`tag-${tag}`} className="text-sm capitalize">{tag}</label>
              </div>
            ))}
          </div>
           <div className="flex items-center mt-2">
             <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add custom tag (e.g., department name)"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
             />
             <button
                type="button"
                onClick={handleAddCustomTag}
                className="bg-gray-500 hover:bg-gray-700 text-white text-sm font-bold py-2 px-3 rounded focus:outline-none focus:shadow-outline"
             >
                Add
             </button>
           </div>
           <div className="mt-2 text-sm text-gray-600">
             Selected tags: {tags.length > 0 ? tags.join(', ') : 'None'}
           </div>
        </div>


        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="media">
            Attach Media (Images/Videos, max 5 files, 20MB each)
          </label>
          <input
            type="file"
            id="media"
            name="media"
            multiple
            accept="image/jpeg,image/png,image/gif,video/mp4,video/mpeg,video/quicktime"
            onChange={handleFileChange}
            className="hidden" // Hide the default input
            ref={fileInputRef} // Add a ref to trigger click programmatically
          />
          {/* Custom Button to trigger file input */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Choose Files ({mediaFiles.length} selected)
          </button>

           {/* Display selected files */}
           {mediaFiles.length > 0 && (
             <div className="mt-4 border rounded p-3 space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Selected Files:</h4>
                <ul className="list-none space-y-1">
                  {mediaFiles.map((file, index) => (
                    <li key={index} className="flex justify-between items-center text-sm bg-gray-50 p-1.5 rounded">
                      <span>
                        {file.name} <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="ml-2 text-red-500 hover:text-red-700 text-xs font-semibold"
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

        <p className="text-sm text-gray-600 my-4">
            Your identity will remain anonymous to other students. Only administrators can see who submitted the complaint for verification purposes.
        </p>

        <div className="flex items-center justify-center">
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitComplaintPage;
