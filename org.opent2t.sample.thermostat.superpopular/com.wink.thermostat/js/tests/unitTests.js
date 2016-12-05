var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runThermostatTests = require('opent2t-device-thermostat/thermostatTests');
var runWinkThermostatTests = require('./winkThermostatTests');
var deviceData = require('./devicedata');
var MockHub = require('opent2t-device-winkhub/mockWinkHub');
var mockHub = new MockHub(deviceData.base_state);
var deviceId = "D5D37EB6-F428-41FA-AC5D-918F084A4C93";
var createTranslator = mockHub.createTranslator(translatorPath);

function setTestData(testName, t) {
    mockHub.setTestData(deviceData.test_data[testName], t);
}

// Run standard thermostat tests
runThermostatTests(createTranslator, deviceId, test, setTestData);

// Run wink thermostat tests
runWinkThermostatTests(createTranslator, deviceId, test, setTestData);
