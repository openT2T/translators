const sleep = require('es6-sleep').promise;
var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');

console.log("Config:");
console.log(JSON.stringify(config, null, 2));

var translatorPath = require('path').join(__dirname, '..');
var hubPath = require('path').join(__dirname, '../../../../org.opent2t.sample.hub.superpopular/com.insteon.hub/js');
var translator = undefined;

function getLamp(devices) {
    for (var i = 0; i < devices.length; i++) {
        var d = devices[i];

        if (d.openT2T.translator === 'opent2t-translator-com-insteon-lightbulb') {
            return d;
        }
    }

    return undefined;
}

// setup the translator before all the tests run
test.before(async () => {
    var hubTranslator = await OpenT2T.createTranslatorAsync(hubPath, 'thingTranslator', config);
    var hubInfo = await OpenT2T.getPropertyAsync(hubTranslator, 'org.opent2t.sample.hub.superpopular', 'HubResURI');
    var deviceInfo = getLamp(hubInfo.devices);

    translator = await OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', {'deviceInfo': deviceInfo, 'hub': hubTranslator});
});

test.serial("Valid Lamp Translator", t => {
    t.is(typeof translator, 'object') && t.truthy(translator);
});

///
/// Run a series of tests to validate the translator
///

// Set/Get power Value via setters for individual properties
test.serial('Power', t => {
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

// Get the entire Lamp schema object
test.serial('GetLampResURI', t => {
    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'getLampResURI', [])
        .then((response) => {
            t.not(response.id, undefined);
            t.is(response.rt, 'org.opent2t.sample.lamp.superpopular');
            t.not(response.power, undefined);
            t.not(response.dim, undefined);

            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});


// Get the entire Lamp schema object
test.serial('PostLampResURI_Set_Power', t => {
    var value = {};
    value['power'] = { 'value': true };

    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'postLampResURI', [value])
        .then((response) => {
            t.truthy(response.power.value);

            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

// Set the name and dimming for the Lamp
test.serial('PostLampResURI_Set_NameAndDim', t => {
    var value = {};
    value['n'] = "opent2t light";
    value['dim'] = { 'dimmingSetting': 43 };

    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.lamp.superpopular', 'postLampResURI', [value])
        .then((response) => {
            t.is(response.n, "opent2t light");
            t.is(response.dim.dimmingSetting, 43);

            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

