'use strict';

var MockHub = require('opent2t-device-hub/mockHub');

function modifyDeviceState(deviceState, modifications) {
    if(deviceState && modifications) {
        for(var modification in modifications) {
            deviceState.attributes[modification] = modifications[modification];
        }
    }
}

function verifyPayload(modification, t, args) {
    return JSON.stringify(args[1]) === JSON.stringify(modification);
}

class MockHueHub extends MockHub {
    constructor(initialState) {
        super(initialState, modifyDeviceState, verifyPayload);
    }
}

module.exports = MockHueHub;