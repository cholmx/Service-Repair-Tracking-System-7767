import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { useAuth } from '../../contexts/AuthContext';

const { FiCrown, FiClock } = FiIcons;

const SubscriptionBanner = ({ onUpgrade }) => {
  const { userProfile, isTrialExpired } = useAuth();

  if (!userProfile || userProfile.subscription_tier !== 'free') return null;

  const trialDaysLeft = userProfile.trial_ends_at ? 
    Math.max(0, Math.ceil((new Date(userProfile.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 p-4 rounded-lg border-2 ${
        isTrialExpired ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SafeIcon 
            icon={isTrialExpired ? FiClock : FiCrown} 
            className={`text-xl ${isTrialExpired ? 'text-red-500' : 'text-yellow-500'}`} 
          />
          <div>
            <h3 className={`font-medium ${isTrialExpired ? 'text-red-800' : 'text-yellow-800'}`}>
              {isTrialExpired ? 'Trial Expired' : `Free Trial - ${trialDaysLeft} days left`}
            </h3>
            <p className={`text-sm ${isTrialExpired ? 'text-red-600' : 'text-yellow-600'}`}>
              {isTrialExpired 
                ? 'Upgrade to continue using all features'
                : 'Upgrade now to unlock unlimited service orders and premium features'
              }
            </p>
          </div>
        </div>
        <button
          onClick={onUpgrade}
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            isTrialExpired 
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          }`}
        >
          Upgrade Now
        </button>
      </div>
    </motion.div>
  );
};

export default SubscriptionBanner;