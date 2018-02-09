import { accessSync } from 'fs'

/**
 * Check target weather plain object
 * @param obj
 */
export function isPlainObject(obj: any) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

/**
 * Convert buffer to string
 * @param buffer
 */
export function bufferToString(buffer: Buffer) {
  return Buffer.from(buffer).toString()
}

/**
 * Check weather file or directory exists on specific path
 * @param path
 */
export function fsExistsSync(path) {
  try {
    accessSync(path)
  } catch (e) {
    return false
  }
  return true
}
