import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

if (!import.meta.env.VITE_API_URL) {
  console.warn('[api] Missing VITE_API_URL. Falling back to development URL:', API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Required for httpOnly cookies
  timeout: 15000, // 15-second timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Response interceptor for centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response || error);
    const message = error.response?.data?.message || 'Something went wrong';
    
    if (error.response?.status === 401) {
      // Unauthorized - clear any local state if needed and redirect
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;