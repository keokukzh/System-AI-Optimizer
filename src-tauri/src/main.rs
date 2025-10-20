#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod backend;
mod commands;

use commands::{AppState, *};
use tauri::Manager;
use std::env;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::process::{Child, Command};
use std::thread;
use std::time::Duration;

fn main() {
    // Initialize logger
    let app_data = env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    let log_dir = PathBuf::from(app_data).join("OptiAI").join("logs");
    
    if let Err(e) = backend::logging::init_logger(log_dir) {
        eprintln!("Failed to initialize logger: {}", e);
        // Continue without logging
    }

    // Initialize app state
    let app_state = match AppState::new() {
        Ok(state) => state,
        Err(e) => {
            eprintln!("Failed to initialize app state: {}", e);
            std::process::exit(1);
        }
    };

    // Backend process management
    let backend_process: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));

    tauri::Builder::default()
        .manage(app_state)
        .manage(backend_process.clone())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }

            // Start backend server
            let backend_process_state: tauri::State<Arc<Mutex<Option<Child>>>> = app.state();
            if let Err(e) = start_backend_server(backend_process_state.inner()) {
                eprintln!("Failed to start backend server: {}", e);
                // Continue without backend - app will show error in UI
            }

            // Check if this is the first run
            let app_state: tauri::State<AppState> = app.state();
            let storage = app_state.storage.lock().unwrap();
            let is_first_run = !storage.settings_exist();
            drop(storage);

            if is_first_run {
                // Initialize default settings
                let storage = app_state.storage.lock().unwrap();
                let default_settings = backend::models::Settings::default();
                if let Err(e) = storage.save_settings(&default_settings) {
                    eprintln!("Failed to save default settings: {}", e);
                }
                drop(storage);

                // Collect system information
                let mut metrics = app_state.metrics.lock().unwrap();
                let system_info = metrics.collect_system_info();
                drop(metrics);

                let storage = app_state.storage.lock().unwrap();
                if let Err(e) = storage.save_system_profile(&system_info) {
                    eprintln!("Failed to save system profile: {}", e);
                }
                drop(storage);

                println!("First run setup completed");
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            get_metrics,
            scan_directory,
            get_scan_result,
            list_scan_results,
            generate_ai_suggestions,
            generate_optimization_suggestions,
            execute_optimization,
            get_processes,
            kill_process,
            get_startup_programs,
            toggle_startup_program,
            save_settings,
            load_settings,
            init_llm,
            get_llm_info,
            check_ai_status,
            analyze_system_metrics,
            get_system_profile,
            collect_system_info,
            get_logs,
            get_log_stats,
            clear_logs
        ])
        .on_window_event(|event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event.event() {
                // Clean up backend process when window closes
                if let Some(app) = event.window().app_handle().try_state::<Arc<Mutex<Option<Child>>>>() {
                    stop_backend_server(app.inner());
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Start the backend server as a sidecar process
fn start_backend_server(backend_process: &Arc<Mutex<Option<Child>>>) -> Result<(), Box<dyn std::error::Error>> {
    println!("Starting backend server...");
    
    // Try to start the backend-server sidecar
    let mut cmd = Command::new("backend-server");
    cmd.arg("--port").arg("5175");
    cmd.arg("--host").arg("127.0.0.1");
    
    match cmd.spawn() {
        Ok(child) => {
            println!("Backend server started with PID: {:?}", child.id());
            
            // Store the process handle
            let mut process_guard = backend_process.lock().unwrap();
            *process_guard = Some(child);
            drop(process_guard);
            
            // Wait a moment for the server to start
            thread::sleep(Duration::from_secs(2));
            
            // Verify the server is running by checking health endpoint
            if verify_backend_health().is_ok() {
                println!("Backend server is healthy");
                Ok(())
            } else {
                println!("Backend server started but health check failed");
                Ok(()) // Continue anyway, UI will handle the error
            }
        }
        Err(e) => {
            eprintln!("Failed to start backend server: {}", e);
            Err(Box::new(e))
        }
    }
}

/// Verify backend server health
fn verify_backend_health() -> Result<(), Box<dyn std::error::Error>> {
    use std::net::TcpStream;
    
    // Try to connect to the backend port
    match TcpStream::connect("127.0.0.1:5175") {
        Ok(_) => Ok(()),
        Err(e) => Err(Box::new(e))
    }
}

/// Stop the backend server
fn stop_backend_server(backend_process: &Arc<Mutex<Option<Child>>>) {
    let mut process_guard = backend_process.lock().unwrap();
    if let Some(mut child) = process_guard.take() {
        println!("Stopping backend server...");
        if let Err(e) = child.kill() {
            eprintln!("Failed to kill backend server: {}", e);
        } else {
            println!("Backend server stopped");
        }
    }
}