var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');
var q = require('q');
var request = require('request-promise');

var WinkPubSubHubbubSubscriber = require('./WinkPubSubHubbubSubscriber');

console.log('Device Under Test -  Name: ' + config.Device.name + '  Props: ' + JSON.stringify(config.Device.props));
var translatorPath = require('path').join(__dirname, '..');

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

test.serial('Notifications - Feed Postback', t => {
    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then( translator => {
            var deferred = q.defer();

            var subscription = {};

            var options = {
                callbackUrl: config.callback_url,
                secret: 'imalwaysangry'
            }

            var pubSubSubscriber = WinkPubSubHubbubSubscriber.createServer(options);

            pubSubSubscriber.on('error', function(data) {
                t.fail("Server error 2: " + data);
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
                            console.log('This subscription already exists');
                        }

                        // Change a property to cause a feed update
                        return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh', 25);
                });
            });

            // When a server subscribes, change a property to immediately send a feed postback
            pubSubSubscriber.on('subscribe', function(data) {
                t.pass('Success: Subscribed');
                console.log(data);
            });

            // When the server gets a feed postback to the callbackUrl, unsubscribe and change the value again
            pubSubSubscriber.on('feed', function(data) {
                t.pass('Success: Received feed postback');


                t.todo('Verify the contents of the postback');

                // Now unsubscribe
                if (subscription) {
                    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'unsubscribe', [subscription.subscription_id])
                        .then((response) => {

                        })
                        .catch(function(reason) {
                            console.log("Failed to unsubscribe: " + reason);
                            deferred.reject();
                        });
                }
                else {
                    deferred.resolve('Passed');
                }
            });

            // When the server gets unsubscribed, it 
            pubSubSubscriber.on('unsubscribe', function(data) {
                // Change a property one final time to ensure that no more feed callbacks are received
                OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh', 24)
                .then((response) => {
                    // Test is complete, resolve the promise
                    deferred.resolve('Passed');
                });
                
            });

            // Sart the server
            pubSubSubscriber.listen();

            // Wait until the test has finished and close the server
            return deferred.promise.then( () => {
                pubSubSubscriber.close();
            });
        });
});
