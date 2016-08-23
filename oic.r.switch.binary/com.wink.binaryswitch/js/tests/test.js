const sleep = require('es6-sleep').promise;
var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');

console.log('Device Under Test -  Name: ' + config.Device.name + '  Props: ' + JSON.stringify(config.Device.props));
var translatorPath = require('path').join(__dirname, '..');

///
/// Run a series of tests to validate the translator
///

// Set/Get Value via setters for individual properties
test.serial('Value', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            // set value to true
            return OpenT2T.setPropertyAsync(translator, 'oic.r.switch.binary', 'value', true)
                .then(() => {

                    // get value back
                    return OpenT2T.getPropertyAsync(translator, 'oic.r.switch.binary', 'value')
                        .then((getResponse) => {

                            // TEST: the same value was returned that was set
                            console.log('*** getResponse *** value: ' + getResponse);
                            t.is(getResponse, true);

                            // wait a bit
                            console.log('*** sleeping...');
                            return sleep(5000).then(() => {
                                console.log('*** awake...');
                                // set value to false
                                return OpenT2T.setPropertyAsync(translator, 'oic.r.switch.binary', 'value', false)
                                    .then(() => {

                                        // get value back
                                        return OpenT2T.getPropertyAsync(translator, 'oic.r.switch.binary', 'value')
                                            .then((getResponse2) => {

                                                // TEST: the same value was returned that was set
                                                console.log('*** getResponse *** value: ' + getResponse2);
                                                t.is(getResponse2, false);
                                            });
                                    });
                            });
                        });
                });
        });
});

// Set/Get Value via POST/GET of the entire schema object
test.serial('Value_Post_Get', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            // build value payload with schema for this translator,
            // setting both properties at the same time
            var value = {};
            value['value'] = true;

            return OpenT2T.invokeMethodAsync(translator, 'oic.r.switch.binary', 'postBinarySwitchResURI', [value])
                .then((response1) => {

                    console.log('*** multi-set response: ' + JSON.stringify(response1));

                    return OpenT2T.invokeMethodAsync(translator, 'oic.r.switch.binary', 'getBinarySwitchResURI', [])
                        .then((response2) => {

                            // TEST: the same value was returned that was set
                            console.log('*** multi-get response: ' + JSON.stringify(response2));
                            t.is(response2.value, true);
                        });
                });
        });
});