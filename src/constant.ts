export const DEFAULT_OPTIONS: Record<string, any> = {
  OUTPUT: 'CHANGELOG.md',
  COMMIT_LIMIT: 5,
  VERSION_LIMIT: 20
}

export const ERR_MSG: Record<string, string> = {
  NO_GIT: `It can't be done because this is not a git project.`,
  NO_TAG: 'Please create some tags first.'
}

export const REMOTE_PATH_DEF: Record<string, string[]> = {
  GITHUB: ['commit', 'issues', 'pull', 'compare'],
  GITLAB: ['commit', 'issues', 'merge_requests', 'compare'],
  BITBUCKET: ['commits', 'issues', 'pull-requests', 'compare']
}

export const GROUP_MAP: Record<string, string> = {
  'Bug Fixes': '^fix(e(d|s))?$',
  Features: '^(feat(ure)?|updated?|new)$',
  Chores: '^(chores?)$'
}
