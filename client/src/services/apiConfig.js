import axios from 'axios';

// Use the API URL from environment when provided. Otherwise, default to the
// same origin as the current page so the client works in production
// deployments where the backend serves the frontend. Fall back to localhost
// for tests or non-browser environments.
const defaultApiUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}/api`
    : 'http://localhost:8080/api';

export const API_URL = process.env.REACT_APP_API_URL || defaultApiUrl;

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
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      // Only act on unauthorized responses when a token is present
      console.log('Unauthorized access, redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;