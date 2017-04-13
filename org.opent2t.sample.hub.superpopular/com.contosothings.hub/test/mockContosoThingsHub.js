'use strict';

var MockHub = require('opent2t-device-hub/mockHub');

// given a deviceState, applies the modification to it
function modifyDeviceState(deviceState, modifications) {
    if(deviceState && modifications) {
        for(var modification in modifications) {
            deviceState[modification] = modifications[modification];
        }
    }
}

/// ensures the payload matches the modification
function verifyPayload(modification, t, args) {
    var payload = args[2];
    var key = Object.keys(modification)[0];
    return payload.propertyName == key && payload.value == modification[key];
}

class MockContosoThingsHub extends MockHub {
    constructor(logger, initialState) {
        super(logger, initialState, modifyDeviceState, verifyPayload);
    }
}

module.exports = MockContosoThingsHub;