import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { useAuth } from '../../contexts/AuthContext';

const { FiX, FiCheck, FiCrown, FiZap } = FiIcons;

const UpgradeModal = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [loading, setLoading] = useState(false);
  const { updateSubscription } = useAuth();

  const plans = [
    {
      id: 'pro',
      name: 'Professional',
      price: '$29',
      period: 'per month',
      icon: FiZap,
      features: [
        'Unlimited Service Orders',
        'Advanced Reporting',
        'Customer Portal',
        'Email Notifications',
        'Priority Support',
        'Data Export'
      ],
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$59',
      period: 'per month',
      icon: FiCrown,
      features: [
        'Everything in Professional',
        'Multi-location Support',
        'Custom Branding',
        'API Access',
        'Advanced Analytics',
        'White-label Solution',
        '24/7 Phone Support'
      ],
      popular: false
    }
  ];

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { error } = await updateSubscription(selectedPlan);
      if (error) {
        console.error('Upgrade error:', error);
      } else {
        onClose();
        // In a real app, you'd integrate with Stripe or another payment processor
        alert(`Successfully upgraded to ${selectedPlan} plan!`);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Choose Your Plan</h2>
              <p className="text-neutral-600">Upgrade to unlock premium features</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors duration-200"
            >
              <SafeIcon icon={FiX} className="text-xl" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ scale: 1.02 }}
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedPlan === plan.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-primary-300'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <SafeIcon icon={plan.icon} className="text-3xl text-primary-500 mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-neutral-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-neutral-900">{plan.price}</span>
                    <span className="text-neutral-600 ml-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <SafeIcon icon={FiCheck} className="text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {selectedPlan === plan.id && (
                  <div className="absolute inset-0 border-2 border-primary-500 rounded-xl pointer-events-none">
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <SafeIcon icon={FiCheck} className="text-white text-sm" />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="bg-primary-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-lg"
            >
              {loading ? 'Processing...' : `Upgrade to ${plans.find(p => p.id === selectedPlan)?.name}`}
            </button>
            <p className="text-neutral-500 text-sm mt-3">
              Cancel anytime • 30-day money-back guarantee
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UpgradeModal;