'use strict';

const SchemaName = 'org.opent2t.sample.binaryswitch.superpopular';
var runAllPlatformTests = require('opent2t-device-all/tests');
var helpers = require('opent2t-testcase-helpers');

function runBinarySwitchTests(settings) {
	helpers.updateSettings(settings);
	var test = settings.test;
	var opent2t = settings.opent2t;
    var deviceId = settings.deviceId;
    var translator;
    settings.schemaName = SchemaName;

    runAllPlatformTests(settings);

    test.before(() => {
        return opent2t.createTranslatorAsync(settings.translatorPath, 'thingTranslator', settings.getDeviceInfo()).then(trans => {
            translator = trans;
            return opent2t.invokeMethodAsync(translator, SchemaName, 'get', []).then((response) => {
                if(deviceId === undefined) {
                    deviceId = response.entities[0].di;
                }
			});
        });
    });

    test.serial('GetPower', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesPower', [deviceId])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.switch.binary');
            });
        });
    });

    test.serial('SetPower', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'postDevicesPower', [deviceId, { 'value': true }])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.switch.binary');
                    t.is(response.id, 'power');
                    t.true(response.value === true);

                    return opent2t.invokeMethodAsync(translator, SchemaName, 'postDevicesPower', [deviceId, { 'value': false }])
                        .then((responseTwo) => {
                            t.is(responseTwo.id, 'power');
                            t.true(responseTwo.value === false);
                    });
            });
        });
    });

}

module.exports = runBinarySwitchTests;