#!/usr/bin/env python3
"""
OptiAI Test Runner
Comprehensive test execution script for all test types
"""

import os
import sys
import subprocess
import json
import time
from pathlib import Path
from datetime import datetime

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
TEST_RESULTS_DIR = PROJECT_ROOT / "test-results"
TEST_DATA_DIR = PROJECT_ROOT / "tests" / "data"

class TestRunner:
    def __init__(self):
        self.start_time = datetime.now()
        self.test_results = {}
        self.errors = []
        
    def log(self, message, level="INFO"):
        """Log a message with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
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
    
    def check_prerequisites(self):
        """Check if required tools are available"""
        self.log("Checking test prerequisites...")
        
        required_tools = [
            ("node", "Node.js runtime"),
            ("npm", "Node package manager"),
            ("python", "Python interpreter"),
            ("pip", "Python package manager"),
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
            return False
        
        return True
    
    def setup_test_environment(self):
        """Set up the test environment"""
        self.log("Setting up test environment...")
        
        # Create test directories
        TEST_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        TEST_DATA_DIR.mkdir(parents=True, exist_ok=True)
        
        # Install test dependencies
        self.run_command(
            ["npm", "install", "@playwright/test", "playwright"],
            description="Installing Playwright test dependencies"
        )
        
        # Install Playwright browsers
        self.run_command(
            ["npx", "playwright", "install"],
            description="Installing Playwright browsers"
        )
        
        # Install Python test dependencies
        self.run_command(
            ["pip", "install", "pytest", "pytest-cov", "requests", "selenium"],
            description="Installing Python test dependencies"
        )
        
        self.log("✓ Test environment setup complete")
    
    def run_frontend_tests(self):
        """Run frontend unit tests"""
        self.log("Running frontend tests...")
        
        try:
            result = self.run_command(
                ["npm", "test"],
                description="Running frontend unit tests"
            )
            
            self.test_results["frontend"] = {
                "status": "passed",
                "output": result.stdout if result else "No output"
            }
            
            self.log("✓ Frontend tests passed")
            return True
            
        except subprocess.CalledProcessError as e:
            self.test_results["frontend"] = {
                "status": "failed",
                "error": str(e),
                "output": e.stdout if hasattr(e, 'stdout') else ""
            }
            
            self.log("✗ Frontend tests failed", "ERROR")
            return False
    
    def run_backend_tests(self):
        """Run backend unit tests"""
        self.log("Running backend tests...")
        
        try:
            result = self.run_command(
                ["python", "-m", "pytest", "tests/", "-v", "--tb=short"],
                cwd=PROJECT_ROOT / "backend",
                description="Running backend unit tests"
            )
            
            self.test_results["backend"] = {
                "status": "passed",
                "output": result.stdout if result else "No output"
            }
            
            self.log("✓ Backend tests passed")
            return True
            
        except subprocess.CalledProcessError as e:
            self.test_results["backend"] = {
                "status": "failed",
                "error": str(e),
                "output": e.stdout if hasattr(e, 'stdout') else ""
            }
            
            self.log("✗ Backend tests failed", "ERROR")
            return False
    
    def run_integration_tests(self):
        """Run integration tests"""
        self.log("Running integration tests...")
        
        try:
            # Start backend server in background
            backend_process = subprocess.Popen(
                ["python", "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "5174"],
                cwd=PROJECT_ROOT / "backend",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for backend to start
            time.sleep(5)
            
            # Start frontend server in background
            frontend_process = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=PROJECT_ROOT,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for frontend to start
            time.sleep(10)
            
            # Run integration tests
            result = self.run_command(
                ["python", "-m", "pytest", "tests/integration/", "-v", "--tb=short"],
                description="Running integration tests"
            )
            
            # Stop servers
            backend_process.terminate()
            frontend_process.terminate()
            
            self.test_results["integration"] = {
                "status": "passed",
                "output": result.stdout if result else "No output"
            }
            
            self.log("✓ Integration tests passed")
            return True
            
        except subprocess.CalledProcessError as e:
            self.test_results["integration"] = {
                "status": "failed",
                "error": str(e),
                "output": e.stdout if hasattr(e, 'stdout') else ""
            }
            
            self.log("✗ Integration tests failed", "ERROR")
            return False
    
    def run_e2e_tests(self):
        """Run end-to-end tests"""
        self.log("Running E2E tests...")
        
        try:
            result = self.run_command(
                ["npx", "playwright", "test"],
                description="Running E2E tests with Playwright"
            )
            
            self.test_results["e2e"] = {
                "status": "passed",
                "output": result.stdout if result else "No output"
            }
            
            self.log("✓ E2E tests passed")
            return True
            
        except subprocess.CalledProcessError as e:
            self.test_results["e2e"] = {
                "status": "failed",
                "error": str(e),
                "output": e.stdout if hasattr(e, 'stdout') else ""
            }
            
            self.log("✗ E2E tests failed", "ERROR")
            return False
    
    def run_performance_tests(self):
        """Run performance tests"""
        self.log("Running performance tests...")
        
        try:
            result = self.run_command(
                ["python", "-m", "pytest", "tests/performance/", "-v", "--tb=short"],
                description="Running performance tests"
            )
            
            self.test_results["performance"] = {
                "status": "passed",
                "output": result.stdout if result else "No output"
            }
            
            self.log("✓ Performance tests passed")
            return True
            
        except subprocess.CalledProcessError as e:
            self.test_results["performance"] = {
                "status": "failed",
                "error": str(e),
                "output": e.stdout if hasattr(e, 'stdout') else ""
            }
            
            self.log("✗ Performance tests failed", "ERROR")
            return False
    
    def run_security_tests(self):
        """Run security tests"""
        self.log("Running security tests...")
        
        try:
            result = self.run_command(
                ["python", "-m", "pytest", "tests/security/", "-v", "--tb=short"],
                description="Running security tests"
            )
            
            self.test_results["security"] = {
                "status": "passed",
                "output": result.stdout if result else "No output"
            }
            
            self.log("✓ Security tests passed")
            return True
            
        except subprocess.CalledProcessError as e:
            self.test_results["security"] = {
                "status": "failed",
                "error": str(e),
                "output": e.stdout if hasattr(e, 'stdout') else ""
            }
            
            self.log("✗ Security tests failed", "ERROR")
            return False
    
    def generate_test_report(self):
        """Generate comprehensive test report"""
        self.log("Generating test report...")
        
        end_time = datetime.now()
        duration = end_time - self.start_time
        
        # Calculate overall results
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result["status"] == "passed")
        failed_tests = total_tests - passed_tests
        
        report = {
            "test_run": {
                "start_time": self.start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration_seconds": duration.total_seconds(),
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": failed_tests,
                "success_rate": (passed_tests / total_tests * 100) if total_tests > 0 else 0
            },
            "test_results": self.test_results,
            "errors": self.errors,
            "environment": {
                "python_version": sys.version,
                "node_version": subprocess.run(["node", "--version"], capture_output=True, text=True).stdout.strip(),
                "npm_version": subprocess.run(["npm", "--version"], capture_output=True, text=True).stdout.strip()
            }
        }
        
        # Write report
        report_file = TEST_RESULTS_DIR / "test_report.json"
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)
        
        self.log(f"✓ Test report generated: {report_file}")
        
        return report
    
    def run_all_tests(self):
        """Run all test suites"""
        self.log("Starting OptiAI comprehensive test suite")
        self.log("=" * 60)
        
        try:
            # Check prerequisites
            if not self.check_prerequisites():
                return False
            
            # Setup environment
            self.setup_test_environment()
            
            # Run test suites
            test_suites = [
                ("Frontend Tests", self.run_frontend_tests),
                ("Backend Tests", self.run_backend_tests),
                ("Integration Tests", self.run_integration_tests),
                ("E2E Tests", self.run_e2e_tests),
                ("Performance Tests", self.run_performance_tests),
                ("Security Tests", self.run_security_tests)
            ]
            
            for suite_name, suite_func in test_suites:
                self.log(f"Running {suite_name}...")
                try:
                    suite_func()
                except Exception as e:
                    self.log(f"Error in {suite_name}: {e}", "ERROR")
                    self.errors.append(f"{suite_name}: {e}")
            
            # Generate report
            report = self.generate_test_report()
            
            self.log("=" * 60)
            if report["test_run"]["failed_tests"] == 0:
                self.log("✅ All tests passed successfully!")
            else:
                self.log(f"❌ {report['test_run']['failed_tests']} test suite(s) failed", "ERROR")
            
            self.log(f"📊 Test Summary:")
            self.log(f"   Total Suites: {report['test_run']['total_tests']}")
            self.log(f"   Passed: {report['test_run']['passed_tests']}")
            self.log(f"   Failed: {report['test_run']['failed_tests']}")
            self.log(f"   Success Rate: {report['test_run']['success_rate']:.1f}%")
            self.log(f"   Duration: {report['test_run']['duration_seconds']:.1f}s")
            
            return report["test_run"]["failed_tests"] == 0
            
        except KeyboardInterrupt:
            self.log("Test run interrupted by user", "ERROR")
            return False
        except Exception as e:
            self.log(f"Test run failed: {e}", "ERROR")
            return False

def main():
    """Main entry point"""
    runner = TestRunner()
    success = runner.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! OptiAI is ready for production.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the test report for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()
