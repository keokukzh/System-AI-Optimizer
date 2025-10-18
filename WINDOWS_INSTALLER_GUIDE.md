# OptiAI Windows Installer Guide

This guide covers the Windows installer configuration, UAC setup, and deployment process for OptiAI.

## Overview

OptiAI uses a dual-installer approach for Windows deployment:

- **MSI Installer** (Primary): Windows Installer Package with full system integration
- **NSIS Installer** (Alternative): Custom setup executable with flexible options

Both installers are configured to request administrator privileges for system-level operations.

## Windows UAC Configuration

### UAC Manifest

The application includes a Windows UAC manifest (`src-tauri/wix/app.manifest`) that:

- **Requests Administrator Privileges**: `level="requireAdministrator"`
- **Supports Windows 10/11**: Modern OS compatibility
- **DPI Awareness**: Per-monitor DPI scaling support
- **Common Controls**: Windows 6.0+ compatibility

### UAC Behavior

When users run OptiAI:

1. **Installation**: UAC prompt appears requesting admin rights
2. **Runtime**: Application runs with elevated privileges
3. **System Operations**: Can modify system files, registry, and services
4. **Security**: Maintains Windows security model compliance

## MSI Installer (WiX)

### Configuration

The MSI installer is built using WiX Toolset with the template `src-tauri/wix/optiai.wxs`:

**Key Features:**
- **Per-Machine Installation**: Installs to `Program Files`
- **Admin Rights Required**: `InstallScope="perMachine"`
- **Major Upgrade Support**: Handles version updates
- **Registry Integration**: Full Windows integration
- **Service Installation**: Optional background service
- **File Associations**: `.optiai` file type registration

### WiX Template Structure

```xml
<Product Id="*" Name="OptiAI" Language="1033" Version="1.0.0">
  <Package InstallScope="perMachine" />
  <Property Id="ALLUSERS" Value="1" />
  
  <!-- Components -->
  <Feature Id="ProductFeature" Title="OptiAI" Level="1">
    <ComponentGroupRef Id="ProductComponents" />
    <ComponentRef Id="ApplicationShortcut" />
    <ComponentRef Id="StartMenuShortcut" />
    <ComponentRef Id="DesktopShortcut" />
  </Feature>
</Product>
```

### Installation Components

1. **Core Application**
   - `OptiAI.exe` - Main application
   - `backend-server.exe` - Python backend
   - `llama-server.exe` - LLM server
   - Configuration files

2. **System Integration**
   - Registry entries for uninstall
   - Windows Firewall exceptions
   - Windows Defender exclusions
   - File associations

3. **User Interface**
   - Start Menu shortcuts
   - Desktop shortcut
   - Uninstaller integration

## NSIS Installer

### Configuration

The NSIS installer uses the template `src-tauri/nsis/optiai.nsi`:

**Key Features:**
- **Modern UI**: Professional installation interface
- **Component Selection**: Optional features
- **Custom Actions**: Firewall and Defender configuration
- **Multi-language Support**: English (expandable)
- **Silent Installation**: Command-line support

### NSIS Template Structure

```nsis
; Request application privileges
RequestExecutionLevel admin

; Installer sections
Section "OptiAI Core" SecCore
  SectionIn RO
  SetOutPath $INSTDIR
  File "OptiAI.exe"
  ; ... other files
SectionEnd

Section "Windows Firewall Exception" SecFirewall
  ExecWait 'netsh advfirewall firewall add rule name="OptiAI" ...'
SectionEnd
```

### Installation Options

Users can select from:

1. **Core Application** (Required)
2. **Start Menu Shortcuts** (Optional)
3. **Desktop Shortcut** (Optional)
4. **File Associations** (Optional)
5. **Windows Firewall Exception** (Optional)
6. **Windows Defender Exclusion** (Optional)
7. **Auto-Start Service** (Optional)

## Tauri Configuration

### Bundle Settings

The `src-tauri/tauri.conf.json` includes installer configuration:

```json
{
  "bundle": {
    "windows": {
      "wix": {
        "template": "wix/optiai.wxs",
        "enableElevatedUpdateInstall": true,
        "enableDesktopShortcut": true,
        "enableMenuShortcut": true
      },
      "nsis": {
        "template": "nsis/optiai.nsi",
        "installMode": "perMachine",
        "allowElevation": true,
        "createDesktopShortcut": true
      }
    }
  }
}
```

### Capabilities

The `src-tauri/capabilities/elevated-permissions.json` defines:

- **File System Access**: Full filesystem permissions
- **Shell Operations**: Execute sidecar processes
- **Process Management**: Launch and manage processes
- **System Information**: OS and hardware access
- **Network Access**: HTTP requests and local servers

## Build Process

### Prerequisites

1. **WiX Toolset v3.11+**
   ```bash
   # Download from: https://wixtoolset.org/releases/
   # Install WiX Toolset v3.11.2 or later
   ```

2. **NSIS 3.0+**
   ```bash
   # Download from: https://nsis.sourceforge.io/Download
   # Install NSIS 3.08 or later
   ```

3. **Tauri CLI**
   ```bash
   cargo install tauri-cli
   ```

### Build Commands

```bash
# Build both installers
make build-installers

# Build MSI only
make build-msi

# Build NSIS only
make build-nsis

# Full production build
make production-build
```

### Build Script

The `scripts/build_installers.py` script:

1. **Checks Prerequisites**: Verifies WiX, NSIS, and Tauri CLI
2. **Builds Tauri App**: Creates the main application
3. **Creates MSI**: Uses WiX template for MSI installer
4. **Creates NSIS**: Uses NSIS template for setup executable
5. **Copies to Dist**: Moves installers to distribution directory
6. **Creates Manifest**: Generates checksums and metadata

## Installation Process

### MSI Installation

1. **Download** `OptiAI_1.0.0_x64_en-US.msi`
2. **Right-click** → "Run as administrator"
3. **UAC Prompt** → Click "Yes" to allow
4. **Installation Wizard** → Follow prompts
5. **System Configuration** → Automatic setup
6. **Completion** → Launch application

### NSIS Installation

1. **Download** `OptiAI_1.0.0_x64-setup.exe`
2. **Right-click** → "Run as administrator"
3. **UAC Prompt** → Click "Yes" to allow
4. **Component Selection** → Choose features
5. **Installation** → Monitor progress
6. **System Configuration** → Optional setup
7. **Completion** → Launch application

## System Integration

### Windows Firewall

Both installers automatically configure Windows Firewall:

```bash
# MSI: Uses WiX FirewallException
<util:FirewallException Id="OptiAIFirewallException"
                       Name="OptiAI"
                       Port="5174"
                       Protocol="tcp" />

# NSIS: Uses netsh commands
ExecWait 'netsh advfirewall firewall add rule name="OptiAI" ...'
```

### Windows Defender

Automatic exclusion configuration:

```bash
# MSI: Registry-based exclusion
<RegistryKey Root="HKLM" Key="SOFTWARE\Microsoft\Windows Defender\Exclusions\Paths">
  <RegistryValue Name="[INSTALLFOLDER]" Type="string" Value="OptiAI Installation Directory" />
</RegistryKey>

# NSIS: PowerShell-based exclusion
ExecWait 'powershell -Command "Add-MpPreference -ExclusionPath \"$INSTDIR\""'
```

### File Associations

Register `.optiai` files with OptiAI:

```bash
# Registry entries for file association
WriteRegStr HKCR ".optiai" "" "OptiAIFile"
WriteRegStr HKCR "OptiAIFile\shell\open\command" "" '"$INSTDIR\OptiAI.exe" "%1"'
```

## Security Considerations

### Code Signing

For production releases, code signing is recommended:

```bash
# Sign MSI installer
signtool sign /f certificate.pfx /p password OptiAI.msi

# Sign NSIS installer
signtool sign /f certificate.pfx /p password OptiAI_Setup.exe
```

### UAC Best Practices

1. **Minimal Privileges**: Only request admin rights when necessary
2. **Clear Purpose**: Explain why admin rights are needed
3. **User Control**: Allow users to choose installation options
4. **Transparency**: Document all system changes

### Antivirus Compatibility

- **Windows Defender**: Automatic exclusion configuration
- **Third-party AV**: May require manual exclusion
- **False Positives**: Monitor and report to AV vendors

## Testing

### Installation Testing

1. **Clean Windows VM**: Test on fresh Windows 10/11
2. **UAC Prompts**: Verify admin rights requests
3. **System Integration**: Check Firewall and Defender
4. **File Associations**: Test .optiai file opening
5. **Uninstallation**: Verify complete removal

### Compatibility Testing

- **Windows 10**: Build 1903 and later
- **Windows 11**: All versions
- **Architecture**: x64 only
- **Languages**: English (expandable)

## Troubleshooting

### Common Issues

#### UAC Prompts Not Appearing
- Check manifest file configuration
- Verify `RequestExecutionLevel admin`
- Ensure installer is not blocked

#### Installation Fails
- Run installer as administrator
- Check Windows version compatibility
- Verify disk space and permissions
- Disable antivirus temporarily

#### System Integration Issues
- Check Windows Firewall settings
- Verify Windows Defender exclusions
- Review registry permissions
- Check service installation

### Debug Information

Enable verbose logging:

```bash
# MSI: Enable verbose logging
msiexec /i OptiAI.msi /l*v install.log

# NSIS: Enable debug output
makensis /DDEBUG OptiAI.nsi
```

## Distribution

### Release Process

1. **Build Installers**: Use production build script
2. **Code Signing**: Sign with certificate (production)
3. **Testing**: Verify on clean systems
4. **Upload**: Distribute via GitHub Releases
5. **Documentation**: Update installation guides

### File Sizes

- **MSI Installer**: ~50-80MB
- **NSIS Installer**: ~45-75MB
- **Total Application**: ~200MB installed

### Download Options

- **GitHub Releases**: Primary distribution
- **Direct Download**: Website integration
- **Auto-Updater**: Future implementation

## Support

### Installation Support

For installation issues:

1. **Check Prerequisites**: Windows version, architecture
2. **Verify Permissions**: Administrator rights
3. **Review Logs**: Installation and system logs
4. **Contact Support**: GitHub issues or email

### Documentation

- **Installation Guide**: This document
- **User Manual**: Application documentation
- **Troubleshooting**: Common issues and solutions
- **FAQ**: Frequently asked questions

## Future Enhancements

### Planned Features

1. **Auto-Updater**: Seamless update mechanism
2. **Silent Installation**: Enterprise deployment
3. **Multi-language**: Localized installers
4. **Custom Actions**: Advanced system configuration
5. **Digital Signing**: Production code signing

### Enterprise Features

1. **Group Policy**: Centralized configuration
2. **SCCM Integration**: Enterprise deployment
3. **Custom Templates**: Organization-specific branding
4. **Audit Logging**: Installation tracking
5. **Rollback Support**: Safe uninstallation
