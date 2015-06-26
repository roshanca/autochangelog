AutoChangeLog
===

[![npm package](https://img.shields.io/npm/v/autochangelog.svg?style=flat-square)](https://www.npmjs.org/package/autochangelog)
[![build status](https://img.shields.io/travis/roshanca/gitlab-autochangelog/master.svg?style=flat-square)](https://travis-ci.org/roshanca/gitlab-autochangelog)
[![dependency status](https://img.shields.io/david/roshanca/gitlab-autochangelog.svg?style=flat-square)](https://david-dm.org/roshanca/gitlab-autochangelog)

Using Gitlab API to get milestones and its issues, generating changelogs automatically.

Installation
-------

Install with the npm:

```
$ npm install -g autochangelog
```

Usage
-------

Type 'autochangelog' in your Terminal.

```
$ autochangelog
```

For the next:

### Gitlab Token

You can find this in your Gitlab: `Profile settings -> Account`，at the right side just below the `Reset Private token` showing a string in the input field.

### Output File

Output file name, default is `CHANGELOG.md`.

Get more helps:

```
$ autochangelog -h
```

TODO
-------

- [x] Gitlab Token input supports history.
- [x] The order of milestones in Changelog can be reversed.
- [ ] Add refs to specific issue and assignee in each log.(etc. #31 @wuwj)

Inspired by
-------

[node-github-autochangelog](https://github.com/kaosat-dev/node-github-autochangelog)

License
-------
MIT license (© 2015 Roshan Wu)
