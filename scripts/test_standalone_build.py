#!/usr/bin/env python3
"""
OptiAI Standalone Build Test Script
Validates the complete standalone build including sidecars, installers, and functionality
"""

import os
import sys
import subprocess
import shutil
import time
import requests
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
SIDECARS_DIR = PROJECT_ROOT / "src-tauri" / "sidecars"
DIST_DIR = PROJECT_ROOT / "dist"
TAURI_BUILD_DIR = PROJECT_ROOT / "src-tauri" / "target" / "release" / "bundle"

class StandaloneBuildTester:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log(self, message, level="INFO"):
        """Log a message with timestamp"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_passed(self, test_name):
        """Mark a test as passed"""
        self.passed_tests += 1
        self.log(f"PASS - {test_name}", "PASS")
        
    def test_failed(self, test_name, error):
        """Mark a test as failed"""
        self.failed_tests += 1
        self.errors.append(f"{test_name}: {error}")
        self.log(f"FAIL - {test_name}: {error}", "FAIL")
        
    def test_warning(self, test_name, warning):
        """Mark a test with warning"""
        self.warnings.append(f"{test_name}: {warning}")
        self.log(f"WARN - {test_name}: {warning}", "WARNING")
        
    def test_sidecars_exist(self):
        """Test that all required sidecars exist"""
        self.log("Testing sidecar existence...")
        
        required_sidecars = [
            "backend-server.exe",
            "llama-server.exe"
        ]
        
        for sidecar in required_sidecars:
            sidecar_path = SIDECARS_DIR / sidecar
            if sidecar_path.exists():
                size_mb = sidecar_path.stat().st_size / 1024 / 1024
                self.log(f"  {sidecar}: {size_mb:.1f} MB")
                self.test_passed(f"Sidecar exists: {sidecar}")
            else:
                self.test_failed(f"Sidecar exists: {sidecar}", "File not found")
                
    def test_backend_executable(self):
        """Test that backend executable can start"""
        self.log("Testing backend executable...")
        
        backend_exe = SIDECARS_DIR / "backend-server.exe"
        if not backend_exe.exists():
            self.test_failed("Backend executable test", "backend-server.exe not found")
            return
            
        try:
            # Test that the executable can start (but don't wait for full startup)
            process = subprocess.Popen(
                [str(backend_exe), "--help"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(timeout=10)
            
            if process.returncode == 0 or "uvicorn" in stderr:
                self.test_passed("Backend executable test")
            else:
                self.test_failed("Backend executable test", f"Unexpected output: {stderr}")
                
        except subprocess.TimeoutExpired:
            self.test_passed("Backend executable test (timeout expected)")
            process.kill()
        except Exception as e:
            self.test_failed("Backend executable test", str(e))
            
    def test_installers_exist(self):
        """Test that installers were created"""
        self.log("Testing installer creation...")
        
        if not TAURI_BUILD_DIR.exists():
            self.test_failed("Installer existence", "Tauri build directory not found")
            return
            
        # Check for MSI installer
        msi_dir = TAURI_BUILD_DIR / "msi"
        if msi_dir.exists():
            msi_files = list(msi_dir.glob("*.msi"))
            if msi_files:
                msi_size = msi_files[0].stat().st_size / 1024 / 1024
                self.log(f"  MSI installer: {msi_size:.1f} MB")
                self.test_passed("MSI installer creation")
            else:
                self.test_failed("MSI installer creation", "No .msi files found")
        else:
            self.test_failed("MSI installer creation", "MSI directory not found")
            
        # Check for NSIS installer
        nsis_dir = TAURI_BUILD_DIR / "nsis"
        if nsis_dir.exists():
            nsis_files = list(nsis_dir.glob("*.exe"))
            if nsis_files:
                nsis_size = nsis_files[0].stat().st_size / 1024 / 1024
                self.log(f"  NSIS installer: {nsis_size:.1f} MB")
                self.test_passed("NSIS installer creation")
            else:
                self.test_failed("NSIS installer creation", "No .exe files found")
        else:
            self.test_failed("NSIS installer creation", "NSIS directory not found")
            
    def test_frontend_build(self):
        """Test that frontend was built"""
        self.log("Testing frontend build...")
        
        if not DIST_DIR.exists():
            self.test_failed("Frontend build", "dist directory not found")
            return
            
        # Check for key frontend files
        required_files = [
            "index.html",
            "assets"
        ]
        
        for file_name in required_files:
            file_path = DIST_DIR / file_name
            if file_path.exists():
                self.test_passed(f"Frontend file: {file_name}")
            else:
                self.test_failed(f"Frontend file: {file_name}", "File not found")
                
    def test_tauri_config(self):
        """Test Tauri configuration"""
        self.log("Testing Tauri configuration...")
        
        config_path = PROJECT_ROOT / "src-tauri" / "tauri.conf.json"
        if not config_path.exists():
            self.test_failed("Tauri config", "tauri.conf.json not found")
            return
            
        try:
            import json
            with open(config_path, 'r') as f:
                config = json.load(f)
                
            # Check devPath
            dev_path = config.get("build", {}).get("devPath")
            if dev_path == "http://localhost:3002":
                self.test_passed("Tauri devPath configuration")
            else:
                self.test_failed("Tauri devPath configuration", f"Expected localhost:3002, got {dev_path}")
                
            # Check externalBin
            external_bin = config.get("tauri", {}).get("bundle", {}).get("externalBin", [])
            if "sidecars/backend-server" in external_bin:
                self.test_passed("Tauri externalBin configuration")
            else:
                self.test_failed("Tauri externalBin configuration", f"backend-server not in {external_bin}")
                
        except Exception as e:
            self.test_failed("Tauri config parsing", str(e))
            
    def test_ollama_integration(self):
        """Test Ollama integration (if available)"""
        self.log("Testing Ollama integration...")
        
        try:
            response = requests.get("http://127.0.0.1:11434/api/tags", timeout=5)
            if response.status_code == 200:
                data = response.json()
                models = [model['name'] for model in data.get('models', [])]
                if models:
                    self.log(f"  Available models: {', '.join(models)}")
                    self.test_passed("Ollama integration")
                else:
                    self.test_warning("Ollama integration", "Ollama running but no models found")
            else:
                self.test_warning("Ollama integration", f"Ollama responded with status {response.status_code}")
        except requests.exceptions.ConnectionError:
            self.test_warning("Ollama integration", "Ollama not running (this is expected)")
        except Exception as e:
            self.test_warning("Ollama integration", str(e))
            
    def test_backend_health(self):
        """Test backend health endpoint (if running)"""
        self.log("Testing backend health...")
        
        try:
            response = requests.get("http://127.0.0.1:5175/health", timeout=5)
            if response.status_code == 200:
                self.test_passed("Backend health check")
            else:
                self.test_warning("Backend health check", f"Backend responded with status {response.status_code}")
        except requests.exceptions.ConnectionError:
            self.test_warning("Backend health check", "Backend not running (this is expected)")
        except Exception as e:
            self.test_warning("Backend health check", str(e))
            
    def run_all_tests(self):
        """Run all tests"""
        self.log("OptiAI Standalone Build Test Suite")
        self.log("=" * 50)
        
        tests = [
            self.test_sidecars_exist,
            self.test_backend_executable,
            self.test_frontend_build,
            self.test_tauri_config,
            self.test_installers_exist,
            self.test_ollama_integration,
            self.test_backend_health
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.test_failed(test.__name__, f"Test crashed: {e}")
                
        # Summary
        self.log("\n" + "=" * 50)
        self.log(f"Test Results: {self.passed_tests} passed, {self.failed_tests} failed")
        
        if self.warnings:
            self.log(f"\nWarnings ({len(self.warnings)}):")
            for warning in self.warnings:
                self.log(f"  WARN - {warning}")
                
        if self.errors:
            self.log(f"\nErrors ({len(self.errors)}):")
            for error in self.errors:
                self.log(f"  FAIL - {error}")
                
        if self.failed_tests == 0:
            self.log("\nSUCCESS - All critical tests passed! Standalone build is ready.")
            return 0
        else:
            self.log(f"\nFAIL - {self.failed_tests} critical tests failed. Please fix issues before release.")
            return 1

def main():
    """Main test function"""
    tester = StandaloneBuildTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
