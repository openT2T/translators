var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var deviceData = require('./devicedata');
var MockHub = require('../../../test/mockHub');
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

var mockHub = new MockHub(deviceData.base_state, modifyDeviceState, verifyPayload);

// Run standard thermostat unit tests
runThermostatTests(translatorPath, mockHub, test, deviceData.test_data);

// setup the translator before all the tests run
test.before(async () => {
    translator = await OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', mockHub);
});

test.serial('PostThermostatResURI_Set_AwayMode', t => {
    var value = {};
    value['awayMode'] = true;
    mockHub.setTestData([{users_away: true}], t);

    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value])
        .then((response) => {
            t.is(response.awayMode, true);
        });
});
