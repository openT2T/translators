var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');

console.log('Device Under Test -  Name: ' + config.Device.name + '  Props: ' + JSON.stringify(config.Device.props));
var translatorPath = require('path').join(__dirname, '..');

///
/// Run a series of tests to validate the translator
///

// Get AmbientTemperature
test.serial('AmbientTemperature', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'ambientTemperature')
                .then((ambientTemperature) => {

                    // TEST: some ambient temperature was returned
                    console.log('*** ambientTemperature: ' + ambientTemperature);
                    t.truthy(ambientTemperature);
                });
        });
});

// Set/Get TargetTemperatureHigh
test.serial('TargetTemperatureHigh', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh', 22)
                .then(() => {

                    return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh')
                        .then((targetTemperatureHigh) => {

                            // TEST: the same value was returned that was set
                            console.log('*** targetTemperatureHigh: ' + targetTemperatureHigh);
                            t.is(targetTemperatureHigh, 22);
                        });
                });
        });
});

// Set/Get TargetTemperatureLow
test.serial('TargetTemperatureLow', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureLow', 19)
                .then(() => {

                    return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureLow')
                        .then((targetTemperatureLow) => {

                            // TEST: the same value was returned that was set
                            console.log('*** targetTemperatureLow: ' + targetTemperatureLow);
                            t.is(targetTemperatureLow, 19);
                        });
                });
        });
});

// Set/Get TargetTemperatureHigh + TargetTemperatureLow Together
test.serial('TargetTemperatureHigh_TargetTemperatureLow', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            // build value payload with schema for this translator,
            // setting both properties at the same time
            var value = {};
            value['targetTemperatureHigh'] = 22;
            value['targetTemperatureLow'] = 19;

            return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'ThermostatResURI', value)
                .then(() => {

                    return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'ThermostatResURI')
                        .then((response) => {

                            // TEST: The same values were returned that were set
                            console.log('*** response: ' + JSON.stringify(response));
                            t.is(response.targetTemperatureLow, 19);
                            t.is(response.targetTemperatureHigh, 21);
                        });
                });
        });
});