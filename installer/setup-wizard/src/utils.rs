use std::fs;
use std::path::Path;
use std::process::Command;

pub fn get_available_space(drive: &str) -> Result<u64, Box<dyn std::error::Error>> {
    let output = Command::new("wmic")
        .args(&["logicaldisk", "where", &format!("DeviceID='{}'", drive), "get", "FreeSpace", "/value"])
        .output()?;

    let output_str = String::from_utf8_lossy(&output.stdout);
    
    for line in output_str.lines() {
        if line.starts_with("FreeSpace=") {
            let space_str = line.trim_start_matches("FreeSpace=");
            if let Ok(space) = space_str.parse::<u64>() {
                return Ok(space);
            }
        }
    }

    Err("Could not determine available space".into())
}

pub fn validate_install_path(path: &str) -> Result<bool, Box<dyn std::error::Error>> {
    let path = Path::new(path);
    
    // Check if path is valid
    if !path.is_absolute() {
        return Ok(false);
    }

    // Check if parent directory exists and is writable
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            return Ok(false);
        }

        // Try to create a test file to check write permissions
        let test_file = parent.join(".optiai_test_write");
        match fs::write(&test_file, "test") {
            Ok(_) => {
                let _ = fs::remove_file(&test_file);
                Ok(true)
            }
            Err(_) => Ok(false),
        }
    } else {
        Ok(false)
    }
}

pub fn launch_application(install_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let exe_path = Path::new(install_path).join("OptiAI.exe");
    
    Command::new(&exe_path)
        .spawn()?;

    Ok(())
}

pub fn open_folder(path: &str) -> Result<(), Box<dyn std::error::Error>> {
    Command::new("explorer")
        .arg(path)
        .spawn()?;

    Ok(())
}

pub fn get_drive_letter(path: &str) -> String {
    if let Some(first_char) = path.chars().next() {
        if first_char.is_ascii_alphabetic() {
            return format!("{}:", first_char.to_uppercase());
        }
    }
    "C:".to_string()
}

pub fn format_bytes(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    const THRESHOLD: u64 = 1024;

    if bytes == 0 {
        return "0 B".to_string();
    }

    let mut size = bytes as f64;
    let mut unit_index = 0;

    while size >= THRESHOLD as f64 && unit_index < UNITS.len() - 1 {
        size /= THRESHOLD as f64;
        unit_index += 1;
    }

    if unit_index == 0 {
        format!("{} {}", bytes, UNITS[unit_index])
    } else {
        format!("{:.1} {}", size, UNITS[unit_index])
    }
}

pub fn get_system_info() -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let mut info = serde_json::Map::new();

    // Get OS version
    let output = Command::new("ver").output()?;
    let os_version = String::from_utf8_lossy(&output.stdout).trim().to_string();
    info.insert("os_version".to_string(), serde_json::Value::String(os_version));

    // Get computer name
    let output = Command::new("hostname").output()?;
    let hostname = String::from_utf8_lossy(&output.stdout).trim().to_string();
    info.insert("hostname".to_string(), serde_json::Value::String(hostname));

    // Get architecture
    let output = Command::new("wmic").args(&["os", "get", "OSArchitecture", "/value"]).output()?;
    let arch_output = String::from_utf8_lossy(&output.stdout);
    for line in arch_output.lines() {
        if line.starts_with("OSArchitecture=") {
            let arch = line.trim_start_matches("OSArchitecture=");
            info.insert("architecture".to_string(), serde_json::Value::String(arch.to_string()));
            break;
        }
    }

    Ok(serde_json::Value::Object(info))
}
