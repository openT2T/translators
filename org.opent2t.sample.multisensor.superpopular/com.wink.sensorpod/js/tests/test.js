var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');

console.log("Config:");
console.log(JSON.stringify(config, null, 2));

var translatorPath = require('path').join(__dirname, '..');
var hubPath = require('path').join(__dirname, '../../../../org.opent2t.sample.hub.superpopular/com.wink.hub/js');
var translator = undefined;

function getMultisensor(devices) {
    for (var i = 0; i < devices.length; i++) {
        var d = devices[i];

        if (d.openT2T.translator === 'opent2t-translator-com-wink-multisensor') {
            return d;
        }
    }

    return undefined;
}

// setup the translator before all the tests run
test.before(async () => {
    var hubTranslator = await OpenT2T.createTranslatorAsync(hubPath, 'thingTranslator', config);
    var hubInfo = await OpenT2T.getPropertyAsync(hubTranslator, 'org.opent2t.sample.hub.superpopular', 'HubResURI');
    var deviceInfo = getMultisensor(hubInfo.devices);

    translator = await OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', {'deviceInfo': deviceInfo, 'hub': hubTranslator});
});

test.serial("Valid Multisensor Translator", t => {
    t.is(typeof translator, 'object') && t.truthy(translator);
});

///
/// Run a series of tests to validate the translator
///

// Get the entire MultisensorResURI schema object
test.serial('GetMultisensorResURI', t => {
    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.multisensor.superpopular', 'getMultisensorResURI', [])
        .then((response) => {
            t.not(response.id, undefined);
            t.is(response.rt, 'org.opent2t.sample.multisensor.superpopular');
            t.not(response.sensors, undefined);

            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

// Set the name for the Multisensor
test.serial('PostMultisensorResURI_Set_Name', t => {
    var value = {};
    value['n'] = "opent2t sensor pod";

    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.multisensor.superpopular', 'postMultisensorResURI', [value])
        .then((response) => {
            t.is(response.n, "opent2t sensor pod");

            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

