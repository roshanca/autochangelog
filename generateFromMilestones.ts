import * as path from 'path'
import { writeFile } from 'fs'
import * as jsonfile from 'jsonfile'
import * as prompt from 'prompt'
import * as request from 'request'
import * as semver from 'semver'
import ProgressBar from 'progress'
import { CONFIG, PROMPT } from './constant'
import { IConfig, IMilestone, IIssue, ILog } from './interface'
import { fsExistsSync } from './utils'
import getProjectPath from './getProjectPath'

// config file: ~/.changelogrc
const configFileLocation: string = path.resolve(
  process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'],
  CONFIG.FILE
)

export default async function main() {
  let config: IConfig

  try {
    if (fsExistsSync(configFileLocation)) {
      config = await getConfig()
    } else {
      config = await createConfigFile()
    }

    const { host, api, token } = config
    const projectPath = getProjectPath(host)
    const encodeProjectPath = encodeURIComponent(projectPath)
    const tokenQuery = `private_token=${token}`

    const milestonesApi = `${api}/projects/${encodeProjectPath}/milestones?${tokenQuery}`
    const issuesApi = `${api}/projects/${encodeProjectPath}/milestones/#{milestoneId}/issues?${tokenQuery}`

    const milestones: IMilestone[] = await fetchMilestones(milestonesApi)
    const logs: ILog[] = await generateLogs(milestones, issuesApi)

    // Generating changelog of current project
    generateChangeLog(logs)
  } catch (error) {
    throw error
  }
}

function getConfig(): Promise<IConfig> {
  return new Promise((resolve, reject) => {
    jsonfile.readFile(configFileLocation, (e, data) => {
      if (!e) {
        resolve(data)
      } else {
        reject(e)
      }
    })
  })
}

function createConfigFile(): Promise<IConfig> {
  return new Promise((resolve, reject) => {
    console.log(PROMPT.DESC)

    prompt.message = 'Enter'
    prompt.start()
    prompt.get(PROMPT.OPTIONS, (e, result) => {
      if (e) {
        reject(`\n${e}`)
        return
      }

      const content: IConfig = {
        host: result.host,
        api: result.api,
        token: result.token
      }

      jsonfile.writeFile(configFileLocation, content, e => {
        if (!e) {
          console.log('\n')
          resolve(content)
        } else {
          reject(`Unable to write file: ${configFileLocation}`)
        }
      })
    })
  })
}

/**
 * Fetch all the milestones from the given api.
 *
 * @param  {string} api
 * @example of the api:
 * http://gitlab.mogujie.org/api/v3/projects/wxa%2Fwxa-module/milestones??per_page=10&private_token=xxx
 */
function fetchMilestones(api: string): Promise<IMilestone[]> {
  const promise = new Promise<IMilestone[]>((resolve, reject) => {
    request(api, (e, response, body) => {
      if (!e && response.statusCode === 200) {
        const milestones: IMilestone[] = JSON.parse(body)
        if (milestones.length) {
          resolve(milestones)
        } else {
          reject(`There's no milestones yet. You could try 'autochangelog -t' instead.
For more help: 'autochangelog -h' `)
        }
      } else if (response) {
        reject(
          `Unable to fetch milestones because: ${
            JSON.parse(response.body).message
          }.`
        )
      } else {
        reject(e)
      }
    }).on('response', () => {
      console.log('Starting to fetch all the milestones of this project.\n')
    })
  })

  promise.then((response: Object[]) => {
    if (response.length > 1) {
      console.log(
        `Get ${
          response.length
        } milestones totally.\nGetting start to fetch all the issues of these milestones:\n`
      )
    } else if (response.length === 1) {
      console.log(
        'Get only one milestone, fetch the issues of this milestone:\n'
      )
    }
  })

  return promise
}

/**
 * * Generating all the logs from milestones and the given api.
 *
 * @param  {IMilestone[]} milestones
 * @param  {string} api
 */
async function generateLogs(
  milestones: IMilestone[],
  api: string
): Promise<ILog[]> {
  let promises: Promise<ILog>[] = milestones.map(milestone =>
    generateLog(milestone, api)
  )

  const barOpts = {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: promises.length
  }

  const bar = new ProgressBar(
    '  fetching issues [:bar] :percent :elapseds',
    barOpts
  )

  promises.forEach(promise => {
    promise.then(() => {
      bar.tick()
    })
  })

  return await Promise.all(promises)
}

/**
 * Generatin single log from specific milestone and the given api.
 *
 * @param  {IMilestone} milestone
 * @param  {string} api
 */
function generateLog(milestone: IMilestone, api: string): Promise<ILog> {
  return new Promise((resolve, reject) => {
    request(
      api.replace(/#{milestoneId}/, `${milestone.id}`),
      (e, response, body) => {
        if (!e && response.statusCode === 200) {
          const version: string = milestone.title
          const update: string = milestone.created_at.substr(0, 10)
          const issues: IIssue[] = JSON.parse(body)

          let content: string[] = issues.map(issue => {
            if (issue.assignee && issue.assignee.username) {
              return `- ${issue.title} (#${issue.iid} @${
                issue.assignee.username
              })`
            } else {
              return `- ${issue.title} (#${issue.iid})`
            }
          })

          if (milestone.state !== 'closed') {
            content.unshift(`## ${version}(unreleased)`)
          } else {
            content.unshift(`## ${version} - ${update}`)
          }

          resolve({ version, content })
        } else if (response) {
          reject(
            `Unable to fetch issues of ${milestone.id} milestone because: ${
              JSON.parse(response.body).message
            }`
          )
        } else {
          reject(e)
        }
      }
    )
  })
}

/**
 * Write the changelog into the output file.
 *
 * @param  {ILog[]} logs
 */
function generateChangeLog(logs: ILog[]) {
  console.log(`\nGenerating changelog into ${CONFIG.OUTPUT}`)

  logs = logs.sort(compareVersions)
  // console.log(logs)

  let body: any = logs.map(log => {
    return log.content.join('\n')
  })

  // console.log(body)
  body = body.join('\n\n')
  writeFile(CONFIG.OUTPUT, body, e => {
    if (!e) {
      console.log(`\nOK, ${CONFIG.OUTPUT} generated successfully!`)
    } else {
      console.error(e)
    }
  })
}

/**
 * Semver comparator
 *
 * @param  {ILog} log1
 * @param  {ILog} log2
 * @return {-1, 0, 1}
 *        Return 0 if v1 == v2,
 *        or 1 if v1 is greater,
 *        or -1 if v2 is greater.
 *        Sorts in ascending order if passed to Array.sort().
 */
function compareVersions(log1: ILog, log2: ILog): number {
  const v1 = semver.clean(log1.version)
  const v2 = semver.clean(log2.version)

  if (!v1 || !v2) {
    return
  }

  return semver.rcompare(v1, v2)
}
