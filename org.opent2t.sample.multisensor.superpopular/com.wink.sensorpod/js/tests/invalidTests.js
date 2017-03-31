var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runMultisensorTests = require('opent2t-device-multisensor/multisensorTests');
var invalidDeviceData = require('./invalidDeviceData');
var testData = require('./testdata');
var MockHub = require('opent2t-device-winkhub/mockWinkHub');
var invalidConfigHub = new MockHub(invalidDeviceData);

// Now run the same tests with invalid configuration for last_changedate_ properties
var invalidSettings = {
    createTranslator : invalidConfigHub.createTranslator(translatorPath, invalidDeviceData.base_state.data.object_id),
    test : test,
    setTestData : invalidConfigHub.setTestData,
    expectedExceptions : testData.expected_exceptions,
    inputLastReading : invalidDeviceData.base_state.data.last_reading
};

runMultisensorTests(invalidSettings);