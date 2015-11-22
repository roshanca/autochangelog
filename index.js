#!/usr/bin/env node --harmony
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) { return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) { resolve(value); }); }
        function onfulfill(value) { try { step("next", value); } catch (e) { reject(e); } }
        function onreject(value) { try { step("throw", value); } catch (e) { reject(e); } }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
const fs = require('fs');
const path = require('path');
const _prompt = require('prompt');
const jsonfile = require('jsonfile');
const request = require('request');
const semver = require('semver');
const program = require('commander');
const CONFIG = {
    FILE: '.changelogrc',
    HOST: 'git.cairenhui.com',
    API: 'http://git.cairenhui.com/api/v3',
    OUTPUT: 'CHANGELOG.md'
};
const PROMPT = {
    DESC: 'You have not configed it yet, have you?\n' +
        'Please to work it out according to the interactive prompt.\n' +
        'It will creating config file (.changelogrc) in your system automatically.\n\n' +
        '(If you have no idea about what token is, find it in your gitlab site by ' +
        'following "Profile Setting" - "Account" - "Reset Private token")\n\n' +
        'Press ^C at any time to quit.\n',
    OPTIONS: [
        {
            name: 'host',
            message: 'Your gitlab host',
            default: CONFIG.HOST
        },
        {
            name: 'api',
            message: 'Your gitlab api',
            default: CONFIG.API
        },
        {
            name: 'token',
            message: 'Your private token'
        }
    ]
};
const root = process.cwd();
const configFile = path.resolve(process.env.HOME, CONFIG.FILE);
function getVersion() {
    return require('./package').version;
}
program
    .version(getVersion())
    .parse(process.argv);
(function () {
    return __awaiter(this, void 0, Promise, function* () {
        try {
            const isConfigFileExist = yield isFileExists(configFile);
            if (!isConfigFileExist) {
                yield createConfigFile();
            }
            const token = getToken();
            const projectPath = getProjectPath();
            const milestonesApi = `${CONFIG.API}/projects/${encodeURIComponent(projectPath)}/milestones?private_token=${token}`;
            const issuesApi = `${CONFIG.API}/projects/${encodeURIComponent(projectPath)}/milestones/#{milestoneId}/issues?private_token=${token}`;
            const milestones = yield fetchMilestones(milestonesApi);
            const logs = yield generateLogs(milestones, issuesApi);
            console.log(`Generating changelog of ${projectPath} to ${CONFIG.OUTPUT}`);
            generateChangeLog(logs);
        }
        catch (e) {
            console.error(e);
        }
    });
})();
function isFileExists(file) {
    return __awaiter(this, void 0, Promise, function* () {
        return new Promise((resolve, reject) => {
            fs.stat(file, (e, stat) => {
                if (e === null && stat.isFile()) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
        });
    });
}
function createConfigFile() {
    return __awaiter(this, void 0, Promise, function* () {
        return new Promise((resolve, reject) => {
            console.log(PROMPT.DESC);
            _prompt.message = 'Enter';
            _prompt.start();
            _prompt.get(PROMPT.OPTIONS, (e, result) => {
                if (e) {
                    reject(e);
                    return;
                }
                const content = {
                    host: result.host,
                    api: result.api,
                    token: result.token
                };
                jsonfile.writeFile(configFile, content, () => {
                    try {
                        resolve(true);
                    }
                    catch (e) {
                        console.error(e);
                    }
                });
            });
        });
    });
}
function fetchMilestones(api) {
    return __awaiter(this, void 0, Promise, function* () {
        return new Promise((resolve, reject) => {
            request(api, (e, response, body) => {
                if (!e && response.statusCode === 200) {
                    const milestones = JSON.parse(body);
                    resolve(milestones);
                }
                else if (response) {
                    console.error(`Unable to fetch milestones because: ${JSON.parse(response.body).message}`);
                }
                else {
                    console.error(e);
                }
            });
        });
    });
}
function generateLogs(milestones, api) {
    return __awaiter(this, void 0, Promise, function* () {
        'use strict';
        let promises = milestones.map((milestone) => generateLog(milestone, api));
        return yield Promise.all(promises);
    });
}
function generateLog(milestone, api) {
    return __awaiter(this, void 0, Promise, function* () {
        return new Promise((resolve, reject) => {
            request(api.replace(/#{milestoneId}/, milestone.id), (e, response, body) => {
                'use strict';
                if (!e && response.statusCode === 200) {
                    const version = milestone.title;
                    const update = milestone.created_at.substr(0, 10);
                    const issues = JSON.parse(body);
                    let content = issues.map((issue) => {
                        return `- ${issue.title} (#${issue.iid} @${issue.assignee.username})`;
                    });
                    content.unshift(`## ${version} - ${update}`);
                    resolve({
                        version: version,
                        content: content
                    });
                }
                else if (response) {
                    console.error(`Unable to fetch issues of ${milestone.id} milestone because: ${JSON.parse(response.body).message}`);
                }
                else {
                    console.error(e);
                }
            });
        });
    });
}
function generateChangeLog(logs) {
    'use strict';
    logs = logs.sort(compareVersions);
    let body = logs.map((log) => {
        return log.content.join('\n');
    });
    body = body.join('\n\n');
    fs.writeFile(CONFIG.OUTPUT, body, (e) => {
        console.log(`\nOK, ${CONFIG.OUTPUT} generated successfully!`);
    });
}
function getProjectPath() {
    'use strict';
    let gitConfig;
    let projectPath;
    try {
        gitConfig = fs.readFileSync('.git/config', { encoding: 'utf8' });
    }
    catch (e) {
        throw `It can't be done because it's not a git project.`;
    }
    try {
        projectPath = gitConfig.split(CONFIG.HOST)[1].split('\n')[0].replace(/(\:|\.git)/g, '');
    }
    catch (e) {
        throw `No gitlab project found in ${root}`;
    }
    return projectPath;
}
function getToken() {
    return jsonfile.readFileSync(configFile).token;
}
function compareVersions(v1, v2) {
    var _v1 = semver.clean(v1.version);
    var _v2 = semver.clean(v2.version);
    if (!_v1 || !_v2) {
        return;
    }
    return semver.rcompare(_v1, _v2);
}
