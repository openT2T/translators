var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runThermostatTests = require('opent2t-device-thermostat/thermostatTests');
var deviceData = require('./devicedata');
var MockHub = require('opent2t-device-insteonhub/mockInsteonHub');
var mockHub = new MockHub(deviceData);

var settings = {
    createTranslator: mockHub.createTranslator(translatorPath, deviceData.base_state.data.object_id),
    test: test,
    setTestData: mockHub.setTestData
};

// Run standard thermostat tests
runThermostatTests(settings);
