import api from './api';

const toAuthError = (error, fallbackMessage) => {
  const message =
    error?.data?.message ||
    error?.data?.error ||
    error?.message ||
    fallbackMessage;

  const authError = new Error(message);
  authError.status = error?.status;
  authError.data = error?.data;
  return authError;
};

// Register new user
export const registerUser = async (data) => {
  try {
    const response = await api.post('/auth/register', data);
    return response.data;
  } catch (error) {
    throw toAuthError(error, 'Registration failed. Please check your connection and try again.');
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
    throw toAuthError(error, 'Login failed. Please check your credentials and try again.');
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
