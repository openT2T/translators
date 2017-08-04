'use strict';

var q = require('q');
var MockHub = require('opent2t-device-hub/mockHub');

class MockNestHub extends MockHub {
    constructor(initialState) {
        super(initialState.base_state.device_id, initialState);
    }

    modifyDeviceState(modifications, args) {
        for(var modification in modifications) {
            this.deviceState[modification] = modifications[modification];
        }
        
		this.test.true(JSON.stringify(args[2]) === JSON.stringify(modifications), 'Verify payload');
    }

    setAwayMode(structureId, deviceId, mode) {
        return q.fcall(function () {
            return {device_id: deviceId, awayMode: mode};
        });
    }
}

module.exports = MockNestHub;