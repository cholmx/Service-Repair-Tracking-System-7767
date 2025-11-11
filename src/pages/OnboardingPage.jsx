import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OnBoarding } from '@questlabs/react-sdk';
import { useQuestAuth } from '../contexts/QuestAuthContext';
import questConfig from '../config/questConfig';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiTool, FiTarget, FiRocket, FiStar, FiCheckCircle } = FiIcons;

const OnboardingPage = () => {
  const { isAuthenticated, user, completeOnboarding, isOnboardingCompleted } = useQuestAuth();
  const [answers, setAnswers] = useState({});
  const [isCompleting, setIsCompleting] = useState(false);

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if onboarding already completed
  if (isOnboardingCompleted()) {
    return <Navigate to="/dashboard" replace />;
  }

  const userId = user.userId || localStorage.getItem('quest_userId');
  const token = user.token || localStorage.getItem('quest_token');

  const handleOnboardingComplete = (data) => {
    console.log('Onboarding completed:', data);
    setIsCompleting(true);
    
    // Complete onboarding
    completeOnboarding();
    
    // Small delay to ensure state is updated
    setTimeout(() => {
      window.location.href = '#/dashboard';
    }, 100);
  };

  const handleSkipOnboarding = () => {
    console.log('Skipping onboarding...');
    completeOnboarding();
    window.location.href = '#/dashboard';
  };

  const steps = [
    {
      icon: FiTarget,
      title: 'Set Your Goals',
      description: 'Define what success looks like for your service business'
    },
    {
      icon: FiRocket,
      title: 'Configure Settings',
      description: 'Customize ServiceTracker to match your workflow'
    },
    {
      icon: FiStar,
      title: 'Ready to Go',
      description: 'Start managing your service orders efficiently'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-neutral-50 flex">
      {/* Left Section - Welcome & Steps */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700"></div>
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-24 h-24 bg-white bg-opacity-10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-white bg-opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full blur-lg"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center space-x-3 mb-8">
              <SafeIcon icon={FiTool} className="text-4xl" />
              <h1 className="text-4xl font-bold font-display">ServiceTracker</h1>
            </div>
            
            <h2 className="text-3xl font-bold mb-6 leading-tight font-display">
              Let's Get You <br />
              Set Up for Success
            </h2>
            
            <p className="text-xl text-primary-100 mb-12 leading-relaxed">
              We'll help you configure ServiceTracker to perfectly match your business needs. This will only take a few minutes.
            </p>
            
            <div className="space-y-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <SafeIcon icon={step.icon} className="text-xl" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                    </div>
                    <p className="text-primary-100 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-12 p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm border border-white border-opacity-20"
            >
              <div className="flex items-center space-x-3 mb-3">
                <SafeIcon icon={FiCheckCircle} className="text-2xl text-green-300" />
                <h3 className="font-semibold text-lg">Quick Setup Promise</h3>
              </div>
              <p className="text-primary-100 text-sm leading-relaxed">
                This onboarding process is designed to be completed in under 5 minutes. You can always modify these settings later from your dashboard.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Section - Onboarding Component */}
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
              <h1 className="text-3xl font-bold text-neutral-900 font-display">ServiceTracker</h1>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2 font-display">
              Let's Get Started!
            </h2>
            <p className="text-neutral-600">
              We're setting up ServiceTracker just for you
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
            {/* Loading State */}
            {isCompleting && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-neutral-600">Completing setup...</p>
              </div>
            )}

            {/* Onboarding Component */}
            {!isCompleting && (
              <div className="quest-onboarding-container" style={{ minHeight: '400px' }}>
                {userId && token ? (
                  <OnBoarding
                    userId={userId}
                    token={token}
                    questId={questConfig.QUEST_ONBOARDING_QUESTID}
                    apiKey={questConfig.APIKEY}
                    entityId={questConfig.ENTITYID}
                    answer={answers}
                    setAnswer={setAnswers}
                    getAnswers={handleOnboardingComplete}
                    accent={questConfig.PRIMARY_COLOR}
                    singleChoose="modal1"
                    multiChoice="modal2"
                    styles={{
                      container: {
                        fontFamily: 'Inter Tight, sans-serif'
                      }
                    }}
                  >
                    <OnBoarding.Header />
                    <OnBoarding.Content />
                    <OnBoarding.Footer />
                  </OnBoarding>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-neutral-600 mb-4">Setting up your onboarding...</p>
                    <button
                      onClick={handleSkipOnboarding}
                      className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Skip Setup & Continue
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Skip Option */}
            {!isCompleting && (
              <div className="p-4 border-t border-neutral-200 text-center">
                <button
                  onClick={handleSkipOnboarding}
                  className="text-neutral-500 hover:text-neutral-700 text-sm transition-colors"
                >
                  Skip setup for now
                </button>
              </div>
            )}
          </div>

          {/* Mobile Steps Preview */}
          <div className="lg:hidden mt-8">
            <div className="grid grid-cols-1 gap-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <SafeIcon icon={step.icon} className="text-lg text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-neutral-900">
                        {step.title}
                      </h3>
                      <p className="text-xs text-neutral-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingPage;