'use strict';

var OpenT2T = require('opent2t').OpenT2T;
const SchemaName = 'org.opent2t.sample.thermostat.superpopular';
var translator = undefined;

function runThermostatTests(createTranslator, deviceId, test, setTestData) {

    function setData(t) {
        if(setTestData) {
            setTestData(t.title, t);
        }
    }

    test.before(() => {
        return createTranslator().then(trans => {
            translator = trans;
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
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesAmbientTemperature', [deviceId]).then((response) => {
            t.is(response.rt[0], 'oic.r.temperature');
        });
    });

    test.serial('GetTargetTemperature', t => {
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperature', [deviceId]).then((response) => {
            t.is(response.rt[0], 'oic.r.temperature');
        });
    });

    test.serial('SetAwayMode', t => {
        setData(t);
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesAwayMode', [deviceId, {'modes': ['away']}]).then((response) => {
            t.is(response.rt[0], 'oic.r.mode');
        });
    });

    test.serial('GetTargetTemperatureForNonexistentDevice_Fails', t => {
        t.throws(OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperature', ['00000000-0000-0000-0000-000000000000']), 'NotFound');
    });

    test.serial('SetAwayModeForNonexistentDevice_Fails', t => {
        t.throws(OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesAwayMode', ['00000000-0000-0000-0000-000000000000', {'modes': ['away']}]), 'NotFound');
    });

    test.serial('GetTargetTemperature', t => {
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperature', [deviceId]).then((response) => {
            t.is(response.rt[0], 'oic.r.temperature');
        });
    });

    test.serial('SetTargetTemperature', t => {
        setData(t);
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureHigh', [deviceId]).then((initialTemperature) => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesTargetTemperatureHigh', [deviceId, {'temperature': 30}]).then(() => {
                return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureHigh', [deviceId]).then((targetTemperature) => {
                    t.not(targetTemperature.temperature, initialTemperature.temperature)
                    t.truthy(Math.abs(targetTemperature.temperature - 30) < 0.75);
                });
            });
        });
    });

    test.serial('SetTargetTemperatureHigh', t => {
        setData(t);
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureHigh', [deviceId]).then((initialTemperature) => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesTargetTemperatureHigh', [deviceId, {'temperature': 22}]).then(() => {
                return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureHigh', [deviceId]).then((targetTemperature) => {
                    t.not(targetTemperature.temperature, initialTemperature.temperature)
                    t.truthy(Math.abs(targetTemperature.temperature - 22) < 0.75);
                });
            });
        });
    });

    test.serial('SetTargetTemperatureLow', t => {
        setData(t);
        return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureLow', [deviceId]).then((initialTemperature) => {
            return OpenT2T.invokeMethodAsync(translator, SchemaName, 'postDevicesTargetTemperatureLow', [deviceId, {'temperature': 19}]).then(() => {
                return OpenT2T.invokeMethodAsync(translator, SchemaName, 'getDevicesTargetTemperatureLow', [deviceId]).then((targetTemperature) => {
                    t.not(targetTemperature.temperature, initialTemperature.temperature)
                    t.truthy(Math.abs(targetTemperature.temperature - 19) < 0.75);
                });
            });
        });
    });
}

module.exports = runThermostatTests;