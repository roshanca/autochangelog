import { getExecResult } from './utils'

export interface ICommit {
  hash: string
  shortHash: string
  subject: string
  pureSubject: string
  type: string
  scope: string
  body: string
  breakingChange: string
}

export interface IVersion {
  name: string
  diff: string
  date: string
  commits?: ICommit[]
}

export const parseCommit = (version: IVersion): ICommit[] => {
  const { diff } = version

  // get commit hash between the git diff
  const diffHash = getExecResult(`git log --pretty="%H" ${diff}`)
  const hashList = diffHash.split('\n')

  return hashList.map(hash => {
    const shortHash = hash.slice(0, 7)
    const subject = getExecResult(`git show --pretty="%s" -s ${hash}`)
    const body = getExecResult(`git show --pretty="%b" -s ${hash}`)
    const regRet = /^([a-zA-Z][^\(]+)\(?(.*?)\)?\:/.exec(subject)

    let type = ''
    let scope = ''
    let matched = ''
    let pureSubject = subject

    if (regRet !== null) {
      ;[matched, type, scope] = regRet

      if (matched) {
        pureSubject = subject.split(matched)[1].trim()
      }
    }

    return {
      hash,
      shortHash,
      subject,
      pureSubject,
      type,
      scope,
      body,
      breakingChange: getBreakingChangeFrom(body)
    }
  })
}

const getBreakingChangeFrom = (str: string) => {
  const KEY_WORD = 'BREAKING CHANGE: '

  if (!str) {
    return ''
  }

  return str.split(KEY_WORD)[1] || ''
}
