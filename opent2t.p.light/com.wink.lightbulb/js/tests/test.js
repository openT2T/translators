const sleep = require('es6-sleep').promise;
var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');

console.log("Config:");
console.log(JSON.stringify(config, null, 2));

var translatorPath = require('path').join(__dirname, '..');
var hubPath = require('path').join(__dirname, '../../../../org.opent2t.sample.hub.superpopular/com.wink.hub/js');
var translator = undefined;

function getLamp(devices) {
    for (var i = 0; i < devices.length; i++) {
        var d = devices[i];

        if (d.openT2T.translator === 'opent2t-translator-com-wink-lightbulb') {
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


test.serial('GetPlatform', t => {
    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.light', 'get', [])
        .then((response) => {
            t.is(response.rt[0], 'opent2t.p.light');

            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

// Get the entire Lamp schema object expanded
test.serial('GetPlatformExpanded', t => {
    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.light', 'get', [true])
        .then((response) => {
            t.is(response.rt[0], 'opent2t.p.light');

            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

test.serial('GetPowerResource', t => {
    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.light', 'getDeviceResource', ['F8CFB903-58BB-4753-97E0-72BD7DBC7933', 'power'])
        .then((response) => {
            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

test.serial('SetPowerResource', t => {
    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.light', 'postDeviceResource', ['F8CFB903-58BB-4753-97E0-72BD7DBC7933', 'power', {'value': true }])
        .then((response) => {
            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

test.serial('GetDimmingResource', t => {
    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.light', 'getDeviceResource', ['F8CFB903-58BB-4753-97E0-72BD7DBC7933', 'dim'])
        .then((response) => {
            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

test.serial('SetDimmingResource', t => {
    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.light', 'postDeviceResource', ['F8CFB903-58BB-4753-97E0-72BD7DBC7933', 'dim', {'dimmingSetting': 10}])
        .then((response) => {
            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});
