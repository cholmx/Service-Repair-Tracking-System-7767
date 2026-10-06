import React from 'react';
import { FiAlertCircle, FiCheck, FiInfo } from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';


const styles = {
  success: 'bg-green-50 text-green-800',
  error: 'bg-red-50 text-red-800',
  info: 'bg-blue-50 text-blue-800'
};

const icons = { success: FiCheck, error: FiAlertCircle, info: FiInfo };

const StatusMessage = ({ message }) => {
  if (!message.text) return null;

  const type = styles[message.type] ? message.type : 'info';

  return (
    <div className={`mb-6 p-4 rounded-lg flex items-center ${styles[type]}`}>
      <SafeIcon icon={icons[type]} className="mr-3 text-lg" />
      <p>{message.text}</p>
    </div>
  );
};

export default StatusMessage;
