'use strict';

var q = require('q');
var OpenT2T = require('opent2t').OpenT2T;
var postData = undefined;
var deviceState = undefined;
var testData = undefined;
var stateModifier = undefined;
var payloadVerifier = undefined;
var t = undefined;

class MockHub {

    constructor(deviceData, modifier, verifier) {
        deviceState = deviceData.base_state;
        testData = deviceData.test_data;
        stateModifier = modifier;
        payloadVerifier = verifier;
        this.deviceInfo = { opent2t : { controlId : 'Mock Hub Device' } };
        this.hub = {
            getDeviceDetailsAsync : function() {
                return q.fcall(function () {
                    return deviceState;
                });
            },

            putDeviceDetailsAsync : function() {
                var modification = postData.shift();
                stateModifier(deviceState, modification);
                if(payloadVerifier) {
                    t.true(payloadVerifier(modification, t, arguments), 'Verify payload');
                }
                return q.fcall(function () {
                    return deviceState;
                });
            }
        };
    }

    createTranslator(translatorPath, controlId) {
        var deviceInfo = {};
        deviceInfo.deviceInfo = { opent2t : { controlId : controlId } };
        deviceInfo.hub = this.hub;
        return function () {
            return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', deviceInfo);
        };
    }

    setTestData(testName, test) {
        postData = testData[testName];
        t = test;
    }
}

module.exports = MockHub;