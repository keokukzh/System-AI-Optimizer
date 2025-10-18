use crate::backend::models::*;
use crate::backend::storage::StorageManager;
use crate::backend::scanner::SystemScanner;
use crate::backend::metrics::MetricsCollector;
use crate::backend::process::ProcessManager;
use crate::backend::startup::StartupManager;
use crate::backend::llm::LLMManager;
use crate::backend::optimization::OptimizationEngine;
use crate::backend::logging::{LogEntry, LogStats, get_logger};
use std::sync::Mutex;
use tokio::sync::Mutex as TokioMutex;
use tauri::State;

pub struct AppState {
    pub storage: Mutex<StorageManager>,
    pub scanner: Mutex<SystemScanner>,
    pub metrics: Mutex<MetricsCollector>,
    pub process_manager: Mutex<ProcessManager>,
    pub startup_manager: Mutex<StartupManager>,
    pub llm_manager: TokioMutex<LLMManager>,
    pub optimization_engine: Mutex<OptimizationEngine>,
}

impl AppState {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let storage = StorageManager::new()?;
        storage.init_storage()?;

        Ok(Self {
            storage: Mutex::new(storage),
            scanner: Mutex::new(SystemScanner::new(10)),
            metrics: Mutex::new(MetricsCollector::new()),
            process_manager: Mutex::new(ProcessManager::new()),
            startup_manager: Mutex::new(StartupManager),
            llm_manager: TokioMutex::new(LLMManager::new()),
            optimization_engine: Mutex::new(OptimizationEngine),
        })
    }
}

#[tauri::command]
pub async fn get_system_info() -> Result<String, String> {
    Ok("OptiAI System Optimizer v1.0.0".to_string())
}

#[tauri::command]
pub async fn get_metrics(state: State<'_, AppState>) -> Result<SystemMetrics, String> {
    let mut metrics = state.metrics.lock().map_err(|e| e.to_string())?;
    metrics.get_system_metrics().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn scan_directory(
    path: String,
    state: State<'_, AppState>
) -> Result<ScanResult, String> {
    let scanner = state.scanner.lock().map_err(|e| e.to_string())?;
    let scan_result = scanner.scan_directory(&path).map_err(|e| e.to_string())?;
    
    // Save scan result
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.save_scan_result(&scan_result).map_err(|e| e.to_string())?;
    
    Ok(scan_result)
}

#[tauri::command]
pub async fn get_scan_result(
    scan_id: String,
    state: State<'_, AppState>
) -> Result<ScanResult, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.load_scan_result(&scan_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_scan_results(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.list_scan_results().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_ai_suggestions(
    scan_id: String,
    state: State<'_, AppState>
) -> Result<Vec<AISuggestion>, String> {
    let scan_result = {
        let storage = state.storage.lock().map_err(|e| e.to_string())?;
        storage.load_scan_result(&scan_id).map_err(|e| e.to_string())?
    };
    
    let suggestions = {
        let llm = state.llm_manager.lock().await;
        llm.generate_suggestions(&scan_result).await.map_err(|e| e.to_string())?
    };
    
    Ok(suggestions)
}

#[tauri::command]
pub async fn generate_optimization_suggestions(
    scan_id: String,
    state: State<'_, AppState>
) -> Result<Vec<OptimizationSuggestion>, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    let scan_result = storage.load_scan_result(&scan_id).map_err(|e| e.to_string())?;
    
    let optimization_engine = state.optimization_engine.lock().map_err(|e| e.to_string())?;
    optimization_engine.analyze_scan_result(&scan_result).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn execute_optimization(
    action_type: String,
    target: String,
    state: State<'_, AppState>
) -> Result<ActionResult, String> {
    let optimization_engine = state.optimization_engine.lock().map_err(|e| e.to_string())?;
    optimization_engine.execute_optimization(&action_type, &target).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_processes(state: State<'_, AppState>) -> Result<Vec<ProcessInfo>, String> {
    let mut process_manager = state.process_manager.lock().map_err(|e| e.to_string())?;
    process_manager.get_processes().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn kill_process(
    pid: u32,
    state: State<'_, AppState>
) -> Result<ActionResult, String> {
    let mut process_manager = state.process_manager.lock().map_err(|e| e.to_string())?;
    process_manager.kill_process(pid).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_startup_programs(state: State<'_, AppState>) -> Result<Vec<StartupProgram>, String> {
    let startup_manager = state.startup_manager.lock().map_err(|e| e.to_string())?;
    startup_manager.get_startup_programs().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn toggle_startup_program(
    name: String,
    enabled: bool,
    state: State<'_, AppState>
) -> Result<ActionResult, String> {
    let startup_manager = state.startup_manager.lock().map_err(|e| e.to_string())?;
    startup_manager.toggle_startup_program(&name, enabled).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_settings(
    settings: Settings,
    state: State<'_, AppState>
) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.save_settings(&settings).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn load_settings(state: State<'_, AppState>) -> Result<Settings, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.load_settings().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn init_llm(state: State<'_, AppState>) -> Result<(), String> {
    let result = {
        let mut llm = state.llm_manager.lock().await;
        llm.init_llm().await
    };
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_llm_info(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let llm = state.llm_manager.lock().await;
    llm.get_model_info().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_ai_status(state: State<'_, AppState>) -> Result<AIStatus, String> {
    let llm = state.llm_manager.lock().await;
    Ok(llm.get_ai_status())
}

#[tauri::command]
pub async fn analyze_system_metrics(
    state: State<'_, AppState>
) -> Result<Vec<AISuggestion>, String> {
    let system_metrics = {
        let mut metrics = state.metrics.lock().map_err(|e| e.to_string())?;
        metrics.get_system_metrics().map_err(|e| e.to_string())?
    };
    
    let suggestions = {
        let llm = state.llm_manager.lock().await;
        llm.analyze_system(&system_metrics).await.map_err(|e| e.to_string())?
    };
    
    Ok(suggestions)
}

#[tauri::command]
pub async fn get_system_profile(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.load_system_profile().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn collect_system_info(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let mut metrics = state.metrics.lock().map_err(|e| e.to_string())?;
    let system_info = metrics.collect_system_info();
    
    // Save system profile
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.save_system_profile(&system_info).map_err(|e| e.to_string())?;
    
    Ok(system_info)
}

#[tauri::command]
pub async fn get_logs(
    lines: Option<usize>,
    _state: State<'_, AppState>
) -> Result<Vec<LogEntry>, String> {
    if let Some(logger) = get_logger() {
        if let Ok(logger_guard) = logger.lock() {
            if let Some(ref logger) = *logger_guard {
                logger.read_logs(lines).map_err(|e| e.to_string())
            } else {
                Err("Logger not initialized".to_string())
            }
        } else {
            Err("Failed to access logger".to_string())
        }
    } else {
        Err("Logger not available".to_string())
    }
}

#[tauri::command]
pub async fn get_log_stats(_state: State<'_, AppState>) -> Result<LogStats, String> {
    if let Some(logger) = get_logger() {
        if let Ok(logger_guard) = logger.lock() {
            if let Some(ref logger) = *logger_guard {
                logger.get_log_stats().map_err(|e| e.to_string())
            } else {
                Err("Logger not initialized".to_string())
            }
        } else {
            Err("Failed to access logger".to_string())
        }
    } else {
        Err("Logger not available".to_string())
    }
}

#[tauri::command]
pub async fn clear_logs(_state: State<'_, AppState>) -> Result<(), String> {
    if let Some(logger) = get_logger() {
        if let Ok(logger_guard) = logger.lock() {
            if let Some(ref logger) = *logger_guard {
                logger.clear_logs().map_err(|e| e.to_string())
            } else {
                Err("Logger not initialized".to_string())
            }
        } else {
            Err("Failed to access logger".to_string())
        }
    } else {
        Err("Logger not available".to_string())
    }
}
