const sleep = require('es6-sleep').promise;
var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');

console.log("Config:");
console.log(JSON.stringify(config, null, 2));

var translatorPath = require('path').join(__dirname, '..');
var hubPath = require('path').join(__dirname, '../../../../org.opent2t.sample.hub.superpopular/com.wink.hub/js');
var translator = undefined;

function getSensorpod(devices) {
    for (var i = 0; i < devices.length; i++) {
        var d = devices[i];

        if (d.openT2T.translator === 'opent2t-translator-com-wink-sensorpod') {
            return d;
        }
    }

    return undefined;
}

// setup the translator before all the tests run
test.before(async t => {
    var hubTranslator = await OpenT2T.createTranslatorAsync(hubPath, 'thingTranslator', config);
    var hubInfo = await OpenT2T.getPropertyAsync(hubTranslator, 'org.opent2t.sample.hub.superpopular', 'HubResURI');
    var deviceInfo = getSensorpod(hubInfo.devices);

    translator = await OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', {'deviceInfo': deviceInfo, 'hub': hubTranslator});
});

test.serial("Valid Sensorpod Translator", t => {
    t.is(typeof translator, 'object') && t.truthy(translator);
});

///
/// Run a series of tests to validate the translator
///

// Get the entire SensorpodResURI schema object
test.serial('GetSensorpodResURI', t => {
    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.sensorpod.superpopular', 'getSensorpodResURI', [])
        .then((response) => {
            t.not(response.id, undefined);
            t.is(response.rt, 'org.opent2t.sample.sensorpod.superpopular');
            t.not(response.sensors, undefined);

            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

// Set the name and dimming for the Lamp
test.serial('PostSensorpodResURI_Set_Name', t => {
    var value = {};
    value['n'] = "opent2t sensor pod";

    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.sensorpod.superpopular', 'postSensorpodResURI', [value])
        .then((response) => {
            t.is(response.n, "opent2t sensor pod");

            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

