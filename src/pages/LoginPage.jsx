import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiTool, FiShield, FiZap, FiUsers, FiAlertCircle, FiMail, FiLock, FiUser, FiBuilding, FiEye, FiEyeOff, FiCheck } = FiIcons;

const LoginPage = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user is already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    console.log('LoginPage: Form submitted:', { mode, email: formData.email });

    try {
      let result;
      if (mode === 'signin') {
        console.log('LoginPage: Attempting sign in...');
        result = await signIn(formData.email, formData.password);
      } else {
        console.log('LoginPage: Attempting sign up...');
        
        if (!formData.firstName || !formData.lastName) {
          setError('First name and last name are required');
          setIsSubmitting(false);
          return;
        }
        
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          setIsSubmitting(false);
          return;
        }
        
        result = await signUp(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName,
          formData.companyName
        );
      }

      console.log('LoginPage: Auth result:', { success: !result.error, error: result.error });

      if (result.error) {
        console.error('LoginPage: Auth error:', result.error);
        
        // Handle specific error cases
        if (result.error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (result.error.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (result.error.message.includes('Password should be at least 6 characters')) {
          setError('Password must be at least 6 characters long.');
        } else if (result.error.message.includes('Unable to validate email address')) {
          setError('Please enter a valid email address.');
        } else {
          setError(result.error.message || 'An error occurred. Please try again.');
        }
      } else {
        console.log('LoginPage: Auth successful');
        
        if (mode === 'signup') {
          setSuccess('Account created successfully! You can now access your dashboard.');
        } else {
          setSuccess('Signed in successfully! Redirecting...');
        }
        
        // Clear form
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          companyName: ''
        });
      }
    } catch (error) {
      console.error('LoginPage: Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const features = [
    {
      icon: FiTool,
      title: 'Service Management',
      description: 'Track and manage all your service orders in one place'
    },
    {
      icon: FiShield,
      title: 'Secure & Reliable',
      description: 'Your data is protected with enterprise-grade security'
    },
    {
      icon: FiZap,
      title: 'Lightning Fast',
      description: 'Quick intake and real-time status updates'
    },
    {
      icon: FiUsers,
      title: 'Customer Portal',
      description: 'Keep your customers informed throughout the process'
    }
  ];

  const inputClasses = "w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-neutral-50 flex">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700"></div>
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/3 right-10 w-16 h-16 bg-white bg-opacity-10 rounded-full blur-lg"></div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center space-x-3 mb-8">
              <SafeIcon icon={FiTool} className="text-4xl" />
              <h1 className="text-4xl font-bold">ServiceTracker</h1>
            </div>

            <h2 className="text-3xl font-bold mb-6 leading-tight">
              {mode === 'signin' ? 'Welcome Back to Your' : 'Start Your Journey with'} <br />
              Service Management Hub
            </h2>

            <p className="text-xl text-primary-100 mb-12 leading-relaxed">
              Streamline your repair business with powerful tools for tracking, managing, and delivering exceptional service experiences.
            </p>

            <div className="grid grid-cols-1 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <SafeIcon icon={feature.icon} className="text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-primary-100 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <SafeIcon icon={FiTool} className="text-3xl text-primary-500" />
              <h1 className="text-3xl font-bold text-neutral-900">ServiceTracker</h1>
            </div>
            <p className="text-neutral-600">
              {mode === 'signin' ? 'Sign in to manage your service orders' : 'Create your account to get started'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-neutral-200">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-neutral-600">
                {mode === 'signin' 
                  ? 'Sign in to access your service dashboard' 
                  : 'Start managing your service orders today'
                }
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                <SafeIcon icon={FiCheck} className="text-green-500 mr-2" />
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <SafeIcon icon={FiAlertCircle} className="text-red-500 mr-2" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {(loading || isSubmitting) && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                <p className="text-blue-700 text-sm">
                  {mode === 'signin' ? 'Signing you in...' : 'Creating your account...'}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <SafeIcon icon={FiUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={inputClasses}
                        required
                      />
                    </div>
                    <div className="relative">
                      <SafeIcon icon={FiUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={inputClasses}
                        required
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <SafeIcon icon={FiBuilding} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      name="companyName"
                      placeholder="Company Name (Optional)"
                      value={formData.companyName}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                </>
              )}

              <div className="relative">
                <SafeIcon icon={FiMail} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClasses}
                  required
                />
              </div>

              <div className="relative">
                <SafeIcon icon={FiLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClasses}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <SafeIcon icon={showPassword ? FiEyeOff : FiEye} />
                </button>
              </div>

              {mode === 'signup' && (
                <div className="text-xs text-neutral-500">
                  Password must be at least 6 characters long
                </div>
              )}

              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading || isSubmitting 
                  ? 'Please wait...' 
                  : (mode === 'signin' ? 'Sign In' : 'Create Account')
                }
              </button>
            </form>

            <div className="mt-6 text-center">
              {mode === 'signin' ? (
                <p className="text-neutral-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signup');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-primary-500 hover:text-primary-600 font-medium"
                  >
                    Sign up for free
                  </button>
                </p>
              ) : (
                <p className="text-neutral-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signin');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-primary-500 hover:text-primary-600 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>

            {mode === 'signup' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm text-center">
                  ✨ Start with a 14-day free trial! No credit card required.
                </p>
              </div>
            )}

            {/* Demo Account Info */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm text-center font-medium mb-2">
                🚀 Quick Demo Access
              </p>
              <p className="text-blue-600 text-xs text-center">
                Create a new account or use your existing credentials to access the full ServiceTracker experience
              </p>
            </div>
          </div>

          {/* Mobile Features */}
          <div className="lg:hidden mt-8 grid grid-cols-2 gap-4">
            {features.slice(0, 4).map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200"
              >
                <SafeIcon icon={feature.icon} className="text-2xl text-primary-500 mb-2" />
                <h3 className="font-semibold text-sm text-neutral-900 mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;