# Contributing to Smart Release Notes

Thank you for your interest in contributing to Smart Release Notes! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report:

- Check the [existing issues](https://github.com/Kipngetich98/smart-release-notes/issues) to see if the problem has already been reported
- If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/Kipngetich98/smart-release-notes/issues/new?template=bug_report.md)

When creating a bug report, please include as much detail as possible:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots or logs if applicable
- Your environment (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues:

- Check the [existing issues](https://github.com/Kipngetich98/smart-release-notes/issues) to see if the enhancement has already been suggested
- If not, [open a new issue](https://github.com/Kipngetich98/smart-release-notes/issues/new?template=feature_request.md)

When suggesting an enhancement, please include:

- A clear and descriptive title
- A detailed description of the proposed functionality
- Any potential implementation details you can think of
- Why this enhancement would be useful to most users

### Pull Requests

1. Fork the repository
2. Create a new branch from `main` for your changes
3. Make your changes
4. Run tests and ensure they pass
5. Submit a pull request

#### Pull Request Guidelines

- Follow the TypeScript coding style
- Write or update tests for the changes you make
- Update documentation as needed
- Include a descriptive commit message
- Link any relevant issues in the PR description

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Kipngetich98/smart-release-notes.git
   cd smart-release-notes
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
   ```

## Project Structure

- `src/` - TypeScript source code
- `dist/` - Compiled JavaScript (generated)
- `.github/` - GitHub-specific files (workflows, templates)
- `__tests__/` - Test files

## Testing

We use Jest for testing. Run the tests with:

```bash
npm test
```

## Releasing

This project follows semantic versioning. The release process is automated using GitHub Actions.

## Questions?

If you have any questions, feel free to [open an issue](https://github.com/Kipngetich98/smart-release-notes/issues/new) with the "question" label.

Thank you for contributing to Smart Release Notes!
