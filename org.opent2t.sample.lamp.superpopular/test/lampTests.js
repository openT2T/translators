'use strict';

var OpenT2T = require('opent2t').OpenT2T;
var helpers = require('opent2t-testcase-helpers');
var runAllPlatformTests = require('opent2t-device-all/tests');
var translator = undefined;
const SchemaName = 'org.opent2t.sample.lamp.superpopular';

function runLampTests(settings) {
    var test = settings.test;
    var deviceId = settings.deviceId;
    settings.schemaName = SchemaName;

    runAllPlatformTests(settings);

    test.before(() => {
        return settings.createTranslator().then(trans => {
            translator = trans;
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', []).then((response) => {
                if(deviceId === undefined) {
                    deviceId = response.entities[0].di;
                }
			});
        });
    });

    test.serial('GetPower', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesPower', [deviceId])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.switch.binary');
            });
        });
    });

    test.serial('SetPower', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesPower', [deviceId, { 'value': true }])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.switch.binary');
                    t.is(response.id, 'power');
                    t.true(response.value === true);

                    return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesPower', [deviceId, { 'value': false }])
                        .then((responseTwo) => {
                            t.is(responseTwo.id, 'power');
                            t.true(responseTwo.value === false);
                    });
            });
        });
    });

    test.serial('GetDimming', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDeviceResource', [deviceId, 'dim'])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.light.dimming');
                    t.true(response.dimmingSetting !== undefined);
            });
        });
    });

    test.serial('SetDimming', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDeviceResource', [deviceId, 'dim', { 'dimmingSetting': 10 }])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.light.dimming');
                    t.is(response.id, 'dim');
                    t.true(response.dimmingSetting === 10);

                    return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDeviceResource', [deviceId, 'dim', { 'dimmingSetting': 50 }])
                        .then((responseTwo) => {
                            t.is(responseTwo.id, 'dim');
                            t.true(responseTwo.dimmingSetting === 50);
                    });
            });
        });
    });

    test.serial('GetColourMode', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesColourMode', [deviceId]).then((response) => {
                helpers.verifyModesData(t, response);
            });
        });
    });

    test.serial('GetColourRGB', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesColourRGB', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.colour.rgb');
            });
        });
    });

    test.serial('SetColourRGB', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesColourRGB', [deviceId]).then((initialColor) => {
                return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesColourRGB', [deviceId, { 'rgbValue': [100,175,255] }]).then(() => {
                    return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesColourRGB', [deviceId]).then((targetColor) => {
                        t.not(targetColor.rgbValue, initialColor.rgbValue);
                    });
                });
            });
        });
    });

    test.serial('GetColourChroma', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesColourChroma', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.colour.chroma');
            });
        });
    });

    test.serial('SetColourChroma', t => {
        return helpers.runTest(settings, t, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesColourChroma', [deviceId]).then((initialTemperature) => {
                return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesColourChroma', [deviceId, { 'ct': 250 }]).then((chromaResult) => {
                    return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesColourChroma', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.ct, initialTemperature.ct)
                        t.truthy(Math.abs(targetTemperature.ct - 250) < 5);
                    });
                });
            });
        });
    });
}

module.exports = runLampTests;