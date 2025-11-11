import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { useAuth } from '../../contexts/AuthContext';

const { FiX, FiMail, FiLock, FiUser, FiBuilding, FiEye, FiEyeOff } = FiIcons;

const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      
      if (mode === 'signin') {
        result = await signIn(formData.email, formData.password);
      } else {
        if (!formData.firstName || !formData.lastName) {
          setError('First name and last name are required');
          setLoading(false);
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

      if (result.error) {
        setError(result.error.message);
      } else {
        onClose();
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          companyName: ''
        });
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  const inputClasses = "w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 font-display">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors duration-200"
          >
            <SafeIcon icon={FiX} className="text-xl" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Please wait...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          {mode === 'signin' ? (
            <p className="text-neutral-600">
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Sign up for free
              </button>
            </p>
          ) : (
            <p className="text-neutral-600">
              Already have an account?{' '}
              <button
                onClick={() => setMode('signin')}
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
      </motion.div>
    </div>
  );
};

export default AuthModal;