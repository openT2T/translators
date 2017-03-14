var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runMultisensorTests = require('opent2t-device-multisensor/multisensorTests');
var deviceData = require('./devicedata');
var invalidDeviceData = require('./invalidDeviceData');
var testData = require('./testdata');
var MockHub = require('opent2t-device-winkhub/mockWinkHub');
var mockHub = new MockHub(deviceData);
var invalidConfigHub = new MockHub(invalidDeviceData);

var settings = {
    createTranslator: mockHub.createTranslator(translatorPath, deviceData.base_state.data.object_id),
    test: test,
    setTestData: mockHub.setTestData,
    expectedExceptions : testData.expected_exceptions
};

// Run standard lamp unit tests
runMultisensorTests(settings);

// Now run the same tests with invalid configuration for last_changedat_ properties
settings.setTestData = invalidConfigHub.setTestData;
runMultisensorTests(settings);