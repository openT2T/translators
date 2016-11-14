const sleep = require('es6-sleep').promise;
var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');

console.log("Config:");
console.log(JSON.stringify(config, null, 2));

var translatorPath = require('path').join(__dirname, '..');
var hubPath = require('path').join(__dirname, '../../../../org.opent2t.sample.hub.superpopular/com.smartthings.hub/js');
var translator = undefined;

function getBinarySwitch(devices) {
    for (var i = 0; i < devices.length; i++) {
        var d = devices[i];

        if (d.openT2T.translator === 'opent2t-translator-com-smartthings-binaryswitch') {
            return d;
        }
    }

    return undefined;
}

// setup the translator before all the tests run
test.before(async () => {
    var hubTranslator = await OpenT2T.createTranslatorAsync(hubPath, 'thingTranslator', config);
    var hubInfo = await OpenT2T.getPropertyAsync(hubTranslator, 'org.opent2t.sample.hub.superpopular', 'HubResURI');
    var deviceInfo = getBinarySwitch(hubInfo.devices);

    translator = await OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', {'deviceInfo': deviceInfo, 'hub': hubTranslator});
});

test.serial("Valid Binary Switch Translator", t => {
    t.is(typeof translator, 'object') && t.truthy(translator);
});

///
/// Run a series of tests to validate the translator
///

// Set/Get power Value via setters for individual properties
test.serial('Power', t => {

    // set value to true
    return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.binaryswitch.superpopular', 'power', true)
        .then(() => {

            // wait a bit...
            return sleep(5000).then(() => {
                // get value back
                return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.binaryswitch.superpopular', 'power')
                    .then((getResponse) => {
                        // TEST: the same value was returned that was set
                        console.log('*** getResponse ***: ' + JSON.stringify(getResponse, null, 2));
                        t.is(getResponse, true);

                        // set value to false
                        return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.binaryswitch.superpopular', 'power', false)
                            .then(() => {

                                // wait a bit
                                return sleep(5000).then(() => {
                                    // get value back
                                    return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.binaryswitch.superpopular', 'power')
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

// Set/Get power Value via POST/GET of the entire schema object
test.serial('Power_Post_Get', t => {

    // build value payload with schema for this translator,
    var postPayload = {
        power: {
            value: true
        }
    };

    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.binaryswitch.superpopular', 'postBinarySwitchResURI', [postPayload])
        .then((response1) => {

            console.log('*** multi-set response: ' + JSON.stringify(response1, null, 2));

            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.binaryswitch.superpopular', 'getBinarySwitchResURI', [])
                .then((response2) => {

                    // TEST: the same value was returned that was set
                    console.log('*** multi-get response: ' + JSON.stringify(response2, null, 2));
                    t.is(response2.power.value, true);
                });
        });
});