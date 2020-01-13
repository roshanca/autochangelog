import * as configParser from 'parse-git-config'
import { REMOTE_PATH_DEF } from './constant'

// convert git config into JSON
const gitConfig = configParser.sync()

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
