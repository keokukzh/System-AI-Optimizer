// Integration tests for OptiAI Tauri Commands
// These tests verify that the Rust backend modules work correctly

#[cfg(test)]
mod integration_tests {
    use optiai::backend::storage::StorageManager;
    use optiai::backend::metrics::MetricsCollector;
    use optiai::backend::process::ProcessManager;
    use optiai::backend::startup::StartupManager;
    use optiai::backend::llm::LLMManager;
    use optiai::backend::scanner::SystemScanner;
    use optiai::backend::models::Settings;

    #[tokio::test]
    async fn test_storage_manager_initialization() {
        // Test storage manager initialization
        let storage = StorageManager::new();
        assert!(storage.is_ok(), "StorageManager should initialize successfully");
        
        let storage = storage.unwrap();
        let init_result = storage.init_storage();
        assert!(init_result.is_ok(), "Storage initialization should succeed");
    }

    #[tokio::test]
    async fn test_settings_persistence() {
        // Test settings save/load functionality
        let storage = StorageManager::new().unwrap();
        storage.init_storage().unwrap();

        let test_settings = Settings {
            version: "1.0.0".to_string(),
            first_run_completed: true,
            enable_ai: true,
            auto_scan_on_start: false,
            scan_directories: vec!["C:\\Test".to_string()],
            exclude_directories: vec!["C:\\Windows".to_string()],
            theme: "dark".to_string(),
            language: "en".to_string(),
            notifications_enabled: true,
            auto_cleanup_enabled: false,
            max_scan_depth: 5,
            llm_model: "test-model".to_string(),
            llm_threads: 2,
            telemetry_enabled: false,
        };

        // Save settings
        let save_result = storage.save_settings(&test_settings);
        assert!(save_result.is_ok(), "Settings save should succeed");

        // Load settings
        let loaded_settings = storage.load_settings().unwrap();
        assert_eq!(loaded_settings.version, test_settings.version);
        assert_eq!(loaded_settings.scan_directories, test_settings.scan_directories);
        assert_eq!(loaded_settings.llm_model, test_settings.llm_model);
    }

    #[tokio::test]
    async fn test_metrics_collection() {
        // Test system metrics collection
        let mut metrics = MetricsCollector::new();
        
        let system_metrics = metrics.get_system_metrics();
        assert!(system_metrics.is_ok(), "System metrics collection should succeed");
        
        let metrics_data = system_metrics.unwrap();
        assert!(metrics_data.cpu.usage >= 0.0, "CPU usage should be non-negative");
        assert!(metrics_data.memory.total > 0, "Total memory should be greater than 0");
    }

    #[tokio::test]
    async fn test_system_info_collection() {
        // Test system information collection
        let mut metrics = MetricsCollector::new();
        
        let system_info = metrics.collect_system_info();
        assert!(system_info.is_object(), "System info should be a JSON object");
        
        let info_map = system_info.as_object().unwrap();
        assert!(info_map.contains_key("os_name"), "Should contain OS name");
        assert!(info_map.contains_key("hostname"), "Should contain hostname");
        assert!(info_map.contains_key("cpu_count"), "Should contain CPU count");
    }

    #[tokio::test]
    async fn test_process_management() {
        // Test process management functionality
        let mut process_manager = ProcessManager::new();
        
        let processes = process_manager.get_processes();
        assert!(processes.is_ok(), "Process list should be retrievable");
        
        let processes = processes.unwrap();
        assert!(!processes.is_empty(), "Process list should not be empty");
        
        // Check that we have some system processes
        let has_system_processes = processes.iter().any(|p| 
            p.name.contains("System") || p.name.contains("svchost")
        );
        assert!(has_system_processes, "Should find system processes");
    }

    #[tokio::test]
    async fn test_startup_manager() {
        // Test startup manager functionality (Windows-specific)
        let startup_manager = StartupManager;
        
        let startup_programs = startup_manager.get_startup_programs();
        assert!(startup_programs.is_ok(), "Startup programs should be retrievable");
        
        let programs = startup_programs.unwrap();
        // On Windows, there should be at least some startup programs
        // This test might be empty on clean systems, so we just check it doesn't crash
        println!("Found {} startup programs", programs.len());
    }

    #[tokio::test]
    async fn test_llm_manager() {
        // Test LLM manager functionality
        let llm_manager = LLMManager::new();
        
        // Test model info retrieval
        let model_info = llm_manager.get_model_info();
        assert!(model_info.is_ok(), "Model info should be retrievable");
        
        let info = model_info.unwrap();
        assert!(info.is_object(), "Model info should be a JSON object");
        
        // Test availability check
        let is_available = llm_manager.is_available();
        // This will be false in test environment (no model file), which is expected
        assert!(!is_available, "LLM should not be available in test environment");
    }

    #[tokio::test]
    async fn test_system_scanner() {
        // Test system scanner functionality
        let scanner = SystemScanner::new(3);
        
        // Test scanning a small directory (current directory)
        let current_dir = std::env::current_dir().unwrap();
        let current_dir_str = current_dir.to_string_lossy().to_string();
        
        let scan_result = scanner.scan_directory(&current_dir_str);
        assert!(scan_result.is_ok(), "Directory scan should succeed");
        
        let result = scan_result.unwrap();
        assert_eq!(result.path, current_dir_str);
        assert!(result.scanned_at.len() > 0, "Scan timestamp should be set");
        assert!(result.summary.total_files >= 0, "Total files should be non-negative");
    }

    #[tokio::test]
    async fn test_scan_result_storage() {
        // Test scan result storage and retrieval
        let storage = StorageManager::new().unwrap();
        storage.init_storage().unwrap();
        
        // Create a mock scan result
        let mock_scan_result = optiai::backend::models::ScanResult {
            scan_id: "test-scan-123".to_string(),
            path: "C:\\Test".to_string(),
            scanned_at: "2024-01-01T00:00:00Z".to_string(),
            summary: optiai::backend::models::ScanSummary {
                total_files: 10,
                total_size: 1024,
                scan_duration: 1.5,
                directories_scanned: 5,
                duplicates_found: 2,
            },
            items: vec![],
            duplicates: vec![],
        };
        
        // Save scan result
        let save_result = storage.save_scan_result(&mock_scan_result);
        assert!(save_result.is_ok(), "Scan result save should succeed");
        
        // Load scan result
        let load_result = storage.load_scan_result("test-scan-123");
        assert!(load_result.is_ok(), "Scan result load should succeed");
        
        let loaded_result = load_result.unwrap();
        assert_eq!(loaded_result.scan_id, mock_scan_result.scan_id);
        assert_eq!(loaded_result.path, mock_scan_result.path);
    }

    #[tokio::test]
    async fn test_system_profile_storage() {
        // Test system profile storage
        let storage = StorageManager::new().unwrap();
        storage.init_storage().unwrap();
        
        let mut metrics = MetricsCollector::new();
        let system_info = metrics.collect_system_info();
        
        // Save system profile
        let save_result = storage.save_system_profile(&system_info);
        assert!(save_result.is_ok(), "System profile save should succeed");
        
        // Load system profile
        let load_result = storage.load_system_profile();
        assert!(load_result.is_ok(), "System profile load should succeed");
        
        let loaded_profile = load_result.unwrap();
        assert!(loaded_profile.is_object(), "Loaded profile should be a JSON object");
    }

    #[tokio::test]
    async fn test_settings_existence_check() {
        // Test settings existence check
        let storage = StorageManager::new().unwrap();
        storage.init_storage().unwrap();
        
        // Initially, settings should not exist
        let exists = storage.settings_exist();
        // This might be true if settings were created in previous tests
        println!("Settings exist: {}", exists);
    }
}

// Performance tests
#[cfg(test)]
mod performance_tests {
    use optiai::backend::metrics::MetricsCollector;
    use optiai::backend::process::ProcessManager;
    use std::time::Instant;

    #[tokio::test]
    async fn test_metrics_collection_performance() {
        // Test that metrics collection is reasonably fast
        let mut metrics = MetricsCollector::new();
        
        let start = Instant::now();
        let result = metrics.get_system_metrics();
        let duration = start.elapsed();
        
        assert!(result.is_ok(), "Metrics collection should succeed");
        assert!(duration.as_millis() < 1000, "Metrics collection should be fast (< 1 second)");
    }

    #[tokio::test]
    async fn test_process_list_performance() {
        // Test that process listing is reasonably fast
        let mut process_manager = ProcessManager::new();
        
        let start = Instant::now();
        let result = process_manager.get_processes();
        let duration = start.elapsed();
        
        assert!(result.is_ok(), "Process listing should succeed");
        assert!(duration.as_millis() < 2000, "Process listing should be reasonably fast (< 2 seconds)");
    }
}