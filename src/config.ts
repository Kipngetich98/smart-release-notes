import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export async function loadConfig(configPath?: string): Promise<any> {
  if (!configPath) {
    return getDefaultConfig();
  }

  try {
    if (!fs.existsSync(configPath)) {
      core.info(`Config file not found at ${configPath}, using default configuration`);
      return getDefaultConfig();
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    const fileExtension = path.extname(configPath).toLowerCase();
    
    let config;
    if (fileExtension === '.yml' || fileExtension === '.yaml') {
      config = yaml.load(configContent);
    } else if (fileExtension === '.json') {
      config = JSON.parse(configContent);
    } else {
      throw new Error(`Unsupported config file format: ${fileExtension}`);
    }

    return { ...getDefaultConfig(), ...config };
  } catch (error) {
    core.warning(`Error loading config file: ${error instanceof Error ? error.message : String(error)}`);
    return getDefaultConfig();
  }
}

function getDefaultConfig(): any {
  return {
    categories: {
      'Features': ['feature', 'feat', 'enhancement'],
      'Bug Fixes': ['bug', 'fix', 'bugfix'],
      'Documentation': ['docs', 'documentation'],
      'Maintenance': ['chore', 'build', 'ci'],
      'Refactoring': ['refactor'],
      'Tests': ['test', 'tests']
    },
    ignoreCommits: [
      'chore(release):',
      'chore(deps):',
      'Merge pull request',
      'Merge branch'
    ],
    ignoreLabels: [
      'duplicate',
      'wontfix',
      'invalid'
    ],
    template: null, // Use default template
    transformers: {
    }
  };
}
