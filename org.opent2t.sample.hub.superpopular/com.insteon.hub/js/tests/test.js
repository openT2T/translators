var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');

console.log("Config:");
console.log(JSON.stringify(config, null, 2));
var translatorPath = require('path').join(__dirname, '..');

///
/// Run a series of tests to validate the translator
///
/*
var authInfo = [
    {
        "username": "tcwazure@microsoft.com",
        "password": "PowerBI1"
	},
    {"client_id": "0b68af91-9acd-4ba0-ab49-5a65636c4fad1461653337.7609323685"}
];

// Refresh
test.serial('refreshToken', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.hub.superpopular', 'refreshAuthToken', [authInfo])
                .then((response) => {

                    console.log("Hub:");
                    console.log(JSON.stringify(response, null, 2));
                    config = response;
                    // TEST: something was returned
                    t.truthy(response);

                });
        });
});
*/
// GetPlatforms
test.serial('GetPlatforms', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.hub.superpopular', 'getPlatforms', [true])
                .then((hub) => {

                    console.log("Hub:");
                    console.log(JSON.stringify(hub, null, 2));

                    // TEST: something was returned
                    t.truthy(hub);

                    // TEST: hub has platforms
                    t.truthy(hub.platforms);
                    t.true(hub.platforms.length > 0);
                });
        });
});

