var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');

console.log('Device Under Test -  Name: ' + config.Device.name + '  Props: ' + JSON.stringify(config.Device.props));
var translatorPath = require('path').join(__dirname, '..');

///
/// Run a series of tests to validate the translator
///

// Get AmbientTemperature via getter for individual property
test.serial('AmbientTemperature', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.temperaturesensor.superpopular', 'ambientTemperature')
                .then((ambientTemperature) => {

                    // TEST: some ambient temperature was returned
                    console.log('*** ambientTemperature: ' + ambientTemperature);
                    t.not(ambientTemperature, undefined);
                });
        });
});

// Get AmbientTemperature via GET of the entire schema object
test.serial('AmbientTemperature_Get', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.temperaturesensor.superpopular', 'getTemperatureSensorResURI', [])
                .then((response) => {

                    // TEST: we get a value back
                    console.log('*** multi-get response: ' + JSON.stringify(response, null, 2));
                    t.not(response.ambientTemperature.temperature, undefined);
                });
        });
});

// Get the entire TemperatureSensor schema object
test.serial('GetTemperatureSensorResURI', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.temperaturesensor.superpopular', 'getTemperatureSensorResURI', [])
                .then((response) => {

                    t.not(response.id, undefined);
                    t.is(response.rt, 'org.opent2t.sample.temperaturesensor.superpopular');
                    t.not(response.ambientTemperature, undefined);

                    console.log('*** response: \n' + JSON.stringify(response, null, 2));
                });
        });
});
