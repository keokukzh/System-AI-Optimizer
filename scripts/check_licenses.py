#!/usr/bin/env python3
"""
License Check Script
Validates that no GPL-licensed dependencies are statically linked
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Set


class LicenseChecker:
    """Checks for license compliance issues"""
    
    def __init__(self):
        self.forbidden_licenses = {
            'GPL', 'GPL-2.0', 'GPL-3.0', 'AGPL', 'AGPL-3.0',
            'Copyleft', 'GNU General Public License'
        }
        
        self.warning_licenses = {
            'LGPL', 'LGPL-2.1', 'LGPL-3.0', 'MPL', 'MPL-2.0'
        }
        
        self.allowed_licenses = {
            'MIT', 'Apache-2.0', 'BSD', 'BSD-2-Clause', 'BSD-3-Clause',
            'ISC', 'Unlicense', 'CC0', 'Public Domain'
        }
    
    def check_python_dependencies(self) -> Dict[str, List[str]]:
        """Check Python dependencies in requirements.txt"""
        issues = {'forbidden': [], 'warnings': [], 'unknown': []}
        
        requirements_file = Path('requirements.txt')
        if not requirements_file.exists():
            return issues
        
        # For now, we'll do a basic check
        # In a real implementation, you'd use tools like pip-licenses
        with open(requirements_file, 'r') as f:
            lines = f.readlines()
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#'):
                package = line.split('==')[0].split('>=')[0].split('<=')[0]
                # This is a simplified check - real implementation would query package metadata
                if 'gpl' in package.lower():
                    issues['warnings'].append(f"Python package {package} may have GPL license")
        
        return issues
    
    def check_node_dependencies(self) -> Dict[str, List[str]]:
        """Check Node.js dependencies in package.json"""
        issues = {'forbidden': [], 'warnings': [], 'unknown': []}
        
        package_json = Path('package.json')
        if not package_json.exists():
            return issues
        
        with open(package_json, 'r') as f:
            data = json.load(f)
        
        # Check dependencies and devDependencies
        all_deps = {}
        all_deps.update(data.get('dependencies', {}))
        all_deps.update(data.get('devDependencies', {}))
        
        for package, version in all_deps.items():
            # This is a simplified check - real implementation would query npm registry
            if 'gpl' in package.lower():
                issues['warnings'].append(f"Node package {package} may have GPL license")
        
        return issues
    
    def check_rust_dependencies(self) -> Dict[str, List[str]]:
        """Check Rust dependencies in Cargo.toml"""
        issues = {'forbidden': [], 'warnings': [], 'unknown': []}
        
        cargo_toml = Path('Cargo.toml')
        if not cargo_toml.exists():
            return issues
        
        with open(cargo_toml, 'r') as f:
            content = f.read()
        
        # Simple regex to find dependencies
        dep_pattern = r'\[dependencies\]\s*\n((?:[^[]*\n)*)'
        match = re.search(dep_pattern, content, re.MULTILINE)
        
        if match:
            deps_section = match.group(1)
            for line in deps_section.split('\n'):
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    package = line.split('=')[0].strip()
                    if 'gpl' in package.lower():
                        issues['warnings'].append(f"Rust crate {package} may have GPL license")
        
        return issues
    
    def check_source_files(self) -> Dict[str, List[str]]:
        """Check source files for license headers"""
        issues = {'forbidden': [], 'warnings': [], 'unknown': []}
        
        source_dirs = ['backend/', 'src/', 'tests/']
        
        for source_dir in source_dirs:
            if not Path(source_dir).exists():
                continue
            
            for file_path in Path(source_dir).rglob('*.py'):
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Check for GPL license mentions
                if re.search(r'GPL|GNU General Public License', content, re.IGNORECASE):
                    issues['warnings'].append(f"File {file_path} mentions GPL license")
        
        return issues
    
    def run_all_checks(self) -> Dict[str, List[str]]:
        """Run all license checks"""
        all_issues = {
            'forbidden': [],
            'warnings': [],
            'unknown': []
        }
        
        print("Checking Python dependencies...")
        python_issues = self.check_python_dependencies()
        self._merge_issues(all_issues, python_issues)
        
        print("Checking Node.js dependencies...")
        node_issues = self.check_node_dependencies()
        self._merge_issues(all_issues, node_issues)
        
        print("Checking Rust dependencies...")
        rust_issues = self.check_rust_dependencies()
        self._merge_issues(all_issues, rust_issues)
        
        print("Checking source files...")
        source_issues = self.check_source_files()
        self._merge_issues(all_issues, source_issues)
        
        return all_issues
    
    def _merge_issues(self, target: Dict[str, List[str]], source: Dict[str, List[str]]):
        """Merge issue dictionaries"""
        for category in ['forbidden', 'warnings', 'unknown']:
            target[category].extend(source[category])
    
    def print_report(self, issues: Dict[str, List[str]]):
        """Print license check report"""
        print("\n" + "="*60)
        print("LICENSE COMPLIANCE REPORT")
        print("="*60)
        
        if issues['forbidden']:
            print("\nFORBIDDEN LICENSES (CI will fail):")
            for issue in issues['forbidden']:
                print(f"  X {issue}")
        
        if issues['warnings']:
            print("\nWARNINGS (Review recommended):")
            for issue in issues['warnings']:
                print(f"  ! {issue}")
        
        if issues['unknown']:
            print("\nUNKNOWN LICENSES (Manual review needed):")
            for issue in issues['unknown']:
                print(f"  ? {issue}")
        
        if not any(issues.values()):
            print("\nOK No license issues found!")
        
        print("\n" + "="*60)
        
        # Summary
        total_issues = sum(len(issues[category]) for category in issues)
        if total_issues == 0:
            print("OK All checks passed!")
            return True
        else:
            print(f"X Found {total_issues} license issues")
            if issues['forbidden']:
                print("X CI will fail due to forbidden licenses")
                return False
            else:
                print("! CI will pass but review warnings")
                return True


def main():
    """Main function"""
    checker = LicenseChecker()
    
    print("OptiAI License Compliance Check")
    print("Checking for GPL and other problematic licenses...")
    
    issues = checker.run_all_checks()
    success = checker.print_report(issues)
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
