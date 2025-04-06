const API_URL = import.meta.env.VITE_API_BASE_URL;
import axios from 'axios'; 

console.log('VITE_API_BASE_URL:', API_URL); // ✅ This should be correct in production

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Comment API Functions ---

/**
 * Fetches comments for a specific complaint.
 * @param {string} complaintId - The ID of the complaint.
 * @returns {Promise<object>} - The API response data.
 */
export const getComments = (complaintId) => {
  return api.get(`/complaints/${complaintId}/comments`);
};

/**
 * Posts a new comment or reply.
 * @param {string} complaintId - The ID of the complaint.
 * @param {string} text - The comment text.
 * @param {string|null} parentCommentId - The ID of the parent comment if it's a reply, otherwise null.
 * @returns {Promise<object>} - The API response data containing the new comment.
 */
export const postComment = (complaintId, text, parentCommentId = null) => {
  const payload = { text };
  if (parentCommentId) {
    payload.parentCommentId = parentCommentId;
  }
  return api.post(`/complaints/${complaintId}/comments`, payload);
};

// --- Petition API Functions ---

/**
 * Fetches all approved petitions (add query params for sorting/filtering later).
 * @param {object} params - Optional query parameters (e.g., { sort: 'popular' }).
 * @returns {Promise<object>} - The API response data.
 */
export const getPetitions = (params = {}) => {
  return api.get('/petitions', { params });
};

/**
 * Fetches a single petition by its ID.
 * @param {string} petitionId - The ID of the petition.
 * @returns {Promise<object>} - The API response data.
 */
export const getPetition = (petitionId) => {
  return api.get(`/petitions/${petitionId}`);
};

/**
 * Creates a new petition.
 * @param {object} petitionData - Data for the new petition (title, description, demands, etc.).
 * @returns {Promise<object>} - The API response data containing the new petition.
 */
export const createPetition = (petitionData) => {
  return api.post('/petitions', petitionData);
};

/**
 * Signs a specific petition.
 * @param {string} petitionId - The ID of the petition to sign.
 * @returns {Promise<object>} - The API response data.
 */
export const signPetition = (petitionId) => {
  return api.post(`/petitions/${petitionId}/sign`);
};

// --- Admin Petition API Functions ---

/**
 * Fetches pending petitions for admin review.
 * @returns {Promise<object>} - The API response data.
 */
export const getPendingPetitionsAdmin = () => {
  return api.get('/admin/petitions/pending');
};

/**
 * Updates the status of a petition (admin only).
 * @param {string} petitionId - The ID of the petition.
 * @param {string} status - The new status ('approved', 'rejected', 'closed').
 * @param {string} [adminNotes] - Optional notes from the admin.
 * @returns {Promise<object>} - The API response data.
 */
export const updatePetitionStatusAdmin = (petitionId, status, adminNotes = '') => {
  return api.patch(`/admin/petitions/${petitionId}/status`, { status, adminNotes });
};

/**
 * Deletes a petition (admin only).
 * @param {string} petitionId - The ID of the petition to delete.
 * @returns {Promise<object>} - The API response data (likely empty on success).
 */
export const deletePetitionAdmin = (petitionId) => {
  return api.delete(`/admin/petitions/${petitionId}`);
};


// Export the configured instance as default AND named exports for functions
export default api;
