import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiPackage, FiClock, FiTool, FiCheckCircle } = FiIcons;

const StatsCards = ({ stats }) => {
  const navigate = useNavigate();

  const handleCardClick = (filter) => {
    navigate(`/tracking?filter=${filter}`);
  };

  const cards = [
    {
      title: 'Total Service Orders',
      value: stats.total,
      icon: FiPackage,
      bgColor: 'bg-white',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-500',
      textColor: 'text-neutral-900',
      filter: 'all',
      clickable: true
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: FiTool,
      bgColor: 'bg-white',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      textColor: 'text-neutral-900',
      filter: 'in-progress',
      clickable: true
    },
    {
      title: 'Waiting on Parts',
      value: stats.waitingParts,
      icon: FiClock,
      bgColor: 'bg-white',
      iconBG: 'bg-orange-100',
      iconColor: 'text-orange-600',
      textColor: 'text-neutral-900',
      filter: 'waiting-parts',
      clickable: true
    },
    {
      title: 'Ready',
      value: stats.ready,
      icon: FiCheckCircle,
      bgColor: 'bg-white',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-neutral-900',
      filter: 'ready',
      clickable: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={`${card.bgColor} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 ${
            card.clickable ? 'cursor-pointer hover:scale-105 hover:bg-neutral-50' : ''
          }`}
          onClick={() => card.clickable && handleCardClick(card.filter)}
          whileHover={card.clickable ? { scale: 1.02 } : {}}
          whileTap={card.clickable ? { scale: 0.98 } : {}}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium text-neutral-600 mb-1`}>
                {card.title}
              </p>
              <p className={`text-3xl font-bold ${card.textColor}`}>
                {card.value}
              </p>
              {card.clickable && (
                <p className="text-xs text-neutral-500 mt-1">Click to view</p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${card.iconBg} shadow-sm`}>
              <SafeIcon icon={card.icon} className={`text-2xl ${card.iconColor}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;