import React from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';

const ToastContainer = ({ toasts, removeToast, onUndo }) => {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            onUndo={toast.undoAction ? () => onUndo(toast) : null}
            autoClose={!toast.undoAction}
            duration={toast.undoAction ? 10000 : 5000}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
