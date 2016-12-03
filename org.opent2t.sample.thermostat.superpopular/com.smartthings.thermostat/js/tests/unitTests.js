var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runThermostatTests = require('opent2t-device-thermostat/thermostatTests');
var deviceData = require('./devicedata');
var MockHub = require('opent2t-device-smartthingshub/mockSmartthingsHub');
var mockHub = new MockHub(deviceData.base_state);

function setTestData(testName, t) {
    mockHub.setTestData(deviceData.test_data[testName], t);
}

var settings = {
    createTranslator: mockHub.createTranslator(translatorPath, deviceData.base_state.id),
    test: test,
    setTestData: setTestData
};

// Run standard thermostat unit tests
runThermostatTests(settings);