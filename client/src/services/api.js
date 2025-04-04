import axios from 'axios';

// Configure base URL for backend API
// Make sure the backend server is running on port 5000 (or adjust if different)
const API_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_URL,
  // REMOVED default Content-Type header. Axios will set it automatically.
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

// Optional: Add interceptor to include JWT token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Example: Get token from local storage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
