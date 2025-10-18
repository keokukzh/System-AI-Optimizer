use crate::backend::models::*;
use std::path::{Path, PathBuf};
use std::env;
use std::collections::HashMap;
use reqwest::Client;
use serde_json::json;
use tokio::time::{timeout, Duration, sleep};
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;

pub struct LLMManager {
    model_loaded: bool,
    model_path: Option<PathBuf>,
    model_name: Option<String>,
    fallback_mode: bool,
    last_error: Option<String>,
    available_models: Vec<ModelInfo>,
    current_model_info: Option<ModelInfo>,
    client: Client,
    server_url: String,
    retry_count: Arc<AtomicU32>,
    max_retries: u32,
    base_timeout: Duration,
}

impl LLMManager {
    pub fn new() -> Self {
        let mut manager = Self {
            model_loaded: false,
            model_path: None,
            model_name: None,
            fallback_mode: false,
            last_error: None,
            available_models: Vec::new(),
            current_model_info: None,
            client: Client::new(),
            server_url: "http://127.0.0.1:11434".to_string(),
            retry_count: Arc::new(AtomicU32::new(0)),
            max_retries: 3,
            base_timeout: Duration::from_secs(30),
        };
        
        // Discover available models
        manager.discover_models();
        manager
    }

    fn discover_models(&mut self) {
        let models_dir = self.get_models_directory();
        if !models_dir.exists() {
            return;
        }

        let model_candidates = vec![
            ("phi3-mini-4k-instruct.gguf", "phi3-mini", 2048),
            ("qwen2.5-3b-instruct-q4_0.gguf", "qwen2.5-3b", 2048),
            ("tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf", "tinyllama", 2048),
            ("optiai-model.gguf", "optiai-custom", 2048),
        ];

        for (filename, name, context_size) in model_candidates {
            let model_path = models_dir.join(filename);
            if model_path.exists() {
                if let Ok(metadata) = std::fs::metadata(&model_path) {
                    let model_info = ModelInfo {
                        name: name.to_string(),
                        path: model_path.to_string_lossy().to_string(),
                        size: metadata.len(),
                        loaded: false,
                        available: true,
                        context_size,
                        parameters: ModelParameters::default(),
                    };
                    self.available_models.push(model_info);
                }
            }
        }
    }

    fn get_models_directory(&self) -> PathBuf {
        // First try bundled resources
        if let Ok(exe_dir) = env::current_exe() {
            let bundled_models = exe_dir
                .parent()
                .unwrap()
                .join("resources")
                .join("models");
            if bundled_models.exists() {
                return bundled_models;
            }
        }

        // Fallback to AppData
        let app_data = env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(app_data)
            .join("OptiAI")
            .join("models")
    }

    pub async fn init_llm(&mut self) -> Result<(), OptiAIError> {
        // Reset retry counter
        self.retry_count.store(0, Ordering::SeqCst);
        
        // Try to check server health with retry logic
        if !self.check_server_health_with_retry().await {
            self.fallback_mode = true;
            self.model_loaded = false;
            self.last_error = Some("LLM server not available after retries".to_string());
            return Err(OptiAIError::LLMError("LLM server not available after retries".to_string()));
        }

        // Try to load models in order of preference with retry logic
        let model_priority = vec!["phi3-mini", "qwen2.5-3b", "tinyllama", "optiai-custom"];
        
        for model_name in model_priority {
            if let Some(model_info) = self.available_models.iter().find(|m| m.name == model_name).cloned() {
                match self.load_model_with_retry(&model_info).await {
                    Ok(_) => {
                        self.model_name = Some(model_name.to_string());
                        self.model_loaded = true;
                        self.fallback_mode = false;
                        self.last_error = None;
                        self.retry_count.store(0, Ordering::SeqCst);
                        return Ok(());
                    }
                    Err(e) => {
                        self.last_error = Some(e.to_string());
                        continue;
                    }
                }
            }
        }

        // If no model could be loaded, enable fallback mode
        self.fallback_mode = true;
        self.model_loaded = false;
        Err(OptiAIError::ModelLoadError("No AI models could be loaded. Using rule-based fallback.".to_string()))
    }

    async fn check_server_health(&self) -> bool {
        let health_url = format!("{}/api/tags", self.server_url);
        let result = timeout(Duration::from_secs(5), self.client.get(&health_url).send()).await;
        
        match result {
            Ok(Ok(response)) => response.status().is_success(),
            _ => false,
        }
    }

    async fn check_server_health_with_retry(&self) -> bool {
        for attempt in 0..self.max_retries {
            if self.check_server_health().await {
                return true;
            }
            
            if attempt < self.max_retries - 1 {
                let delay = Duration::from_millis(1000 * (2_u64.pow(attempt)));
                sleep(delay).await;
            }
        }
        false
    }

    async fn load_model(&mut self, model_info: &ModelInfo) -> Result<(), OptiAIError> {
        let model_path = Path::new(&model_info.path);
        
        if !model_path.exists() {
            return Err(OptiAIError::ModelNotFound(model_info.path.clone()));
        }

        // Load model via Ollama API
        let load_url = format!("{}/api/pull", self.server_url);
        let payload = json!({
            "name": model_info.name,
            "path": model_info.path
        });

        let response = timeout(
            self.base_timeout,
            self.client.post(&load_url).json(&payload).send()
        ).await
        .map_err(|_| OptiAIError::ModelLoadError("Request timeout".to_string()))?
        .map_err(|e| OptiAIError::ModelLoadError(format!("Request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(OptiAIError::ModelLoadError(format!("Failed to load model: {}", response.status())));
        }

        self.model_path = Some(model_path.to_path_buf());
        self.current_model_info = Some(model_info.clone());

        Ok(())
    }

    async fn load_model_with_retry(&mut self, model_info: &ModelInfo) -> Result<(), OptiAIError> {
        for attempt in 0..self.max_retries {
            match self.load_model(model_info).await {
                Ok(_) => return Ok(()),
                Err(e) => {
                    if attempt < self.max_retries - 1 {
                        let delay = Duration::from_millis(2000 * (2_u64.pow(attempt)));
                        sleep(delay).await;
                        continue;
                    } else {
                        return Err(e);
                    }
                }
            }
        }
        Err(OptiAIError::ModelLoadError("Max retries exceeded".to_string()))
    }

    pub async fn generate_suggestions(&self, scan_result: &ScanResult) -> Result<Vec<AISuggestion>, OptiAIError> {
        if self.fallback_mode || !self.model_loaded {
            return Ok(self.generate_fallback_suggestions(scan_result));
        }

        let prompt = self.create_scan_analysis_prompt(scan_result);
        match self.generate_ai_response_with_retry(&prompt).await {
            Ok(response) => self.parse_ai_suggestions(&response),
            Err(_e) => {
                // Fall back to rule-based suggestions if AI fails
                Ok(self.generate_fallback_suggestions(scan_result))
            }
        }
    }

    pub async fn analyze_system(&self, metrics: &SystemMetrics) -> Result<Vec<AISuggestion>, OptiAIError> {
        if self.fallback_mode || !self.model_loaded {
            return Ok(self.generate_fallback_system_suggestions(metrics));
        }

        let prompt = self.create_system_analysis_prompt(metrics);
        match self.generate_ai_response_with_retry(&prompt).await {
            Ok(response) => self.parse_ai_suggestions(&response),
            Err(_e) => {
                // Fall back to rule-based suggestions if AI fails
                Ok(self.generate_fallback_system_suggestions(metrics))
            }
        }
    }

    async fn generate_ai_response(&self, prompt: &str) -> Result<String, OptiAIError> {
        let generate_url = format!("{}/api/generate", self.server_url);
        let payload = json!({
            "model": self.model_name.as_ref().unwrap_or(&"phi3-mini".to_string()),
            "prompt": prompt,
            "stream": false,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "top_k": 40,
                "repeat_penalty": 1.1,
                "num_predict": 512
            }
        });

        let response = timeout(
            self.base_timeout,
            self.client.post(&generate_url).json(&payload).send()
        ).await
        .map_err(|_| OptiAIError::InferenceError("Request timeout".to_string()))?
        .map_err(|e| OptiAIError::InferenceError(format!("Request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(OptiAIError::InferenceError(format!("Generation failed: {}", response.status())));
        }

        let result: serde_json::Value = response.json().await
            .map_err(|e| OptiAIError::InferenceError(format!("Failed to parse response: {}", e)))?;

        result.get("response")
            .and_then(|r| r.as_str())
            .map(|s| s.to_string())
            .ok_or_else(|| OptiAIError::InferenceError("Invalid response format".to_string()))
    }

    async fn generate_ai_response_with_retry(&self, prompt: &str) -> Result<String, OptiAIError> {
        for attempt in 0..self.max_retries {
            match self.generate_ai_response(prompt).await {
                Ok(response) => return Ok(response),
                Err(e) => {
                    if attempt < self.max_retries - 1 {
                        let delay = Duration::from_millis(1000 * (2_u64.pow(attempt)));
                        sleep(delay).await;
                        continue;
                    } else {
                        return Err(e);
                    }
                }
            }
        }
        Err(OptiAIError::InferenceError("Max retries exceeded for AI response".to_string()))
    }

    fn create_scan_analysis_prompt(&self, scan_result: &ScanResult) -> String {
        format!(
            "You are OptiAI, an intelligent system optimization assistant. Analyze this scan result and provide optimization suggestions.

Scan Results:
- Path: {}
- Total Files: {}
- Total Size: {:.2} GB
- Duplicates Found: {}
- Scan Duration: {:.2} seconds

File Types Found:
{}

Largest Files:
{}

Provide 3-5 specific, actionable optimization suggestions in JSON format:
{{
  \"suggestions\": [
    {{
      \"title\": \"Suggestion Title\",
      \"description\": \"Detailed description of the suggestion\",
      \"confidence\": 0.95,
      \"category\": \"cleanup|optimization|security|maintenance\"
    }}
  ]
}}

Focus on:
1. Duplicate file removal
2. Large file management
3. Temporary file cleanup
4. System optimization
5. Security improvements",
            scan_result.path,
            scan_result.summary.total_files,
            scan_result.summary.total_size as f64 / (1024.0 * 1024.0 * 1024.0),
            scan_result.summary.duplicates_found,
            scan_result.summary.scan_duration,
            self.analyze_file_types(&scan_result.items),
            self.get_largest_files(&scan_result.items, 5)
        )
    }

    fn create_system_analysis_prompt(&self, metrics: &SystemMetrics) -> String {
        format!(
            "You are OptiAI, an intelligent system optimization assistant. Analyze these system metrics and provide performance recommendations.

System Metrics:
- CPU Usage: {:.1}% ({} cores)
- Memory Usage: {:.1}% ({:.2} GB used / {:.2} GB total)
- Disk Usage: {:.1}% ({:.2} GB used / {:.2} GB total)
- Network: {} MB sent, {} MB received

Provide 3-5 specific performance optimization suggestions in JSON format:
{{
  \"suggestions\": [
    {{
      \"title\": \"Performance Suggestion\",
      \"description\": \"Detailed description of the optimization\",
      \"confidence\": 0.90,
      \"category\": \"performance|memory|storage|network\"
    }}
  ]
}}

Focus on:
1. High resource usage issues
2. Memory optimization
3. Disk space management
4. Performance bottlenecks
5. System maintenance",
            metrics.cpu.usage,
            metrics.cpu.cores,
            metrics.memory.usage_percent,
            metrics.memory.used as f64 / (1024.0 * 1024.0 * 1024.0),
            metrics.memory.total as f64 / (1024.0 * 1024.0 * 1024.0),
            metrics.disk.usage_percent,
            metrics.disk.used as f64 / (1024.0 * 1024.0 * 1024.0),
            metrics.disk.total as f64 / (1024.0 * 1024.0 * 1024.0),
            metrics.network.bytes_sent / (1024 * 1024),
            metrics.network.bytes_received / (1024 * 1024)
        )
    }

    fn parse_ai_suggestions(&self, response: &str) -> Result<Vec<AISuggestion>, OptiAIError> {
        // Try to parse JSON response
        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(response) {
            if let Some(suggestions) = parsed.get("suggestions").and_then(|s| s.as_array()) {
                let mut ai_suggestions = Vec::new();
                for suggestion in suggestions {
                    if let (Some(title), Some(description), Some(confidence), Some(category)) = (
                        suggestion.get("title").and_then(|t| t.as_str()),
                        suggestion.get("description").and_then(|d| d.as_str()),
                        suggestion.get("confidence").and_then(|c| c.as_f64()),
                        suggestion.get("category").and_then(|cat| cat.as_str()),
                    ) {
                        ai_suggestions.push(AISuggestion {
                            title: title.to_string(),
                            description: description.to_string(),
                            confidence: confidence as f32,
                            category: category.to_string(),
                        });
                    }
                }
                return Ok(ai_suggestions);
            }
        }

        // Fallback: parse text response
        self.parse_text_suggestions(response)
    }

    fn parse_text_suggestions(&self, response: &str) -> Result<Vec<AISuggestion>, OptiAIError> {
        let mut suggestions = Vec::new();
        let lines: Vec<&str> = response.lines().collect();
        
        for line in lines {
            if line.trim().starts_with("- ") || line.trim().starts_with("• ") {
                let content = line.trim().trim_start_matches("- ").trim_start_matches("• ");
                if content.len() > 10 {
                    suggestions.push(AISuggestion {
                        title: content.chars().take(50).collect::<String>() + "...",
                        description: content.to_string(),
                        confidence: 0.8,
                        category: "optimization".to_string(),
                    });
                }
            }
        }

        if suggestions.is_empty() {
            suggestions.push(AISuggestion {
                title: "AI Analysis Complete".to_string(),
                description: "AI has analyzed your system. Review the scan results for optimization opportunities.".to_string(),
                confidence: 0.7,
                category: "analysis".to_string(),
            });
        }

        Ok(suggestions)
    }

    fn analyze_file_types(&self, items: &[FileItem]) -> String {
        let mut type_counts: HashMap<String, u32> = HashMap::new();
        let mut type_sizes: HashMap<String, u64> = HashMap::new();

        for item in items {
            let ext = Path::new(&item.path)
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown")
                .to_lowercase();

            *type_counts.entry(ext.clone()).or_insert(0) += 1;
            *type_sizes.entry(ext).or_insert(0) += item.size;
        }

        let mut result = String::new();
        let mut sorted_types: Vec<_> = type_sizes.iter().collect();
        sorted_types.sort_by(|a, b| b.1.cmp(a.1));

        for (ext, size) in sorted_types.iter().take(10) {
            let count = type_counts.get(*ext).unwrap_or(&0);
            result.push_str(&format!("- .{}: {} files, {:.2} MB\n", ext, count, **size as f64 / (1024.0 * 1024.0)));
        }

        result
    }

    fn get_largest_files(&self, items: &[FileItem], count: usize) -> String {
        let mut sorted_items = items.to_vec();
        sorted_items.sort_by(|a, b| b.size.cmp(&a.size));

        let mut result = String::new();
        for item in sorted_items.iter().take(count) {
            let size_mb = item.size as f64 / (1024.0 * 1024.0);
            result.push_str(&format!("- {}: {:.2} MB\n", item.path, size_mb));
        }

        result
    }

    // Fallback methods for when AI is not available
    pub fn generate_fallback_suggestions(&self, scan_result: &ScanResult) -> Vec<AISuggestion> {
        let mut suggestions = Vec::new();

        if scan_result.summary.duplicates_found > 0 {
            suggestions.push(AISuggestion {
                title: "Duplicate Files Detected".to_string(),
                description: format!(
                    "Found {} duplicate files. Removing duplicates can free up significant disk space.",
                    scan_result.summary.duplicates_found
                ),
                confidence: 0.95,
                category: "cleanup".to_string(),
            });
        }

        if scan_result.summary.total_size > 10 * 1024 * 1024 * 1024 {
            suggestions.push(AISuggestion {
                title: "Large Directory Detected".to_string(),
                description: format!(
                    "Directory contains {:.2} GB of data. Consider archiving old files.",
                    scan_result.summary.total_size as f64 / (1024.0 * 1024.0 * 1024.0)
                ),
                confidence: 0.8,
                category: "optimization".to_string(),
            });
        }

        let temp_files: Vec<_> = scan_result.items.iter()
            .filter(|item| item.path.contains("temp") || item.path.contains("tmp"))
            .collect();

        if !temp_files.is_empty() {
            suggestions.push(AISuggestion {
                title: "Temporary Files Found".to_string(),
                description: format!(
                    "Found {} temporary files that can be safely deleted.",
                    temp_files.len()
                ),
                confidence: 0.9,
                category: "cleanup".to_string(),
            });
        }

        suggestions.push(AISuggestion {
            title: "System Optimization".to_string(),
            description: "Run disk cleanup and defragmentation to improve system performance.".to_string(),
            confidence: 0.7,
            category: "maintenance".to_string(),
        });

        suggestions
    }

    pub fn generate_fallback_system_suggestions(&self, metrics: &SystemMetrics) -> Vec<AISuggestion> {
        let mut suggestions = Vec::new();

        if metrics.cpu.usage > 80.0 {
            suggestions.push(AISuggestion {
                title: "High CPU Usage".to_string(),
                description: format!(
                    "CPU usage is at {:.1}%. Close unnecessary programs or check for background processes.",
                    metrics.cpu.usage
                ),
                confidence: 0.9,
                category: "performance".to_string(),
            });
        }

        if metrics.memory.usage_percent > 85.0 {
            suggestions.push(AISuggestion {
                title: "High Memory Usage".to_string(),
                description: format!(
                    "Memory usage is at {:.1}%. Consider closing applications or adding more RAM.",
                    metrics.memory.usage_percent
                ),
                confidence: 0.9,
                category: "performance".to_string(),
            });
        }

        if metrics.disk.usage_percent > 90.0 {
            suggestions.push(AISuggestion {
                title: "Low Disk Space".to_string(),
                description: format!(
                    "Disk usage is at {:.1}%. Free up space by deleting unnecessary files.",
                    metrics.disk.usage_percent
                ),
                confidence: 0.95,
                category: "storage".to_string(),
            });
        }

        suggestions
    }

    pub fn is_available(&self) -> bool {
        self.model_loaded && !self.fallback_mode
    }

    pub fn is_model_loaded(&self) -> bool {
        self.model_loaded
    }

    pub fn get_model_info(&self) -> Result<serde_json::Value, OptiAIError> {
        let mut info = serde_json::Map::new();
        
        info.insert("model_loaded".to_string(), serde_json::Value::Bool(self.model_loaded));
        info.insert("fallback_mode".to_string(), serde_json::Value::Bool(self.fallback_mode));
        info.insert("available_models".to_string(), serde_json::Value::Number(
            serde_json::Number::from(self.available_models.len())
        ));

        if let Some(model_name) = &self.model_name {
            info.insert("current_model".to_string(), serde_json::Value::String(model_name.clone()));
        }

        if let Some(model_path) = &self.model_path {
            info.insert("model_path".to_string(), serde_json::Value::String(
                model_path.to_string_lossy().to_string()
            ));
        }

        if let Some(error) = &self.last_error {
            info.insert("last_error".to_string(), serde_json::Value::String(error.clone()));
        }

        Ok(serde_json::Value::Object(info))
    }

    pub fn get_available_models(&self) -> &Vec<ModelInfo> {
        &self.available_models
    }

    pub fn get_ai_status(&self) -> AIStatus {
        AIStatus {
            available: self.is_available(),
            status: if self.is_available() { "online".to_string() } else { "offline".to_string() },
            model_name: self.model_name.clone(),
            model_loaded: self.model_loaded,
            fallback_mode: self.fallback_mode,
            last_error: self.last_error.clone(),
        }
    }
}