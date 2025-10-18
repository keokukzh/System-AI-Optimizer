mod installer;
mod utils;

use installer::Installer;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallProgress {
    pub progress: f32,
    pub status: String,
    pub current_step: String,
    pub estimated_time_remaining: u32, // seconds
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Component {
    pub id: String,
    pub name: String,
    pub description: String,
    pub size: u64,
    pub required: bool,
    pub selected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallConfig {
    pub install_path: String,
    pub components: Vec<Component>,
    pub create_desktop_shortcut: bool,
    pub create_start_menu_shortcut: bool,
    pub auto_start: bool,
}

pub struct AppState {
    pub installer: Arc<Mutex<Option<Installer>>>,
    pub progress: Arc<Mutex<InstallProgress>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            installer: Arc::new(Mutex::new(None)),
            progress: Arc::new(Mutex::new(InstallProgress {
                progress: 0.0,
                status: "Ready".to_string(),
                current_step: "".to_string(),
                estimated_time_remaining: 0,
            })),
        }
    }
}

#[tauri::command]
async fn get_available_space(drive: String) -> Result<u64, String> {
    utils::get_available_space(&drive).map_err(|e| e.to_string())
}

#[tauri::command]
async fn validate_install_path(path: String) -> Result<bool, String> {
    utils::validate_install_path(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_components() -> Result<Vec<Component>, String> {
    Ok(vec![
        Component {
            id: "main_app".to_string(),
            name: "OptiAI Desktop Application".to_string(),
            description: "Main OptiAI application with all core features".to_string(),
            size: 50 * 1024 * 1024, // 50MB
            required: true,
            selected: true,
        },
        Component {
            id: "ai_model".to_string(),
            name: "AI Assistant (Phi-2)".to_string(),
            description: "Local AI model for intelligent system analysis and suggestions".to_string(),
            size: 1500 * 1024 * 1024, // 1.5GB
            required: false,
            selected: true,
        },
        Component {
            id: "desktop_shortcut".to_string(),
            name: "Desktop Shortcut".to_string(),
            description: "Create a desktop shortcut for easy access".to_string(),
            size: 0,
            required: false,
            selected: true,
        },
        Component {
            id: "start_menu_shortcut".to_string(),
            name: "Start Menu Shortcut".to_string(),
            description: "Add OptiAI to the Windows Start Menu".to_string(),
            size: 0,
            required: false,
            selected: true,
        },
        Component {
            id: "auto_start".to_string(),
            name: "Start with Windows".to_string(),
            description: "Automatically start OptiAI when Windows boots".to_string(),
            size: 0,
            required: false,
            selected: false,
        },
    ])
}

#[tauri::command]
async fn start_installation(
    config: InstallConfig,
    state: State<'_, AppState>
) -> Result<(), String> {
    let install_path = PathBuf::from(&config.install_path);
    
    // Create installer
    let installer = Installer::new(install_path, config.clone()).map_err(|e| e.to_string())?;
    
    // Store installer in state
    {
        let mut installer_guard = state.installer.lock().map_err(|e| e.to_string())?;
        *installer_guard = Some(installer);
    }
    
    // Start installation in background
    let installer_arc = state.installer.clone();
    let progress_arc = state.progress.clone();
    
    tauri::async_runtime::spawn(async move {
        if let Ok(mut installer_guard) = installer_arc.lock() {
            if let Some(ref mut installer) = *installer_guard {
                if let Err(e) = installer.install(progress_arc.clone()).await {
                    eprintln!("Installation failed: {}", e);
                }
            }
        }
    });
    
    Ok(())
}

#[tauri::command]
async fn get_install_progress(state: State<'_, AppState>) -> Result<InstallProgress, String> {
    let progress = state.progress.lock().map_err(|e| e.to_string())?;
    Ok(progress.clone())
}

#[tauri::command]
async fn cancel_installation(state: State<'_, AppState>) -> Result<(), String> {
    // Cancel installation
    let mut installer_guard = state.installer.lock().map_err(|e| e.to_string())?;
    if let Some(ref mut installer) = *installer_guard {
        installer.cancel().map_err(|e| e.to_string())?;
    }
    *installer_guard = None;
    Ok(())
}

#[tauri::command]
async fn launch_application(install_path: String) -> Result<(), String> {
    utils::launch_application(&install_path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn open_folder(path: String) -> Result<(), String> {
    utils::open_folder(&path).map_err(|e| e.to_string())
}

fn main() {
    let app_state = AppState::new();
    
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            get_available_space,
            validate_install_path,
            get_components,
            start_installation,
            get_install_progress,
            cancel_installation,
            launch_application,
            open_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
