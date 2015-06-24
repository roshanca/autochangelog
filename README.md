AutoChangeLog
===

Using Gitlab API to get milestones and its issues，generating changelogs automatically.

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

With some options, for example, get helps:

```
$ autochangelog -h
```

For the next:

### Gitlab Token

You can find this in your Gitlab: `Profile settings -> Account`，at the right side just below the `Reset Private token` showing a string in the input field.

### Output File

Output file name, default is `CHANGELOG.md`.

TODO
-------

- [ ] Gitlab Token input supports history.
- [ ] Milestone can be ordered by both desc and asc.
- [ ] Add association of specific issue and assignee.(etc. #31 @wuwj)
