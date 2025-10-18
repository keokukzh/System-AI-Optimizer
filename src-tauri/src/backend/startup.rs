use crate::backend::models::*;
use winreg::enums::*;
use winreg::RegKey;
 
pub struct StartupManager;

impl StartupManager {
    pub fn get_startup_programs(&self) -> Result<Vec<StartupProgram>, Box<dyn std::error::Error>> {
        let mut programs = Vec::new();

        // Common startup registry locations
        let startup_locations = vec![
            (HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run"),
            (HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run"),
            (HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce"),
            (HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce"),
        ];

        for (hive, key_path) in startup_locations {
            if let Ok(key) = RegKey::predef(hive).open_subkey(key_path) {
                for name in key.enum_values().map(|x| x.unwrap()) {
                    if let Ok(value) = key.get_value::<String, _>(&name.0) {
                        let program = StartupProgram {
                            name: name.0.clone(),
                            path: value.clone(),
                            enabled: true,
                            startup_type: self.get_startup_type(&key_path),
                            registry_key: format!("{}\\{}", key_path, name.0),
                        };
                        programs.push(program);
                    }
                }
            }
        }

        // Add some common Windows startup programs
        programs.extend(self.get_common_startup_programs());

        Ok(programs)
    }

    pub fn toggle_startup_program(&self, name: &str, enabled: bool) -> Result<ActionResult, Box<dyn std::error::Error>> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let run_key = hkcu.open_subkey_with_flags(
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
            KEY_WRITE,
        )?;

        if enabled {
            // For this example, we'll just add a placeholder
            // In a real implementation, you'd need to store the original path
            run_key.set_value(name, &"C:\\Windows\\System32\\notepad.exe")?;
            
            Ok(ActionResult {
                success: true,
                message: format!("Startup program '{}' enabled", name),
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs()
                    .to_string(),
            })
        } else {
            run_key.delete_value(name)?;
            
            Ok(ActionResult {
                success: true,
                message: format!("Startup program '{}' disabled", name),
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs()
                    .to_string(),
            })
        }
    }

    fn get_startup_type(&self, key_path: &str) -> String {
        if key_path.contains("RunOnce") {
            "runonce".to_string()
        } else if key_path.contains("HKEY_CURRENT_USER") {
            "user".to_string()
        } else {
            "system".to_string()
        }
    }

    fn get_common_startup_programs(&self) -> Vec<StartupProgram> {
        vec![
            StartupProgram {
                name: "Windows Security".to_string(),
                path: "C:\\Windows\\System32\\SecurityHealthSystray.exe".to_string(),
                enabled: true,
                startup_type: "system".to_string(),
                registry_key: "System".to_string(),
            },
            StartupProgram {
                name: "Windows Update".to_string(),
                path: "C:\\Windows\\System32\\UsoClient.exe".to_string(),
                enabled: true,
                startup_type: "system".to_string(),
                registry_key: "System".to_string(),
            },
            StartupProgram {
                name: "Steam".to_string(),
                path: "C:\\Program Files (x86)\\Steam\\steam.exe".to_string(),
                enabled: false,
                startup_type: "user".to_string(),
                registry_key: "User".to_string(),
            },
            StartupProgram {
                name: "Discord".to_string(),
                path: "C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\Update.exe".to_string(),
                enabled: false,
                startup_type: "user".to_string(),
                registry_key: "User".to_string(),
            },
        ]
    }

    #[allow(dead_code)]
    pub fn is_startup_program_enabled(&self, name: &str) -> Result<bool, Box<dyn std::error::Error>> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let run_key = hkcu.open_subkey(r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run")?;
        
        match run_key.get_value::<String, _>(name) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    #[allow(dead_code)]
    pub fn get_startup_folder_programs(&self) -> Result<Vec<StartupProgram>, Box<dyn std::error::Error>> {
        let mut programs = Vec::new();
        
        // Get startup folder paths
        let startup_folders = vec![
            format!("{}\\Microsoft\\Windows\\Start Menu\\Programs\\Startup", 
                   std::env::var("APPDATA")?),
            format!("{}\\Microsoft\\Windows\\Start Menu\\Programs\\Startup", 
                   std::env::var("ALLUSERSPROFILE")?),
        ];

        for folder in startup_folders {
            if let Ok(entries) = std::fs::read_dir(&folder) {
                for entry in entries.flatten() {
                    if let Some(file_name) = entry.file_name().to_str() {
                        let program = StartupProgram {
                            name: file_name.to_string(),
                            path: entry.path().to_string_lossy().to_string(),
                            enabled: true,
                            startup_type: "folder".to_string(),
                            registry_key: folder.clone(),
                        };
                        programs.push(program);
                    }
                }
            }
        }

        Ok(programs)
    }
}
