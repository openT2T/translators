'use strict';

var q = require('q');

class MockHub {

    constructor(id, deviceData) {
        this.controlId = id;
        this.deviceState = deviceData.base_state;
        this.testData = deviceData.test_data;
    }
	
	getDeviceDetailsAsync() {
		return q.fcall(() => this.deviceState);
	}

    putDeviceDetailsAsync() {
        if(this.modifyDeviceState) {
            this.modifyDeviceState(this.postData.shift(), arguments);
        }
		
		return this.getDeviceDetailsAsync();
	}
	
	getDeviceInfo() {
        return { hub: this, deviceInfo: { opent2t : { controlId : this.controlId } } };
    }

    setTestData(testName, test) {
        this.postData = this.testData[testName];
		this.test = test;
    }
}

module.exports = MockHub;