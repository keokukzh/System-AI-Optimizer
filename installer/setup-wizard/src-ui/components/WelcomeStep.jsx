import React from 'react';
import { CheckCircle, Zap, Shield, Brain } from 'lucide-react';

function WelcomeStep({ onNext }) {
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: "System Optimization",
      description: "Intelligent analysis and optimization of your Windows system"
    },
    {
      icon: <Brain className="w-6 h-6 text-purple-500" />,
      title: "AI-Powered Insights",
      description: "Advanced AI recommendations for system performance"
    },
    {
      icon: <Shield className="w-6 h-6 text-green-500" />,
      title: "Safe & Secure",
      description: "All operations are safe with comprehensive backup options"
    }
  ];

  return (
    <div className="text-center">
      {/* Logo */}
      <div className="mb-8">
        <img
          src="/assets/thumbnail.jpg"
          alt="OptiAI Logo"
          className="w-24 h-24 mx-auto rounded-lg shadow-lg"
        />
      </div>

      {/* Welcome text */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to OptiAI Setup
        </h2>
        <p className="text-gray-600 mb-6">
          This wizard will guide you through the installation of OptiAI System Optimizer.
          OptiAI will help you optimize your Windows system for better performance and security.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">System Requirements Met</span>
          </div>
          <p className="text-sm text-blue-700">
            Your system meets all requirements for OptiAI installation.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What you'll get with OptiAI:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center p-4">
              <div className="mb-3">
                {feature.icon}
              </div>
              <h4 className="font-medium text-gray-900 mb-2">
                {feature.title}
              </h4>
              <p className="text-sm text-gray-600 text-center">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Version info */}
      <div className="mb-8 text-sm text-gray-500">
        <p>OptiAI System Optimizer v1.0.0</p>
        <p>© 2024 OptiAI Team. All rights reserved.</p>
      </div>

      {/* Next button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="btn-primary px-8 py-3 text-lg"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

export default WelcomeStep;
