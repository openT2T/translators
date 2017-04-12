'use strict';

var MockHub = require('opent2t-device-hub/mockHub');

function modifyDeviceState(deviceState, modifications) {
    if(deviceState && modifications) {
        for(var modification in modifications) {
            deviceState[modification] = modifications[modification];
        }
    }
}

function verifyPayload(modification, t, args) {
    let expectedPayload = undefined;
    if(modification.Power !== undefined) {
        expectedPayload = {command: modification.Power};
    }
	else if(modification.Level !== undefined) {
        expectedPayload = {command: 'on', level: modification.Level};
    }
	else if(modification.cool_point !== undefined) {
        expectedPayload = {command: 'set_cool_to', temp: modification.cool_point};
    }
    else if(modification.heat_point !== undefined) {
        expectedPayload = {command: 'set_heat_to', temp: modification.heat_point};
    }
    else if(modification.fan !== undefined) {
        expectedPayload = {command: 'fan_' + modification.fan};
    }
    else if(modification.mode !== undefined) {
        expectedPayload = {command: modification.mode};
    }
    return JSON.stringify(args[1]) === JSON.stringify(expectedPayload);
}

class MockInsteonHub extends MockHub {
    constructor(logger, initialState) {
        super(logger, initialState, modifyDeviceState, verifyPayload);
    }
}

module.exports = MockInsteonHub;