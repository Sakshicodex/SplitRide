import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api/', // Replace with your API base URL
  timeout: 10000, // Optional: Set a timeout for requests
});

// Add a request interceptor to include the token in headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Retrieve token from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Add the token to Authorization header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or unauthorized, clear storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/sign-in'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
