export const generateReleaseNotes = jest.fn().mockImplementation(async (options) => {
  return {
    releaseNotes: `# Release Notes for ${options.tag || 'v1.0.0'}
    
## Features
- Feature 1
- Feature 2

## Bug Fixes
- Bug fix 1
- Bug fix 2

## Contributors
- user1
- user2
    `,
    contributors: ['user1', 'user2'],
    summary: `Generated release notes with 2 commits, 2 pull requests, and 2 contributors.`
  };
});
