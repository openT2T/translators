'use strict';

var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;
var OpenT2TLogger = require('opent2t').Logger;

function runTest(settings, t, testMethod) {
    let expectedException = settings.expectedExceptions === undefined ? undefined : settings.expectedExceptions[t.title];

    if (settings.setTestData) {
        settings.setTestData(t.title, t);
    }

    if (expectedException !== undefined) {
        return testMethod().then(() => {
            t.fail(`Error expected: ${expectedException}`);
        }).catch(error => {
            let message = expectedException.message;

            if (expectedException.isOpent2tError === undefined || expectedException.isOpent2tError === true) {
                t.is(error.name, 'OpenT2TError', `Verify error type, Actual: ${error.name}, Expected: OpenT2TError`);
                if (expectedException.statusCode !== undefined) {
                    t.is(error.statusCode, expectedException.statusCode, `Verify status code, Actual: ${error.statusCode}, Expected: ${expectedException.statusCode}`);
                }
                if (expectedException.messageConst !== undefined) {
                    message = OpenT2TConstants[expectedException.messageConst];
                }
            }

            if (message !== undefined) {
                t.is(error.message, message, `Verify error message, Actual: ${error.message}, Expected: ${message}`);
            }
        });
    }
    else {
        return testMethod();
    }
}

function verifyModesData(t, response) {
    t.is(response.rt[0], 'oic.r.mode', 'Verify mode resource type');
    t.is(Object.prototype.toString.call(response.modes), '[object Array]', 'Verify modes data is object array');
}

function createLogger() {
    return new OpenT2TLogger("info");
}

function createOpenT2T() {
    return new OpenT2T(createLogger());
}

function updateSettings(settings) {
    if (!settings.opent2t) {
        settings.opent2t = createOpenT2T();
    }

    if (!settings.test) {
        settings.test = test;
    }
}

module.exports.runTest = runTest;
module.exports.verifyModesData = verifyModesData;
module.exports.createLogger = createLogger;
module.exports.createOpenT2T = createOpenT2T;
module.exports.updateSettings = updateSettings;
