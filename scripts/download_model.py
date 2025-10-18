#!/usr/bin/env python3
"""
Download and prepare the local AI model for OptiAI
Downloads a small, license-compliant model for offline use
"""

import os
import requests
import hashlib
from pathlib import Path
import tempfile
import zipfile

def download_model():
    """Download a small AI model for OptiAI"""
    
    # For demo purposes, we'll create a placeholder model file
    # In production, this would download a real GGUF model like Qwen2.5-3B-Instruct
    
    models_dir = Path("src-tauri/resources/models")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = models_dir / "optiai-model.gguf"
    
    if model_path.exists():
        print(f"Model already exists: {model_path}")
        return True
    
    print("Creating placeholder model file...")
    print("Note: In production, this would download a real GGUF model")
    
    # Create a placeholder file with model metadata
    placeholder_content = """# OptiAI Model Placeholder
# This is a placeholder for the actual GGUF model
# In production, this would be replaced with:
# - Qwen2.5-3B-Instruct (recommended)
# - Mistral-7B-Instruct (alternative)
# - Or another license-compliant model

Model: Qwen2.5-3B-Instruct
Size: ~2GB (quantized)
License: Apache 2.0
Format: GGUF
Quantization: Q4_0

This file serves as a placeholder for the actual model.
The real model would be downloaded from:
https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF

For now, the system will use rule-based fallback.
"""
    
    try:
        with open(model_path, 'w', encoding='utf-8') as f:
            f.write(placeholder_content)
        
        print(f"Created placeholder model: {model_path}")
        print("Size:", model_path.stat().st_size, "bytes")
        
        return True
        
    except Exception as e:
        print(f"Error creating model file: {e}")
        return False

def download_llama_server():
    """Download llama-server executable"""
    
    sidecars_dir = Path("src-tauri/sidecars")
    sidecars_dir.mkdir(parents=True, exist_ok=True)
    
    llama_server_path = sidecars_dir / "llama-server.exe"
    
    if llama_server_path.exists():
        print(f"llama-server already exists: {llama_server_path}")
        return True
    
    print("Creating placeholder llama-server...")
    print("Note: In production, this would download the real llama.cpp server")
    
    # Create a placeholder executable
    placeholder_content = """@echo off
echo OptiAI LLM Server (Placeholder)
echo.
echo In production, this would be the real llama-server.exe
echo from llama.cpp project.
echo.
echo For now, starting mock server on port 11435...
echo Mock server will respond with rule-based fallback.
echo.
python -m http.server 11435 --bind 127.0.0.1
"""
    
    try:
        with open(llama_server_path, 'w', encoding='utf-8') as f:
            f.write(placeholder_content)
        
        print(f"Created placeholder llama-server: {llama_server_path}")
        
        return True
        
    except Exception as e:
        print(f"Error creating llama-server: {e}")
        return False

if __name__ == "__main__":
    print("Setting up OptiAI local AI model...")
    
    success1 = download_model()
    success2 = download_llama_server()
    
    if success1 and success2:
        print("\nSetup complete!")
        print("Note: These are placeholder files for development.")
        print("In production, replace with actual GGUF model and llama-server.exe")
    else:
        print("\nSetup failed!")
        exit(1)
