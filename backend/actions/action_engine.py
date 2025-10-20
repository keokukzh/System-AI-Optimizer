"""
Action Engine for OptiAI
Handles safe execution of system optimization actions with undo capability
"""

import os
import shutil
import json
import zipfile
import logging
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import send2trash

logger = logging.getLogger(__name__)

class ActionEngine:
    def __init__(self, quarantine_dir="./quarantine", undo_log_file="./undo_log.json"):
        self.quarantine_dir = Path(quarantine_dir)
        self.quarantine_dir.mkdir(exist_ok=True)
        self.undo_log_file = Path(undo_log_file)
        self.undo_log = self._load_undo_log()
        
        # Protected paths that should never be modified
        self.protected_paths = [
            "C:\\Windows",
            "C:\\Program Files",
            "C:\\Program Files (x86)",
            "/usr",
            "/etc",
            "/bin",
            "/sbin",
            "/lib",
            "/lib64"
        ]
    
    def _load_undo_log(self) -> List[Dict]:
        """Load undo log from file"""
        try:
            if self.undo_log_file.exists():
                with open(self.undo_log_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading undo log: {e}")
        return []
    
    def _save_undo_log(self):
        """Save undo log to file"""
        try:
            with open(self.undo_log_file, 'w') as f:
                json.dump(self.undo_log, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving undo log: {e}")
    
    def _is_protected_path(self, path: str) -> bool:
        """Check if path is protected from modification"""
        path = os.path.abspath(path)
        for protected in self.protected_paths:
            if path.startswith(protected):
                return True
        return False
    
    async def execute_action(self, action: Dict) -> Dict:
        """Execute action with safety checks"""
        try:
            action_type = action.get("action")
            action_id = f"action_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
            
            if not action_type:
                return {"success": False, "error": "No action type specified"}
            
            # Validate action
            if not self._validate_action(action):
                return {"success": False, "error": "Invalid action parameters"}
            
            # Execute based on action type
            if action_type == "send_to_trash":
                result = await self._send_to_trash(action["path"], action_id)
            elif action_type == "move":
                result = await self._move_file(action["path"], action["destination"], action_id)
            elif action_type == "compress":
                result = await self._compress_files(action["paths"], action_id)
            elif action_type == "delete_duplicates":
                result = await self._delete_duplicates(action["duplicate_groups"], action_id)
            elif action_type == "clean_temp_files":
                result = await self._clean_temp_files(action["temp_files"], action_id)
            else:
                return {"success": False, "error": f"Unknown action type: {action_type}"}
            
            # Add to undo log if successful
            if result.get("success"):
                self.undo_log.append({
                    "action_id": action_id,
                    "action_type": action_type,
                    "timestamp": datetime.now().isoformat(),
                    "details": result.get("details", {}),
                    "undo_data": result.get("undo_data", {})
                })
                self._save_undo_log()
            
            return result
            
        except Exception as e:
            logger.error(f"Error executing action: {e}")
            return {"success": False, "error": str(e)}
    
    def _validate_action(self, action: Dict) -> bool:
        """Validate action parameters"""
        action_type = action.get("action")
        
        if action_type == "send_to_trash":
            path = action.get("path")
            if not path or self._is_protected_path(path):
                return False
        elif action_type == "move":
            path = action.get("path")
            dest = action.get("destination")
            if not path or not dest or self._is_protected_path(path) or self._is_protected_path(dest):
                return False
        elif action_type == "compress":
            paths = action.get("paths", [])
            if not paths or any(self._is_protected_path(p) for p in paths):
                return False
        
        return True
    
    async def _send_to_trash(self, path: str, action_id: str) -> Dict:
        """Safely send file to trash with undo capability"""
        try:
            if not os.path.exists(path):
                return {"success": False, "error": f"Path does not exist: {path}"}
            
            # Create backup in quarantine before sending to trash
            backup_path = self.quarantine_dir / f"{action_id}_{os.path.basename(path)}"
            shutil.copy2(path, backup_path)
            
            # Send to trash
            send2trash.send2trash(path)
            
            return {
                "success": True,
                "message": f"Moved {path} to trash",
                "details": {"original_path": path, "backup_path": str(backup_path)},
                "undo_data": {"backup_path": str(backup_path), "original_path": path}
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _move_file(self, path: str, destination: str, action_id: str) -> Dict:
        """Move file to destination with undo capability"""
        try:
            if not os.path.exists(path):
                return {"success": False, "error": f"Source path does not exist: {path}"}
            
            # Ensure destination directory exists
            os.makedirs(os.path.dirname(destination), exist_ok=True)
            
            # Move file
            shutil.move(path, destination)
            
            return {
                "success": True,
                "message": f"Moved {path} to {destination}",
                "details": {"source": path, "destination": destination},
                "undo_data": {"source": destination, "destination": path}
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _compress_files(self, paths: List[str], action_id: str) -> Dict:
        """Compress files into a zip archive"""
        try:
            if not paths:
                return {"success": False, "error": "No files to compress"}
            
            # Create zip file
            zip_path = self.quarantine_dir / f"{action_id}_compressed.zip"
            
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for path in paths:
                    if os.path.exists(path):
                        if os.path.isfile(path):
                            zipf.write(path, os.path.basename(path))
                        elif os.path.isdir(path):
                            for root, dirs, files in os.walk(path):
                                for file in files:
                                    file_path = os.path.join(root, file)
                                    arcname = os.path.relpath(file_path, os.path.dirname(path))
                                    zipf.write(file_path, arcname)
            
            return {
                "success": True,
                "message": f"Compressed {len(paths)} items to {zip_path}",
                "details": {"zip_path": str(zip_path), "compressed_items": len(paths)},
                "undo_data": {"zip_path": str(zip_path)}
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _delete_duplicates(self, duplicate_groups: List[List[str]], action_id: str) -> Dict:
        """Delete duplicate files, keeping the first one in each group"""
        try:
            deleted_files = []
            total_size = 0
            
            for group in duplicate_groups:
                if len(group) > 1:
                    # Keep the first file, delete the rest
                    for duplicate_path in group[1:]:
                        if os.path.exists(duplicate_path):
                            file_size = os.path.getsize(duplicate_path)
                            send2trash.send2trash(duplicate_path)
                            deleted_files.append(duplicate_path)
                            total_size += file_size
            
            return {
                "success": True,
                "message": f"Deleted {len(deleted_files)} duplicate files, freed {total_size / (1024*1024):.2f} MB",
                "details": {"deleted_files": deleted_files, "freed_space": total_size},
                "undo_data": {"deleted_files": deleted_files}
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _clean_temp_files(self, temp_files: List[str], action_id: str) -> Dict:
        """Clean temporary files"""
        try:
            deleted_files = []
            total_size = 0
            
            for temp_path in temp_files:
                if os.path.exists(temp_path):
                    file_size = os.path.getsize(temp_path)
                    send2trash.send2trash(temp_path)
                    deleted_files.append(temp_path)
                    total_size += file_size
            
            return {
                "success": True,
                "message": f"Cleaned {len(deleted_files)} temporary files, freed {total_size / (1024*1024):.2f} MB",
                "details": {"deleted_files": deleted_files, "freed_space": total_size},
                "undo_data": {"deleted_files": deleted_files}
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def undo_action(self, action_id: str) -> Dict:
        """Undo a previously executed action"""
        try:
            # Find the action in undo log
            action_entry = None
            for entry in self.undo_log:
                if entry["action_id"] == action_id:
                    action_entry = entry
                    break
            
            if not action_entry:
                return {"success": False, "error": "Action not found in undo log"}
            
            action_type = action_entry["action_type"]
            undo_data = action_entry.get("undo_data", {})
            
            if action_type == "send_to_trash":
                # Restore from backup
                backup_path = undo_data.get("backup_path")
                original_path = undo_data.get("original_path")
                
                if backup_path and os.path.exists(backup_path):
                    shutil.copy2(backup_path, original_path)
                    os.remove(backup_path)
                    return {"success": True, "message": f"Restored {original_path} from trash"}
                else:
                    return {"success": False, "error": "Backup file not found"}
            
            elif action_type == "move":
                # Move back to original location
                source = undo_data.get("source")
                destination = undo_data.get("destination")
                
                if source and destination and os.path.exists(source):
                    shutil.move(source, destination)
                    return {"success": True, "message": f"Moved {source} back to {destination}"}
                else:
                    return {"success": False, "error": "Cannot undo move - file not found"}
            
            else:
                return {"success": False, "error": f"Cannot undo action type: {action_type}"}
            
        except Exception as e:
            logger.error(f"Error undoing action: {e}")
            return {"success": False, "error": str(e)}
    
    def get_action_history(self) -> List[Dict]:
        """Get list of executed actions"""
        return self.undo_log.copy()
    
    def clear_quarantine(self, older_than_days: int = 7) -> Dict:
        """Clear old files from quarantine directory"""
        try:
            import time
            cutoff_time = time.time() - (older_than_days * 24 * 60 * 60)
            deleted_count = 0
            freed_space = 0
            
            for file_path in self.quarantine_dir.iterdir():
                if file_path.is_file() and file_path.stat().st_mtime < cutoff_time:
                    file_size = file_path.stat().st_size
                    file_path.unlink()
                    deleted_count += 1
                    freed_space += file_size
            
            return {
                "success": True,
                "message": f"Cleared {deleted_count} old files, freed {freed_space / (1024*1024):.2f} MB",
                "deleted_count": deleted_count,
                "freed_space": freed_space
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
