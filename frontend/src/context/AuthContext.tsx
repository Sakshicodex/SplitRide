// src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {jwtDecode} from "jwt-decode";
import axios from '../utils/axiosInstance'; // Axios instance with interceptor
import { useNavigate, useLocation } from 'react-router-dom';

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
}

// Define the User type based on your backend's user model
interface User {
  _id: string;
  name: string;
  email: string;
}

// Define the shape of the decoded token
interface DecodedToken {
  id: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

// Create the AuthContext with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: false,
  error: null,
  clearError: () => {},
  login: async () => {},
  register: async () => {},
  verifyOtp: async () => {},
  logout: () => {},
});

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);

// Utility to check token expiration
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: DecodedToken = jwtDecode(token);
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // Treat invalid tokens as expired
  }
};

// AuthProvider component that wraps the application and provides the AuthContext
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to keep localStorage in sync with state
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, [user, token]);

  // Effect to handle token expiration
  useEffect(() => {
    if (token) {
      if (isTokenExpired(token)) {
        logout();
      } else {
        const decoded: DecodedToken = jwtDecode(token);
        const timeUntilExpiry = decoded.exp * 1000 - Date.now();

        const timeoutId = setTimeout(() => {
          logout(); // Log out when the token expires
        }, timeUntilExpiry);

        return () => clearTimeout(timeoutId); // Clear timeout on unmount
      }
    }
  }, [token]);

  // Effect to handle token from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthToken = params.get('token');

    if (oauthToken) {
      try {
        const decoded: DecodedToken = jwtDecode(oauthToken);
        setToken(oauthToken);
        setUser({
          _id: decoded.id,
          name: decoded.name,
          email: decoded.email,
        });
        localStorage.setItem('token', oauthToken);
        localStorage.setItem(
          'user',
          JSON.stringify({
            _id: decoded.id,
            name: decoded.name,
            email: decoded.email,
          })
        );

        params.delete('token');
        const newSearch = params.toString();
        navigate({
          pathname: '/',
          search: newSearch ? `?${newSearch}` : '',
        });
      } catch (error) {
        console.error('Invalid token received from OAuth:', error);
        setError('Authentication failed. Please try signing in again.');
        navigate('/sign-in');
      }
    }
  }, [location.search, navigate]);

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post('/users/signin', { email, password });
      setUser({ _id: data._id, name: data.name, email: data.email });
      setToken(data.token);
      navigate('/'); // Redirect to home or dashboard after login
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post('/users/signup', { name, email, password });
      navigate('/verify-otp', {
        state: { email: data.email, message: 'Signup successful! Please verify your email.' },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP function
  const verifyOtp = async (email: string, otp: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post('/users/verify-otp', { email, otp });
      navigate('/sign-in', {
        state: { message: 'Email verified successfully. Please sign in.' },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/sign-in'); // Redirect to sign-in page after logout
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, error, clearError, login, register, verifyOtp, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
