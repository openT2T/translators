var test = require('ava');
var translatorPath = require('path').join(__dirname, '..');
var runLampTests = require('opent2t-device-lamp/lampTests');
var deviceData = require('./devicedata');
var MockHub = require('opent2t-device-smartthingshub/mockSmartthingsHub');
var mockHub = new MockHub(deviceData);

var settings = {
    createTranslator: mockHub.createTranslator(translatorPath, deviceData.base_state.id),
    test: test,
    setTestData: mockHub.setTestData
};

// Run standard lamp unit tests
runLampTests(settings);