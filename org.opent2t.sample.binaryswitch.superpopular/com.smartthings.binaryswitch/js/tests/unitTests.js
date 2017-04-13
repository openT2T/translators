var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runBinarySwitchTests = require('opent2t-device-binaryswitch/binarySwitchTests');
var deviceData = require('./devicedata');
var OpenT2TLogger = require('opent2t').Logger;
var logger = new OpenT2TLogger("info");
var MockHub = require('opent2t-device-smartthingshub/mockSmartthingsHub');
var mockHub = new MockHub(logger, deviceData);

var settings = {
    logger,
    createTranslator: mockHub.createTranslator(translatorPath, deviceData.base_state.id),
    test: test,
    setTestData: mockHub.setTestData
};

// Run standard binary switch unit tests
runBinarySwitchTests(settings);