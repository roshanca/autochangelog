AutoChangeLog
===

[![npm package](https://img.shields.io/npm/v/autochangelog.svg?style=flat-square)](https://www.npmjs.org/package/autochangelog)
[![build status](https://img.shields.io/travis/roshanca/gitlab-autochangelog/master.svg?style=flat-square)](https://travis-ci.org/roshanca/gitlab-autochangelog)
[![dependency status](https://img.shields.io/david/roshanca/gitlab-autochangelog.svg?style=flat-square)](https://david-dm.org/roshanca/gitlab-autochangelog)

利用 Gitlab API 来获取项目 milestones 以及对应的 issues，自动生成 changelogs。

安装
-------

通过 npm 安装：

```
$ npm install -g autochangelog
```

使用
-------

在终端中输入：“autochangelog”

```
$ autochangelog
```

接下来要求输入：

### Gitlab Token

第一行要求你输入 Gitlab Token，这个可以在 Gitlab 中你的个人设置里找到：`Profile settings -> Account`，右侧第一栏显示 `Reset Private token`，下方的输入框里显示的就是了。

### Output File

第二行是设定输出的文件名，默认是 `CHANGELOG.md`。


TODO
-------

- [x] Gitlab Token 输入支持历史记录
- [x] milestones 的排列顺序可颠倒
- [ ] 每条 log 可增加与之对应的 issue 和 指派者关联（比如：#31 @wuwj）

灵感来源
-------

[node-github-autochangelog](https://github.com/kaosat-dev/node-github-autochangelog)

英文说明
-------

[README.md](https://github.com/roshanca/gitlab-autochangelog/blob/master/README.md)

许可
-------
MIT license (© 2015 Roshan Wu)
