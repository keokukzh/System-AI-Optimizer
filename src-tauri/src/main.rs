#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod backend;
mod commands;

use commands::{AppState, *};
use tauri::Manager;
use std::env;
use std::path::PathBuf;

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

    tauri::Builder::default()
        .manage(app_state)
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}