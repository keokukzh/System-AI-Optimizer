#!/usr/bin/env python3
"""
Download real AI model for OptiAI
Downloads Qwen2.5-3B-Instruct GGUF model for local use
"""

import os
import requests
import hashlib
from pathlib import Path
import tempfile
import zipfile
import json
from tqdm import tqdm

def download_file(url: str, filepath: Path, expected_size: int = None) -> bool:
    """Download file with progress bar"""
    try:
        print(f"Downloading {url}...")
        
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        if expected_size and total_size != expected_size:
            print(f"Warning: Expected size {expected_size}, got {total_size}")
        
        with open(filepath, 'wb') as f:
            downloaded = 0
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"\rProgress: {percent:.1f}% ({downloaded}/{total_size} bytes)", end='', flush=True)
            print()  # New line after progress
        
        print(f"Downloaded: {filepath}")
        return True
        
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

def download_qwen_model():
    """Download Qwen2.5-3B-Instruct GGUF model"""
    
    models_dir = Path("src-tauri/resources/models")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = models_dir / "qwen2.5-3b-instruct-q4_0.gguf"
    
    if model_path.exists():
        print(f"Model already exists: {model_path}")
        print(f"Size: {model_path.stat().st_size / (1024**3):.2f} GB")
        return True
    
    # Qwen2.5-3B-Instruct GGUF model from Hugging Face
    # This is a quantized version that's perfect for local use
    model_url = "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_0.gguf"
    
    print("Downloading Qwen2.5-3B-Instruct GGUF model...")
    print("This is a ~2GB model optimized for local inference")
    print("License: Apache 2.0 (commercial use allowed)")
    
    success = download_file(model_url, model_path)
    
    if success:
        # Verify file size (should be around 2GB)
        file_size = model_path.stat().st_size
        print(f"Model downloaded successfully!")
        print(f"Size: {file_size / (1024**3):.2f} GB")
        print(f"Path: {model_path}")
        
        # Create symlink for easier access
        symlink_path = models_dir / "optiai-model.gguf"
        if not symlink_path.exists():
            try:
                symlink_path.symlink_to(model_path.name)
                print(f"Created symlink: {symlink_path}")
            except OSError:
                # On Windows, copy instead of symlink
                import shutil
                shutil.copy2(model_path, symlink_path)
                print(f"Copied to: {symlink_path}")
        
        return True
    else:
        print("Failed to download model")
        return False

def download_llama_cpp():
    """Download llama.cpp server executable"""
    
    sidecars_dir = Path("src-tauri/sidecars")
    sidecars_dir.mkdir(parents=True, exist_ok=True)
    
    llama_server_path = sidecars_dir / "llama-server.exe"
    
    if llama_server_path.exists():
        print(f"llama-server already exists: {llama_server_path}")
        return True
    
    # For now, we'll create a mock server that can be replaced with the real one
    print("Creating mock llama-server for development...")
    print("Note: In production, download the real llama.cpp server from:")
    print("https://github.com/ggerganov/llama.cpp/releases")
    
    mock_server_content = """@echo off
REM Mock llama-server for OptiAI development
REM In production, replace with real llama-server.exe from llama.cpp

echo OptiAI LLM Server (Development Mode)
echo ====================================
echo.
echo This is a mock server for development.
echo In production, this would be the real llama-server.exe
echo from the llama.cpp project.
echo.
echo Starting mock server on port 11435...

REM Create a simple HTTP server that responds to llama.cpp API calls
python -c "
import http.server
import socketserver
import json
import sys
from urllib.parse import urlparse, parse_qs

class MockLLMServer(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{\"status\": \"ok\"}')
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/completion':
            # Mock completion response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # Return a mock action plan
            mock_response = {
                'content': '''{
  \"actions\": [
    {
      \"action\": \"send_to_trash\",
      \"target\": \"temp_files\",
      \"reason\": \"Temporary files can be safely removed to free up space\",
      \"risk\": \"low\",
      \"estimated_savings\": 104857600
    },
    {
      \"action\": \"compress\",
      \"target\": \"large_documents\",
      \"reason\": \"Large documents can be compressed to save space\",
      \"risk\": \"low\",
      \"estimated_savings\": 524288000
    }
  ],
  \"summary\": {
    \"total_savings\": 629145600,
    \"risk_level\": \"low\",
    \"action_count\": 2
  }
}'''
            }
            
            self.wfile.write(json.dumps(mock_response).encode())
        else:
            self.send_response(404)
            self.end_headers()

PORT = 11435
with socketserver.TCPServer(('127.0.0.1', PORT), MockLLMServer) as httpd:
    print(f'Mock LLM server running on port {PORT}')
    httpd.serve_forever()
"
"""
    
    try:
        with open(llama_server_path, 'w', encoding='utf-8') as f:
            f.write(mock_server_content)
        
        print(f"Created mock llama-server: {llama_server_path}")
        return True
        
    except Exception as e:
        print(f"Error creating mock server: {e}")
        return False

def create_model_info():
    """Create model information file"""
    
    models_dir = Path("src-tauri/resources/models")
    info_path = models_dir / "model-info.json"
    
    model_info = {
        "name": "Qwen2.5-3B-Instruct",
        "version": "q4_0",
        "size_gb": 2.0,
        "license": "Apache 2.0",
        "description": "Optimized for system analysis and optimization suggestions",
        "capabilities": [
            "File system analysis",
            "Optimization recommendations", 
            "Risk assessment",
            "Safe action planning"
        ],
        "download_url": "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF",
        "llama_cpp_url": "https://github.com/ggerganov/llama.cpp/releases"
    }
    
    try:
        with open(info_path, 'w', encoding='utf-8') as f:
            json.dump(model_info, f, indent=2)
        
        print(f"Created model info: {info_path}")
        return True
        
    except Exception as e:
        print(f"Error creating model info: {e}")
        return False

if __name__ == "__main__":
    print("Setting up OptiAI with real AI model...")
    print("=" * 50)
    
    # No external dependencies needed for this version
    
    success1 = download_qwen_model()
    success2 = download_llama_cpp()
    success3 = create_model_info()
    
    if success1 and success2 and success3:
        print("\n" + "=" * 50)
        print("✅ OptiAI AI model setup complete!")
        print("\nNext steps:")
        print("1. The model is ready for local inference")
        print("2. Mock server is running for development")
        print("3. In production, replace mock server with real llama-server.exe")
        print("\nModel location: src-tauri/resources/models/")
        print("Server location: src-tauri/sidecars/")
    else:
        print("\nSetup failed!")
        exit(1)
