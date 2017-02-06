var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runThermostatTests = require('opent2t-device-thermostat/thermostatTests');
var deviceData = require('./devicedata');
var MockHub = require('opent2t-device-nesthub/mockNestHub');
var mockHub = new MockHub(deviceData);

var settings = {
    createTranslator: mockHub.createTranslator(translatorPath, deviceData.base_state.id),
    test: test,
    setTestData: mockHub.setTestData
};

// Run standard thermostat unit tests
runThermostatTests(settings);