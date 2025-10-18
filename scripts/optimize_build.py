#!/usr/bin/env python3
"""
OptiAI Build Optimization Script
Optimizes the build process for production
"""

import os
import sys
import json
import subprocess
import shutil
import gzip
import time
from pathlib import Path
from datetime import datetime

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
BUILD_DIR = PROJECT_ROOT / "dist"
TARGET_DIR = PROJECT_ROOT / "src-tauri" / "target"
OPTIMIZATION_CONFIG = {
    "minify_js": True,
    "minify_css": True,
    "compress_assets": True,
    "remove_unused_code": True,
    "optimize_images": True,
    "bundle_analysis": True
}

class BuildOptimizer:
    def __init__(self):
        self.start_time = datetime.now()
        self.optimizations = []
        self.errors = []
        
    def log(self, message, level="INFO"):
        """Log a message with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def error(self, message):
        """Log an error message"""
        self.log(message, "ERROR")
        self.errors.append(message)
    
    def run_command(self, cmd, cwd=None, description=""):
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
                timeout=300
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
    
    def clean_build_directories(self):
        """Clean existing build directories"""
        self.log("Cleaning build directories...")
        
        directories_to_clean = [
            BUILD_DIR,
            TARGET_DIR,
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
            else:
                self.log(f"✓ Already clean: {directory.relative_to(PROJECT_ROOT)}")
    
    def install_dependencies(self):
        """Install and optimize dependencies"""
        self.log("Installing dependencies...")
        
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
        
        return result is not None
    
    def optimize_frontend_build(self):
        """Optimize frontend build"""
        self.log("Optimizing frontend build...")
        
        # Set production environment
        env = os.environ.copy()
        env["NODE_ENV"] = "production"
        env["VITE_MODE"] = "production"
        
        # Build frontend with optimizations
        result = self.run_command(
            ["npm", "run", "build"],
            description="Building optimized frontend"
        )
        
        if result is None:
            return False
        
        # Analyze bundle size
        if OPTIMIZATION_CONFIG["bundle_analysis"]:
            self.analyze_bundle_size()
        
        return True
    
    def analyze_bundle_size(self):
        """Analyze bundle size and provide recommendations"""
        self.log("Analyzing bundle size...")
        
        if not BUILD_DIR.exists():
            self.error("Build directory not found")
            return
        
        # Calculate total size
        total_size = 0
        file_sizes = {}
        
        for file_path in BUILD_DIR.rglob("*"):
            if file_path.is_file():
                size = file_path.stat().st_size
                total_size += size
                relative_path = file_path.relative_to(BUILD_DIR)
                file_sizes[str(relative_path)] = size
        
        # Sort by size
        sorted_files = sorted(file_sizes.items(), key=lambda x: x[1], reverse=True)
        
        self.log(f"Total bundle size: {total_size / (1024 * 1024):.2f} MB")
        
        # Show largest files
        self.log("Largest files:")
        for file_path, size in sorted_files[:10]:
            size_mb = size / (1024 * 1024)
            self.log(f"  {file_path}: {size_mb:.2f} MB")
        
        # Recommendations
        recommendations = []
        
        if total_size > 50 * 1024 * 1024:  # 50MB
            recommendations.append("Bundle size is large. Consider code splitting.")
        
        large_js_files = [f for f, s in file_sizes.items() if f.endswith('.js') and s > 1024 * 1024]
        if large_js_files:
            recommendations.append(f"Large JS files found: {', '.join(large_js_files)}")
        
        large_css_files = [f for f, s in file_sizes.items() if f.endswith('.css') and s > 100 * 1024]
        if large_css_files:
            recommendations.append(f"Large CSS files found: {', '.join(large_css_files)}")
        
        if recommendations:
            self.log("Optimization recommendations:")
            for rec in recommendations:
                self.log(f"  - {rec}")
        
        self.optimizations.append({
            "type": "bundle_analysis",
            "total_size_mb": total_size / (1024 * 1024),
            "file_count": len(file_sizes),
            "recommendations": recommendations
        })
    
    def compress_assets(self):
        """Compress assets for better performance"""
        if not OPTIMIZATION_CONFIG["compress_assets"]:
            return
        
        self.log("Compressing assets...")
        
        if not BUILD_DIR.exists():
            self.error("Build directory not found")
            return
        
        # Compress JS and CSS files
        compressed_files = []
        
        for file_path in BUILD_DIR.rglob("*"):
            if file_path.is_file() and file_path.suffix in ['.js', '.css', '.html']:
                try:
                    # Read original file
                    with open(file_path, 'rb') as f:
                        original_data = f.read()
                    
                    # Compress with gzip
                    compressed_data = gzip.compress(original_data, compresslevel=9)
                    
                    # Write compressed file
                    compressed_file = file_path.with_suffix(file_path.suffix + '.gz')
                    with open(compressed_file, 'wb') as f:
                        f.write(compressed_data)
                    
                    # Calculate compression ratio
                    compression_ratio = (1 - len(compressed_data) / len(original_data)) * 100
                    compressed_files.append({
                        "file": str(file_path.relative_to(BUILD_DIR)),
                        "original_size": len(original_data),
                        "compressed_size": len(compressed_data),
                        "compression_ratio": compression_ratio
                    })
                    
                except Exception as e:
                    self.error(f"Failed to compress {file_path}: {e}")
        
        if compressed_files:
            self.log(f"✓ Compressed {len(compressed_files)} files")
            total_original = sum(f["original_size"] for f in compressed_files)
            total_compressed = sum(f["compressed_size"] for f in compressed_files)
            total_ratio = (1 - total_compressed / total_original) * 100
            self.log(f"Total compression ratio: {total_ratio:.1f}%")
            
            self.optimizations.append({
                "type": "asset_compression",
                "files_compressed": len(compressed_files),
                "total_compression_ratio": total_ratio
            })
    
    def optimize_images(self):
        """Optimize images for web delivery"""
        if not OPTIMIZATION_CONFIG["optimize_images"]:
            return
        
        self.log("Optimizing images...")
        
        if not BUILD_DIR.exists():
            self.error("Build directory not found")
            return
        
        # Find image files
        image_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']
        image_files = []
        
        for file_path in BUILD_DIR.rglob("*"):
            if file_path.is_file() and file_path.suffix.lower() in image_extensions:
                image_files.append(file_path)
        
        if not image_files:
            self.log("No images found to optimize")
            return
        
        # For now, just log the images found
        # In a real implementation, you would use tools like imagemin, sharp, etc.
        self.log(f"Found {len(image_files)} images to optimize:")
        for img_file in image_files:
            size = img_file.stat().st_size
            self.log(f"  {img_file.relative_to(BUILD_DIR)}: {size / 1024:.1f} KB")
        
        self.optimizations.append({
            "type": "image_optimization",
            "images_found": len(image_files)
        })
    
    def build_backend(self):
        """Build optimized backend"""
        self.log("Building backend...")
        
        # Run PyInstaller to create executable
        result = self.run_command(
            ["python", "embed_python.py"],
            cwd=PROJECT_ROOT / "backend",
            description="Building Python backend executable"
        )
        
        return result is not None
    
    def build_tauri_app(self):
        """Build Tauri application"""
        self.log("Building Tauri application...")
        
        # Build Tauri app
        result = self.run_command(
            ["cargo", "tauri", "build", "--release"],
            cwd=PROJECT_ROOT / "src-tauri",
            description="Building Tauri application"
        )
        
        return result is not None
    
    def generate_build_report(self):
        """Generate build optimization report"""
        end_time = datetime.now()
        duration = end_time - self.start_time
        
        report = {
            "build_optimization": {
                "start_time": self.start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration_seconds": duration.total_seconds(),
                "optimizations_applied": len(self.optimizations),
                "errors": len(self.errors),
                "status": "SUCCESS" if len(self.errors) == 0 else "FAILED"
            },
            "optimizations": self.optimizations,
            "errors": self.errors,
            "build_artifacts": self.get_build_artifacts()
        }
        
        # Write report
        report_file = PROJECT_ROOT / "build_optimization_report.json"
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)
        
        self.log(f"Build optimization report written to: {report_file}")
        
        return report
    
    def get_build_artifacts(self):
        """Get information about build artifacts"""
        artifacts = {}
        
        # Check frontend build
        if BUILD_DIR.exists():
            total_size = sum(f.stat().st_size for f in BUILD_DIR.rglob("*") if f.is_file())
            artifacts["frontend"] = {
                "path": str(BUILD_DIR.relative_to(PROJECT_ROOT)),
                "size_mb": total_size / (1024 * 1024),
                "file_count": len(list(BUILD_DIR.rglob("*")))
            }
        
        # Check Tauri build
        tauri_build_dir = TARGET_DIR / "release" / "bundle"
        if tauri_build_dir.exists():
            artifacts["tauri"] = {
                "path": str(tauri_build_dir.relative_to(PROJECT_ROOT)),
                "bundles": []
            }
            
            for bundle_dir in tauri_build_dir.iterdir():
                if bundle_dir.is_dir():
                    bundle_size = sum(f.stat().st_size for f in bundle_dir.rglob("*") if f.is_file())
                    artifacts["tauri"]["bundles"].append({
                        "name": bundle_dir.name,
                        "size_mb": bundle_size / (1024 * 1024)
                    })
        
        return artifacts
    
    def run_optimization(self):
        """Run complete build optimization"""
        self.log("Starting OptiAI build optimization")
        self.log("=" * 60)
        
        try:
            # Clean build directories
            self.clean_build_directories()
            
            # Install dependencies
            if not self.install_dependencies():
                return False
            
            # Optimize frontend build
            if not self.optimize_frontend_build():
                return False
            
            # Compress assets
            self.compress_assets()
            
            # Optimize images
            self.optimize_images()
            
            # Build backend
            if not self.build_backend():
                return False
            
            # Build Tauri app
            if not self.build_tauri_app():
                return False
            
            # Generate report
            report = self.generate_build_report()
            
            self.log("=" * 60)
            if len(self.errors) == 0:
                self.log("✅ Build optimization completed successfully")
                self.log(f"📊 Applied {len(self.optimizations)} optimizations")
            else:
                self.log(f"❌ Build optimization completed with {len(self.errors)} errors")
            
            self.log(f"⏱️  Total duration: {duration.total_seconds():.1f}s")
            
            return len(self.errors) == 0
            
        except KeyboardInterrupt:
            self.log("Build optimization interrupted by user", "ERROR")
            return False
        except Exception as e:
            self.log(f"Build optimization failed: {e}", "ERROR")
            return False

def main():
    """Main entry point"""
    optimizer = BuildOptimizer()
    success = optimizer.run_optimization()
    
    if success:
        print("\n🎉 Build optimization completed successfully!")
        print("🚀 OptiAI is ready for production deployment.")
        sys.exit(0)
    else:
        print("\n❌ Build optimization failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
