import * as core from '@actions/core';
import * as github from '@actions/github';
import { generateReleaseNotes } from './releaseNotes';
import { loadConfig } from './config';

async function run(): Promise<void> {
  try {
    const token = core.getInput('token', { required: true });
    const repository = core.getInput('repository') || github.context.repo.owner + '/' + github.context.repo.repo;
    const tag = core.getInput('tag');
    const previousTag = core.getInput('previous-tag');
    const configFile = core.getInput('config-file');
    const includeCommits = core.getInput('include-commits') === 'true';
    const includePullRequests = core.getInput('include-pull-requests') === 'true';
    const includeContributors = core.getInput('include-contributors') === 'true';
    const categorize = core.getInput('categorize') === 'true';
    const outputFile = core.getInput('output-file');
    const template = core.getInput('template');

    const config = await loadConfig(configFile);

    const result = await generateReleaseNotes({
      token,
      repository,
      tag,
      previousTag,
      config,
      includeCommits,
      includePullRequests,
      includeContributors,
      categorize,
      template
    });

    core.setOutput('release-notes', result.releaseNotes);
    core.setOutput('contributors', JSON.stringify(result.contributors));
    core.setOutput('summary', result.summary);

    if (outputFile) {
      const fs = require('fs');
      fs.writeFileSync(outputFile, result.releaseNotes);
      core.info(`Release notes written to ${outputFile}`);
    }

    const summary = core.summary
      .addHeading('Release Notes Generated')
      .addRaw(result.releaseNotes)
      .addBreak()
      .addRaw(`Contributors: ${result.contributors.length}`)
      .addBreak();
    
    await summary.write();

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();
