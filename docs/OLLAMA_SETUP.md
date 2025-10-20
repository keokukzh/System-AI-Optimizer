# Ollama Setup Guide for OptiAI

This guide will help you set up Ollama to enable AI-powered optimization suggestions in OptiAI.

## What is Ollama?

Ollama is a tool for running large language models locally on your machine. OptiAI uses Ollama to generate intelligent optimization suggestions based on your system scan results.

## Installation

### Windows

1. **Download Ollama**
   - Go to [https://ollama.ai/download](https://ollama.ai/download)
   - Download the Windows installer
   - Run the installer and follow the setup wizard

2. **Verify Installation**
   - Open Command Prompt or PowerShell
   - Run: `ollama --version`
   - You should see the version number

### macOS

1. **Download Ollama**
   - Go to [https://ollama.ai/download](https://ollama.ai/download)
   - Download the macOS installer
   - Run the installer

2. **Verify Installation**
   - Open Terminal
   - Run: `ollama --version`

### Linux

1. **Install via curl**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Verify Installation**
   ```bash
   ollama --version
   ```

## Model Setup

### Recommended Model: phi3-mini-dev

OptiAI is configured to use the `phi3-mini-dev` model, which is:
- Fast and efficient
- Good for system optimization tasks
- Small download size (~2.3GB)

### Download the Model

1. **Start Ollama Service**
   ```bash
   ollama serve
   ```

2. **Download phi3-mini-dev** (in a new terminal)
   ```bash
   ollama pull phi3-mini-dev
   ```

3. **Verify Model Installation**
   ```bash
   ollama list
   ```
   You should see `phi3-mini-dev` in the list.

### Alternative Models

If you prefer a different model, you can use:

- **llama2** (larger, more capable): `ollama pull llama2`
- **mistral** (good balance): `ollama pull mistral`
- **codellama** (code-focused): `ollama pull codellama`

To use a different model, you'll need to modify the `backend/ai/llm_manager.py` file and change the `self.model` variable.

## Running Ollama

### Option 1: Manual Start (Recommended for Development)

1. **Start Ollama Service**
   ```bash
   ollama serve
   ```
   This will start Ollama on `http://127.0.0.1:11434`

2. **Start OptiAI Backend**
   ```bash
   cd backend
   python main.py
   ```

3. **Start OptiAI Frontend**
   ```bash
   npm run dev
   ```

### Option 2: Auto-start (Windows)

You can configure Ollama to start automatically with Windows:

1. **Create a batch file** (`start_ollama.bat`):
   ```batch
   @echo off
   cd /d "C:\Users\%USERNAME%\.ollama"
   ollama serve
   ```

2. **Add to Windows Startup**
   - Press `Win + R`, type `shell:startup`
   - Copy the batch file to the startup folder

## Verification

### Test Ollama API

1. **Check if Ollama is running**
   ```bash
   curl http://127.0.0.1:11434/api/tags
   ```

2. **Test model generation**
   ```bash
   curl http://127.0.0.1:11434/api/generate -d '{
     "model": "phi3-mini-dev",
     "prompt": "Hello, how are you?",
     "stream": false
   }'
   ```

### Test OptiAI Integration

1. **Start OptiAI**
2. **Check AI Status**
   - Look for "AI Online" indicator in the app
   - If it shows "AI Offline", check that Ollama is running

3. **Run a System Scan**
   - The AI should generate optimization suggestions
   - If no suggestions appear, check the backend logs

## Troubleshooting

### Common Issues

1. **"AI Offline" in OptiAI**
   - Check if Ollama is running: `ollama serve`
   - Verify the model is installed: `ollama list`
   - Check if port 11434 is accessible

2. **Model not found**
   - Download the model: `ollama pull phi3-mini-dev`
   - Check available models: `ollama list`

3. **Connection refused**
   - Make sure Ollama is running on port 11434
   - Check firewall settings
   - Try restarting Ollama

4. **Slow response times**
   - The first request may be slow as the model loads
   - Consider using a smaller model like `phi3-mini-dev`
   - Ensure you have enough RAM (8GB+ recommended)

### Performance Tips

1. **RAM Requirements**
   - phi3-mini-dev: ~4GB RAM
   - llama2: ~8GB RAM
   - mistral: ~6GB RAM

2. **GPU Acceleration**
   - Ollama automatically uses GPU if available
   - For NVIDIA GPUs, ensure CUDA is installed
   - For AMD GPUs, ensure ROCm is installed

3. **Model Selection**
   - Smaller models = faster responses
   - Larger models = better quality suggestions
   - Choose based on your hardware capabilities

## Configuration

### Changing the Model

To use a different model in OptiAI:

1. **Edit `backend/ai/llm_manager.py`**
   ```python
   class OllamaManager:
       def __init__(self, base_url="http://127.0.0.1:11434"):
           self.base_url = base_url
           self.model = "your-preferred-model"  # Change this line
   ```

2. **Restart the backend**
   ```bash
   cd backend
   python main.py
   ```

### Changing Ollama URL

If Ollama is running on a different host/port:

1. **Edit `backend/ai/llm_manager.py`**
   ```python
   class OllamaManager:
       def __init__(self, base_url="http://your-host:your-port"):
   ```

## Security Notes

- Ollama runs locally on your machine
- No data is sent to external servers
- All AI processing happens offline
- Your system information stays private

## Support

If you encounter issues:

1. **Check Ollama logs**
   ```bash
   ollama logs
   ```

2. **Check OptiAI backend logs**
   - Look for error messages in the terminal where you started the backend

3. **Verify system requirements**
   - Windows 10/11, macOS 10.15+, or Linux
   - 8GB+ RAM recommended
   - 10GB+ free disk space for models

4. **Community Support**
   - Ollama Discord: [https://discord.gg/ollama](https://discord.gg/ollama)
   - Ollama GitHub: [https://github.com/ollama/ollama](https://github.com/ollama/ollama)

---

**Note**: OptiAI will work without Ollama, but you'll only get rule-based optimization suggestions instead of AI-powered ones.
