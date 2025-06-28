import React from 'react';
import { Navigate } from 'react-router-dom';
import { useQuestAuth } from '../../contexts/QuestAuthContext';

const QuestProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, isNewUser } = useQuestAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-200 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect new users to onboarding
  if (isNewUser()) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default QuestProtectedRoute;