var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var translatorPath = require('path').join(__dirname, '..');
var runBinarySwitchTests = require('opent2t-device-binaryswitch/binarySwitchTests');
var config = require('./testConfig');
var hubPath = require('path').join(__dirname, '../../../../org.opent2t.sample.hub.superpopular/com.wink.hub/js');
var deviceId = "F85B0738-6EC0-4A8B-A95A-503B6F2CA0D8";

function getBinarySwitch(devices) {
    for (var i = 0; i < devices.length; i++) {
        var d = devices[i];

        if (d.opent2t.translator === 'opent2t-translator-com-wink-binaryswitch') {
            return d;
        }
    }

    return undefined;
}

function createTranslator() {
    return OpenT2T.createTranslatorAsync(hubPath, 'thingTranslator', config).then(hubTranslator => {
        return OpenT2T.invokeMethodAsync(hubTranslator, 'org.opent2t.sample.hub.superpopular', 'get', [false]).then(platforms => {
            var platformInfo = getBinarySwitch(platforms.platforms);
            var deviceInfo = {};
            deviceInfo.opent2t = platformInfo.opent2t;

            return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', {'deviceInfo': deviceInfo, 'hub': hubTranslator});
        });
    });
}

// Run standard binary switch tests
runBinarySwitchTests(createTranslator, deviceId, test);