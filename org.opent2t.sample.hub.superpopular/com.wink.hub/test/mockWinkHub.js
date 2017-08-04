'use strict';

var _ = require('lodash');
var MockHub = require('opent2t-device-hub/mockHub');

class MockWinkHub extends MockHub {
    constructor(initialState) {
        super(initialState.base_state.data.object_id, initialState);
    }

    modifyDeviceState(modifications, args) {
        for(var modification in modifications) {
            this.deviceState.data.desired_state[modification] = modifications[modification];
        }
        
		this.test.true(_.isEqual(args[2], {"desired_state": modifications}), 'Verify payload');
    }
}

module.exports = MockWinkHub;