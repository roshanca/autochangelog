import { getRemoteLink } from './remote'

const GROUP_MAP: Record<string, string> = {
  'Bug Fixes': '^fix(e(d|s))?$',
  Features: '^(feat(ure)?|updated?|new)$',
  Chores: '^(chores?)$'
}

/**
 * Generate commit history of version in markdown format
 * @param commits
 * @param useGroup
 */
export const makeHistory = (commits: ICommit[], useGroup: boolean = false) => {
  let history = ''
  let breakingChanges: string[] = []

  if (useGroup) {
    history = groupHistory(commits).join('\n')
  } else {
    commits.forEach(commit => {
      const { hash, shortHash, subject, breakingChange } = commit

      if (breakingChange) {
        breakingChanges.push(breakingChange)
      }

      history += `- ${subject} [\`${shortHash}\`](${getRemoteLink().commitLink}/${hash})\n`
    })
  }

  if (breakingChanges.length) {
    history += `### BREAKING CHANGES\n`

    breakingChanges.forEach(breakingChange => {
      history += `- ${breakingChange}\n`
    })
  }

  return history
}

const groupHistory = (commits: ICommit[]) => {
  let groupCommits: string[] = []

  for (let group in GROUP_MAP) {
    const targetGroup = commits.filter(commit =>
      new RegExp(GROUP_MAP[group], 'i').test(commit.type)
    )

    if (targetGroup.length) {
      groupCommits.push(`### ${group}\n`)
      targetGroup.forEach(commit => {
        const { hash, shortHash, pureSubject } = commit

        groupCommits.push(
          `- ${pureSubject} [\`${shortHash}\`](${getRemoteLink().commitLink}/${hash})\n`
        )
      })
    }
  }

  return groupCommits
}
