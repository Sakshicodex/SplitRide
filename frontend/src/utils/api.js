// frontend/src/utils/api.js

import axios from 'axios';

// Create an Axios instance with the base URL of your backend
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});
// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Adjust if you store it differently
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Signup API call
export const signup = async (name, email, password) => {
  const response = await api.post('/users/signup', { name, email, password });
  return response.data;
};

// Verify OTP API call
export const verifyOtp = async (email, otp) => {
  const response = await api.post('/users/verify-otp', { email, otp });
  return response.data;
};

// Signin API call
export const signin = async (email, password) => {
  const response = await api.post('/users/signin', { email, password });
  return response.data;
};

// Google Maps Distance Matrix API call
export const getDistanceMatrix = async (origins, destinations) => {
  const response = await api.get('/distance', {
    params: { origins, destinations },
  });
  return response.data;
};

export default api;
