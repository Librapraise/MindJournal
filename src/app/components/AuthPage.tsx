"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Moon, Sun } from 'lucide-react';

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
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
            first_name: formData.firstName, // Make sure the field names match what backend expects
            last_name: formData.lastName, // Make sure the field names match what backend expects
            email: formData.email,
            password: formData.password
          });
          
          console.log('Signup response:', signupRes.data);
          setSuccessMessage('Account created successfully! Please log in.');
          
          // Clear form and switch to login
          setFormData({
            ...formData,
            firstName: '',
            lastName: '',
            confirmPassword: ''
          });
          setIsLogin(true);
          
        } catch (signupError) {
          handleApiError(signupError);
        }
      }
    } catch (error) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      {/* Background decorative element */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-cyan-500 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="relative z-10 bg-gray-900/40 backdrop-blur-xl backdrop-filter rounded-2xl shadow-2xl border border-gray-700/50 flex flex-col md:flex-row w-full max-w-5xl overflow-hidden">
        
        {/* Left Panel */}
        <div className="md:w-1/2 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-r border-gray-700/30 text-white p-10 flex flex-col justify-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-600 rounded-full opacity-20 blur-xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">MindAI Journal</h2>
            <p className="mb-6 text-gray-300">Your private space for reflection, growth, and mental wellness. Track your journey and gain insights.</p>
            <ul className="space-y-4">
              {[
                'Secure and private journaling',
                'AI-powered mood analytics',
                'Interactive AI Chat Companion',
                'Track emotional patterns',
                'Personalized insights',
                'Daily reflection prompts'
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center">
                  <span className="mr-3 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500/20 border border-blue-400/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Panel */}
        <div className="md:w-1/2 p-8 relative bg-gray-900/40">
          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`cursor-pointer px-6 py-2 focus:outline-none text-lg font-medium transition-all duration-300 rounded-l-lg ${
                isLogin 
                  ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border border-gray-700/50' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
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
              className={`cursor-pointer px-6 py-2 focus:outline-none text-lg font-medium transition-all duration-300 rounded-r-lg ${
                !isLogin 
                  ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border border-gray-700/50' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              type="button"
            >
              Sign Up
            </button>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="mb-6 p-3 bg-green-900/30 backdrop-blur-sm border border-green-500/30 text-green-300 rounded-lg text-center">
              {successMessage}
            </div>
          )}

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              onSubmit={handleSubmit}
              className="bg-gray-800/30 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg"
            >
              {!isLogin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-gray-200 placeholder-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-gray-200 placeholder-gray-500"
                      required
                    />
                  </div>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-gray-200 placeholder-gray-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-gray-200 placeholder-gray-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff size={20} className="text-gray-400" />
                    ) : (
                      <Eye size={20} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              {!isLogin && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-gray-200 placeholder-gray-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} className="text-gray-400" />
                      ) : (
                        <Eye size={20} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer font-medium w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 mt-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:hover:from-blue-600 disabled:hover:to-purple-600"
              >
                {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Display Error Message */}
          {errorMessage && (
            <div className="mt-6 p-3 bg-red-900/30 backdrop-blur-sm border border-red-500/30 text-red-300 rounded-lg text-center">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}