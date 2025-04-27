import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

interface ReleaseNotesOptions {
  token: string;
  repository: string;
  tag?: string;
  previousTag?: string;
  config: any;
  includeCommits: boolean;
  includePullRequests: boolean;
  includeContributors: boolean;
  categorize: boolean;
  template?: string;
}

interface ReleaseNotesResult {
  releaseNotes: string;
  contributors: string[];
  summary: string;
}

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  category?: string;
}

interface PullRequest {
  number: number;
  title: string;
  author: string;
  url: string;
  merged_at: string;
  labels: string[];
  category?: string;
}

export async function generateReleaseNotes(options: ReleaseNotesOptions): Promise<ReleaseNotesResult> {
  const [owner, repo] = options.repository.split('/');
  const octokit = new Octokit({ auth: options.token });

  const currentTag = options.tag || await getLatestTag(octokit, owner, repo);
  const previousTag = options.previousTag || await getPreviousTag(octokit, owner, repo, currentTag);

  core.info(`Generating release notes from ${previousTag} to ${currentTag}`);

  const commits = options.includeCommits 
    ? await getCommitsBetweenTags(octokit, owner, repo, previousTag, currentTag) 
    : [];
  
  const pullRequests = options.includePullRequests 
    ? await getPullRequestsBetweenTags(octokit, owner, repo, previousTag, currentTag) 
    : [];

  const contributors = options.includeContributors 
    ? await getContributors(commits, pullRequests) 
    : [];

  if (options.categorize) {
    categorizeChanges(commits, pullRequests, options.config);
  }

  const releaseNotes = await renderReleaseNotes({
    currentTag,
    previousTag,
    commits,
    pullRequests,
    contributors,
    template: options.template,
    config: options.config
  });

  const summary = generateSummary(commits, pullRequests, contributors);

  return {
    releaseNotes,
    contributors,
    summary
  };
}

async function getLatestTag(octokit: Octokit, owner: string, repo: string): Promise<string> {
  try {
    const { data: tags } = await octokit.repos.listTags({
      owner,
      repo,
      per_page: 1
    });

    if (tags.length === 0) {
      throw new Error('No tags found in the repository');
    }

    return tags[0].name;
  } catch (error) {
    throw new Error(`Failed to get latest tag: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function getPreviousTag(octokit: Octokit, owner: string, repo: string, currentTag: string): Promise<string> {
  try {
    const { data: tags } = await octokit.repos.listTags({
      owner,
      repo,
      per_page: 10
    });

    if (tags.length <= 1) {
      return 'HEAD~100'; // Fallback if no previous tag exists
    }

    const currentTagIndex = tags.findIndex(tag => tag.name === currentTag);
    const previousTagIndex = currentTagIndex === -1 ? 0 : currentTagIndex + 1;

    return previousTagIndex < tags.length ? tags[previousTagIndex].name : 'HEAD~100';
  } catch (error) {
    throw new Error(`Failed to get previous tag: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function getCommitsBetweenTags(
  octokit: Octokit, 
  owner: string, 
  repo: string, 
  previousTag: string, 
  currentTag: string
): Promise<Commit[]> {
  try {
    const { data: comparison } = await octokit.repos.compareCommits({
      owner,
      repo,
      base: previousTag,
      head: currentTag
    });

    return comparison.commits.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author?.name || 'Unknown',
      date: commit.commit.author?.date || new Date().toISOString(),
      url: commit.html_url
    }));
  } catch (error) {
    core.warning(`Failed to get commits between tags: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

async function getPullRequestsBetweenTags(
  octokit: Octokit, 
  owner: string, 
  repo: string, 
  previousTag: string, 
  currentTag: string
): Promise<PullRequest[]> {
  try {
    const { data: prevTagCommit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: (await octokit.git.getRef({
        owner,
        repo,
        ref: `tags/${previousTag.replace(/^refs\/tags\//, '')}`
      })).data.object.sha
    });

    const { data: currTagCommit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: (await octokit.git.getRef({
        owner,
        repo,
        ref: `tags/${currentTag.replace(/^refs\/tags\//, '')}`
      })).data.object.sha
    });

    const prevDate = new Date(prevTagCommit.author.date);
    const currDate = new Date(currTagCommit.author.date);

    const { data: prs } = await octokit.pulls.list({
      owner,
      repo,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: 100
    });

    return prs
      .filter(pr => {
        if (!pr.merged_at) return false;
        const mergedDate = new Date(pr.merged_at);
        return mergedDate > prevDate && mergedDate <= currDate;
      })
      .map(pr => ({
        number: pr.number,
        title: pr.title,
        author: pr.user?.login || 'Unknown',
        url: pr.html_url,
        merged_at: pr.merged_at || '',
        labels: pr.labels.map(label => label.name || '')
      }));
  } catch (error) {
    core.warning(`Failed to get pull requests between tags: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

async function getContributors(commits: Commit[], pullRequests: PullRequest[]): Promise<string[]> {
  const contributorsSet = new Set<string>();
  
  commits.forEach(commit => {
    if (commit.author && commit.author !== 'Unknown') {
      contributorsSet.add(commit.author);
    }
  });
  
  pullRequests.forEach(pr => {
    if (pr.author && pr.author !== 'Unknown') {
      contributorsSet.add(pr.author);
    }
  });
  
  return Array.from(contributorsSet);
}

function categorizeChanges(commits: Commit[], pullRequests: PullRequest[], config: any): void {
  const categories = config?.categories || {
    'feature': ['feature', 'feat', 'enhancement'],
    'bug': ['bug', 'fix', 'bugfix'],
    'documentation': ['docs', 'documentation'],
    'chore': ['chore', 'build', 'ci'],
    'refactor': ['refactor'],
    'test': ['test', 'tests']
  };

  commits.forEach(commit => {
    const message = commit.message.toLowerCase();
    let matched = false;
    
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords as string[]) {
        if (message.startsWith(`${keyword}:`) || message.startsWith(`${keyword}(`)) {
          commit.category = category;
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    
    if (!matched) {
      commit.category = 'other';
    }
  });

  pullRequests.forEach(pr => {
    let matched = false;
    
    for (const [category, keywords] of Object.entries(categories)) {
      for (const label of pr.labels) {
        if ((keywords as string[]).some(keyword => label.toLowerCase().includes(keyword))) {
          pr.category = category;
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    
    if (!matched) {
      const title = pr.title.toLowerCase();
      for (const [category, keywords] of Object.entries(categories)) {
        for (const keyword of keywords as string[]) {
          if (title.startsWith(`${keyword}:`) || title.startsWith(`${keyword}(`)) {
            pr.category = category;
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }
    
    if (!matched) {
      pr.category = 'other';
    }
  });
}

async function renderReleaseNotes(data: {
  currentTag: string;
  previousTag: string;
  commits: Commit[];
  pullRequests: PullRequest[];
  contributors: string[];
  template?: string;
  config: any;
}): Promise<string> {
  let templateContent: string;
  
  if (data.template) {
    templateContent = data.template;
  } else {
    templateContent = `
# Release Notes for {{currentTag}}

{{#if commits.length}}
## Commits

{{#each commitsByCategory}}
### {{@key}}

{{#each this}}
- {{message}} ([{{sha}}]({{url}})) by {{author}}
{{/each}}

{{/each}}
{{/if}}

{{#if pullRequests.length}}
## Pull Requests

{{#each prsByCategory}}
### {{@key}}

{{#each this}}
- #{{number}} {{title}} ([PR]({{url}})) by {{author}}
{{/each}}

{{/each}}
{{/if}}

{{#if contributors.length}}
## Contributors

{{#each contributors}}
- {{this}}
{{/each}}
{{/if}}

## Compare

[Full Changelog](https://github.com/{{repository}}/compare/{{previousTag}}...{{currentTag}})
`;
  }

  const commitsByCategory: Record<string, Commit[]> = {};
  const prsByCategory: Record<string, PullRequest[]> = {};
  
  data.commits.forEach(commit => {
    const category = commit.category || 'other';
    if (!commitsByCategory[category]) {
      commitsByCategory[category] = [];
    }
    commitsByCategory[category].push(commit);
  });
  
  data.pullRequests.forEach(pr => {
    const category = pr.category || 'other';
    if (!prsByCategory[category]) {
      prsByCategory[category] = [];
    }
    prsByCategory[category].push(pr);
  });

  const template = Handlebars.compile(templateContent);
  return template({
    currentTag: data.currentTag,
    previousTag: data.previousTag,
    commits: data.commits,
    pullRequests: data.pullRequests,
    contributors: data.contributors,
    commitsByCategory,
    prsByCategory,
    repository: process.env.GITHUB_REPOSITORY || 'owner/repo'
  });
}

function generateSummary(commits: Commit[], pullRequests: PullRequest[], contributors: string[]): string {
  return `Generated release notes with ${commits.length} commits, ${pullRequests.length} pull requests, and ${contributors.length} contributors.`;
}
