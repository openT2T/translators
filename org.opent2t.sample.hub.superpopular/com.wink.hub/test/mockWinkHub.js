'use strict';

var _ = require('lodash');

var MockHub = require('opent2t-device-hub/mockHub');

function modifyDeviceState(deviceState, modifications) {
    if(deviceState && modifications) {
        for(var modification in modifications) {
            deviceState.data.desired_state[modification] = modifications[modification];
        }
    }
}

function verifyPayload(modification, t, args) {
    return _.isEqual(args[2], {"desired_state": modification});
}

class MockWinkHub extends MockHub {
    constructor(logger, initialState) {
        super(logger, initialState, modifyDeviceState, verifyPayload);
    }
}

module.exports = MockWinkHub;