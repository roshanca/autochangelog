import { bufferToString, fsExistsSync } from './utils'
import { readdirSync, writeFileSync } from 'fs'
import { clean, rcompareIdentifiers } from 'semver'
import { execSync } from 'child_process'

// absolute path of current gitlab project
const root: string = process.cwd()

export default function main() {
  let tags = []
  const tagsPath = `${root}/.git/refs/tags`
  const changeLogPath = fsExistsSync(`${root}/CHANGELOG.md`)
    ? `${root}/CHANGELOG.md`
    : `${root}/History.md`

  const compare = (v1, v2) => {
    v1 = clean(v1)
    v2 = clean(v2)

    if (!v1 || !v2) {
      return
    }

    return rcompareIdentifiers(v1, v2)
  }

  try {
    let tagsList = readdirSync(tagsPath)

    // Format version name
    // tagsList = tagsList.map(tagName => clean(tagName))

    // Unique
    // tagsList = Array.from(new Set(tagsList))

    // Sort
    tagsList = tagsList.sort(compare)

    let versions = []
    tagsList.reduce((prev, next) => {
      versions.push({ name: prev, diff: `${next}...${prev}` })
      return next
    })

    const firstCommitBuffer = execSync('git rev-list --max-parents=0 HEAD')
    const firstCommitString = bufferToString(firstCommitBuffer).trim()
    versions.push({
      name: tagsList[tagsList.length - 1],
      diff: `${firstCommitString}...${tagsList[tagsList.length - 1]}`
    })

    let changeLogs = []
    versions.forEach(version => {
      const { name, diff } = version
      const logBuffer = execSync(`git log --pretty="- %s" ${diff}`)
      const logString = bufferToString(logBuffer)
      let logArray = logString.split('\n')
      logArray.unshift(`## ${name}`)
      changeLogs = changeLogs.concat(logArray)
    })
    // console.log(changeLogs)

    // Wirte logs into file
    writeFileSync(changeLogPath, changeLogs.join('\n'))
  } catch (error) {
    throw error
  }
}
