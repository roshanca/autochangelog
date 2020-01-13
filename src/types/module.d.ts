declare module 'semver-compare' {
  function cmp(a: string, b: string): 1 | -1 | 0
  export { cmp as default }
}

declare module 'parse-git-config' {
  export function sync(): any
}
