var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var runThermostatTests = require('opent2t-device-thermostat/thermostatTests');
var config = require('./testConfig');
var translatorPath = require('path').join(__dirname, '..');
var hubPath = require('path').join(__dirname, '../../../../org.opent2t.sample.hub.superpopular/com.insteon.hub/js');
var http = require('http');
var q = require('q');
var deviceInfo = {};

function getThermostat(platforms) {
    return platforms.find((p) => {
        return p.opent2t.translator === 'opent2t-translator-com-insteon-thermostat';
    });
}

function createTranslator() {
    return OpenT2T.createTranslatorAsync(hubPath, 'thingTranslator', config).then(hubTranslator => {
        return OpenT2T.invokeMethodAsync(hubTranslator, 'org.opent2t.sample.hub.superpopular', 'get', [false]).then(platforms => {
            var platformInfo = getThermostat(platforms.platforms);
            deviceInfo.opent2t = platformInfo.opent2t;
            return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', {'deviceInfo': deviceInfo, 'hub': hubTranslator});
        });
    });
}

var settings = {
    createTranslator: createTranslator,
    test: test
};

runThermostatTests(settings);