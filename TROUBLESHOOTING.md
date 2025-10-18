# OptiAI Troubleshooting Guide

This guide helps you resolve common issues with OptiAI. The application now includes comprehensive error handling and logging to help diagnose problems.

## Quick Diagnostics

### Check Application Logs
1. Open OptiAI
2. Navigate to **Logs** in the sidebar
3. Look for error messages with timestamps
4. Use the filter options to find specific error types

### System Requirements Check
- **Windows**: Windows 10/11 (64-bit)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Disk Space**: At least 2GB free space
- **Permissions**: Administrator rights for full functionality

## Common Error Categories

### 1. Network & Connection Errors

#### "Network connection issue" or "Failed to fetch"
**Symptoms:**
- API calls fail with network errors
- Backend appears unreachable
- CORS errors in browser console

**Solutions:**
1. **Check Backend Status:**
   ```bash
   # Test if backend is running
   curl http://127.0.0.1:5174/health
   # Should return: {"status": "healthy", "components": {...}}
   ```

2. **Restart Backend:**
   ```bash
   cd backend
   .venv\Scripts\activate  # Windows
   uvicorn main:app --reload --port 5174 --host 127.0.0.1
   ```

3. **Check Firewall:**
   - Ensure Windows Firewall allows OptiAI
   - Check if antivirus is blocking the connection

4. **Test API Connection:**
   - Open `test_api.html` in your browser
   - Check browser console for detailed error messages

### 2. Permission & Access Errors

#### "Permission denied" or "No read permission"
**Symptoms:**
- Cannot scan certain directories
- Access denied to system folders
- Registry access failures

**Solutions:**
1. **Run as Administrator:**
   - Right-click OptiAI icon
   - Select "Run as administrator"

2. **Check Directory Permissions:**
   - Ensure you have read access to scan directories
   - Avoid scanning system-protected folders:
     - `C:\Windows`
     - `C:\Program Files`
     - `C:\System Volume Information`

3. **User Account Control (UAC):**
   - Ensure UAC is not blocking the application
   - Check Windows Security settings

### 3. AI & LLM Service Errors

#### "AI service is temporarily unavailable" or "LLM server not available"
**Symptoms:**
- AI suggestions not working
- Fallback to rule-based suggestions
- Model loading failures

**Solutions:**
1. **Check LLM Server:**
   ```bash
   # Test Ollama server
   curl http://127.0.0.1:11434/api/tags
   ```

2. **Restart LLM Service:**
   ```bash
   # Start Ollama server
   ollama serve
   ```

3. **Model Availability:**
   - Ensure AI models are downloaded
   - Check available models in Settings > AI Configuration
   - Download models if missing

4. **Fallback Mode:**
   - OptiAI will automatically use rule-based suggestions
   - This is normal when AI is unavailable

### 4. Storage & Disk Space Errors

#### "Insufficient disk space" or "Storage error"
**Symptoms:**
- Cannot save scan results
- Settings not persisting
- Log files not being written

**Solutions:**
1. **Free Up Disk Space:**
   - Delete temporary files
   - Empty Recycle Bin
   - Use Disk Cleanup utility

2. **Check App Data Directory:**
   - Location: `%APPDATA%\OptiAI\`
   - Ensure write permissions
   - Check available space

3. **Log File Management:**
   - Use Logs viewer to check log file sizes
   - Clear old logs if needed
   - Logs auto-rotate after 7 days

### 5. Scan & File System Errors

#### "Cannot scan protected directory" or "Invalid path"
**Symptoms:**
- Scan fails on certain paths
- Validation errors for scan directories
- File system access issues

**Solutions:**
1. **Use Valid Scan Paths:**
   - Recommended: `C:\Users\YourName\Documents`
   - Avoid: System directories, Program Files
   - Use forward slashes or backslashes consistently

2. **Path Validation:**
   - Check for invalid characters in paths
   - Ensure paths exist and are accessible
   - Use the built-in path validator

3. **Large Directory Handling:**
   - Reduce scan depth for large directories
   - Use fewer worker threads if system is slow
   - Consider scanning subdirectories separately

## Advanced Troubleshooting

### Enable Debug Logging
1. Open OptiAI Settings
2. Enable "Debug Mode"
3. Check Logs viewer for detailed information
4. Look for specific error codes and stack traces

### Reset Application State
1. Close OptiAI completely
2. Delete `%APPDATA%\OptiAI\settings\settings.json`
3. Restart OptiAI (will recreate default settings)

### Check System Resources
1. Open Task Manager
2. Monitor CPU and Memory usage during scans
3. Ensure sufficient resources are available
4. Close other resource-intensive applications

### Network Diagnostics
```bash
# Test localhost connectivity
ping 127.0.0.1

# Check if ports are in use
netstat -an | findstr :5174
netstat -an | findstr :11434
```

## Error Recovery

### Automatic Recovery Features
- **Retry Logic**: Failed operations automatically retry with exponential backoff
- **Graceful Degradation**: AI features fall back to rule-based suggestions
- **Error Boundaries**: UI errors are caught and displayed user-friendly messages
- **Log Rotation**: Old logs are automatically cleaned up

### Manual Recovery Steps
1. **Restart Application**: Close and reopen OptiAI
2. **Clear Cache**: Delete temporary files in `%APPDATA%\OptiAI\cache\`
3. **Reset Settings**: Use Settings > Reset to Defaults
4. **Reinstall**: As last resort, uninstall and reinstall OptiAI

## Getting Help

### Before Contacting Support
1. Check this troubleshooting guide
2. Review application logs
3. Note the exact error message
4. Include system information (Windows version, RAM, etc.)

### Log Collection
1. Open Logs viewer in OptiAI
2. Export logs using the Download button
3. Include recent error logs with your support request

### System Information
Include the following when reporting issues:
- Windows version and build
- OptiAI version
- Available RAM and disk space
- Error messages and timestamps
- Steps to reproduce the issue

## "Failed to load system information" Error

If you're seeing "Failed to load system information" or "Failed to fetch" errors, follow these steps:

### 1. Check Backend Status
```bash
# Test if backend is running
curl http://127.0.0.1:5174/health
# Should return: {"status": "healthy", "components": {...}}
```

### 2. Check Frontend Status
```bash
# Test if frontend is running
curl http://localhost:5173
# Should return HTML content
```

### 3. Restart Services

**Backend:**
```bash
cd backend
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
uvicorn main:app --reload --port 5174 --host 127.0.0.1
```

**Frontend:**
```bash
npm run dev
```

### 4. Test API Connection
Open `test_api.html` in your browser to test the API connection.

### 5. Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for CORS or network errors
4. Check Network tab for failed requests

### 6. Common Issues

**CORS Error:**
- Backend needs to allow requests from `http://localhost:5173`
- Check `backend/main.py` CORS configuration

**Port Conflicts:**
- Backend should run on port 5174
- Frontend should run on port 5173
- Check if ports are already in use

**Python Virtual Environment:**
- Make sure you're using the correct virtual environment
- Install dependencies: `pip install -r requirements.txt`

### 7. Manual API Test
```bash
# Test system info endpoint
curl -H "Origin: http://localhost:5173" http://127.0.0.1:5174/api/system/info

# Test metrics endpoint
curl -H "Origin: http://localhost:5173" http://127.0.0.1:5174/api/metrics
```

### 8. Reset Everything
```bash
# Kill all processes
taskkill /F /IM python.exe  # Windows
# pkill -f python  # Linux/Mac

# Restart backend
cd backend && .venv\Scripts\activate && uvicorn main:app --reload --port 5174

# Restart frontend (in new terminal)
npm run dev
```

## Still Having Issues?

1. Check the browser console for detailed error messages
2. Verify both servers are running on the correct ports
3. Test the API endpoints manually with curl or the test page
4. Make sure no firewall is blocking the connections

The most common cause is CORS issues, which should be resolved by the updated backend configuration.
