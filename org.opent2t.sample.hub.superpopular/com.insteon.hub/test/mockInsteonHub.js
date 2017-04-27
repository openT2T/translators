'use strict';

var MockHub = require('opent2t-device-hub/mockHub');

class MockInsteonHub extends MockHub {
    constructor(initialState) {
        super(initialState.base_state.DeviceID, initialState);
    }

    modifyDeviceState(modifications, args) {
        for(var modification in modifications) {
            this.deviceState[modification] = modifications[modification];
        }
        
		this.verifyPayload(modifications, args);
    }

    verifyPayload(modification, args) {
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
        this.test.true(JSON.stringify(args[1]) === JSON.stringify(expectedPayload), 'Verify payload');
    }
}

module.exports = MockInsteonHub;