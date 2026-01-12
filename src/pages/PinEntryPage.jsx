import { useState } from 'react';
import { usePinAuth } from '../contexts/PinAuthContext';
import { FaLock } from 'react-icons/fa';

const PinEntryPage = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = usePinAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!pin || pin.trim() === '') {
      setError('Please enter a PIN');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(pin);

      if (!result.success) {
        setError(result.error || 'Invalid PIN');
        setPin('');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setPin(value);
    if (error) setError('');
  };

  const handleReset = () => {
    if (window.confirm('This will clear all stored data and reload the page. Continue?')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FaLock className="w-8 h-8 text-slate-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 text-center">
              Enter PIN
            </h1>
            <p className="text-slate-600 text-center mt-2">
              Please enter your PIN to access the application
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={handlePinChange}
                placeholder="Enter PIN"
                className={`w-full px-4 py-3 text-center text-2xl tracking-widest border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  error
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-slate-500 focus:ring-slate-200'
                }`}
                disabled={isSubmitting}
                autoFocus
                maxLength={10}
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 text-center">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !pin}
              className="w-full bg-slate-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Verifying...' : 'Unlock'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center mb-4">
              Your session will remain active for 10 hours after authentication
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Having issues? Reset application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinEntryPage;
