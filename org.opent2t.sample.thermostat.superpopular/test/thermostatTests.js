'use strict';

var OpenT2T = require('opent2t').OpenT2T;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;

const SchemaName = 'org.opent2t.sample.thermostat.superpopular';
var translator = undefined;

function runThermostatTests(settings) {
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

                if(message !== undefined) {
                    t.is(errorObj.message, message, `Verify error message, Actual: ${errorObj.message}, Expected: ${message}`);
                }
            });
        }
        else {
            return testMethod();
        }
    }

    function verifyTemperatureData(t, response) {
        t.is(response.rt[0], 'oic.r.temperature');
        t.is(typeof(response.temperature),  'number', 'Verify temperature is a number');
        t.is(typeof(response.units), 'string', 'Verify units is a string, actual: ' + typeof(response.units));
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

    test.serial('Valid Thermostat Translator', t => {
        t.is(typeof translator, 'object') && t.truthy(translator);
    });

    test.serial('GetPlatform', t => {
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', []).then((response) => {
            t.is(response.rt[0], SchemaName);
            
            var resource = response.entities[0].resources[0];
            t.is(resource.href, '/ambientTemperature');
            t.is(resource.rt[0], 'oic.r.temperature');
            t.true(resource.temperature === undefined);
        });
    });

    test.serial('GetPlatformExpanded', t => {
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'get', [true])
            .then((response) => {
                t.is(response.rt[0], SchemaName);

                var resource = response.entities[0].resources[0];
                t.is(resource.id, 'ambientTemperature');
                t.is(resource.rt[0], 'oic.r.temperature');
                t.true(resource.temperature !== undefined);
        });
    });

    test.serial('GetAmbientTemperature', t => {
        return runTest(t, false, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesAmbientTemperature', [deviceId]).then((response) => {
                verifyTemperatureData(t, response);
            });
        });
    });

    test.serial('GetTargetTemperature', t => {
        return runTest(t, false, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperature', [deviceId]).then((response) => {
                verifyTemperatureData(t, response);
            });
        });
    });

    test.serial('SetTargetTemperature', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperature', [deviceId]).then((initialTemperature) => {
                return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesTargetTemperature', [deviceId, { 'temperature': 30, 'units': 'c' }]).then(() => {
                    return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperature', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.temperature, initialTemperature.temperature)
                        t.truthy(Math.abs(targetTemperature.temperature - 30) < 0.75);
                    });
                });
            });
        });
    });

    test.serial('GetHumidity', t => {
        return runTest(t, false, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesHumidity', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.humidity');
                t.is(typeof(response.humidity), 'number', 'Verify humidity is a number, actual: ' + typeof(response.humidity));
            });
        });
    });

    test.serial('GetTargetTemperatureHigh', t => {
        return runTest(t, false, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureHigh', [deviceId]).then((response) => {
                verifyTemperatureData(t, response);
            });
        });
    });

    test.serial('SetTargetTemperatureHigh', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureHigh', [deviceId]).then((initialTemperature) => {
                return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesTargetTemperatureHigh', [deviceId, { 'temperature': 7, 'units': 'c' }]).then(() => {
                    return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureHigh', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.temperature, initialTemperature.temperature)
                        t.truthy(Math.abs(targetTemperature.temperature - 7) < 0.75);
                    });
                });
            });
        });
    });

    test.serial('GetTargetTemperatureLow', t => {
        return runTest(t, false, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureLow', [deviceId]).then((response) => {
                verifyTemperatureData(t, response);
            });
        });
    });

    test.serial('SetTargetTemperatureLow', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureLow', [deviceId]).then((initialTemperature) => {
                return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesTargetTemperatureLow', [deviceId, { 'temperature': 19, 'units': 'c' }]).then(() => {
                    return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureLow', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.temperature, initialTemperature.temperature)
                        t.truthy(Math.abs(targetTemperature.temperature - 19) < 0.75);
                    });
                });
            });
        });
    });

    test.serial('GetAwayTemperatureHigh', t => {
        return runTest(t, false, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesAwayTemperatureHigh', [deviceId]).then((response) => {
                verifyTemperatureData(t, response);
            });
        });
    });

    test.serial('SetAwayTemperatureHigh', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesAwayTemperatureHigh', [deviceId]).then((initialTemperature) => {
                return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesAwayTemperatureHigh', [deviceId, { 'temperature': 22, 'units': 'c' }]).then(() => {
                    return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesAwayTemperatureHigh', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.temperature, initialTemperature.temperature)
                        t.truthy(Math.abs(targetTemperature.temperature - 22) < 0.75);
                    });
                });
            });
        });
    });

    test.serial('GetAwayTemperatureLow', t => {
        return runTest(t, false, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesAwayTemperatureLow', [deviceId]).then((response) => {
                verifyTemperatureData(t, response);
            });
        });
    });

    test.serial('SetAwayTemperatureLow', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesAwayTemperatureLow', [deviceId]).then((initialTemperature) => {
                return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesAwayTemperatureLow', [deviceId, { 'temperature': 19, 'units': 'c' }]).then(() => {
                    return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesAwayTemperatureLow', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.temperature, initialTemperature.temperature)
                        t.truthy(Math.abs(targetTemperature.temperature - 19) < 0.75);
                    });
                });
            });
        });
    });

    test.serial('GetAwayMode', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesAwayMode', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.mode');
                t.truthy(Object.prototype.toString.call(response.modes) === '[object Array]', 'Verify modes array returned');
            });
        });
    });

    test.serial('SetAwayMode', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesAwayMode', [deviceId, {'modes': ['away']}]).then((response) => {
                t.is(response.rt[0], 'oic.r.mode');
            });
        });
    });

    test.serial('GetEcoMode', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesEcoMode', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.sensor');
                t.truthy(typeof(response.value) === 'boolean', 'Verify eco mode value is a boolean');
            });
        });
    });

    test.serial('GetHvacMode', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesHvacMode', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.mode');
                t.truthy(Object.prototype.toString.call(response.modes) === '[object Array]', 'Verify modes array returned');
            });
        });
    });

    test.serial('SetHvacMode', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesHvacMode', [deviceId, {'modes': ['auto']}]).then((response) => {
                t.is(response.rt[0], 'oic.r.mode');
            });
        });
    });

    test.serial('GetHeatingFuelSource', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesHeatingFuelSource', [deviceId]).then((response) => {
                t.is(response.rt[0], 'opent2t.r.heatingFuel');
                t.truthy(typeof(response.fuelType) === 'string', 'Verify fuelType is a boolean');
            });
        });
    });

    test.serial('GetHasFan', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesHasFan', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.sensor');
                t.truthy(typeof(response.value) === 'boolean', 'Verify eco mode value is a boolean');
            });
        });
    });

    test.serial('GetFanActive', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesFanActive', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.sensor');
                t.truthy(typeof(response.value) === 'boolean', 'Verify eco mode value is a boolean');
            });
        });
    });

    test.serial('GetFanTimerActive', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesFanTimerActive', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.sensor');
                t.truthy(typeof(response.value) === 'boolean', 'Verify eco mode value is a boolean');
            });
        });
    });

    test.serial('GetFanTimerTimeout', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesFanTimerTimeout', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.clock');
                t.truthy(typeof(response.datetime) === 'string', 'Verify datetime is a string');
            });
        });
    });

    test.serial('SetFanTimerTimeout', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesFanTimerTimeout', [deviceId, {'datetime': '2016-03-15T14:30Z'}]).then((response) => {
                t.is(response.rt[0], 'oic.r.clock');
            });
        });
    });

    test.serial('GetFanMode', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesFanMode', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.mode');
                t.truthy(Object.prototype.toString.call(response.modes) === '[object Array]', 'Verify modes array returned');
            });
        });
    });

    test.serial('SetFanMode', t => {
        return runTest(t, true, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesFanMode', [deviceId, {'modes': ['auto']}]).then((response) => {
                t.is(response.rt[0], 'oic.r.mode');
            });
        });
    });

    test.serial('GetTargetTemperatureForNonexistentDevice_Fails', t => {
        return runTest(t, false, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperature', ['00000000-0000-0000-0000-000000000000']);
        });
    });

    test.serial('SetAwayModeForNonexistentDevice_Fails', t => {
        return runTest(t, false, () => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesAwayMode', ['00000000-0000-0000-0000-000000000000', {'modes': ['away']}]);
        });
    });
}

module.exports = runThermostatTests;