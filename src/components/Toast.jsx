import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiCheck, FiAlertCircle, FiInfo, FiX } = FiIcons;

const Toast = ({ message, type = 'success', onClose, onUndo, autoClose = true, duration = 5000 }) => {
  useEffect(() => {
    if (autoClose && !onUndo) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose, onUndo]);

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: FiCheck,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: FiAlertCircle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: FiInfo,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
      default:
        return {
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
          text: 'text-neutral-800',
          icon: FiInfo,
          iconBg: 'bg-neutral-100',
          iconColor: 'text-neutral-600'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`${config.bg} ${config.border} border rounded-lg shadow-lg p-4 flex items-center justify-between min-w-[300px] max-w-md`}
      >
        <div className="flex items-center space-x-3 flex-1">
          <div className={`${config.iconBg} rounded-full p-2 flex-shrink-0`}>
            <SafeIcon icon={config.icon} className={`${config.iconColor} text-lg`} />
          </div>
          <p className={`${config.text} text-sm font-medium`}>{message}</p>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {onUndo && (
            <button
              onClick={onUndo}
              className={`${config.text} font-medium text-sm hover:underline focus:outline-none`}
            >
              Undo
            </button>
          )}
          <button
            onClick={onClose}
            className={`${config.text} hover:opacity-70 focus:outline-none`}
          >
            <SafeIcon icon={FiX} className="text-lg" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Toast;
