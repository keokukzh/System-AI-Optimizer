import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { FolderOpen, HardDrive, AlertCircle } from 'lucide-react';

function LocationStep({ 
  installPath, 
  setInstallPath, 
  availableSpace, 
  onNext, 
  onPrev, 
  onUpdateSpace 
}) {
  const [isValidPath, setIsValidPath] = useState(true);
  const [validationMessage, setValidationMessage] = useState('');

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validatePath = async (path) => {
    try {
      const isValid = await invoke('validate_install_path', { path });
      setIsValidPath(isValid);
      
      if (isValid) {
        setValidationMessage('');
        onUpdateSpace();
      } else {
        setValidationMessage('Invalid installation path. Please choose a different location.');
      }
    } catch (error) {
      setIsValidPath(false);
      setValidationMessage('Error validating path: ' + error);
    }
  };

  const handlePathChange = (e) => {
    const newPath = e.target.value;
    setInstallPath(newPath);
    validatePath(newPath);
  };

  const browseFolder = async () => {
    try {
      // In a real implementation, you would use Tauri's dialog API
      // For now, we'll just show an alert
      alert('Folder browser would open here. Please enter the path manually.');
    } catch (error) {
      console.error('Failed to open folder browser:', error);
    }
  };

  const requiredSpace = 2.5 * 1024 * 1024 * 1024; // 2.5 GB
  const hasEnoughSpace = availableSpace >= requiredSpace;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Installation Location
        </h2>
        <p className="text-gray-600">
          Select where you want to install OptiAI. Make sure you have enough disk space.
        </p>
      </div>

      {/* Installation path */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Installation Path
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={installPath}
            onChange={handlePathChange}
            className={`input-field flex-1 ${!isValidPath ? 'border-red-500' : ''}`}
            placeholder="C:\\Program Files\\OptiAI"
          />
          <button
            onClick={browseFolder}
            className="btn-secondary flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Browse
          </button>
        </div>
        
        {!isValidPath && (
          <div className="mt-2 flex items-center text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            {validationMessage}
          </div>
        )}
      </div>

      {/* Disk space info */}
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <HardDrive className="w-5 h-5 mr-2" />
            Disk Space Requirements
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Required space:</span>
              <span className="font-medium">{formatBytes(requiredSpace)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Available space:</span>
              <span className={`font-medium ${hasEnoughSpace ? 'text-green-600' : 'text-red-600'}`}>
                {formatBytes(availableSpace)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Free space after installation:</span>
              <span className="font-medium">
                {formatBytes(Math.max(0, availableSpace - requiredSpace))}
              </span>
            </div>
          </div>

          {!hasEnoughSpace && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-800">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">
                  Not enough disk space. Please free up space or choose a different location.
                </span>
              </div>
            </div>
          )}
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
          disabled={!isValidPath || !hasEnoughSpace}
          className={`btn-primary ${(!isValidPath || !hasEnoughSpace) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default LocationStep;
