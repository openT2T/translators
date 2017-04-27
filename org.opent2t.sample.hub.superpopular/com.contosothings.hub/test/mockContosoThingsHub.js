'use strict';

var MockHub = require('opent2t-device-hub/mockHub');

class MockContosoThingsHub extends MockHub {
    constructor(initialState) {
        super(initialState.base_state.Id, initialState);
    }

    modifyDeviceState(modifications, args) {
        for(var modification in modifications) {
            this.deviceState[modification] = modifications[modification];
        }

        let payload = args[2];
        let key = Object.keys(modifications)[0];
        
		this.test.true(payload.propertyName == key && payload.value == modifications[key], 'Verify payload');
    }
}

module.exports = MockContosoThingsHub;