# AutoChangeLog

[![npm package](https://img.shields.io/npm/v/autochangelog.svg?style=flat-square)](https://www.npmjs.org/package/autochangelog)
[![dependency status](https://img.shields.io/david/roshanca/gitlab-autochangelog.svg?style=flat-square)](https://david-dm.org/roshanca/gitlab-autochangelog)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](https://commitizen.github.io/cz-cli/)
[![autochangelog happy](https://img.shields.io/badge/autochangelog-happy-yellow.svg?style=flat-square)](https://github.com/roshanca/autochangelog)
![NPM](https://img.shields.io/npm/l/autochangelog?style=flat-square)

A very lightweight command line tool for generating a changelog from git tags and commit history.

## Installation

```
$ npm install -g autochangelog
```

## Usage

Run command below in the root directory of your git project directly.

```
$ autochangelog
```

Get more helps:

```
$ autochangelog -h
```

```
Usage: autochangelog [options]

Options:
  -v, --version                output the version number
  -o, --output <file>          output file (default: "CHANGELOG.md")
  -l, --commit-limit <count>   number of commits to display per release (default: 5)
  -c, --version-limit <count>  number of version to release (default: 20)
  --no-date                    remove date
  --no-group                   Do not group the commit history base on Conventional Commits for commit guidelines
  --filter <pattern>           filter commit by given reg pattern, for example: "^(new|fix(e(d|s))?)$"
  -h, --help                   output usage information
```

## License

MIT license (© 2020 Roshan Wu)
