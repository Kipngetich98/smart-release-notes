# Smart Release Notes Generator

Smart Release Notes Generator is a GitHub Action that automatically generates comprehensive release notes from your GitHub repository. It supports categorizing changes, including commits, pull requests, and contributors, and allows customization through templates.

## Features

- Automatically generate release notes from tags
- Include commits, pull requests, and contributors
- Categorize changes based on labels or commit messages
- Customizable templates using Handlebars
- Outputs release notes in markdown format
- Supports GitHub Actions step summary

## Installation

To use the Smart Release Notes Generator in your GitHub Actions workflow, add the following step:

```yaml
- name: Generate Release Notes
  uses: Kipngetich98/smart-release-notes@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    repository: ${{ github.repository }}
    tag: ${{ github.ref }}
```

## Usage Examples

### Basic Usage

```yaml
- name: Generate Release Notes
  uses: Kipngetich98/smart-release-notes@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
```

### Custom Configuration

```yaml
- name: Generate Release Notes
  uses: Kipngetich98/smart-release-notes@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    config-file: '.github/release-notes-config.yml'
    include-commits: 'true'
    include-pull-requests: 'true'
    include-contributors: 'true'
    categorize: 'true'
    template: 'custom-template.hbs'
```

## Badges

![Build Status](https://github.com/Kipngetich98/smart-release-notes/actions/workflows/ci.yml/badge.svg)
![Test Coverage](https://img.shields.io/coveralls/github/Kipngetich98/smart-release-notes)
![Marketplace](https://img.shields.io/badge/marketplace-smart--release--notes-blue)

## Comparison with Alternatives

- **Smart Release Notes Generator**: Focuses on customization and categorization
- **Other Tools**: May lack template customization or categorization features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## Security

See [SECURITY.md](SECURITY.md) for security policies and reporting vulnerabilities.

## Support

For support, please open an issue on GitHub.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes to the project.
