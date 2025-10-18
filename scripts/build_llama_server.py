#!/usr/bin/env python3
"""
Build llama.cpp server for Windows
Downloads and compiles llama.cpp server executable for OptiAI
"""

import os
import sys
import subprocess
import shutil
import requests
import zipfile
from pathlib import Path

# Configuration
LLAMA_CPP_REPO = "https://github.com/ggerganov/llama.cpp"
LLAMA_CPP_VERSION = "master"  # or specific tag like "v2.8.0"
SIDECARS_DIR = Path("src-tauri/sidecars")
BUILD_DIR = Path("build/llama.cpp")
TARGET_EXE = "llama-server.exe"

def run_command(cmd, cwd=None, check=True):
    """Run a command and return the result"""
    print(f"Running: {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, cwd=cwd, check=check, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Command failed: {e}")
        if e.stderr:
            print(f"Error: {e.stderr}")
        if check:
            sys.exit(1)
        return e

def check_dependencies():
    """Check if required build tools are available"""
    print("Checking build dependencies...")
    
    # Check for Git
    try:
        run_command(["git", "--version"], check=True)
        print("✓ Git is available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ Git is not available. Please install Git.")
        sys.exit(1)
    
    # Check for CMake
    try:
        run_command(["cmake", "--version"], check=True)
        print("✓ CMake is available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ CMake is not available. Please install CMake.")
        sys.exit(1)
    
    # Check for Visual Studio Build Tools or MSVC
    try:
        run_command(["cl"], check=False)
        print("✓ MSVC compiler is available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ MSVC compiler not found. Please install Visual Studio Build Tools.")
        print("  Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022")
        sys.exit(1)

def download_llama_cpp():
    """Download llama.cpp repository"""
    print("Downloading llama.cpp repository...")
    
    if BUILD_DIR.exists():
        print(f"Build directory {BUILD_DIR} already exists. Removing...")
        shutil.rmtree(BUILD_DIR)
    
    BUILD_DIR.parent.mkdir(parents=True, exist_ok=True)
    
    # Clone the repository
    run_command([
        "git", "clone", 
        "--depth", "1",
        "--branch", LLAMA_CPP_VERSION,
        LLAMA_CPP_REPO,
        str(BUILD_DIR)
    ], check=True)
    
    print(f"✓ Downloaded llama.cpp to {BUILD_DIR}")

def build_llama_server():
    """Build llama.cpp server for Windows"""
    print("Building llama.cpp server...")
    
    # Create build directory
    build_subdir = BUILD_DIR / "build"
    build_subdir.mkdir(exist_ok=True)
    
    # Configure with CMake
    print("Configuring with CMake...")
    run_command([
        "cmake", 
        "-B", str(build_subdir),
        "-S", str(BUILD_DIR),
        "-DCMAKE_BUILD_TYPE=Release",
        "-DLLAMA_NATIVE=OFF",  # Disable native optimizations for compatibility
        "-DLLAMA_AVX=ON",      # Enable AVX if available
        "-DLLAMA_AVX2=ON",     # Enable AVX2 if available
        "-DLLAMA_FMA=ON",      # Enable FMA if available
        "-DLLAMA_F16C=ON",     # Enable F16C if available
        "-DLLAMA_SERVER=ON",   # Build the server
        "-DLLAMA_BUILD_TESTS=OFF",  # Skip tests
        "-DLLAMA_BUILD_EXAMPLES=OFF"  # Skip examples
    ], cwd=BUILD_DIR, check=True)
    
    # Build the project
    print("Building with MSBuild...")
    run_command([
        "cmake", "--build", str(build_subdir), "--config", "Release"
    ], cwd=BUILD_DIR, check=True)
    
    print("✓ Build completed")

def copy_executable():
    """Copy the built executable to sidecars directory"""
    print("Copying executable to sidecars directory...")
    
    # Find the built executable
    build_subdir = BUILD_DIR / "build" / "bin" / "Release"
    if not build_subdir.exists():
        build_subdir = BUILD_DIR / "build" / "Release"
    
    source_exe = build_subdir / "llama-server.exe"
    if not source_exe.exists():
        # Try alternative locations
        for alt_path in [
            BUILD_DIR / "build" / "bin" / "llama-server.exe",
            BUILD_DIR / "build" / "llama-server.exe",
            BUILD_DIR / "llama-server.exe"
        ]:
            if alt_path.exists():
                source_exe = alt_path
                break
        else:
            print(f"✗ Could not find llama-server.exe in build directory")
            print(f"  Searched in: {build_subdir}")
            sys.exit(1)
    
    # Ensure sidecars directory exists
    SIDECARS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Copy the executable
    target_path = SIDECARS_DIR / TARGET_EXE
    shutil.copy2(source_exe, target_path)
    
    print(f"✓ Copied {source_exe} to {target_path}")
    
    # Verify the executable
    if target_path.exists():
        size = target_path.stat().st_size
        print(f"✓ Executable size: {size:,} bytes")
    else:
        print("✗ Failed to copy executable")
        sys.exit(1)

def create_llama_config():
    """Create a configuration file for llama.cpp server"""
    config_content = """# llama.cpp Server Configuration for OptiAI
# This file contains default settings for the llama.cpp server

# Server settings
port = 11435
host = "127.0.0.1"

# Model settings
context_size = 2048
threads = 4
batch_size = 512

# Generation settings
temperature = 0.7
top_p = 0.9
top_k = 40
repeat_penalty = 1.1

# Performance settings
use_mmap = true
use_mlock = false
numa = false

# Logging
log_level = "warning"
"""
    
    config_path = SIDECARS_DIR / "llama-server.conf"
    with open(config_path, "w") as f:
        f.write(config_content)
    
    print(f"✓ Created configuration file: {config_path}")

def cleanup():
    """Clean up build artifacts"""
    print("Cleaning up build artifacts...")
    
    if BUILD_DIR.exists():
        shutil.rmtree(BUILD_DIR)
        print(f"✓ Removed build directory: {BUILD_DIR}")

def main():
    """Main build process"""
    print("Building llama.cpp server for OptiAI")
    print("=" * 50)
    
    try:
        # Check dependencies
        check_dependencies()
        
        # Download and build
        download_llama_cpp()
        build_llama_server()
        copy_executable()
        create_llama_config()
        
        print("\n" + "=" * 50)
        print("✓ llama.cpp server build completed successfully!")
        print(f"✓ Executable: {SIDECARS_DIR / TARGET_EXE}")
        print(f"✓ Config: {SIDECARS_DIR / 'llama-server.conf'}")
        print("\nNext steps:")
        print("1. Download a quantized model using scripts/download_production_model.py")
        print("2. Test the server with: python backend/ai/local_llm.py")
        
    except KeyboardInterrupt:
        print("\nBuild interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nBuild failed: {e}")
        sys.exit(1)
    finally:
        # Always cleanup
        cleanup()

if __name__ == "__main__":
    main()
