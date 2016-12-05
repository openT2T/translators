var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runBinarySwitchTests = require('opent2t-device-binaryswitch/binarySwitchTests');
var deviceData = require('./devicedata');
var MockHub = require('opent2t-device-smartthingshub/mockSmartthingsHub');
var mockHub = new MockHub(deviceData.base_state);
var deviceId = "Mock Id";

function setTestData(testName, t) {
    mockHub.setTestData(deviceData.test_data[testName], t);
}

// Run standard binary switch unit tests
runBinarySwitchTests(mockHub.createTranslator(translatorPath), deviceId, test, setTestData);