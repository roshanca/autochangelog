import * as configParser from 'parse-git-config'
import { REMOTE_PATH_DEF, ERR_MSG } from './constant'

// convert git config into JSON
const gitConfig = configParser.sync()

if (!gitConfig['remote "origin"']) {
  throw ERR_MSG.NO_GIT
}

// get url of git remote
const url: string = gitConfig['remote "origin"'].url
let remoteUrl = ''

if (url.startsWith('git')) {
  const regRet = /^git@(\S[^\:]+)\:(\w+)\/(\S[^\.]+)/.exec(url)
  if (regRet !== null) {
    const [, host, user, project] = regRet
    remoteUrl = `https://${host}/${user}/${project}`
  }
} else if (url.startsWith('http')) {
  remoteUrl = url.split('.git')[0]
}

const isGithub = /github/.test(remoteUrl)
const isGitlab = /gitlab/.test(remoteUrl)
const isBitbucket = /bitbucket/.test(remoteUrl)

/**
 * Get specific pathname
 * @param typeIndex 0: commit, 1: issue, 2: merge, 3: compare
 */
const getRemotePath = (typeIndex: number) => {
  if (isGithub) {
    return REMOTE_PATH_DEF.GITHUB[typeIndex]
  }

  if (isGitlab) {
    return REMOTE_PATH_DEF.GITLAB[typeIndex]
  }

  if (isBitbucket) {
    return REMOTE_PATH_DEF.BITBUCKET[typeIndex]
  }
}

export const getRemoteLink = () => {
  return {
    commitLink: `${remoteUrl}/${getRemotePath(0)}`,
    issueLink: `${remoteUrl}/${getRemotePath(1)}`,
    mergeLink: `${remoteUrl}/${getRemotePath(2)}`,
    compareLink: `${remoteUrl}/${getRemotePath(3)}`
  }
}

export const getRemoteUrl = () => remoteUrl
