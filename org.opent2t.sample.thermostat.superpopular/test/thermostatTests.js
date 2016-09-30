'use strict';

var OpenT2T = require('opent2t').OpenT2T;

function runThermostatTests(translatorPath, mockDevice, test, testData) {

    test.serial('AmbientTemperature', t => {
        return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', mockDevice).then(translator => {
            return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'ambientTemperature').then((ambientTemperature) => {
                t.truthy(ambientTemperature);
            });
        });
    });

    test.serial('TargetTemperatureHigh', t => {
        mockDevice.setTestData(testData.TargetTemperatureHigh, t);
        return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', mockDevice).then(translator => {
            return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh').then(() => {
                return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh', 22).then(() => {
                    return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh').then((targetTemperatureHigh) => {

                        // TEST: approximately the same value was returned that was set
                        //       (due to rounding the value returned is sometimes a little different)
                        t.truthy(Math.abs(targetTemperatureHigh - 22) < 0.75);
                    });
                });
            });
        });
    });

    test.serial('TargetTemperatureLow', t => {
        mockDevice.setTestData(testData.TargetTemperatureLow, t);
        return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', mockDevice).then(translator => {
            return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureLow', 19).then(() => {
                return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureLow').then((targetTemperatureLow) => {

                    // TEST: approximately the same value was returned that was set
                    //       (due to rounding the value returned is sometimes a little different)
                    t.truthy(Math.abs(targetTemperatureLow - 19) < 0.75);
                });
            });
        });
    });

    test.serial('TargetTemperatureHigh_TargetTemperatureLow_Post_Get', t => {
        mockDevice.setTestData(testData.TargetTemperatureHigh_TargetTemperatureLow_Post_Get, t);
        return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', mockDevice).then(translator => {
            // build value payload with schema for this translator,
            // setting both properties at the same time
            var value = {};
            value['targetTemperatureHigh'] = { temperature: 22, units: 'C' };
            value['targetTemperatureLow'] = { temperature: 19, units: 'C' };

            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value]).then(() => {
                return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getThermostatResURI', []).then((response2) => {

                    // TEST: The same values were returned that were set
                    //       (due to rounding the value returned is sometimes a little different)
                    t.truthy(Math.abs(response2.targetTemperatureLow.temperature - 19) < 0.75);
                    t.truthy(Math.abs(response2.targetTemperatureHigh.temperature - 22) < 0.75);
                });
            });
        });
    });

    test.serial('GetThermostatResURI', t => {
        // TEST: translator is valid
        return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', mockDevice).then(translator => {
            t.is(typeof translator, 'object') && t.truthy(translator);
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getThermostatResURI', []).then((response) => { 

                t.not(response.id, undefined);
                t.is(response.rt, 'org.opent2t.sample.thermostat.superpopular');
                t.not(response.targetTemperature, undefined);
                t.not(response.targetTemperatureHigh, undefined);
                t.not(response.targetTemperatureLow, undefined);
                t.not(response.ambientTemperature, undefined);
                //t.not(response.awayMode, undefined);
                t.not(response.hasFan, undefined);
                t.not(response.ecoMode, undefined);
                t.not(response.hvacMode, undefined);
                t.not(response.fanTimerActive, undefined);
            });
        });
    });

    test.serial('PostThermostatResURI_Set_HvacMode', t => {
        var value = {};
        value['hvacMode'] = { 'modes': ['auto'] };
        mockDevice.setTestData(testData.PostThermostatResURI_Set_HvacMode, t);

        return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', mockDevice).then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value]).then((response) => {
                t.is(response.hvacMode.modes[0], 'auto');
            });
        });
    });

    test.serial('PostThermostatResURI_Set_HvacMode_Off_Then_HeatOnly', t => {
        var value = {};
        value['hvacMode'] = { 'modes': ['off'] };
        mockDevice.setTestData(testData.PostThermostatResURI_Set_HvacMode_Off_Then_HeatOnly, t);
        return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', mockDevice).then(translator => {
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value]).then((response) => {
                t.is(response.hvacMode.modes[0], 'off');

                value['hvacMode'] = { 'modes': ['heatOnly'] };

                return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value]).then((offResponse) => {
                    t.is(offResponse.hvacMode.modes[0], 'heatOnly');
                });
            });
        });
    });

}

module.exports = runThermostatTests;