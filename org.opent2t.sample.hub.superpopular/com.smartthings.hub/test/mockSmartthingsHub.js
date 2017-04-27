'use strict';

var MockHub = require('opent2t-device-hub/mockHub');

class MockSmartthingsHub extends MockHub {
    constructor(initialState) {
        super(initialState.base_state.id, initialState);
    }

    modifyDeviceState(modifications, args) {
        for(var modification in modifications) {
            this.deviceState.attributes[modification] = modifications[modification];
        }
        
		this.test.true(JSON.stringify(args[2]) === JSON.stringify(modifications), 'Verify payload');
    }
}

module.exports = MockSmartthingsHub;