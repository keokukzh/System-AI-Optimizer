use crate::backend::models::*;
use serde_json;
use std::fs;
use std::path::PathBuf;
use std::env;
use std::io;

pub struct StorageManager {
    app_data_path: PathBuf,
}

impl StorageManager {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let app_data = env::var("APPDATA")?;
        let app_data_path = PathBuf::from(app_data).join("OptiAI");
        
        Ok(Self { app_data_path })
    }

    pub fn init_storage(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Check if we have write permissions to the app data directory
        self.check_write_permissions()?;
        
        // Check available disk space (require at least 100MB)
        self.check_disk_space(100 * 1024 * 1024)?;
        
        // Create directory structure
        let dirs = vec![
            "scans",
            "settings", 
            "cache",
            "logs",
            "models",
        ];

        for dir in dirs {
            let path = self.app_data_path.join(dir);
            fs::create_dir_all(&path)
                .map_err(|e| OptiAIError::StorageError(format!("Failed to create directory {}: {}", path.display(), e)))?;
        }

        Ok(())
    }

    fn check_write_permissions(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Try to create a test file to check write permissions
        let test_file = self.app_data_path.join(".write_test");
        
        match fs::write(&test_file, "test") {
            Ok(_) => {
                // Clean up test file
                let _ = fs::remove_file(&test_file);
                Ok(())
            }
            Err(e) => {
                Err(Box::new(OptiAIError::PermissionDenied(format!(
                    "No write permission to {}: {}", 
                    self.app_data_path.display(), 
                    e
                ))))
            }
        }
    }

    fn check_disk_space(&self, required_bytes: u64) -> Result<(), Box<dyn std::error::Error>> {
        // Get available disk space for the app data directory
        let metadata = fs::metadata(&self.app_data_path)
            .map_err(|e| OptiAIError::StorageError(format!("Cannot access directory {}: {}", self.app_data_path.display(), e)))?;
        
        // On Windows, we can't easily get disk space from metadata, so we'll try a different approach
        // Try to create a temporary file to test if we have enough space
        let test_file = self.app_data_path.join(".space_test");
        
        // Create a buffer of the required size
        let test_data = vec![0u8; required_bytes as usize];
        
        match fs::write(&test_file, &test_data) {
            Ok(_) => {
                // Clean up test file
                let _ = fs::remove_file(&test_file);
                Ok(())
            }
            Err(e) if e.kind() == io::ErrorKind::WriteZero => {
                Err(Box::new(OptiAIError::StorageError(format!(
                    "Insufficient disk space. Required: {} MB, available: insufficient", 
                    required_bytes / (1024 * 1024)
                ))))
            }
            Err(e) => {
                Err(Box::new(OptiAIError::StorageError(format!(
                    "Failed to check disk space: {}", e
                ))))
            }
        }
    }

    pub fn save_settings(&self, settings: &Settings) -> Result<(), Box<dyn std::error::Error>> {
        let settings_path = self.app_data_path.join("settings").join("settings.json");
        
        // Check if we have enough space for the settings file
        let json = serde_json::to_string_pretty(settings)
            .map_err(|e| OptiAIError::StorageError(format!("Failed to serialize settings: {}", e)))?;
        
        let required_space = json.len() as u64;
        self.check_disk_space(required_space)?;
        
        // Create backup of existing settings if it exists
        if settings_path.exists() {
            let backup_path = settings_path.with_extension("json.bak");
            let _ = fs::copy(&settings_path, &backup_path);
        }
        
        fs::write(&settings_path, &json)
            .map_err(|e| OptiAIError::StorageError(format!("Failed to write settings to {}: {}", settings_path.display(), e)))?;
        
        Ok(())
    }

    pub fn load_settings(&self) -> Result<Settings, Box<dyn std::error::Error>> {
        let settings_path = self.app_data_path.join("settings").join("settings.json");
        
        if !settings_path.exists() {
            return Ok(Settings::default());
        }

        let json = fs::read_to_string(settings_path)?;
        let settings: Settings = serde_json::from_str(&json)?;
        Ok(settings)
    }

    pub fn settings_exist(&self) -> bool {
        let settings_path = self.app_data_path.join("settings").join("settings.json");
        settings_path.exists()
    }

    pub fn save_scan_result(&self, scan_result: &ScanResult) -> Result<(), Box<dyn std::error::Error>> {
        let scan_path = self.app_data_path.join("scans").join(format!("{}.json", scan_result.scan_id));
        
        // Check if we have enough space for the scan result
        let json = serde_json::to_string_pretty(scan_result)
            .map_err(|e| OptiAIError::StorageError(format!("Failed to serialize scan result: {}", e)))?;
        
        let required_space = json.len() as u64;
        self.check_disk_space(required_space)?;
        
        // Create backup of existing scan result if it exists
        if scan_path.exists() {
            let backup_path = scan_path.with_extension("json.bak");
            let _ = fs::copy(&scan_path, &backup_path);
        }
        
        fs::write(&scan_path, &json)
            .map_err(|e| OptiAIError::StorageError(format!("Failed to write scan result to {}: {}", scan_path.display(), e)))?;
        
        Ok(())
    }

    pub fn load_scan_result(&self, scan_id: &str) -> Result<ScanResult, Box<dyn std::error::Error>> {
        let scan_path = self.app_data_path.join("scans").join(format!("{}.json", scan_id));
        let json = fs::read_to_string(scan_path)?;
        let scan_result: ScanResult = serde_json::from_str(&json)?;
        Ok(scan_result)
    }

    pub fn list_scan_results(&self) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        let scans_dir = self.app_data_path.join("scans");
        let mut scan_ids = Vec::new();

        if scans_dir.exists() {
            for entry in fs::read_dir(scans_dir)? {
                let entry = entry?;
                if let Some(file_name) = entry.file_name().to_str() {
                    if file_name.ends_with(".json") {
                        let scan_id = file_name.trim_end_matches(".json");
                        scan_ids.push(scan_id.to_string());
                    }
                }
            }
        }

        scan_ids.sort();
        Ok(scan_ids)
    }

    pub fn save_system_profile(&self, profile: &serde_json::Value) -> Result<(), Box<dyn std::error::Error>> {
        let profile_path = self.app_data_path.join("settings").join("system_profile.json");
        
        // Check if we have enough space for the system profile
        let json = serde_json::to_string_pretty(profile)
            .map_err(|e| OptiAIError::StorageError(format!("Failed to serialize system profile: {}", e)))?;
        
        let required_space = json.len() as u64;
        self.check_disk_space(required_space)?;
        
        // Create backup of existing system profile if it exists
        if profile_path.exists() {
            let backup_path = profile_path.with_extension("json.bak");
            let _ = fs::copy(&profile_path, &backup_path);
        }
        
        fs::write(&profile_path, &json)
            .map_err(|e| OptiAIError::StorageError(format!("Failed to write system profile to {}: {}", profile_path.display(), e)))?;
        
        Ok(())
    }

    pub fn load_system_profile(&self) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        let profile_path = self.app_data_path.join("settings").join("system_profile.json");
        
        if !profile_path.exists() {
            return Ok(serde_json::Value::Object(serde_json::Map::new()));
        }

        let json = fs::read_to_string(profile_path)?;
        let profile: serde_json::Value = serde_json::from_str(&json)?;
        Ok(profile)
    }

    #[allow(dead_code)]
    pub fn get_app_data_path(&self) -> &PathBuf {
        &self.app_data_path
    }
}
