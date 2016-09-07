var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');
var q = require('q');
var pubSubHubbub = require('pubsubhubbub');
var request = require('request-promise');
var urllib = require('url');
var crypto = require("crypto");

console.log('Device Under Test -  Name: ' + config.Device.name + '  Props: ' + JSON.stringify(config.Device.props));
var translatorPath = require('path').join(__dirname, '..');

///
/// Run a series of tests to validate the translator
///

// Get AmbientTemperature via getter for individual property
// test.serial('AmbientTemperature', t => {

//     return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
//         .then(translator => {
//             // TEST: translator is valid
//             t.is(typeof translator, 'object') && t.truthy(translator);
//             return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'ambientTemperature')
//                 .then((ambientTemperature) => {

//                     // TEST: some ambient temperature was returned
//                     console.log('*** ambientTemperature: ' + ambientTemperature);
//                     t.truthy(ambientTemperature);
//                 });
//         });
// });

// // Set/Get TargetTemperatureHigh via setters for individual properties
// test.serial('TargetTemperatureHigh', t => {

//     return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
//         .then(translator => {
//             // TEST: translator is valid
//             t.is(typeof translator, 'object') && t.truthy(translator);
//             return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh', 22)
//                 .then(() => {

//                     return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh')
//                         .then((targetTemperatureHigh) => {

//                             // TEST: approximately the same value was returned that was set
//                             //       (due to rounding the value returned is sometimes a little different)
//                             console.log('*** targetTemperatureHigh: ' + targetTemperatureHigh);
//                             t.truthy(Math.abs(targetTemperatureHigh - 22) < 0.75);
//                         });
//                 });
//         });
// });

// // Set/Get TargetTemperatureLow via setters for individual properties
// test.serial('TargetTemperatureLow', t => {

//     return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
//         .then(translator => {
//             // TEST: translator is valid
//             t.is(typeof translator, 'object') && t.truthy(translator);
//             return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureLow', 19)
//                 .then(() => {

//                     return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureLow')
//                         .then((targetTemperatureLow) => {

//                             // TEST: approximately the same value was returned that was set
//                             //       (due to rounding the value returned is sometimes a little different)
//                             console.log('*** targetTemperatureLow: ' + targetTemperatureLow);
//                             t.truthy(Math.abs(targetTemperatureLow - 19) < 0.75);
//                         });
//                 });
//         });
// });

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

// // Get the entire Thermostat schema object
// test.serial('GetThermostatResURI', t => {

//     return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
//         .then(translator => {
//             // TEST: translator is valid
//             t.is(typeof translator, 'object') && t.truthy(translator);

//             return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'getThermostatResURI', [])
//                 .then((response) => {

//                     t.not(response.id, undefined);
//                     t.is(response.rt, 'org.opent2t.sample.thermostat.superpopular');
//                     t.not(response.targetTemperature, undefined);
//                     t.not(response.targetTemperatureHigh, undefined);
//                     t.not(response.targetTemperatureLow, undefined);
//                     t.not(response.ambientTemperature, undefined);
//                     t.not(response.awayMode, undefined);
//                     t.not(response.hasFan, undefined);
//                     t.not(response.ecoMode, undefined);
//                     t.not(response.hvacMode, undefined);
//                     t.not(response.fanTimerActive, undefined);

//                     console.log('*** response: \n' + JSON.stringify(response, null, 2));
//                 });
//         });
// });

// test.serial('PostThermostatResURI_Set_AwayMode', t => {

//     return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
//         .then(translator => {
//             // TEST: translator is valid
//             t.is(typeof translator, 'object') && t.truthy(translator);

//             var value = {};
//             value['awayMode'] = true;

//             return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value])
//                 .then((response) => {
//                     t.truthy(response.awayMode);

//                     console.log('*** response: \n' + JSON.stringify(response, null, 2));
//                 });
//         });
// });

// test.serial('PostThermostatResURI_Set_HvacMode', t => {

//     return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
//         .then(translator => {
//             // TEST: translator is valid
//             t.is(typeof translator, 'object') && t.truthy(translator);
//             var value = {};
//             value['hvacMode'] = { 'modes': ['auto'] };

//             return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value])
//                 .then((response) => {
//                     t.is(response.hvacMode.modes[0], 'auto');

//                     console.log('*** response: \n' + JSON.stringify(response, null, 2));
//                 });
//         });
// });


// test.serial('Thermostat_Subscribe', t=> {
//     return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
//         .then( translator => {
//             var server = http.createServer(function(request, response) {
//                 response.writeHead(200, {"Content-Type": "text/html"});
//                 response.write('<!DOCTYPE "html">');
//                 response.write("<html>");
//                 response.write("<head>");
//                 response.write("<title>Hello World Page</title>");
//                 response.write("</head>");
//                 response.write("<body>");
//                 response.write("Hello World!");
//                 response.write("</body>");
//                 response.write("</html>");
//                 response.end();
//             });
            
//             server.listen(8000);
//             console.log('Server is listening');
//         });


//});

/**
 * Creates a server for subscribing to the Wink variation of the pubsubhubbub prototcol.
 * 
 * Wink differs from standard pubsubhubbub in that the hubs and topics are implicit to the url
 * and this causes the pubSubHubbub server to mishandle the feed postbacks.
 */
// class WinkPubSubHubbubSubscriber extends EventEmitter {
    
//     constructor(options) {
//         options = options || {};

//         // Create the pubsubhubbub server
//         this.pubSubSubscriber = pubSubHubbub.createServer(options);
//         this.callbackUrl = options.callbackUrl;
//         this.secret = options.secret;

//         this.pubSubSubscriber.on('error', this._onError.bind(this));
//         this.pubSubSubscriber.on('listen', this._onListen.bind(this));
//         this.pubSubSubscriber.on('subscribe', this._onSubscribe.bind(this));
//         this.pubSubSubscriber.on('unsubscribe', this._onUnsubscribe.bind(this));
        
//         // The feed event will not be fired as the Wink postback doesn't provide the topic in the header
//         // pubSubSubscriber.on('feed', this._onError.bind(this));
        
//     }

//     listen(port) {
//         this.pubSubSubscriber.listen(8000);
//     }

//     _onListen() {
//         console.log(this.callbackUrl + ': Listening');

//         // Start parsing requests for feed postbacks
//         // TODO: if we can support Node 6+, then use prependListener() here so
//         // this one gets called first.
//         pubSubSubscriber.server.on('request', this._onRequest.bind(this));

//         this.emit('listen');
//     }

//     _onSubscribe(data) {
//         console.log(this.callbackUrl + ': Received a subscription ' + JSON.stringify(data, null, 2));

//         this.emit('subscribe', data);
//     }

//     _onUnsubscribe(data) {
//         console.log(options.callbackUrl + ': Unubscribed ' + JSON.stringify(data, null, 2));

//         this.emit('unsubscribe');
//     }

//     _onError(data) {

//         this.emit('error', data);
//     }

//     _onRequest(request, response) {
//         console.log('Received Request');

//                 if (request.method == 'POST') {
//                     console.log('POST');

//                     var params = urllib.parse(request.url, true, true);
//                     var topic = params && params.query && params.query.topic;
//                     var hub = params && params.query && params.query.hub;
//                     var tooLarge = false;
//                     var bodyLen = 0; 
//                     var bodyChunks = [];
//                     var bodyText = '';
//                     var signatureParts, algo, signature, hmac;

//                     console.log('Topic: ' + topic);
//                     console.log('Hub: ' + hub);

//                     // Check whether the secret in the header is valid
//                     // if(this.secret) {
//                     //     signatureParts = request.headers['x-hub-signature'].split("=");
//                     //     algo = (signatureParts.shift() || "").toLowerCase();
//                     //     signature = (signatureParts.pop() || "").toLowerCase();

//                     //     try {
//                     //         hmac = crypto.createHmac(algo, crypto.createHmac("sha1", options.secret).update(topic).digest("hex"));
//                     //     } catch(e) {
//                     //         console.log("Invalid signature")
//                     //         return this._sendError(request, response, 403, "Forbidden");
//                     //     }
//                     // }
                    
//                     console.log('Getting request data');

//                     // Get the data from the request
//                     request.on("data", (function(chunk){

//                         if(!chunk || !chunk.length || tooLarge){
//                             return;
//                         }

//                         if(bodyLen + chunk.length <= (3 * 1024 * 1024)){
//                             bodyChunks.push(chunk);
//                             bodyLen += chunk.length;
//                             if(options.secret){
//                                 hmac.update(chunk);
//                             }
//                         }else{
//                             tooLarge = true;
//                         }

//                         bodyText += chunk.toString('utf8');

//                         chunk = null;

//                     }).bind(this));

//                     request.on("end", (function() {

//                         console.log('end');
//                         if(tooLarge) {
//                             return this._sendError(request, response, 413, "Request Entity Too Large");
//                         }

//                         // Must return 2xx code even if signature doesn't match.
//                         // if(options.secret && hmac.digest("hex").toLowerCase() != signature) {
//                         //     console.log('Bad signature');
//                         //     response.writeHead(202, {'Content-Type': 'text/plain; charset=utf-8'});
//                         //     return response.end();
//                         // }

//                         response.writeHead(204, {'Content-Type': 'text/plain; charset=utf-8'});
//                         response.end();

//                         console.log(request.headers);
//                         JSON.parse(bodyText);
                        
//                         // TODO: parse the contents and verify it
//                         deferred.resolve('Passed');

//                     }).bind(this));
//                 }
//             });
//     }

    

// }

// Test PubSubHubbub subscription to Wink
test.serial('Thermostat_Subscribe', t => {
    return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', config.Device)
        .then( translator => {
            // This test is interfacing with async functions that are callback based
            // so create a promise that will be fulfilled when the chain of events have
            // completed.
            var deferred = q.defer();

            // Verify that the translator is valid
            t.is(typeof translator, 'object') && t.truthy(translator);

            // Create a server to listen to the postbacks from Wink
            var options = {
                callbackUrl: 'http://50.35.120.54:8000/',
                secret: 'banana2'
            }

            var pubSubSubscriber = pubSubHubbub.createServer(options);
            var subscriptionId = 0;

            pubSubSubscriber.on('denied', function(data) {
                console.log('FAIL: Access denied.')
                deferred.reject('failed');
            });

            pubSubSubscriber.on('error', function(data) {
                console.log('FAIL: Error');
                deferred.reject('failed');
            });

            pubSubSubscriber.on('listen', function() {
                console.log(options.callbackUrl + ': Listening');

                // Pass the postBackUrl to the wink device for subscription
                return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'subscribe', [options])
                    .then(() => {
                        // If a subscription was still active (default 24 hour timeout), then the subscriber will not
                        // need to re-negotiate a subscription and the pubSubsubscriber server will not get a subscribe event.
                        // Instead, the subscription will be refreshed and future feed events will still be picked up if we immediately
                        // change a property now.
                        return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh', 25);
                });
            });

            pubSubSubscriber.on('subscribe', function(data) {
                console.log(options.callbackUrl + ': Received a subscription ' + JSON.stringify(data, null, 2));
                t.pass('Success: Subscribed');

                // NOTE: if a subscription is 'active' (24 hour expiration), a new subscribe will not be recieved.

                return OpenT2T.setPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh', 26);
            });

            pubSubSubscriber.on('feed', function(data) {
                console.log(options.callbackUrl + ': Received postback ' + JSON.stringify(data, null, 2));
                t.pass('Success: Received feed postback');

                return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'unsubscribe', [subscriptionId])
                    .then((response) => {
                        t.is(response.hvacMode.modes[0], 'auto');
                        console.log('*** response: \n' + JSON.stringify(response, null, 2));
                 });
            });

            pubSubSubscriber.on('unsubscribe', function(data) {
                console.log(options.callbackUrl + ': Unubscribed ' + JSON.stringify(data, null, 2));
                t.pass('Success: Unsubscribed');

                // Close the server as we're done with it now.
                pubSubSubscriber.server.close();

                // Test is complete, resolve the promise
                deferred.resolve('Passed');
            });

            // Sart the server
            console.log("Starting server");
            pubSubSubscriber.listen(8000);

            // Wink doesn't supply a topic in the header which ruins the pubsuhubbub 'feed' event
            // prependListener was added in node 6, so I would use it here but I am running 4.5, what should we support?
            pubSubSubscriber.server.on('request', function(request, response) {
                console.log('Received Request');

                if (request.method == 'POST') {
                    console.log('POST');

                    var params = urllib.parse(request.url, true, true);
                    var topic = params && params.query && params.query.topic;
                    var hub = params && params.query && params.query.hub;
                    var tooLarge = false;
                    var bodyLen = 0; 
                    var bodyChunks = [];
                    var bodyText = '';
                    var signatureParts, algo, signature, hmac;

                    console.log('Topic: ' + topic);
                    console.log('Hub: ' + hub);

                    // Check whether the secret in the header is valid
                    // if(this.secret) {
                    //     signatureParts = request.headers['x-hub-signature'].split("=");
                    //     algo = (signatureParts.shift() || "").toLowerCase();
                    //     signature = (signatureParts.pop() || "").toLowerCase();

                    //     try {
                    //         hmac = crypto.createHmac(algo, crypto.createHmac("sha1", options.secret).update(topic).digest("hex"));
                    //     } catch(e) {
                    //         console.log("Invalid signature")
                    //         return this._sendError(request, response, 403, "Forbidden");
                    //     }
                    // }
                    
                    console.log('Getting request data');

                    // Get the data from the request
                    request.on("data", (function(chunk){

                        if(!chunk || !chunk.length || tooLarge){
                            return;
                        }

                        if(bodyLen + chunk.length <= (3 * 1024 * 1024)){
                            bodyChunks.push(chunk);
                            bodyLen += chunk.length;
                            if(options.secret){
                                hmac.update(chunk);
                            }
                        }else{
                            tooLarge = true;
                        }

                        bodyText += chunk.toString('utf8');

                        chunk = null;

                    }).bind(this));

                    request.on("end", (function() {

                        console.log('end');
                        if(tooLarge) {
                            return this._sendError(request, response, 413, "Request Entity Too Large");
                        }

                        // Must return 2xx code even if signature doesn't match.
                        // if(options.secret && hmac.digest("hex").toLowerCase() != signature) {
                        //     console.log('Bad signature');
                        //     response.writeHead(202, {'Content-Type': 'text/plain; charset=utf-8'});
                        //     return response.end();
                        // }

                        response.writeHead(204, {'Content-Type': 'text/plain; charset=utf-8'});
                        response.end();

                        console.log(request.headers);
                        JSON.parse(bodyText);
                        
                        // TODO: parse the contents and verify it
                        deferred.resolve('Passed');

                    }).bind(this));
                }
            });

            // Wait until the test has finished
            return deferred.promise;
        });
});
