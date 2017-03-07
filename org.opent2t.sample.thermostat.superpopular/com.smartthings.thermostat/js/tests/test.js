var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var translatorPath = require('path').join(__dirname, '..');
var runThermostatTests = require('opent2t-device-thermostat/thermostatTests');
var config = require('./testConfig');
var hubPath = require('path').join(__dirname, '../../../../org.opent2t.sample.hub.superpopular/com.smartthings.hub/js');
var controlId = undefined;

function getThermostat(platforms) {
    return platforms.find((p) => {
        return p.opent2t.translator === 'opent2t-translator-com-smartthings-thermostat';
    });
}

function createTranslator() {
    return OpenT2T.createTranslatorAsync(hubPath, 'thingTranslator', config).then(hubTranslator => {
        return OpenT2T.invokeMethodAsync(hubTranslator, 'org.opent2t.sample.hub.superpopular', 'get', [false]).then(platforms => {
            var platformInfo = getThermostat(platforms.platforms);
            var deviceInfo = {'opent2t': platformInfo.opent2t};
            deviceId = platformInfo.entities[0].di;
            return OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', {'deviceInfo': deviceInfo, 'hub': hubTranslator});
        });
    });
}

var settings = {
    createTranslator: createTranslator,
    test: test
};

runThermostatTests(settings);

/**
 * Verifies that realtime notifications can be subscribed to for the device.
 * Please check the "live logging" section for your SmartApp to see if the notification was send or not.
 */
test.serial('Notifications - Subscribe', t => {
    console.log("Subscripting...");

    var subcriptionInfo = {};
    return createTranslator().then(translator => {
        return translator.postSubscribe(subcriptionInfo).then((response) => {
            t.is(response[0], 'succeed');

            var targetTemperatureHigh = { 'temperature': 85 };
            return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postDevicesTargetTemperatureHigh', [deviceId, targetTemperatureHigh])
            .then((response) => {
                t.is(response.rt[0], 'oic.r.temperature');
                t.is(response.temperature, 85);
                
                // Unsubscribe and end the test
                console.log("Unsubscribing...");
                return translator.deleteSubscribe(subcriptionInfo).then((response) => {
                    t.is(response, 'succeed');
                });
            });
        });
    });
});