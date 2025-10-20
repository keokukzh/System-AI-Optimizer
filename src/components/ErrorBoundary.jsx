import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Wifi, WifiOff, Server, Settings } from 'lucide-react';
import { API_CONFIG } from '../config/environment';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      backendStatus: 'checking',
      connectionTest: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Check backend connection status
    this.checkBackendConnection();

    // Log to external service if available
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // In a real app, you would send this to an error reporting service
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.log('Error logged:', errorData);
    
    // You could send this to a logging service:
    // fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // }).catch(console.error);
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/ai/status`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        this.setState({ 
          backendStatus: 'connected',
          connectionTest: 'Backend is responding correctly'
        });
      } else {
        this.setState({ 
          backendStatus: 'error',
          connectionTest: `Backend returned status: ${response.status}`
        });
      }
    } catch (error) {
      this.setState({ 
        backendStatus: 'disconnected',
        connectionTest: `Connection failed: ${error.message}`
      });
    }
  };

  handleTestConnection = () => {
    this.setState({ backendStatus: 'checking' });
    this.checkBackendConnection();
  };

  render() {
    if (this.state.hasError) {
      const { error, retryCount, backendStatus, connectionTest } = this.state;
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 text-center mb-6">
              {this.getUserFriendlyMessage(error)}
            </p>

            {/* Backend Connection Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Backend Connection</h3>
                <div className="flex items-center">
                  {backendStatus === 'connected' && <Wifi className="w-4 h-4 text-green-500" />}
                  {backendStatus === 'disconnected' && <WifiOff className="w-4 h-4 text-red-500" />}
                  {backendStatus === 'checking' && <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />}
                  {backendStatus === 'error' && <Server className="w-4 h-4 text-orange-500" />}
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                {connectionTest || 'Checking connection...'}
              </p>
              <p className="text-xs text-gray-500">
                Backend URL: {API_CONFIG.BASE_URL}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={retryCount >= 3}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
              </button>

              <button
                onClick={this.handleTestConnection}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                disabled={backendStatus === 'checking'}
              >
                <Server className="w-4 h-4 mr-2" />
                Test Backend Connection
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center">
                  <Bug className="w-4 h-4 mr-1" />
                  Technical Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {error?.message}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{error?.stack}</pre>
                  </div>
                </div>
              </details>
            )}

            {/* Troubleshooting Tips */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Troubleshooting Tips:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Ensure the backend server is running on port 8080</li>
                <li>• Check if firewall is blocking the connection</li>
                <li>• Try restarting the backend server</li>
                <li>• Verify the backend URL in settings</li>
              </ul>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  getUserFriendlyMessage = (error) => {
    if (!error) return 'An unexpected error occurred.';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    if (message.includes('permission') || message.includes('access')) {
      return 'Permission denied. Please ensure you have the necessary access rights.';
    }
    
    if (message.includes('timeout')) {
      return 'Request timed out. The server might be busy. Please try again.';
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return 'The requested resource was not found.';
    }
    
    if (message.includes('server') || message.includes('500')) {
      return 'Server error occurred. Please try again later.';
    }
    
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  };
}

export default ErrorBoundary;