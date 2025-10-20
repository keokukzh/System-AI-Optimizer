"""
Ollama LLM Manager for OptiAI
Handles AI/LLM integration using Ollama for system optimization suggestions
"""

import requests
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class OllamaManager:
    def __init__(self, base_url="http://127.0.0.1:11434"):
        self.base_url = base_url
        self.model = "qwen2.5-coder:latest"  # Default model - use available model
        self.timeout = 30
        
    def check_status(self) -> Dict:
        """Check if Ollama is running and get available models"""
        try:
            # Check if Ollama service is running
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            
            if response.status_code == 200:
                models_data = response.json()
                available_models = [model['name'] for model in models_data.get('models', [])]
                
                # Check if our preferred model is available
                model_available = any(self.model in model for model in available_models)
                
                # Auto-select best available model
                selected_model = self.model if model_available else self._select_best_model(available_models)
                
                return {
                    "available": True,
                    "status": "online",
                    "model": selected_model,
                    "available_models": available_models,
                    "model_loaded": model_available,
                    "auto_selected": not model_available and selected_model != "none"
                }
            else:
                return {
                    "available": False,
                    "status": "offline",
                    "model": self.model,
                    "error": f"HTTP {response.status_code}"
                }
                
        except requests.exceptions.ConnectionError:
            return {
                "available": False,
                "status": "offline",
                "model": self.model,
                "error": "Ollama not running - using fallback mode",
                "fallback": True,
                "message": "Ollama is not running. Please start Ollama with 'ollama serve' or install it from https://ollama.ai",
                "install_url": "https://ollama.ai/download",
                "instructions": "1. Download Ollama from https://ollama.ai\n2. Install and run 'ollama serve'\n3. Pull a model with 'ollama pull qwen2.5-coder'"
            }
        except requests.exceptions.Timeout:
            return {
                "available": False,
                "status": "offline",
                "model": self.model,
                "error": "Connection timeout"
            }
        except Exception as e:
            return {
                "available": False,
                "status": "error",
                "model": self.model,
                "error": str(e)
            }
    
    def _select_best_model(self, available_models):
        """Select the best available model from the list"""
        if not available_models:
            return "none"
        
        # Priority order for model selection
        preferred_models = [
            "qwen2.5-coder",
            "deepseek-coder", 
            "codellama",
            "llama",
            "phi3",
            "mistral",
            "gemma"
        ]
        
        # Find first preferred model that's available
        for preferred in preferred_models:
            for model in available_models:
                if preferred.lower() in model.lower():
                    return model
        
        # If no preferred model found, return the first available
        return available_models[0]
    
    async def generate_optimization_plan(self, scan_results: Dict) -> Dict:
        """Use LLM to generate optimization suggestions based on scan results"""
        try:
            prompt = self._build_optimization_prompt(scan_results)
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "max_tokens": 1000
                    }
                },
                timeout=self.timeout
            )
            
            if response.ok:
                result = response.json()
                suggestions = self._parse_llm_response(result.get('response', ''))
                return {
                    "suggestions": suggestions,
                    "confidence": 0.85,
                    "model_used": self.model,
                    "generated_at": datetime.now().isoformat()
                }
            else:
                raise Exception(f"Ollama API error: {response.status_code} - {response.text}")
                
        except Exception as e:
            logger.error(f"Error generating optimization plan: {e}")
            # Return fallback suggestions
            return self._get_fallback_suggestions(scan_results)
    
    def _build_optimization_prompt(self, scan_results: Dict) -> str:
        """Build a prompt for the LLM based on scan results"""
        total_files = scan_results.get('total_files', 0)
        total_size = scan_results.get('total_size', 0)
        duplicates = scan_results.get('duplicates', 0)
        large_files = scan_results.get('large_files', [])
        temp_files = scan_results.get('temp_files', [])
        
        prompt = f"""You are an AI system optimization expert. Analyze the following system scan results and provide specific, actionable optimization recommendations.

SCAN RESULTS:
- Total files scanned: {total_files:,}
- Total disk space used: {total_size / (1024**3):.2f} GB
- Duplicate files found: {duplicates}
- Large files (>100MB): {len(large_files)}
- Temporary files: {len(temp_files)}

Please provide 3-5 specific optimization recommendations in JSON format. Each recommendation should include:
1. action: The specific action to take (e.g., "delete_duplicates", "compress_large_files", "clean_temp_files")
2. description: Clear explanation of what this will do
3. estimated_savings: Estimated space savings in MB
4. risk_level: "low", "medium", or "high"
5. files_affected: Number of files that will be affected

Format your response as a JSON array of recommendation objects. Be specific and practical."""

        return prompt
    
    def _parse_llm_response(self, response_text: str) -> List[Dict]:
        """Parse LLM response and extract optimization suggestions"""
        try:
            # Try to extract JSON from the response
            import re
            
            # Look for JSON array in the response
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                suggestions = json.loads(json_str)
                
                # Validate and clean suggestions
                cleaned_suggestions = []
                for suggestion in suggestions:
                    if isinstance(suggestion, dict) and all(key in suggestion for key in ['action', 'description', 'estimated_savings', 'risk_level']):
                        cleaned_suggestions.append({
                            "action": suggestion['action'],
                            "description": suggestion['description'],
                            "estimated_savings": suggestion.get('estimated_savings', 0),
                            "risk_level": suggestion.get('risk_level', 'medium'),
                            "files_affected": suggestion.get('files_affected', 0)
                        })
                
                return cleaned_suggestions
            else:
                # Fallback: parse text response
                return self._parse_text_response(response_text)
                
        except Exception as e:
            logger.error(f"Error parsing LLM response: {e}")
            return self._get_fallback_suggestions({})
    
    def _parse_text_response(self, response_text: str) -> List[Dict]:
        """Parse text response when JSON parsing fails"""
        suggestions = []
        lines = response_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if line and ('delete' in line.lower() or 'clean' in line.lower() or 'optimize' in line.lower()):
                suggestions.append({
                    "action": "cleanup",
                    "description": line,
                    "estimated_savings": 100,  # Default estimate
                    "risk_level": "low",
                    "files_affected": 0
                })
        
        return suggestions[:5]  # Limit to 5 suggestions
    
    def _get_fallback_suggestions(self, scan_results: Dict) -> List[Dict]:
        """Provide fallback suggestions when LLM is unavailable"""
        suggestions = []
        
        total_files = scan_results.get('total_files', 0)
        duplicates = scan_results.get('duplicates', 0)
        large_files = scan_results.get('large_files', [])
        temp_files = scan_results.get('temp_files', [])
        
        if duplicates > 0:
            suggestions.append({
                "action": "delete_duplicates",
                "description": f"Remove {duplicates} duplicate files to free up space",
                "estimated_savings": duplicates * 5,  # Estimate 5MB per duplicate
                "risk_level": "low",
                "files_affected": duplicates
            })
        
        if len(temp_files) > 0:
            suggestions.append({
                "action": "clean_temp_files",
                "description": f"Clean {len(temp_files)} temporary files",
                "estimated_savings": len(temp_files) * 2,  # Estimate 2MB per temp file
                "risk_level": "low",
                "files_affected": len(temp_files)
            })
        
        if len(large_files) > 0:
            suggestions.append({
                "action": "compress_large_files",
                "description": f"Compress {len(large_files)} large files to save space",
                "estimated_savings": len(large_files) * 50,  # Estimate 50MB savings per file
                "risk_level": "medium",
                "files_affected": len(large_files)
            })
        
        if not suggestions:
            suggestions.append({
                "action": "general_cleanup",
                "description": "Perform general system cleanup and optimization",
                "estimated_savings": 100,
                "risk_level": "low",
                "files_affected": 0
            })
        
        return suggestions
    
    async def pull_model(self, model_name: str = None) -> Dict:
        """Pull a model from Ollama registry"""
        try:
            model = model_name or self.model
            response = requests.post(
                f"{self.base_url}/api/pull",
                json={"name": model},
                timeout=300  # 5 minutes timeout for model download
            )
            
            if response.ok:
                return {"success": True, "message": f"Model {model} pulled successfully"}
            else:
                return {"success": False, "error": f"Failed to pull model: {response.text}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
