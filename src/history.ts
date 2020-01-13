import { getRemoteLink } from './remote'
import { GROUP_MAP } from './constant'

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
      extractLabels(commit)
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

/**
 * Group the commits by Conventional Commits guidelines
 * @param commits
 */
const groupHistory = (commits: ICommit[]) => {
  let groupCommits: string[] = []

  for (let group in GROUP_MAP) {
    const targetGroup = commits.filter(commit =>
      new RegExp(GROUP_MAP[group], 'i').test(commit.type)
    )

    if (targetGroup.length) {
      groupCommits.push(`### ${group}\n`)
      targetGroup.forEach(commit => {
        extractLabels(commit)
        const { hash, shortHash, pureSubject } = commit

        groupCommits.push(
          `- ${pureSubject} [\`${shortHash}\`](${getRemoteLink().commitLink}/${hash})\n`
        )
      })
    }
  }

  return groupCommits
}

/**
 * Extract ref labels of issues and merge requests that in body to subject
 * @param commit
 */
const extractLabels = (commit: ICommit) => {
  const { body } = commit

  const reg = /(?:(?<![/\w-.])\w[\w-.]+\/\w[\w-.]+|\B)[#|\!][1-9]\d*\b/g
  const labels = body.match(reg)

  if (labels !== null) {
    commit.subject += labels.join(' ')
    commit.pureSubject += labels.join(' ')
  }
}
