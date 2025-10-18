import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Info, AlertTriangle, AlertCircle } from 'lucide-react';

const SuccessNotification = ({
  isVisible,
  onClose,
  type = 'success',
  title,
  message,
  duration = 5000,
  actions = [],
  persistent = false
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible && !persistent && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, persistent]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'info':
        return 'text-blue-800';
      case 'warning':
        return 'text-yellow-800';
      case 'error':
        return 'text-red-800';
      default:
        return 'text-green-800';
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ 
          opacity: isClosing ? 0 : 1, 
          y: isClosing ? -50 : 0, 
          scale: isClosing ? 0.95 : 1 
        }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ type: "spring", duration: 0.3 }}
        className={`fixed top-4 right-4 z-50 max-w-sm w-full ${getBackgroundColor()} border rounded-lg shadow-lg`}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            
            <div className="ml-3 flex-1">
              {title && (
                <h4 className={`text-sm font-medium ${getTextColor()} mb-1`}>
                  {title}
                </h4>
              )}
              
              {message && (
                <p className={`text-sm ${getTextColor()}`}>
                  {message}
                </p>
              )}
              
              {actions.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className={`text-xs font-medium px-3 py-1 rounded ${getTextColor()} bg-white hover:bg-gray-50 transition-colors`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {!persistent && (
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={handleClose}
                  className={`${getTextColor()} hover:opacity-75 transition-opacity`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Progress bar for auto-dismiss */}
        {!persistent && duration > 0 && (
          <motion.div
            className="h-1 bg-current opacity-30"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SuccessNotification;
