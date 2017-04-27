var translatorPath = require('path').join(__dirname, '..');
var runMultisensorTests = require('opent2t-device-multisensor/multisensorTests');
var deviceData = require('./devicedata');
var testData = require('./testdata');
var MockHub = require('opent2t-device-smartthingshub/mockSmartthingsHub');
var mockHub = new MockHub(deviceData);

var settings = {
    translatorPath,
    getDeviceInfo: mockHub.getDeviceInfo.bind(mockHub),
    setTestData: mockHub.setTestData.bind(mockHub),
    expectedExceptions : testData.expected_exceptions,
};

// Run standard lamp unit tests
runMultisensorTests(settings);