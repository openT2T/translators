'use strict';

var OpenT2T = require('opent2t').OpenT2T;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;

const SchemaName = 'org.opent2t.sample.lamp.superpopular';
var translator = undefined;

function runLampTests(settings) {
    var test = settings.test;
    var deviceId = settings.deviceId;

    function runTest(t, hasTestData, testMethod) {
        let expectedException = settings.expectedExceptions === undefined ? undefined : settings.expectedExceptions[t.title];

        if(hasTestData && settings.setTestData) {
            settings.setTestData(t.title, t);
        }

        if(expectedException !== undefined) {
            return testMethod().then(() => {
                t.fail('Error expected: ' + expectedException);
            }).catch(error => {
                let errorObj = {};
                let message = expectedException.message;
                
				Object.getOwnPropertyNames(error).forEach(function (key) {
                        errorObj[key] = error[key];
				});

                if(expectedException.isOpent2tError === undefined || expectedException.isOpent2tError === true)  {
                    t.is(errorObj.name, 'OpenT2TError', `Verify error type, Actual: ${errorObj.name}, Expected: OpenT2TError`);
                    if(expectedException.statusCode !== undefined) {
                        t.is(errorObj.statusCode, expectedException.statusCode, `Verify status code, Actual: ${errorObj.statusCode}, Expected: ${expectedException.statusCode}`);
                    }
                    if(expectedException.messageConst !== undefined) {
                        message = OpenT2TConstants[expectedException.messageConst];
                    }
                }

                t.is(errorObj.message, message, `Verify error message, Actual: ${errorObj.message}, Expected: ${message}`);
            });
        }
        else {
            return testMethod();
        }
    }

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

    test.serial('Valid Lamp Translator', t => {
        t.is(typeof translator, 'object') && t.truthy(translator);
    });

    test.serial('GetPlatform', t => {
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', []).then((response) => {
            t.is(response.rt[0], SchemaName);
            
            var resource = response.entities[0].resources[0];
            t.is(resource.rt[0], 'oic.r.switch.binary');
            t.true(resource.value == undefined);
            t.true(resource.id == undefined);
        });
    });

    test.serial('GetPlatformExpanded', t => {
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', [true])
            .then((response) => {
                t.is(response.rt[0], SchemaName);

                var resource = response.entities[0].resources[0];
                t.is(resource.id, 'power');
                t.is(resource.rt[0], 'oic.r.switch.binary');
                t.true(resource.value !== undefined);
        });
    });

    test.serial('GetPower', t => {
        return runTest(t, false, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesPower', [deviceId])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.switch.binary');
            });
        });
    });

    test.serial('SetPower', t => {
        return runTest(t, true, () => {
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
        return runTest(t, false, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDeviceResource', [deviceId, 'dim'])
                .then((response) => {
                    t.is(response.rt[0], 'oic.r.light.dimming');
                    t.true(response.dimmingSetting !== undefined);
            });
        });
    });

    test.serial('SetDimming', t => {
        return runTest(t, true, () => {
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
        return runTest(t, false, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesColourMode', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.mode');
                t.truthy(Object.prototype.toString.call(response.modes) === '[object Array]', 'Verify modes array returned');
            });
        });
    });

    test.serial('GetColourRGB', t => {
        return runTest(t, false, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesColourRGB', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.colour.rgb');
            });
        });
    });

    test.serial('SetColourRGB', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesColourRGB', [deviceId]).then((initialColor) => {
                return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesColourRGB', [deviceId, { 'rgbvalue': [100,175,255] }]).then(() => {
                    return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesColourRGB', [deviceId]).then((targetColor) => {
                        t.not(targetColor.rgbvalue, initialColor.rgbvalue)
                        //t.is(targetColor.rgbvalue, [100,175,255]);
                    });
                });
            });
        });
    });

    test.serial('GetColourChroma', t => {
        return runTest(t, false, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesColourChroma', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.colour.chroma');
            });
        });
    });

    test.serial('SetColourChroma', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesColourChroma', [deviceId]).then((initialTemperature) => {
                return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesColourChroma', [deviceId, { 'ct': 30 }]).then(() => {
                    return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesColourChroma', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.ct, initialTemperature.ct)
                        t.truthy(Math.abs(targetTemperature.ct - 30) < 0.75);
                    });
                });
            });
        });
    });
}

module.exports = runLampTests;