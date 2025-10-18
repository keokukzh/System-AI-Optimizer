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
        "http://localhost:5173",  # Vite default
        "http://localhost:1420",  # Tauri dev
        "tauri://localhost",      # Tauri protocol
        "http://127.0.0.1:3001",  # Alternative localhost
        "http://127.0.0.1:5173",  # Alternative localhost
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demo purposes
scan_results = {}
ai_status = {"available": True, "status": "online", "model": "phi3-mini-dev"}
system_metrics = {
    "cpu": {"usage": 25.5, "cores": 8},
    "memory": {"total": 8589934592, "usage_percent": 60.0, "available": 3435973836},
    "disk": {"usage_percent": 75.0, "total": 1000000000000, "free": 250000000000},
    "network": {"bytes_sent": 1024, "bytes_received": 2048}
}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "OptiAI Backend API", "version": "1.0.0", "status": "running"}

@app.get("/api/ai/status")
async def get_ai_status():
    """Get AI service status"""
    try:
        return ai_status
    except Exception as e:
        logger.error(f"Error getting AI status: {e}")
        return {"available": False, "status": "error", "error": str(e)}

@app.get("/api/metrics")
async def get_metrics():
    """Get system metrics"""
    try:
        # Simulate real-time metrics
        import random
        system_metrics["cpu"]["usage"] = round(random.uniform(20, 80), 1)
        system_metrics["memory"]["usage_percent"] = round(random.uniform(50, 90), 1)
        system_metrics["disk"]["usage_percent"] = round(random.uniform(70, 85), 1)
        
        return system_metrics
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scan")
async def start_scan(request: Dict):
    """Start filesystem scan"""
    try:
        scan_id = f"scan-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        path = request.get("path", "C:\\")
        
        # Simulate scan result
        scan_result = {
            "scan_id": scan_id,
            "path": path,
            "scanned_at": datetime.now().isoformat(),
            "status": "completed",
            "summary": {
                "total_files": 1250,
                "total_size": 1024000000,
                "scan_duration": 2.5,
                "directories_scanned": 45,
                "duplicates_found": 12
            },
            "items": [
                {
                    "path": f"{path}\\temp\\old_file.txt",
                    "size": 1024000,
                    "type": "file",
                    "last_modified": "2024-01-01T00:00:00Z"
                }
            ],
            "duplicates": [
                {
                    "files": [f"{path}\\temp\\file1.txt", f"{path}\\temp\\file2.txt"],
                    "size": 2048000,
                    "hash": "abc123"
                }
            ]
        }
        
        scan_results[scan_id] = scan_result
        return {"scan_id": scan_id, "status": "started"}
        
    except Exception as e:
        logger.error(f"Error starting scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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

@app.post("/api/optimize")
async def generate_optimization(request: Dict):
    """Generate AI optimization suggestions"""
    try:
        scan_id = request.get("scan_id")
        
        # Simulate AI suggestions
        suggestions = [
            {
                "id": "suggestion-1",
                "title": "Duplicate Files Detected",
                "description": "Found 12 duplicate files taking up 50 MB of space.",
                "confidence": 0.9,
                "category": "cleanup",
                "risk_level": "low",
                "actions": [
                    {
                        "type": "delete",
                        "target": "duplicate files",
                        "description": "Remove duplicate files",
                        "estimated_savings": 50000000
                    }
                ]
            },
            {
                "id": "suggestion-2",
                "title": "Large Files Found",
                "description": "Found 3 files larger than 100MB.",
                "confidence": 0.8,
                "category": "optimization",
                "risk_level": "medium",
                "actions": [
                    {
                        "type": "compress",
                        "target": "large files",
                        "description": "Compress large files",
                        "estimated_savings": 200000000
                    }
                ]
            }
        ]
        
        return {"suggestions": suggestions, "generated_at": datetime.now().isoformat()}
        
    except Exception as e:
        logger.error(f"Error generating optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/action")
async def execute_action(request: Dict):
    """Execute optimization action"""
    try:
        action_type = request.get("action_type")
        target = request.get("target")
        
        # Simulate action execution
        action_id = f"action-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        result = {
            "action_id": action_id,
            "action_type": action_type,
            "target": target,
            "status": "completed",
            "message": f"Successfully executed {action_type} on {target}",
            "executed_at": datetime.now().isoformat()
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error executing action: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/processes")
async def get_processes():
    """Get running processes"""
    try:
        # Simulate process list
        processes = [
            {
                "pid": 1234,
                "name": "notepad.exe",
                "cpu_percent": 5.2,
                "memory_percent": 2.1,
                "memory_usage": 2097152,
                "status": "Running"
            },
            {
                "pid": 5678,
                "name": "chrome.exe",
                "cpu_percent": 15.8,
                "memory_percent": 8.5,
                "memory_usage": 8912896,
                "status": "Running"
            }
        ]
        
        return {"processes": processes, "total": len(processes)}
        
    except Exception as e:
        logger.error(f"Error getting processes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/startup")
async def get_startup_programs():
    """Get startup programs"""
    try:
        # Simulate startup programs
        startup_programs = [
            {
                "name": "Discord",
                "path": "C:\\Users\\User\\AppData\\Local\\Discord\\Update.exe",
                "enabled": True,
                "location": "registry"
            },
            {
                "name": "Steam",
                "path": "C:\\Program Files (x86)\\Steam\\steam.exe",
                "enabled": False,
                "location": "registry"
            }
        ]
        
        return {"programs": startup_programs, "total": len(startup_programs)}
        
    except Exception as e:
        logger.error(f"Error getting startup programs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    logger.info("Starting OptiAI Backend Server...")
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=5174,
        reload=True,
        log_level="info"
    )
