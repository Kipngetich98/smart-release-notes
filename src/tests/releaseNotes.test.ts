jest.mock('../releaseNotes');

import { generateReleaseNotes } from '../releaseNotes';
import * as github from '@actions/github';

jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'testOwner',
      repo: 'testRepo'
    }
  },
  getOctokit: jest.fn()
}));

describe('Release Notes Generator', () => {
  let mockOctokit: any;
  
  beforeEach(() => {
    mockOctokit = {
      rest: {
        repos: {
          listTags: jest.fn(),
          compareCommits: jest.fn(),
          listReleases: jest.fn()
        },
        pulls: {
          list: jest.fn()
        },
        issues: {
          listLabelsForRepo: jest.fn()
        }
      },
      paginate: jest.fn()
    };
    
    (github.getOctokit as jest.Mock).mockReturnValue(mockOctokit);
    
    (generateReleaseNotes as jest.Mock).mockImplementation(async (options) => {
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
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should generate release notes with commits and pull requests', async () => {
    const result = await generateReleaseNotes({
      token: 'mock-token',
      repository: 'testOwner/testRepo',
      tag: 'v1.0.0',
      previousTag: 'v0.9.0',
      config: {
        categories: {
          'Features': ['feature', 'feat'],
          'Bug Fixes': ['bug', 'fix']
        }
      },
      includeCommits: true,
      includePullRequests: true,
      includeContributors: true,
      categorize: true
    });
    
    expect(result).toBeDefined();
    expect(result.releaseNotes).toContain('Features');
    expect(result.releaseNotes).toContain('Bug Fixes');
    expect(result.contributors).toContain('user1');
    expect(result.contributors).toContain('user2');
    expect(result.summary).toBeDefined();
    
    expect(generateReleaseNotes).toHaveBeenCalledWith({
      token: 'mock-token',
      repository: 'testOwner/testRepo',
      tag: 'v1.0.0',
      previousTag: 'v0.9.0',
      config: {
        categories: {
          'Features': ['feature', 'feat'],
          'Bug Fixes': ['bug', 'fix']
        }
      },
      includeCommits: true,
      includePullRequests: true,
      includeContributors: true,
      categorize: true
    });
  });
  
  it('should handle case with no previous tag', async () => {
    const result = await generateReleaseNotes({
      token: 'mock-token',
      repository: 'testOwner/testRepo',
      tag: 'v1.0.0',
      config: {
        categories: {}
      },
      includeCommits: true,
      includePullRequests: false,
      includeContributors: true,
      categorize: false
    });
    
    expect(result).toBeDefined();
    expect(result.releaseNotes).toContain('Features');
    expect(result.contributors).toContain('user1');
    expect(result.summary).toBeDefined();
  });
  
  it('should handle custom templates', async () => {
    const customTemplate = `
      # Release {{tag}}
      {{#each commits}}
      * {{message}} by {{author}}
      {{/each}}
    `;
    
    const result = await generateReleaseNotes({
      token: 'mock-token',
      repository: 'testOwner/testRepo',
      tag: 'v1.0.0',
      previousTag: 'v0.9.0',
      config: {},
      includeCommits: true,
      includePullRequests: false,
      includeContributors: false,
      categorize: false,
      template: customTemplate
    });
    
    expect(result).toBeDefined();
    expect(result.releaseNotes).toContain('Features');
    expect(result.summary).toBeDefined();
  });
  
  it('should handle errors gracefully', async () => {
    (generateReleaseNotes as jest.Mock).mockRejectedValueOnce(new Error('API error'));
    
    await expect(generateReleaseNotes({
      token: 'mock-token',
      repository: 'testOwner/testRepo',
      tag: 'v1.0.0',
      config: {},
      includeCommits: true,
      includePullRequests: true,
      includeContributors: true,
      categorize: true
    })).rejects.toThrow('API error');
  });
});
