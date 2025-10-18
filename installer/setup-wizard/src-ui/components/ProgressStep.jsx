import React from 'react';
import { CheckCircle, Clock, AlertCircle, X } from 'lucide-react';

function ProgressStep({ progress, onCancel }) {
  const formatTime = (seconds) => {
    if (seconds === 0) return '0 seconds';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getProgressColor = () => {
    if (progress.progress >= 100) return 'bg-green-500';
    if (progress.progress >= 75) return 'bg-blue-500';
    if (progress.progress >= 50) return 'bg-yellow-500';
    return 'bg-primary-500';
  };

  const getStatusIcon = () => {
    if (progress.progress >= 100) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
    if (progress.status.toLowerCase().includes('error') || progress.status.toLowerCase().includes('failed')) {
      return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
    return <Clock className="w-6 h-6 text-blue-500" />;
  };

  const canCancel = progress.progress < 50;

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Installing OptiAI
        </h2>
        <p className="text-gray-600">
          Please wait while OptiAI is being installed on your system.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          {getStatusIcon()}
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {progress.current_step}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress.progress)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p className="mb-1">{progress.status}</p>
          {progress.estimated_time_remaining > 0 && (
            <p className="flex items-center justify-center">
              <Clock className="w-4 h-4 mr-1" />
              Estimated time remaining: {formatTime(progress.estimated_time_remaining)}
            </p>
          )}
        </div>
      </div>

      {/* Installation steps */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Installation Progress
        </h3>
        
        <div className="space-y-3 text-left">
          {[
            { step: 1, name: "Creating directories", completed: progress.progress >= 16 },
            { step: 2, name: "Installing main application", completed: progress.progress >= 33 },
            { step: 3, name: "Installing AI model", completed: progress.progress >= 50 },
            { step: 4, name: "Creating shortcuts", completed: progress.progress >= 66 },
            { step: 5, name: "Registering application", completed: progress.progress >= 83 },
            { step: 6, name: "Finalizing installation", completed: progress.progress >= 100 },
          ].map((item) => (
            <div key={item.step} className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                item.completed 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {item.completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{item.step}</span>
                )}
              </div>
              <span className={`text-sm ${
                item.completed ? 'text-green-700 font-medium' : 'text-gray-600'
              }`}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel button */}
      {canCancel && (
        <div className="flex justify-center">
          <button
            onClick={onCancel}
            className="btn-danger flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel Installation
          </button>
        </div>
      )}

      {/* Warning message */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Please do not close this window</p>
            <p>
              Closing the installer during installation may result in an incomplete installation.
              If you need to cancel, use the Cancel button above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressStep;
