interface IOption {
  showDate: boolean
  useGroup: boolean
  useFilter: string
  commitLimit: number
  versionLimit: number
}

interface IVersion {
  name: string
  diff: string
  date: string
  commits?: ICommit[]
}

interface ICommit {
  hash: string
  shortHash: string
  subject: string
  pureSubject: string
  type: string
  scope: string
  body: string
  breakingChange: string
}
