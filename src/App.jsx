import React, { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Dashboard from './components/Dashboard'
import ScanPanel from './components/ScanPanel'
import Sidebar from './components/Sidebar'
import MobileMenu from './components/MobileMenu'
import LoadingSpinner from './components/LoadingSpinner'
import Toast from './components/Toast'
import CommandPalette from './components/CommandPalette'
import KeyboardShortcuts from './components/KeyboardShortcuts'
import UnifiedSearch from './components/UnifiedSearch'
import StatusDock from './components/StatusDock'
import StatusBadge from './components/StatusBadge'
import ErrorBoundary from './components/ErrorBoundary'
import AILoadingScreen from './components/AILoadingScreen'
import NotificationCenter from './components/NotificationCenter'
import NotificationBell from './components/NotificationBell'
import { useAppContext } from './hooks/useAppContext'
import useNotifications from './hooks/useNotifications'
// import connectionValidator from './utils/connectionValidator'
import { Wifi, Zap, HelpCircle, Bug } from 'lucide-react'

// Lazy load heavy view components
const Processes = lazy(() => import('./pages/Processes'))
const Startup = lazy(() => import('./pages/Startup'))
const AISuggestionsTab = lazy(() => import('./components/AISuggestionsTab'))
const DiscoverTab = lazy(() => import('./components/DiscoverTab'))
const InstalledAppsTab = lazy(() => import('./components/InstalledAppsTab'))
const Automation = lazy(() => import('./components/Automation'))
const VaultTab = lazy(() => import('./components/VaultTab'))
const ActionHistory = lazy(() => import('./components/ActionHistory'))
const LicenseSettings = lazy(() => import('./components/LicenseSettings'))
const LogViewer = lazy(() => import('./components/LogViewer'))
const DebugPanel = lazy(() => import('./components/DebugPanel'))

function App() {
  const { state, actions } = useAppContext()
  const {
    notifications,
    dismissNotification,
    clearAll,
    handleAction,
    showSuccess,
    showError,
    showWarning,
    showInfo
  } = useNotifications()
  
  // Destructure state for easier access
  const {
    systemInfo,
    systemInfoLoading: isLoading,
    preferences,
    status,
    ui
  } = state

  // AI initialization state
  const [aiInitialized, setAiInitialized] = useState(false)
  const [aiInitializing, setAiInitializing] = useState(false) // Start as false to allow immediate app startup
  const [aiFallbackMode, setAiFallbackMode] = useState(false)
  
  // Debug panel state
  const [debugPanelOpen, setDebugPanelOpen] = useState(false)
  
  const {
    currentView,
    commandPaletteOpen,
    shortcutsOpen,
    toast
  } = ui
  
  const {
    network: networkStatus,
    ai: aiStatus
  } = status
  
  const {
    sidebarCollapsed
  } = preferences

  useEffect(() => {
    // Mark app start time
    window.appStartTime = Date.now()
    
    // Skip AI initialization completely to prevent flickering
    // AI will be handled on-demand when user explicitly requests it
    setAiInitialized(false)
    setAiFallbackMode(true)
    setAiInitializing(false)
    
    // Simple backend connection test
    const testBackend = async () => {
      try {
        console.log('🔍 Testing backend connection...')
        const response = await fetch('http://127.0.0.1:5175/health', {
          method: 'GET',
          timeout: 3000
        })
        
        if (response.ok) {
          console.log('✅ Backend connection successful')
          actions.setBackendStatus('online')
        } else {
          console.error('❌ Backend health check failed:', response.status)
          actions.setBackendStatus('offline')
        }
      } catch (error) {
        console.error('❌ Backend connection failed:', error.message)
        actions.setBackendStatus('offline')
      }
    }
    
    // Run test after a short delay to allow UI to render
    const timer = setTimeout(testBackend, 1000)
    
    return () => clearTimeout(timer)
  }, [actions, showError])

  useEffect(() => {
    // Keyboard Shortcuts
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        actions.setCommandPaletteOpen(true)
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        actions.setShortcutsOpen(true)
      }
      if (e.key === 'Escape') {
        actions.setCommandPaletteOpen(false)
        actions.setShortcutsOpen(false)
        setDebugPanelOpen(false)
      }
      // Debug panel shortcut: Ctrl+Shift+D
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setDebugPanelOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [actions])
  
  const handleScanComplete = (scanId) => {
    actions.setCurrentView('overview')
    actions.showToast('System scan completed successfully', 'success')
    showSuccess('Scan Complete', 'System scan completed successfully')
  }

  const handleScanError = (error) => {
    actions.showToast(`Scan failed: ${error}`, 'error')
    showError('Scan Failed', `Scan failed: ${error}`)
  }

  const handleAIInitializationComplete = (aiStatus) => {
    setAiInitialized(true)
    setAiInitializing(false)
    setAiFallbackMode(aiStatus.fallback_mode || false)
    if (aiStatus.fallback_mode) {
      showWarning('AI Fallback Mode', 'Using rule-based suggestions (AI model not available)')
    } else {
      showSuccess('AI Ready', `AI model loaded: ${aiStatus.model_name || 'Unknown'}`)
    }
  }

  const handleAIInitializationError = (error) => {
    setAiInitialized(false)
    setAiInitializing(false)
    setAiFallbackMode(true)
    showError('AI Initialization Failed', error.message || 'Failed to initialize AI')
  }

  // No blocking loading screens - show main UI immediately
  // All loading happens in background with inline indicators

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neon-cyan/5 via-transparent to-transparent pointer-events-none -z-10" />
      
      {/* Sidebar */}
      <Sidebar 
        activeView={currentView}
        onViewChange={actions.setCurrentView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => actions.setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="relative bg-dark-card/60 backdrop-blur-xl shadow-glass border-b border-dark-border z-10 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16 gap-4">
              {/* Unified Search - Takes available space */}
              <UnifiedSearch 
                onNavigate={actions.setCurrentView}
                onAction={(action) => {
                  // Handle action execution
                  if (typeof action === 'function') {
                    action()
                  }
                }}
              />
              
              {/* Status & Quick Actions - Right */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Quick Action Buttons */}
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => actions.setCurrentView('scan')}
                    className="flex items-center gap-2 px-3 py-2 bg-neon-cyan/10 text-neon-cyan rounded-lg hover:bg-neon-cyan/20 border border-neon-cyan/30 transition-all duration-200 font-medium text-sm"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Scan</span>
                  </button>
                  <button
                    onClick={() => actions.setCommandPaletteOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-dark-surface/50 text-dark-muted rounded-lg hover:bg-dark-surface hover:text-dark-text border border-dark-border transition-all duration-200 font-medium text-sm"
                  >
                    <span>⌘K</span>
                  </button>
                  <button
                    onClick={() => actions.setShortcutsOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-dark-surface/50 text-dark-muted rounded-lg hover:bg-dark-surface hover:text-dark-text border border-dark-border transition-all duration-200 font-medium text-sm"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDebugPanelOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-dark-surface/50 text-dark-muted rounded-lg hover:bg-dark-surface hover:text-dark-text border border-dark-border transition-all duration-200 font-medium text-sm"
                    title="Debug Panel (Ctrl+Shift+D)"
                  >
                    <Bug className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Status Badges */}
                <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-dark-border">
                  <StatusBadge 
                    icon={Wifi} 
                    status={networkStatus} 
                    tooltip="Network" 
                  />
                  <StatusBadge 
                    icon={Zap} 
                    status={aiStatus} 
                    tooltip="AI Service" 
                  />
                  
                  {/* Notification Bell */}
                  <NotificationBell />
                </div>

                {/* Mobile Menu */}
                <MobileMenu 
                  activeView={currentView}
                  onViewChange={actions.setCurrentView}
                  onClose={() => {}}
                />
              </div>
            </div>
          </div>
        </header>

        {/* AI Fallback Warning Banner - Hidden to prevent flickering */}
        {/* AI status is shown inline in the dashboard instead */}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ErrorBoundary onGoHome={() => setCurrentView('overview')}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                >
                  <Suspense fallback={
                    <motion.div 
                      className="flex items-center justify-center min-h-[400px]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <LoadingSpinner size="large" />
                    </motion.div>
                  }>
                    {currentView === 'overview' && (
                      <Dashboard 
                        systemInfo={systemInfo}
                        onStartScan={() => actions.setCurrentView('scan')}
                        onShowToast={actions.showToast}
                      />
                    )}
                    
                    {currentView === 'scan' && (
                      <ScanPanel
                        onComplete={handleScanComplete}
                        onError={handleScanError}
                        onCancel={() => actions.setCurrentView('overview')}
                      />
                    )}

                    {currentView === 'processes' && <Processes />}
                    {currentView === 'startup' && <Startup />}
                    {currentView === 'ai' && <AISuggestionsTab />}
                    {currentView === 'discover' && <DiscoverTab />}
                    {currentView === 'installed' && <InstalledAppsTab />}
                    {currentView === 'automation' && <Automation />}
                    {currentView === 'vault' && <VaultTab />}
                    {currentView === 'history' && <ActionHistory onShowToast={actions.showToast} />}
                    {currentView === 'settings' && <LicenseSettings />}
                    {currentView === 'logs' && <LogViewer />}
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={actions.clearToast}
        />
      )}

      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen}
        onClose={() => actions.setCommandPaletteOpen(false)}
      />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts 
        isOpen={shortcutsOpen}
        onClose={() => actions.setShortcutsOpen(false)}
      />

      {/* Status Dock */}
      <StatusDock />

      {/* Notification Center */}
      <NotificationCenter
        notifications={notifications}
        onDismiss={dismissNotification}
        onDismissAll={clearAll}
        onAction={handleAction}
        position="top-right"
      />

      {/* Debug Panel */}
      <DebugPanel 
        isOpen={debugPanelOpen}
        onClose={() => setDebugPanelOpen(false)}
      />
    </div>
  )
}

export default App
