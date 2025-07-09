import axios from 'axios';

// Use environment variable or default to localhost in development
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios with credentials
axios.defaults.withCredentials = true;

// Add token to requests if available
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh or logout on 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access, redirecting to login');
      // You can add additional logic here if needed
    }
    return Promise.reject(error);
  }
);

export default axios;