'use strict';

var MockHub = require('opent2t-device-hub/mockHub');

function modifyDeviceState(deviceState, modifications) {
    if(deviceState && modifications) {
        for(var modification in modifications) {
            deviceState.data.desired_state[modification] = modifications[modification];
        }
    }
}

function verifyPayload(modification, t, args) {
    return JSON.stringify(args[2]) === JSON.stringify({"desired_state": modification});
}

class MockInsteonHub extends MockHub {
    constructor(initialState) {
        super(initialState, modifyDeviceState, verifyPayload);
    }
}

module.exports = MockInsteonHub;