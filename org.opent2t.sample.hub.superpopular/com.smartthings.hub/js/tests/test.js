var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');
var translatorPath = require('path').join(__dirname, '..');

var OpenT2TLogger = require('opent2t').Logger;
var logger = new OpenT2TLogger("info");  
logger.verbose("Config:");
logger.verbose(JSON.stringify(config, null, 2));
var opent2t = new OpenT2T(logger);

///
/// Run a series of tests to validate the translator
///

/*
// Get
test.serial('Get', t => {
    return opent2t.createTranslatorAsync(translatorPath, 'thingTranslator', config)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            return opent2t.invokeMethodAsync(translator, 'org.opent2t.sample.hub.superpopular', 'getPlatforms', [true])
                .then((hub) => {

                    console.log("Hub schema:");
                    console.log(JSON.stringify(hub.schema, null, 2));
                    console.log("Hub Platforms:");
                    console.log(JSON.stringify(hub.platforms, null, 2));
                    console.log("Hub Errors:");
                    console.log(hub.errors);

                    // TEST: something was returned
                    t.truthy(hub);

                    // TEST: hub has devices
                    t.truthy(hub.platforms);
                    t.true(hub.platforms.length > 0);
                });
        });
});


test.serial('Subscribe', t => {
    return opent2t.createTranslatorAsync(translatorPath, 'thingTranslator', config)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            var subcriptionInfo = {
                controlId: 'a557b140-c1e5-454c-9d62-112743796b0d',
                endpointUri: "https://graph.api.smartthings.com:443/api/smartapps/installations/9451280c-5993-4758-934d-fd35eeb23b2c",
                callbackUrl: 'https:\\\\127.0.0.1\\notify',
                key: "1234567890"
            }
            return opent2t.invokeMethodAsync(translator, 'org.opent2t.sample.hub.superpopular', '_subscribe', [subcriptionInfo])
                .then((response) => {
                    console.log(response);
                });
        });
});

test.serial('ParseSubscriptionPayload', t => {
    return opent2t.createTranslatorAsync(translatorPath, 'thingTranslator', config)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            var payload = {"name":"Outlet","id":"a557b140-c1e5-454c-9d62-112743796b0d","status":"ONLINE","deviceType":"switch","manufacturer":"CentraLite","model":"4257050-RZHAC","attributes":{"switch":"off","power":"0","checkInterval":"720"},"locationId":"a74e430c-8881-49fe-95a7-f46ef0788500"} ;
            var verification = {
                    "header": {"Signature": "19dd4c85a398805a6dda42c50db6c1a08bc4d8be"},
                    "key": "1234567890"
                };
            return opent2t.invokeMethodAsync(translator, 'org.opent2t.sample.hub.superpopular', 'getPlatforms', [false, payload, verification])
                .then((response) => {
                    console.log(JSON.stringify(response,null,2));
                });
        });
});

test.serial('SubscribeLocation', t => {
    return opent2t.createTranslatorAsync(translatorPath, 'thingTranslator', config)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            var subcriptionInfo = {
                callbackUrl: 'https:\\\\127.0.0.1\\LocationNotify',
                key: "1234567890"
            }
            return opent2t.invokeMethodAsync(translator, 'org.opent2t.sample.hub.superpopular', '_subscribe', [subcriptionInfo])
                .then((response) => {
                    console.log(response);
                });
        });
});

test.serial('UnsubscribeLocation', t => {
    return opent2t.createTranslatorAsync(translatorPath, 'thingTranslator', config)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            var subcriptionInfo = {
                callbackUrl: 'https:\\\\127.0.0.1\\notify'
            }
            return opent2t.invokeMethodAsync(translator, 'org.opent2t.sample.hub.superpopular', '_unsubscribe', [subcriptionInfo])
                .then((response) => {
                    console.log(response);
                });
        });
});

test.serial('ParseSubscriptionPayload', t => {
    return opent2t.createTranslatorAsync(translatorPath, 'thingTranslator', config)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            var payload = {"name":"Outlet","id":"a557b140-c1e5-454c-9d62-112743796b0d","status":"ONLINE","deviceType":"switch","manufacturer":"CentraLite","model":"4257050-RZHAC","attributes":{"switch":"off","power":"0","checkInterval":"720"},"locationId":"a74e430c-8881-49fe-95a7-f46ef0788500"} ;
            var verification = {
                    "header": {"Signature": "19dd4c85a398805a6dda42c50db6c1a08bc4d8be"},
                    "key": "1234567890"
                };
            return opent2t.invokeMethodAsync(translator, 'org.opent2t.sample.hub.superpopular', 'getPlatforms', [false, payload, verification])
                .then((response) => {
                    console.log(JSON.stringify(response,null,2));
                });
        });
})


test.serial('SubscribeLocation', t => {
    return opent2t.createTranslatorAsync(translatorPath, 'thingTranslator', config)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            var subcriptionInfo = {
                callbackUrl: 'https:\\\\127.0.0.1\\LocationNotify',
                key: "1234567890"
            }
            return opent2t.invokeMethodAsync(translator, 'org.opent2t.sample.hub.superpopular', '_subscribe', [subcriptionInfo])
                .then((response) => {
                    console.log(response);
                });
        });
});
*/

test.serial('UnsubscribeLocation', t => {
    return opent2t.createTranslatorAsync(translatorPath, 'thingTranslator', config)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            var subcriptionInfo = {
                callbackUrl: 'https:\\\\127.0.0.1\\LocationNotify'
            }
            return opent2t.invokeMethodAsync(translator, 'org.opent2t.sample.hub.superpopular', '_unsubscribe', [subcriptionInfo])
                .then((response) => {
                    console.log(response);
                });
        });
});

test.serial('SubscribeLocation', t => {
    return opent2t.createTranslatorAsync(translatorPath, 'thingTranslator', config)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            var subcriptionInfo = {
                callbackUrl: 'https:\\\\127.0.0.1\\LocationNotify02',
                key: "0987654321"
            }
            return opent2t.invokeMethodAsync(translator, 'org.opent2t.sample.hub.superpopular', '_subscribe', [subcriptionInfo])
                .then((response) => {
                    console.log(response);
                });
        });
});