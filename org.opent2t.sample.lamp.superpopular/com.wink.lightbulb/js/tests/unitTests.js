var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runLampTests = require('opent2t-device-lamp/lampTests');
var deviceData = require('./devicedata');
var MockHub = require('opent2t-device-winkhub/mockWinkHub');
var mockHub = new MockHub(deviceData.base_state);
var deviceId = "F8CFB903-58BB-4753-97E0-72BD7DBC7933";

function setTestData(testName, t) {
    mockHub.setTestData(deviceData.test_data[testName], t);
}

// Run standard lamp unit tests
runLampTests(mockHub.createTranslator(translatorPath), deviceId, test, setTestData);