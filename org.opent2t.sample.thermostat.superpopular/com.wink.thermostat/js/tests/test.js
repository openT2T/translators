var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var OpenT2T = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;
var runThermostatTests = require('opent2t-device-thermostat/thermostatTests');
var config = require('./testConfig');
var testData = require('./testdata');
var translatorPath = require('path').join(__dirname, '..');
var hubPath = require('path').join(__dirname, '../../../../org.opent2t.sample.hub.superpopular/com.wink.hub/js');
var http = require('http');
var q = require('q');
var deviceInfo = {};

function getThermostat(platforms) {
    return platforms.find((p) => {
        return p.opent2t.translator === 'opent2t-translator-com-wink-thermostat';
    });
}

function createTranslator() {
    return OpenT2T.createTranslatorAsync(hubPath, 'thingTranslator', config).then(hubTranslator => {
        return OpenT2T.invokeMethodAsync(hubTranslator, 'org.opent2t.sample.hub.superpopular', 'get', [false]).then(platforms => {
            var platformInfo = getThermostat(platforms.platforms);
            deviceInfo.opent2t = platformInfo.opent2t;

            return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', {'deviceInfo': deviceInfo, 'hub': hubTranslator});
        });
    });
}

let settings = {
    createTranslator: createTranslator,
    test: test,
    deviceId: 'D5D37EB6-F428-41FA-AC5D-918F084A4C93',
    expectedExceptions : testData.expected_exceptions
};

runThermostatTests(settings);

/**
 * Verifies that realtime notifications can be subscribed to for the device.
 * This test requires that this machine be accesible on an external IP address and port that 
 * are provided as part of testConfig.json
 *  {
 *      ...
 *      "callback_url" = "http://<url>:<port>"
 *  }
 * 
 * This URL will be used for postbacks containing device changes.
 */
test.serial('Notifications - Subscribe', t => {
    return createTranslator().then(translator => {
        var deferred = q.defer();

        var port = require('url').parse(config.callback_url).port || 80;

        console.log("using port " + port);

        // Create a simple server that will hand off requests to the appropriate translators.
        var server = http.createServer((request, response) => {
            switch(request.method) {
                case "GET":
                    console.log("Subscription part 2");
                    var subscription = translator.postSubscribeThermostatResURI(null, request);
                    response.writeHead(200, {'Content-Type': 'text/plain'});
                    response.end(subscription.response);
                    break;
                case "POST":
                    // POSTs represent realtime updates that need to be translated into the
                    // appropriate schema.  The request URL can contain the schema
                    // name and deviceID, which can be used to construct a translator to
                    // do the actual translation work.
                    
                    // Get the post body, this is standard stuff
                    var body = "";
                    request.on("data", (chunk) => {
                        if(!chunk || !chunk.length){
                            return;
                        }

                        body += chunk.toString('utf8');
                        chunk = null;
                    });

                    // When the body of the POST has been retrieved, it needs to be translated.
                    // Hand it off as JSON to the translator.  This would normally be done
                    // via OpenT2T rather than using the translator directly.  Translating a JSON
                    // chunk is immediate, and needs no promise.
                    request.on("end", () => {
                        var translatedData = translator.getThermostatResURI(JSON.parse(body));
                        console.log(translatedData);
                        deferred.resolve("Recieved the expected notification");
                        t.not(translatedData, null);
                    });

                    // Return no-content response (though it is ignored)
                    response.writeHead(204, {'Content-Type': 'text/plain'});
                    response.end();
                    break;
                default:
                    // Not supported
                    response.writeHead(403, {'Content-Type': 'text/plain'});
                    response.end();
            }
        });

        server.listen(port);

        var callbackUrlParams = config.callback_url + "?schema=" + deviceInfo.openT2T.schema + "&deviceId=" + deviceInfo.id;

        console.log("Subscription part 1");

        translator.postSubscribeThermostatResURI(callbackUrlParams).then((response) => {
            console.log("Subscription expires at %d", response.expiration);

            // Validation of the subscription will not happen unless it's already expired.
            translator.getSubscriptions().then((subscriptions) => {
                        console.log(subscriptions);
                        t.true(subscriptions.length > 0);
                    });

            translator.setTargetTemperatureHigh(75);
        });

        // Once the notification has been received, unsubscribe and end the test
        return deferred.promise.then(() => {
            console.log("Unsubscribing");
            return translator.deleteSubscribeThermostatResURI(callbackUrlParams).then(() => {
                t.pass("Unsubscribed successfully");
            });
        });
    });
});