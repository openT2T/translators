'use strict';

var OpenT2T = require('opent2t').OpenT2T;
var helpers = require('opent2t-testcase-helpers');
var translator = undefined;
const SchemaName = 'org.opent2t.sample.multisensor.superpopular';

function runMultisensorTests(settings) {
    var test = settings.test;
    var deviceIds = {};
    
    test.before(() => {
        return settings.createTranslator().then(trans => {
            translator = trans;
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', []).then((response) => {
                for (var i = 0; i < response.entities.length; i++) {
                    deviceIds[response.entities[i].rt[0]] = response.entities[i].di;
                }
			});
        });
    });

    test.serial('Valid Multisensor Translator', t => {
        t.is(typeof translator, 'object') && t.truthy(translator);
    });

    test.serial('GetPlatform', t => {
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', []).then((response) => {
            t.is(response.rt[0], SchemaName);

            t.true(response.entities.length > 0);
        });
    });

    test.serial('GetPlatformExpanded', t => {
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', [true])
            .then((response) => {
                t.is(response.rt[0], SchemaName);

            t.true(response.entities.length > 0);
        });
    });

    test.serial('GetMotion', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesMotion', [deviceIds['opent2t.d.sensor.motion']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.sensor.motion');
                    t.true(response.value !== undefined);
                    t.true(response.id === 'motion');
                });
            });
    });

    test.serial('GetMotion_FromWrongDevice', t => {
        t.throws(helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesMotion', [deviceIds['opent2t.d.battery']])
                .then((response) => {
                    t.fail('getDevicesMotion for a non-motion device should fail');
                });
            }));
    });

    test.serial('GetLastChanged_FromMotion', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesLastchanged', [deviceIds['opent2t.d.sensor.motion']])
                .then((response) => {
                    t.is(response.rt[0], 'opent2t.r.timestamp');
                    t.true(response.timestamp !== undefined);
                    t.true(response.id === 'lastchanged');
                });
            });
    });

    test.serial('GetTemperature', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTemperature', [deviceIds['opent2t.d.sensor.temperature']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.temperature');
                    t.true(response.temperature !== undefined);
                    t.true(response.units !== undefined);
                    t.true(response.id === 'temperature');
                });
            });
    });

    test.serial('GetBattery', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesBattery', [deviceIds['opent2t.d.battery']])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.energy.battery');
                    t.true(response.charge !== undefined);
                    t.true(response.id === 'battery');
                });
            });
    });
}

module.exports = runMultisensorTests;