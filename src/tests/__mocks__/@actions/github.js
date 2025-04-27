module.exports = {
  context: {
    repo: {
      owner: 'testOwner',
      repo: 'testRepo'
    }
  },
  getOctokit: jest.fn().mockImplementation(() => ({
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
  }))
};
