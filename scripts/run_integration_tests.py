#!/usr/bin/env python3
"""
Integration test runner for OptiAI
Runs comprehensive tests for the Tauri backend and setup wizard
"""

import os
import sys
import subprocess
import time
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

def test_rust_backend_compilation():
    """Test that the Rust backend compiles successfully"""
    print("Testing Rust backend compilation...")
    
    try:
        run_command(["cargo", "check"], cwd="src-tauri")
        print("SUCCESS: Rust backend compiles successfully")
        return True
    except Exception as e:
        print(f"FAILED: Rust backend compilation failed: {e}")
        return False

def test_rust_integration_tests():
    """Run Rust integration tests"""
    print("Running Rust integration tests...")
    
    try:
        run_command(["cargo", "test", "--test", "integration_tests"], cwd="src-tauri")
        print("SUCCESS: Rust integration tests passed")
        return True
    except Exception as e:
        print(f"FAILED: Rust integration tests failed: {e}")
        return False

def test_frontend_build():
    """Test that the frontend builds successfully"""
    print("Testing frontend build...")
    
    try:
        run_command(["npm", "run", "build"])
        print("SUCCESS: Frontend builds successfully")
        return True
    except Exception as e:
        print(f"FAILED: Frontend build failed: {e}")
        return False

def test_setup_wizard_compilation():
    """Test that the setup wizard compiles successfully"""
    print("Testing setup wizard compilation...")
    
    try:
        run_command(["cargo", "check"], cwd="installer/setup-wizard")
        print("SUCCESS: Setup wizard compiles successfully")
        return True
    except Exception as e:
        print(f"FAILED: Setup wizard compilation failed: {e}")
        return False

def test_setup_wizard_frontend_build():
    """Test that the setup wizard frontend builds successfully"""
    print("Testing setup wizard frontend build...")
    
    try:
        run_command(["npm", "run", "build"], cwd="installer/setup-wizard")
        print("SUCCESS: Setup wizard frontend builds successfully")
        return True
    except Exception as e:
        print(f"FAILED: Setup wizard frontend build failed: {e}")
        return False

def test_icon_preparation():
    """Test icon preparation script"""
    print("Testing icon preparation...")
    
    try:
        run_command([sys.executable, "scripts/prepare_icons.py", "--check-only"])
        print("SUCCESS: Icon preparation script works")
        return True
    except Exception as e:
        print(f"FAILED: Icon preparation failed: {e}")
        return False

def test_tauri_build():
    """Test Tauri application build"""
    print("Testing Tauri application build...")
    
    try:
        # Build in debug mode for testing
        run_command(["cargo", "tauri", "build", "--debug"], cwd="src-tauri")
        print("SUCCESS: Tauri application builds successfully")
        return True
    except Exception as e:
        print(f"FAILED: Tauri application build failed: {e}")
        return False

def test_file_structure():
    """Test that all required files exist"""
    print("Testing file structure...")
    
    required_files = [
        "src-tauri/src/main.rs",
        "src-tauri/src/backend/mod.rs",
        "src-tauri/src/backend/models.rs",
        "src-tauri/src/backend/storage.rs",
        "src-tauri/src/backend/metrics.rs",
        "src-tauri/src/backend/scanner.rs",
        "src-tauri/src/backend/process.rs",
        "src-tauri/src/backend/startup.rs",
        "src-tauri/src/backend/llm.rs",
        "src-tauri/src/commands.rs",
        "src-tauri/resources/default_settings.json",
        "src/utils/api.js",
        "installer/setup-wizard/src/main.rs",
        "installer/setup-wizard/src/installer.rs",
        "installer/setup-wizard/src/utils.rs",
        "installer/setup-wizard/src-ui/App.jsx",
        "scripts/prepare_icons.py",
        "scripts/build_installer.py",
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
    
    if missing_files:
        print(f"FAILED: Missing required files: {missing_files}")
        return False
    else:
        print("SUCCESS: All required files exist")
        return True

def test_dependencies():
    """Test that all dependencies are available"""
    print("Testing dependencies...")
    
    # Test Node.js dependencies
    try:
        run_command(["npm", "list", "--depth=0"])
        print("SUCCESS: Node.js dependencies are available")
    except Exception as e:
        print(f"FAILED: Node.js dependencies issue: {e}")
        return False
    
    # Test Rust dependencies
    try:
        run_command(["cargo", "tree", "--depth=0"], cwd="src-tauri")
        print("SUCCESS: Rust dependencies are available")
    except Exception as e:
        print(f"FAILED: Rust dependencies issue: {e}")
        return False
    
    return True

def run_all_tests():
    """Run all integration tests"""
    print("Starting OptiAI Integration Tests...")
    print("=" * 50)
    
    tests = [
        ("File Structure", test_file_structure),
        ("Dependencies", test_dependencies),
        ("Icon Preparation", test_icon_preparation),
        ("Rust Backend Compilation", test_rust_backend_compilation),
        ("Rust Integration Tests", test_rust_integration_tests),
        ("Frontend Build", test_frontend_build),
        ("Setup Wizard Compilation", test_setup_wizard_compilation),
        ("Setup Wizard Frontend Build", test_setup_wizard_frontend_build),
        ("Tauri Build", test_tauri_build),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\nRunning: {test_name}")
        print("-" * 30)
        
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"FAILED: {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Print summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    failed = 0
    
    for test_name, success in results:
        status = "PASSED" if success else "FAILED"
        print(f"{status}: {test_name}")
        if success:
            passed += 1
        else:
            failed += 1
    
    print(f"\nResults: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("All tests passed! OptiAI is ready for installation.")
        return True
    else:
        print("Some tests failed. Please fix the issues before proceeding.")
        return False

def main():
    """Main test runner"""
    # Change to project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    os.chdir(project_root)
    
    print(f"Working directory: {os.getcwd()}")
    
    success = run_all_tests()
    
    if success:
        print("\nNext steps:")
        print("1. Run: python scripts/build_installer.py")
        print("2. Install OptiAI using the generated installer")
        print("3. Launch OptiAI from desktop shortcut or start menu")
        sys.exit(0)
    else:
        print("\nPlease fix the failing tests before proceeding.")
        sys.exit(1)

if __name__ == "__main__":
    main()