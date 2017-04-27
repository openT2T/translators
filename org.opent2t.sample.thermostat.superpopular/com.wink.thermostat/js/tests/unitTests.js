var translatorPath = require('path').join(__dirname, '..');
var runThermostatTests = require('opent2t-device-thermostat/thermostatTests');
var deviceData = require('./devicedata');
var testData = require('./testdata');
var MockHub = require('opent2t-device-winkhub/mockWinkHub');
var mockHub = new MockHub(deviceData);

var settings = {
    translatorPath,
    getDeviceInfo: mockHub.getDeviceInfo.bind(mockHub),
    setTestData: mockHub.setTestData.bind(mockHub),
    expectedExceptions : testData.expected_exceptions,
};

// Run standard thermostat tests
runThermostatTests(settings);
