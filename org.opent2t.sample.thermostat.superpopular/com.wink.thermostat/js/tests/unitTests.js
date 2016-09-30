var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var deviceState = require('./devicestate');
var MockDevice = require('../../../test/mockDevice');
var runThermostatTests = require('../../../test/thermostatTests');
var translatorPath = require('path').join(__dirname, '..');
var translator = undefined;

function modifyDeviceState(deviceState, modifications) {
    if(deviceState && modifications) {
        for(var modification in modifications) {
            deviceState.data.desired_state[modification] = modifications[modification];
        }
    }
}

function verifyPayload(payload, modification, t) {
    t.deepEqual(payload, {desired_state: modification}, 'Verify payload');
}

var testData = {
    TargetTemperatureHigh : [{max_set_point: 22}],
    TargetTemperatureLow : [{min_set_point: 19}],
    TargetTemperatureHigh_TargetTemperatureLow_Post_Get : [{max_set_point: 22, min_set_point: 19}],
    PostThermostatResURI_Set_HvacMode : [{mode: 'auto', powered: true}],
    PostThermostatResURI_Set_HvacMode_Off_Then_HeatOnly : [{powered: false}, {powered: true, mode: 'heat_only'}]
};

var mockDevice = new MockDevice(deviceState, modifyDeviceState, verifyPayload);

// Run standard thermostat unit tests
runThermostatTests(translatorPath, mockDevice, test, testData);

// setup the translator before all the tests run
test.before(async () => {
    translator = await OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', mockDevice);
});

test.serial('PostThermostatResURI_Set_AwayMode', t => {
    var value = {};
    value['awayMode'] = true;
    mockDevice.setTestData([{users_away: true}], t);

    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value])
        .then((response) => {
            t.is(response.awayMode, true);
        });
});
