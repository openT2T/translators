'use strict';

var helpers = require('opent2t-testcase-helpers');
var runAllPlatformTests = require('opent2t-device-all/tests');
const SchemaName = 'org.opent2t.sample.thermostat.superpopular';

function runThermostatTests(settings) {
    helpers.updateSettings(settings);
    var opent2t = settings.opent2t;
    var test = settings.test;
    var deviceId = settings.deviceId;
    var translator;
    settings.schemaName = SchemaName;

    function verifyTemperatureData(t, response) {
        t.is(response.rt[0], 'oic.r.temperature');
        t.is(typeof(response.temperature),  'number', 'Verify temperature is a number');
        t.is(typeof(response.units), 'string', 'Verify units is a string, actual: ' + typeof(response.units));
    }

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

    test.serial('GetAmbientTemperature', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesAmbientTemperature', [deviceId]).then((response) => {
                verifyTemperatureData(t, response);
            });
        });
    });

    test.serial('GetTargetTemperature', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperature', [deviceId]).then((response) => {
                verifyTemperatureData(t, response);
            });
        });
    });

    test.serial('SetTargetTemperature', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperature', [deviceId]).then((initialTemperature) => {
                return opent2t.invokeMethodAsync(translator, SchemaName, 'postDevicesTargetTemperature', [deviceId, { 'temperature': 30, 'units': 'c' }]).then(() => {
                    return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperature', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.temperature, initialTemperature.temperature)
                        t.truthy(Math.abs(targetTemperature.temperature - 30) < 0.75);
                    });
                });
            });
        });
    });

    test.serial('GetHumidity', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesHumidity', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.humidity');
                t.is(typeof(response.humidity), 'number', 'Verify humidity is a number, actual: ' + typeof(response.humidity));
            });
        });
    });

    test.serial('GetTargetTemperatureHigh', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureHigh', [deviceId]).then((response) => {
                verifyTemperatureData(t, response);
            });
        });
    });

    test.serial('SetTargetTemperatureHigh', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureHigh', [deviceId]).then((initialTemperature) => {
                return opent2t.invokeMethodAsync(translator, SchemaName, 'postDevicesTargetTemperatureHigh', [deviceId, { 'temperature': 7, 'units': 'c' }]).then(() => {
                    return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureHigh', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.temperature, initialTemperature.temperature)
                        t.truthy(Math.abs(targetTemperature.temperature - 7) < 0.75);
                    });
                });
            });
        });
    });

    test.serial('GetTargetTemperatureLow', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureLow', [deviceId]).then((response) => {
                verifyTemperatureData(t, response);
            });
        });
    });

    test.serial('SetTargetTemperatureLow', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureLow', [deviceId]).then((initialTemperature) => {
                return opent2t.invokeMethodAsync(translator, SchemaName, 'postDevicesTargetTemperatureLow', [deviceId, { 'temperature': 19, 'units': 'c' }]).then(() => {
                    return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureLow', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.temperature, initialTemperature.temperature)
                        t.truthy(Math.abs(targetTemperature.temperature - 19) < 0.75);
                    });
                });
            });
        });
    });

    test.serial('GetAwayTemperatureHigh', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesAwayTemperatureHigh', [deviceId]).then((response) => {
                verifyTemperatureData(t, response);
            });
        });
    });

    test.serial('SetAwayTemperatureHigh', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesAwayTemperatureHigh', [deviceId]).then((initialTemperature) => {
                return opent2t.invokeMethodAsync(translator, SchemaName, 'postDevicesAwayTemperatureHigh', [deviceId, { 'temperature': 22, 'units': 'c' }]).then(() => {
                    return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesAwayTemperatureHigh', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.temperature, initialTemperature.temperature)
                        t.truthy(Math.abs(targetTemperature.temperature - 22) < 0.75);
                    });
                });
            });
        });
    });

    test.serial('GetAwayTemperatureLow', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesAwayTemperatureLow', [deviceId]).then((response) => {
                verifyTemperatureData(t, response);
            });
        });
    });

    test.serial('SetAwayTemperatureLow', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesAwayTemperatureLow', [deviceId]).then((initialTemperature) => {
                return opent2t.invokeMethodAsync(translator, SchemaName, 'postDevicesAwayTemperatureLow', [deviceId, { 'temperature': 19, 'units': 'c' }]).then(() => {
                    return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesAwayTemperatureLow', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.temperature, initialTemperature.temperature)
                        t.truthy(Math.abs(targetTemperature.temperature - 19) < 0.75);
                    });
                });
            });
        });
    });

    test.serial('GetAwayMode', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesAwayMode', [deviceId]).then((response) => {
                helpers.verifyModesData(t, response);
            });
        });
    });

    test.serial('SetAwayMode', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'postDevicesAwayMode', [deviceId, {'modes': ['away']}]).then((response) => {
                helpers.verifyModesData(t, response);
            });
        });
    });

    test.serial('GetEcoMode', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesEcoMode', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.sensor');
                t.truthy(typeof(response.value) === 'boolean', 'Verify eco mode value is a boolean');
            });
        });
    });

    test.serial('GetHvacMode', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesHvacMode', [deviceId]).then((response) => {
                helpers.verifyModesData(t, response);
            });
        });
    });

    test.serial('SetHvacMode', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'postDevicesHvacMode', [deviceId, {'modes': ['auto']}]).then((response) => {
                helpers.verifyModesData(t, response);
            });
        });
    });

    test.serial('GetHeatingFuelSource', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesHeatingFuelSource', [deviceId]).then((response) => {
                t.is(response.rt[0], 'opent2t.r.heatingFuel');
                t.truthy(typeof(response.fuelType) === 'string', 'Verify fuelType is a boolean');
            });
        });
    });

    test.serial('GetHasFan', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesHasFan', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.sensor');
                t.truthy(typeof(response.value) === 'boolean', 'Verify eco mode value is a boolean');
            });
        });
    });

    test.serial('GetFanActive', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesFanActive', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.sensor');
                t.truthy(typeof(response.value) === 'boolean', 'Verify eco mode value is a boolean');
            });
        });
    });

    test.serial('GetFanTimerActive', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesFanTimerActive', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.sensor');
                t.truthy(typeof(response.value) === 'boolean', 'Verify eco mode value is a boolean');
            });
        });
    });

    test.serial('GetFanTimerTimeout', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesFanTimerTimeout', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.clock');
                t.truthy(typeof(response.datetime) === 'string', 'Verify datetime is a string');
            });
        });
    });

    test.serial('SetFanTimerTimeout', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'postDevicesFanTimerTimeout', [deviceId, {'datetime': '2016-03-15T14:30Z'}]).then((response) => {
                t.is(response.rt[0], 'oic.r.clock');
            });
        });
    });

    test.serial('GetFanMode', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesFanMode', [deviceId]).then((response) => {
                helpers.verifyModesData(t, response);
            });
        });
    });

    test.serial('SetFanMode', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'postDevicesFanMode', [deviceId, {'modes': ['auto']}]).then((response) => {
                helpers.verifyModesData(t, response);
            });
        });
    });

    test.serial('GetTargetTemperatureForNonexistentDevice_Fails', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperature', ['00000000-0000-0000-0000-000000000000']);
        });
    });

    test.serial('SetAwayModeForNonexistentDevice_Fails', t => {
        return helpers.runTest(settings, t, () => {
            return opent2t.invokeMethodAsync(translator, SchemaName, 'postDevicesAwayMode', ['00000000-0000-0000-0000-000000000000', {'modes': ['away']}]);
        });
    });
}

module.exports = runThermostatTests;