#!/usr/bin/env python3
"""
OptiAI Final Production Build Script
Executes the complete production build process with validation and verification
"""

import os
import sys
import json
import subprocess
import shutil
import hashlib
import time
from pathlib import Path
from datetime import datetime

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
BUILD_DIR = PROJECT_ROOT / "dist"
TARGET_DIR = PROJECT_ROOT / "src-tauri" / "target"
RELEASE_DIR = PROJECT_ROOT / "release"
BUILD_REPORT_FILE = PROJECT_ROOT / "final_build_report.json"

class FinalProductionBuilder:
    def __init__(self):
        self.start_time = datetime.now()
        self.build_steps = []
        self.errors = []
        self.warnings = []
        self.artifacts = {}
        
    def log(self, message, level="INFO"):
        """Log a message with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def error(self, message):
        """Log an error message"""
        self.log(message, "ERROR")
        self.errors.append(message)
    
    def warning(self, message):
        """Log a warning message"""
        self.log(message, "WARNING")
        self.warnings.append(message)
    
    def run_command(self, cmd, cwd=None, description="", timeout=600):
        """Run a command with logging"""
        if description:
            self.log(f"Starting: {description}")
        
        self.log(f"Running: {' '.join(cmd)}")
        
        try:
            result = subprocess.run(
                cmd, 
                cwd=cwd or PROJECT_ROOT, 
                check=True, 
                capture_output=True, 
                text=True,
                timeout=timeout
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
            return None
            
        except subprocess.CalledProcessError as e:
            error_msg = f"Command failed: {' '.join(cmd)} - {e.stderr}"
            self.log(error_msg, "ERROR")
            self.errors.append(error_msg)
            return None
    
    def step(self, step_name, step_func):
        """Execute a build step with tracking"""
        self.log(f"=== {step_name} ===")
        step_start = datetime.now()
        
        try:
            result = step_func()
            step_duration = datetime.now() - step_start
            
            self.build_steps.append({
                "name": step_name,
                "status": "SUCCESS" if result else "FAILED",
                "duration_seconds": step_duration.total_seconds(),
                "start_time": step_start.isoformat(),
                "end_time": datetime.now().isoformat()
            })
            
            if result:
                self.log(f"✓ {step_name} completed successfully")
            else:
                self.log(f"✗ {step_name} failed", "ERROR")
            
            return result
            
        except Exception as e:
            step_duration = datetime.now() - step_start
            self.build_steps.append({
                "name": step_name,
                "status": "ERROR",
                "duration_seconds": step_duration.total_seconds(),
                "start_time": step_start.isoformat(),
                "end_time": datetime.now().isoformat(),
                "error": str(e)
            })
            
            self.log(f"✗ {step_name} failed with error: {e}", "ERROR")
            return False
    
    def pre_build_validation(self):
        """Run pre-build validation"""
        return self.run_command(
            ["python", "scripts/pre_build_check.py"],
            description="Pre-build validation"
        ) is not None
    
    def clean_build_environment(self):
        """Clean build environment"""
        self.log("Cleaning build environment...")
        
        directories_to_clean = [
            BUILD_DIR,
            TARGET_DIR,
            RELEASE_DIR,
            PROJECT_ROOT / "node_modules" / ".vite",
            PROJECT_ROOT / "src-tauri" / "target" / "release"
        ]
        
        for directory in directories_to_clean:
            if directory.exists():
                try:
                    shutil.rmtree(directory)
                    self.log(f"✓ Cleaned: {directory.relative_to(PROJECT_ROOT)}")
                except Exception as e:
                    self.error(f"Failed to clean {directory}: {e}")
                    return False
        
        return True
    
    def install_dependencies(self):
        """Install all dependencies"""
        # Install Node.js dependencies
        result = self.run_command(
            ["npm", "ci", "--production=false"],
            description="Installing Node.js dependencies"
        )
        if result is None:
            return False
        
        # Install Python dependencies
        result = self.run_command(
            ["pip", "install", "-r", "requirements.txt"],
            cwd=PROJECT_ROOT / "backend",
            description="Installing Python dependencies"
        )
        if result is None:
            return False
        
        # Update Rust dependencies
        result = self.run_command(
            ["cargo", "update"],
            cwd=PROJECT_ROOT / "src-tauri",
            description="Updating Rust dependencies"
        )
        if result is None:
            return False
        
        return True
    
    def run_tests(self):
        """Run comprehensive test suite"""
        return self.run_command(
            ["python", "scripts/run_tests.py"],
            description="Running comprehensive test suite",
            timeout=1800  # 30 minutes
        ) is not None
    
    def build_frontend(self):
        """Build optimized frontend"""
        # Set production environment
        env = os.environ.copy()
        env["NODE_ENV"] = "production"
        env["VITE_MODE"] = "production"
        
        return self.run_command(
            ["npm", "run", "build"],
            description="Building optimized frontend"
        ) is not None
    
    def build_backend(self):
        """Build Python backend"""
        return self.run_command(
            ["python", "embed_python.py"],
            cwd=PROJECT_ROOT / "backend",
            description="Building Python backend executable"
        ) is not None
    
    def build_llm_components(self):
        """Build LLM components"""
        # Download and quantize model
        result = self.run_command(
            ["python", "scripts/download_production_model.py"],
            description="Downloading and quantizing LLM model"
        )
        if result is None:
            return False
        
        # Build llama.cpp server
        result = self.run_command(
            ["python", "scripts/build_llama_server.py"],
            description="Building llama.cpp server"
        )
        if result is None:
            return False
        
        return True
    
    def build_tauri_app(self):
        """Build Tauri application"""
        return self.run_command(
            ["cargo", "tauri", "build", "--release"],
            cwd=PROJECT_ROOT / "src-tauri",
            description="Building Tauri application",
            timeout=1800  # 30 minutes
        ) is not None
    
    def build_installers(self):
        """Build Windows installers"""
        return self.run_command(
            ["python", "scripts/build_installers.py"],
            description="Building Windows installers"
        ) is not None
    
    def collect_artifacts(self):
        """Collect and analyze build artifacts"""
        self.log("Collecting build artifacts...")
        
        # Create release directory
        RELEASE_DIR.mkdir(exist_ok=True)
        
        # Collect frontend artifacts
        if BUILD_DIR.exists():
            frontend_size = sum(f.stat().st_size for f in BUILD_DIR.rglob("*") if f.is_file())
            self.artifacts["frontend"] = {
                "path": str(BUILD_DIR.relative_to(PROJECT_ROOT)),
                "size_mb": frontend_size / (1024 * 1024),
                "file_count": len(list(BUILD_DIR.rglob("*")))
            }
        
        # Collect Tauri artifacts
        tauri_build_dir = TARGET_DIR / "release" / "bundle"
        if tauri_build_dir.exists():
            self.artifacts["tauri"] = {
                "path": str(tauri_build_dir.relative_to(PROJECT_ROOT)),
                "bundles": []
            }
            
            for bundle_dir in tauri_build_dir.iterdir():
                if bundle_dir.is_dir():
                    bundle_size = sum(f.stat().st_size for f in bundle_dir.rglob("*") if f.is_file())
                    bundle_info = {
                        "name": bundle_dir.name,
                        "size_mb": bundle_size / (1024 * 1024),
                        "files": []
                    }
                    
                    # List important files
                    for file_path in bundle_dir.rglob("*"):
                        if file_path.is_file() and file_path.suffix in ['.exe', '.msi', '.dmg', '.AppImage', '.deb']:
                            bundle_info["files"].append({
                                "name": file_path.name,
                                "size_mb": file_path.stat().st_size / (1024 * 1024),
                                "path": str(file_path.relative_to(bundle_dir))
                            })
                    
                    self.artifacts["tauri"]["bundles"].append(bundle_info)
        
        # Collect backend artifacts
        backend_exe = PROJECT_ROOT / "src-tauri" / "sidecars" / "backend-server.exe"
        if backend_exe.exists():
            self.artifacts["backend"] = {
                "path": str(backend_exe.relative_to(PROJECT_ROOT)),
                "size_mb": backend_exe.stat().st_size / (1024 * 1024)
            }
        
        # Collect LLM artifacts
        llm_exe = PROJECT_ROOT / "src-tauri" / "sidecars" / "llama-server.exe"
        if llm_exe.exists():
            self.artifacts["llm"] = {
                "path": str(llm_exe.relative_to(PROJECT_ROOT)),
                "size_mb": llm_exe.stat().st_size / (1024 * 1024)
            }
        
        return True
    
    def generate_checksums(self):
        """Generate checksums for all artifacts"""
        self.log("Generating checksums...")
        
        checksums = {}
        
        # Generate checksums for important files
        important_files = [
            "src-tauri/sidecars/backend-server.exe",
            "src-tauri/sidecars/llama-server.exe",
            "src-tauri/resources/models/phi-2-q4_k_m.gguf"
        ]
        
        for file_path in important_files:
            full_path = PROJECT_ROOT / file_path
            if full_path.exists():
                try:
                    with open(full_path, 'rb') as f:
                        content = f.read()
                        sha256_hash = hashlib.sha256(content).hexdigest()
                        checksums[file_path] = {
                            "sha256": sha256_hash,
                            "size_bytes": len(content)
                        }
                except Exception as e:
                    self.error(f"Failed to generate checksum for {file_path}: {e}")
        
        # Save checksums
        checksums_file = RELEASE_DIR / "checksums.json"
        with open(checksums_file, "w") as f:
            json.dump(checksums, f, indent=2)
        
        self.log(f"✓ Checksums saved to: {checksums_file.relative_to(PROJECT_ROOT)}")
        return True
    
    def create_release_package(self):
        """Create release package"""
        self.log("Creating release package...")
        
        # Create release archive
        release_name = f"optiai-v1.0.0-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        release_archive = RELEASE_DIR / f"{release_name}.zip"
        
        try:
            import zipfile
            
            with zipfile.ZipFile(release_archive, 'w', zipfile.ZIP_DEFLATED) as zipf:
                # Add build artifacts
                if BUILD_DIR.exists():
                    for file_path in BUILD_DIR.rglob("*"):
                        if file_path.is_file():
                            arcname = f"frontend/{file_path.relative_to(BUILD_DIR)}"
                            zipf.write(file_path, arcname)
                
                # Add Tauri bundles
                tauri_build_dir = TARGET_DIR / "release" / "bundle"
                if tauri_build_dir.exists():
                    for file_path in tauri_build_dir.rglob("*"):
                        if file_path.is_file():
                            arcname = f"bundles/{file_path.relative_to(tauri_build_dir)}"
                            zipf.write(file_path, arcname)
                
                # Add documentation
                docs = ["README.md", "CHANGELOG.md", "LICENSE.txt"]
                for doc in docs:
                    doc_path = PROJECT_ROOT / doc
                    if doc_path.exists():
                        zipf.write(doc_path, f"docs/{doc}")
                
                # Add checksums
                checksums_file = RELEASE_DIR / "checksums.json"
                if checksums_file.exists():
                    zipf.write(checksums_file, "checksums.json")
            
            self.log(f"✓ Release package created: {release_archive.relative_to(PROJECT_ROOT)}")
            return True
            
        except Exception as e:
            self.error(f"Failed to create release package: {e}")
            return False
    
    def validate_build(self):
        """Validate the build"""
        self.log("Validating build...")
        
        validation_results = {
            "frontend": False,
            "backend": False,
            "tauri": False,
            "installers": False
        }
        
        # Validate frontend
        if BUILD_DIR.exists() and (BUILD_DIR / "index.html").exists():
            validation_results["frontend"] = True
            self.log("✓ Frontend build validated")
        else:
            self.error("Frontend build validation failed")
        
        # Validate backend
        backend_exe = PROJECT_ROOT / "src-tauri" / "sidecars" / "backend-server.exe"
        if backend_exe.exists():
            validation_results["backend"] = True
            self.log("✓ Backend build validated")
        else:
            self.error("Backend build validation failed")
        
        # Validate Tauri
        tauri_build_dir = TARGET_DIR / "release" / "bundle"
        if tauri_build_dir.exists():
            validation_results["tauri"] = True
            self.log("✓ Tauri build validated")
        else:
            self.error("Tauri build validation failed")
        
        # Validate installers
        installer_files = list(tauri_build_dir.rglob("*.msi")) + list(tauri_build_dir.rglob("*.exe"))
        if installer_files:
            validation_results["installers"] = True
            self.log("✓ Installers validated")
        else:
            self.warning("No installer files found")
        
        return all(validation_results.values())
    
    def generate_build_report(self):
        """Generate comprehensive build report"""
        end_time = datetime.now()
        duration = end_time - self.start_time
        
        report = {
            "build_summary": {
                "start_time": self.start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration_seconds": duration.total_seconds(),
                "total_steps": len(self.build_steps),
                "successful_steps": len([s for s in self.build_steps if s["status"] == "SUCCESS"]),
                "failed_steps": len([s for s in self.build_steps if s["status"] == "FAILED"]),
                "errors": len(self.errors),
                "warnings": len(self.warnings),
                "status": "SUCCESS" if len(self.errors) == 0 else "FAILED"
            },
            "build_steps": self.build_steps,
            "artifacts": self.artifacts,
            "errors": self.errors,
            "warnings": self.warnings,
            "environment": {
                "python_version": sys.version,
                "node_version": subprocess.run(["node", "--version"], capture_output=True, text=True).stdout.strip(),
                "npm_version": subprocess.run(["npm", "--version"], capture_output=True, text=True).stdout.strip(),
                "rust_version": subprocess.run(["rustc", "--version"], capture_output=True, text=True).stdout.strip()
            }
        }
        
        # Write report
        with open(BUILD_REPORT_FILE, "w") as f:
            json.dump(report, f, indent=2)
        
        self.log(f"Build report written to: {BUILD_REPORT_FILE.relative_to(PROJECT_ROOT)}")
        
        return report
    
    def run_final_build(self):
        """Run the complete final production build"""
        self.log("Starting OptiAI Final Production Build")
        self.log("=" * 60)
        
        try:
            # Execute build steps
            steps = [
                ("Pre-build Validation", self.pre_build_validation),
                ("Clean Build Environment", self.clean_build_environment),
                ("Install Dependencies", self.install_dependencies),
                ("Run Tests", self.run_tests),
                ("Build Frontend", self.build_frontend),
                ("Build Backend", self.build_backend),
                ("Build LLM Components", self.build_llm_components),
                ("Build Tauri App", self.build_tauri_app),
                ("Build Installers", self.build_installers),
                ("Collect Artifacts", self.collect_artifacts),
                ("Generate Checksums", self.generate_checksums),
                ("Create Release Package", self.create_release_package),
                ("Validate Build", self.validate_build)
            ]
            
            for step_name, step_func in steps:
                if not self.step(step_name, step_func):
                    self.log(f"Build failed at step: {step_name}", "ERROR")
                    break
            
            # Generate final report
            report = self.generate_build_report()
            
            self.log("=" * 60)
            if len(self.errors) == 0:
                self.log("✅ Final Production Build COMPLETED SUCCESSFULLY")
                self.log("🎉 OptiAI is ready for production deployment!")
            else:
                self.log(f"❌ Final Production Build COMPLETED WITH {len(self.errors)} ERRORS")
            
            self.log(f"📊 Build Summary:")
            self.log(f"   Total Steps: {len(self.build_steps)}")
            self.log(f"   Successful: {len([s for s in self.build_steps if s['status'] == 'SUCCESS'])}")
            self.log(f"   Failed: {len([s for s in self.build_steps if s['status'] == 'FAILED'])}")
            self.log(f"   Warnings: {len(self.warnings)}")
            self.log(f"   Duration: {duration.total_seconds():.1f}s")
            
            return len(self.errors) == 0
            
        except KeyboardInterrupt:
            self.log("Build interrupted by user", "ERROR")
            return False
        except Exception as e:
            self.log(f"Build failed: {e}", "ERROR")
            return False

def main():
    """Main entry point"""
    builder = FinalProductionBuilder()
    success = builder.run_final_build()
    
    if success:
        print("\n🎉 OptiAI Final Production Build completed successfully!")
        print("🚀 All artifacts are ready for deployment.")
        print("📦 Release package created in the 'release' directory.")
        sys.exit(0)
    else:
        print("\n❌ Final Production Build failed. Please check the errors above.")
        print("📋 Check the build report for detailed information.")
        sys.exit(1)

if __name__ == "__main__":
    main()
