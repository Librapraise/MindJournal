"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// Base URL constant 
const API_BASE_URL = 'https://mentalheathapp.vercel.app/users';

// Setup axios defaults
axios.defaults.headers.post['Content-Type'] = 'application/json';

// Create axios instance for authenticated requests
const authAxios = axios.create();

// Add a request interceptor to include the token in all requests
authAxios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Optional: Verify token validity with the backend
      // For now, just redirect if token exists
      router.push('/dashboard');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear messages when user starts typing
    if (errorMessage) setErrorMessage('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Client-side validation
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match!');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      
      if (isLogin) {
        // Login flow
        // The backend expects form data with username and password for OAuth2
        const formPayload = new URLSearchParams();
        formPayload.append('username', formData.email); // Note: backend expects 'username' even though it's an email
        formPayload.append('password', formData.password);
        
        const loginRes = await axios.post(`${API_BASE_URL}/token`, formPayload, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        console.log('Login response:', loginRes.data);
        
        if (loginRes.data.access_token) {
          localStorage.setItem('token', loginRes.data.access_token);
          router.push('/dashboard');
        } else {
          setErrorMessage('Login successful but no token received');
        }
      } else {
        // Registration flow
        try {
          const signupRes = await axios.post(API_BASE_URL, {
            full_name: formData.fullName, // Make sure the field names match what backend expects
            email: formData.email,
            password: formData.password
          });
          
          console.log('Signup response:', signupRes.data);
          setSuccessMessage('Account created successfully! Please log in.');
          
          // Clear form and switch to login
          setFormData({
            ...formData,
            fullName: '',
            confirmPassword: ''
          });
          setIsLogin(true);
          
        } catch (signupError: any) {
          handleApiError(signupError);
        }
      }
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (error: any) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // The server responded with an error status
      console.error('Error response:', error.response.data);
      
      // Handle common error codes
      switch (error.response.status) {
        case 400:
          setErrorMessage(error.response.data.detail || 'Invalid request data');
          break;
        case 401:
          setErrorMessage('Invalid email or password');
          break;
        case 409:
          setErrorMessage('Email already exists');
          break;
        case 422:
          // Validation errors from FastAPI
          const validationErrors = error.response.data.detail;
          if (Array.isArray(validationErrors) && validationErrors.length > 0) {
            setErrorMessage(`Validation error: ${validationErrors[0].msg} at ${validationErrors[0].loc.join('.')}`);
          } else {
            setErrorMessage('Validation error in submitted data');
          }
          break;
        default:
          setErrorMessage(error.response.data.detail || 'Server error. Please try again.');
      }
    } else if (error.request) {
      // Request made but no response received
      setErrorMessage('Unable to connect to server. Please check your internet connection.');
    } else {
      // Something happened in setting up the request
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-lg flex flex-col md:flex-row w-full max-w-5xl overflow-hidden">
        
        {/* Left Panel */}
        <div className="md:w-1/2 bg-gradient-to-b from-blue-500 to-blue-400 text-white p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-4">MindJournal</h2>
          <p className="mb-6">Your private space for reflection, growth, and mental wellness. Track your journey and gain insights.</p>
          <ul className="space-y-3">
            {[
              'Secure and private journaling',
              'AI-powered mood analytics',
              'Track emotional patterns',
              'Personalized insights',
              'Daily reflection prompts'
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center">
                <span className="text-lg mr-2">✔️</span> {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Right Panel */}
        <div className="md:w-1/2 p-8">
          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`cursor-pointer px-4 py-2 focus:outline-none text-lg font-semibold transition-all duration-300 ${isLogin ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              type="button"
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`cursor-pointer px-4 py-2 focus:outline-none text-lg font-semibold transition-all duration-300 ${!isLogin ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              type="button"
            >
              Sign Up
            </button>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="mb-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded text-center">
              {successMessage}
            </div>
          )}

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              onSubmit={handleSubmit}
            >
              {!isLogin && (
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
              {!isLogin && (
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer font-bold w-full bg-blue-500 text-white py-2 mt-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Display Error Message */}
          {errorMessage && (
            <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-center">
              {errorMessage}
            </div>
          )}

          {/* Social Logins 
          <div className="text-center mt-6">
            <p className="text-sm text-gray-400">Or continue with</p>
            <div className="flex justify-center gap-4 mt-3">
              {['G', 'f', 'in'].map((social, idx) => (
                <button 
                  key={idx} 
                  type="button"
                  className="cursor-pointer w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all"
                >
                  {social}
                </button>
              ))}
            </div>
          </div>
          */}

          {/* Forgot Password
          {isLogin && (
            <div className="text-center mt-4">
              <a href="#" className="text-blue-500 text-sm hover:underline">
                Forgot Password?
              </a>
            </div>
          )}
          */}
        </div>
      </div>
    </div>
  );
}