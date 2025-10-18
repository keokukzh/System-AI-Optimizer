# OptiAI Frequently Asked Questions (FAQ)

## General Questions

### What is OptiAI?
OptiAI is an AI-powered desktop system optimizer that helps you clean up your computer, manage processes, and optimize system performance. It uses both AI and rule-based algorithms to provide intelligent suggestions for system improvements.

### What operating systems does OptiAI support?
OptiAI currently supports:
- Windows 10 (64-bit)
- Windows 11 (64-bit)

Support for macOS and Linux is planned for future releases.

### Is OptiAI free to use?
Yes, OptiAI is free to use. It's an open-source project that provides system optimization tools at no cost.

### Do I need administrator privileges?
Yes, OptiAI requires administrator privileges to:
- Access system directories
- Manage startup programs
- Monitor system processes
- Perform system optimizations

The installer will request admin rights during installation.

## Installation & Setup

### How do I install OptiAI?
1. Download the installer from the releases page
2. Run the installer as administrator
3. Follow the installation wizard
4. OptiAI will be installed and ready to use

### What happens during installation?
The installer will:
- Install OptiAI to your system
- Set up necessary permissions
- Create desktop shortcuts
- Configure Windows Firewall rules
- Install AI models (optional)

### Can I install OptiAI on multiple computers?
Yes, you can install OptiAI on multiple computers. Each installation is independent and will work with its own system configuration.

### How do I uninstall OptiAI?
1. Go to Windows Settings > Apps
2. Find "OptiAI" in the list
3. Click "Uninstall"
4. Follow the uninstall wizard

## AI Features

### What AI models does OptiAI use?
OptiAI uses local AI models via Ollama:
- **phi3-mini**: Default model for system analysis
- **qwen2.5-3b**: Alternative model for optimization suggestions
- **tinyllama**: Lightweight model for quick analysis

### Do I need an internet connection for AI features?
No, OptiAI uses local AI models that run on your computer. No internet connection is required for AI features once the models are downloaded.

### What if AI is not available?
OptiAI automatically falls back to rule-based optimization suggestions when AI is unavailable. You'll still get useful recommendations based on system analysis.

### How do I download AI models?
1. Open OptiAI Settings
2. Go to AI Configuration
3. Click "Download Models"
4. Select the models you want to install

### Can I use my own AI models?
Yes, you can configure OptiAI to use custom AI models by:
1. Installing Ollama
2. Pulling your preferred models
3. Configuring OptiAI to use them

## System Scanning

### What does OptiAI scan?
OptiAI can scan:
- User directories (Documents, Downloads, Desktop)
- Specific folders you choose
- File duplicates
- Large files
- Temporary files
- System processes
- Startup programs

### What directories are protected from scanning?
OptiAI automatically protects these system directories:
- `C:\Windows`
- `C:\Program Files`
- `C:\Program Files (x86)`
- `C:\System Volume Information`
- `C:\$Recycle.Bin`

### How long does a scan take?
Scan duration depends on:
- Size of directories being scanned
- Number of files
- System performance
- Number of worker threads

Typical scan times:
- User Documents folder: 1-3 minutes
- Full user directory: 5-15 minutes
- Large drives: 30+ minutes

### Can I pause or cancel a scan?
Yes, you can cancel a running scan at any time. Click the "Stop" button in the scan interface.

### What file types does OptiAI analyze?
OptiAI analyzes all file types but focuses on:
- Duplicate files
- Large files (>1GB)
- Temporary files
- Cache files
- Log files
- Media files

## Optimization & Cleanup

### What optimizations does OptiAI suggest?
OptiAI can suggest:
- Deleting duplicate files
- Removing temporary files
- Cleaning browser cache
- Uninstalling unused programs
- Managing startup programs
- Optimizing system processes

### Is it safe to delete suggested files?
OptiAI uses multiple safety measures:
- Protected paths are never suggested for deletion
- Files are moved to quarantine before permanent deletion
- 7-day recovery period for deleted files
- Detailed explanations for each suggestion

### What is the quarantine system?
Deleted files are moved to a quarantine folder for 7 days before permanent deletion. You can:
- Restore files from quarantine
- View what was deleted
- Permanently delete quarantined files

### Can I undo optimizations?
Yes, most optimizations can be undone:
- Use the Action History to see what was done
- Click "Undo" for recent actions
- Restore files from quarantine

## Performance & Resources

### How much RAM does OptiAI use?
OptiAI typically uses:
- **Idle**: 50-100 MB
- **Scanning**: 200-500 MB
- **AI Analysis**: 1-2 GB (depending on model)

### Does OptiAI slow down my computer?
OptiAI is designed to be lightweight:
- Minimal impact during idle
- CPU usage only during active operations
- Automatic resource management
- Configurable worker threads

### Can I adjust performance settings?
Yes, you can configure:
- Number of scan worker threads
- AI model selection
- Scan depth limits
- Timeout settings

## Troubleshooting

### OptiAI won't start
1. Run as administrator
2. Check Windows Firewall settings
3. Ensure no antivirus is blocking it
4. Check the Logs viewer for error messages

### Scan fails with permission errors
1. Run OptiAI as administrator
2. Check directory permissions
3. Avoid scanning system directories
4. Use user directories instead

### AI features not working
1. Check if Ollama is running
2. Verify AI models are downloaded
3. Check network connectivity (for model downloads)
4. Review AI settings in configuration

### Application crashes
1. Check the Logs viewer for crash information
2. Restart the application
3. Clear cache files
4. Reset settings to defaults

## Security & Privacy

### Is my data sent to external servers?
No, OptiAI operates entirely locally:
- All analysis happens on your computer
- No data is sent to external servers
- AI models run locally
- Logs are stored locally

### What data does OptiAI collect?
OptiAI only collects:
- System information (for optimization)
- File metadata (for analysis)
- Application logs (for troubleshooting)
- No personal files or content

### How is my data protected?
- All data stays on your computer
- No network transmission of personal data
- Encrypted storage for sensitive settings
- Automatic log rotation and cleanup

## Advanced Usage

### Can I customize optimization rules?
Yes, you can:
- Modify the policy.yaml file
- Add custom file patterns
- Adjust safety constraints
- Configure AI prompts

### How do I backup my settings?
Settings are stored in `%APPDATA%\OptiAI\settings\`. You can:
- Copy the settings folder
- Export settings from the UI
- Use the built-in backup feature

### Can I run OptiAI from command line?
Yes, OptiAI includes command-line tools:
```bash
# Run system scan
optiai scan --path "C:\Users\YourName\Documents"

# Generate AI suggestions
optiai suggest --scan-id "scan_123"

# Execute optimizations
optiai optimize --plan-id "plan_456"
```

### How do I contribute to OptiAI?
OptiAI is open source! You can:
- Report bugs and issues
- Suggest new features
- Contribute code
- Improve documentation
- Help with translations

## Support

### Where can I get help?
- Check the TROUBLESHOOTING.md guide
- Review application logs
- Visit the GitHub issues page
- Join the community discussions

### How do I report bugs?
1. Check if the issue is already reported
2. Gather system information
3. Include error logs
4. Describe steps to reproduce
5. Submit a detailed bug report

### Can I request new features?
Yes! Feature requests are welcome:
- Check existing feature requests
- Describe the use case
- Explain the expected behavior
- Consider contributing the implementation

---

*This FAQ is regularly updated. Check back for new questions and answers.*
