AutoChangeLog
===

[![npm package](https://img.shields.io/npm/v/autochangelog.svg?style=flat-square)](https://www.npmjs.org/package/autochangelog)
[![build status](https://img.shields.io/travis/roshanca/gitlab-autochangelog/master.svg?style=flat-square)](https://travis-ci.org/roshanca/gitlab-autochangelog)
[![dependency status](https://img.shields.io/david/roshanca/gitlab-autochangelog.svg?style=flat-square)](https://david-dm.org/roshanca/gitlab-autochangelog)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Generating changelogs automatically.

Installation
-------

Install with the npm:

```
$ npm install -g autochangelog
```

Usage
-------

Generating changelogs from issues of gitlab project's milestones:

```
$ autochangelog
```

Generating changelogs from commit messages between git tags (works for any git project):

```
$ autochangelog -t
```

or 

```
$ autochangelog --tags
```

Get more helps:

```
$ autochangelog -h
```

License
-------
MIT license (© 2015 Roshan Wu)
