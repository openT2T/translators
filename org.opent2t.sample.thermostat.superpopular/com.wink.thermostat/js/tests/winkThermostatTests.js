'use strict';

var OpenT2T = require('opent2t').OpenT2T;
const SchemaName = 'org.opent2t.sample.thermostat.superpopular';
var translator = undefined;

function runWinkThermostatTests(settings) {
    var test = settings.test;
    var deviceId = settings.deviceId;

    test.before(() => {
        return settings.createTranslator().then(trans => {
            translator = trans;
			OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', []).then((response) => {
                if(deviceId === undefined) {
                    deviceId = response.opent2t.controlId;
                }
			});
        });
    });

    test.serial('GetHumidity_Fails', t => {
        t.throws(OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesHumidity', [deviceId]), 'NotImplemented');
    });

    test.serial('PostAwayTemperatureHigh_Fails', t => {
        t.throws(OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesAwayTemperatureHigh', [deviceId, { 'temperature': 20 }]), 'NotImplemented');
    });
}

module.exports = runWinkThermostatTests;