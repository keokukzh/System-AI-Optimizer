"""
Installer module for OptiAI
Handles GitHub repository installation and app management
"""

from .github_installer import GitHubInstaller
from .app_manager import AppManager

__all__ = ['GitHubInstaller', 'AppManager']
