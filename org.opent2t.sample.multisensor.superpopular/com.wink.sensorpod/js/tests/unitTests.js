var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runMultisensorTests = require('opent2t-device-multisensor/multisensorTests');
var deviceData = require('./devicedata');
var testData = require('./testdata');
var OpenT2TLogger = require('opent2t').Logger;
var logger = new OpenT2TLogger("info");
var MockHub = require('opent2t-device-winkhub/mockWinkHub');
var mockHub = new MockHub(logger, deviceData);

var settings = {
    logger,
    test,
    createTranslator : mockHub.createTranslator(translatorPath, deviceData.base_state.data.object_id),
    setTestData : mockHub.setTestData,
    expectedExceptions : testData.expected_exceptions,
    inputLastReading : deviceData.base_state.data.last_reading
};

// Run standard lamp unit tests
runMultisensorTests(settings);