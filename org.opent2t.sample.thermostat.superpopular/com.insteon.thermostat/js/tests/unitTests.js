var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runThermostatTests = require('opent2t-device-thermostat/thermostatTests');
var deviceData = require('./devicedata');
var testData = require('./testdata');
var OpenT2TLogger = require('opent2t').Logger;
var logger = new OpenT2TLogger("info");
var MockHub = require('opent2t-device-insteonhub/mockInsteonHub');
var mockHub = new MockHub(logger, deviceData);

var settings = {
    logger,
    test,
    createTranslator: mockHub.createTranslator(translatorPath, deviceData.base_state.DeviceID),
    setTestData: mockHub.setTestData,
    expectedExceptions : testData.expected_exceptions
};

// Run standard thermostat tests
runThermostatTests(settings);
