declare module 'semver-compare' {
  export function cmp(a: string, b: string): 1 | -1 | 0
}

declare module 'parse-git-config' {
  export function sync(): any
}
