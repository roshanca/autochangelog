#!/usr/bin/env node --harmony

/**
 * Module dependencies.
 */
const fs = require('fs')
const path = require('path')
const _prompt = require('prompt')
const jsonfile = require('jsonfile')
const request = require('request')
const semver = require('semver')
const program = require('commander')

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
  
  // description display at top in console
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
const root = process.cwd()

// config file: ~/.changelogrc
const configFile = path.resolve(process.env.HOME, CONFIG.FILE);

// read version from package.json
function getVersion() {
  return require('./package').version
}

// CLI control
program
  .version(getVersion())
  .parse(process.argv)

;(async function () {
  try {
    const isConfigFileExist = await isFileExists(configFile)
    
    if (!isConfigFileExist) {
      await createConfigFile()
    }
    
    const token = getToken()
    const projectPath = getProjectPath()
    
    const milestonesApi = `${CONFIG.API}/projects/${encodeURIComponent(projectPath)}/milestones?private_token=${token}`
    const issuesApi = `${CONFIG.API}/projects/${encodeURIComponent(projectPath)}/milestones/#{milestoneId}/issues?private_token=${token}`
    
    const milestones = await fetchMilestones(milestonesApi)
    const logs = await generateLogs(milestones, issuesApi)
    
    console.log(`Generating changelog of ${projectPath} to ${CONFIG.OUTPUT}`)
    generateChangeLog(logs)
  } catch (e) {
    console.error(e)
  }
})()

async function isFileExists(file) {
  return new Promise((resolve, reject) => {
    fs.stat(file, (e, stat) => {
      if (e === null && stat.isFile()) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}

async function createConfigFile() {
  return new Promise((resolve, reject) => {
    console.log(PROMPT.DESC)
    
    _prompt.message = 'Enter';
    _prompt.start();
    _prompt.get(PROMPT.OPTIONS, (e, result) => {
      if (e) {
        reject(e)
        return
      }
  
      const content = {
        host: result.host,
        api: result.api,
        token: result.token
      };
  
      jsonfile.writeFile(configFile, content, () => {
        try {
          resolve(true)
        } catch (e) {
          console.error(e)
        }
      })
    });
  })
}

/**
 * Fetch all the milestones from the given api.
 * 
 * @param  {any} api
 * @example of the api: 
 * http://git.cairenhui.com/api/v3/projects/OOS%2Foos-web-fe/milestones??per_page=30&private_token=Wk9deBZUz9_6gPZbysxj
 */
async function fetchMilestones(api) {
  return new Promise((resolve, reject) => {
    request(api, (e, response, body) => {      
      if (!e && response.statusCode === 200) {
        const milestones = JSON.parse(body)
        resolve(milestones)
      } else if (response) {
        console.error(`Unable to fetch milestones because: ${JSON.parse(response.body).message}`)
      } else {
        console.error(e)
      }
    })
  })
}

/**
 * * Generating all the logs from milestones and the given api.
 * 
 * @param  {any} milestones
 * @param  {any} api
 */
async function generateLogs(milestones, api) {
  'use strict'
  
  let promises = milestones.map((milestone) => generateLog(milestone, api))
  
  return await Promise.all(promises)
}

/**
 * Generatin single log from specific milestone and the given api.
 * 
 * @param  {any} milestone
 * @param  {any} api
 */
async function generateLog(milestone, api) {
  return new Promise((resolve, reject) => {
    request(api.replace(/#{milestoneId}/, milestone.id), (e, response, body) => {
      'use strict'
      
      if (!e && response.statusCode === 200) {
        const version = milestone.title
        const update = milestone.created_at.substr(0, 10)
        const issues = JSON.parse(body)
        
        let content = issues.map((issue) => {
          return `- ${issue.title} (#${issue.iid} @${issue.assignee.username})`
        })
        
        content.unshift(`## ${version} - ${update}`)
        
        resolve({
          version: version,
          content: content
        })
      } else if (response) {
        console.error(`Unable to fetch issues of ${milestone.id} milestone because: ${JSON.parse(response.body).message}`)
      } else {
        console.error(e)
      }
    })
  })
}

/**
 * Write the changelog into the output file.
 * 
 * @param  {any} logs
 */
function generateChangeLog(logs) {
  'use strict'
  logs = logs.sort(compareVersions)
  // console.log(logs)
  let body = logs.map((log) => {
    return log.content.join('\n')
  })
  // console.log(body)
  body = body.join('\n\n')
  fs.writeFile(CONFIG.OUTPUT, body, (e) => {
    console.log(`\nOK, ${CONFIG.OUTPUT} generated successfully!`)
  })
}

/**
 * Get the full path of the current project.
 * 
 * @return  {string} projectPath
 */
function getProjectPath() {
  'use strict'
  
  let gitConfig
  let projectPath
  
  try {
    gitConfig = fs.readFileSync('.git/config', {encoding: 'utf8'})
  } catch (e) {
    throw `It can't be done because it's not a git project.`
  }
  
  try {
    projectPath = gitConfig.split(CONFIG.HOST)[1].split('\n')[0].replace(/(\:|\.git)/g, '')
  } catch (e) {
    throw `No gitlab project found in ${root}`
  }
  
  return projectPath
}

/**
 * Get the token stored in config file (~/.changelogrc)
 * 
 * @return  {string} token
 */
function getToken() {
  return jsonfile.readFileSync(configFile).token
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
