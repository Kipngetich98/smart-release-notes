# Security Policy

## Supported Versions

We currently support the following versions of Smart Release Notes with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Smart Release Notes seriously. If you believe you've found a security vulnerability, please follow these steps:

1. **Do not disclose the vulnerability publicly**
2. **Email the details to [kiruivinie1@gmail.com]** (replace with actual contact)
   - Provide a detailed description of the vulnerability
   - Include steps to reproduce the issue
   - Attach any proof-of-concept code if applicable
   - Let us know how you'd like to be credited (if desired)

## What to expect

- We will acknowledge receipt of your vulnerability report within 48 hours
- We will provide an initial assessment of the report within 5 business days
- We aim to release a fix for verified vulnerabilities within 30 days
- We will keep you informed of our progress throughout the process
- After the issue is resolved, we will publicly acknowledge your responsible disclosure (unless you prefer to remain anonymous)

## Security Best Practices for Users

When using Smart Release Notes:

1. Always use the latest version of the action
2. Use a specific version tag (e.g., `@v1.2.3`) rather than a major version tag (`@v1`) in your workflows
3. Use the minimum required permissions for the GitHub token
4. Review the action's code before using it in sensitive environments
5. Monitor your workflow logs for unexpected behavior

## Security Measures

Smart Release Notes implements the following security measures:

1. All dependencies are regularly updated and scanned for vulnerabilities
2. Code is reviewed for security issues before release
3. We use CodeQL for static code analysis
4. We follow GitHub's security best practices for Actions
