#!/usr/bin/env python3
"""
Download and Optimize Production LLM Model for OptiAI
Downloads a lightweight model optimized for system operations
"""

import os
import sys
import json
import requests
import subprocess
from pathlib import Path
from typing import Optional

# Model configuration
MODELS = {
    'phi-2': {
        'url': 'https://huggingface.co/microsoft/phi-2/resolve/main/pytorch_model.bin',
        'size': '2.7GB',
        'description': 'Microsoft Phi-2 - Small, efficient model for system operations'
    },
    'tinyllama': {
        'url': 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.q4_k_m.gguf',
        'size': '0.7GB',
        'description': 'TinyLlama 1.1B - Ultra-lightweight model for quick responses'
    },
    'qwen2.5-3b': {
        'url': 'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2_5-3b-instruct-q4_k_m.gguf',
        'size': '2.0GB',
        'description': 'Qwen2.5 3B - Balanced model with good performance'
    }
}

def get_project_root():
    """Get the project root directory"""
    return Path(__file__).parent.parent

def get_models_dir():
    """Get the models directory"""
    return get_project_root() / 'src-tauri' / 'resources' / 'models'

def download_file(url: str, destination: Path, chunk_size: int = 8192) -> bool:
    """Download a file with progress bar"""
    try:
        print(f"Downloading {url}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(destination, 'wb') as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        print(f"\rProgress: {progress:.1f}% ({downloaded / 1024 / 1024:.1f}MB / {total_size / 1024 / 1024:.1f}MB)", end='')
        
        print(f"\nDownload completed: {destination}")
        return True
        
    except Exception as e:
        print(f"\nDownload failed: {e}")
        return False

def create_model_config(model_name: str, model_path: Path) -> dict:
    """Create model configuration"""
    config = {
        'name': model_name,
        'path': str(model_path.relative_to(get_models_dir())),
        'type': 'gguf',
        'context_size': 2048,
        'parameters': {
            'temperature': 0.7,
            'top_p': 0.9,
            'top_k': 40,
            'repeat_penalty': 1.1,
            'max_tokens': 512
        },
        'system_prompt': 'You are OptiAI, an intelligent system optimization assistant. Provide helpful, accurate, and safe recommendations for system optimization tasks.',
        'capabilities': [
            'system_analysis',
            'optimization_suggestions',
            'file_management',
            'performance_analysis',
            'security_recommendations'
        ],
        'metadata': {
            'version': '1.0.0',
            'created': '2024-10-18',
            'optimized_for': 'system_operations',
            'language': 'en'
        }
    }
    
    return config

def save_model_config(config: dict, config_path: Path):
    """Save model configuration to file"""
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"Model configuration saved: {config_path}")

def check_llama_cpp():
    """Check if llama.cpp is available"""
    try:
        result = subprocess.run(['llama-server', '--help'], 
                              capture_output=True, text=True, timeout=5)
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False

def download_model(model_name: str) -> bool:
    """Download and configure a model"""
    if model_name not in MODELS:
        print(f"Unknown model: {model_name}")
        print(f"Available models: {', '.join(MODELS.keys())}")
        return False
    
    model_info = MODELS[model_name]
    models_dir = get_models_dir()
    models_dir.mkdir(parents=True, exist_ok=True)
    
    # Determine file extension
    if model_name == 'phi-2':
        filename = 'phi-2.gguf'
    else:
        filename = f'{model_name}.gguf'
    
    model_path = models_dir / filename
    config_path = models_dir / f'{model_name}-config.json'
    
    # Check if model already exists
    if model_path.exists():
        print(f"Model already exists: {model_path}")
        response = input("Do you want to re-download? (y/N): ")
        if response.lower() != 'y':
            print("Skipping download")
            return True
    
    # Download model
    print(f"Downloading {model_name} ({model_info['size']})...")
    print(f"Description: {model_info['description']}")
    
    if not download_file(model_info['url'], model_path):
        return False
    
    # Create configuration
    config = create_model_config(model_name, model_path)
    save_model_config(config, config_path)
    
    print(f"Model {model_name} downloaded and configured successfully!")
    return True

def list_available_models():
    """List available models"""
    print("Available models:")
    for name, info in MODELS.items():
        print(f"  {name}: {info['size']} - {info['description']}")

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python download_production_model.py <model_name>")
        print("       python download_production_model.py list")
        list_available_models()
        return 1
    
    command = sys.argv[1].lower()
    
    if command == 'list':
        list_available_models()
        return 0
    
    # Check if llama.cpp is available
    if not check_llama_cpp():
        print("Warning: llama.cpp not found. Make sure llama-server is in your PATH.")
        print("The model will be downloaded but may not work without llama.cpp.")
    
    # Download model
    if not download_model(command):
        return 1
    
    print("\nModel download completed successfully!")
    print("You can now use the model with OptiAI.")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())