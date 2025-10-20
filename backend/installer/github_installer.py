"""
GitHub Installer for OptiAI
Handles cloning, dependency installation, and launcher creation for GitHub repositories
"""

import os
import json
import shutil
import subprocess
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse
import re

logger = logging.getLogger(__name__)

class GitHubInstaller:
    """Handles GitHub repository installation and setup"""
    
    def __init__(self, install_dir: str = "./installed_apps"):
        self.install_dir = Path(install_dir)
        self.install_dir.mkdir(exist_ok=True)
        
        # Project type detection patterns
        self.project_patterns = {
            'python': ['requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile'],
            'node': ['package.json', 'yarn.lock', 'package-lock.json'],
            'rust': ['Cargo.toml', 'Cargo.lock'],
            'go': ['go.mod', 'go.sum', 'main.go'],
            'java': ['pom.xml', 'build.gradle', 'build.gradle.kts'],
            'csharp': ['*.csproj', '*.sln', '*.cs'],
            'php': ['composer.json', 'composer.lock'],
            'ruby': ['Gemfile', 'Gemfile.lock', 'Rakefile']
        }
        
        # Launcher templates
        self.launcher_templates = {
            'python': {
                'windows': '@echo off\ncd /d "{path}"\npython main.py\npause',
                'unix': '#!/bin/bash\ncd "{path}"\npython3 main.py'
            },
            'node': {
                'windows': '@echo off\ncd /d "{path}"\nnpm start\npause',
                'unix': '#!/bin/bash\ncd "{path}"\nnpm start'
            },
            'rust': {
                'windows': '@echo off\ncd /d "{path}"\ncargo run\npause',
                'unix': '#!/bin/bash\ncd "{path}"\ncargo run'
            },
            'go': {
                'windows': '@echo off\ncd /d "{path}"\ngo run .\npause',
                'unix': '#!/bin/bash\ncd "{path}"\ngo run .'
            }
        }
    
    def parse_github_url(self, url: str) -> Tuple[str, str]:
        """Parse GitHub URL to extract owner and repo"""
        try:
            # Handle various GitHub URL formats
            if url.startswith('https://github.com/'):
                path = urlparse(url).path.strip('/')
            elif url.startswith('github.com/'):
                path = url.strip('/')
            elif '/' in url and not url.startswith('http'):
                path = url.strip('/')
            else:
                raise ValueError(f"Invalid GitHub URL format: {url}")
            
            parts = path.split('/')
            if len(parts) < 2:
                raise ValueError(f"Invalid GitHub URL: {url}")
            
            owner, repo = parts[0], parts[1]
            
            # Remove .git suffix if present
            if repo.endswith('.git'):
                repo = repo[:-4]
            
            return owner, repo
            
        except Exception as e:
            logger.error(f"Error parsing GitHub URL {url}: {e}")
            raise ValueError(f"Failed to parse GitHub URL: {url}")
    
    def clone_repository(self, url: str, target_dir: Path) -> bool:
        """Clone GitHub repository to target directory"""
        try:
            # Check if git is available
            try:
                subprocess.run(['git', '--version'], capture_output=True, check=True)
            except (subprocess.CalledProcessError, FileNotFoundError):
                raise RuntimeError("Git is not installed or not in PATH")
            
            # Clone the repository
            logger.info(f"Cloning {url} to {target_dir}")
            result = subprocess.run(
                ['git', 'clone', url, str(target_dir)],
                capture_output=True,
                text=True,
                check=True
            )
            
            logger.info(f"Successfully cloned {url}")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Git clone failed: {e.stderr}")
            raise RuntimeError(f"Failed to clone repository: {e.stderr}")
        except Exception as e:
            logger.error(f"Error cloning repository: {e}")
            raise
    
    def detect_project_type(self, project_path: Path) -> str:
        """Detect project type based on files present"""
        try:
            for project_type, patterns in self.project_patterns.items():
                for pattern in patterns:
                    if pattern.startswith('*'):
                        # Handle glob patterns
                        if list(project_path.glob(pattern)):
                            return project_type
                    else:
                        # Handle exact file names
                        if (project_path / pattern).exists():
                            return project_type
            
            # Default to python if no specific type detected
            return 'python'
            
        except Exception as e:
            logger.error(f"Error detecting project type: {e}")
            return 'python'
    
    def install_dependencies(self, project_path: Path, project_type: str) -> bool:
        """Install project dependencies based on type"""
        try:
            logger.info(f"Installing dependencies for {project_type} project")
            
            if project_type == 'python':
                return self._install_python_deps(project_path)
            elif project_type == 'node':
                return self._install_node_deps(project_path)
            elif project_type == 'rust':
                return self._install_rust_deps(project_path)
            elif project_type == 'go':
                return self._install_go_deps(project_path)
            else:
                logger.warning(f"No dependency installation defined for {project_type}")
                return True
                
        except Exception as e:
            logger.error(f"Error installing dependencies: {e}")
            return False
    
    def _install_python_deps(self, project_path: Path) -> bool:
        """Install Python dependencies"""
        try:
            # Try pip install -r requirements.txt first
            requirements_file = project_path / 'requirements.txt'
            if requirements_file.exists():
                subprocess.run(
                    ['pip', 'install', '-r', str(requirements_file)],
                    cwd=project_path,
                    check=True
                )
                return True
            
            # Try pip install -e . for setup.py
            setup_file = project_path / 'setup.py'
            if setup_file.exists():
                subprocess.run(
                    ['pip', 'install', '-e', '.'],
                    cwd=project_path,
                    check=True
                )
                return True
            
            logger.info("No Python dependencies found to install")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Python dependency installation failed: {e}")
            return False
    
    def _install_node_deps(self, project_path: Path) -> bool:
        """Install Node.js dependencies"""
        try:
            package_json = project_path / 'package.json'
            if not package_json.exists():
                logger.info("No package.json found")
                return True
            
            # Try npm install
            subprocess.run(
                ['npm', 'install'],
                cwd=project_path,
                check=True
            )
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Node dependency installation failed: {e}")
            return False
    
    def _install_rust_deps(self, project_path: Path) -> bool:
        """Install Rust dependencies"""
        try:
            cargo_toml = project_path / 'Cargo.toml'
            if not cargo_toml.exists():
                logger.info("No Cargo.toml found")
                return True
            
            # Try cargo build
            subprocess.run(
                ['cargo', 'build'],
                cwd=project_path,
                check=True
            )
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Rust dependency installation failed: {e}")
            return False
    
    def _install_go_deps(self, project_path: Path) -> bool:
        """Install Go dependencies"""
        try:
            go_mod = project_path / 'go.mod'
            if not go_mod.exists():
                logger.info("No go.mod found")
                return True
            
            # Try go mod download
            subprocess.run(
                ['go', 'mod', 'download'],
                cwd=project_path,
                check=True
            )
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Go dependency installation failed: {e}")
            return False
    
    def create_launcher(self, project_path: Path, project_type: str, app_id: str) -> Optional[Path]:
        """Create launcher script for the application"""
        try:
            if project_type not in self.launcher_templates:
                logger.warning(f"No launcher template for {project_type}")
                return None
            
            # Determine platform
            platform = 'windows' if os.name == 'nt' else 'unix'
            template = self.launcher_templates[project_type][platform]
            
            # Create launcher content
            launcher_content = template.format(path=str(project_path))
            
            # Determine launcher file extension
            if platform == 'windows':
                launcher_name = f"{app_id}.bat"
            else:
                launcher_name = f"{app_id}.sh"
            
            launcher_path = self.install_dir / launcher_name
            
            # Write launcher file
            with open(launcher_path, 'w') as f:
                f.write(launcher_content)
            
            # Make executable on Unix
            if platform == 'unix':
                os.chmod(launcher_path, 0o755)
            
            logger.info(f"Created launcher: {launcher_path}")
            return launcher_path
            
        except Exception as e:
            logger.error(f"Error creating launcher: {e}")
            return None
    
    def install_repository(self, url: str) -> Dict:
        """Complete installation process for a GitHub repository"""
        try:
            # Parse URL
            owner, repo = self.parse_github_url(url)
            app_id = f"{owner}_{repo}".replace('-', '_').replace('.', '_')
            
            # Check if already installed
            existing_apps = self.get_installed_apps()
            if any(app['app_id'] == app_id for app in existing_apps):
                return {
                    "success": False,
                    "error": f"Application {app_id} is already installed"
                }
            
            # Create target directory
            target_dir = self.install_dir / app_id
            
            # Clone repository
            if not self.clone_repository(url, target_dir):
                return {
                    "success": False,
                    "error": "Failed to clone repository"
                }
            
            # Detect project type
            project_type = self.detect_project_type(target_dir)
            logger.info(f"Detected project type: {project_type}")
            
            # Install dependencies
            deps_success = self.install_dependencies(target_dir, project_type)
            if not deps_success:
                logger.warning("Dependency installation failed, but continuing")
            
            # Create launcher
            launcher_path = self.create_launcher(target_dir, project_type, app_id)
            
            # Register app
            app_info = {
                "app_id": app_id,
                "owner": owner,
                "repo": repo,
                "url": url,
                "path": str(target_dir),
                "project_type": project_type,
                "installed_at": int(os.path.getctime(target_dir)),
                "launcher": {
                    "path": str(launcher_path) if launcher_path else None,
                    "description": f"Run {project_type} application"
                } if launcher_path else None
            }
            
            # Save to apps registry
            self._save_app_info(app_info)
            
            return {
                "success": True,
                "app_id": app_id,
                "message": f"Successfully installed {owner}/{repo}",
                "app_info": app_info
            }
            
        except Exception as e:
            logger.error(f"Error installing repository {url}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_installed_apps(self) -> List[Dict]:
        """Get list of installed applications"""
        try:
            apps_file = self.install_dir / "apps.json"
            if not apps_file.exists():
                return []
            
            with open(apps_file, 'r') as f:
                return json.load(f)
                
        except Exception as e:
            logger.error(f"Error loading installed apps: {e}")
            return []
    
    def _save_app_info(self, app_info: Dict):
        """Save app information to registry"""
        try:
            apps_file = self.install_dir / "apps.json"
            apps = self.get_installed_apps()
            
            # Remove existing entry if present
            apps = [app for app in apps if app['app_id'] != app_info['app_id']]
            
            # Add new entry
            apps.append(app_info)
            
            # Save to file
            with open(apps_file, 'w') as f:
                json.dump(apps, f, indent=2)
                
        except Exception as e:
            logger.error(f"Error saving app info: {e}")
    
    def uninstall_app(self, app_id: str) -> Dict:
        """Uninstall an application"""
        try:
            apps = self.get_installed_apps()
            app_to_remove = None
            
            for app in apps:
                if app['app_id'] == app_id:
                    app_to_remove = app
                    break
            
            if not app_to_remove:
                return {
                    "success": False,
                    "error": f"Application {app_id} not found"
                }
            
            # Remove directory
            app_path = Path(app_to_remove['path'])
            if app_path.exists():
                shutil.rmtree(app_path)
            
            # Remove launcher
            if app_to_remove.get('launcher', {}).get('path'):
                launcher_path = Path(app_to_remove['launcher']['path'])
                if launcher_path.exists():
                    launcher_path.unlink()
            
            # Remove from registry
            apps = [app for app in apps if app['app_id'] != app_id]
            apps_file = self.install_dir / "apps.json"
            with open(apps_file, 'w') as f:
                json.dump(apps, f, indent=2)
            
            return {
                "success": True,
                "message": f"Successfully uninstalled {app_id}"
            }
            
        except Exception as e:
            logger.error(f"Error uninstalling app {app_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def launch_app(self, app_id: str) -> Dict:
        """Launch an installed application"""
        try:
            apps = self.get_installed_apps()
            app = None
            
            for a in apps:
                if a['app_id'] == app_id:
                    app = a
                    break
            
            if not app:
                return {
                    "success": False,
                    "error": f"Application {app_id} not found"
                }
            
            if not app.get('launcher', {}).get('path'):
                return {
                    "success": False,
                    "error": f"No launcher available for {app_id}"
                }
            
            launcher_path = Path(app['launcher']['path'])
            if not launcher_path.exists():
                return {
                    "success": False,
                    "error": f"Launcher not found: {launcher_path}"
                }
            
            # Launch the application
            if os.name == 'nt':  # Windows
                subprocess.Popen([str(launcher_path)], shell=True)
            else:  # Unix
                subprocess.Popen([str(launcher_path)])
            
            return {
                "success": True,
                "message": f"Launched {app_id}",
                "pid": "unknown"  # Could be enhanced to return actual PID
            }
            
        except Exception as e:
            logger.error(f"Error launching app {app_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
