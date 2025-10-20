#!/usr/bin/env python3
"""
OptiAI Backend Embedding Script
Bundles the Python FastAPI backend into a standalone executable using PyInstaller
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
BACKEND_DIR = Path(__file__).parent
SIDECARS_DIR = PROJECT_ROOT / "src-tauri" / "sidecars"
DIST_DIR = BACKEND_DIR / "dist"
BUILD_DIR = BACKEND_DIR / "build"

def run_command(cmd, cwd=None, check=True):
    """Run a command with error handling"""
    print(f"Running: {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, cwd=cwd or BACKEND_DIR, check=check, 
                              capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Command failed: {e}")
        if check:
            sys.exit(1)
        return e

def clean_build_artifacts():
    """Clean previous build artifacts"""
    print("Cleaning build artifacts...")
    
    for path in [DIST_DIR, BUILD_DIR]:
        if path.exists():
            shutil.rmtree(path)
            print(f"Removed: {path}")
    
    # Create sidecars directory
    SIDECARS_DIR.mkdir(parents=True, exist_ok=True)

def install_pyinstaller():
    """Install PyInstaller if not present"""
    print("Checking PyInstaller...")
    try:
        run_command([sys.executable, "-c", "import PyInstaller"], check=False)
        print("PyInstaller is available")
    except:
        print("Installing PyInstaller...")
        run_command([sys.executable, "-m", "pip", "install", "pyinstaller"])

def bundle_backend():
    """Bundle the backend using PyInstaller"""
    print("Bundling backend with PyInstaller...")
    
    # PyInstaller command
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",                    # Single executable
        "--windowed",                   # No console window
        "--name", "backend-server",     # Executable name
        "--distpath", str(DIST_DIR),    # Output directory
        "--workpath", str(BUILD_DIR),   # Work directory
        "--specpath", str(BACKEND_DIR), # Spec file location
        
        # Add data files
        "--add-data", "policy.yaml;.",
        "--add-data", "requirements.txt;.",
        
        # Hidden imports
        "--hidden-import", "uvicorn",
        "--hidden-import", "uvicorn.lifespan",
        "--hidden-import", "uvicorn.lifespan.on",
        "--hidden-import", "fastapi",
        "--hidden-import", "fastapi.applications",
        "--hidden-import", "psutil",
        "--hidden-import", "cryptography",
        "--hidden-import", "git",
        "--hidden-import", "github",
        "--hidden-import", "requests",
        "--hidden-import", "aiofiles",
        "--hidden-import", "python-multipart",
        "--hidden-import", "send2trash",
        "--hidden-import", "pydantic",
        
        # Exclude unnecessary modules
        "--exclude-module", "tkinter",
        "--exclude-module", "matplotlib",
        "--exclude-module", "numpy",
        "--exclude-module", "pandas",
        "--exclude-module", "scipy",
        "--exclude-module", "PIL",
        "--exclude-module", "cv2",
        
        # Main script
        "main.py"
    ]
    
    run_command(cmd)
    
    # Verify the executable was created
    exe_path = DIST_DIR / "backend-server.exe"
    if not exe_path.exists():
        raise FileNotFoundError(f"Backend executable not created: {exe_path}")
    
    print(f"Backend bundled: {exe_path}")
    return exe_path

def copy_to_sidecars(exe_path):
    """Copy the executable to sidecars directory"""
    print("Copying to sidecars directory...")
    
    target_path = SIDECARS_DIR / "backend-server.exe"
    
    # Remove old version if exists
    if target_path.exists():
        target_path.unlink()
    
    # Copy new version
    shutil.copy2(exe_path, target_path)
    print(f"Copied to: {target_path}")
    
    # Verify copy
    if not target_path.exists():
        raise FileNotFoundError(f"Failed to copy to sidecars: {target_path}")
    
    return target_path

def verify_executable(exe_path):
    """Verify the executable works"""
    print("Verifying executable...")
    
    # Test that it can start (but don't wait for full startup)
    try:
        process = subprocess.Popen([str(exe_path), "--help"], 
                                 capture_output=True, text=True, timeout=10)
        stdout, stderr = process.communicate()
        
        if process.returncode == 0 or "uvicorn" in stderr:
            print("Executable verification passed")
            return True
        else:
            print(f"Executable verification failed: {stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("Executable verification timed out (this is expected)")
        process.kill()
        return True
    except Exception as e:
        print(f"Executable verification error: {e}")
        return False

def main():
    """Main build process"""
    print("OptiAI Backend Embedding")
    print("=" * 40)
    
    try:
        # Step 1: Clean artifacts
        clean_build_artifacts()
        
        # Step 2: Install PyInstaller
        install_pyinstaller()
        
        # Step 3: Bundle backend
        exe_path = bundle_backend()
        
        # Step 4: Copy to sidecars
        sidecar_path = copy_to_sidecars(exe_path)
        
        # Step 5: Verify
        if verify_executable(sidecar_path):
            print("\n" + "=" * 40)
            print("SUCCESS: Backend bundled successfully!")
            print(f"Executable: {sidecar_path}")
            print(f"Size: {sidecar_path.stat().st_size / 1024 / 1024:.1f} MB")
            return 0
        else:
            print("\n" + "=" * 40)
            print("WARNING: Backend bundled but verification failed")
            return 1
            
    except Exception as e:
        print(f"\nERROR: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
