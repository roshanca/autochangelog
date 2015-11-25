#!/usr/bin/env node --harmony

interface Config {
  host: string
  api: string
  token: string
}

interface Milestone {
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

interface Issue {
  id: number
  iid: number
  title: string
  description: string
  state: string
  created_at: string
  updated_at: string
  labels?: string[]
  milestone?: Milestone
  assignee?: any
  author?: any
}

interface Log {
  version: string
  content: string[]
}

/**
 * Module dependencies.
 */
const fs = require('fs');
const path = require('path')
const _prompt = require('prompt')
const jsonfile = require('jsonfile')
const request = require('request')
const semver = require('semver')
const program = require('commander')
const ProgressBar = require('progress');

/**
 * Default config.
 */
const CONFIG = {
  FILE: '.changelogrc',
  HOST: 'git.cairenhui.com',
  API: 'http://git.cairenhui.com/api/v3',
  OUTPUT: 'CHANGELOG.md'
}

const PROMPT = {
  
  // description display at the top of console
  DESC: 'You have not configed it yet, have you?\n' +
      'Please to work it out according to the interactive prompt.\n' +
      'It will creating config file (.changelogrc) in your system automatically.\n\n' +
      '(If you have no idea about what token is, find it in your gitlab site by ' +
      'following "Profile Setting" - "Account" - "Reset Private token")\n\n' +
      'Press ^C at any time to quit.\n',
      
  // options for prompt
  OPTIONS: [
    {
      name: 'host',
      message: 'Your gitlab host',
      default: CONFIG.HOST
    },
    {
      name: 'api',
      message: 'Your gitlab api',
      default: CONFIG.API
    },
    {
      name: 'token',
      message: 'Your private token'
    }
  ]
}

// absolute path of current project
const root: string = process.cwd()

// config file: ~/.changelogrc
const configFile: string = path.resolve(process.env.HOME, CONFIG.FILE);

// CLI control
program
  .version(require('./package').version)
  .parse(process.argv)

; (async function() {
  'use strict'

  try {
    let config: Config = await getConfing()

    if (!config) {
      config = await createConfigFile()
    }

    const token: string = config.token
    const projectPath: string = getProjectPath()

    const milestonesApi: string = `${CONFIG.API}/projects/${encodeURIComponent(projectPath) }/milestones?private_token=${token}`
    const issuesApi: string = `${CONFIG.API}/projects/${encodeURIComponent(projectPath) }/milestones/#{milestoneId}/issues?private_token=${token}`

    const milestones: Milestone[] = await fetchMilestones(milestonesApi)
    const logs: Log[] = await generateLogs(milestones, issuesApi)

    // Generating changelog of current project
    generateChangeLog(logs)
  } catch (e) {
    console.error(e)
  }
})()

function getConfing(): Promise<Config> {
  return new Promise((resolve, reject) => {
    jsonfile.readFile(configFile, (e, data) => {
      if (!e) {
        resolve(data)
      } else {
        resolve(false)
      }
    })
  })
}

function createConfigFile(): Promise<Config> {
  return new Promise((resolve, reject) => {
    console.log(PROMPT.DESC)
    
    _prompt.message = 'Enter';
    _prompt.start();
    _prompt.get(PROMPT.OPTIONS, (e, result) => {
      if (e) {
        reject(`\n${e}`)
        return
      }
  
      const content: Config = {
        host: result.host,
        api: result.api,
        token: result.token
      };
  
      jsonfile.writeFile(configFile, content, (e) => {
        if (!e) {
          resolve(content)
        } else {
          reject(`Unable to write file: ${configFile}`)
        }
      })
    });
  })
}

/**
 * Fetch all the milestones from the given api.
 * 
 * @param  {string} api
 * @example of the api: 
 * http://git.cairenhui.com/api/v3/projects/OOS%2Foos-web-fe/milestones??per_page=30&private_token=Wk9deBZUz9_6gPZbysxj
 */
function fetchMilestones(api: string): Promise<Milestone[]> {
  return new Promise((resolve, reject) => {
    request(api, (e, response, body) => {      
      if (!e && response.statusCode === 200) {
        const milestones: Milestone[] = JSON.parse(body)
        resolve(milestones)
      } else if (response) {
        reject(`Unable to fetch milestones because: ${JSON.parse(response.body).message}`)
      } else {
        reject(e)
      }
    })
  })
}

/**
 * * Generating all the logs from milestones and the given api.
 * 
 * @param  {Milestone[]} milestones
 * @param  {string} api
 */
async function generateLogs(milestones: Milestone[], api: string): Promise<Log[]> {
  'use strict'
  
  let promises: Promise<Log>[] = milestones.map((milestone) => generateLog(milestone, api))
  
  const barOpts = {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: promises.length
  }
  
  const bar = new ProgressBar('  fetching issues [:bar] :percent :elapseds', barOpts);
  
  promises.forEach((promise) => {
    promise.then(() => {
      bar.tick()
    })
  })
  
  return await Promise.all(promises)
}

/**
 * Generatin single log from specific milestone and the given api.
 * 
 * @param  {Milestone} milestone
 * @param  {string} api
 */
function generateLog(milestone: Milestone, api: string): Promise<Log> {
  return new Promise((resolve, reject) => {
    request(api.replace(/#{milestoneId}/, `${milestone.id}`), (e, response, body) => {
      'use strict'
      
      if (!e && response.statusCode === 200) {
        const version: string = milestone.title
        const update: string = milestone.created_at.substr(0, 10)
        const issues: Issue[] = JSON.parse(body)
        
        let content = issues.map((issue) => {
          return `- ${issue.title} (#${issue.iid} @${issue.assignee.username})`
        })
        
        content.unshift(`## ${version} - ${update}`)
        
        resolve({
          version: version,
          content: content
        })
      } else if (response) {
        reject(`Unable to fetch issues of ${milestone.id} milestone because: ${JSON.parse(response.body).message}`)
      } else {
        reject(e)
      }
    })
  })
}

/**
 * Write the changelog into the output file.
 * 
 * @param  {Log[]} logs
 */
function generateChangeLog(logs: Log[]) {
  'use strict'
  
  logs = logs.sort(compareVersions)
  // console.log(logs)
  
  let body: any = logs.map((log) => {
    return log.content.join('\n')
  })
  
  // console.log(body)
  body = body.join('\n\n')
  fs.writeFile(CONFIG.OUTPUT, body, (e) => {
    if (!e) {
      console.log(`\nOK, ${CONFIG.OUTPUT} generated successfully!`)
    } else {
      console.error(e)
    }
  })
}

/**
 * Get the full path of the current project.
 * 
 * @return  {string} projectPath
 */
function getProjectPath(): string {
  'use strict'
  
  let gitConfig: Config
  let projectPath: string
  
  try {
    gitConfig = fs.readFileSync('.git/config', {encoding: 'utf8'})
  } catch (e) {
    throw `It can't be done because it's not a git project.`
  }
  
  try {
    projectPath = `${gitConfig}`.split(CONFIG.HOST)[1].split('\n')[0].replace(/(\:|\.git)/g, '')
  } catch (e) {
    throw `No gitlab project found in ${root}`
  }
  
  return projectPath
}

/**
 * Semver comparator
 * 
 * @param  {any} v1
 * @param  {any} v2
 * @return {-1, 0, 1} Return 0 if v1 == v2, or 1 if v1 is greater, or -1 if v2 is greater. Sorts in ascending order if passed to Array.sort().
 */
function compareVersions(v1, v2) {
  var _v1 = semver.clean(v1.version)
  var _v2 = semver.clean(v2.version)
  
  if (!_v1 || !_v2) {
    return
  }

  return semver.rcompare(_v1, _v2)
}
