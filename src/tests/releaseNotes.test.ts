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
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should generate release notes with commits and pull requests', async () => {
    mockOctokit.rest.repos.listTags.mockResolvedValue({
      data: [
        { name: 'v1.0.0', commit: { sha: 'abc123' } },
        { name: 'v0.9.0', commit: { sha: 'def456' } }
      ]
    });
    
    mockOctokit.rest.repos.compareCommits.mockResolvedValue({
      data: {
        commits: [
          {
            sha: 'commit1',
            commit: {
              message: 'feat: Add new feature',
              author: { name: 'User1', email: 'user1@example.com' }
            },
            author: { login: 'user1' }
          },
          {
            sha: 'commit2',
            commit: {
              message: 'fix: Fix bug',
              author: { name: 'User2', email: 'user2@example.com' }
            },
            author: { login: 'user2' }
          }
        ]
      }
    });
    
    mockOctokit.paginate.mockResolvedValue([
      {
        number: 1,
        title: 'Add new feature',
        user: { login: 'user1' },
        labels: [{ name: 'feature' }],
        merged_at: '2023-01-01T00:00:00Z'
      },
      {
        number: 2,
        title: 'Fix bug',
        user: { login: 'user2' },
        labels: [{ name: 'bug' }],
        merged_at: '2023-01-02T00:00:00Z'
      }
    ]);
    
    mockOctokit.rest.issues.listLabelsForRepo.mockResolvedValue({
      data: [
        { name: 'feature' },
        { name: 'bug' }
      ]
    });
    
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
    
    expect(mockOctokit.rest.repos.compareCommits).toHaveBeenCalledWith({
      owner: 'testOwner',
      repo: 'testRepo',
      base: 'def456',
      head: 'abc123'
    });
    
    expect(mockOctokit.paginate).toHaveBeenCalled();
  });
  
  it('should handle case with no previous tag', async () => {
    mockOctokit.rest.repos.listTags.mockResolvedValue({
      data: [
        { name: 'v1.0.0', commit: { sha: 'abc123' } }
      ]
    });
    
    mockOctokit.rest.repos.compareCommits.mockResolvedValue({
      data: {
        commits: [
          {
            sha: 'commit1',
            commit: {
              message: 'Initial commit',
              author: { name: 'User1', email: 'user1@example.com' }
            },
            author: { login: 'user1' }
          }
        ]
      }
    });
    
    mockOctokit.paginate.mockResolvedValue([]);
    
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
    expect(result.releaseNotes).toContain('Initial commit');
    expect(result.contributors).toContain('user1');
    expect(result.summary).toBeDefined();
  });
  
  it('should handle custom templates', async () => {
    mockOctokit.rest.repos.listTags.mockResolvedValue({
      data: [
        { name: 'v1.0.0', commit: { sha: 'abc123' } },
        { name: 'v0.9.0', commit: { sha: 'def456' } }
      ]
    });
    
    mockOctokit.rest.repos.compareCommits.mockResolvedValue({
      data: {
        commits: [
          {
            sha: 'commit1',
            commit: {
              message: 'feat: Add new feature',
              author: { name: 'User1', email: 'user1@example.com' }
            },
            author: { login: 'user1' }
          }
        ]
      }
    });
    
    mockOctokit.paginate.mockResolvedValue([]);
    
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
    expect(result.releaseNotes).toContain('Release v1.0.0');
    expect(result.releaseNotes).toContain('Add new feature');
    expect(result.releaseNotes).toContain('User1');
  });
  
  it('should handle errors gracefully', async () => {
    mockOctokit.rest.repos.listTags.mockRejectedValue(new Error('API error'));
    
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
