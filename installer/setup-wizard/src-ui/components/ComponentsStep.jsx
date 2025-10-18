import React from 'react';
import { Check, X, HardDrive, Info } from 'lucide-react';

function ComponentsStep({ 
  components, 
  selectedComponents, 
  setSelectedComponents, 
  onNext, 
  onPrev 
}) {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const toggleComponent = (componentId) => {
    const newSelected = new Set(selectedComponents);
    if (newSelected.has(componentId)) {
      newSelected.delete(componentId);
    } else {
      newSelected.add(componentId);
    }
    setSelectedComponents(newSelected);
  };

  const getTotalSize = () => {
    return components
      .filter(c => selectedComponents.has(c.id))
      .reduce((total, c) => total + c.size, 0);
  };

  const getSelectedCount = () => {
    return selectedComponents.size;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Select Components
        </h2>
        <p className="text-gray-600">
          Choose which components to install. Required components cannot be deselected.
        </p>
      </div>

      {/* Components list */}
      <div className="mb-6">
        <div className="space-y-3">
          {components.map((component) => {
            const isSelected = selectedComponents.has(component.id);
            const isRequired = component.required;
            
            return (
              <div
                key={component.id}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  isSelected 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${isRequired ? 'opacity-75' : 'cursor-pointer'}`}
                onClick={() => !isRequired && toggleComponent(component.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                        isSelected 
                          ? 'bg-primary-600 border-primary-600' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center">
                          {component.name}
                          {isRequired && (
                            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              Required
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {component.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 ml-8">
                      <HardDrive className="w-4 h-4 mr-1" />
                      {formatBytes(component.size)}
                    </div>
                  </div>
                  
                  {!isRequired && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComponent(component.id);
                      }}
                      className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                    >
                      {isSelected ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Installation summary */}
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-3 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Installation Summary
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Components to install:</span>
              <span className="font-medium text-blue-900">{getSelectedCount()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-blue-700">Total size:</span>
              <span className="font-medium text-blue-900">{formatBytes(getTotalSize())}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-blue-700">Estimated installation time:</span>
              <span className="font-medium text-blue-900">
                {getTotalSize() > 1024 * 1024 * 1024 ? '5-10 minutes' : '2-5 minutes'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Important notes */}
      <div className="mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Important Notes:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• OptiAI will create shortcuts on your desktop and start menu</li>
            <li>• The AI model requires approximately 1.5GB of disk space</li>
            <li>• You can change these settings later in the application</li>
            <li>• Installation may take several minutes depending on your system</li>
          </ul>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="btn-secondary"
        >
          Back
        </button>
        
        <button
          onClick={onNext}
          className="btn-primary"
        >
          Install OptiAI
        </button>
      </div>
    </div>
  );
}

export default ComponentsStep;
