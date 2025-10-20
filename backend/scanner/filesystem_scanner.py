"""
FileSystem Scanner for OptiAI
Real filesystem scanning with duplicate detection and optimization suggestions
"""

import os
import hashlib
import time
import logging
from pathlib import Path
from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed
import psutil

logger = logging.getLogger(__name__)

@dataclass
class FileInfo:
    """Information about a file"""
    path: str
    size: int
    modified: float
    extension: str
    hash: Optional[str] = None
    is_duplicate: bool = False
    duplicate_group: Optional[str] = None

@dataclass
class ScanResult:
    """Result of a filesystem scan"""
    scan_id: str
    total_files: int
    total_size: int
    duplicate_files: List[FileInfo]
    large_files: List[FileInfo]
    temp_files: List[FileInfo]
    empty_directories: List[str]
    scan_duration: float
    scanned_at: float

class FileSystemScanner:
    """Real filesystem scanner with duplicate detection"""
    
    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
        self.scan_cache = {}
        
        # File size thresholds
        self.large_file_threshold = 100 * 1024 * 1024  # 100MB
        self.duplicate_min_size = 1024 * 1024  # 1MB
        
        # Temporary file patterns
        self.temp_patterns = {
            '.tmp', '.temp', '.log', '.cache', '.bak', '.old',
            '~', '.swp', '.swo', '.DS_Store', 'Thumbs.db'
        }
        
        # Protected paths (Windows)
        self.protected_paths = {
            'C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)',
            'C:\\System Volume Information', 'C:\\$Recycle.Bin'
        }

    def scan_directory(self, scan_paths: List[str], scan_id: str) -> ScanResult:
        """Scan directories and return comprehensive results"""
        start_time = time.time()
        logger.info(f"Starting scan {scan_id} for paths: {scan_paths}")
        
        all_files = []
        empty_dirs = []
        
        # Collect all files from scan paths
        for path in scan_paths:
            if not self._is_protected_path(path):
                files, dirs = self._scan_path(path)
                all_files.extend(files)
                empty_dirs.extend(dirs)
        
        logger.info(f"Found {len(all_files)} files, {len(empty_dirs)} empty directories")
        
        # Analyze files
        duplicate_files = self._find_duplicates(all_files)
        large_files = self._find_large_files(all_files)
        temp_files = self._find_temp_files(all_files)
        
        # Calculate total size
        total_size = sum(f.size for f in all_files)
        
        scan_duration = time.time() - start_time
        
        result = ScanResult(
            scan_id=scan_id,
            total_files=len(all_files),
            total_size=total_size,
            duplicate_files=duplicate_files,
            large_files=large_files,
            temp_files=temp_files,
            empty_directories=empty_dirs,
            scan_duration=scan_duration,
            scanned_at=time.time()
        )
        
        # Cache result
        self.scan_cache[scan_id] = result
        
        logger.info(f"Scan {scan_id} completed in {scan_duration:.2f}s")
        return result

    def _scan_path(self, path: str) -> Tuple[List[FileInfo], List[str]]:
        """Scan a single path recursively"""
        files = []
        empty_dirs = []
        
        try:
            path_obj = Path(path)
            if not path_obj.exists():
                logger.warning(f"Path does not exist: {path}")
                return files, empty_dirs
            
            if path_obj.is_file():
                # Single file
                file_info = self._get_file_info(str(path_obj))
                if file_info:
                    files.append(file_info)
            else:
                # Directory - scan recursively
                for root, dirs, filenames in os.walk(path):
                    # Skip protected directories
                    dirs[:] = [d for d in dirs if not self._is_protected_path(os.path.join(root, d))]
                    
                    # Check for empty directories
                    if not filenames and not dirs:
                        empty_dirs.append(root)
                    
                    # Process files
                    for filename in filenames:
                        file_path = os.path.join(root, filename)
                        file_info = self._get_file_info(file_path)
                        if file_info:
                            files.append(file_info)
                            
        except (PermissionError, OSError) as e:
            logger.warning(f"Error scanning path {path}: {e}")
        
        return files, empty_dirs

    def _get_file_info(self, file_path: str) -> Optional[FileInfo]:
        """Get information about a single file"""
        try:
            stat = os.stat(file_path)
            path_obj = Path(file_path)
            
            return FileInfo(
                path=file_path,
                size=stat.st_size,
                modified=stat.st_mtime,
                extension=path_obj.suffix.lower()
            )
        except (OSError, PermissionError) as e:
            logger.debug(f"Error getting file info for {file_path}: {e}")
            return None

    def _find_duplicates(self, files: List[FileInfo]) -> List[FileInfo]:
        """Find duplicate files using size and hash comparison"""
        logger.info("Finding duplicate files...")
        
        # Group files by size first
        size_groups = {}
        for file_info in files:
            if file_info.size >= self.duplicate_min_size:
                if file_info.size not in size_groups:
                    size_groups[file_info.size] = []
                size_groups[file_info.size].append(file_info)
        
        duplicates = []
        duplicate_groups = {}
        
        # For files with same size, compute hashes
        for size, file_group in size_groups.items():
            if len(file_group) > 1:
                hash_groups = {}
                
                for file_info in file_group:
                    # Compute hash for files with same size
                    file_hash = self._compute_file_hash(file_info.path)
                    if file_hash:
                        file_info.hash = file_hash
                        if file_hash not in hash_groups:
                            hash_groups[file_hash] = []
                        hash_groups[file_hash].append(file_info)
                
                # Mark duplicates
                for file_hash, hash_group in hash_groups.items():
                    if len(hash_group) > 1:
                        group_id = f"dup_{len(duplicate_groups)}"
                        duplicate_groups[group_id] = hash_group
                        
                        for i, file_info in enumerate(hash_group):
                            file_info.is_duplicate = True
                            file_info.duplicate_group = group_id
                            # Keep first file as original, mark others as duplicates
                            if i > 0:
                                duplicates.append(file_info)
        
        logger.info(f"Found {len(duplicates)} duplicate files in {len(duplicate_groups)} groups")
        return duplicates

    def _compute_file_hash(self, file_path: str) -> Optional[str]:
        """Compute MD5 hash of a file"""
        try:
            hash_md5 = hashlib.md5()
            with open(file_path, "rb") as f:
                # Read in chunks to handle large files
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()
        except (OSError, PermissionError) as e:
            logger.debug(f"Error computing hash for {file_path}: {e}")
            return None

    def _find_large_files(self, files: List[FileInfo]) -> List[FileInfo]:
        """Find large files"""
        large_files = [f for f in files if f.size >= self.large_file_threshold]
        large_files.sort(key=lambda x: x.size, reverse=True)
        logger.info(f"Found {len(large_files)} large files")
        return large_files

    def _find_temp_files(self, files: List[FileInfo]) -> List[FileInfo]:
        """Find temporary files"""
        temp_files = []
        for file_info in files:
            filename = Path(file_info.path).name.lower()
            if any(pattern in filename for pattern in self.temp_patterns):
                temp_files.append(file_info)
        
        logger.info(f"Found {len(temp_files)} temporary files")
        return temp_files

    def _is_protected_path(self, path: str) -> bool:
        """Check if path is protected"""
        path_normalized = os.path.normpath(path)
        return any(path_normalized.startswith(protected) for protected in self.protected_paths)

    def get_scan_result(self, scan_id: str) -> Optional[ScanResult]:
        """Get cached scan result"""
        return self.scan_cache.get(scan_id)

    def clear_cache(self):
        """Clear scan cache"""
        self.scan_cache.clear()

    def get_optimization_suggestions(self, scan_result: ScanResult) -> List[Dict]:
        """Generate optimization suggestions based on scan results"""
        suggestions = []
        
        # Duplicate files suggestion
        if scan_result.duplicate_files:
            total_duplicate_size = sum(f.size for f in scan_result.duplicate_files)
            suggestions.append({
                "type": "duplicate_files",
                "title": "Remove Duplicate Files",
                "description": f"Found {len(scan_result.duplicate_files)} duplicate files",
                "potential_savings": total_duplicate_size,
                "risk": "low",
                "files": [f.path for f in scan_result.duplicate_files[:10]]  # First 10 for preview
            })
        
        # Temporary files suggestion
        if scan_result.temp_files:
            total_temp_size = sum(f.size for f in scan_result.temp_files)
            suggestions.append({
                "type": "temp_files",
                "title": "Clean Temporary Files",
                "description": f"Found {len(scan_result.temp_files)} temporary files",
                "potential_savings": total_temp_size,
                "risk": "low",
                "files": [f.path for f in scan_result.temp_files[:10]]
            })
        
        # Empty directories suggestion
        if scan_result.empty_directories:
            suggestions.append({
                "type": "empty_directories",
                "title": "Remove Empty Directories",
                "description": f"Found {len(scan_result.empty_directories)} empty directories",
                "potential_savings": 0,
                "risk": "low",
                "files": scan_result.empty_directories[:10]
            })
        
        # Large files suggestion
        if scan_result.large_files:
            large_files_size = sum(f.size for f in scan_result.large_files)
            suggestions.append({
                "type": "large_files",
                "title": "Review Large Files",
                "description": f"Found {len(scan_result.large_files)} large files",
                "potential_savings": large_files_size,
                "risk": "medium",
                "files": [f.path for f in scan_result.large_files[:5]]
            })
        
        return suggestions
