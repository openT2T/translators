var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runLampTests = require('opent2t-device-lamp/lampTests');
var deviceData = require('./devicedata');
var testData = require('./testdata');
var MockHub = require('opent2t-device-mockcontosothingshub/MockContosoThingsHub');
var mockHub = new MockHub(deviceData);

var settings = {
    createTranslator: mockHub.createTranslator(translatorPath, deviceData.base_state.id),
    test: test,
    setTestData: mockHub.setTestData,
    expectedExceptions : testData.expected_exceptions
};

// Run standard lamp unit tests
runLampTests(settings);