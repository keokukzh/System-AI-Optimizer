#!/usr/bin/env python3
"""
OptiAI Production Build Script
Orchestrates the complete production build process including:
- Backend Python bundling
- LLM model download and setup
- llama.cpp server build
- Frontend build optimization
- Tauri build with all sidecars
"""

import os
import sys
import subprocess
import shutil
import json
import time
from pathlib import Path
from datetime import datetime

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
SIDECARS_DIR = PROJECT_ROOT / "src-tauri" / "sidecars"
DIST_DIR = PROJECT_ROOT / "dist"
BUILD_LOG = PROJECT_ROOT / "build.log"

class ProductionBuilder:
    def __init__(self):
        self.start_time = datetime.now()
        self.errors = []
        self.warnings = []
        
    def log(self, message, level="INFO"):
        """Log a message with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {level}: {message}"
        print(log_entry)
        
        # Also write to build log
        with open(BUILD_LOG, "a", encoding="utf-8") as f:
            f.write(log_entry + "\n")
    
    def run_command(self, cmd, cwd=None, check=True, description=""):
        """Run a command with logging"""
        if description:
            self.log(f"Starting: {description}")
        
        self.log(f"Running: {' '.join(cmd)}")
        
        try:
            result = subprocess.run(
                cmd, 
                cwd=cwd or PROJECT_ROOT, 
                check=check, 
                capture_output=True, 
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.stdout:
                self.log(f"Output: {result.stdout.strip()}")
            
            if description:
                self.log(f"Completed: {description}")
            
            return result
            
        except subprocess.TimeoutExpired:
            error_msg = f"Command timed out: {' '.join(cmd)}"
            self.log(error_msg, "ERROR")
            self.errors.append(error_msg)
            if check:
                raise
            return None
            
        except subprocess.CalledProcessError as e:
            error_msg = f"Command failed: {' '.join(cmd)} - {e.stderr}"
            self.log(error_msg, "ERROR")
            self.errors.append(error_msg)
            if check:
                raise
            return e
            
        except FileNotFoundError as e:
            error_msg = f"Command not found: {e}"
            self.log(error_msg, "ERROR")
            self.errors.append(error_msg)
            if check:
                raise
            return None
    
    def check_prerequisites(self):
        """Check if all required tools are available"""
        self.log("Checking build prerequisites...")
        
        required_tools = [
            ("python", "Python interpreter"),
            ("pip", "Python package manager"),
            ("node", "Node.js runtime"),
            ("npm", "Node package manager"),
            ("git", "Git version control"),
            ("cargo", "Rust toolchain"),
        ]
        
        missing_tools = []
        
        for tool, description in required_tools:
            try:
                self.run_command([tool, "--version"], check=False)
                self.log(f"✓ {description} is available")
            except (subprocess.CalledProcessError, FileNotFoundError):
                missing_tools.append(tool)
                self.log(f"✗ {description} is missing", "WARNING")
        
        if missing_tools:
            self.log(f"Missing tools: {', '.join(missing_tools)}", "ERROR")
            self.log("Please install the missing tools before running the build", "ERROR")
            return False
        
        return True
    
    def clean_build_artifacts(self):
        """Clean previous build artifacts"""
        self.log("Cleaning build artifacts...")
        
        artifacts_to_clean = [
            DIST_DIR,
            PROJECT_ROOT / "src-tauri" / "target",
            PROJECT_ROOT / "node_modules" / ".vite",
            BACKEND_DIR / "__pycache__",
            PROJECT_ROOT / "build",
            BUILD_LOG
        ]
        
        for artifact in artifacts_to_clean:
            if artifact.exists():
                if artifact.is_dir():
                    shutil.rmtree(artifact)
                    self.log(f"Removed directory: {artifact}")
                else:
                    artifact.unlink()
                    self.log(f"Removed file: {artifact}")
        
        # Create fresh directories
        SIDECARS_DIR.mkdir(parents=True, exist_ok=True)
        DIST_DIR.mkdir(parents=True, exist_ok=True)
        
        self.log("✓ Build artifacts cleaned")
    
    def install_dependencies(self):
        """Install all project dependencies"""
        self.log("Installing dependencies...")
        
        # Install Python dependencies
        self.run_command(
            ["pip", "install", "-r", "requirements.txt"],
            cwd=BACKEND_DIR,
            description="Installing Python dependencies"
        )
        
        # Install Node.js dependencies
        self.run_command(
            ["npm", "install"],
            description="Installing Node.js dependencies"
        )
        
        # Install Tauri CLI if not present
        try:
            self.run_command(["npm", "list", "@tauri-apps/cli"], check=False)
        except subprocess.CalledProcessError:
            self.run_command(
                ["npm", "install", "-g", "@tauri-apps/cli"],
                description="Installing Tauri CLI globally"
            )
        
        self.log("✓ Dependencies installed")
    
    def build_backend(self):
        """Build and bundle the Python backend"""
        self.log("Building Python backend...")
        
        # Run PyInstaller to bundle the backend
        self.run_command(
            ["python", "embed_python.py"],
            cwd=BACKEND_DIR,
            description="Bundling Python backend with PyInstaller"
        )
        
        # Verify the backend executable was created
        backend_exe = SIDECARS_DIR / "backend-server.exe"
        if not backend_exe.exists():
            raise FileNotFoundError(f"Backend executable not found: {backend_exe}")
        
        self.log(f"✓ Backend bundled: {backend_exe}")
    
    def setup_llm_model(self):
        """Download and setup the LLM model"""
        self.log("Setting up LLM model...")
        
        # Download and quantize the model
        self.run_command(
            ["python", "download_production_model.py"],
            cwd=SCRIPTS_DIR,
            description="Downloading and quantizing LLM model"
        )
        
        # Verify model files
        model_dir = PROJECT_ROOT / "src-tauri" / "resources" / "models"
        if not model_dir.exists():
            raise FileNotFoundError(f"Model directory not found: {model_dir}")
        
        self.log("✓ LLM model setup completed")
    
    def build_llama_server(self):
        """Build the llama.cpp server"""
        self.log("Building llama.cpp server...")
        
        # Build the llama.cpp server
        self.run_command(
            ["python", "build_llama_server.py"],
            cwd=SCRIPTS_DIR,
            description="Building llama.cpp server"
        )
        
        # Verify the server executable was created
        server_exe = SIDECARS_DIR / "llama-server.exe"
        if not server_exe.exists():
            raise FileNotFoundError(f"LLM server executable not found: {server_exe}")
        
        self.log(f"✓ LLM server built: {server_exe}")
    
    def build_frontend(self):
        """Build the frontend with optimizations"""
        self.log("Building frontend...")
        
        # Build the frontend
        self.run_command(
            ["npm", "run", "build"],
            description="Building frontend with Vite"
        )
        
        # Verify build output
        if not (PROJECT_ROOT / "dist").exists():
            raise FileNotFoundError("Frontend build output not found")
        
        self.log("✓ Frontend built")
    
    def build_tauri_app(self):
        """Build the Tauri desktop application"""
        self.log("Building Tauri application...")
        
        # Build the Tauri app
        self.run_command(
            ["npm", "run", "tauri:build"],
            description="Building Tauri desktop application"
        )
        
        # Verify build output
        tauri_build_dir = PROJECT_ROOT / "src-tauri" / "target" / "release" / "bundle"
        if not tauri_build_dir.exists():
            raise FileNotFoundError("Tauri build output not found")
        
        self.log("✓ Tauri application built")
    
    def copy_release_artifacts(self):
        """Copy release artifacts to dist directory"""
        self.log("Copying release artifacts...")
        
        tauri_build_dir = PROJECT_ROOT / "src-tauri" / "target" / "release" / "bundle"
        
        if tauri_build_dir.exists():
            # Copy all bundle files to dist
            for item in tauri_build_dir.iterdir():
                if item.is_file():
                    shutil.copy2(item, DIST_DIR)
                    self.log(f"Copied: {item.name}")
                elif item.is_dir():
                    dest_dir = DIST_DIR / item.name
                    if dest_dir.exists():
                        shutil.rmtree(dest_dir)
                    shutil.copytree(item, dest_dir)
                    self.log(f"Copied directory: {item.name}")
        
        self.log("✓ Release artifacts copied")
    
    def create_checksums(self):
        """Create checksums for release artifacts"""
        self.log("Creating checksums...")
        
        import hashlib
        
        checksums = {}
        
        for file_path in DIST_DIR.iterdir():
            if file_path.is_file():
                with open(file_path, "rb") as f:
                    sha256_hash = hashlib.sha256()
                    for chunk in iter(lambda: f.read(4096), b""):
                        sha256_hash.update(chunk)
                    checksums[file_path.name] = sha256_hash.hexdigest()
        
        # Write checksums file
        checksums_file = DIST_DIR / "checksums.txt"
        with open(checksums_file, "w") as f:
            for filename, checksum in checksums.items():
                f.write(f"{checksum}  {filename}\n")
        
        self.log(f"✓ Checksums created: {checksums_file}")
    
    def generate_build_report(self):
        """Generate a build report"""
        self.log("Generating build report...")
        
        end_time = datetime.now()
        duration = end_time - self.start_time
        
        report = {
            "build_info": {
                "start_time": self.start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration_seconds": duration.total_seconds(),
                "project_root": str(PROJECT_ROOT)
            },
            "artifacts": [],
            "errors": self.errors,
            "warnings": self.warnings,
            "success": len(self.errors) == 0
        }
        
        # List artifacts
        for file_path in DIST_DIR.iterdir():
            if file_path.is_file():
                report["artifacts"].append({
                    "name": file_path.name,
                    "size_bytes": file_path.stat().st_size,
                    "path": str(file_path)
                })
        
        # Write report
        report_file = DIST_DIR / "build_report.json"
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)
        
        self.log(f"✓ Build report generated: {report_file}")
        
        return report
    
    def run_build(self):
        """Run the complete production build"""
        self.log("Starting OptiAI production build")
        self.log("=" * 60)
        
        try:
            # Check prerequisites
            if not self.check_prerequisites():
                return False
            
            # Clean build artifacts
            self.clean_build_artifacts()
            
            # Install dependencies
            self.install_dependencies()
            
            # Build backend
            self.build_backend()
            
            # Setup LLM model
            self.setup_llm_model()
            
            # Build llama server
            self.build_llama_server()
            
            # Build frontend
            self.build_frontend()
            
            # Build Tauri app
            self.build_tauri_app()
            
            # Copy release artifacts
            self.copy_release_artifacts()
            
            # Create checksums
            self.create_checksums()
            
            # Generate build report
            report = self.generate_build_report()
            
            self.log("=" * 60)
            if report["success"]:
                self.log("✓ Production build completed successfully!")
                self.log(f"✓ Build duration: {report['build_info']['duration_seconds']:.1f} seconds")
                self.log(f"✓ Artifacts: {len(report['artifacts'])} files")
                self.log(f"✓ Output directory: {DIST_DIR}")
            else:
                self.log("✗ Production build completed with errors", "ERROR")
                for error in self.errors:
                    self.log(f"  - {error}", "ERROR")
            
            return report["success"]
            
        except KeyboardInterrupt:
            self.log("Build interrupted by user", "ERROR")
            return False
        except Exception as e:
            self.log(f"Build failed: {e}", "ERROR")
            self.errors.append(str(e))
            return False

def main():
    """Main entry point"""
    builder = ProductionBuilder()
    success = builder.run_build()
    
    if success:
        print("\n🎉 OptiAI production build completed successfully!")
        print(f"📦 Release artifacts are in: {DIST_DIR}")
        print("🚀 Ready for distribution!")
        sys.exit(0)
    else:
        print("\n❌ OptiAI production build failed!")
        print("📋 Check build.log for details")
        sys.exit(1)

if __name__ == "__main__":
    main()
