#!/usr/bin/env python3
"""
Build script for OptiAI Setup Wizard and final installer package
"""

import os
import sys
import subprocess
import shutil
import json
from pathlib import Path

def run_command(cmd, cwd=None, check=True):
    """Run a command and return the result"""
    print(f"Running: {' '.join(cmd)}")
    if cwd:
        print(f"Working directory: {cwd}")
    
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    
    if result.stdout:
        print("STDOUT:", result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)
    
    if check and result.returncode != 0:
        raise RuntimeError(f"Command failed with return code {result.returncode}")
    
    return result

def prepare_icons():
    """Prepare icons from thumbnail.jpg"""
    print("🎨 Preparing icons...")
    
    # Run the icon preparation script
    script_path = Path("scripts/prepare_icons.py")
    if script_path.exists():
        run_command([sys.executable, str(script_path)])
    else:
        print("⚠️  Icon preparation script not found, skipping...")

def build_main_app():
    """Build the main OptiAI application"""
    print("🔨 Building main OptiAI application...")
    
    # Build frontend
    print("Building frontend...")
    run_command(["npm", "run", "build"])
    
    # Build Tauri app
    print("Building Tauri application...")
    run_command(["cargo", "tauri", "build"], cwd="src-tauri")

def download_ai_model():
    """Download the AI model (placeholder for now)"""
    print("🤖 Downloading AI model...")
    
    # Create models directory
    models_dir = Path("src-tauri/resources/models")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    # Create placeholder model file
    model_path = models_dir / "phi-2-q4.gguf"
    if not model_path.exists():
        print("Creating placeholder AI model...")
        with open(model_path, "w") as f:
            f.write("# Placeholder AI model file\n")
            f.write("# In production, this would be the actual Phi-2 model\n")
    
    print(f"AI model ready: {model_path}")

def build_setup_wizard():
    """Build the setup wizard"""
    print("🧙 Building setup wizard...")
    
    setup_wizard_dir = Path("installer/setup-wizard")
    
    # Install dependencies
    print("Installing setup wizard dependencies...")
    run_command(["npm", "install"], cwd=setup_wizard_dir)
    
    # Build frontend
    print("Building setup wizard frontend...")
    run_command(["npm", "run", "build"], cwd=setup_wizard_dir)
    
    # Build Tauri app
    print("Building setup wizard Tauri application...")
    run_command(["cargo", "tauri", "build"], cwd=setup_wizard_dir)

def create_installer_package():
    """Create the final installer package"""
    print("📦 Creating installer package...")
    
    # Create dist directory
    dist_dir = Path("dist")
    dist_dir.mkdir(exist_ok=True)
    
    # Copy main application
    main_app_dir = Path("src-tauri/target/release/bundle/msi")
    if main_app_dir.exists():
        print("Copying main application...")
        for item in main_app_dir.iterdir():
            if item.is_file():
                shutil.copy2(item, dist_dir)
    
    # Copy setup wizard
    setup_wizard_dir = Path("installer/setup-wizard/src-tauri/target/release/bundle/msi")
    if setup_wizard_dir.exists():
        print("Copying setup wizard...")
        for item in setup_wizard_dir.iterdir():
            if item.is_file():
                shutil.copy2(item, dist_dir)
    
    # Create installer bundle
    bundle_dir = dist_dir / "installer-bundle"
    bundle_dir.mkdir(exist_ok=True)
    
    # Copy necessary files
    files_to_copy = [
        "src-tauri/target/release/optiai.exe",
        "installer/setup-wizard/src-tauri/target/release/optiai-setup.exe",
        "src-tauri/resources/models/phi-2-q4.gguf",
        "src-tauri/resources/default_settings.json",
    ]
    
    for file_path in files_to_copy:
        src = Path(file_path)
        if src.exists():
            dst = bundle_dir / src.name
            shutil.copy2(src, dst)
            print(f"Copied: {src} -> {dst}")
    
    print(f"Installer package created in: {bundle_dir}")

def create_self_extracting_installer():
    """Create a self-extracting installer (placeholder)"""
    print("🎯 Creating self-extracting installer...")
    
    # In a real implementation, you would use tools like:
    # - 7-Zip SFX
    # - WinRAR SFX
    # - NSIS installer
    # - WiX installer
    
    print("Self-extracting installer creation would be implemented here")
    print("For now, the installer bundle is ready in dist/installer-bundle/")

def main():
    """Main build process"""
    print("🚀 Starting OptiAI installer build process...")
    
    try:
        # Change to project root
        script_dir = Path(__file__).parent
        project_root = script_dir.parent
        os.chdir(project_root)
        
        print(f"Working directory: {os.getcwd()}")
        
        # Step 1: Prepare icons
        prepare_icons()
        
        # Step 2: Build main application
        build_main_app()
        
        # Step 3: Download AI model
        download_ai_model()
        
        # Step 4: Build setup wizard
        build_setup_wizard()
        
        # Step 5: Create installer package
        create_installer_package()
        
        # Step 6: Create self-extracting installer
        create_self_extracting_installer()
        
        print("\n✅ Build process completed successfully!")
        print("\n📁 Output files:")
        print("   - Main application: src-tauri/target/release/optiai.exe")
        print("   - Setup wizard: installer/setup-wizard/src-tauri/target/release/optiai-setup.exe")
        print("   - Installer bundle: dist/installer-bundle/")
        
    except Exception as e:
        print(f"\n❌ Build failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
