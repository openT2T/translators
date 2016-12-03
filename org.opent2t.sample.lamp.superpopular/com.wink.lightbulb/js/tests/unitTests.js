var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runLampTests = require('opent2t-device-lamp/lampTests');
var deviceData = require('./devicedata');
var MockHub = require('opent2t-device-winkhub/mockWinkHub');
var mockHub = new MockHub(deviceData.base_state);

function setTestData(testName, t) {
    mockHub.setTestData(deviceData.test_data[testName], t);
}

var settings = {
    createTranslator: mockHub.createTranslator(translatorPath, deviceData.base_state.data.object_id),
    test: test,
    setTestData: setTestData
};

// Run standard lamp unit tests
runLampTests(settings);