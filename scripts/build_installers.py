#!/usr/bin/env python3
"""
Build Installers for OptiAI
Creates MSI and NSIS installers with proper Windows UAC configuration
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
TAURI_DIR = PROJECT_ROOT / "src-tauri"
DIST_DIR = PROJECT_ROOT / "dist"
BUILD_DIR = TAURI_DIR / "target" / "release" / "bundle"

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

def check_prerequisites():
    """Check if required tools are available"""
    print("Checking installer build prerequisites...")
    
    # Check for WiX Toolset
    try:
        run_command(["candle", "-?"], check=False)
        print("✓ WiX Toolset is available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ WiX Toolset not found. Please install WiX Toolset v3.11+")
        print("  Download from: https://wixtoolset.org/releases/")
        return False
    
    # Check for NSIS
    try:
        run_command(["makensis", "/VERSION"], check=False)
        print("✓ NSIS is available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ NSIS not found. Please install NSIS 3.0+")
        print("  Download from: https://nsis.sourceforge.io/Download")
        return False
    
    # Check for Tauri CLI
    try:
        run_command(["cargo", "tauri", "--version"], check=False)
        print("✓ Tauri CLI is available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ Tauri CLI not found. Please install: cargo install tauri-cli")
        return False
    
    return True

def build_tauri_app():
    """Build the Tauri application"""
    print("Building Tauri application...")
    
    # Build the Tauri app
    run_command(
        ["cargo", "tauri", "build", "--target", "x86_64-pc-windows-msvc"],
        cwd=TAURI_DIR,
        description="Building Tauri application"
    )
    
    # Verify build output
    if not BUILD_DIR.exists():
        raise FileNotFoundError("Tauri build output not found")
    
    print("✓ Tauri application built successfully")

def build_msi_installer():
    """Build MSI installer using WiX"""
    print("Building MSI installer...")
    
    # Check if WiX template exists
    wix_template = TAURI_DIR / "wix" / "optiai.wxs"
    if not wix_template.exists():
        print("✗ WiX template not found. Please create wix/optiai.wxs")
        return False
    
    # Build MSI using Tauri
    try:
        run_command(
            ["cargo", "tauri", "build", "--target", "x86_64-pc-windows-msvc", "--bundles", "msi"],
            cwd=TAURI_DIR,
            description="Building MSI installer"
        )
        
        # Find the MSI file
        msi_files = list(BUILD_DIR.glob("msi/*.msi"))
        if msi_files:
            msi_file = msi_files[0]
            print(f"✓ MSI installer created: {msi_file}")
            return msi_file
        else:
            print("✗ MSI installer not found in build output")
            return None
            
    except subprocess.CalledProcessError as e:
        print(f"✗ MSI build failed: {e}")
        return None

def build_nsis_installer():
    """Build NSIS installer"""
    print("Building NSIS installer...")
    
    # Check if NSIS template exists
    nsis_template = TAURI_DIR / "nsis" / "optiai.nsi"
    if not nsis_template.exists():
        print("✗ NSIS template not found. Please create nsis/optiai.nsi")
        return False
    
    # Build NSIS using Tauri
    try:
        run_command(
            ["cargo", "tauri", "build", "--target", "x86_64-pc-windows-msvc", "--bundles", "nsis"],
            cwd=TAURI_DIR,
            description="Building NSIS installer"
        )
        
        # Find the NSIS installer
        nsis_files = list(BUILD_DIR.glob("nsis/*.exe"))
        if nsis_files:
            nsis_file = nsis_files[0]
            print(f"✓ NSIS installer created: {nsis_file}")
            return nsis_file
        else:
            print("✗ NSIS installer not found in build output")
            return None
            
    except subprocess.CalledProcessError as e:
        print(f"✗ NSIS build failed: {e}")
        return None

def copy_installers_to_dist(msi_file, nsis_file):
    """Copy installers to dist directory"""
    print("Copying installers to dist directory...")
    
    # Ensure dist directory exists
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    
    installers_copied = []
    
    if msi_file and msi_file.exists():
        dest_msi = DIST_DIR / msi_file.name
        shutil.copy2(msi_file, dest_msi)
        installers_copied.append(dest_msi)
        print(f"✓ Copied MSI installer: {dest_msi}")
    
    if nsis_file and nsis_file.exists():
        dest_nsis = DIST_DIR / nsis_file.name
        shutil.copy2(nsis_file, dest_nsis)
        installers_copied.append(dest_nsis)
        print(f"✓ Copied NSIS installer: {dest_nsis}")
    
    return installers_copied

def create_installer_manifest(installers):
    """Create installer manifest with checksums"""
    print("Creating installer manifest...")
    
    import hashlib
    import json
    from datetime import datetime
    
    manifest = {
        "build_info": {
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0",
            "platform": "windows-x64"
        },
        "installers": []
    }
    
    for installer in installers:
        if installer.exists():
            with open(installer, "rb") as f:
                sha256_hash = hashlib.sha256()
                for chunk in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(chunk)
                checksum = sha256_hash.hexdigest()
            
            installer_info = {
                "name": installer.name,
                "type": "msi" if installer.suffix == ".msi" else "nsis",
                "size_bytes": installer.stat().st_size,
                "sha256": checksum,
                "path": str(installer.relative_to(PROJECT_ROOT))
            }
            manifest["installers"].append(installer_info)
    
    # Write manifest
    manifest_file = DIST_DIR / "installer_manifest.json"
    with open(manifest_file, "w") as f:
        json.dump(manifest, f, indent=2)
    
    print(f"✓ Installer manifest created: {manifest_file}")
    return manifest_file

def create_installer_readme():
    """Create README for installers"""
    print("Creating installer README...")
    
    readme_content = """# OptiAI Installers

This directory contains the Windows installers for OptiAI.

## Available Installers

### MSI Installer (Recommended)
- **File**: `OptiAI_1.0.0_x64_en-US.msi`
- **Type**: Windows Installer Package
- **Features**: 
  - Requires administrator privileges
  - Automatic Windows Firewall configuration
  - Windows Defender exclusion
  - Registry integration
  - Uninstall support
  - File associations

### NSIS Installer (Alternative)
- **File**: `OptiAI_1.0.0_x64-setup.exe`
- **Type**: NSIS Setup Executable
- **Features**:
  - Custom installation options
  - Start Menu shortcuts
  - Desktop shortcut
  - File associations
  - Windows Firewall configuration
  - Windows Defender exclusion

## Installation Requirements

- **Operating System**: Windows 10 or later (64-bit)
- **Architecture**: x64 (64-bit)
- **Privileges**: Administrator rights required
- **Disk Space**: ~200MB free space
- **RAM**: 4GB minimum (8GB recommended)

## Installation Instructions

1. **Download** the installer of your choice
2. **Right-click** the installer and select "Run as administrator"
3. **Follow** the installation wizard
4. **Allow** Windows Firewall exceptions when prompted
5. **Launch** OptiAI from the Start Menu or Desktop shortcut

## Post-Installation

After installation, OptiAI will:
- Create Start Menu shortcuts
- Add Desktop shortcut (if selected)
- Configure Windows Firewall exceptions
- Add Windows Defender exclusions
- Register file associations for .optiai files

## Uninstallation

To uninstall OptiAI:
1. Go to **Settings** > **Apps** > **Apps & features**
2. Find **OptiAI** in the list
3. Click **Uninstall**
4. Follow the uninstallation wizard

Alternatively, use the uninstaller from the Start Menu.

## Troubleshooting

### Installation Issues
- Ensure you have administrator privileges
- Disable antivirus temporarily during installation
- Check Windows Firewall settings
- Verify Windows version compatibility

### Runtime Issues
- Check Windows Firewall exceptions
- Verify Windows Defender exclusions
- Ensure all required files are present
- Check system requirements

## Support

For installation issues or questions:
- GitHub Issues: https://github.com/yourusername/optiai/issues
- Documentation: https://github.com/yourusername/optiai/wiki
- Email: support@optiai.com

## Security

All installers are digitally signed and verified. The SHA256 checksums are provided in the manifest for verification.

## Version Information

- **Version**: 1.0.0
- **Build Date**: {build_date}
- **Target Platform**: Windows x64
- **Minimum OS**: Windows 10 (Build 1903)
"""
    
    readme_file = DIST_DIR / "INSTALLER_README.md"
    with open(readme_file, "w") as f:
        f.write(readme_content.format(build_date=datetime.now().strftime("%Y-%m-%d")))
    
    print(f"✓ Installer README created: {readme_file}")
    return readme_file

def main():
    """Main build process"""
    print("Building OptiAI Windows Installers")
    print("=" * 50)
    
    try:
        # Check prerequisites
        if not check_prerequisites():
            print("Prerequisites check failed. Please install required tools.")
            sys.exit(1)
        
        # Build Tauri app
        build_tauri_app()
        
        # Build installers
        msi_file = build_msi_installer()
        nsis_file = build_nsis_installer()
        
        # Copy to dist
        installers = copy_installers_to_dist(msi_file, nsis_file)
        
        if not installers:
            print("No installers were created successfully.")
            sys.exit(1)
        
        # Create manifest and documentation
        create_installer_manifest(installers)
        create_installer_readme()
        
        print("\n" + "=" * 50)
        print("✓ Installer build completed successfully!")
        print(f"✓ Created {len(installers)} installer(s)")
        print(f"✓ Output directory: {DIST_DIR}")
        
        for installer in installers:
            size_mb = installer.stat().st_size / (1024 * 1024)
            print(f"  - {installer.name} ({size_mb:.1f} MB)")
        
        print("\nNext steps:")
        print("1. Test installers on clean Windows VM")
        print("2. Verify UAC prompts and admin rights")
        print("3. Check Windows Firewall and Defender integration")
        print("4. Test uninstallation process")
        
    except KeyboardInterrupt:
        print("\nBuild interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nBuild failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
