use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub version: String,
    pub first_run_completed: bool,
    pub enable_ai: bool,
    pub auto_scan_on_start: bool,
    pub scan_directories: Vec<String>,
    pub exclude_directories: Vec<String>,
    pub theme: String,
    pub language: String,
    pub notifications_enabled: bool,
    pub auto_cleanup_enabled: bool,
    pub max_scan_depth: u32,
    pub llm_model: String,
    pub llm_threads: u32,
    pub telemetry_enabled: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            version: "1.0.0".to_string(),
            first_run_completed: false,
            enable_ai: true,
            auto_scan_on_start: false,
            scan_directories: vec!["C:\\Users".to_string()],
            exclude_directories: vec![
                "C:\\Windows".to_string(),
                "C:\\Program Files".to_string(),
                "C:\\Program Files (x86)".to_string(),
            ],
            theme: "dark".to_string(),
            language: "de".to_string(),
            notifications_enabled: true,
            auto_cleanup_enabled: false,
            max_scan_depth: 10,
            llm_model: "phi-2-q4".to_string(),
            llm_threads: 4,
            telemetry_enabled: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub scan_id: String,
    pub scanned_at: String,
    pub path: String,
    pub summary: ScanSummary,
    pub items: Vec<FileItem>,
    pub duplicates: Vec<DuplicateGroup>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanSummary {
    pub total_files: u64,
    pub total_size: u64,
    pub scan_duration: f64,
    pub directories_scanned: u64,
    pub duplicates_found: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileItem {
    pub path: String,
    pub size: u64,
    pub modified: String,
    pub file_type: String,
    pub is_duplicate: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateGroup {
    pub hash: String,
    pub size: u64,
    pub count: u32,
    pub files: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub timestamp: String,
    pub cpu: CpuMetrics,
    pub memory: MemoryMetrics,
    pub disk: DiskMetrics,
    pub network: NetworkMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuMetrics {
    pub usage: f32,
    pub cores: u32,
    pub frequency: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryMetrics {
    pub total: u64,
    pub used: u64,
    pub available: u64,
    pub usage_percent: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskMetrics {
    pub total: u64,
    pub used: u64,
    pub free: u64,
    pub usage_percent: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkMetrics {
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub packets_sent: u64,
    pub packets_received: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_percent: f32,
    pub memory_percent: f32,
    pub memory_usage: u64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartupProgram {
    pub name: String,
    pub path: String,
    pub enabled: bool,
    pub startup_type: String,
    pub registry_key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationSuggestion {
    pub title: String,
    pub description: String,
    pub risk: String,
    pub estimated_savings: String,
    pub action_type: String,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AISuggestion {
    pub title: String,
    pub description: String,
    pub confidence: f32,
    pub category: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionResult {
    pub success: bool,
    pub message: String,
    pub timestamp: String,
}

// Error types for comprehensive error handling
#[derive(Error, Debug)]
pub enum OptiAIError {
    #[error("LLM Error: {0}")]
    LLMError(String),
    
    #[error("Model not found: {0}")]
    ModelNotFound(String),
    
    #[error("Model loading failed: {0}")]
    ModelLoadError(String),
    
    #[error("Inference failed: {0}")]
    InferenceError(String),
    
    #[error("File system error: {0}")]
    FileSystemError(String),
    
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    
    #[error("Storage error: {0}")]
    StorageError(String),
    
    #[error("Scan error: {0}")]
    ScanError(String),
    
    #[error("Process management error: {0}")]
    ProcessError(String),
    
    #[error("Startup management error: {0}")]
    StartupError(String),
    
    #[error("Configuration error: {0}")]
    ConfigError(String),
    
    #[error("Network error: {0}")]
    NetworkError(String),
    
    #[error("Validation error: {0}")]
    ValidationError(String),
    
    #[error("Internal error: {0}")]
    InternalError(String),
}

impl From<std::io::Error> for OptiAIError {
    fn from(err: std::io::Error) -> Self {
        OptiAIError::FileSystemError(err.to_string())
    }
}

impl From<serde_json::Error> for OptiAIError {
    fn from(err: serde_json::Error) -> Self {
        OptiAIError::ConfigError(err.to_string())
    }
}

// AI Model information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub loaded: bool,
    pub available: bool,
    pub context_size: u32,
    pub parameters: ModelParameters,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelParameters {
    pub temperature: f32,
    pub top_p: f32,
    pub top_k: u32,
    pub repeat_penalty: f32,
    pub max_tokens: u32,
}

impl Default for ModelParameters {
    fn default() -> Self {
        Self {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            repeat_penalty: 1.1,
            max_tokens: 512,
        }
    }
}

// AI Status information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIStatus {
    pub available: bool,
    pub status: String,
    pub model_name: Option<String>,
    pub model_loaded: bool,
    pub fallback_mode: bool,
    pub last_error: Option<String>,
}
