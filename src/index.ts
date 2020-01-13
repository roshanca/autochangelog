#!/usr/bin/env node

import { resolve } from 'path'
import { writeFileSync } from 'fs'
import { performance } from 'perf_hooks'
import { Command } from 'commander'
import { generateBaseTags } from './log'
import { DEFAULT_OPTIONS } from './constant'

// absolute path to directory of lib
const libPath = resolve(__dirname, '../')

const startTime = performance.now()

// CLI control
const program = new Command()
program
  .version(require(`${libPath}/package.json`).version, '-v, --version')
  .option('-o, --output <file>', 'output file', DEFAULT_OPTIONS.OUTPUT)
  .option(
    '-l, --commit-limit <count>',
    'number of commits to display per release',
    DEFAULT_OPTIONS.COMMIT_LIMIT
  )
  .option(
    '-c, --version-limit <count>',
    'number of version to release',
    DEFAULT_OPTIONS.VERSION_LIMIT
  )
  .option('--no-date', 'remove date')
  .option(
    '--no-group',
    'Do not group the commit history base on Conventional Commits for commit guidelines'
  )
  .option(
    '--filter <pattern>',
    'filter commit by given reg pattern, for example: "^(new|fix(e(d|s))?)$"'
  )
  .parse(process.argv)

// main process
const logContent = generateBaseTags({
  showDate: program.date,
  useGroup: program.group,
  useFilter: program.filter,
  commitLimit: program.commitLimit,
  versionLimit: program.versionLimit
})

// wirte logs into CHANGELOG file
writeFileSync(`${process.cwd()}/${program.output}`, logContent)

const timeSpent = performance.now() - startTime
console.log(`✨  ChangeLog was generated in ${(timeSpent / 1000).toFixed(3)}s.`)
