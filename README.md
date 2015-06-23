AutoChangeLog
===

利用 Gitlab API 来获取项目 milestones 以及对应的 issues，自动生成 Change Log。

原本想直接写成 shell 或 bat 脚本，后来发现难度太大，只好用自己最熟悉的 NodeJS 来完成。你要是感兴趣，也可以试着用其它语言来写。

如何使用
-------

- 安装 [Node](https://nodejs.org/download/)
- 克隆此项目至本地：`git clone git@git.cairenhui.com:gitlab/node-gitlab-autochangelog.git autochangelog`
- 进入到项目根目录，安装依赖：`npm install`
- 将 `autochangelog` 通过软链接添加至系统环境变量，成为可执行命令：`npm link`

ok，完成在终端内输入 `autochangelog`，发现以下界面：

![snap1](http://git.cairenhui.com/gitlab/node-gitlab-autochangelog/raw/master/snap/snap1.png)

（若项目不是一个 Git 项目，会直接报错：`It seems there's not any git projects`）

### Gitlab Token

第一行要求你输入 Gitlab Token，这个可以在 Gitlab 中你的个人设置里找到：`Profile settings -> Account`，右侧第一栏显示 `Reset Private token`，输入框内的一串字符就是你的 Gitlab Token 了，复制它粘贴到终端中，按回车。

### Output File

第二行是设定输出的文件名，默认是 `CHANGELOG.md`。

在此按下回车后回，待运行完毕终端提示 "done!"，表示已完成。

如何更新
-------

直接用 git 更新你本地的 autochangelog 项目即可：`git pull origin master`

TODO
-------

- [ ] Gitlab Token 输入支持历史记录
- [ ] milestone 可设置正序倒序排列
- [ ] 每条 log 可增加与之对应的 issue 和 指派者关联（etc. #31 @wuwj）
