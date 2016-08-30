const sleep = require('es6-sleep').promise;
var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');

console.log('Device Under Test -  Name: ' + config.Device.name + '  Props: ' + JSON.stringify(config.Device.props));
var translatorPath = require('path').join(__dirname, '..');

///
/// Run a series of tests to validate the translator
///

// Set/Get power Value via setters for individual properties
test.serial('Power', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            // set value to true
            return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'power', true)
                .then(() => {

                    // wait a bit...
                    return sleep(2000).then(() => {
                        // get value back
                        return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'power')
                            .then((getResponse) => {
                                // TEST: the same value was returned that was set
                                console.log('*** getResponse ***: ' + JSON.stringify(getResponse, null, 2));
                                t.is(getResponse, true);

                                // set value to false
                                return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'power', false)
                                    .then(() => {

                                        // wait a bit
                                        return sleep(2000).then(() => {
                                            // get value back
                                            return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'power')
                                                .then((getResponse2) => {

                                                    // TEST: the same value was returned that was set
                                                    console.log('*** getResponse ***: ' + JSON.stringify(getResponse2, null, 2));
                                                    t.is(getResponse2, false);
                                                });
                                        });
                                    });
                            });
                    });
                });
        });
});