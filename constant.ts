/**
 * Default config.
 */
export const CONFIG = {
  FILE: '.changelogrc',
  HOST: 'gitlab.mogujie.org/',
  API: 'http://gitlab.mogujie.org/api/v3',
  OUTPUT: 'CHANGELOG.md'
}

export const PROMPT = {
  // description display at the top of console when prompting
  DESC: `You have not configured it yet, have you?
Please to work it out with the interactive prompt below.
It will create a config file (.changelogrc) in your system.

(If you have no idea about what token is, find it in your gitlab site by following "Profile Setting" - "Account" - "Reset Private token")

Press ^C at any time to quit.
`,

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