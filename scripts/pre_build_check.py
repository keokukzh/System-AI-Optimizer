#!/usr/bin/env python3
"""
OptiAI Pre-Build Validation Script
Validates the project state before production build
"""

import os
import sys
import json
import subprocess
import hashlib
from pathlib import Path
from datetime import datetime

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
REQUIRED_FILES = [
    "package.json",
    "vite.config.js",
    "src-tauri/tauri.conf.json",
    "src-tauri/Cargo.toml",
    "backend/requirements.txt",
    "backend/main.py",
    "src/App.jsx",
    "src/main.jsx"
]

REQUIRED_DIRECTORIES = [
    "src",
    "src/components",
    "src/pages",
    "src/hooks",
    "src/utils",
    "backend",
    "src-tauri",
    "src-tauri/src",
    "src-tauri/icons",
    "schemas"
]

OPTIONAL_FILES = [
    "src-tauri/sidecars/llama-server.exe",
    "src-tauri/sidecars/backend-server.exe",
    "src-tauri/resources/models/phi-2-q4_k_m.gguf",
    "src-tauri/resources/models/model-config.json"
]

class PreBuildValidator:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.start_time = datetime.now()
        
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
    
    def check_required_files(self):
        """Check if all required files exist"""
        self.log("Checking required files...")
        
        for file_path in REQUIRED_FILES:
            full_path = PROJECT_ROOT / file_path
            if not full_path.exists():
                self.error(f"Required file missing: {file_path}")
            else:
                self.log(f"✓ Found: {file_path}")
    
    def check_required_directories(self):
        """Check if all required directories exist"""
        self.log("Checking required directories...")
        
        for dir_path in REQUIRED_DIRECTORIES:
            full_path = PROJECT_ROOT / dir_path
            if not full_path.exists():
                self.error(f"Required directory missing: {dir_path}")
            else:
                self.log(f"✓ Found: {dir_path}")
    
    def check_optional_files(self):
        """Check optional files and warn if missing"""
        self.log("Checking optional files...")
        
        for file_path in OPTIONAL_FILES:
            full_path = PROJECT_ROOT / file_path
            if not full_path.exists():
                self.warning(f"Optional file missing: {file_path}")
            else:
                self.log(f"✓ Found: {file_path}")
    
    def check_package_json(self):
        """Validate package.json"""
        self.log("Validating package.json...")
        
        try:
            with open(PROJECT_ROOT / "package.json", "r") as f:
                package_data = json.load(f)
            
            # Check required fields
            required_fields = ["name", "version", "scripts", "dependencies", "devDependencies"]
            for field in required_fields:
                if field not in package_data:
                    self.error(f"package.json missing required field: {field}")
            
            # Check build script
            if "build" not in package_data.get("scripts", {}):
                self.error("package.json missing 'build' script")
            
            # Check version format
            version = package_data.get("version", "")
            if not version or not version.count(".") == 2:
                self.warning(f"Version format may be invalid: {version}")
            
            self.log("✓ package.json validation passed")
            
        except json.JSONDecodeError as e:
            self.error(f"package.json is not valid JSON: {e}")
        except Exception as e:
            self.error(f"Error reading package.json: {e}")
    
    def check_tauri_config(self):
        """Validate Tauri configuration"""
        self.log("Validating Tauri configuration...")
        
        try:
            with open(PROJECT_ROOT / "src-tauri/tauri.conf.json", "r") as f:
                tauri_config = json.load(f)
            
            # Check required fields
            required_fields = ["build", "package", "tauri"]
            for field in required_fields:
                if field not in tauri_config:
                    self.error(f"tauri.conf.json missing required field: {field}")
            
            # Check build configuration
            build_config = tauri_config.get("build", {})
            if "beforeBuildCommand" not in build_config:
                self.error("tauri.conf.json missing 'beforeBuildCommand'")
            
            if "distDir" not in build_config:
                self.error("tauri.conf.json missing 'distDir'")
            
            # Check package configuration
            package_config = tauri_config.get("package", {})
            if "productName" not in package_config:
                self.error("tauri.conf.json missing 'productName'")
            
            if "version" not in package_config:
                self.error("tauri.conf.json missing 'version'")
            
            # Check bundle configuration
            bundle_config = tauri_config.get("tauri", {}).get("bundle", {})
            if "identifier" not in bundle_config:
                self.error("tauri.conf.json missing bundle 'identifier'")
            
            if "icon" not in bundle_config:
                self.error("tauri.conf.json missing bundle 'icon'")
            
            self.log("✓ Tauri configuration validation passed")
            
        except json.JSONDecodeError as e:
            self.error(f"tauri.conf.json is not valid JSON: {e}")
        except Exception as e:
            self.error(f"Error reading tauri.conf.json: {e}")
    
    def check_vite_config(self):
        """Validate Vite configuration"""
        self.log("Validating Vite configuration...")
        
        vite_config_path = PROJECT_ROOT / "vite.config.js"
        if not vite_config_path.exists():
            self.error("vite.config.js not found")
            return
        
        try:
            # Read and check for basic structure
            with open(vite_config_path, "r") as f:
                content = f.read()
            
            # Check for required exports
            if "defineConfig" not in content:
                self.warning("vite.config.js may not be using defineConfig")
            
            if "build" not in content:
                self.warning("vite.config.js may not have build configuration")
            
            if "rollupOptions" not in content:
                self.warning("vite.config.js may not have rollup optimization")
            
            self.log("✓ Vite configuration validation passed")
            
        except Exception as e:
            self.error(f"Error reading vite.config.js: {e}")
    
    def check_dependencies(self):
        """Check if dependencies are installed"""
        self.log("Checking dependencies...")
        
        # Check Node.js dependencies
        node_modules = PROJECT_ROOT / "node_modules"
        if not node_modules.exists():
            self.error("node_modules not found. Run 'npm install' first.")
        else:
            self.log("✓ Node.js dependencies found")
        
        # Check Python dependencies
        backend_venv = PROJECT_ROOT / "backend" / ".venv"
        if not backend_venv.exists():
            self.warning("Python virtual environment not found. Consider creating one.")
        else:
            self.log("✓ Python virtual environment found")
        
        # Check Rust dependencies
        cargo_lock = PROJECT_ROOT / "src-tauri" / "Cargo.lock"
        if not cargo_lock.exists():
            self.warning("Cargo.lock not found. Run 'cargo build' in src-tauri first.")
        else:
            self.log("✓ Rust dependencies found")
    
    def check_environment_variables(self):
        """Check environment configuration"""
        self.log("Checking environment configuration...")
        
        # Check for .env files
        env_files = [".env", ".env.local", ".env.production"]
        for env_file in env_files:
            env_path = PROJECT_ROOT / env_file
            if env_path.exists():
                self.log(f"✓ Found: {env_file}")
            else:
                self.warning(f"Environment file not found: {env_file}")
        
        # Check for .env.example
        env_example = PROJECT_ROOT / ".env.example"
        if env_example.exists():
            self.log("✓ Found: .env.example")
        else:
            self.warning(".env.example not found")
    
    def check_build_artifacts(self):
        """Check for existing build artifacts"""
        self.log("Checking build artifacts...")
        
        # Check for dist directory
        dist_dir = PROJECT_ROOT / "dist"
        if dist_dir.exists():
            self.warning("dist directory exists. Consider cleaning before build.")
        else:
            self.log("✓ No existing dist directory")
        
        # Check for target directory
        target_dir = PROJECT_ROOT / "src-tauri" / "target"
        if target_dir.exists():
            self.warning("Rust target directory exists. Consider cleaning before build.")
        else:
            self.log("✓ No existing Rust target directory")
    
    def check_file_sizes(self):
        """Check for unusually large files"""
        self.log("Checking file sizes...")
        
        large_files = []
        for root, dirs, files in os.walk(PROJECT_ROOT):
            # Skip node_modules and target directories
            if "node_modules" in root or "target" in root:
                continue
            
            for file in files:
                file_path = Path(root) / file
                try:
                    size = file_path.stat().st_size
                    if size > 10 * 1024 * 1024:  # 10MB
                        large_files.append((str(file_path.relative_to(PROJECT_ROOT)), size))
                except OSError:
                    continue
        
        if large_files:
            self.warning("Large files found:")
            for file_path, size in large_files:
                size_mb = size / (1024 * 1024)
                self.warning(f"  {file_path}: {size_mb:.1f}MB")
        else:
            self.log("✓ No unusually large files found")
    
    def check_security(self):
        """Basic security checks"""
        self.log("Checking security...")
        
        # Check for hardcoded secrets
        secret_patterns = [
            "password",
            "secret",
            "key",
            "token",
            "api_key"
        ]
        
        suspicious_files = []
        for root, dirs, files in os.walk(PROJECT_ROOT):
            # Skip certain directories
            if any(skip in root for skip in ["node_modules", "target", ".git", "dist"]):
                continue
            
            for file in files:
                if file.endswith(('.js', '.jsx', '.ts', '.tsx', '.py', '.json')):
                    file_path = Path(root) / file
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read().lower()
                            for pattern in secret_patterns:
                                if f'"{pattern}"' in content or f"'{pattern}'" in content:
                                    if "example" not in content and "placeholder" not in content:
                                        suspicious_files.append(str(file_path.relative_to(PROJECT_ROOT)))
                                        break
                    except (UnicodeDecodeError, OSError):
                        continue
        
        if suspicious_files:
            self.warning("Files that may contain hardcoded secrets:")
            for file_path in suspicious_files:
                self.warning(f"  {file_path}")
        else:
            self.log("✓ No obvious hardcoded secrets found")
    
    def check_licenses(self):
        """Check for license files"""
        self.log("Checking licenses...")
        
        license_files = ["LICENSE", "LICENSE.txt", "LICENSE.md"]
        found_license = False
        
        for license_file in license_files:
            license_path = PROJECT_ROOT / license_file
            if license_path.exists():
                self.log(f"✓ Found: {license_file}")
                found_license = True
                break
        
        if not found_license:
            self.warning("No license file found")
    
    def generate_report(self):
        """Generate validation report"""
        end_time = datetime.now()
        duration = end_time - self.start_time
        
        report = {
            "validation": {
                "start_time": self.start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration_seconds": duration.total_seconds(),
                "errors": len(self.errors),
                "warnings": len(self.warnings),
                "status": "PASS" if len(self.errors) == 0 else "FAIL"
            },
            "errors": self.errors,
            "warnings": self.warnings
        }
        
        # Write report
        report_file = PROJECT_ROOT / "pre_build_report.json"
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)
        
        self.log(f"Validation report written to: {report_file}")
        
        return report
    
    def run_validation(self):
        """Run all validation checks"""
        self.log("Starting OptiAI pre-build validation")
        self.log("=" * 60)
        
        try:
            self.check_required_files()
            self.check_required_directories()
            self.check_optional_files()
            self.check_package_json()
            self.check_tauri_config()
            self.check_vite_config()
            self.check_dependencies()
            self.check_environment_variables()
            self.check_build_artifacts()
            self.check_file_sizes()
            self.check_security()
            self.check_licenses()
            
            # Generate report
            report = self.generate_report()
            
            self.log("=" * 60)
            if len(self.errors) == 0:
                self.log("✅ Pre-build validation PASSED")
                if len(self.warnings) > 0:
                    self.log(f"⚠️  {len(self.warnings)} warnings found")
            else:
                self.log(f"❌ Pre-build validation FAILED with {len(self.errors)} errors")
                if len(self.warnings) > 0:
                    self.log(f"⚠️  {len(self.warnings)} warnings found")
            
            self.log(f"📊 Validation Summary:")
            self.log(f"   Errors: {len(self.errors)}")
            self.log(f"   Warnings: {len(self.warnings)}")
            self.log(f"   Duration: {duration.total_seconds():.1f}s")
            
            return len(self.errors) == 0
            
        except KeyboardInterrupt:
            self.log("Validation interrupted by user", "ERROR")
            return False
        except Exception as e:
            self.log(f"Validation failed: {e}", "ERROR")
            return False

def main():
    """Main entry point"""
    validator = PreBuildValidator()
    success = validator.run_validation()
    
    if success:
        print("\n🎉 Pre-build validation passed! Ready for production build.")
        sys.exit(0)
    else:
        print("\n❌ Pre-build validation failed. Please fix errors before building.")
        sys.exit(1)

if __name__ == "__main__":
    main()
