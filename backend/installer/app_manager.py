"""
App Manager for OptiAI
Manages installed applications registry and operations
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class AppManager:
    """Manages installed applications registry"""
    
    def __init__(self, install_dir: str = "./installed_apps"):
        self.install_dir = Path(install_dir)
        self.install_dir.mkdir(exist_ok=True)
        self.apps_file = self.install_dir / "apps.json"
    
    def get_all_apps(self) -> List[Dict]:
        """Get all installed applications"""
        try:
            if not self.apps_file.exists():
                return []
            
            with open(self.apps_file, 'r') as f:
                apps = json.load(f)
            
            # Add status information
            for app in apps:
                app_path = Path(app.get('path', ''))
                app['status'] = 'installed' if app_path.exists() else 'missing'
                app['last_checked'] = datetime.now().isoformat()
            
            return apps
            
        except Exception as e:
            logger.error(f"Error loading apps: {e}")
            return []
    
    def get_app_by_id(self, app_id: str) -> Optional[Dict]:
        """Get specific app by ID"""
        apps = self.get_all_apps()
        for app in apps:
            if app.get('app_id') == app_id:
                return app
        return None
    
    def update_app_info(self, app_id: str, updates: Dict) -> bool:
        """Update app information"""
        try:
            apps = self.get_all_apps()
            updated = False
            
            for i, app in enumerate(apps):
                if app.get('app_id') == app_id:
                    apps[i].update(updates)
                    updated = True
                    break
            
            if updated:
                with open(self.apps_file, 'w') as f:
                    json.dump(apps, f, indent=2)
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error updating app {app_id}: {e}")
            return False
    
    def remove_app(self, app_id: str) -> bool:
        """Remove app from registry"""
        try:
            apps = self.get_all_apps()
            original_count = len(apps)
            
            apps = [app for app in apps if app.get('app_id') != app_id]
            
            if len(apps) < original_count:
                with open(self.apps_file, 'w') as f:
                    json.dump(apps, f, indent=2)
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error removing app {app_id}: {e}")
            return False
    
    def get_app_stats(self) -> Dict:
        """Get statistics about installed apps"""
        try:
            apps = self.get_all_apps()
            
            stats = {
                "total_apps": len(apps),
                "by_type": {},
                "by_status": {},
                "total_size": 0
            }
            
            for app in apps:
                # Count by type
                app_type = app.get('project_type', 'unknown')
                stats['by_type'][app_type] = stats['by_type'].get(app_type, 0) + 1
                
                # Count by status
                status = app.get('status', 'unknown')
                stats['by_status'][status] = stats['by_status'].get(status, 0) + 1
                
                # Calculate size (simplified)
                app_path = Path(app.get('path', ''))
                if app_path.exists():
                    try:
                        size = sum(f.stat().st_size for f in app_path.rglob('*') if f.is_file())
                        stats['total_size'] += size
                    except:
                        pass
            
            return stats
            
        except Exception as e:
            logger.error(f"Error calculating app stats: {e}")
            return {"total_apps": 0, "by_type": {}, "by_status": {}, "total_size": 0}
