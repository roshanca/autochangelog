export interface IConfig {
  host: string
  api: string
  token: string
}

export interface IMilestone {
  id: number
  iid: number
  project_id: number
  title: string
  description: string
  state: string
  created_at: string
  updated_at: string
  due_date: any
}

export interface IIssue {
  id: number
  iid: number
  title: string
  description: string
  state: string
  created_at: string
  updated_at: string
  labels?: string[]
  milestone?: IMilestone
  assignee?: any
  author?: any
}

export interface ILog {
  version: string
  content: string[]
}
