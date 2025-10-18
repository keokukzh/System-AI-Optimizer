/**
 * Frontend Unit Tests for Tauri API
 * Tests the tauriApi utility functions with mocked Tauri invoke calls
 */

// Mock Tauri API
const mockInvoke = jest.fn();
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: mockInvoke
}));

// Import the module after mocking
import tauriApi from '../utils/tauriApi.js';

describe('Tauri API Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    mockInvoke.mockClear();
  });

  describe('System Metrics', () => {
    test('getMetrics should call invoke with correct parameters', async () => {
      const mockMetrics = {
        cpu: { usage: 25.5 },
        memory: { total: 8589934592, usage_percent: 60.0 },
        disk: { usage_percent: 75.0 },
        network: { bytes_sent: 1024, bytes_received: 2048 }
      };

      mockInvoke.mockResolvedValue(mockMetrics);

      const result = await tauriApi.getMetrics();

      expect(mockInvoke).toHaveBeenCalledWith('get_metrics');
      expect(result).toEqual(mockMetrics);
    });

    test('getMetrics should handle errors gracefully', async () => {
      const error = new Error('Failed to get metrics');
      mockInvoke.mockRejectedValue(error);

      await expect(tauriApi.getMetrics()).rejects.toThrow('Failed to get metrics');
    });
  });

  describe('AI Status', () => {
    test('checkAiStatus should return AI status', async () => {
      const mockStatus = { available: true, status: 'online' };
      mockInvoke.mockResolvedValue(mockStatus);

      const result = await tauriApi.checkAiStatus();

      expect(mockInvoke).toHaveBeenCalledWith('check_ai_status');
      expect(result).toEqual(mockStatus);
    });

    test('checkAiStatus should handle errors and return offline status', async () => {
      const error = new Error('AI service unavailable');
      mockInvoke.mockRejectedValue(error);

      const result = await tauriApi.checkAiStatus();

      expect(result).toEqual({ available: false, status: 'offline' });
    });
  });

  describe('System Information', () => {
    test('getSystemInfo should return system information', async () => {
      const mockInfo = 'OptiAI System Optimizer v1.0.0';
      mockInvoke.mockResolvedValue(mockInfo);

      const result = await tauriApi.getSystemInfo();

      expect(mockInvoke).toHaveBeenCalledWith('get_system_info');
      expect(result).toBe(mockInfo);
    });

    test('getSystemProfile should return system profile', async () => {
      const mockProfile = {
        os_name: 'Windows',
        hostname: 'TEST-PC',
        cpu_count: 8
      };
      mockInvoke.mockResolvedValue(mockProfile);

      const result = await tauriApi.getSystemProfile();

      expect(mockInvoke).toHaveBeenCalledWith('get_system_profile');
      expect(result).toEqual(mockProfile);
    });

    test('collectSystemInfo should collect and return system info', async () => {
      const mockSystemInfo = {
        os_name: 'Windows',
        hostname: 'TEST-PC',
        cpu_count: 8,
        memory_total: 8589934592
      };
      mockInvoke.mockResolvedValue(mockSystemInfo);

      const result = await tauriApi.collectSystemInfo();

      expect(mockInvoke).toHaveBeenCalledWith('collect_system_info');
      expect(result).toEqual(mockSystemInfo);
    });
  });

  describe('LLM Management', () => {
    test('getLlmInfo should return LLM information', async () => {
      const mockLlmInfo = {
        model_path: 'C:\\AppData\\OptiAI\\models\\phi-2-q4.gguf',
        model_loaded: true,
        model_exists: true,
        model_size: 1234567890
      };
      mockInvoke.mockResolvedValue(mockLlmInfo);

      const result = await tauriApi.getLlmInfo();

      expect(mockInvoke).toHaveBeenCalledWith('get_llm_info');
      expect(result).toEqual(mockLlmInfo);
    });

    test('initLlm should initialize LLM', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await tauriApi.initLlm();

      expect(mockInvoke).toHaveBeenCalledWith('init_llm');
      expect(result).toBeUndefined();
    });
  });

  describe('Directory Scanning', () => {
    test('scanDirectory should scan specified directory', async () => {
      const mockScanResult = {
        scan_id: 'scan-123',
        path: 'C:\\Test',
        scanned_at: '2024-01-01T00:00:00Z',
        summary: {
          total_files: 100,
          total_size: 1024000,
          scan_duration: 2.5,
          directories_scanned: 10,
          duplicates_found: 5
        },
        items: [],
        duplicates: []
      };
      mockInvoke.mockResolvedValue(mockScanResult);

      const result = await tauriApi.scanDirectory('C:\\Test');

      expect(mockInvoke).toHaveBeenCalledWith('scan_directory', { path: 'C:\\Test' });
      expect(result).toEqual(mockScanResult);
    });

    test('getScanResult should retrieve scan result by ID', async () => {
      const mockScanResult = {
        scan_id: 'scan-123',
        path: 'C:\\Test',
        scanned_at: '2024-01-01T00:00:00Z',
        summary: {
          total_files: 100,
          total_size: 1024000,
          scan_duration: 2.5,
          directories_scanned: 10,
          duplicates_found: 5
        },
        items: [],
        duplicates: []
      };
      mockInvoke.mockResolvedValue(mockScanResult);

      const result = await tauriApi.getScanResult('scan-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_scan_result', { scanId: 'scan-123' });
      expect(result).toEqual(mockScanResult);
    });

    test('listScanResults should return list of scan IDs', async () => {
      const mockScanIds = ['scan-123', 'scan-456', 'scan-789'];
      mockInvoke.mockResolvedValue(mockScanIds);

      const result = await tauriApi.listScanResults();

      expect(mockInvoke).toHaveBeenCalledWith('list_scan_results');
      expect(result).toEqual(mockScanIds);
    });
  });

  describe('AI Suggestions', () => {
    test('generateAiSuggestions should generate AI suggestions', async () => {
      const mockSuggestions = [
        {
          title: 'Duplicate Files Detected',
          description: 'Found 5 duplicate files taking up 50 MB of space.',
          confidence: 0.9,
          category: 'cleanup'
        },
        {
          title: 'Large Files Found',
          description: 'Found 3 files larger than 100MB.',
          confidence: 0.8,
          category: 'optimization'
        }
      ];
      mockInvoke.mockResolvedValue(mockSuggestions);

      const result = await tauriApi.generateAiSuggestions('scan-123');

      expect(mockInvoke).toHaveBeenCalledWith('generate_ai_suggestions', { scanId: 'scan-123' });
      expect(result).toEqual(mockSuggestions);
    });

    test('generateOptimizationSuggestions should generate optimization suggestions', async () => {
      const mockOptimizations = [
        {
          action_type: 'delete',
          target: 'C:\\Temp\\old_file.txt',
          description: 'Delete temporary file',
          risk_level: 'low'
        }
      ];
      mockInvoke.mockResolvedValue(mockOptimizations);

      const result = await tauriApi.generateOptimizationSuggestions('scan-123');

      expect(mockInvoke).toHaveBeenCalledWith('generate_optimization_suggestions', { scanId: 'scan-123' });
      expect(result).toEqual(mockOptimizations);
    });

    test('executeOptimization should execute optimization action', async () => {
      const mockResult = {
        success: true,
        message: 'Optimization completed successfully',
        action_id: 'action-123'
      };
      mockInvoke.mockResolvedValue(mockResult);

      const result = await tauriApi.executeOptimization('delete', 'C:\\Temp\\old_file.txt');

      expect(mockInvoke).toHaveBeenCalledWith('execute_optimization', { 
        actionType: 'delete', 
        target: 'C:\\Temp\\old_file.txt' 
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('Process Management', () => {
    test('getProcesses should return list of processes', async () => {
      const mockProcesses = [
        {
          pid: 1234,
          name: 'notepad.exe',
          cpu_percent: 5.2,
          memory_percent: 2.1,
          memory_usage: 2097152,
          status: 'Running'
        },
        {
          pid: 5678,
          name: 'chrome.exe',
          cpu_percent: 15.8,
          memory_percent: 8.5,
          memory_usage: 8912896,
          status: 'Running'
        }
      ];
      mockInvoke.mockResolvedValue(mockProcesses);

      const result = await tauriApi.getProcesses();

      expect(mockInvoke).toHaveBeenCalledWith('get_processes');
      expect(result).toEqual(mockProcesses);
    });

    test('killProcess should kill process by PID', async () => {
      const mockResult = {
        success: true,
        message: 'Process killed successfully'
      };
      mockInvoke.mockResolvedValue(mockResult);

      const result = await tauriApi.killProcess(1234);

      expect(mockInvoke).toHaveBeenCalledWith('kill_process', { pid: 1234 });
      expect(result).toEqual(mockResult);
    });
  });

  describe('Startup Management', () => {
    test('getStartupPrograms should return startup programs', async () => {
      const mockStartupPrograms = [
        {
          name: 'Discord',
          path: 'C:\\Users\\User\\AppData\\Local\\Discord\\Update.exe',
          enabled: true,
          location: 'registry'
        },
        {
          name: 'Steam',
          path: 'C:\\Program Files (x86)\\Steam\\steam.exe',
          enabled: false,
          location: 'registry'
        }
      ];
      mockInvoke.mockResolvedValue(mockStartupPrograms);

      const result = await tauriApi.getStartupPrograms();

      expect(mockInvoke).toHaveBeenCalledWith('get_startup_programs');
      expect(result).toEqual(mockStartupPrograms);
    });

    test('toggleStartupProgram should toggle startup program', async () => {
      const mockResult = {
        success: true,
        message: 'Startup program toggled successfully'
      };
      mockInvoke.mockResolvedValue(mockResult);

      const result = await tauriApi.toggleStartupProgram('Discord', false);

      expect(mockInvoke).toHaveBeenCalledWith('toggle_startup_program', { 
        name: 'Discord', 
        enabled: false 
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('Settings Management', () => {
    test('saveSettings should save settings', async () => {
      const mockSettings = {
        version: '1.0.0',
        theme: 'dark',
        auto_scan_on_start: true,
        notifications_enabled: true
      };
      mockInvoke.mockResolvedValue(undefined);

      const result = await tauriApi.saveSettings(mockSettings);

      expect(mockInvoke).toHaveBeenCalledWith('save_settings', { settings: mockSettings });
      expect(result).toBeUndefined();
    });

    test('loadSettings should load settings', async () => {
      const mockSettings = {
        version: '1.0.0',
        theme: 'dark',
        auto_scan_on_start: true,
        notifications_enabled: true,
        scan_directories: ['C:\\'],
        exclude_directories: ['C:\\Windows'],
        language: 'en',
        auto_cleanup_enabled: false,
        max_scan_depth: 5,
        llm_model: 'phi-2-q4',
        llm_threads: 2,
        telemetry_enabled: false,
        first_run_completed: true,
        enable_ai: true
      };
      mockInvoke.mockResolvedValue(mockSettings);

      const result = await tauriApi.loadSettings();

      expect(mockInvoke).toHaveBeenCalledWith('load_settings');
      expect(result).toEqual(mockSettings);
    });
  });

  describe('System Analysis', () => {
    test('analyzeSystemMetrics should analyze system metrics', async () => {
      const mockAnalysis = [
        {
          title: 'High CPU Usage',
          description: 'CPU usage is at 85%. Consider closing unnecessary programs.',
          confidence: 0.9,
          category: 'performance'
        },
        {
          title: 'Low Disk Space',
          description: 'Disk usage is at 95%. Free up space by deleting unnecessary files.',
          confidence: 0.95,
          category: 'storage'
        }
      ];
      mockInvoke.mockResolvedValue(mockAnalysis);

      const result = await tauriApi.analyzeSystemMetrics();

      expect(mockInvoke).toHaveBeenCalledWith('analyze_system_metrics');
      expect(result).toEqual(mockAnalysis);
    });
  });

  describe('Error Handling', () => {
    test('all functions should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      mockInvoke.mockRejectedValue(networkError);

      // Test a few key functions
      await expect(tauriApi.getMetrics()).rejects.toThrow('Network error');
      await expect(tauriApi.getSystemInfo()).rejects.toThrow('Network error');
      await expect(tauriApi.getProcesses()).rejects.toThrow('Network error');
    });

    test('all functions should handle invalid parameters', async () => {
      const invalidParamError = new Error('Invalid parameter');
      mockInvoke.mockRejectedValue(invalidParamError);

      await expect(tauriApi.scanDirectory('')).rejects.toThrow('Invalid parameter');
      await expect(tauriApi.getScanResult('')).rejects.toThrow('Invalid parameter');
      await expect(tauriApi.killProcess(0)).rejects.toThrow('Invalid parameter');
    });
  });
});
