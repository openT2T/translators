'use strict';

var q = require('q');
var MockHub = require('opent2t-device-hub/mockHub');

function modifyDeviceState(deviceState, modifications) {
    if(deviceState && modifications) {
        for(var modification in modifications) {
            deviceState[modification] = modifications[modification];
        }
    }
}

function verifyPayload(modification, t, args) {
    return JSON.stringify(args[2]) === JSON.stringify(modification);
}

class MockNestHub extends MockHub {
    constructor(logger, initialState) {
        super(logger, initialState, modifyDeviceState, verifyPayload);
        this.hub.setAwayMode = function(structureId, deviceId, mode) {
            return q.fcall(function () {
                    return {device_id: deviceId, awayMode: mode};
                });
        }
    }
}

module.exports = MockNestHub;