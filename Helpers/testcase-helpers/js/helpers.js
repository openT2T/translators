'use strict';

var OpenT2TConstants = require('opent2t').OpenT2TConstants;

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

module.exports.runTest = runTest;
module.exports.verifyModesData = verifyModesData;
