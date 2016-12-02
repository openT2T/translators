'use strict';

var OpenT2T = require('opent2t').OpenT2T;
var translator = undefined;

function runWinkThermostatTests(createTranslator, deviceId, test) {

    test.before(() => {
        return createTranslator().then(trans => {
            translator = trans;
        });
    });

    test.serial('GetHumidity_Fails', t => {
        t.throws(OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getDevicesHumidity', [deviceId]), 'NotImplemented');
    });

    test.serial('PostAwayTemperatureHigh_Fails', t => {
        t.throws(OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postDevicesAwayTemperatureHigh', [deviceId, { 'temperature': 20 }]), 'NotImplemented');
    });
}

module.exports = runWinkThermostatTests;