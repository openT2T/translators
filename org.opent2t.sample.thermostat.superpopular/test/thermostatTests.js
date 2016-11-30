'use strict';

var OpenT2T = require('opent2t').OpenT2T;

function runThermostatTests(createTranslator, deviceId, test, setTestData) {

    function setData(name, t) {
        if(setTestData) {
            setTestData(name, t);
        }
    }

    test.serial('Valid Thermostat Translator', t => {
        return createTranslator().then(translator => {
            t.is(typeof translator, 'object') && t.truthy(translator);
        });
    });

    test.serial('GetPlatform', t => {
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'get', []).then((response) => {
                t.is(response.rt[0], 'org.opent2t.sample.thermostat.superpopular');
                
                var resource = response.entities[0].resources[0];
                t.is(resource.href, '/ambientTemperature');
                t.is(resource.rt[0], 'oic.r.temperature');
                t.true(resource.temperature === undefined);
            });
        });
    });

    test.serial('GetPlatformExpanded', t => {
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'get', [true])
                .then((response) => {
                    t.is(response.rt[0], 'org.opent2t.sample.thermostat.superpopular');

                    var resource = response.entities[0].resources[0];
                    t.is(resource.id, 'ambientTemperature');
                    t.is(resource.rt[0], 'oic.r.temperature');
                    t.true(resource.temperature !== undefined);
            });
        });
    });

    test.serial('GetAmbientTemperature', t => {
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getDevicesAmbientTemperature', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.temperature');
            });
        });
    });

    test.serial('GetTargetTemperature', t => {
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getDevicesTargetTemperature', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.temperature');
            });
        });
    });

    test.serial('SetAwayMode', t => {
        setData('SetAwayMode', t);
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postDevicesAwayMode', [deviceId, {'modes': ['away']}]).then((response) => {
                t.is(response.rt[0], 'oic.r.mode');
            });
        });
    });

    test.serial('GetTargetTemperatureForNonexistentDevice_Fails', t => {
        return createTranslator().then(translator => {
            t.throws(OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getDevicesTargetTemperature', ['00000000-0000-0000-0000-000000000000']),
        'NotFound');
        });
    });

    test.serial('SetAwayModeForNonexistentDevice_Fails', t => {
        return createTranslator().then(translator => {
            t.throws(OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postDevicesAwayMode', ['00000000-0000-0000-0000-000000000000', {'modes': ['away']}]),
        'NotFound');
        });
    });

    test.serial('GetTargetTemperature', t => {
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getDevicesTargetTemperature', [deviceId]).then((response) => {
                t.is(response.rt[0], 'oic.r.temperature');
            });
        });
    });

    test.serial('SetTargetTemperature', t => {
        setData('SetTargetTemperature', t);
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getDevicesTargetTemperatureHigh', [deviceId]).then((initialTemperature) => {
                return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postDevicesTargetTemperatureHigh', [deviceId, {'temperature': 30}]).then(() => {
                    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getDevicesTargetTemperatureHigh', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.temperature, initialTemperature.temperature)
                        t.truthy(Math.abs(targetTemperature.temperature - 30) < 0.75);
                    });
                });
            });
        });
    });

    test.serial('SetTargetTemperatureHigh', t => {
        setData('SetTargetTemperatureHigh', t);
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getDevicesTargetTemperatureHigh', [deviceId]).then((initialTemperature) => {
                return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postDevicesTargetTemperatureHigh', [deviceId, {'temperature': 22}]).then(() => {
                    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getDevicesTargetTemperatureHigh', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.temperature, initialTemperature.temperature)
                        t.truthy(Math.abs(targetTemperature.temperature - 22) < 0.75);
                    });
                });
            });
        });
    });

    test.serial('SetTargetTemperatureLow', t => {
        setData('SetTargetTemperatureLow', t);
        return createTranslator().then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getDevicesTargetTemperatureLow', [deviceId]).then((initialTemperature) => {
                return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postDevicesTargetTemperatureLow', [deviceId, {'temperature': 19}]).then(() => {
                    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getDevicesTargetTemperatureLow', [deviceId]).then((targetTemperature) => {
                        t.not(targetTemperature.temperature, initialTemperature.temperature)
                        t.truthy(Math.abs(targetTemperature.temperature - 19) < 0.75);
                    });
                });
            });
        });
    });
}

module.exports = runThermostatTests;