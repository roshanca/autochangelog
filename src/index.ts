#!/usr/bin/env node

import { resolve } from 'path'
import { performance } from 'perf_hooks'
import { Command } from 'commander'
import { generateFromTags } from './generateFromTags'
import { DEFAULT_OPTIONS } from './constant'

// absolute path to directory of lib
const libPath = resolve(__dirname, '../')

const startTime = performance.now()

// CLI control
const program = new Command()
program
  .version(require(`${libPath}/package.json`).version, '-v, --version')
  .option('-o, --output <file>', `output file`, DEFAULT_OPTIONS.OUTPUT)
  .option('--no-date', `Remove date`)
  .option('--no-filter', `Remove type filter`)
  .parse(process.argv)

// main process
generateFromTags({
  output: program.output,
  showDate: program.date,
  useFilter: program.filter
})

const timeSpent = performance.now() - startTime
console.log(`✨  ChangeLog was generated in ${(timeSpent / 1000).toFixed(3)}s.`)
