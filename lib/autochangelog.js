#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var Q = require("q");
var request = require('request');
var prompt = require('prompt');
var semver = require('semver');

var pkg = fs.readFileSync(__dirname.replace(/lib/, '') + '/package.json', 'utf8');
var config = fs.readFileSync('.git/config', 'utf8');
var fullRepoName;
var outputFileName;
var items = [];

var GITLAB = {
  HOST: 'git.cairenhui.com',
  API: 'http://git.cairenhui.com/api/v3'
};

init().then(getMilestones).then(generateChangeLog).fail(handleError);

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
    {name: 'token', message: 'GitLab Token', required: true}, 
    {name: 'output', message: 'Output File', default: 'CHANGELOG.md'}
  ], function (err, result) {
    if (err !== null) {
      initDeferred.reject(err);
      return;
    }

    console.log('Generating changelog for ' + fullRepoName + ' to', outputFileName = result.output);

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
    if (error !== null) {
      console.log(error);
    }
    
    var issues = JSON.parse(body);
    var _issues = [];

    issues.forEach(function (issue) {
      // console.log(issue.title);
      _issues.push(issue.title);
    });

    _issues.unshift(version, date);

    // console.log(_issues);
    items.push(_issues);
    deferred.resolve(items);
  });

  return deferred;
}

function generateChangeLog() {
  items.sort(compareVersions);
  // console.log(outputFileName);
  var outputFileHandler = fs.openSync(outputFileName, 'w');
  items.forEach(function (item) {
    fs.writeSync(outputFileHandler, format(item) + '\n');
    fs.writeSync(outputFileHandler, "\n")
  });
  fs.closeSync(outputFileHandler);
  console.log('done!');
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
