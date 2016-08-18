var test = require('ava');
var q = require('q');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');

console.log('Device Under Test -  Name: ' + config.Device.name + '  Props: ' + JSON.stringify(config.Device.props));
var translatorPath = require('path').join(__dirname, '..');

///
/// Run a series of tests to validate the translator
///

// Get AmbientTemperature
test.serial('AmbientTemperature', t => {
    var deferred = q.defer();

    OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'ambientTemperature')
                .then((ambientTemperature) => {

                    // TEST: some ambient temperature was returned
                    console.log('*** ambientTemperature: ' + ambientTemperature);
                    t.truthy(ambientTemperature);

                    // all done, complete the test
                    deferred.resolve();
                });
        })
        .catch(error => {
            // there was an error
            console.log('*** ERROR: ' + error);
            t.fail(error);
            deferred.reject(error);
        });;

    return deferred.promise;
});

// Set/Get TargetTemperatureHigh
test.serial('TargetTemperatureHigh', t => {
    var deferred = q.defer();

    OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh', 22)
                .then(() => {

                    OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh')
                        .then((targetTemperatureHigh) => {

                            // TEST: the same value was returned that was set
                            console.log('*** targetTemperatureHigh: ' + targetTemperatureHigh);
                            t.is(targetTemperatureHigh, 22);

                            // all done, complete the test
                            deferred.resolve();
                        });
                });
        })
        .catch(error => {
            // there was an error
            console.log('*** ERROR: ' + error);
            t.fail(error);
            deferred.reject(error);
        });;

    return deferred.promise;
});

// Set/Get TargetTemperatureLow
test.serial('TargetTemperatureLow', t => {
    var deferred = q.defer();

    OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureLow', 19)
                .then(() => {

                    OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureLow')
                        .then((targetTemperatureLow) => {

                            // TEST: approximately the same value was returned that was set
                            //       (due to rounding the value returned is sometimes a little different)
                            console.log('*** targetTemperatureLow: ' + targetTemperatureLow);
                            t.truthy(targetTemperatureLow, 19);

                            // all done, complete the test
                            deferred.resolve();
                        });
                });
        })
        .catch(error => {
            // there was an error
            console.log('*** ERROR: ' + error);
            t.fail(error);
            deferred.reject(error);
        });;

    return deferred.promise;
});