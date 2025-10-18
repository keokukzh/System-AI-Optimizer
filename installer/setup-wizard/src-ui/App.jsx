import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import WelcomeStep from './components/WelcomeStep';
import LocationStep from './components/LocationStep';
import ComponentsStep from './components/ComponentsStep';
import ProgressStep from './components/ProgressStep';
import CompletionStep from './components/CompletionStep';

const STEPS = {
  WELCOME: 0,
  LOCATION: 1,
  COMPONENTS: 2,
  PROGRESS: 3,
  COMPLETION: 4,
};

function App() {
  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME);
  const [installPath, setInstallPath] = useState('C:\\Program Files\\OptiAI');
  const [components, setComponents] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState(new Set());
  const [installProgress, setInstallProgress] = useState({
    progress: 0,
    status: 'Ready',
    current_step: '',
    estimated_time_remaining: 0,
  });
  const [availableSpace, setAvailableSpace] = useState(0);

  useEffect(() => {
    loadComponents();
    updateAvailableSpace();
  }, []);

  const loadComponents = async () => {
    try {
      const comps = await invoke('get_components');
      setComponents(comps);
      
      // Select required components by default
      const required = new Set(comps.filter(c => c.required).map(c => c.id));
      setSelectedComponents(required);
    } catch (error) {
      console.error('Failed to load components:', error);
    }
  };

  const updateAvailableSpace = async () => {
    try {
      const drive = installPath.charAt(0) + ':';
      const space = await invoke('get_available_space', { drive });
      setAvailableSpace(space);
    } catch (error) {
      console.error('Failed to get available space:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.COMPLETION) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > STEPS.WELCOME) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startInstallation = async () => {
    setCurrentStep(STEPS.PROGRESS);
    
    try {
      const config = {
        install_path: installPath,
        components: components.filter(c => selectedComponents.has(c.id)),
        create_desktop_shortcut: selectedComponents.has('desktop_shortcut'),
        create_start_menu_shortcut: selectedComponents.has('start_menu_shortcut'),
        auto_start: selectedComponents.has('auto_start'),
      };

      await invoke('start_installation', { config });
      
      // Poll for progress updates
      const progressInterval = setInterval(async () => {
        try {
          const progress = await invoke('get_install_progress');
          setInstallProgress(progress);
          
          if (progress.progress >= 100) {
            clearInterval(progressInterval);
            setCurrentStep(STEPS.COMPLETION);
          }
        } catch (error) {
          console.error('Failed to get progress:', error);
        }
      }, 500);
      
    } catch (error) {
      console.error('Installation failed:', error);
      alert('Installation failed: ' + error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.WELCOME:
        return <WelcomeStep onNext={nextStep} />;
      
      case STEPS.LOCATION:
        return (
          <LocationStep
            installPath={installPath}
            setInstallPath={setInstallPath}
            availableSpace={availableSpace}
            onNext={nextStep}
            onPrev={prevStep}
            onUpdateSpace={updateAvailableSpace}
          />
        );
      
      case STEPS.COMPONENTS:
        return (
          <ComponentsStep
            components={components}
            selectedComponents={selectedComponents}
            setSelectedComponents={setSelectedComponents}
            onNext={startInstallation}
            onPrev={prevStep}
          />
        );
      
      case STEPS.PROGRESS:
        return (
          <ProgressStep
            progress={installProgress}
            onCancel={() => {
              invoke('cancel_installation');
              setCurrentStep(STEPS.WELCOME);
            }}
          />
        );
      
      case STEPS.COMPLETION:
        return (
          <CompletionStep
            installPath={installPath}
            onLaunch={() => invoke('launch_application', { installPath })}
            onOpenFolder={() => invoke('open_folder', { path: installPath })}
          />
        );
      
      default:
        return <WelcomeStep onNext={nextStep} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              OptiAI Setup Wizard
            </h1>
            <p className="text-gray-600">
              Professional installation for OptiAI System Optimizer
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep + 1} of {Object.keys(STEPS).length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(((currentStep + 1) / Object.keys(STEPS).length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / Object.keys(STEPS).length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          <div className="card">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
