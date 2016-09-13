var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');

console.log("Config:");
console.log(JSON.stringify(config, null, 2));

var translatorPath = require('path').join(__dirname, '..');
var hubPath = require('path').join(__dirname, '../../../../org.opent2t.sample.hub.superpopular/com.wink.hub/js');
console.log("Translator: " + translatorPath);
console.log("Provider: " + hubPath);

var translator = undefined;

function getThermostat(devices) {
    for (var i = 0; i < devices.length; i++) {
        var d = devices[i];

        if (d.openT2T.translator === 'opent2t-translator-com-wink-thermostat') {
            return d;
        }
    }

    return undefined;
}

// setup the translator before all the tests run
test.before(async t => {
    var hubTranslator = await OpenT2T.createTranslatorAsync(hubPath, 'thingTranslator', {'accessToken': config.Device.accessToken});
    var hubInfo = await OpenT2T.getPropertyAsync(hubTranslator, 'org.opent2t.sample.hub.superpopular', 'HubResURI');
    var deviceInfo = getThermostat(hubInfo.devices);

    translator = await OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', {'deviceInfo': deviceInfo, 'hub': hubTranslator});
});

test.serial("Valid Thermostat Translator", t => {
    t.is(typeof translator, 'object') && t.truthy(translator);
});


//
// Run a series of tests to validate the translator
//

// Get AmbientTemperature via getter for individual property
test.serial('AmbientTemperature', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'ambientTemperature')
                .then((ambientTemperature) => {

                    // TEST: some ambient temperature was returned
                    console.log('*** ambientTemperature: ' + ambientTemperature);
                    t.truthy(ambientTemperature);
                });
        });
});

// Set/Get TargetTemperatureHigh via setters for individual properties
test.serial('TargetTemperatureHigh', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh', 22)
                .then(() => {

                    return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh')
                        .then((targetTemperatureHigh) => {

                            // TEST: approximately the same value was returned that was set
                            //       (due to rounding the value returned is sometimes a little different)
                            console.log('*** targetTemperatureHigh: ' + targetTemperatureHigh);
                            t.truthy(Math.abs(targetTemperatureHigh - 22) < 0.75);
                        });
                });
        });
});

// Set/Get TargetTemperatureLow via setters for individual properties
test.serial('TargetTemperatureLow', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureLow', 19)
                .then(() => {

                    return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureLow')
                        .then((targetTemperatureLow) => {

                            // TEST: approximately the same value was returned that was set
                            //       (due to rounding the value returned is sometimes a little different)
                            console.log('*** targetTemperatureLow: ' + targetTemperatureLow);
                            t.truthy(Math.abs(targetTemperatureLow - 19) < 0.75);
                        });
                });
        });
});

// Set/Get TargetTemperatureHigh + TargetTemperatureLow via POST/GET of the entire schema object
test.serial('TargetTemperatureHigh_TargetTemperatureLow_Post_Get', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            // build value payload with schema for this translator,
            // setting both properties at the same time
            var value = {};
            value['targetTemperatureHigh'] = { temperature: 22 };
            value['targetTemperatureLow'] = { temperature: 19 };

            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value])
                .then((response1) => {

                    console.log('*** multi-set response: ' + JSON.stringify(response1, null, 2));

                    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getThermostatResURI', [])
                        .then((response2) => {

                            // TEST: The same values were returned that were set
                            //       (due to rounding the value returned is sometimes a little different)
                            console.log('*** multi-get response: ' + JSON.stringify(response2, null, 2));
                            t.truthy(Math.abs(response2.targetTemperatureLow.temperature - 19) < 0.75);
                            t.truthy(Math.abs(response2.targetTemperatureHigh.temperature - 22) < 0.75);

                            // Test that the target temp is an average of the two setpoints, approximately
                            return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperature')
                                .then((targetTemperature) => {

                                    // TEST: approximately an average of max and min setpoints is returned
                                    //       (due to rounding the value returned is sometimes a little different)
                                    console.log('*** targetTemperature: ' + targetTemperature);

                                    t.truthy(Math.abs(targetTemperature - 20.5) < 0.75);
                                });
                        });
                });
        });
});

// Get the entire Thermostat schema object
test.serial('GetThermostatResURI', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getThermostatResURI', [])
                .then((response) => {

                    t.not(response.id, undefined);
                    t.is(response.rt, 'org.opent2t.sample.thermostat.superpopular');
                    t.not(response.targetTemperature, undefined);
                    t.not(response.targetTemperatureHigh, undefined);
                    t.not(response.targetTemperatureLow, undefined);
                    t.not(response.ambientTemperature, undefined);
                    t.not(response.awayMode, undefined);
                    t.not(response.hasFan, undefined);
                    t.not(response.ecoMode, undefined);
                    t.not(response.hvacMode, undefined);
                    t.not(response.fanTimerActive, undefined);

                    console.log('*** response: \n' + JSON.stringify(response, null, 2));
                });
        });
});

test.serial('PostThermostatResURI_Set_AwayMode', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            var value = {};
            value['awayMode'] = true;

            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value])
                .then((response) => {
                    t.truthy(response.awayMode);

                    console.log('*** response: \n' + JSON.stringify(response, null, 2));
                });
        });
});

test.serial('PostThermostatResURI_Set_HvacMode', t => {

    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then(translator => {
            // TEST: translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);
            var value = {};
            value['hvacMode'] = { 'modes': ['auto'] };

            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value])
                .then((response) => {
                    t.is(response.hvacMode.modes[0], 'auto');

                    console.log('*** response: \n' + JSON.stringify(response, null, 2));
                });
        });
});

test.serial('Notifications - Subscribe/Unsubscribe', t => {
    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then( translator => {
            // Test should produce 2 passing assertions
            // 1. Subscribe is successful
            // 2. Unsubscribe is successful
            t.plan(2);

            var options = {
                callbackUrl: config.callback_url,
                secret: 'imalwaysangry'
            }

            var deferred = q.defer();
            var subscription = {};

            var pubSubSubscriber = WinkPubSubHubbubSubscriber.createServer(options);

            pubSubSubscriber.on('error', function(data) {
                t.fail("Server error");
                deferred.reject('failed');
            });

            // When the server starts listening, change the value of a property to ensure a feed postback is sent
            pubSubSubscriber.on('listen', function() {
                // Pass the postBackUrl to the wink device for subscription
                return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'subscribe', [options])
                    .then((response) => {
                        // Get the subscriptions
                        if (response) {
                            subscription = response;
                            console.log('Using subscription: ' + JSON.stringify(subscription, null, 2));
                        } else {
                            t.fail('Subscription already exists');

                            // Need to request the subscription id from the server
                            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getSubscriptions', [subscription.subscription_id])
                                .then((response) => {
                                    // Verify that the response includes the current subscription
                                    response.data.forEach(function(sub) {
                                        if (sub.callbackUrl == options.callbackUrl) {
                                            subscription = sub;
                                            return;
                                        }
                                    });

                                // Try to unsubscribe so the next time can succeed
                                OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'unsubscribe', [subscription.subscription_id])
                                    .then((response) => {
                                        console.log(response);
                                    })
                                    .catch(function(reason) {
                                        console.log("Failed to unsubscribe: " + reason);
                                        deferred.reject();
                                    });
                                });
                        }
                    });
            });

            // When a server subscribes, imediately unsubscribe
            pubSubSubscriber.on('subscribe', function(data) {

                OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getSubscriptions', [subscription.subscription_id])
                    .then((response) => {
                        // Verify that the response includes the current subscription
                        response.data.forEach(function(sub) {
                            if (sub.callbackUrl == options.callbackUrl) {
                                t.pass('Found the correct subscription')
                            }
                        });
                    })
                    .catch(function(reason) {
                        console.log('Failed to unsubscribe: ' + reason);
                        t.fail('Failed to unsubscribe: ' + reason)
                        deferred.reject();
                    });
            });

            // When the server gets unsubscribed shut it down
            pubSubSubscriber.on('unsubscribe', function(data) {

                // Verify that the callback is no longer subscribed
                OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getSubscriptions', [subscription.subscription_id])
                    .then((response) => {
                        // Verify that the response includes the current subscription
                        response.data.forEach(function(sub) {
                            if (sub.callbackUrl == options.callbackUrl) {
                                t.fail("Found a remaining subscription")
                                return;
                            }

                            t.pass('Success: Unsubscribed');
                        });
                        // Test is complete, resolve the promise
                        deferred.resolve();
                    });
            });

            pubSubSubscriber.listen();

            // Wait until the test has finished and close the server
            return deferred.promise.then( () => {
                pubSubSubscriber.close();
            });   
        });
})

/**
 * Subscribs a pubsubhubbub server to the thermostat for post backs.
 * testConfig.json should provide the following:
 *  {
 *      "callbackUrl": "<url to existing server>",
 *      "secret": "<secret for verifying messages>"
 *  }
 * 
 * The server must be a pubsubhubbub endpoint, which can be set up using Node.js with
 * ./WinkPubSubHubbubSubscriber.js.  There are some important differences with the Wink
 * implementation of pubsubhubbub that prevents using the pubsubhubbub module directly
 * (feeds don't include topic information in a way that the pubsubhubbub module likes).
 */
test.serial('Notifications - Subscribe', t => {
    // Expecting 12 assertions. If the results are different, the test will fail.
    t.plan(12);

    t.not(config.callbackUrl, undefined, 'Please provide a callbackUrl in ./testConfig.json');
    t.not(config.secret, undefined, 'Please provide a secret in ./testConfig.json');

    // Subscribe to the device topic
    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'subscribe', [config.callbackUrl, config.secret])
        .then((response) => {

            t.is(response.errors.length, 0);
            t.not(response.data, undefined);
            t.is(response.data.callback, config.callbackUrl);
            t.is(response.data.secret, config.secret);
            t.is(response.data.secret, config.secret);
            
            var subscriptionId = response.data.subscription_id;
            var expires = response.data.expires_at;
            console.log("Subscribed %d, expires at %d", subscriptionId, expires);

            // Verify that the subscription is listed
            return OpenT2T.invokeMethodAsync(translator,'org.opent2t.sample.thermostat.superpopular', 'getSubscriptions', [])
                .then((response) => {
                    console.log("Found %d subscriptions", response.data.length);
                    
                    t.is(response.errors.length, 0, "No errors");

                    // Verify that the subscription has been added
                    t.true(response.data.some(function(item) {
                        return item.callback == config.callbackUrl &&
                               item.subscription_id == subscriptionId &&
                               item.secret == config.secret;
                    }));

                    // Waste some time (block execution) otherwise this will execute too fast and the expires_at value
                    // will not increase.
                    var waitTill = new Date(new Date().getTime() + 5000);
                    while(waitTill > new Date()) {}

                    // Resubscribe to refresh the expiration
                    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'subscribe', [config.callbackUrl, config.secret])
                        .then((response) => {
                            
                            console.log("Refreshed expiration of %d to %d", subscriptionId, response.data.expires_at);

                            t.true(response.data.expires_at > expires);

                            // Unsubscribe
                            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'unsubscribe', [subscriptionId])
                                .then((response) => {
                                    console.log("Unsubscribed %d", subscriptionId);

                                    t.is(response.data, null);
                                    t.is(response.errors.length, 0);

                                    return OpenT2T.invokeMethodAsync(translator,'org.opent2t.sample.thermostat.superpopular', 'getSubscriptions', [])
                                        .then((response) => {
                                            console.log("Found %d subscriptions", response.data.length);

                                            t.is(response.errors.length, 0, "No errors");

                                            // Verify the subscription has been removed.
                                            t.false(response.data.some(function(item) {
                                                return item.subscription_id == config.subscriptionId;
                                            }));
                                        });
                                });
                        });
                });
        });
});
