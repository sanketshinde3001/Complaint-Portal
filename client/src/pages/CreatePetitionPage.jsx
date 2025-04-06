import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPetition } from '../services/api'; // Import the API function

function CreatePetitionPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [demands, setDemands] = useState('');
  const [goal, setGoal] = useState(''); // Optional goal
  const [deadline, setDeadline] = useState(''); // Optional deadline
  const [tags, setTags] = useState(''); // Optional tags (comma-separated)
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!title.trim() || !description.trim() || !demands.trim()) {
      setError('Title, description, and demands are required.');
      return;
    }

    setIsLoading(true);

    const petitionData = {
      title: title.trim(),
      description: description.trim(),
      demands: demands.trim(),
      goal: goal ? parseInt(goal, 10) : undefined,
      deadline: deadline || undefined,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag), // Process tags
    };

    // Validate goal if provided
    if (petitionData.goal !== undefined && (isNaN(petitionData.goal) || petitionData.goal < 1)) {
        setError('Signature goal must be a positive number.');
        setIsLoading(false);
        return;
    }

    try {
      const response = await createPetition(petitionData);
      setSuccessMessage('Petition submitted successfully! It will be reviewed by an admin.');
      // Clear form
      setTitle('');
      setDescription('');
      setDemands('');
      setGoal('');
      setDeadline('');
      setTags('');
      // Optionally redirect after delay or provide link to view pending petitions
      // setTimeout(() => navigate('/petitions'), 3000); // Redirect to petitions list
      console.log('Created Petition:', response.data.data.petition);

    } catch (err) {
      console.error("Petition submission failed:", err);
      setError(err.response?.data?.message || 'Failed to submit petition.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
      <h1 className="text-2xl font-semibold text-center mb-6 dark:text-gray-100">Create a New Petition</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}

        <div>
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="title">
            Petition Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={150}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Concise title for your petition (max 150 chars)"
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="description">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Explain the issue and why change is needed."
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="demands">
            Demands / Proposed Solution <span className="text-red-500">*</span>
          </label>
          <textarea
            id="demands"
            rows="3"
            value={demands}
            onChange={(e) => setDemands(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Clearly state the specific action(s) you are requesting."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="goal">
                Signature Goal (Optional)
              </label>
              <input
                type="number"
                id="goal"
                min="1"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 100"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="deadline">
                Deadline (Optional)
              </label>
              <input
                type="date"
                id="deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
        </div>

         <div>
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="tags">
            Tags (Optional, comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., academics, infrastructure, policy"
          />
        </div>


        <div className="flex items-center justify-center pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Submitting...' : 'Submit Petition for Review'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePetitionPage;
