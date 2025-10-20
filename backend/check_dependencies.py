#!/usr/bin/env python3
"""
Dependency Checker
Verifies all required packages are installed
"""

import sys

def check_dependencies():
    """Check if all required packages are installed"""
    required = [
        'fastapi', 
        'uvicorn', 
        'psutil', 
        'cryptography', 
        'gitpython', 
        'github',
        'requests',
        'send2trash',
        'python-multipart',
        'pydantic',
        'aiofiles'
    ]
    
    missing = []
    
    for package in required:
        try:
            if package == 'github':
                __import__('github')
            elif package == 'gitpython':
                __import__('git')
            elif package == 'python-multipart':
                __import__('multipart')
            else:
                __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"Missing packages: {', '.join(missing)}")
        return False
    else:
        print("All dependencies installed")
        return True

if __name__ == "__main__":
    if check_dependencies():
        sys.exit(0)
    else:
        sys.exit(1)
