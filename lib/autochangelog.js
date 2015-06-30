#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var Q = require("q");
var request = require('request');
var prompt = require('prompt');
var semver = require('semver');
var argv = require('yargs')
  .version(function() {
    return require('../package').version;
  })
  .alias('v', 'version')
  .default('host', 'git.cairenhui.com')
  .describe('host', 'Your gitlab host')
  .default('api', 'http://git.cairenhui.com/api/v3')
  .describe('api', 'Your gitlab api')
  .usage('Usage: $0 [Options]')
  .help('h')
  .alias('h', 'help')
  .default('verbose')
  .alias('V', 'verbose')
  .describe('V', 'Verbose mode')
  .alias('R', 'reverse')
  .describe('R', 'Reverse order index')
  .describe('simple', 'Simple mode')
  .epilog('© Copyright 2015 by Roshan Wu')
  .argv;

var root = __dirname.replace(/lib/, '');
var pkg = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
var config = fs.readFileSync('.git/config', 'utf8');
var fullRepoName;
var outputFileName;
var items = [];

var GITLAB = {
  HOST: argv.host,
  API: argv.api
};

// Gitlab Token input supports history
var historyFilePath = path.join(root, '.history');
if (fs.existsSync(historyFilePath)) {
  var historyToken = fs.readFileSync(historyFilePath, 'utf8');
} else {
  var historyToken = '';
}

init().then(getMilestones).then(generateChangeLog).fail(handleError);
// init().then(getMilestones);

function init() {
  var initDeferred = Q.defer();

  fullRepoName = getFullRepoName();

  console.log('=== AutoChangeLog v' + JSON.parse(pkg).version + ' ===\n');

  if (!fullRepoName) {
    console.log('\nCan\'t get the repo name of your project');
    return;
  }

  prompt.message = 'Enter';
  prompt.start();
  prompt.get([
    {name: 'token', message: 'GitLab Token', required: true, default: historyToken}, 
    {name: 'output', message: 'Output File', default: 'CHANGELOG.md'}
  ], function (err, result) {
    if (err !== null) {
      initDeferred.reject(err);
      return;
    }

    console.log('\nGenerating changelog for ' + fullRepoName + ' to', outputFileName = result.output);

    // Write token into history file
    var historyFileHandler = fs.openSync(historyFilePath, 'w');
    fs.writeSync(historyFileHandler, result.token);
    fs.closeSync(historyFileHandler);

    initDeferred.resolve(result.token);
    // getMilestones();
  });

  return initDeferred.promise;
}

function getMilestones(token) {
  var deferred = Q.defer();
  fullRepoName = fullRepoName.replace(/\//, '%2F');

  request(GITLAB.API + '/projects/' + fullRepoName + '/milestones?private_token=' + token, function (error, response, body) {
    // console.log(JSON.parse(body));
    if (argv.V) {
      console.log('Fetch milestones from', [GITLAB.API, '/projects/', fullRepoName, '/milestones?private_token=', token].join(''));
    }

    if (error !== null) {
      console.log(error);
    }

    var milestones = JSON.parse(body);
    var promises = [];

    if (milestones.message === '401 Unauthorized') {
      console.log('\nYour have no permissions, check your token entered just now');
      return;
    }

    if (!milestones.length) {
      console.log('\nThere\'s no milestone in your project');
      return;
    }

    milestones.forEach(function (milestone) {
      if (milestone.state !== 'closed') return;

      var version = milestone.title;
      var date    = milestone.created_at.substr(0, 10);
      var id      = milestone.id;

      var subDeferred = getIssuesInMilestone(id, version, date, token);
      promises.push(subDeferred.promise);
    });

    Q.all(promises).then(function () {
      deferred.resolve(items);
    });
  });

  return deferred.promise;
}

function getIssuesInMilestone(id, version, date, token) {
  var deferred = Q.defer();

  request(GITLAB.API + '/projects/' + fullRepoName + '/milestones/' + id + '/issues?private_token=' + token, function (error, response, body) {
    if (argv.V) {
      console.log('Fetch issues from', [GITLAB.API, '/projects/', fullRepoName, '/milestones/', id, '/issues?private_token=', token].join(''));
    }

    if (error !== null) {
      console.log(error);
    }
    
    var issues = JSON.parse(body);
    var _issues = [];

    if (argv.simple) {
      issues.forEach(function (issue) {
        _issues.push(issue.title);
      });
    } else {
      // Add refs to specific issue and assignee in each log 
      issues.forEach(function (issue) {
        _issues.push(issue.title + ' (@' + issue.assignee.username + ' #' + issue.iid + ')');
      });
    }

    _issues.unshift(version, date);

    // console.log(_issues);
    items.push(_issues);
    deferred.resolve(items);
  });

  return deferred;
}

function generateChangeLog() {
  items.sort(compareVersions);
  if (argv.R) {items.reverse();}
  // console.log(outputFileName);
  var outputFileHandler = fs.openSync(outputFileName, 'w');
  if (argv.V) {console.log('\nStarting generate...');}
  items.forEach(function (item) {
    var log = format(item);
    fs.writeSync(outputFileHandler, log + '\n');
    fs.writeSync(outputFileHandler, "\n");
    if (argv.V) {console.log('\n' + log);}
  });
  fs.closeSync(outputFileHandler);
  console.log('\nGenerate Successful!');
}

// Helps

function getFullRepoName() {
  if (!config) {
    console.log('\nIt seems there\'s not any git projects');
  }

  return config.split(GITLAB.HOST)[1].split('\n')[0].replace(/(\:|\.git)/g, '');
}

function compareVersions(v1, v2) {
  var _v1 = semver.clean(v1[0]);
  var _v2 = semver.clean(v2[0]);

  if (semver.lt(_v1, _v2)) {
    return 1;
  }

  if (semver.gte(_v1, _v2)) {
    return -1;
  }
  
  return 0;
}

function format(item) {
  var version = item.shift();
  var date    = item.shift();

  return ('## ' + version + ' (' + date + ')\n  - ' + item.join('\n  - '));
}

function handleError(error) {
  console.log("AutoChangeLog failed because of error: ", error);
}
