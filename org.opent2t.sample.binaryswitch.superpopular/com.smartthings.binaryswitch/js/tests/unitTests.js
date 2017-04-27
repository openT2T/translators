var translatorPath = require('path').join(__dirname, '..');
var runBinarySwitchTests = require('opent2t-device-binaryswitch/binarySwitchTests');
var deviceData = require('./devicedata');
var MockHub = require('opent2t-device-smartthingshub/mockSmartthingsHub');
var mockHub = new MockHub(deviceData);

var settings = {
    translatorPath,
    getDeviceInfo: mockHub.getDeviceInfo.bind(mockHub),
    setTestData: mockHub.setTestData.bind(mockHub),
};

// Run standard binary switch unit tests
runBinarySwitchTests(settings);