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
const ProgressBar = require('progress');
const CONFIG = {
    FILE: '.changelogrc',
    HOST: 'git.cairenhui.com',
    API: 'http://git.cairenhui.com/api/v3',
    OUTPUT: 'CHANGELOG.md'
};
const PROMPT = {
    DESC: 'You have not configured it yet, have you?\n' +
        'Please to work it out with the interactive prompt below.\n' +
        'It will create a config file (.changelogrc) in your system.\n\n' +
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
program
    .version(require('./package').version)
    .parse(process.argv);
(function () {
    return __awaiter(this, void 0, Promise, function* () {
        'use strict';
        try {
            let config = yield getConfing();
            if (!config) {
                config = yield createConfigFile();
            }
            const host = config.host;
            const api = config.api;
            const token = config.token;
            const projectPath = getProjectPath(host);
            const milestonesApi = `${api}/projects/${encodeURIComponent(projectPath)}/milestones?private_token=${token}`;
            const issuesApi = `${api}/projects/${encodeURIComponent(projectPath)}/milestones/#{milestoneId}/issues?private_token=${token}`;
            const milestones = yield fetchMilestones(milestonesApi);
            const logs = yield generateLogs(milestones, issuesApi);
            generateChangeLog(logs);
        }
        catch (e) {
            console.error(e);
        }
    });
})();
function getConfing() {
    return new Promise((resolve, reject) => {
        jsonfile.readFile(configFile, (e, data) => {
            if (!e) {
                resolve(data);
            }
            else {
                resolve(false);
            }
        });
    });
}
function createConfigFile() {
    return new Promise((resolve, reject) => {
        console.log(PROMPT.DESC);
        _prompt.message = 'Enter';
        _prompt.start();
        _prompt.get(PROMPT.OPTIONS, (e, result) => {
            if (e) {
                reject(`\n${e}`);
                return;
            }
            const content = {
                host: result.host,
                api: result.api,
                token: result.token
            };
            jsonfile.writeFile(configFile, content, (e) => {
                if (!e) {
                    console.log('\n');
                    resolve(content);
                }
                else {
                    reject(`Unable to write file: ${configFile}`);
                }
            });
        });
    });
}
function fetchMilestones(api) {
    const promise = new Promise((resolve, reject) => {
        request(api, (e, response, body) => {
            if (!e && response.statusCode === 200) {
                const milestones = JSON.parse(body);
                if (milestones.length) {
                    resolve(milestones);
                }
                else {
                    reject('There\'s no milestone yet.');
                }
            }
            else if (response) {
                reject(`Unable to fetch milestones because: ${JSON.parse(response.body).message}.`);
            }
            else {
                reject(e);
            }
        })
            .on('response', () => {
            console.log('Starting to fetch all the milestones of this project.\n');
        });
    });
    promise.then((response) => {
        if (response.length > 1) {
            console.log(`Get ${response.length} milestones totally.\nGetting start to fetch all the issues of these milestones:\n`);
        }
        else if (response.length === 1) {
            console.log('Get only one milestone, fetch the issues of this milestone:\n');
        }
    });
    return promise;
}
function generateLogs(milestones, api) {
    return __awaiter(this, void 0, Promise, function* () {
        'use strict';
        let promises = milestones.map((milestone) => generateLog(milestone, api));
        const barOpts = {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: promises.length
        };
        const bar = new ProgressBar('  fetching issues [:bar] :percent :elapseds', barOpts);
        promises.forEach((promise) => {
            promise.then(() => {
                bar.tick();
            });
        });
        return yield Promise.all(promises);
    });
}
function generateLog(milestone, api) {
    return new Promise((resolve, reject) => {
        request(api.replace(/#{milestoneId}/, `${milestone.id}`), (e, response, body) => {
            'use strict';
            if (!e && response.statusCode === 200) {
                const version = milestone.title;
                const update = milestone.created_at.substr(0, 10);
                const issues = JSON.parse(body);
                let content = issues.map((issue) => {
                    // handle unassigned issue
                    let username = issue.assignee && issue.assignee.username ? ` @${issue.assignee.username}` : ''
                    return `- ${issue.title} (#${issue.iid}${username})`;
                });
                content.unshift(`## ${version} - ${update}`);
                resolve({
                    version: version,
                    content: content
                });
            }
            else if (response) {
                reject(`Unable to fetch issues of ${milestone.id} milestone because: ${JSON.parse(response.body).message}`);
            }
            else {
                reject(e);
            }
        });
    });
}
function generateChangeLog(logs) {
    'use strict';
    console.log(`\nGenerating changelog into ${CONFIG.OUTPUT}`);
    logs = logs.sort(compareVersions);
    let body = logs.map((log) => {
        return log.content.join('\n');
    });
    body = body.join('\n\n');
    fs.writeFile(CONFIG.OUTPUT, body, (e) => {
        if (!e) {
            console.log(`\nOK, ${CONFIG.OUTPUT} generated successfully!`);
        }
        else {
            console.error(e);
        }
    });
}
function getProjectPath(host) {
    'use strict';
    let gitConfig;
    let projectPath;
    try {
        gitConfig = fs.readFileSync('.git/config', 'utf8');
    }
    catch (e) {
        throw `It can't be done because it's not a git project.`;
    }
    try {
        projectPath = `${gitConfig}`.split(host)[1].split('\n')[0].replace(/(\:|\.git)/g, '');
    }
    catch (e) {
        throw `No gitlab project found in ${root}`;
    }
    return projectPath;
}
function compareVersions(log1, log2) {
    const v1 = semver.clean(log1.version);
    const v2 = semver.clean(log2.version);
    if (!v1 || !v2) {
        return;
    }
    return semver.rcompare(v1, v2);
}
