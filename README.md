# AutoChangeLog

[![npm package](https://img.shields.io/npm/v/autochangelog.svg?style=flat-square)](https://www.npmjs.org/package/autochangelog)
[![dependency status](https://img.shields.io/david/roshanca/gitlab-autochangelog.svg?style=flat-square)](https://david-dm.org/roshanca/gitlab-autochangelog)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

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
  -v, --version        output the version number
  -o, --output <file>  output file (default: "CHANGELOG.md")
  --no-date            Remove date
  --no-filter          Remove type filter
  -h, --help           output usage information
```

## License

MIT license (© 2020 Roshan Wu)
