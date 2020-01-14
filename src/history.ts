import { getRemoteLink } from './remote'
import { GROUP_MAP } from './constant'

let breakingChanges: string[] = []

/**
 * Generate commit history in markdown format
 * @param commits
 * @param useGroup
 */
export const makeHistory = (commits: ICommit[], useGroup: boolean = false) => {
  let history = useGroup ? makeGroupHistory(commits) : makePlainHistory(commits)

  if (breakingChanges.length) {
    history += `\n\n### BREAKING CHANGES`

    breakingChanges.forEach(breakingChange => {
      history += `\n- ${breakingChange}`
    })
  }

  return history
}

/**
 * Group the commits by Conventional Commits guidelines, then
 * output history content by group
 * @param commits
 */
const makeGroupHistory = (commits: ICommit[]) => {
  let groupCommits: string[] = []

  for (let group in GROUP_MAP) {
    const targetGroup = commits.filter(commit =>
      new RegExp(GROUP_MAP[group], 'i').test(commit.type)
    )

    if (targetGroup.length) {
      groupCommits.push(`\n### ${group}`)
      targetGroup.forEach(commit => {
        extractLabels(commit)
        const { hash, shortHash, pureSubject, breakingChange } = commit

        if (breakingChange) {
          breakingChanges.push(breakingChange)
        }

        groupCommits.push(
          `- ${pureSubject} [\`${shortHash}\`](${getRemoteLink().commitLink}/${hash})`
        )
      })
    }
  }

  return groupCommits.join('\n')
}

/**
 * Output history content flatly
 * @param commits
 */
const makePlainHistory = (commits: ICommit[]) => {
  let plainHistory = ''

  commits.forEach(commit => {
    extractLabels(commit)
    const { hash, shortHash, subject, breakingChange } = commit

    if (breakingChange) {
      breakingChanges.push(breakingChange)
    }

    plainHistory += `\n- ${subject} [\`${shortHash}\`](${getRemoteLink().commitLink}/${hash})`
  })

  return plainHistory
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
