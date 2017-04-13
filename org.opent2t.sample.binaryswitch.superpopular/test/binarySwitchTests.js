'use strict';

var OpenT2T = require('opent2t').OpenT2T;
var runAllPlatformTests = require('opent2t-device-all/tests');
var helpers = require('opent2t-testcase-helpers');
const SchemaName = 'org.opent2t.sample.binaryswitch.superpopular';
var translator = undefined;

function runBinarySwitchTests(settings) {
    var opent2t = new OpenT2T(settings.logger);
    var test = settings.test;
    var deviceId = settings.deviceId;
    settings.schemaName = SchemaName;

    function setData(t) {
        if(settings.setTestData) {
            settings.setTestData(t.title, t);
        }
    }

    runAllPlatformTests(settings);

    test.before(() => {
        return settings.createTranslator().then(trans => {
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
        setData(t);
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