import { readdirSync } from 'fs'
import { default as cmp } from 'semver-compare'
import { parseCommit } from './commit'
import { makeHistory } from './history'
import { getRemoteLink } from './remote'
import { fsExistsSync, getExecResult, cleanTag } from './utils'
import { ERR_MSG } from './constant'

// absolute path of current project
const rootDir = process.cwd()
const gitDir = `${rootDir}/.git`
const gitTagDir = `${gitDir}/refs/tags`
let gitTags: string[]
let versions: IVersion[] = []
let logs: string[] = []

const compare = (tag1: string, tag2: string) => {
  tag1 = cleanTag(tag1)
  tag2 = cleanTag(tag2)

  if (!tag1 || !tag2) {
    return 0
  }

  return cmp(tag1, tag2)
}

export const generateBaseTags = (options: Partial<IOption>) => {
  if (!fsExistsSync(gitTagDir)) {
    throw ERR_MSG.NO_GIT
  }

  if (fsExistsSync(gitTagDir)) {
    gitTags = readdirSync(gitTagDir)
    if (!gitTags.length) {
      throw ERR_MSG.NO_TAG
    }
  } else {
    throw ERR_MSG.NO_TAG
  }

  // uniq
  gitTags = [...new Set(gitTags)]

  // descending sort
  gitTags = gitTags.sort(compare).reverse()

  try {
    const firstTag = gitTags[gitTags.length - 1]
    // const rootCommit = getExecResult('git rev-list --max-parents=0 HEAD')
    const firstTagIsoDate = getExecResult(`git log -1 --pretty="%ci" ${firstTag}`)

    gitTags.reduce((prev, next) => {
      const isoDate = getExecResult(`git log -1 --pretty="%ci" ${prev}`)

      versions.push({
        name: prev,
        diff: `${next}...${prev}`,
        date: isoDate.split(' ')[0] || ''
      })

      return next
    })

    versions.push({
      name: firstTag,
      diff: firstTag,
      date: firstTagIsoDate.split(' ')[0] || ''
    })

    // version max limit
    if (options.versionLimit && versions.length > options.versionLimit) {
      versions = versions.slice(0, options.versionLimit)
    }

    versions = versions.map((version: IVersion) => {
      return {
        ...version,
        commits: parseCommit(version)
      }
    })

    // const head part
    logs.push('# ChangeLog')
    logs.push(
      '\nThis document was generated by [autochangelog](https://github.com/roshanca/autochangelog) automatically.'
    )

    for (let version of versions) {
      let { name, date, diff, commits = [] } = version

      logs.push(
        `\n## [${name}](${getRemoteLink().compareLink}/${diff}) ${
          options.showDate ? '(' + date + ')' : ''
        }`
      )

      // commit max limit
      if (options.commitLimit && commits.length > options.commitLimit) {
        commits = commits.slice(0, options.commitLimit)
      }

      // commit filter
      if (options.useFilter) {
        const reg = new RegExp(options.useFilter, 'i')

        commits = commits.filter(commit => {
          return reg.test(commit.type)
        })
      }

      let history = makeHistory(commits, options.useGroup)

      logs.push(history)
    }

    // console.log(logs)
    let logContent = logs.join('\n')
    logContent = logContent.replace(/(#[1-9]\d*)/g, `[\`$1\`](${getRemoteLink().issueLink}/$1)`)
    logContent = logContent.replace(/(\![1-9]\d*)/g, `[\`$1\`](${getRemoteLink().mergeLink}/$1)`)

    return logContent
  } catch (err) {
    throw err
  }
}
