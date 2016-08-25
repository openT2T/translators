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
                    return sleep(1000).then(() => {
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
                                        return sleep(1000).then(() => {
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

// Set/Get dim Value via setters for individual properties
test.serial('Dim', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            // set value 
            return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'dim', 51)
                .then(() => {

                    // wait a bit...
                    return sleep(1000).then(() => {
                        // get value back
                        return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'dim')
                            .then((getResponse) => {
                                // TEST: the same value was returned that was set
                                console.log('*** getResponse ***: ' + JSON.stringify(getResponse, null, 2));
                                t.is(getResponse, 51);

                                // set value 
                                return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'dim', 82)
                                    .then(() => {

                                        // wait a bit
                                        return sleep(1000).then(() => {
                                            // get value back
                                            return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'dim')
                                                .then((getResponse2) => {

                                                    // TEST: the same value was returned that was set
                                                    console.log('*** getResponse ***: ' + JSON.stringify(getResponse2, null, 2));
                                                    t.is(getResponse2, 82);
                                                });
                                        });
                                    });
                            });
                    });
                });
        });
});

// Set/Get power, color and dim Values together via POST/GET of the entire schema object
test.serial('Power_Dim_Color Post_Get', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            // build value payload with schema for this translator,
            var postPayload = {
                power: {
                    value: true
                },
                dim: {
                    dimmingSetting: 30
                },
                color: {
                    rgbValue: [165, 200, 255]
                }
            };

            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'postLampResURI', [postPayload])
                .then((response1) => {

                    console.log('*** multi-set response: ' + JSON.stringify(response1, null, 2));

                    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'getLampResURI', [])
                        .then((response2) => {

                            // TEST: the same value was returned that was set
                            console.log('*** multi-get response: ' + JSON.stringify(response2, null, 2));
                            t.is(response2.power.value, true);
                            t.is(response2.dim.dimmingSetting, 30);
                            t.is(response2.color.rgbValue[0], 165);
                            t.is(response2.color.rgbValue[1], 200);
                            t.is(response2.color.rgbValue[2], 255);
                        });
                });
        });
});