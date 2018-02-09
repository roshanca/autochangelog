#!/usr/bin/env node

/**
 * Module dependencies.
 */
import { resolve } from 'path'
import * as program from 'commander'

import generateFromTags from './generateFromTags'
import generateFromMilestones from './generateFromMilestones'

// absolute path to directory of lib
const libPath = resolve(__dirname, '../')

// absolute path of current gitlab project
const root: string = process.cwd()

// CLI control
program
  .version(require(`${libPath}/package`).version, '-v, --version')
  .option('-t, --tags', `Use tags instead of milestones`)
  .parse(process.argv)

main()

// Main logic
async function main() {
  try {
    if (program.tags) {
      generateFromTags()
    } else {
      await generateFromMilestones()
    }
  } catch (e) {
    console.error(e)
    process.exit(0)
  }
}
