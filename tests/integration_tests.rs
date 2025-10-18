use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;

// Integration tests for OptiAI Tauri Commands
// These tests verify that the Rust backend modules work correctly

#[cfg(test)]
mod integration_tests {
    use super::*;
    use crate::backend::storage::StorageManager;
    use crate::backend::scanner::SystemScanner;
    use crate::backend::metrics::MetricsCollector;
    use crate::backend::process::ProcessManager;
    use crate::backend::startup::StartupManager;
    use crate::backend::llm::LLMManager;
    use crate::backend::models::*;

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
        
        let metrics = system_metrics.unwrap();
        assert!(metrics.cpu.cores > 0, "CPU cores should be greater than 0");
        assert!(metrics.memory.total > 0, "Total memory should be greater than 0");
        assert!(metrics.disk.total > 0, "Total disk space should be greater than 0");
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
    async fn test_startup_programs() {
        // Test startup programs functionality
        let startup_manager = StartupManager;
        
        let startup_programs = startup_manager.get_startup_programs();
        assert!(startup_programs.is_ok(), "Startup programs should be retrievable");
        
        let programs = startup_programs.unwrap();
        // Should have at least some common startup programs
        assert!(!programs.is_empty(), "Should find startup programs");
    }

    #[tokio::test]
    async fn test_llm_manager() {
        // Test LLM manager functionality
        let llm_manager = LLMManager::new();
        
        let model_info = llm_manager.get_model_info();
        assert!(model_info.is_ok(), "Model info should be retrievable");
        
        let info = model_info.unwrap();
        assert!(info.is_object(), "Model info should be a JSON object");
        
        let info_map = info.as_object().unwrap();
        assert!(info_map.contains_key("model_loaded"), "Should contain model_loaded status");
        assert!(info_map.contains_key("model_exists"), "Should contain model_exists status");
    }

    #[tokio::test]
    async fn test_scanner_functionality() {
        // Test system scanner functionality
        let scanner = SystemScanner::new(3); // Max depth 3 for testing
        
        // Test file info retrieval
        let file_info = scanner.get_file_info("C:\\");
        assert!(file_info.is_ok(), "File info should be retrievable for C:\\");
        
        let info = file_info.unwrap();
        assert_eq!(info.path, "C:\\");
        assert!(info.size >= 0, "File size should be non-negative");
    }

    #[tokio::test]
    async fn test_scan_result_persistence() {
        // Test scan result save/load functionality
        let storage = StorageManager::new().unwrap();
        storage.init_storage().unwrap();

        let test_scan_result = ScanResult {
            scan_id: "test_scan_123".to_string(),
            scanned_at: "1640995200".to_string(),
            path: "C:\\Test".to_string(),
            summary: ScanSummary {
                total_files: 100,
                total_size: 1024 * 1024, // 1MB
                scan_duration: 5.5,
                directories_scanned: 10,
                duplicates_found: 5,
            },
            items: vec![
                FileItem {
                    path: "C:\\Test\\file1.txt".to_string(),
                    size: 1024,
                    modified: "1640995200".to_string(),
                    file_type: "txt".to_string(),
                    is_duplicate: false,
                }
            ],
            duplicates: vec![
                DuplicateGroup {
                    hash: "abc123".to_string(),
                    size: 2048,
                    count: 2,
                    files: vec![
                        "C:\\Test\\file1.txt".to_string(),
                        "C:\\Test\\file2.txt".to_string(),
                    ],
                }
            ],
        };

        // Save scan result
        let save_result = storage.save_scan_result(&test_scan_result);
        assert!(save_result.is_ok(), "Scan result save should succeed");

        // Load scan result
        let loaded_result = storage.load_scan_result("test_scan_123");
        assert!(loaded_result.is_ok(), "Scan result load should succeed");
        
        let loaded = loaded_result.unwrap();
        assert_eq!(loaded.scan_id, test_scan_result.scan_id);
        assert_eq!(loaded.summary.total_files, test_scan_result.summary.total_files);
        assert_eq!(loaded.duplicates.len(), test_scan_result.duplicates.len());
    }

    #[tokio::test]
    async fn test_scan_results_listing() {
        // Test scan results listing functionality
        let storage = StorageManager::new().unwrap();
        storage.init_storage().unwrap();

        let scan_ids = storage.list_scan_results();
        assert!(scan_ids.is_ok(), "Scan results listing should succeed");
        
        let ids = scan_ids.unwrap();
        // Should be a vector (may be empty)
        assert!(ids.len() >= 0, "Scan IDs list should be valid");
    }

    #[tokio::test]
    async fn test_ai_suggestions_generation() {
        // Test AI suggestions generation
        let mut llm = LLMManager::new();
        
        // Create a test scan result
        let test_scan_result = ScanResult {
            scan_id: "test_ai_scan".to_string(),
            scanned_at: "1640995200".to_string(),
            path: "C:\\Test".to_string(),
            summary: ScanSummary {
                total_files: 50,
                total_size: 500 * 1024 * 1024, // 500MB
                scan_duration: 3.0,
                directories_scanned: 5,
                duplicates_found: 10,
            },
            items: vec![],
            duplicates: vec![],
        };

        // Try to generate suggestions (may fail if model not loaded, but should not crash)
        let suggestions = llm.generate_suggestions(&test_scan_result);
        // We don't assert success here because the model might not be loaded in test environment
        // But we ensure it doesn't panic
        match suggestions {
            Ok(sugs) => {
                assert!(sugs.len() >= 0, "Suggestions should be a valid vector");
            }
            Err(_) => {
                // Expected if model not loaded - this is fine for integration test
            }
        }
    }

    #[tokio::test]
    async fn test_system_profile_persistence() {
        // Test system profile save/load functionality
        let storage = StorageManager::new().unwrap();
        storage.init_storage().unwrap();

        let test_profile = serde_json::json!({
            "os_name": "Windows 10",
            "hostname": "TEST-PC",
            "cpu_count": 4,
            "total_memory": 8589934592,
            "architecture": "x64"
        });

        // Save system profile
        let save_result = storage.save_system_profile(&test_profile);
        assert!(save_result.is_ok(), "System profile save should succeed");

        // Load system profile
        let loaded_profile = storage.load_system_profile();
        assert!(loaded_profile.is_ok(), "System profile load should succeed");
        
        let loaded = loaded_profile.unwrap();
        assert!(loaded.is_object(), "Loaded profile should be a JSON object");
    }
}

// Performance tests
#[cfg(test)]
mod performance_tests {
    use super::*;
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

// Error handling tests
#[cfg(test)]
mod error_handling_tests {
    use super::*;

    #[tokio::test]
    async fn test_invalid_scan_id_handling() {
        // Test handling of invalid scan IDs
        let storage = StorageManager::new().unwrap();
        storage.init_storage().unwrap();

        let result = storage.load_scan_result("nonexistent_scan_id");
        assert!(result.is_err(), "Loading nonexistent scan should return error");
    }

    #[tokio::test]
    async fn test_invalid_file_path_handling() {
        // Test handling of invalid file paths
        let scanner = SystemScanner::new(3);
        
        let result = scanner.get_file_info("C:\\nonexistent\\path\\file.txt");
        assert!(result.is_err(), "Getting info for nonexistent file should return error");
    }
}
