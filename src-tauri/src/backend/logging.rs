use std::fs::{File, OpenOptions};
use std::io::{Write, BufWriter};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: LogLevel,
    pub component: String,
    pub message: String,
    pub context: Option<serde_json::Value>,
    pub error_type: Option<String>,
    pub severity: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LogLevel {
    Debug,
    Info,
    Warning,
    Error,
    Critical,
}

impl std::fmt::Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LogLevel::Debug => write!(f, "DEBUG"),
            LogLevel::Info => write!(f, "INFO"),
            LogLevel::Warning => write!(f, "WARN"),
            LogLevel::Error => write!(f, "ERROR"),
            LogLevel::Critical => write!(f, "CRITICAL"),
        }
    }
}

pub struct Logger {
    log_dir: PathBuf,
    max_file_size: u64,
    max_files: usize,
    retention_days: u64,
    writer: Arc<Mutex<Option<BufWriter<File>>>>,
    current_file: Arc<Mutex<Option<PathBuf>>>,
}

impl Logger {
    pub fn new(log_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        // Create log directory if it doesn't exist
        std::fs::create_dir_all(&log_dir)?;
        
        let logger = Self {
            log_dir,
            max_file_size: 10 * 1024 * 1024, // 10MB
            max_files: 7, // Keep 7 days of logs
            retention_days: 7,
            writer: Arc::new(Mutex::new(None)),
            current_file: Arc::new(Mutex::new(None)),
        };
        
        // Clean up old logs
        logger.cleanup_old_logs()?;
        
        // Initialize current log file
        logger.initialize_log_file()?;
        
        Ok(logger)
    }

    fn initialize_log_file(&self) -> Result<(), Box<dyn std::error::Error>> {
        let timestamp = Utc::now().format("%Y-%m-%d").to_string();
        let log_file = self.log_dir.join(format!("optiai_{}.log", timestamp));
        
        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_file)?;
        
        let writer = BufWriter::new(file);
        
        {
            let mut current_file = self.current_file.lock().unwrap();
            *current_file = Some(log_file);
        }
        
        {
            let mut writer_guard = self.writer.lock().unwrap();
            *writer_guard = Some(writer);
        }
        
        Ok(())
    }

    fn should_rotate(&self) -> Result<bool, Box<dyn std::error::Error>> {
        let current_file = self.current_file.lock().unwrap();
        if let Some(ref file_path) = *current_file {
            if file_path.exists() {
                let metadata = std::fs::metadata(file_path)?;
                return Ok(metadata.len() >= self.max_file_size);
            }
        }
        Ok(false)
    }

    fn rotate_log_file(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Close current writer
        {
            let mut writer_guard = self.writer.lock().unwrap();
            *writer_guard = None;
        }
        
        // Initialize new log file
        self.initialize_log_file()?;
        
        Ok(())
    }

    fn cleanup_old_logs(&self) -> Result<(), Box<dyn std::error::Error>> {
        let cutoff_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() - (self.retention_days * 24 * 60 * 60);

        if let Ok(entries) = std::fs::read_dir(&self.log_dir) {
            for entry in entries.flatten() {
                if let Ok(metadata) = entry.metadata() {
                    if let Ok(modified) = metadata.modified() {
                        if let Ok(modified_secs) = modified.duration_since(UNIX_EPOCH) {
                            if modified_secs.as_secs() < cutoff_time {
                                let _ = std::fs::remove_file(entry.path());
                            }
                        }
                    }
                }
            }
        }
        
        Ok(())
    }

    pub fn log(&self, level: LogLevel, component: &str, message: &str, context: Option<serde_json::Value>) -> Result<(), Box<dyn std::error::Error>> {
        // Check if we need to rotate the log file
        if self.should_rotate()? {
            self.rotate_log_file()?;
        }

        let timestamp = Utc::now().to_rfc3339();
        let log_entry = LogEntry {
            timestamp,
            level: level.clone(),
            component: component.to_string(),
            message: message.to_string(),
            context,
            error_type: None,
            severity: None,
        };

        // Write to file
        {
            let mut writer_guard = self.writer.lock().unwrap();
            if let Some(ref mut writer) = *writer_guard {
                let log_line = serde_json::to_string(&log_entry)?;
                writeln!(writer, "{}", log_line)?;
                writer.flush()?;
            }
        }

        // Also log to console in development
        #[cfg(debug_assertions)]
        {
            println!("[{}] {} {}: {}", 
                log_entry.timestamp, 
                level, 
                component, 
                message
            );
        }

        Ok(())
    }

    pub fn debug(&self, component: &str, message: &str, context: Option<serde_json::Value>) -> Result<(), Box<dyn std::error::Error>> {
        self.log(LogLevel::Debug, component, message, context)
    }

    pub fn info(&self, component: &str, message: &str, context: Option<serde_json::Value>) -> Result<(), Box<dyn std::error::Error>> {
        self.log(LogLevel::Info, component, message, context)
    }

    pub fn warning(&self, component: &str, message: &str, context: Option<serde_json::Value>) -> Result<(), Box<dyn std::error::Error>> {
        self.log(LogLevel::Warning, component, message, context)
    }

    pub fn error(&self, component: &str, message: &str, context: Option<serde_json::Value>) -> Result<(), Box<dyn std::error::Error>> {
        self.log(LogLevel::Error, component, message, context)
    }

    pub fn critical(&self, component: &str, message: &str, context: Option<serde_json::Value>) -> Result<(), Box<dyn std::error::Error>> {
        self.log(LogLevel::Critical, component, message, context)
    }

    pub fn read_logs(&self, lines: Option<usize>) -> Result<Vec<LogEntry>, Box<dyn std::error::Error>> {
        let mut all_logs = Vec::new();
        
        // Read all log files
        if let Ok(entries) = std::fs::read_dir(&self.log_dir) {
            let mut log_files: Vec<PathBuf> = entries
                .flatten()
                .filter(|entry| {
                    entry.path().extension().map_or(false, |ext| ext == "log")
                })
                .map(|entry| entry.path())
                .collect();
            
            // Sort by modification time (newest first)
            log_files.sort_by(|a, b| {
                let a_time = std::fs::metadata(a).ok()
                    .and_then(|m| m.modified().ok())
                    .unwrap_or(SystemTime::UNIX_EPOCH);
                let b_time = std::fs::metadata(b).ok()
                    .and_then(|m| m.modified().ok())
                    .unwrap_or(SystemTime::UNIX_EPOCH);
                b_time.cmp(&a_time)
            });
            
            for log_file in log_files {
                if let Ok(content) = std::fs::read_to_string(&log_file) {
                    for line in content.lines() {
                        if let Ok(log_entry) = serde_json::from_str::<LogEntry>(line) {
                            all_logs.push(log_entry);
                        }
                    }
                }
            }
        }
        
        // Sort by timestamp (newest first)
        all_logs.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        // Limit results if requested
        if let Some(limit) = lines {
            all_logs.truncate(limit);
        }
        
        Ok(all_logs)
    }

    pub fn clear_logs(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Close current writer
        {
            let mut writer_guard = self.writer.lock().unwrap();
            *writer_guard = None;
        }
        
        // Remove all log files
        if let Ok(entries) = std::fs::read_dir(&self.log_dir) {
            for entry in entries.flatten() {
                if entry.path().extension().map_or(false, |ext| ext == "log") {
                    let _ = std::fs::remove_file(entry.path());
                }
            }
        }
        
        // Reinitialize log file
        self.initialize_log_file()?;
        
        Ok(())
    }

    pub fn get_log_stats(&self) -> Result<LogStats, Box<dyn std::error::Error>> {
        let mut total_files = 0;
        let mut total_size = 0;
        let mut oldest_log = None;
        let mut newest_log = None;
        
        if let Ok(entries) = std::fs::read_dir(&self.log_dir) {
            for entry in entries.flatten() {
                if entry.path().extension().map_or(false, |ext| ext == "log") {
                    total_files += 1;
                    
                    if let Ok(metadata) = entry.metadata() {
                        total_size += metadata.len();
                        
                        if let Ok(modified) = metadata.modified() {
                            if oldest_log.is_none() || modified < oldest_log.unwrap() {
                                oldest_log = Some(modified);
                            }
                            if newest_log.is_none() || modified > newest_log.unwrap() {
                                newest_log = Some(modified);
                            }
                        }
                    }
                }
            }
        }
        
        Ok(LogStats {
            total_files,
            total_size,
            oldest_log,
            newest_log,
            retention_days: self.retention_days,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogStats {
    pub total_files: usize,
    pub total_size: u64,
    pub oldest_log: Option<SystemTime>,
    pub newest_log: Option<SystemTime>,
    pub retention_days: u64,
}

// Global logger instance
lazy_static::lazy_static! {
    static ref GLOBAL_LOGGER: Arc<Mutex<Option<Logger>>> = Arc::new(Mutex::new(None));
}

pub fn init_logger(log_dir: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    let logger = Logger::new(log_dir)?;
    let mut global_logger = GLOBAL_LOGGER.lock().unwrap();
    *global_logger = Some(logger);
    Ok(())
}

pub fn get_logger() -> Option<Arc<Mutex<Option<Logger>>>> {
    Some(GLOBAL_LOGGER.clone())
}

// Convenience macros for logging
#[macro_export]
macro_rules! log_debug {
    ($component:expr, $msg:expr) => {
        if let Some(logger) = crate::backend::logging::get_logger() {
            if let Ok(logger_guard) = logger.lock() {
                if let Some(ref logger) = *logger_guard {
                    let _ = logger.debug($component, $msg, None);
                }
            }
        }
    };
    ($component:expr, $msg:expr, $context:expr) => {
        if let Some(logger) = crate::backend::logging::get_logger() {
            if let Ok(logger_guard) = logger.lock() {
                if let Some(ref logger) = *logger_guard {
                    let _ = logger.debug($component, $msg, Some($context));
                }
            }
        }
    };
}

#[macro_export]
macro_rules! log_info {
    ($component:expr, $msg:expr) => {
        if let Some(logger) = crate::backend::logging::get_logger() {
            if let Ok(logger_guard) = logger.lock() {
                if let Some(ref logger) = *logger_guard {
                    let _ = logger.info($component, $msg, None);
                }
            }
        }
    };
    ($component:expr, $msg:expr, $context:expr) => {
        if let Some(logger) = crate::backend::logging::get_logger() {
            if let Ok(logger_guard) = logger.lock() {
                if let Some(ref logger) = *logger_guard {
                    let _ = logger.info($component, $msg, Some($context));
                }
            }
        }
    };
}

#[macro_export]
macro_rules! log_warning {
    ($component:expr, $msg:expr) => {
        if let Some(logger) = crate::backend::logging::get_logger() {
            if let Ok(logger_guard) = logger.lock() {
                if let Some(ref logger) = *logger_guard {
                    let _ = logger.warning($component, $msg, None);
                }
            }
        }
    };
    ($component:expr, $msg:expr, $context:expr) => {
        if let Some(logger) = crate::backend::logging::get_logger() {
            if let Ok(logger_guard) = logger.lock() {
                if let Some(ref logger) = *logger_guard {
                    let _ = logger.warning($component, $msg, Some($context));
                }
            }
        }
    };
}

#[macro_export]
macro_rules! log_error {
    ($component:expr, $msg:expr) => {
        if let Some(logger) = crate::backend::logging::get_logger() {
            if let Ok(logger_guard) = logger.lock() {
                if let Some(ref logger) = *logger_guard {
                    let _ = logger.error($component, $msg, None);
                }
            }
        }
    };
    ($component:expr, $msg:expr, $context:expr) => {
        if let Some(logger) = crate::backend::logging::get_logger() {
            if let Ok(logger_guard) = logger.lock() {
                if let Some(ref logger) = *logger_guard {
                    let _ = logger.error($component, $msg, Some($context));
                }
            }
        }
    };
}

#[macro_export]
macro_rules! log_critical {
    ($component:expr, $msg:expr) => {
        if let Some(logger) = crate::backend::logging::get_logger() {
            if let Ok(logger_guard) = logger.lock() {
                if let Some(ref logger) = *logger_guard {
                    let _ = logger.critical($component, $msg, None);
                }
            }
        }
    };
    ($component:expr, $msg:expr, $context:expr) => {
        if let Some(logger) = crate::backend::logging::get_logger() {
            if let Ok(logger_guard) = logger.lock() {
                if let Some(ref logger) = *logger_guard {
                    let _ = logger.critical($component, $msg, Some($context));
                }
            }
        }
    };
}
