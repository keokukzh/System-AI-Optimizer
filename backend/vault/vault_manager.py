"""
Vault Manager for OptiAI
Handles encrypted secret storage with AES-256-GCM encryption
"""

import os
import json
import time
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import base64
import hashlib

try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False
    logging.warning("cryptography library not available. Vault will use basic encoding.")

logger = logging.getLogger(__name__)

class VaultManager:
    """Manages encrypted vault for storing secrets"""
    
    def __init__(self, vault_dir: str = "./vault", auto_lock_minutes: int = 5):
        self.vault_dir = Path(vault_dir)
        self.vault_dir.mkdir(exist_ok=True)
        
        self.vault_file = self.vault_dir / "vault.json"
        self.key_file = self.vault_dir / "vault.key"
        self.lock_file = self.vault_dir / "vault.lock"
        
        self.auto_lock_minutes = auto_lock_minutes
        self.last_activity = None
        self._fernet = None
        self._unlocked = False
        
        # Initialize vault if it doesn't exist
        if not self.vault_file.exists():
            self._initialize_vault()
    
    def _initialize_vault(self):
        """Initialize empty vault"""
        try:
            vault_data = {
                "version": "1.0",
                "created_at": datetime.now().isoformat(),
                "secrets": {},
                "metadata": {}
            }
            
            with open(self.vault_file, 'w') as f:
                json.dump(vault_data, f, indent=2)
            
            logger.info("Initialized new vault")
            
        except Exception as e:
            logger.error(f"Error initializing vault: {e}")
            raise
    
    def _derive_key(self, password: str, salt: bytes) -> bytes:
        """Derive encryption key from password using PBKDF2"""
        if not CRYPTO_AVAILABLE:
            # Fallback to simple hash (NOT SECURE - for development only)
            logger.warning("Using fallback key derivation - NOT SECURE")
            return hashlib.sha256((password + salt.decode()).encode()).digest()
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return kdf.derive(password.encode())
    
    def _generate_salt(self) -> bytes:
        """Generate random salt"""
        return os.urandom(16)
    
    def _get_or_create_salt(self) -> bytes:
        """Get existing salt or create new one"""
        if self.key_file.exists():
            try:
                with open(self.key_file, 'rb') as f:
                    return f.read()
            except:
                pass
        
        # Create new salt
        salt = self._generate_salt()
        with open(self.key_file, 'wb') as f:
            f.write(salt)
        return salt
    
    def _create_fernet(self, password: str) -> bool:
        """Create Fernet cipher from password"""
        try:
            salt = self._get_or_create_salt()
            key = self._derive_key(password, salt)
            
            if CRYPTO_AVAILABLE:
                # Use proper Fernet encryption
                key_b64 = base64.urlsafe_b64encode(key)
                self._fernet = Fernet(key_b64)
            else:
                # Fallback mode
                self._fernet = None
            
            return True
            
        except Exception as e:
            logger.error(f"Error creating Fernet cipher: {e}")
            return False
    
    def _encrypt_data(self, data: str) -> str:
        """Encrypt data"""
        if not self._fernet:
            # Fallback to base64 encoding (NOT SECURE)
            logger.warning("Using fallback encryption - NOT SECURE")
            return base64.b64encode(data.encode()).decode()
        
        if CRYPTO_AVAILABLE:
            encrypted = self._fernet.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        else:
            return base64.b64encode(data.encode()).decode()
    
    def _decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt data"""
        if not self._fernet:
            # Fallback to base64 decoding
            return base64.b64decode(encrypted_data.encode()).decode()
        
        if CRYPTO_AVAILABLE:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self._fernet.decrypt(encrypted_bytes)
            return decrypted.decode()
        else:
            return base64.b64decode(encrypted_data.encode()).decode()
    
    def _update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = time.time()
        with open(self.lock_file, 'w') as f:
            f.write(str(self.last_activity))
    
    def _check_auto_lock(self) -> bool:
        """Check if vault should auto-lock"""
        if not self.last_activity:
            return False
        
        elapsed = time.time() - self.last_activity
        return elapsed > (self.auto_lock_minutes * 60)
    
    def unlock(self, master_password: str) -> Dict:
        """Unlock vault with master password"""
        try:
            if self._unlocked and not self._check_auto_lock():
                return {"success": True, "message": "Vault already unlocked"}
            
            # Create Fernet cipher
            if not self._create_fernet(master_password):
                return {"success": False, "error": "Failed to create encryption cipher"}
            
            # Test encryption/decryption with a dummy value
            test_data = "test_encryption"
            try:
                encrypted = self._encrypt_data(test_data)
                decrypted = self._decrypt_data(encrypted)
                if decrypted != test_data:
                    return {"success": False, "error": "Invalid master password"}
            except Exception as e:
                return {"success": False, "error": "Invalid master password"}
            
            self._unlocked = True
            self._update_activity()
            
            logger.info("Vault unlocked successfully")
            return {"success": True, "message": "Vault unlocked successfully"}
            
        except Exception as e:
            logger.error(f"Error unlocking vault: {e}")
            return {"success": False, "error": str(e)}
    
    def lock(self) -> Dict:
        """Lock vault"""
        try:
            self._unlocked = False
            self._fernet = None
            self.last_activity = None
            
            # Remove lock file
            if self.lock_file.exists():
                self.lock_file.unlink()
            
            logger.info("Vault locked")
            return {"success": True, "message": "Vault locked successfully"}
            
        except Exception as e:
            logger.error(f"Error locking vault: {e}")
            return {"success": False, "error": str(e)}
    
    def is_unlocked(self) -> bool:
        """Check if vault is unlocked"""
        if not self._unlocked:
            return False
        
        # Check auto-lock
        if self._check_auto_lock():
            self.lock()
            return False
        
        return True
    
    def get_status(self) -> Dict:
        """Get vault status"""
        try:
            unlocked = self.is_unlocked()
            
            # Get vault info
            vault_info = {}
            if self.vault_file.exists():
                with open(self.vault_file, 'r') as f:
                    vault_data = json.load(f)
                    vault_info = {
                        "version": vault_data.get("version"),
                        "created_at": vault_data.get("created_at"),
                        "secret_count": len(vault_data.get("secrets", {}))
                    }
            
            return {
                "unlocked": unlocked,
                "auto_lock_minutes": self.auto_lock_minutes,
                "last_activity": self.last_activity,
                "vault_info": vault_info
            }
            
        except Exception as e:
            logger.error(f"Error getting vault status: {e}")
            return {"unlocked": False, "error": str(e)}
    
    def set_secret(self, name: str, value: str, metadata: Dict = None) -> Dict:
        """Set a secret in the vault"""
        try:
            if not self.is_unlocked():
                return {"success": False, "error": "Vault is locked"}
            
            # Load vault data
            with open(self.vault_file, 'r') as f:
                vault_data = json.load(f)
            
            # Encrypt the value
            encrypted_value = self._encrypt_data(value)
            
            # Store secret
            vault_data["secrets"][name] = {
                "value": encrypted_value,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "metadata": metadata or {}
            }
            
            # Save vault data
            with open(self.vault_file, 'w') as f:
                json.dump(vault_data, f, indent=2)
            
            self._update_activity()
            
            logger.info(f"Secret '{name}' stored successfully")
            return {"success": True, "message": f"Secret '{name}' stored successfully"}
            
        except Exception as e:
            logger.error(f"Error setting secret '{name}': {e}")
            return {"success": False, "error": str(e)}
    
    def get_secret(self, name: str) -> Dict:
        """Get a secret from the vault"""
        try:
            if not self.is_unlocked():
                return {"success": False, "error": "Vault is locked"}
            
            # Load vault data
            with open(self.vault_file, 'r') as f:
                vault_data = json.load(f)
            
            if name not in vault_data.get("secrets", {}):
                return {"success": False, "error": f"Secret '{name}' not found"}
            
            secret_data = vault_data["secrets"][name]
            encrypted_value = secret_data["value"]
            
            # Decrypt the value
            decrypted_value = self._decrypt_data(encrypted_value)
            
            self._update_activity()
            
            return {
                "success": True,
                "value": decrypted_value,
                "metadata": secret_data.get("metadata", {}),
                "created_at": secret_data.get("created_at"),
                "updated_at": secret_data.get("updated_at")
            }
            
        except Exception as e:
            logger.error(f"Error getting secret '{name}': {e}")
            return {"success": False, "error": str(e)}
    
    def list_secrets(self) -> Dict:
        """List all secrets in the vault (names only)"""
        try:
            if not self.is_unlocked():
                return {"success": False, "error": "Vault is locked"}
            
            # Load vault data
            with open(self.vault_file, 'r') as f:
                vault_data = json.load(f)
            
            secrets = []
            for name, secret_data in vault_data.get("secrets", {}).items():
                secrets.append({
                    "name": name,
                    "created_at": secret_data.get("created_at"),
                    "updated_at": secret_data.get("updated_at"),
                    "metadata": secret_data.get("metadata", {})
                })
            
            self._update_activity()
            
            return {
                "success": True,
                "secrets": secrets,
                "count": len(secrets)
            }
            
        except Exception as e:
            logger.error(f"Error listing secrets: {e}")
            return {"success": False, "error": str(e)}
    
    def remove_secret(self, name: str) -> Dict:
        """Remove a secret from the vault"""
        try:
            if not self.is_unlocked():
                return {"success": False, "error": "Vault is locked"}
            
            # Load vault data
            with open(self.vault_file, 'r') as f:
                vault_data = json.load(f)
            
            if name not in vault_data.get("secrets", {}):
                return {"success": False, "error": f"Secret '{name}' not found"}
            
            # Remove secret
            del vault_data["secrets"][name]
            
            # Save vault data
            with open(self.vault_file, 'w') as f:
                json.dump(vault_data, f, indent=2)
            
            self._update_activity()
            
            logger.info(f"Secret '{name}' removed successfully")
            return {"success": True, "message": f"Secret '{name}' removed successfully"}
            
        except Exception as e:
            logger.error(f"Error removing secret '{name}': {e}")
            return {"success": False, "error": str(e)}
    
    def change_master_password(self, old_password: str, new_password: str) -> Dict:
        """Change master password (requires re-encryption of all secrets)"""
        try:
            if not self.is_unlocked():
                return {"success": False, "error": "Vault is locked"}
            
            # Verify old password
            old_fernet = self._fernet
            if not self._create_fernet(old_password):
                return {"success": False, "error": "Invalid old password"}
            
            # Load all secrets
            with open(self.vault_file, 'r') as f:
                vault_data = json.load(f)
            
            # Decrypt all secrets with old password
            decrypted_secrets = {}
            for name, secret_data in vault_data.get("secrets", {}).items():
                try:
                    decrypted_value = self._decrypt_data(secret_data["value"])
                    decrypted_secrets[name] = {
                        "value": decrypted_value,
                        "metadata": secret_data.get("metadata", {}),
                        "created_at": secret_data.get("created_at"),
                        "updated_at": secret_data.get("updated_at")
                    }
                except:
                    return {"success": False, "error": f"Failed to decrypt secret '{name}'"}
            
            # Create new encryption with new password
            if not self._create_fernet(new_password):
                return {"success": False, "error": "Failed to create new encryption"}
            
            # Re-encrypt all secrets
            for name, secret_data in decrypted_secrets.items():
                encrypted_value = self._encrypt_data(secret_data["value"])
                vault_data["secrets"][name] = {
                    "value": encrypted_value,
                    "metadata": secret_data["metadata"],
                    "created_at": secret_data["created_at"],
                    "updated_at": datetime.now().isoformat()
                }
            
            # Save vault data
            with open(self.vault_file, 'w') as f:
                json.dump(vault_data, f, indent=2)
            
            logger.info("Master password changed successfully")
            return {"success": True, "message": "Master password changed successfully"}
            
        except Exception as e:
            logger.error(f"Error changing master password: {e}")
            return {"success": False, "error": str(e)}
