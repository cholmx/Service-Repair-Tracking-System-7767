import { createContext, useContext, useState, useEffect } from 'react';
import { validatePin } from '../services/pinService';

const PinAuthContext = createContext();

const SESSION_DURATION = 10 * 60 * 60 * 1000;
const STORAGE_KEY = 'pin_auth_session';
const CHECK_INTERVAL = 60 * 1000;

export const usePinAuth = () => {
  const context = useContext(PinAuthContext);
  if (!context) {
    throw new Error('usePinAuth must be used within PinAuthProvider');
  }
  return context;
};

export const PinAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return false;
    }

    try {
      const { timestamp } = JSON.parse(stored);
      const now = Date.now();
      const elapsed = now - timestamp;

      if (elapsed < SESSION_DURATION) {
        return true;
      } else {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }
    } catch (err) {
      console.error('Error checking session:', err);
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
  };

  useEffect(() => {
    const isValid = checkSession();
    setIsAuthenticated(isValid);
    setIsLoading(false);

    const interval = setInterval(() => {
      const stillValid = checkSession();
      if (!stillValid && isAuthenticated) {
        setIsAuthenticated(false);
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = async (pin) => {
    const result = await validatePin(pin);

    if (result.isValid) {
      const session = {
        timestamp: Date.now(),
        isOverride: result.isOverride || false
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setIsAuthenticated(true);
      return { success: true };
    }

    return { success: false, error: result.error || 'Invalid PIN. Please try again.' };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  };

  const getSessionInfo = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    try {
      const { timestamp } = JSON.parse(stored);
      const now = Date.now();
      const elapsed = now - timestamp;
      const remaining = SESSION_DURATION - elapsed;

      return {
        startTime: new Date(timestamp),
        elapsedMs: elapsed,
        remainingMs: remaining,
        expiresAt: new Date(timestamp + SESSION_DURATION)
      };
    } catch (err) {
      return null;
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    getSessionInfo
  };

  return (
    <PinAuthContext.Provider value={value}>
      {children}
    </PinAuthContext.Provider>
  );
};
