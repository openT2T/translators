var test = require('ava');
var deviceState = require('./devicestate');
var MockDevice = require('../../../test/mockDevice');
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

var testData = {
    TargetTemperatureHigh : [{target_temperature_high_c: 22}],
    TargetTemperatureLow : [{target_temperature_low_c: 19}],
    TargetTemperatureHigh_TargetTemperatureLow_Post_Get : [{target_temperature_high_c: 22, target_temperature_low_c: 19}],
    PostThermostatResURI_Set_HvacMode : [{hvac_mode: 'heat-cool'}],
    PostThermostatResURI_Set_HvacMode_Off_Then_HeatOnly : [{hvac_mode: 'off'}, {hvac_mode: 'heat'}]
};

var mockDevice = new MockDevice(deviceState, modifyDeviceState, verifyPayload);

// Run standard thermostat unit tests
runThermostatTests(translatorPath, mockDevice, test, testData);
