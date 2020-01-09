import { readdirSync, writeFileSync } from 'fs'
import * as semver from 'semver-compare'
import * as configParser from 'parse-git-config'
import { fsExistsSync, getExecResult } from './utils'
import { ERR_MSG } from './constant'

interface IOption {
  output: string
  showDate: boolean
  useFilter: boolean
}

interface IVersion {
  name: string
  diff: string
  date: string
}

// absolute path of current project
const rootDir = process.cwd()
const gitDir = `${rootDir}/.git`
const gitTagDir = `${gitDir}/refs/tags`
let gitTags: string[]
let versions: IVersion[] = []
let logs: string[] = []

const filterType = (str: string) => {
  const reg: RegExp = /^\-\s(new|fix|update|feat|refact).*/i
  return reg.test(str)
}

export const generateFromTags = (options: Partial<IOption>) => {
  const changeLogPath = `${rootDir}/${options.output}`

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

  // descending sort
  gitTags = gitTags.sort(semver.cmp).reverse()

  try {
    // convert git config into JSON
    const gitConfig = configParser.sync()

    // get url of git remote
    const { url } = gitConfig['remote "origin"']
    const baseUrl = url.split('.git')[0]
    const firstTag = gitTags[gitTags.length - 1]
    const rootCommit = getExecResult('git rev-list --max-parents=0 HEAD')
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
      diff: `${rootCommit}...${firstTag}`,
      date: firstTagIsoDate.split(' ')[0] || ''
    })

    versions.forEach(version => {
      const { name, diff, date } = version
      const log = getExecResult(`git log --pretty="- %s ([%h](${baseUrl}/commit/%H))" ${diff}`)
      let logList = log.split('\n')

      if (options.useFilter) {
        logList = logList.filter(filterType)
      }

      logList.unshift(
        `\n## [${name}](${baseUrl}/compare/${diff}) ${options.showDate ? '(' + date + ')' : ''}`
      )
      logs = logs.concat(logList)
    })

    // add main title
    logs.unshift('# ChangeLog')

    // console.log(logs)
    // wirte logs into CHANGELOG file
    writeFileSync(changeLogPath, logs.join('\n'))
  } catch (err) {
    throw err
  }
}
