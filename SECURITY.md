# Security Policy

## Supported Versions

We actively support the following versions of OptiAI with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of OptiAI seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT create a public GitHub issue

Public disclosure of security vulnerabilities puts the entire community at risk. Please report vulnerabilities privately.

### 2. Report via GitHub Security Advisories (Recommended)

1. Go to the [Security Advisories](https://github.com/keokukzh/System-AI-Optimizer/security/advisories) page
2. Click "Report a vulnerability"
3. Fill out the form with details about the vulnerability
4. Submit the report

### 3. Alternative: Email Report

If you prefer, you can email security reports to the maintainers. Include:

- **Type of vulnerability** (e.g., SQL injection, XSS, privilege escalation)
- **Full paths** of source files related to the vulnerability
- **Location** of the affected code (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the vulnerability
- **Proof-of-concept or exploit code** (if possible)
- **Impact** of the vulnerability
- **Suggested remediation** (if any)

### What to Include in Your Report

A good security report should include:

1. **Description**: Clear description of the vulnerability
2. **Impact**: What an attacker could do with this vulnerability
3. **Reproduction Steps**: Detailed steps to reproduce the issue
4. **Environment**: OS, browser, version of OptiAI affected
5. **Severity**: Your assessment (Critical, High, Medium, Low)
6. **Proposed Fix**: If you have suggestions for remediation

### Response Timeline

- **Initial Response**: Within 48 hours of receiving your report
- **Status Update**: Within 7 days with our assessment and planned timeline
- **Fix Timeline**: Critical vulnerabilities will be patched within 30 days
- **Public Disclosure**: Coordinated with the reporter after a fix is available

### Security Measures in OptiAI

OptiAI implements several security measures:

1. **Policy-Based Access Control**: All file operations validated against `policy.yaml`
2. **Protected Paths**: System directories are automatically protected
3. **Input Validation**: All user inputs and LLM outputs are validated
4. **Quarantine System**: Deleted files quarantined before permanent removal
5. **Encrypted Storage**: Sensitive data stored with AES-256-GCM encryption
6. **No Shell Commands**: File operations use Python stdlib only
7. **Dependency Scanning**: Automated scanning via Dependabot and security audits

### Security Best Practices for Users

1. **Keep OptiAI Updated**: Always use the latest version
2. **Review Suggestions**: Carefully review AI-generated suggestions before executing
3. **Use Protected Paths**: Keep important data in protected system directories
4. **Regular Backups**: Maintain regular backups of important data
5. **Verify Sources**: Only install OptiAI from official releases
6. **Check Checksums**: Verify release checksums before installation

### Security Audit History

We maintain a history of security audits and findings:

- **No known vulnerabilities** as of the initial release

### Bug Bounty Program

We currently do not have a formal bug bounty program, but we deeply appreciate security researchers who responsibly disclose vulnerabilities. We will:

- Acknowledge your contribution in our release notes (if desired)
- Credit you in our security advisories (if desired)
- Work with you on responsible disclosure timelines

### Questions?

If you have questions about this security policy or OptiAI's security in general, please:

1. Check the [FAQ](FAQ.md)
2. Review the [documentation](README.md)
3. Open a general discussion (for non-vulnerability questions only)

Thank you for helping keep OptiAI and our community safe!
