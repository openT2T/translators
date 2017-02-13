var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runBinarySwitchTests = require('opent2t-device-binaryswitch/binarySwitchTests');
var deviceData = require('./devicedata');
var MockHub = require('opent2t-device-insteonhub/mockInsteonHub');
var mockHub = new MockHub(deviceData);

var settings = {
    createTranslator: mockHub.createTranslator(translatorPath, deviceData.base_state.data.object_id),
    test: test,
    setTestData: mockHub.setTestData
};

// Run standard binary switch unit tests
runBinarySwitchTests(settings);