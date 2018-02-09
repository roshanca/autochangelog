import { readFileSync } from 'fs'

// absolute path of current project
const root: string = process.cwd()

/**
 * Get the full path of the current gitlab project.
 *
 * @param  {string} host
 * @return {string} projectPath
 */
export default function getProjectPath(host: string): string {
  let gitConfig
  let projectPath: string

  try {
    gitConfig = readFileSync('.git/config')
  } catch (e) {
    throw `It can't be done because this is not a git project.`
  }

  try {
    projectPath = `${gitConfig}`
      .split(host)[1]
      .split('\n')[0]
      .replace(/(\:|\.git)/g, '')
  } catch (e) {
    throw `No gitlab project found in ${root}`
  }

  return projectPath
}
