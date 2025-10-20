"""
Policy Manager for OptiAI
Handles validation of actions against security policy
"""

import yaml
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class PolicyManager:
    def __init__(self, policy_file: str = "policy.yaml"):
        self.policy_file = Path(policy_file)
        self.policy = self._load_policy()
        
    def _load_policy(self) -> Dict:
        """Load policy from YAML file"""
        try:
            if self.policy_file.exists():
                with open(self.policy_file, 'r') as f:
                    return yaml.safe_load(f)
            else:
                logger.warning(f"Policy file {self.policy_file} not found, using default policy")
                return self._get_default_policy()
        except Exception as e:
            logger.error(f"Error loading policy file: {e}")
            return self._get_default_policy()
    
    def _get_default_policy(self) -> Dict:
        """Get default policy configuration"""
        return {
            "version": 1,
            "allowed_actions": ["send_to_trash", "move", "compress", "ignore"],
            "constraints": {
                "max_batch": 1000,
                "max_single_delete_bytes": 21474836480,  # 20 GB
                "require_confirm": True,
                "quarantine_ttl_days": 7,
                "protect_paths": [
                    "/Windows", "/Program Files", "/System", "/usr", "/etc",
                    "/Library", "/System/Volumes/Data"
                ]
            },
            "extensions": {
                "duplicate_min_bytes": 1048576,  # 1 MB
                "large_file_threshold": 1073741824  # 1 GB
            }
        }
    
    def validate_action(self, action_type: str, paths: List[str], parameters: Dict = None) -> Tuple[bool, List[str], List[str]]:
        """
        Validate an action against the policy
        
        Args:
            action_type: Type of action (send_to_trash, move, etc.)
            paths: List of file/directory paths to be affected
            parameters: Additional action parameters
            
        Returns:
            Tuple of (is_valid, errors, warnings)
        """
        errors = []
        warnings = []
        
        # Check if action type is allowed
        if action_type not in self.policy.get("allowed_actions", []):
            errors.append(f"Action type '{action_type}' is not allowed by policy")
            return False, errors, warnings
        
        # Check protected paths
        protected_paths = self.policy.get("constraints", {}).get("protect_paths", [])
        for path in paths:
            if self._is_protected_path(path, protected_paths):
                errors.append(f"Path '{path}' is protected and cannot be modified")
        
        # Check batch size constraints
        max_batch = self.policy.get("constraints", {}).get("max_batch", 1000)
        if len(paths) > max_batch:
            errors.append(f"Batch size {len(paths)} exceeds maximum allowed {max_batch}")
        
        # Check file size constraints for delete operations
        if action_type == "send_to_trash" and parameters:
            total_size = parameters.get("total_size", 0)
            max_size = self.policy.get("constraints", {}).get("max_single_delete_bytes", 21474836480)
            if total_size > max_size:
                warnings.append(f"Large deletion detected: {total_size} bytes (limit: {max_size})")
        
        # Check for risky operations
        if action_type == "send_to_trash":
            system_paths = [p for p in paths if any(sys_path in p.lower() for sys_path in ["system", "windows", "program files"])]
            if system_paths:
                warnings.append(f"Deleting files from system directories: {system_paths}")
        
        is_valid = len(errors) == 0
        return is_valid, errors, warnings
    
    def _is_protected_path(self, path: str, protected_paths: List[str]) -> bool:
        """Check if a path is protected"""
        path_normalized = path.replace("\\", "/").lower()
        
        for protected in protected_paths:
            protected_normalized = protected.lower()
            if path_normalized.startswith(protected_normalized):
                return True
        
        return False
    
    def get_allowed_actions(self) -> List[str]:
        """Get list of allowed actions"""
        return self.policy.get("allowed_actions", [])
    
    def get_constraints(self) -> Dict:
        """Get policy constraints"""
        return self.policy.get("constraints", {})
    
    def get_protected_paths(self) -> List[str]:
        """Get list of protected paths"""
        return self.policy.get("constraints", {}).get("protect_paths", [])
    
    def is_action_allowed(self, action_type: str) -> bool:
        """Check if an action type is allowed"""
        return action_type in self.get_allowed_actions()
    
    def get_quarantine_ttl_days(self) -> int:
        """Get quarantine TTL in days"""
        return self.policy.get("constraints", {}).get("quarantine_ttl_days", 7)
    
    def get_max_batch_size(self) -> int:
        """Get maximum batch size"""
        return self.policy.get("constraints", {}).get("max_batch", 1000)
    
    def get_max_single_delete_bytes(self) -> int:
        """Get maximum single delete size in bytes"""
        return self.policy.get("constraints", {}).get("max_single_delete_bytes", 21474836480)
    
    def reload_policy(self) -> bool:
        """Reload policy from file"""
        try:
            self.policy = self._load_policy()
            logger.info("Policy reloaded successfully")
            return True
        except Exception as e:
            logger.error(f"Error reloading policy: {e}")
            return False
    
    def get_policy_summary(self) -> Dict:
        """Get a summary of the current policy"""
        return {
            "version": self.policy.get("version", 1),
            "allowed_actions": self.get_allowed_actions(),
            "protected_paths_count": len(self.get_protected_paths()),
            "max_batch_size": self.get_max_batch_size(),
            "quarantine_ttl_days": self.get_quarantine_ttl_days(),
            "last_loaded": datetime.now().isoformat()
        }
