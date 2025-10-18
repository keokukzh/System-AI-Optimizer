use crate::main::{InstallConfig, InstallProgress};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use winreg::enums::*;
use winreg::RegKey;

pub struct Installer {
    install_path: PathBuf,
    config: InstallConfig,
    cancelled: Arc<Mutex<bool>>,
}

impl Installer {
    pub fn new(install_path: PathBuf, config: InstallConfig) -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            install_path,
            config,
            cancelled: Arc::new(Mutex::new(false)),
        })
    }

    pub async fn install(&mut self, progress: Arc<Mutex<InstallProgress>>) -> Result<(), Box<dyn std::error::Error>> {
        let start_time = Instant::now();
        let total_steps = 6;
        let mut current_step = 0;

        // Step 1: Create directories
        current_step += 1;
        self.update_progress(&progress, current_step, total_steps, "Creating directories...").await;
        self.create_directories()?;
        self.check_cancelled()?;

        // Step 2: Extract main application
        current_step += 1;
        self.update_progress(&progress, current_step, total_steps, "Installing main application...").await;
        self.extract_main_app()?;
        self.check_cancelled()?;

        // Step 3: Extract AI model (if selected)
        if self.config.components.iter().any(|c| c.id == "ai_model" && c.selected) {
            current_step += 1;
            self.update_progress(&progress, current_step, total_steps, "Installing AI model...").await;
            self.extract_ai_model()?;
            self.check_cancelled()?;
        }

        // Step 4: Create shortcuts
        current_step += 1;
        self.update_progress(&progress, current_step, total_steps, "Creating shortcuts...").await;
        self.create_shortcuts()?;
        self.check_cancelled()?;

        // Step 5: Register application
        current_step += 1;
        self.update_progress(&progress, current_step, total_steps, "Registering application...").await;
        self.register_application()?;
        self.check_cancelled()?;

        // Step 6: Create initial configuration
        current_step += 1;
        self.update_progress(&progress, current_step, total_steps, "Finalizing installation...").await;
        self.create_initial_config()?;
        self.check_cancelled()?;

        // Installation complete
        self.update_progress(&progress, total_steps, total_steps, "Installation completed successfully!").await;

        Ok(())
    }

    async fn update_progress(
        &self,
        progress: &Arc<Mutex<InstallProgress>>,
        current_step: u32,
        total_steps: u32,
        status: &str,
    ) {
        let progress_percent = (current_step as f32 / total_steps as f32) * 100.0;
        let estimated_remaining = if current_step < total_steps {
            (total_steps - current_step) * 30 // Estimate 30 seconds per step
        } else {
            0
        };

        if let Ok(mut progress_guard) = progress.lock() {
            progress_guard.progress = progress_percent;
            progress_guard.status = status.to_string();
            progress_guard.current_step = format!("Step {} of {}", current_step, total_steps);
            progress_guard.estimated_time_remaining = estimated_remaining;
        }
    }

    fn create_directories(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Create main installation directory
        fs::create_dir_all(&self.install_path)?;

        // Create AppData directories
        let appdata = std::env::var("APPDATA")?;
        let optiai_data = PathBuf::from(appdata).join("OptiAI");
        fs::create_dir_all(optiai_data.join("scans"))?;
        fs::create_dir_all(optiai_data.join("settings"))?;
        fs::create_dir_all(optiai_data.join("cache"))?;
        fs::create_dir_all(optiai_data.join("logs"))?;
        fs::create_dir_all(optiai_data.join("models"))?;

        Ok(())
    }

    fn extract_main_app(&self) -> Result<(), Box<dyn std::error::Error>> {
        // In a real implementation, this would extract the main application
        // For now, we'll create a placeholder
        let main_exe = self.install_path.join("OptiAI.exe");
        
        // Create a simple placeholder executable
        // In production, this would be the actual OptiAI.exe
        fs::write(&main_exe, b"# OptiAI Placeholder")?;

        // Copy icon
        let icon_path = self.install_path.join("thumbnail.ico");
        // In production, this would copy the actual icon
        fs::write(&icon_path, b"# Icon placeholder")?;

        Ok(())
    }

    fn extract_ai_model(&self) -> Result<(), Box<dyn std::error::Error>> {
        let appdata = std::env::var("APPDATA")?;
        let models_dir = PathBuf::from(appdata).join("OptiAI").join("models");
        
        // Create placeholder AI model
        let model_path = models_dir.join("phi-2-q4.gguf");
        fs::write(&model_path, b"# AI Model Placeholder")?;

        Ok(())
    }

    fn create_shortcuts(&self) -> Result<(), Box<dyn std::error::Error>> {
        let main_exe = self.install_path.join("OptiAI.exe");
        let icon_path = self.install_path.join("thumbnail.ico");

        // Desktop shortcut
        if self.config.create_desktop_shortcut {
            let desktop = std::env::var("USERPROFILE")? + "\\Desktop";
            self.create_shortcut(
                &desktop,
                "OptiAI.lnk",
                &main_exe,
                &icon_path,
            )?;
        }

        // Start menu shortcut
        if self.config.create_start_menu_shortcut {
            let start_menu = std::env::var("APPDATA")? + 
                "\\Microsoft\\Windows\\Start Menu\\Programs\\OptiAI";
            fs::create_dir_all(&start_menu)?;
            self.create_shortcut(
                &start_menu,
                "OptiAI.lnk",
                &main_exe,
                &icon_path,
            )?;
        }

        Ok(())
    }

    fn create_shortcut(
        &self,
        directory: &str,
        name: &str,
        target: &PathBuf,
        icon: &PathBuf,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Use PowerShell to create shortcuts
        let script = format!(
            r#"
            $WshShell = New-Object -comObject WScript.Shell
            $Shortcut = $WshShell.CreateShortcut('{}\\{}')
            $Shortcut.TargetPath = '{}'
            $Shortcut.WorkingDirectory = '{}'
            $Shortcut.IconLocation = '{}'
            $Shortcut.Save()
            "#,
            directory,
            name,
            target.to_string_lossy(),
            self.install_path.to_string_lossy(),
            icon.to_string_lossy()
        );

        let output = Command::new("powershell")
            .arg("-Command")
            .arg(&script)
            .output()?;

        if !output.status.success() {
            return Err(format!("Failed to create shortcut: {}", String::from_utf8_lossy(&output.stderr)).into());
        }

        Ok(())
    }

    fn register_application(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Register in Windows Add/Remove Programs
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let uninstall = hklm.open_subkey_with_flags(
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
            KEY_WRITE,
        )?;

        let optiai = uninstall.create_subkey("OptiAI")?;
        optiai.set_value("DisplayName", &"OptiAI - System Optimizer")?;
        optiai.set_value("DisplayVersion", &"1.0.0")?;
        optiai.set_value("Publisher", &"OptiAI Team")?;
        optiai.set_value("InstallLocation", &self.install_path.to_string_lossy())?;
        optiai.set_value("DisplayIcon", &self.install_path.join("thumbnail.ico").to_string_lossy())?;
        optiai.set_value("UninstallString", &self.install_path.join("uninstall.exe").to_string_lossy())?;
        optiai.set_value("NoModify", &1u32)?;
        optiai.set_value("NoRepair", &1u32)?;

        Ok(())
    }

    fn create_initial_config(&self) -> Result<(), Box<dyn std::error::Error>> {
        let appdata = std::env::var("APPDATA")?;
        let settings_dir = PathBuf::from(appdata).join("OptiAI").join("settings");
        
        // Create default settings
        let default_settings = serde_json::json!({
            "version": "1.0.0",
            "first_run_completed": false,
            "enable_ai": true,
            "auto_scan_on_start": false,
            "scan_directories": ["C:\\Users"],
            "exclude_directories": ["C:\\Windows", "C:\\Program Files"],
            "theme": "dark",
            "language": "de",
            "notifications_enabled": true,
            "auto_cleanup_enabled": false,
            "max_scan_depth": 10,
            "llm_model": "phi-2-q4",
            "llm_threads": 4,
            "telemetry_enabled": false
        });

        let settings_path = settings_dir.join("settings.json");
        fs::write(settings_path, serde_json::to_string_pretty(&default_settings)?)?;

        Ok(())
    }

    fn check_cancelled(&self) -> Result<(), Box<dyn std::error::Error>> {
        if *self.cancelled.lock().unwrap() {
            return Err("Installation cancelled by user".into());
        }
        Ok(())
    }

    pub fn cancel(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        *self.cancelled.lock().unwrap() = true;
        Ok(())
    }
}
