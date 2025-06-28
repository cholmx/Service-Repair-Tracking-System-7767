import React, { createContext, useContext, useEffect, useState } from 'react';

const QuestAuthContext = createContext({});

export const useQuestAuth = () => {
  const context = useContext(QuestAuthContext);
  if (!context) {
    throw new Error('useQuestAuth must be used within a QuestAuthProvider');
  }
  return context;
};

export const QuestAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication
    const savedUserId = localStorage.getItem('quest_userId');
    const savedToken = localStorage.getItem('quest_token');
    const savedIsNewUser = localStorage.getItem('quest_isNewUser');
    
    console.log('Checking existing auth:', { savedUserId, savedToken, savedIsNewUser });
    
    if (savedUserId) {
      setUser({ 
        userId: savedUserId, 
        token: savedToken,
        newUser: savedIsNewUser === 'true'
      });
      setIsAuthenticated(true);
      console.log('User authenticated from localStorage');
    }
    setLoading(false);
  }, []);

  const handleLogin = (loginData) => {
    console.log('HandleLogin called with:', loginData);
    
    try {
      // Validate required data
      if (!loginData.userId) {
        throw new Error('Invalid login data: missing userId');
      }
      
      const { userId, token, newUser } = loginData;
      
      // Store in localStorage
      localStorage.setItem('quest_userId', userId);
      localStorage.setItem('quest_token', token || '');
      localStorage.setItem('quest_isNewUser', newUser ? 'true' : 'false');
      
      // Update state
      setUser({ userId, token, newUser });
      setIsAuthenticated(true);
      
      console.log('Login successful, user data stored');
      
      return { userId, token, newUser };
    } catch (error) {
      console.error('Error in handleLogin:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('quest_userId');
    localStorage.removeItem('quest_token');
    localStorage.removeItem('quest_isNewUser');
    localStorage.removeItem('quest_onboardingCompleted');
    setUser(null);
    setIsAuthenticated(false);
  };

  const completeOnboarding = () => {
    console.log('Completing onboarding...');
    localStorage.setItem('quest_onboardingCompleted', 'true');
    // Update user state to reflect onboarding completion
    if (user) {
      setUser({ ...user, newUser: false });
      localStorage.setItem('quest_isNewUser', 'false');
    }
  };

  const isOnboardingCompleted = () => {
    return localStorage.getItem('quest_onboardingCompleted') === 'true';
  };

  const isNewUser = () => {
    const isNew = localStorage.getItem('quest_isNewUser') === 'true';
    const onboardingCompleted = isOnboardingCompleted();
    return isNew && !onboardingCompleted;
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    handleLogin,
    handleLogout,
    completeOnboarding,
    isOnboardingCompleted,
    isNewUser
  };

  return (
    <QuestAuthContext.Provider value={value}>
      {children}
    </QuestAuthContext.Provider>
  );
};