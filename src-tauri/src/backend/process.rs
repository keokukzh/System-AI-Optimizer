use crate::backend::models::*;
use sysinfo::{System, Pid};

pub struct ProcessManager {
    system: System,
}

impl ProcessManager {
    pub fn new() -> Self {
        let mut system = System::new_all();
        system.refresh_all();
        
        Self { system }
    }

    pub fn get_processes(&mut self) -> Result<Vec<ProcessInfo>, Box<dyn std::error::Error>> {
        self.system.refresh_all();
        
        let mut processes = Vec::new();
        
        for (pid, process) in self.system.processes() {
            let process_info = ProcessInfo {
                pid: pid.as_u32(),
                name: process.name().to_string(),
                cpu_percent: process.cpu_usage(),
                memory_percent: (process.memory() as f32 / self.system.total_memory() as f32) * 100.0,
                memory_usage: process.memory() * 1024, // Convert to bytes
                status: format!("{:?}", process.status()),
            };
            
            processes.push(process_info);
        }
        
        // Sort by CPU usage (descending)
        processes.sort_by(|a, b| b.cpu_percent.partial_cmp(&a.cpu_percent).unwrap_or(std::cmp::Ordering::Equal));
        
        // Limit to top 100 processes
        processes.truncate(100);
        
        Ok(processes)
    }

    pub fn kill_process(&mut self, pid: u32) -> Result<ActionResult, Box<dyn std::error::Error>> {
        self.system.refresh_all();
        
        let pid = Pid::from_u32(pid);
        
        if let Some(process) = self.system.process(pid) {
            let process_name = process.name().to_string();
            
            // Try to kill the process
            if process.kill() {
                Ok(ActionResult {
                    success: true,
                    message: format!("Process '{}' (PID: {}) terminated successfully", process_name, pid.as_u32()),
                    timestamp: std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_secs()
                        .to_string(),
                })
            } else {
                Ok(ActionResult {
                    success: false,
                    message: format!("Failed to terminate process '{}' (PID: {})", process_name, pid.as_u32()),
                    timestamp: std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_secs()
                        .to_string(),
                })
            }
        } else {
            Ok(ActionResult {
                success: false,
                message: format!("Process with PID {} not found", pid.as_u32()),
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs()
                    .to_string(),
            })
        }
    }

    #[allow(dead_code)]
    pub fn get_process_by_name(&mut self, name: &str) -> Result<Vec<ProcessInfo>, Box<dyn std::error::Error>> {
        self.system.refresh_all();
        
        let mut processes = Vec::new();
        
        for (pid, process) in self.system.processes() {
            if process.name().to_lowercase().contains(&name.to_lowercase()) {
                let process_info = ProcessInfo {
                    pid: pid.as_u32(),
                    name: process.name().to_string(),
                    cpu_percent: process.cpu_usage(),
                    memory_percent: (process.memory() as f32 / self.system.total_memory() as f32) * 100.0,
                    memory_usage: process.memory() * 1024,
                    status: format!("{:?}", process.status()),
                };
                
                processes.push(process_info);
            }
        }
        
        Ok(processes)
    }

    #[allow(dead_code)]
    pub fn get_system_load(&mut self) -> Result<f32, Box<dyn std::error::Error>> {
        self.system.refresh_all();
        Ok(System::load_average().one as f32)
    }
}
