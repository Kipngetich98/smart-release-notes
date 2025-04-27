import * as core from '@actions/core';
import * as github from '@actions/github';
import { generateReleaseNotes } from '../releaseNotes';
import { loadConfig } from '../config';

jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'testOwner',
      repo: 'testRepo'
    }
  }
}));

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  summary: {
    addHeading: jest.fn().mockReturnThis(),
    addRaw: jest.fn().mockReturnThis(),
    addBreak: jest.fn().mockReturnThis(),
    write: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('../releaseNotes', () => ({
  generateReleaseNotes: jest.fn()
}));

jest.mock('../config', () => ({
  loadConfig: jest.fn()
}));

describe('GitHub Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set outputs correctly when release notes are generated', async () => {
    (core.getInput as jest.Mock).mockImplementation((name) => {
      switch (name) {
        case 'token':
          return 'mock-token';
        case 'repository':
          return 'testOwner/testRepo';
        case 'include-commits':
        case 'include-pull-requests':
        case 'include-contributors':
        case 'categorize':
          return 'true';
        default:
          return '';
      }
    });

    (loadConfig as jest.Mock).mockResolvedValue({
      categories: {
        'Features': ['feature', 'feat'],
        'Bug Fixes': ['bug', 'fix']
      }
    });

    const mockReleaseNotes = '## Release Notes\n\nSome content';
    const mockContributors = ['user1', 'user2'];
    const mockSummary = 'Generated release notes with 5 commits';

    (generateReleaseNotes as jest.Mock).mockResolvedValue({
      releaseNotes: mockReleaseNotes,
      contributors: mockContributors,
      summary: mockSummary
    });

    const { run } = require('../index');
    await run();

    expect(core.setOutput).toHaveBeenCalledWith('release-notes', mockReleaseNotes);
    expect(core.setOutput).toHaveBeenCalledWith('contributors', JSON.stringify(mockContributors));
    expect(core.setOutput).toHaveBeenCalledWith('summary', mockSummary);

    expect(core.summary.addHeading).toHaveBeenCalledWith('Release Notes Generated');
    expect(core.summary.addRaw).toHaveBeenCalledWith(mockReleaseNotes);
    expect(core.summary.write).toHaveBeenCalled();
  });

  it('should handle errors correctly', async () => {
    const errorMessage = 'Test error';
    (generateReleaseNotes as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { run } = require('../index');
    await run();

    expect(core.setFailed).toHaveBeenCalledWith(errorMessage);
  });
});
