var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runBinarySwitchTests = require('opent2t-device-binaryswitch/binarySwitchTests');
var deviceData = require('./devicedata');
var OpenT2TLogger = require('opent2t').Logger;
var logger = new OpenT2TLogger("info");
var MockHub = require('opent2t-device-winkhub/mockWinkHub');
var mockHub = new MockHub(logger, deviceData);

var settings = {
    logger,
    test,
    createTranslator: mockHub.createTranslator(translatorPath, deviceData.base_state.data.object_id),
    setTestData: mockHub.setTestData
};

// Run standard binary switch unit tests
runBinarySwitchTests(settings);