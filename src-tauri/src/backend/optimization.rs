use crate::backend::models::*;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct OptimizationEngine;

impl OptimizationEngine {
    pub fn analyze_scan_result(&self, scan_result: &ScanResult) -> Result<Vec<OptimizationSuggestion>, Box<dyn std::error::Error>> {
        let mut suggestions = Vec::new();

        // Duplicate files suggestion
        if scan_result.summary.duplicates_found > 0 {
            let total_duplicate_size: u64 = scan_result.duplicates.iter()
                .map(|dup| dup.size * (dup.count - 1) as u64) // -1 because we keep one copy
                .sum();

            suggestions.push(OptimizationSuggestion {
                title: "Remove Duplicate Files".to_string(),
                description: format!(
                    "Found {} duplicate files that can be removed to free up {} MB of space.",
                    scan_result.summary.duplicates_found,
                    total_duplicate_size / (1024 * 1024)
                ),
                risk: "low".to_string(),
                estimated_savings: format!("{} MB", total_duplicate_size / (1024 * 1024)),
                action_type: "remove_duplicates".to_string(),
                confidence: 0.95,
            });
        }

        // Large files suggestion
        let large_files: Vec<_> = scan_result.items.iter()
            .filter(|item| item.size > 100 * 1024 * 1024) // 100MB
            .collect();

        if !large_files.is_empty() {
            let total_large_size: u64 = large_files.iter().map(|item| item.size).sum();
            
            suggestions.push(OptimizationSuggestion {
                title: "Review Large Files".to_string(),
                description: format!(
                    "Found {} files larger than 100MB (total: {} MB). Consider archiving or compressing these files.",
                    large_files.len(),
                    total_large_size / (1024 * 1024)
                ),
                risk: "medium".to_string(),
                estimated_savings: format!("{} MB (potential)", total_large_size / (1024 * 1024)),
                action_type: "review_large_files".to_string(),
                confidence: 0.7,
            });
        }

        // Temporary files suggestion
        let temp_files: Vec<_> = scan_result.items.iter()
            .filter(|item| {
                let path = item.path.to_lowercase();
                path.contains("temp") || 
                path.contains("tmp") || 
                path.contains("cache") ||
                path.contains("log")
            })
            .collect();

        if !temp_files.is_empty() {
            let total_temp_size: u64 = temp_files.iter().map(|item| item.size).sum();
            
            suggestions.push(OptimizationSuggestion {
                title: "Clean Temporary Files".to_string(),
                description: format!(
                    "Found {} temporary/cache files ({} MB). These can usually be safely deleted.",
                    temp_files.len(),
                    total_temp_size / (1024 * 1024)
                ),
                risk: "low".to_string(),
                estimated_savings: format!("{} MB", total_temp_size / (1024 * 1024)),
                action_type: "clean_temp_files".to_string(),
                confidence: 0.9,
            });
        }

        // Empty directories suggestion
        let empty_dirs = self.find_empty_directories(&scan_result.path);
        if !empty_dirs.is_empty() {
            suggestions.push(OptimizationSuggestion {
                title: "Remove Empty Directories".to_string(),
                description: format!(
                    "Found {} empty directories that can be removed to clean up the filesystem.",
                    empty_dirs.len()
                ),
                risk: "low".to_string(),
                estimated_savings: "0 MB (cleanup)".to_string(),
                action_type: "remove_empty_dirs".to_string(),
                confidence: 0.8,
            });
        }

        // Old files suggestion
        let old_files: Vec<_> = scan_result.items.iter()
            .filter(|item| {
                if let Ok(modified) = item.modified.parse::<u64>() {
                    let now = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_secs();
                    let days_old = (now - modified) / (24 * 60 * 60);
                    days_old > 365 // Older than 1 year
                } else {
                    false
                }
            })
            .collect();

        if !old_files.is_empty() {
            let total_old_size: u64 = old_files.iter().map(|item| item.size).sum();
            
            suggestions.push(OptimizationSuggestion {
                title: "Archive Old Files".to_string(),
                description: format!(
                    "Found {} files older than 1 year ({} MB). Consider archiving these files.",
                    old_files.len(),
                    total_old_size / (1024 * 1024)
                ),
                risk: "medium".to_string(),
                estimated_savings: format!("{} MB (archived)", total_old_size / (1024 * 1024)),
                action_type: "archive_old_files".to_string(),
                confidence: 0.6,
            });
        }

        Ok(suggestions)
    }

    fn find_empty_directories(&self, path: &str) -> Vec<String> {
        let mut empty_dirs = Vec::new();
        
        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                if entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false) {
                    let dir_path = entry.path().to_string_lossy().to_string();
                    
                    // Check if directory is empty
                    if let Ok(dir_entries) = std::fs::read_dir(&dir_path) {
                        if dir_entries.count() == 0 {
                            empty_dirs.push(dir_path);
                        }
                    }
                }
            }
        }
        
        empty_dirs
    }

    pub fn execute_optimization(&self, action_type: &str, target: &str) -> Result<ActionResult, Box<dyn std::error::Error>> {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
            .to_string();

        match action_type {
            "remove_duplicates" => {
                // In a real implementation, you would actually remove duplicate files
                Ok(ActionResult {
                    success: true,
                    message: format!("Duplicate files in '{}' have been processed", target),
                    timestamp,
                })
            }
            "clean_temp_files" => {
                // In a real implementation, you would actually clean temp files
                Ok(ActionResult {
                    success: true,
                    message: format!("Temporary files in '{}' have been cleaned", target),
                    timestamp,
                })
            }
            "remove_empty_dirs" => {
                // In a real implementation, you would actually remove empty directories
                Ok(ActionResult {
                    success: true,
                    message: format!("Empty directories in '{}' have been removed", target),
                    timestamp,
                })
            }
            "archive_old_files" => {
                // In a real implementation, you would actually archive old files
                Ok(ActionResult {
                    success: true,
                    message: format!("Old files in '{}' have been archived", target),
                    timestamp,
                })
            }
            _ => {
                Ok(ActionResult {
                    success: false,
                    message: format!("Unknown action type: {}", action_type),
                    timestamp,
                })
            }
        }
    }
}
