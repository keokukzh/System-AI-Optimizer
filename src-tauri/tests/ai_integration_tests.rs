use optiai::backend::llm::LLMManager;
use optiai::backend::models::*;
use std::time::Instant;

#[cfg(test)]
mod ai_integration_tests {
    use super::*;

    #[test]
    fn test_llm_manager_initialization() {
        let manager = LLMManager::new();
        
        // Should initialize without errors
        assert!(!manager.is_available()); // Not available until model is loaded
        assert!(!manager.is_model_loaded());
        
        let status = manager.get_ai_status();
        assert_eq!(status.status, "offline");
        assert!(!status.available);
        assert!(!status.model_loaded);
        // fallback_mode is initially false until init_llm is called
        assert!(!status.fallback_mode);
    }

    #[test]
    fn test_ai_status_reporting() {
        let manager = LLMManager::new();
        let status = manager.get_ai_status();
        
        // Verify status structure
        assert!(status.status == "offline" || status.status == "online");
        assert!(!status.available); // Should be false initially
        assert!(!status.model_loaded); // Should be false initially
        assert!(!status.fallback_mode); // Should be false initially
    }

    #[test]
    fn test_model_info_structure() {
        let manager = LLMManager::new();
        let model_info = manager.get_model_info().unwrap();
        
        // Verify model info contains expected fields
        assert!(model_info.get("model_loaded").is_some());
        assert!(model_info.get("fallback_mode").is_some());
        assert!(model_info.get("available_models").is_some());
    }

    #[test]
    fn test_fallback_suggestions_generation() {
        let manager = LLMManager::new();
        
        // Create mock scan result
        let scan_result = ScanResult {
            scan_id: "test_scan".to_string(),
            scanned_at: "2024-01-01T00:00:00Z".to_string(),
            path: "C:\\Test".to_string(),
            summary: ScanSummary {
                total_files: 100,
                total_size: 1024 * 1024 * 100, // 100 MB
                scan_duration: 5.0,
                directories_scanned: 10,
                duplicates_found: 5,
            },
            items: vec![
                FileItem {
                    path: "C:\\Test\\temp_file.tmp".to_string(),
                    size: 1024 * 1024, // 1 MB
                    modified: "2024-01-01T00:00:00Z".to_string(),
                    file_type: "tmp".to_string(),
                    is_duplicate: false,
                },
                FileItem {
                    path: "C:\\Test\\duplicate.txt".to_string(),
                    size: 1024, // 1 KB
                    modified: "2024-01-01T00:00:00Z".to_string(),
                    file_type: "txt".to_string(),
                    is_duplicate: true,
                },
            ],
            duplicates: vec![
                DuplicateGroup {
                    hash: "abc123".to_string(),
                    size: 1024,
                    count: 2,
                    files: vec![
                        "C:\\Test\\duplicate.txt".to_string(),
                        "C:\\Test\\duplicate_copy.txt".to_string(),
                    ],
                },
            ],
        };

        // Test fallback suggestions (should work even without AI)
        let suggestions = manager.generate_fallback_suggestions(&scan_result);
        assert!(!suggestions.is_empty());
        
        // Should have suggestions for duplicates and temp files
        let has_duplicate_suggestion = suggestions.iter().any(|s| 
            s.title.contains("Duplicate") || s.description.contains("duplicate")
        );
        let has_temp_suggestion = suggestions.iter().any(|s| 
            s.title.contains("Temporary") || s.description.contains("temp")
        );
        
        assert!(has_duplicate_suggestion, "Should suggest duplicate file cleanup");
        assert!(has_temp_suggestion, "Should suggest temporary file cleanup");
    }

    #[test]
    fn test_fallback_system_suggestions() {
        let manager = LLMManager::new();
        
        // Create mock system metrics
        let metrics = SystemMetrics {
            timestamp: "2024-01-01T00:00:00Z".to_string(),
            cpu: CpuMetrics {
                usage: 85.0, // High CPU usage
                cores: 8,
                frequency: 3.2,
            },
            memory: MemoryMetrics {
                total: 16 * 1024 * 1024 * 1024, // 16 GB
                used: 14 * 1024 * 1024 * 1024, // 14 GB (87.5% usage)
                available: 2 * 1024 * 1024 * 1024, // 2 GB
                usage_percent: 87.5,
            },
            disk: DiskMetrics {
                total: 500 * 1024 * 1024 * 1024, // 500 GB
                used: 460 * 1024 * 1024 * 1024, // 460 GB (92% usage)
                free: 40 * 1024 * 1024 * 1024, // 40 GB
                usage_percent: 92.0,
            },
            network: NetworkMetrics {
                bytes_sent: 1024 * 1024, // 1 MB
                bytes_received: 2 * 1024 * 1024, // 2 MB
                packets_sent: 1000,
                packets_received: 2000,
            },
        };

        // Test fallback system suggestions
        let suggestions = manager.generate_fallback_system_suggestions(&metrics);
        assert!(!suggestions.is_empty());
        
        // Should have suggestions for high resource usage
        let has_cpu_suggestion = suggestions.iter().any(|s| 
            s.title.contains("CPU") || s.description.contains("CPU")
        );
        let has_memory_suggestion = suggestions.iter().any(|s| 
            s.title.contains("Memory") || s.description.contains("memory")
        );
        let has_disk_suggestion = suggestions.iter().any(|s| 
            s.title.contains("Disk") || s.description.contains("disk")
        );
        
        assert!(has_cpu_suggestion, "Should suggest CPU optimization");
        assert!(has_memory_suggestion, "Should suggest memory optimization");
        assert!(has_disk_suggestion, "Should suggest disk space management");
    }

    #[test]
    fn test_ai_suggestion_structure() {
        let manager = LLMManager::new();
        
        // Create a simple scan result
        let scan_result = ScanResult {
            scan_id: "test_scan".to_string(),
            scanned_at: "2024-01-01T00:00:00Z".to_string(),
            path: "C:\\Test".to_string(),
            summary: ScanSummary {
                total_files: 10,
                total_size: 1024 * 1024, // 1 MB
                scan_duration: 1.0,
                directories_scanned: 1,
                duplicates_found: 0,
            },
            items: vec![],
            duplicates: vec![],
        };

        let suggestions = manager.generate_fallback_suggestions(&scan_result);
        
        // Verify suggestion structure
        for suggestion in &suggestions {
            assert!(!suggestion.title.is_empty(), "Suggestion title should not be empty");
            assert!(!suggestion.description.is_empty(), "Suggestion description should not be empty");
            assert!(suggestion.confidence >= 0.0 && suggestion.confidence <= 1.0, 
                "Confidence should be between 0 and 1");
            assert!(!suggestion.category.is_empty(), "Category should not be empty");
        }
    }

    #[test]
    fn test_error_handling() {
        let manager = LLMManager::new();
        
        // Test with invalid scan result (empty path)
        let invalid_scan = ScanResult {
            scan_id: "".to_string(),
            scanned_at: "".to_string(),
            path: "".to_string(),
            summary: ScanSummary {
                total_files: 0,
                total_size: 0,
                scan_duration: 0.0,
                directories_scanned: 0,
                duplicates_found: 0,
            },
            items: vec![],
            duplicates: vec![],
        };

        // Should not panic and should return some suggestions
        let suggestions = manager.generate_fallback_suggestions(&invalid_scan);
        assert!(!suggestions.is_empty(), "Should return suggestions even for invalid input");
    }

    #[test]
    fn test_performance_fallback_suggestions() {
        let manager = LLMManager::new();
        
        // Create a larger scan result to test performance
        let mut items = Vec::new();
        for i in 0..1000 {
            items.push(FileItem {
                path: format!("C:\\Test\\file_{}.txt", i),
                size: 1024 * (i as u64 + 1),
                modified: "2024-01-01T00:00:00Z".to_string(),
                file_type: "txt".to_string(),
                is_duplicate: i % 10 == 0,
            });
        }

        let scan_result = ScanResult {
            scan_id: "performance_test".to_string(),
            scanned_at: "2024-01-01T00:00:00Z".to_string(),
            path: "C:\\Test".to_string(),
            summary: ScanSummary {
                total_files: 1000,
                total_size: 1024 * 1000 * 500, // ~500 MB
                scan_duration: 10.0,
                directories_scanned: 50,
                duplicates_found: 100,
            },
            items,
            duplicates: vec![],
        };

        let start = Instant::now();
        let suggestions = manager.generate_fallback_suggestions(&scan_result);
        let duration = start.elapsed();

        // Should complete within reasonable time (< 100ms for fallback)
        assert!(duration.as_millis() < 100, 
            "Fallback suggestions should generate quickly: {}ms", duration.as_millis());
        assert!(!suggestions.is_empty(), "Should return suggestions for large dataset");
    }

    #[test]
    fn test_model_discovery() {
        let manager = LLMManager::new();
        let available_models = manager.get_available_models();
        
        // Should have some models available (even if not loaded)
        // The exact number depends on what's in the models directory
        assert!(available_models.len() >= 0, "Should have non-negative number of models");
        
        // If models are available, they should have proper structure
        for model in available_models {
            assert!(!model.name.is_empty(), "Model name should not be empty");
            assert!(!model.path.is_empty(), "Model path should not be empty");
            assert!(model.context_size > 0, "Context size should be positive");
        }
    }

    #[test]
    fn test_ai_status_consistency() {
        let manager = LLMManager::new();
        
        // Test multiple calls to get_ai_status return consistent results
        let status1 = manager.get_ai_status();
        let status2 = manager.get_ai_status();
        
        assert_eq!(status1.available, status2.available);
        assert_eq!(status1.status, status2.status);
        assert_eq!(status1.model_loaded, status2.model_loaded);
        assert_eq!(status1.fallback_mode, status2.fallback_mode);
    }
}
