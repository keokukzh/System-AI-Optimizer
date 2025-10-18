import React from 'react';
import { CheckCircle, Play, FolderOpen, ExternalLink } from 'lucide-react';

function CompletionStep({ installPath, onLaunch, onOpenFolder }) {
  const installedComponents = [
    "OptiAI Desktop Application",
    "AI Assistant (Phi-2 Model)",
    "Desktop Shortcut",
    "Start Menu Shortcut",
    "System Integration"
  ];

  return (
    <div className="text-center">
      {/* Success icon */}
      <div className="mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Installation Complete!
        </h2>
        <p className="text-gray-600">
          OptiAI has been successfully installed on your system.
        </p>
      </div>

      {/* Installed components */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Installed Components
        </h3>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <ul className="space-y-2 text-left">
            {installedComponents.map((component, index) => (
              <li key={index} className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-green-800">{component}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Installation details */}
      <div className="mb-8">
        <div className="bg-gray-50 rounded-lg p-4 text-left">
          <h4 className="font-medium text-gray-900 mb-3">Installation Details</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Installation Path:</span>
              <span className="font-mono text-xs">{installPath}</span>
            </div>
            <div className="flex justify-between">
              <span>Version:</span>
              <span>OptiAI v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Installation Date:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What's Next?
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="font-medium mr-2">1.</span>
              <span>Launch OptiAI to start optimizing your system</span>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">2.</span>
              <span>Run your first system scan to identify optimization opportunities</span>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">3.</span>
              <span>Explore AI-powered suggestions for better performance</span>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">4.</span>
              <span>Configure automatic scans and notifications</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onLaunch}
            className="btn-primary flex items-center justify-center gap-2 px-8 py-3 text-lg"
          >
            <Play className="w-5 h-5" />
            Launch OptiAI Now
          </button>
          
          <button
            onClick={onOpenFolder}
            className="btn-secondary flex items-center justify-center gap-2 px-6 py-3"
          >
            <FolderOpen className="w-4 h-4" />
            Open Installation Folder
          </button>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>
            You can also find OptiAI in your Start Menu or on your Desktop.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <p className="mb-2">
            Thank you for choosing OptiAI System Optimizer!
          </p>
          <p>
            For support and updates, visit our website or check the documentation.
          </p>
        </div>
        
        <div className="mt-4 flex justify-center space-x-4">
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Visit Website
          </button>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Documentation
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompletionStep;
