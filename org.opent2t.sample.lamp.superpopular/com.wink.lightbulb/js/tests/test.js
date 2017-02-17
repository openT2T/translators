var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var translatorPath = require('path').join(__dirname, '..');
var runLampTests = require('opent2t-device-lamp/lampTests');
var config = require('./testConfig');
var hubPath = require('path').join(__dirname, '../../../../org.opent2t.sample.hub.superpopular/com.wink.hub/js');
var testData = require('./testdata');

function getLamp(devices) {
    for (var i = 0; i < devices.length; i++) {
        var d = devices[i];

        if (d.opent2t.translator === 'opent2t-translator-com-wink-lightbulb') {
            return d;
        }
    }

    return undefined;
}

function createTranslator() {
    return OpenT2T.createTranslatorAsync(hubPath, 'thingTranslator', config).then(hubTranslator => {
        return OpenT2T.invokeMethodAsync(hubTranslator, 'org.opent2t.sample.hub.superpopular', 'get', [false]).then(platforms => {
            var platformInfo = getLamp(platforms.platforms);
            var deviceInfo = {'opent2t': platformInfo.opent2t};

            return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', {'deviceInfo': deviceInfo, 'hub': hubTranslator});
        });
    });
}

var settings = {
    createTranslator: createTranslator,
    test: test,
    deviceId: 'F8CFB903-58BB-4753-97E0-72BD7DBC7933',
    expectedExceptions : testData.expected_exceptions
};

// Run standard binary switch tests
runLampTests(settings);