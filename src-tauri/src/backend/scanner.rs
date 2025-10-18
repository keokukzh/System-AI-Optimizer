use crate::backend::models::*;
use walkdir::WalkDir;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH, Instant};
use std::sync::{Arc, Mutex};
use std::io;

pub struct SystemScanner {
    max_depth: u32,
    protected_paths: Vec<String>,
}

impl SystemScanner {
    pub fn new(max_depth: u32) -> Self {
        Self { 
            max_depth,
            protected_paths: vec![
                "C:\\Windows".to_string(),
                "C:\\Program Files".to_string(),
                "C:\\Program Files (x86)".to_string(),
                "C:\\System Volume Information".to_string(),
                "C:\\$Recycle.Bin".to_string(),
                "/Windows".to_string(),
                "/System".to_string(),
                "/usr".to_string(),
                "/etc".to_string(),
                "/Library".to_string(),
                "/System/Volumes/Data".to_string(),
            ]
        }
    }

    pub fn scan_directory(&self, path: &str) -> Result<ScanResult, Box<dyn std::error::Error>> {
        // Check if the path is protected
        if self.is_protected_path(path) {
            return Err(Box::new(OptiAIError::PermissionDenied(format!(
                "Cannot scan protected directory: {}", path
            ))));
        }

        // Check if the path exists and is accessible
        if !Path::new(path).exists() {
            return Err(Box::new(OptiAIError::FileSystemError(format!(
                "Directory does not exist: {}", path
            ))));
        }

        // Check if we have read permissions
        if let Err(e) = fs::read_dir(path) {
            return Err(Box::new(OptiAIError::PermissionDenied(format!(
                "No read permission for directory {}: {}", path, e
            ))));
        }

        let start_time = Instant::now();
        let scan_id = self.generate_scan_id();
        
        let _total_files = 0u64;
        let _total_size = 0u64;
        let _directories_scanned = 0u64;
        let mut _items = Vec::new();
        let mut _file_hashes: HashMap<String, Vec<String>> = HashMap::new();

        // Multithreaded scanning
        let items_arc = Arc::new(Mutex::new(Vec::new()));
        let hashes_arc = Arc::new(Mutex::new(HashMap::new()));
        let counters_arc = Arc::new(Mutex::new((0u64, 0u64, 0u64)));

        let walker = WalkDir::new(path)
            .max_depth(self.max_depth as usize)
            .follow_links(false)
            .into_iter();

        for entry in walker {
            match entry {
                Ok(entry) => {
                    let path_str = entry.path().to_string_lossy().to_string();
                    
                    // Skip protected paths even if they're subdirectories
                    if self.is_protected_path(&path_str) {
                        continue;
                    }
                    
                    if entry.file_type().is_file() {
                        if let Ok(metadata) = entry.metadata() {
                            let size = metadata.len();
                            let modified = metadata.modified()
                                .unwrap_or_else(|_| SystemTime::UNIX_EPOCH)
                                .duration_since(UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_secs()
                                .to_string();

                            let file_type = self.get_file_type(&path_str);
                            
                            let file_item = FileItem {
                                path: path_str.clone(),
                                size,
                                modified,
                                file_type,
                                is_duplicate: false,
                            };

                            // Thread-safe updates
                            {
                                let mut items = items_arc.lock().unwrap();
                                items.push(file_item);
                            }

                            {
                                let mut counters = counters_arc.lock().unwrap();
                                counters.0 += 1; // total_files
                                counters.1 += size; // total_size
                            }

                            // Calculate hash for duplicate detection (simplified)
                            if size > 0 {
                                let hash = self.calculate_simple_hash(&path_str, size);
                                {
                                    let mut hashes = hashes_arc.lock().unwrap();
                                    hashes.entry(hash).or_insert_with(Vec::new).push(path_str);
                                }
                            }
                        }
                    } else if entry.file_type().is_dir() {
                        {
                            let mut counters = counters_arc.lock().unwrap();
                            counters.2 += 1; // directories_scanned
                        }
                    }
                }
                Err(e) => {
                    // Log permission errors but continue scanning
                    if e.io_error().map(|io_err| io_err.kind() == io::ErrorKind::PermissionDenied).unwrap_or(false) {
                        // Skip directories we can't access
                        continue;
                    }
                    // For other errors, we might want to log them but continue
                    eprintln!("Warning: Error scanning directory: {}", e);
                }
            }
        }

        // Extract results from Arc<Mutex<>>
        _items = items_arc.lock().unwrap().clone();
        _file_hashes = hashes_arc.lock().unwrap().clone();
        let (total_files, total_size, directories_scanned) = *counters_arc.lock().unwrap();

        // Find duplicates
        let mut duplicates = Vec::new();
        let mut duplicate_count = 0u64;

        for (hash, files) in _file_hashes {
            if files.len() > 1 {
                let size = if let Some(first_file) = files.first() {
                    fs::metadata(first_file).map(|m| m.len()).unwrap_or(0)
                } else {
                    0
                };

                duplicates.push(DuplicateGroup {
                    hash,
                    size,
                    count: files.len() as u32,
                    files: files.clone(),
                });

                duplicate_count += files.len() as u64;

                // Mark files as duplicates
                for file_path in files {
                    if let Some(item) = _items.iter_mut().find(|item| item.path == file_path) {
                        item.is_duplicate = true;
                    }
                }
            }
        }

        let scan_duration = start_time.elapsed().as_secs_f64();

        Ok(ScanResult {
            scan_id,
            scanned_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs()
                .to_string(),
            path: path.to_string(),
            summary: ScanSummary {
                total_files,
                total_size,
                scan_duration,
                directories_scanned,
                duplicates_found: duplicate_count,
            },
            items: _items,
            duplicates,
        })
    }

    fn generate_scan_id(&self) -> String {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        format!("scan_{}", timestamp)
    }

    fn is_protected_path(&self, path: &str) -> bool {
        let normalized_path = path.replace("\\", "/").to_lowercase();
        
        for protected_path in &self.protected_paths {
            let normalized_protected = protected_path.replace("\\", "/").to_lowercase();
            if normalized_path.starts_with(&normalized_protected) {
                return true;
            }
        }
        false
    }

    fn get_file_type(&self, path: &str) -> String {
        if let Some(extension) = Path::new(path).extension() {
            extension.to_string_lossy().to_lowercase()
        } else {
            "unknown".to_string()
        }
    }

    fn calculate_simple_hash(&self, path: &str, size: u64) -> String {
        // Simplified hash for duplicate detection
        // In production, you'd want to use a proper hash like SHA-256
        format!("{}_{}", size, path.len())
    }

    #[allow(dead_code)]
    pub fn get_file_info(&self, path: &str) -> Result<FileItem, Box<dyn std::error::Error>> {
        let metadata = fs::metadata(path)?;
        let size = metadata.len();
        let modified = metadata.modified()
            .unwrap_or_else(|_| SystemTime::UNIX_EPOCH)
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
            .to_string();

        let file_type = self.get_file_type(path);

        Ok(FileItem {
            path: path.to_string(),
            size,
            modified,
            file_type,
            is_duplicate: false,
        })
    }

    #[allow(dead_code)]
    pub fn find_duplicates(&self, paths: Vec<String>) -> Result<Vec<DuplicateGroup>, Box<dyn std::error::Error>> {
        let mut file_hashes: HashMap<String, Vec<String>> = HashMap::new();
        let mut duplicates = Vec::new();

        for path in paths {
            if let Ok(metadata) = fs::metadata(&path) {
                let size = metadata.len();
                if size > 0 {
                    let hash = self.calculate_simple_hash(&path, size);
                    file_hashes.entry(hash).or_insert_with(Vec::new).push(path);
                }
            }
        }

        for (hash, files) in file_hashes {
            if files.len() > 1 {
                let size = if let Some(first_file) = files.first() {
                    fs::metadata(first_file).map(|m| m.len()).unwrap_or(0)
                } else {
                    0
                };

                duplicates.push(DuplicateGroup {
                    hash,
                    size,
                    count: files.len() as u32,
                    files,
                });
            }
        }

        Ok(duplicates)
    }
}
