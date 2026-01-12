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
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return false;
      }

      const { timestamp } = JSON.parse(stored);
      if (!timestamp || typeof timestamp !== 'number') {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }

      const now = Date.now();
      const elapsed = now - timestamp;

      if (elapsed < SESSION_DURATION && elapsed >= 0) {
        return true;
      } else {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }
    } catch (err) {
      console.error('Error checking session:', err);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (cleanupErr) {
        console.error('Error cleaning up session:', cleanupErr);
      }
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = () => {
      try {
        const isValid = checkSession();
        if (mounted) {
          setIsAuthenticated(isValid);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('Auth initialization timeout, forcing load complete');
        setIsLoading(false);
      }
    }, 3000);

    initAuth();

    const interval = setInterval(() => {
      if (mounted) {
        const stillValid = checkSession();
        if (!stillValid && isAuthenticated) {
          setIsAuthenticated(false);
        }
      }
    }, CHECK_INTERVAL);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const login = async (pin) => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout')), 10000)
      );

      const result = await Promise.race([
        validatePin(pin),
        timeoutPromise
      ]);

      if (result.isValid) {
        const session = {
          timestamp: Date.now(),
          isOverride: result.isOverride || false
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch (storageErr) {
          console.error('Error saving session:', storageErr);
          return { success: false, error: 'Unable to save session. Please try again.' };
        }
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: result.error || 'Invalid PIN. Please try again.' };
    } catch (err) {
      console.error('Login error:', err);
      if (err.message === 'Login timeout') {
        return { success: false, error: 'Login timeout. Please check your connection and try again.' };
      }
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
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
