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
    console.log('1. Power Test');
    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            // set value to true
            return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'power', true)
                .then(() => {

                    // wait a bit...
                    return sleep(20000).then(() => {
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
                                        return sleep(20000).then(() => {
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

// Get the entire Lamp schema object
test.serial('GetLampResURI', t => {
    console.log('\n 2. GetLampResURI');
    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'getLampResURI', []);
        }).then((response) => {
            t.not(response.id, undefined);
            t.is(response.rt, 'org.opent2t.sample.lamp.superpopular');
            t.not(response.power, undefined);
            t.not(response.dim, undefined);

            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});


// Get the entire Lamp schema object
test.serial('PostLampResURI_Set_Power', t => {

    console.log('\n 3. PostLampResURI_Set_Power');
    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            var value = {};
            value['power'] = { 'value': true };

            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'postLampResURI', [value]);
        }).then((response) => {
            t.truthy(response.power.value);

            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

// Set the name and dimming for the Lamp
test.serial('PostLampResURI_Set_NameAndDim', t => {

    console.log('\n 4. PostLampResURI_Set_NameAndDim');
    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            var value = {};
            value['n'] = "opent2t light";
            value['dim'] = { 'dimmingSetting': 43 };

            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'postLampResURI', [value]);
        }).then((response) => {
            t.is(response.n, "opent2t light");
            t.is(response.dim.dimmingSetting, 43);

            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

