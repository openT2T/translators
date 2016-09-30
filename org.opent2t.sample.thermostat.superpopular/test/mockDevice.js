'use strict';

var q = require('q');
var postData = undefined;
var deviceState = undefined;
var stateModifier = undefined;
var payloadVerifier = undefined;
var t = undefined;

class MockDevice {

    constructor(initialState, modifier, verifier) {
        deviceState = initialState;
        stateModifier = modifier;
        payloadVerifier = verifier;
        this.deviceInfo = { id : 'Mock Thermostat' };
        this.hub = {
            getDeviceDetailsAsync : function() {
                return q.fcall(function () {
                    return deviceState;
                });
            },

            putDeviceDetailsAsync : function(deviceType, deviceId, payload) {
                var modification = postData.shift();
                stateModifier(deviceState, modification);
                if(payloadVerifier) {
                    payloadVerifier(payload, modification, t);
                }
                return q.fcall(function () {
                    return deviceState;
                });
            }
        };
    }

    setTestData(data, test) {
        postData = data;
        t = test;
    }
}

module.exports = MockDevice;