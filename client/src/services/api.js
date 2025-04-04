const API_URL = import.meta.env.VITE_API_BASE_URL;

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

export default api;
