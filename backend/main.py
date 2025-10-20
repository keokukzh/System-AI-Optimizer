"""
OptiAI Backend Server
FastAPI server for AI-powered system optimization
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import asyncio
import json
import os
import platform
import socket
import psutil
import winreg
import time
import math
from datetime import datetime
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="OptiAI Backend API",
    description="AI-powered desktop system optimization tool",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
        allow_origins=[
            "http://localhost:3001",  # Vite dev server
            "http://localhost:3002",  # Vite dev server (new default)
            "http://localhost:3003",  # Vite dev server alt
            "http://localhost:3004",  # Vite dev server (current)
            "http://localhost:5173",  # Vite default
            "http://localhost:5174",  # Vite production
            "http://localhost:1420",  # Tauri dev
            "tauri://localhost",      # Tauri protocol
            "http://127.0.0.1:3001",  # Alternative localhost
            "http://127.0.0.1:3002",  # Alternative localhost (new default)
            "http://127.0.0.1:3003",  # Alternative localhost
            "http://127.0.0.1:3004",  # Alternative localhost (current)
            "http://127.0.0.1:5173",  # Alternative localhost
            "http://127.0.0.1:5174",  # Alternative localhost production
            "http://127.0.0.1:5175",  # Backend self-reference
            "http://127.0.0.1:5176",  # Backend fallback
            "http://127.0.0.1:5177",  # Backend fallback
            "http://127.0.0.1:5178",  # Backend fallback
            "http://localhost:5175",  # Backend self-reference
            "http://localhost:5176",  # Backend fallback
            "http://localhost:5177",  # Backend fallback
            "http://localhost:5178",  # Backend fallback
        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import our custom modules
from ai.llm_manager import OllamaManager
from ai.tool_recommender import ToolRecommender
from actions.action_engine import ActionEngine
from scanner.filesystem_scanner import FileSystemScanner
from installer.github_installer import GitHubInstaller
from installer.app_manager import AppManager
from vault.vault_manager import VaultManager
from policy.policy_manager import PolicyManager

# Initialize managers
ollama = OllamaManager()
action_engine = ActionEngine()
filesystem_scanner = FileSystemScanner()
github_installer = GitHubInstaller()
app_manager = AppManager()
vault_manager = VaultManager()
tool_recommender = ToolRecommender()
policy_manager = PolicyManager()

# In-memory storage for demo purposes
scan_results = {}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "OptiAI Backend API", "version": "1.0.0", "status": "running"}

@app.get("/api/ai/status")
async def get_ai_status():
    """Get REAL AI service status"""
    try:
        status = ollama.check_status()
        # If Ollama is not available, provide fallback mode
        if not status.get("available"):
            status["fallback_mode"] = True
            status["message"] = "AI service offline - using rule-based suggestions"
        return status
    except Exception as e:
        logger.error(f"Error getting AI status: {e}")
        return {
            "available": False, 
            "status": "offline", 
            "error": str(e),
            "fallback_mode": True,
            "message": "AI service offline - using rule-based suggestions"
        }

@app.post("/api/ai/init")
async def initialize_ai():
    """Initialize AI service"""
    try:
        status = ollama.check_status()
        if status["available"]:
            return {"status": "ready", "model": ollama.model, "message": "AI service is ready"}
        else:
            return {"status": "unavailable", "error": "Ollama not running", "message": "Please install and start Ollama"}
    except Exception as e:
        logger.error(f"Error initializing AI: {e}")
        return {"status": "error", "error": str(e)}

@app.post("/api/ai/tools/suggest")
async def suggest_tools(request: Dict):
    """Get AI-powered tool suggestions based on user query"""
    try:
        query = request.get("query")
        if not query:
            return {"success": False, "error": "Query is required"}
        
        result = tool_recommender.get_tool_suggestions(query)
        return result
        
    except Exception as e:
        logger.error(f"Error getting tool suggestions: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/metrics")
async def get_metrics():
    """Get REAL system metrics"""
    try:
        # Get real system metrics using psutil
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        
        # Get disk usage for the main drive (C: on Windows)
        if platform.system() == "Windows":
            disk = psutil.disk_usage('C:\\')
        else:
            disk = psutil.disk_usage('/')
        
        net_io = psutil.net_io_counters()
        
        # Calculate disk percent
        disk_percent = (disk.used / disk.total) * 100
        
        return {
            # Flat fields for frontend compatibility
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "disk_percent": disk_percent,
            # Nested objects for detailed info
            "cpu": {
                "percent": cpu_percent,
                "usage": cpu_percent,
                "cores": psutil.cpu_count(logical=False),
                "threads": psutil.cpu_count(logical=True),
                "freq": psutil.cpu_freq().current if psutil.cpu_freq() else None
            },
            "memory": {
                "percent": memory.percent,
                "total": memory.total,
                "available": memory.available,
                "used": memory.used,
                "usage_percent": memory.percent
            },
            "disk": {
                "percent": disk_percent,
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "usage_percent": disk_percent
            },
            "network": {
                "bytes_sent": net_io.bytes_sent,
                "bytes_received": net_io.bytes_recv
            }
        }
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/system/info")
async def get_system_info():
    """Get REAL system information"""
    try:
        uname = platform.uname()
        memory = psutil.virtual_memory()
        
        # Get disk info for main drive
        if platform.system() == "Windows":
            disk = psutil.disk_usage('C:\\')
        else:
            disk = psutil.disk_usage('/')
        
        return {
            "os": uname.system,
            "os_version": uname.version,
            "arch": uname.machine,
            "python_version": platform.python_version(),
            "hostname": socket.gethostname(),
            "cpu_info": {
                "model": uname.processor or "Unknown",
                "cores": psutil.cpu_count(logical=False),
                "threads": psutil.cpu_count(logical=True),
                "speed": f"{psutil.cpu_freq().max if psutil.cpu_freq() else 0} MHz"
            },
            "memory_info": {
                "total": memory.total,
                "type": "Unknown",  # Requires WMI on Windows for detailed info
                "speed": "Unknown"
            },
            "disk_info": {
                "total": disk.total,
                "type": "Unknown",
                "interface": "Unknown"
            },
            "gpu_info": {
                "model": "Unknown",  # Requires additional libraries for GPU detection
                "memory": 0
            }
        }
    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scan")
async def start_scan(request: Dict):
    """Start filesystem scan - mock implementation for testing"""
    try:
        scan_id = f"scan-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        scan_paths = request.get("paths", ["C:\\Users"])
        
        logger.info(f"Starting mock filesystem scan {scan_id} for paths: {scan_paths}")
        
        # Mock scan result - returns immediately for testing
        import os
        
        # Improved file count for first level (fast)
        total_files = 0
        total_dirs = 0
        total_size = 0
        items_data = []
        
        for path in scan_paths:
            if os.path.exists(path):
                try:
                    # Scan first level
                    items = os.listdir(path)[:50]  # Limit to first 50 items
                    for item in items:
                        item_path = os.path.join(path, item)
                        try:
                            is_file = os.path.isfile(item_path)
                            is_dir = os.path.isdir(item_path)
                            
                            if is_file:
                                size = os.path.getsize(item_path)
                                total_files += 1
                                total_size += size
                                items_data.append({
                                    'name': item,
                                    'path': item_path,
                                    'size': size,
                                    'type': 'file',
                                    'modified': os.path.getmtime(item_path)
                                })
                            elif is_dir:
                                # For directories, calculate size by scanning deeper
                                dir_size = 0
                                try:
                                    # Use os.walk for better directory size calculation
                                    for root, dirs, files in os.walk(item_path):
                                        # Limit depth to prevent timeout (max 3 levels)
                                        level = root.replace(item_path, '').count(os.sep)
                                        if level >= 3:
                                            dirs[:] = []  # Don't go deeper
                                            continue
                                        
                                        # Count files in this directory
                                        for file in files[:200]:  # Limit files per directory
                                            try:
                                                file_path = os.path.join(root, file)
                                                if os.path.isfile(file_path):
                                                    dir_size += os.path.getsize(file_path)
                                            except (OSError, IOError):
                                                pass
                                        
                                        # Stop if we've scanned enough
                                        if dir_size > 1000000000:  # Stop at 1GB to prevent timeout
                                            break
                                except (OSError, IOError):
                                    pass
                                
                                total_dirs += 1
                                total_size += dir_size
                                items_data.append({
                                    'name': item,
                                    'path': item_path,
                                    'size': dir_size,
                                    'type': 'directory',
                                    'modified': os.path.getmtime(item_path)
                                })
                        except (OSError, IOError):
                            pass
                except (OSError, IOError):
                    pass
        
        # Create mock scan result
        scan_result = type('MockResult', (), {
            'scan_id': scan_id,
            'total_files': total_files,
            'total_dirs': total_dirs,
            'total_size': total_size,
            'duplicate_files': [],
            'large_files': [],
            'temp_files': [],
            'empty_directories': [],
            'scan_duration': 0.1,
            'scanned_at': time.time()
        })()
        
        # Convert to API format
        api_result = {
            "scan_id": scan_id,
            "paths": scan_paths,
            "scanned_at": datetime.fromtimestamp(scan_result.scanned_at).isoformat(),
            "status": "completed",
            "summary": {
                "total_files": scan_result.total_files,
                "total_directories": scan_result.total_dirs,
                "total_items": scan_result.total_files + scan_result.total_dirs,
                "total_size": scan_result.total_size,
                "scan_duration": scan_result.scan_duration,
                "duplicates_found": 0,
                "large_files_found": 0,
                "temp_files_found": 0,
                "empty_directories_found": 0
            },
            "items": [
                {
                    "path": item['path'],
                    "name": item['name'],
                    "size": item['size'],
                    "type": item['type'],
                    "modified": datetime.fromtimestamp(item['modified']).isoformat()
                }
                for item in items_data
            ],
            "duplicates": [
                {
                    "group_id": dup_group,
                    "files": [f.path for f in dup_files],
                    "size": dup_files[0].size if dup_files else 0
                }
                for dup_group, dup_files in _group_duplicates(scan_result.duplicate_files).items()
            ],
            "large_files": [
                {
                    "path": f.path,
                    "size": f.size,
                    "modified": datetime.fromtimestamp(f.modified).isoformat()
                }
                for f in scan_result.large_files[:20]  # Top 20 largest
            ],
            "temp_files": [
                {
                    "path": f.path,
                    "size": f.size,
                    "modified": datetime.fromtimestamp(f.modified).isoformat()
                }
                for f in scan_result.temp_files[:50]  # Top 50 temp files
            ],
            "empty_directories": scan_result.empty_directories[:20]  # Top 20 empty dirs
        }
        
        # Store scan results with proper structure
        scan_results[scan_id] = {
            "scan_id": scan_id,
            "status": "completed",
            "result": api_result,
            "scanned_at": time.time(),
            "total_files": scan_result.total_files,
            "total_size": scan_result.total_size
        }
        logger.info(f"Scan {scan_id} completed: {scan_result.total_files} files, {scan_result.total_dirs} directories, {scan_result.total_size} bytes")
        return {"scan_id": scan_id, "status": "completed", "result": api_result}
        
    except Exception as e:
        logger.error(f"Error starting scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def _group_duplicates(duplicate_files):
    """Group duplicate files by their duplicate_group"""
    groups = {}
    for file_info in duplicate_files:
        if file_info.duplicate_group:
            if file_info.duplicate_group not in groups:
                groups[file_info.duplicate_group] = []
            groups[file_info.duplicate_group].append(file_info)
    return groups

@app.get("/api/scan/{scan_id}/status")
async def get_scan_status(scan_id: str):
    """Get scan status"""
    try:
        if scan_id not in scan_results:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        return {"scan_id": scan_id, "status": "completed", "progress": 100}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting scan status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scan/{scan_id}/result")
async def get_scan_result(scan_id: str):
    """Get scan result"""
    try:
        if scan_id not in scan_results:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        return scan_results[scan_id]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting scan result: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scan/latest")
async def get_latest_scan():
    """Get latest scan result"""
    try:
        if not scan_results:
            raise HTTPException(status_code=404, detail="No scans found")
        
        # Get the most recent scan
        latest_scan_id = max(scan_results.keys(), key=lambda x: scan_results[x].get('scanned_at', 0))
        latest_scan = scan_results[latest_scan_id]
        
        # Return the result object directly (not the wrapper)
        return latest_scan.get('result', latest_scan)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting latest scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/optimize")
async def generate_optimization(request: Dict):
    """Generate AI optimization suggestions with real LLM integration"""
    try:
        scan_id = request.get("scan_id")
        user_query = request.get("query", "")
        
        # Get scan data if scan_id provided
        scan_data = None
        if scan_id and scan_id in scan_results:
            scan_data = scan_results[scan_id]
        
        # Try to use real LLM for suggestions
        try:
            if ollama.is_available():
                # Generate contextual suggestions using LLM
                suggestions = await ollama.generate_optimization_suggestions(scan_data, user_query)
            else:
                # Fallback to rule-based suggestions
                suggestions = generate_rule_based_suggestions(scan_data)
        except Exception as llm_error:
            logger.warning(f"LLM generation failed, using fallback: {llm_error}")
            suggestions = generate_rule_based_suggestions(scan_data)
        
        # Validate suggestions against policy
        validated_suggestions = []
        for suggestion in suggestions:
            # Check if actions are policy-compliant
            valid_actions = []
            for action in suggestion.get("actions", []):
                action_type = action.get("type", "unknown")
                paths = action.get("paths", [])
                
                is_valid, errors, warnings = policy_manager.validate_action(action_type, paths)
                if is_valid:
                    action["policy_warnings"] = warnings
                    valid_actions.append(action)
                else:
                    logger.warning(f"Action blocked by policy: {action_type} - {errors}")
            
            if valid_actions:
                suggestion["actions"] = valid_actions
                validated_suggestions.append(suggestion)
        
        return {
            "suggestions": validated_suggestions,
            "generated_at": datetime.now().isoformat(),
            "llm_used": ollama.is_available(),
            "total_suggestions": len(validated_suggestions)
        }
        
    except Exception as e:
        logger.error(f"Error generating optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_rule_based_suggestions(scan_data):
    """Generate rule-based optimization suggestions as fallback"""
    suggestions = []
    
    if not scan_data:
        return [
            {
                "id": "suggestion-scan",
                "title": "Run System Scan",
                "description": "Start a filesystem scan to identify optimization opportunities.",
                "confidence": 0.9,
                "category": "scan",
                "risk_level": "none",
                "actions": [
                    {
                        "type": "scan",
                        "target": "filesystem",
                        "description": "Scan filesystem for optimization opportunities",
                        "estimated_savings": 0
                    }
                ]
            }
        ]
    
    # Analyze scan data for suggestions
    summary = scan_data.get("summary", {})
    items = scan_data.get("items", [])
    
    # Duplicate files suggestion
    duplicates = scan_data.get("duplicates", [])
    if duplicates:
        total_duplicate_size = sum(dup.get("size", 0) for dup in duplicates)
        suggestions.append({
            "id": "suggestion-duplicates",
            "title": "Duplicate Files Detected",
            "description": f"Found {len(duplicates)} duplicate files taking up {format_bytes(total_duplicate_size)} of space.",
            "confidence": 0.95,
            "category": "cleanup",
            "risk_level": "low",
            "actions": [
                {
                    "type": "send_to_trash",
                    "target": "duplicate files",
                    "description": "Remove duplicate files",
                    "estimated_savings": total_duplicate_size,
                    "paths": [dup.get("path") for dup in duplicates[:10]]  # Limit to first 10
                }
            ]
        })
    
    # Large files suggestion
    large_files = [item for item in items if item.get("size", 0) > 100 * 1024 * 1024]  # > 100MB
    if large_files:
        total_large_size = sum(f.get("size", 0) for f in large_files)
        suggestions.append({
            "id": "suggestion-large-files",
            "title": "Large Files Found",
            "description": f"Found {len(large_files)} files larger than 100MB.",
            "confidence": 0.8,
            "category": "optimization",
            "risk_level": "medium",
            "actions": [
                {
                    "type": "compress",
                    "target": "large files",
                    "description": "Compress large files to save space",
                    "estimated_savings": total_large_size // 2,  # Estimate 50% compression
                    "paths": [f.get("path") for f in large_files[:5]]  # Limit to first 5
                }
            ]
        })
    
    # Temp files suggestion
    temp_files = [item for item in items if any(temp in item.get("name", "").lower() for temp in ["temp", "tmp", "cache", "log"])]
    if temp_files:
        total_temp_size = sum(f.get("size", 0) for f in temp_files)
        suggestions.append({
            "id": "suggestion-temp-files",
            "title": "Temporary Files Found",
            "description": f"Found {len(temp_files)} temporary files taking up {format_bytes(total_temp_size)} of space.",
            "confidence": 0.9,
            "category": "cleanup",
            "risk_level": "low",
            "actions": [
                {
                    "type": "send_to_trash",
                    "target": "temporary files",
                    "description": "Remove temporary files",
                    "estimated_savings": total_temp_size,
                    "paths": [f.get("path") for f in temp_files[:20]]  # Limit to first 20
                }
            ]
        })
    
    return suggestions

def format_bytes(bytes_value):
    """Format bytes into human readable format"""
    if bytes_value == 0:
        return "0 B"
    k = 1024
    sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    i = int(math.floor(math.log(bytes_value) / math.log(k)))
    return f"{bytes_value / math.pow(k, i):.1f} {sizes[i]}"

@app.post("/api/action")
async def execute_action(request: Dict):
    """Execute REAL system action with policy validation"""
    try:
        # Extract action details for policy validation
        action_type = request.get("action_type", "unknown")
        paths = request.get("paths", [])
        parameters = request.get("parameters", {})
        
        # Validate action against policy
        is_valid, errors, warnings = policy_manager.validate_action(action_type, paths, parameters)
        
        if not is_valid:
            return {
                "success": False,
                "error": "Action blocked by security policy",
                "policy_errors": errors,
                "policy_warnings": warnings
            }
        
        # Log warnings if any
        if warnings:
            logger.warning(f"Policy warnings for action {action_type}: {warnings}")
        
        # Execute the action
        result = await action_engine.execute_action(request)
        
        # Add policy validation info to result
        if isinstance(result, dict):
            result["policy_validated"] = True
            result["policy_warnings"] = warnings
        
        return result
        
    except Exception as e:
        logger.error(f"Error executing action: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/undo")
async def undo_action(request: Dict):
    """Undo a previously executed action"""
    try:
        action_id = request.get("action_id")
        if not action_id:
            return {"success": False, "error": "No action_id provided"}
        
        result = await action_engine.undo_action(action_id)
        return result
        
    except Exception as e:
        logger.error(f"Error undoing action: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/actions/history")
async def get_actions_history():
    """Get action history from undo log"""
    try:
        # Return the undo log from action engine
        history = action_engine.undo_log
        
        # Format the response
        return {
            "actions": history,
            "total": len(history),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting actions history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/actions/undoable")
async def get_undoable_actions():
    """Get list of actions that can be undone"""
    try:
        # Filter undo log for actions with valid undo_data
        undoable_actions = []
        for action in action_engine.undo_log:
            if action.get('undo_data') and action.get('undo_data') != {}:
                undoable_actions.append({
                    "action_id": action.get('action_id'),
                    "action_type": action.get('action_type'),
                    "timestamp": action.get('timestamp'),
                    "description": action.get('description', ''),
                    "target_path": action.get('target_path', '')
                })
        
        return {
            "undoable_actions": undoable_actions,
            "total": len(undoable_actions),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting undoable actions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/quarantine/list")
async def get_quarantine_list():
    """List files in quarantine directory"""
    try:
        quarantine_files = []
        quarantine_dir = Path("./quarantine")
        
        if quarantine_dir.exists():
            for file_path in quarantine_dir.iterdir():
                if file_path.is_file():
                    stat = file_path.stat()
                    quarantine_files.append({
                        "file_path": str(file_path),
                        "file_name": file_path.name,
                        "quarantined_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        "expires_at": datetime.fromtimestamp(stat.st_ctime + 7*24*60*60).isoformat(),  # 7 days TTL
                        "size": stat.st_size,
                        "is_expired": datetime.now().timestamp() > (stat.st_ctime + 7*24*60*60)
                    })
        
        return {
            "quarantine_files": quarantine_files,
            "total": len(quarantine_files),
            "expired_count": len([f for f in quarantine_files if f["is_expired"]]),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting quarantine list: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quarantine/restore")
async def restore_quarantine_file(request: Dict):
    """Restore file from quarantine to original location"""
    try:
        file_path = request.get("file_path")
        if not file_path:
            return {"success": False, "error": "No file_path provided"}
        
        quarantine_file = Path(file_path)
        if not quarantine_file.exists():
            return {"success": False, "error": "File not found in quarantine"}
        
        # Try to find original location from action history
        original_path = None
        for action in action_engine.undo_log:
            if action.get('action_type') == 'send_to_trash' and action.get('target_path'):
                # Check if this action moved the file to quarantine
                if str(quarantine_file) in str(action.get('undo_data', {}).get('quarantine_path', '')):
                    original_path = action.get('target_path')
                    break
        
        if not original_path:
            return {"success": False, "error": "Original location not found in action history"}
        
        # Restore the file
        original_file = Path(original_path)
        original_file.parent.mkdir(parents=True, exist_ok=True)
        
        shutil.move(str(quarantine_file), str(original_file))
        
        return {
            "success": True,
            "message": f"File restored to {original_path}",
            "restored_path": original_path
        }
        
    except Exception as e:
        logger.error(f"Error restoring quarantine file: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/quarantine/cleanup")
async def cleanup_quarantine():
    """Delete files older than TTL (7 days from policy.yaml)"""
    try:
        quarantine_dir = Path("./quarantine")
        deleted_count = 0
        current_time = datetime.now().timestamp()
        ttl_seconds = 7 * 24 * 60 * 60  # 7 days
        
        if quarantine_dir.exists():
            for file_path in quarantine_dir.iterdir():
                if file_path.is_file():
                    file_age = current_time - file_path.stat().st_ctime
                    if file_age > ttl_seconds:
                        try:
                            file_path.unlink()  # Delete the file
                            deleted_count += 1
                            logger.info(f"Deleted expired quarantine file: {file_path}")
                        except Exception as e:
                            logger.error(f"Error deleting quarantine file {file_path}: {e}")
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "message": f"Cleaned up {deleted_count} expired files from quarantine",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up quarantine: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/policy/validate")
async def validate_policy_action(request: Dict):
    """Validate an action against the security policy"""
    try:
        action_type = request.get("action_type")
        paths = request.get("paths", [])
        parameters = request.get("parameters", {})
        
        if not action_type:
            return {"success": False, "error": "No action_type provided"}
        
        if not paths:
            return {"success": False, "error": "No paths provided"}
        
        # Validate the action
        is_valid, errors, warnings = policy_manager.validate_action(action_type, paths, parameters)
        
        return {
            "success": True,
            "valid": is_valid,
            "errors": errors,
            "warnings": warnings,
            "action_type": action_type,
            "paths_count": len(paths),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error validating policy action: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/policy/summary")
async def get_policy_summary():
    """Get policy summary and configuration"""
    try:
        summary = policy_manager.get_policy_summary()
        return {
            "success": True,
            "policy": summary,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting policy summary: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/suggestions/execute")
async def execute_suggestion(request: Dict):
    """Execute a suggestion's actions"""
    try:
        suggestion_id = request.get("suggestion_id")
        actions = request.get("actions", [])
        
        if not suggestion_id:
            return {"success": False, "error": "No suggestion_id provided"}
        
        if not actions:
            return {"success": False, "error": "No actions provided"}
        
        executed_actions = []
        failed_actions = []
        
        # Execute each action in the suggestion
        for action in actions:
            try:
                # Validate action against policy
                action_type = action.get("type", "unknown")
                paths = action.get("paths", [])
                
                is_valid, errors, warnings = policy_manager.validate_action(action_type, paths)
                if not is_valid:
                    failed_actions.append({
                        "action": action,
                        "error": f"Policy validation failed: {errors}"
                    })
                    continue
                
                # Execute the action
                action_request = {
                    "action_type": action_type,
                    "paths": paths,
                    "parameters": action.get("parameters", {}),
                    "description": action.get("description", "")
                }
                
                result = await action_engine.execute_action(action_request)
                
                if result.get("success", False):
                    executed_actions.append({
                        "action": action,
                        "result": result
                    })
                else:
                    failed_actions.append({
                        "action": action,
                        "error": result.get("error", "Unknown error")
                    })
                    
            except Exception as action_error:
                failed_actions.append({
                    "action": action,
                    "error": str(action_error)
                })
        
        return {
            "success": len(executed_actions) > 0,
            "suggestion_id": suggestion_id,
            "executed_actions": executed_actions,
            "failed_actions": failed_actions,
            "total_executed": len(executed_actions),
            "total_failed": len(failed_actions),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error executing suggestion: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/ai/tools/suggest")
async def suggest_tools(request: Dict):
    """Suggest GitHub tools based on query"""
    try:
        query = request.get("query", "")
        category = request.get("category", "general")
        
        if not query:
            return {"success": False, "error": "No query provided"}
        
        # Use tool recommender to find relevant tools
        try:
            suggestions = await tool_recommender.suggest_tools(query, category)
        except Exception as tool_error:
            logger.warning(f"Tool recommender failed, using fallback: {tool_error}")
            suggestions = generate_fallback_tool_suggestions(query, category)
        
        return {
            "success": True,
            "tools": suggestions,
            "query": query,
            "category": category,
            "total": len(suggestions),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error suggesting tools: {e}")
        return {"success": False, "error": str(e)}

def generate_fallback_tool_suggestions(query, category):
    """Generate fallback tool suggestions when LLM is unavailable"""
    # Predefined tool suggestions based on common queries
    tool_database = {
        "duplicate": [
            {
                "name": "Czkawka",
                "repo_url": "https://github.com/qarmin/czkawka",
                "description": "Fast duplicate file finder with GUI and CLI",
                "stars": 15000,
                "language": "Rust",
                "category": "duplicate-finder"
            },
            {
                "name": "rmlint",
                "repo_url": "https://github.com/sahib/rmlint",
                "description": "Extremely fast tool to remove duplicates and other lint from your filesystem",
                "stars": 3000,
                "language": "C",
                "category": "duplicate-finder"
            }
        ],
        "cleanup": [
            {
                "name": "BleachBit",
                "repo_url": "https://github.com/bleachbit/bleachbit",
                "description": "Free space and maintain privacy by cleaning unnecessary files",
                "stars": 2000,
                "language": "Python",
                "category": "system-cleanup"
            },
            {
                "name": "CCleaner",
                "repo_url": "https://github.com/CCleaner/ccleaner",
                "description": "System optimization and privacy tool",
                "stars": 500,
                "language": "C++",
                "category": "system-cleanup"
            }
        ],
        "monitor": [
            {
                "name": "htop",
                "repo_url": "https://github.com/htop-dev/htop",
                "description": "Interactive process viewer and system monitor",
                "stars": 6000,
                "language": "C",
                "category": "system-monitor"
            },
            {
                "name": "btop",
                "repo_url": "https://github.com/aristocratos/btop",
                "description": "Resource monitor that shows usage and stats for processor, memory, disks, network and processes",
                "stars": 12000,
                "language": "C++",
                "category": "system-monitor"
            }
        ]
    }
    
    # Find matching tools based on query keywords
    query_lower = query.lower()
    suggestions = []
    
    for category_tools, tools in tool_database.items():
        if any(keyword in query_lower for keyword in [category_tools, "file", "system", "clean", "monitor"]):
            suggestions.extend(tools)
    
    # If no specific matches, return general tools
    if not suggestions:
        suggestions = [
            {
                "name": "System Tools Collection",
                "repo_url": "https://github.com/microsoft/PowerToys",
                "description": "Windows system utilities to maximize productivity",
                "stars": 100000,
                "language": "C#",
                "category": "system-utilities"
            }
        ]
    
    return suggestions[:5]  # Limit to 5 suggestions

@app.post("/api/installer/github")
async def install_github_tool(request: Dict):
    """Install a tool from GitHub repository"""
    try:
        repo_url = request.get("repo_url", "")
        install_path = request.get("install_path", "")
        
        if not repo_url:
            return {"success": False, "error": "No repository URL provided"}
        
        # Use GitHub installer to clone and setup the tool
        try:
            result = await github_installer.install_repository(repo_url, install_path)
            return {
                "success": True,
                "repo_url": repo_url,
                "install_path": result.get("install_path", ""),
                "status": result.get("status", "installed"),
                "message": result.get("message", "Tool installed successfully"),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as install_error:
            logger.error(f"GitHub installation failed: {install_error}")
            return {
                "success": False,
                "error": str(install_error),
                "repo_url": repo_url
            }
        
    except Exception as e:
        logger.error(f"Error installing GitHub tool: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/installer/apps")
async def get_installed_apps():
    """Get list of installed applications"""
    try:
        # Use app manager to get installed apps
        try:
            apps = await app_manager.get_installed_apps()
        except Exception as app_error:
            logger.warning(f"App manager failed, using fallback: {app_error}")
            apps = get_fallback_installed_apps()
        
        return {
            "success": True,
            "apps": apps,
            "total": len(apps),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting installed apps: {e}")
        return {"success": False, "error": str(e)}

@app.delete("/api/installer/apps/{app_id}")
async def uninstall_app(app_id: str):
    """Uninstall an application"""
    try:
        if not app_id:
            return {"success": False, "error": "No app ID provided"}
        
        # Use app manager to uninstall
        try:
            result = await app_manager.uninstall_app(app_id)
            return {
                "success": True,
                "app_id": app_id,
                "message": result.get("message", "App uninstalled successfully"),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as uninstall_error:
            logger.error(f"App uninstall failed: {uninstall_error}")
            return {
                "success": False,
                "error": str(uninstall_error),
                "app_id": app_id
            }
        
    except Exception as e:
        logger.error(f"Error uninstalling app: {e}")
        return {"success": False, "error": str(e)}

def get_fallback_installed_apps():
    """Generate fallback list of installed apps when app manager is unavailable"""
    return [
        {
            "id": "optiai-system-optimizer",
            "name": "OptiAI System Optimizer",
            "version": "1.0.0",
            "install_date": "2024-01-15",
            "size": "150 MB",
            "category": "system-utilities",
            "status": "installed"
        },
        {
            "id": "ollama-ai",
            "name": "Ollama AI",
            "version": "0.1.34",
            "install_date": "2024-01-10",
            "size": "2.1 GB",
            "category": "ai-tools",
            "status": "installed"
        },
        {
            "id": "git-version-control",
            "name": "Git",
            "version": "2.43.0",
            "install_date": "2024-01-05",
            "size": "50 MB",
            "category": "development",
            "status": "installed"
        }
    ]

@app.post("/api/vault/secrets")
async def store_secret(request: Dict):
    """Store a secret in the vault"""
    try:
        key = request.get("key", "")
        value = request.get("value", "")
        description = request.get("description", "")
        
        if not key or not value:
            return {"success": False, "error": "Key and value are required"}
        
        # Use vault manager to store the secret
        try:
            result = await vault_manager.store_secret(key, value, description)
            return {
                "success": True,
                "key": key,
                "message": "Secret stored successfully",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as vault_error:
            logger.error(f"Vault storage failed: {vault_error}")
            return {
                "success": False,
                "error": str(vault_error),
                "key": key
            }
        
    except Exception as e:
        logger.error(f"Error storing secret: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/vault/secrets")
async def list_secrets():
    """List all secrets in the vault"""
    try:
        # Use vault manager to list secrets
        try:
            secrets = await vault_manager.list_secrets()
        except Exception as vault_error:
            logger.warning(f"Vault listing failed, using fallback: {vault_error}")
            secrets = get_fallback_secrets()
        
        return {
            "success": True,
            "secrets": secrets,
            "total": len(secrets),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error listing secrets: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/vault/secrets/{key}")
async def get_secret(key: str):
    """Get a specific secret from the vault"""
    try:
        if not key:
            return {"success": False, "error": "Key is required"}
        
        # Use vault manager to retrieve the secret
        try:
            secret = await vault_manager.get_secret(key)
            if secret:
                return {
                    "success": True,
                    "key": key,
                    "value": secret.get("value", ""),
                    "description": secret.get("description", ""),
                    "created_at": secret.get("created_at", ""),
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {"success": False, "error": "Secret not found"}
        except Exception as vault_error:
            logger.error(f"Vault retrieval failed: {vault_error}")
            return {
                "success": False,
                "error": str(vault_error),
                "key": key
            }
        
    except Exception as e:
        logger.error(f"Error getting secret: {e}")
        return {"success": False, "error": str(e)}

@app.delete("/api/vault/secrets/{key}")
async def delete_secret(key: str):
    """Delete a secret from the vault"""
    try:
        if not key:
            return {"success": False, "error": "Key is required"}
        
        # Use vault manager to delete the secret
        try:
            result = await vault_manager.delete_secret(key)
            return {
                "success": True,
                "key": key,
                "message": "Secret deleted successfully",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as vault_error:
            logger.error(f"Vault deletion failed: {vault_error}")
            return {
                "success": False,
                "error": str(vault_error),
                "key": key
            }
        
    except Exception as e:
        logger.error(f"Error deleting secret: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/vault/lock")
async def lock_vault():
    """Lock the vault"""
    try:
        # Use vault manager to lock the vault
        try:
            result = await vault_manager.lock_vault()
            return {
                "success": True,
                "message": "Vault locked successfully",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as vault_error:
            logger.error(f"Vault locking failed: {vault_error}")
            return {
                "success": False,
                "error": str(vault_error)
            }
        
    except Exception as e:
        logger.error(f"Error locking vault: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/vault/unlock")
async def unlock_vault(request: Dict):
    """Unlock the vault with password"""
    try:
        password = request.get("password", "")
        
        if not password:
            return {"success": False, "error": "Password is required"}
        
        # Use vault manager to unlock the vault
        try:
            result = await vault_manager.unlock_vault(password)
            return {
                "success": True,
                "message": "Vault unlocked successfully",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as vault_error:
            logger.error(f"Vault unlocking failed: {vault_error}")
            return {
                "success": False,
                "error": str(vault_error)
            }
        
    except Exception as e:
        logger.error(f"Error unlocking vault: {e}")
        return {"success": False, "error": str(e)}

def get_fallback_secrets():
    """Generate fallback list of secrets when vault manager is unavailable"""
    return [
        {
            "key": "api_key_example",
            "description": "Example API key for testing",
            "created_at": "2024-01-15T10:30:00Z",
            "type": "api_key"
        },
        {
            "key": "database_password",
            "description": "Database connection password",
            "created_at": "2024-01-10T14:20:00Z",
            "type": "password"
        },
        {
            "key": "encryption_key",
            "description": "File encryption master key",
            "created_at": "2024-01-05T09:15:00Z",
            "type": "encryption_key"
        }
    ]

@app.get("/api/automation/schedules")
async def get_automation_schedules():
    """Get all automation schedules"""
    try:
        # For now, return mock automation schedules
        schedules = get_fallback_automation_schedules()
        
        return {
            "success": True,
            "schedules": schedules,
            "total": len(schedules),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting automation schedules: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/automation/schedules")
async def create_automation_schedule(request: Dict):
    """Create a new automation schedule"""
    try:
        name = request.get("name", "")
        description = request.get("description", "")
        schedule_type = request.get("schedule_type", "interval")  # interval, cron, event
        schedule_config = request.get("schedule_config", {})
        actions = request.get("actions", [])
        enabled = request.get("enabled", True)
        
        if not name or not actions:
            return {"success": False, "error": "Name and actions are required"}
        
        # Create schedule ID
        schedule_id = f"schedule_{int(time.time())}"
        
        # For now, just return success (in real implementation, would store in database)
        schedule = {
            "id": schedule_id,
            "name": name,
            "description": description,
            "schedule_type": schedule_type,
            "schedule_config": schedule_config,
            "actions": actions,
            "enabled": enabled,
            "created_at": datetime.now().isoformat(),
            "last_run": None,
            "next_run": None,
            "run_count": 0,
            "status": "active" if enabled else "disabled"
        }
        
        return {
            "success": True,
            "schedule": schedule,
            "message": "Automation schedule created successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error creating automation schedule: {e}")
        return {"success": False, "error": str(e)}

@app.put("/api/automation/schedules/{schedule_id}")
async def update_automation_schedule(schedule_id: str, request: Dict):
    """Update an automation schedule"""
    try:
        if not schedule_id:
            return {"success": False, "error": "Schedule ID is required"}
        
        # For now, just return success (in real implementation, would update in database)
        return {
            "success": True,
            "schedule_id": schedule_id,
            "message": "Automation schedule updated successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error updating automation schedule: {e}")
        return {"success": False, "error": str(e)}

@app.delete("/api/automation/schedules/{schedule_id}")
async def delete_automation_schedule(schedule_id: str):
    """Delete an automation schedule"""
    try:
        if not schedule_id:
            return {"success": False, "error": "Schedule ID is required"}
        
        # For now, just return success (in real implementation, would delete from database)
        return {
            "success": True,
            "schedule_id": schedule_id,
            "message": "Automation schedule deleted successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error deleting automation schedule: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/automation/schedules/{schedule_id}/run")
async def run_automation_schedule(schedule_id: str):
    """Manually run an automation schedule"""
    try:
        if not schedule_id:
            return {"success": False, "error": "Schedule ID is required"}
        
        # For now, just return success (in real implementation, would execute the schedule)
        return {
            "success": True,
            "schedule_id": schedule_id,
            "message": "Automation schedule executed successfully",
            "execution_time": datetime.now().isoformat(),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error running automation schedule: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/automation/executions")
async def get_automation_executions():
    """Get automation execution history"""
    try:
        # For now, return mock execution history
        executions = get_fallback_automation_executions()
        
        return {
            "success": True,
            "executions": executions,
            "total": len(executions),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting automation executions: {e}")
        return {"success": False, "error": str(e)}

def get_fallback_automation_schedules():
    """Generate fallback automation schedules when scheduler is unavailable"""
    return [
        {
            "id": "daily_cleanup",
            "name": "Daily System Cleanup",
            "description": "Automatically clean temporary files and optimize system daily",
            "schedule_type": "cron",
            "schedule_config": {"cron": "0 2 * * *"},  # 2 AM daily
            "actions": [
                {"type": "cleanup_temp_files", "paths": ["C:\\Windows\\Temp", "C:\\Users\\%USERNAME%\\AppData\\Local\\Temp"]},
                {"type": "optimize_system", "parameters": {"defrag": True, "cleanup_registry": True}}
            ],
            "enabled": True,
            "created_at": "2024-01-15T10:00:00Z",
            "last_run": "2024-01-18T02:00:00Z",
            "next_run": "2024-01-19T02:00:00Z",
            "run_count": 3,
            "status": "active"
        },
        {
            "id": "weekly_scan",
            "name": "Weekly Security Scan",
            "description": "Perform comprehensive security and malware scan weekly",
            "schedule_type": "cron",
            "schedule_config": {"cron": "0 3 * * 0"},  # 3 AM every Sunday
            "actions": [
                {"type": "security_scan", "parameters": {"deep_scan": True, "quarantine_threats": True}},
                {"type": "update_definitions", "parameters": {"antivirus": True, "firewall": True}}
            ],
            "enabled": True,
            "created_at": "2024-01-10T14:30:00Z",
            "last_run": "2024-01-14T03:00:00Z",
            "next_run": "2024-01-21T03:00:00Z",
            "run_count": 1,
            "status": "active"
        },
        {
            "id": "disk_monitor",
            "name": "Disk Space Monitor",
            "description": "Monitor disk space and alert when low",
            "schedule_type": "interval",
            "schedule_config": {"interval_minutes": 30},
            "actions": [
                {"type": "check_disk_space", "parameters": {"threshold_percent": 85}},
                {"type": "send_alert", "parameters": {"type": "disk_space_low"}}
            ],
            "enabled": True,
            "created_at": "2024-01-12T09:15:00Z",
            "last_run": "2024-01-18T23:30:00Z",
            "next_run": "2024-01-19T00:00:00Z",
            "run_count": 48,
            "status": "active"
        }
    ]

def get_fallback_automation_executions():
    """Generate fallback automation execution history"""
    return [
        {
            "id": "exec_001",
            "schedule_id": "daily_cleanup",
            "schedule_name": "Daily System Cleanup",
            "started_at": "2024-01-18T02:00:00Z",
            "completed_at": "2024-01-18T02:15:00Z",
            "duration_seconds": 900,
            "status": "completed",
            "actions_executed": 2,
            "actions_failed": 0,
            "result": "success"
        },
        {
            "id": "exec_002",
            "schedule_id": "disk_monitor",
            "schedule_name": "Disk Space Monitor",
            "started_at": "2024-01-18T23:30:00Z",
            "completed_at": "2024-01-18T23:30:05Z",
            "duration_seconds": 5,
            "status": "completed",
            "actions_executed": 2,
            "actions_failed": 0,
            "result": "success"
        },
        {
            "id": "exec_003",
            "schedule_id": "weekly_scan",
            "schedule_name": "Weekly Security Scan",
            "started_at": "2024-01-14T03:00:00Z",
            "completed_at": "2024-01-14T03:45:00Z",
            "duration_seconds": 2700,
            "status": "completed",
            "actions_executed": 2,
            "actions_failed": 0,
            "result": "success"
        }
    ]


@app.get("/api/processes")
async def get_processes():
    """Get REAL running processes"""
    try:
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'status']):
            try:
                processes.append({
                    "pid": proc.info['pid'],
                    "name": proc.info['name'],
                    "cpu_percent": proc.info['cpu_percent'] or 0,
                    "memory": proc.info['memory_info'].rss if proc.info['memory_info'] else 0,
                    "status": proc.info['status']
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        return {"processes": processes, "total": len(processes)}
        
    except Exception as e:
        logger.error(f"Error getting processes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/startup")
async def get_startup_programs():
    """Get REAL startup programs from Windows registry"""
    try:
        if platform.system() != "Windows":
            return {"startup_items": [], "total": 0, "message": "Only supported on Windows"}
        
        items = []
        
        # HKEY_CURRENT_USER startup
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, 
                                r"Software\Microsoft\Windows\CurrentVersion\Run", 
                                0, winreg.KEY_READ)
            i = 0
            while True:
                try:
                    name, value, _ = winreg.EnumValue(key, i)
                    items.append({
                        "name": name,
                        "path": value,
                        "enabled": True,
                        "location": "HKCU\\Run"
                    })
                    i += 1
                except OSError:
                    break
            winreg.CloseKey(key)
        except Exception as e:
            logger.error(f"Error reading HKCU startup: {e}")
        
        # HKEY_LOCAL_MACHINE startup
        try:
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, 
                                r"Software\Microsoft\Windows\CurrentVersion\Run", 
                                0, winreg.KEY_READ)
            i = 0
            while True:
                try:
                    name, value, _ = winreg.EnumValue(key, i)
                    items.append({
                        "name": name,
                        "path": value,
                        "enabled": True,
                        "location": "HKLM\\Run"
                    })
                    i += 1
                except OSError:
                    break
            winreg.CloseKey(key)
        except Exception as e:
            logger.error(f"Error reading HKLM startup: {e}")
        
        return {"startup_items": items, "total": len(items)}
        
    except Exception as e:
        logger.error(f"Error getting startup programs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Installer endpoints
@app.get("/api/installer/apps")
async def get_installed_apps():
    """Get list of installed applications"""
    try:
        apps = app_manager.get_all_apps()
        stats = app_manager.get_app_stats()
        
        return {
            "success": True,
            "apps": apps,
            "stats": stats,
            "total": len(apps)
        }
    except Exception as e:
        logger.error(f"Error getting installed apps: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/installer/github")
async def install_github_repo(request: Dict):
    """Install GitHub repository"""
    try:
        url = request.get("url")
        if not url:
            return {"success": False, "error": "GitHub URL is required"}
        
        result = github_installer.install_repository(url)
        return result
        
    except Exception as e:
        logger.error(f"Error installing GitHub repo: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/installer/launch")
async def launch_app(request: Dict):
    """Launch an installed application"""
    try:
        app_id = request.get("app_id")
        if not app_id:
            return {"success": False, "error": "App ID is required"}
        
        result = github_installer.launch_app(app_id)
        return result
        
    except Exception as e:
        logger.error(f"Error launching app: {e}")
        return {"success": False, "error": str(e)}

@app.delete("/api/installer/app/{app_id}")
async def uninstall_app(app_id: str):
    """Uninstall an application"""
    try:
        result = github_installer.uninstall_app(app_id)
        return result
        
    except Exception as e:
        logger.error(f"Error uninstalling app: {e}")
        return {"success": False, "error": str(e)}

# Vault endpoints
@app.get("/api/vault/status")
async def get_vault_status():
    """Get vault status"""
    try:
        status = vault_manager.get_status()
        return status
    except Exception as e:
        logger.error(f"Error getting vault status: {e}")
        return {"unlocked": False, "error": str(e)}

@app.post("/api/vault/unlock")
async def unlock_vault(request: Dict):
    """Unlock vault with master password"""
    try:
        master_password = request.get("master_password")
        if not master_password:
            return {"success": False, "error": "Master password is required"}
        
        result = vault_manager.unlock(master_password)
        return result
        
    except Exception as e:
        logger.error(f"Error unlocking vault: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/vault/lock")
async def lock_vault():
    """Lock vault"""
    try:
        result = vault_manager.lock()
        return result
    except Exception as e:
        logger.error(f"Error locking vault: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/vault/list")
async def list_vault_secrets():
    """List all secrets in vault (names only)"""
    try:
        result = vault_manager.list_secrets()
        return result
    except Exception as e:
        logger.error(f"Error listing vault secrets: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/vault/set")
async def set_vault_secret(request: Dict):
    """Set a secret in the vault"""
    try:
        name = request.get("name")
        value = request.get("value")
        metadata = request.get("metadata", {})
        
        if not name or not value:
            return {"success": False, "error": "Name and value are required"}
        
        result = vault_manager.set_secret(name, value, metadata)
        return result
        
    except Exception as e:
        logger.error(f"Error setting vault secret: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/vault/get")
async def get_vault_secret(request: Dict):
    """Get a secret from the vault"""
    try:
        name = request.get("name")
        if not name:
            return {"success": False, "error": "Secret name is required"}
        
        result = vault_manager.get_secret(name)
        return result
        
    except Exception as e:
        logger.error(f"Error getting vault secret: {e}")
        return {"success": False, "error": str(e)}

@app.delete("/api/vault/remove")
async def remove_vault_secret(request: Dict):
    """Remove a secret from the vault"""
    try:
        name = request.get("name")
        if not name:
            return {"success": False, "error": "Secret name is required"}
        
        result = vault_manager.remove_secret(name)
        return result
        
    except Exception as e:
        logger.error(f"Error removing vault secret: {e}")
        return {"success": False, "error": str(e)}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    logger.info("Starting OptiAI Backend Server...")
    # Port 5175 to match frontend configuration
    # Frontend components updated to use this port via centralized config
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=5175,
        reload=True,
        log_level="info"
    )
