use crate::backend::models::*;
use sysinfo::System;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct MetricsCollector {
    system: System,
}

impl MetricsCollector {
    pub fn new() -> Self {
        let mut system = System::new_all();
        system.refresh_all();
        
        Self { system }
    }

    pub fn get_system_metrics(&mut self) -> Result<SystemMetrics, Box<dyn std::error::Error>> {
        self.system.refresh_all();

        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs()
            .to_string();

        // CPU Metriken
        let cpu_usage = self.system.global_cpu_info().cpu_usage();
        let cpu_cores = self.system.cpus().len() as u32;
        let cpu_frequency = self.system.global_cpu_info().frequency() as f32;

        // Memory Metriken
        let total_memory = self.system.total_memory();
        let used_memory = self.system.used_memory();
        let available_memory = self.system.available_memory();
        let memory_usage_percent = (used_memory as f32 / total_memory as f32) * 100.0;

        // Disk Metriken (vereinfacht)
        let total_disk = 100 * 1024 * 1024 * 1024; // 100GB placeholder
        let used_disk = 50 * 1024 * 1024 * 1024;   // 50GB placeholder
        let free_disk = total_disk - used_disk;
        let disk_usage_percent = 50.0;

        // Network Metriken (vereinfacht)
        let bytes_sent = 0u64;
        let bytes_received = 0u64;
        let packets_sent = 0u64;
        let packets_received = 0u64;

        Ok(SystemMetrics {
            timestamp,
            cpu: CpuMetrics {
                usage: cpu_usage,
                cores: cpu_cores,
                frequency: cpu_frequency,
            },
            memory: MemoryMetrics {
                total: total_memory,
                used: used_memory,
                available: available_memory,
                usage_percent: memory_usage_percent,
            },
            disk: DiskMetrics {
                total: total_disk,
                used: used_disk,
                free: free_disk,
                usage_percent: disk_usage_percent,
            },
            network: NetworkMetrics {
                bytes_sent,
                bytes_received,
                packets_sent,
                packets_received,
            },
        })
    }

    pub fn collect_system_info(&mut self) -> serde_json::Value {
        self.system.refresh_all();

        let mut system_info = serde_json::Map::new();
        
        // System Information
        system_info.insert("os_name".to_string(), serde_json::Value::String(
            format!("{} {}", System::name().unwrap_or_else(|| "Unknown".to_string()), 
                   System::os_version().unwrap_or_else(|| "Unknown".to_string()))
        ));
        
        system_info.insert("hostname".to_string(), serde_json::Value::String(
            System::host_name().unwrap_or_else(|| "Unknown".to_string())
        ));
        
        system_info.insert("kernel_version".to_string(), serde_json::Value::String(
            System::kernel_version().unwrap_or_else(|| "Unknown".to_string())
        ));
        
        system_info.insert("cpu_count".to_string(), serde_json::Value::Number(
            serde_json::Number::from(self.system.cpus().len())
        ));
        
        system_info.insert("total_memory".to_string(), serde_json::Value::Number(
            serde_json::Number::from(self.system.total_memory())
        ));
        
        system_info.insert("uptime".to_string(), serde_json::Value::Number(
            serde_json::Number::from(System::uptime())
        ));

        // Disk Information (vereinfacht)
        let mut disks = serde_json::Map::new();
        let disk_info = serde_json::json!({
            "name": "C:",
            "mount_point": "C:\\",
            "total_space": 100u64 * 1024 * 1024 * 1024,
            "available_space": 50u64 * 1024 * 1024 * 1024,
            "file_system": "NTFS"
        });
        disks.insert("C:".to_string(), disk_info);
        system_info.insert("disks".to_string(), serde_json::Value::Object(disks));

        serde_json::Value::Object(system_info)
    }
}