#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var fs = require('fs');
var path = require('path');
var _prompt = require('prompt');
var jsonfile = require('jsonfile');
var request = require('request');
var semver = require('semver');
var program = require('commander');
var ProgressBar = require('progress');
var CONFIG = {
    FILE: '.changelogrc',
    HOST: 'gitlab.mogujie.org/',
    API: 'http://gitlab.mogujie.org/api/v3',
    OUTPUT: 'CHANGELOG.md'
};
var PROMPT = {
    DESC: "You have not configured it yet, have you?\nPlease to work it out with the interactive prompt below.\nIt will create a config file (.changelogrc) in your system.\n\n(If you have no idea about what token is, find it in your gitlab site by following \"Profile Setting\" - \"Account\" - \"Reset Private token\")\n\nPress ^C at any time to quit.\n",
    OPTIONS: [
        {
            name: 'host',
            message: 'Your gitlab host',
            "default": CONFIG.HOST
        },
        {
            name: 'api',
            message: 'Your gitlab api',
            "default": CONFIG.API
        },
        {
            name: 'token',
            message: 'Your private token'
        }
    ]
};
var root = process.cwd();
var configFileLocation = path.resolve(process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'], CONFIG.FILE);
program.version(require(root + "/package").version).parse(process.argv);
main();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var config, host, api, token, projectPath, milestonesApi, issuesApi, milestones, logs, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    config = void 0;
                    if (!fsExistsSync(configFileLocation)) return [3, 2];
                    return [4, getConfig()];
                case 1:
                    config = _a.sent();
                    return [3, 4];
                case 2: return [4, createConfigFile()];
                case 3:
                    config = _a.sent();
                    _a.label = 4;
                case 4:
                    host = config.host, api = config.api, token = config.token;
                    projectPath = getProjectPath(host);
                    milestonesApi = api + "/projects/" + encodeURIComponent(projectPath) + "/milestones?private_token=" + token;
                    issuesApi = api + "/projects/" + encodeURIComponent(projectPath) + "/milestones/#{milestoneId}/issues?private_token=" + token;
                    return [4, fetchMilestones(milestonesApi)];
                case 5:
                    milestones = _a.sent();
                    return [4, generateLogs(milestones, issuesApi)];
                case 6:
                    logs = _a.sent();
                    generateChangeLog(logs);
                    return [3, 8];
                case 7:
                    e_1 = _a.sent();
                    console.error(e_1);
                    return [3, 8];
                case 8: return [2];
            }
        });
    });
}
function fsExistsSync(path) {
    try {
        fs.accessSync(path, fs.F_OK);
    }
    catch (e) {
        return false;
    }
    return true;
}
function getConfig() {
    return new Promise(function (resolve, reject) {
        jsonfile.readFile(configFileLocation, function (e, data) {
            if (!e) {
                resolve(data);
            }
            else {
                reject(e);
            }
        });
    });
}
function createConfigFile() {
    return new Promise(function (resolve, reject) {
        console.log(PROMPT.DESC);
        _prompt.message = 'Enter';
        _prompt.start();
        _prompt.get(PROMPT.OPTIONS, function (e, result) {
            if (e) {
                reject("\n" + e);
                return;
            }
            var content = {
                host: result.host,
                api: result.api,
                token: result.token
            };
            jsonfile.writeFile(configFileLocation, content, function (e) {
                if (!e) {
                    console.log('\n');
                    resolve(content);
                }
                else {
                    reject("Unable to write file: " + configFileLocation);
                }
            });
        });
    });
}
function fetchMilestones(api) {
    var promise = new Promise(function (resolve, reject) {
        request(api, function (e, response, body) {
            if (!e && response.statusCode === 200) {
                var milestones = JSON.parse(body);
                if (milestones.length) {
                    resolve(milestones);
                }
                else {
                    reject("There's no milestone yet.");
                }
            }
            else if (response) {
                reject("Unable to fetch milestones because: " + JSON.parse(response.body).message + ".");
            }
            else {
                reject(e);
            }
        }).on('response', function () {
            console.log('Starting to fetch all the milestones of this project.\n');
        });
    });
    promise.then(function (response) {
        if (response.length > 1) {
            console.log("Get " + response.length + " milestones totally.\nGetting start to fetch all the issues of these milestones:\n");
        }
        else if (response.length === 1) {
            console.log('Get only one milestone, fetch the issues of this milestone:\n');
        }
    });
    return promise;
}
function generateLogs(milestones, api) {
    'use strict';
    return __awaiter(this, void 0, void 0, function () {
        var promises, barOpts, bar;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = milestones.map(function (milestone) {
                        return generateLog(milestone, api);
                    });
                    barOpts = {
                        complete: '=',
                        incomplete: ' ',
                        width: 20,
                        total: promises.length
                    };
                    bar = new ProgressBar('  fetching issues [:bar] :percent :elapseds', barOpts);
                    promises.forEach(function (promise) {
                        promise.then(function () {
                            bar.tick();
                        });
                    });
                    return [4, Promise.all(promises)];
                case 1: return [2, _a.sent()];
            }
        });
    });
}
function generateLog(milestone, api) {
    return new Promise(function (resolve, reject) {
        request(api.replace(/#{milestoneId}/, "" + milestone.id), function (e, response, body) {
            'use strict';
            if (!e && response.statusCode === 200) {
                var version = milestone.title;
                var update = milestone.created_at.substr(0, 10);
                var issues = JSON.parse(body);
                var content = issues.map(function (issue) {
                    if (issue.assignee && issue.assignee.username) {
                        return "- " + issue.title + " (#" + issue.iid + " @" + issue.assignee.username + ")";
                    }
                    else {
                        return "- " + issue.title + " (#" + issue.iid + ")";
                    }
                });
                if (milestone.state !== 'closed') {
                    content.unshift("## " + version + "(unreleased)");
                }
                else {
                    content.unshift("## " + version + " - " + update);
                }
                resolve({
                    version: version,
                    content: content
                });
            }
            else if (response) {
                reject("Unable to fetch issues of " + milestone.id + " milestone because: " + JSON.parse(response.body).message);
            }
            else {
                reject(e);
            }
        });
    });
}
function generateChangeLog(logs) {
    'use strict';
    console.log("\nGenerating changelog into " + CONFIG.OUTPUT);
    logs = logs.sort(compareVersions);
    var body = logs.map(function (log) {
        return log.content.join('\n');
    });
    body = body.join('\n\n');
    fs.writeFile(CONFIG.OUTPUT, body, function (e) {
        if (!e) {
            console.log("\nOK, " + CONFIG.OUTPUT + " generated successfully!");
        }
        else {
            console.error(e);
        }
    });
}
function getProjectPath(host) {
    'use strict';
    var gitConfig;
    var projectPath;
    try {
        gitConfig = fs.readFileSync('.git/config', 'utf8');
    }
    catch (e) {
        throw "It can't be done because it's not a git project.";
    }
    try {
        projectPath = ("" + gitConfig)
            .split(host)[1]
            .split('\n')[0]
            .replace(/(\:|\.git)/g, '');
    }
    catch (e) {
        throw "No gitlab project found in " + root;
    }
    return projectPath;
}
function compareVersions(log1, log2) {
    var v1 = semver.clean(log1.version);
    var v2 = semver.clean(log2.version);
    if (!v1 || !v2) {
        return;
    }
    return semver.rcompare(v1, v2);
}
