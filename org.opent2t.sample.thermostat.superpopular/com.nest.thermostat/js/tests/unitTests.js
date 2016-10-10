var test = require('ava');
var deviceData = require('./devicedata');
var MockHub = require('../../../test/mockHub');
var runThermostatTests = require('../../../test/thermostatTests');
var translatorPath = require('path').join(__dirname, '..');

function modifyDeviceState(deviceState, modifications) {
    if(deviceState && modifications) {
        for(var modification in modifications) {
            deviceState[modification] = modifications[modification];
        }
    }
}

function verifyPayload(payload, modification, t) {
    t.deepEqual(payload, modification, 'Verify payload');
}

var mockHub = new MockHub(deviceData.base_state, modifyDeviceState, verifyPayload);

// Run standard thermostat unit tests
runThermostatTests(translatorPath, mockHub, test, deviceData.test_data);
