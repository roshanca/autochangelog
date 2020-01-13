import { execSync } from 'child_process'
import { accessSync, PathLike } from 'fs'

/**
 * Convert buffer to string
 * @param buffer
 */
const bufferToString = (buffer: Buffer) => {
  return Buffer.from(buffer).toString()
}

/**
 * Convert command line result to string
 * @param command
 */
export const getExecResult = (command: string) => {
  const buffer = execSync(command)
  return bufferToString(buffer).trim()
}

/**
 * Check weather file or directory exists on specific path
 * @param path
 */
export const fsExistsSync = (path: PathLike) => {
  try {
    accessSync(path)
  } catch (e) {
    return false
  }
  return true
}

/**
 * Clean a tag name to be a valid semver if possible
 * @param tag
 * @example cleanTag('v3.1.4.550-123') -> '3.1.4'
 */
export const cleanTag = (tag: string) => {
  let ret = /\d+\.\d+\.\d+/g.exec(tag)

  if (ret !== null) {
    return ret[0]
  }

  return ''
}
