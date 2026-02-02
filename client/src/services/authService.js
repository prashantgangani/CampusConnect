import axios from 'axios';

// Create axios instance with base URL from environment variable
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Register new user
export const registerUser = async (data) => {
  try {
    const response = await api.post('/auth/register', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};

// Login user
export const loginUser = async (data) => {
  try {
    const response = await api.post('/auth/login', data);
    
    // Store token in localStorage if login successful
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};
