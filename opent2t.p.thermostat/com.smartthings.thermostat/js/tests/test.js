var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');
var http = require('http');
var q = require('q');

console.log("Config:");
console.log(JSON.stringify(config, null, 2));

var translatorPath = require('path').join(__dirname, '..');
var hubPath = require('path').join(__dirname, '../../../../opent2t.p.hub/com.smartthings.hub/js');

var translator = undefined;
var controlId = undefined;
var deviceInfo = {};

function getThermostat(platforms) {
    return platforms.find((p) => {
        return p.opent2t.translator === 'opent2t-translator-com-smartthings-thermostat';
    });
}

// setup the translator before all the tests run
test.before(async () => {
    var hubTranslator = await OpenT2T.createTranslatorAsync(hubPath, 'thingTranslator', config);
    var hubInfo = await OpenT2T.invokeMethodAsync(hubTranslator, 'opent2t.p.hub', 'getPlatforms', []);
    deviceInfo = getThermostat(hubInfo.platforms);
    controlId = deviceInfo.opent2t.controlId;
    translator = await OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', {'deviceInfo': deviceInfo, 'hub': hubTranslator});
});

test.serial("Valid Thermostat Translator", t => {
    t.is(typeof translator, 'object') && t.truthy(translator);
});

// Get the entire thermostat schema object unexpanded
test.serial('GetPlatform', t => {
    console.log('*** GetPlatform');
    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.thermostat', 'get', [])
        .then((response) => {
            
            t.is(response.rt[0], 'opent2t.p.thermostat');

            var resource = response.entities[0].resources[0];
            t.is(resource.href, '/ambientTemperature');
            t.is(resource.rt[0], 'oic.r.temperature');
            t.true(resource.temperature === undefined);

            console.log('*** GetPlatform::response: \n' + JSON.stringify(response, null, 2));
        });
});


// Get the entire Lamp schema object expanded
test.serial('GetPlatformExpanded', t => {
    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.thermostat', 'get', [true])
        .then((response) => {
            t.is(response.rt[0], 'opent2t.p.thermostat');

            var resource = response.entities[0].resources[0];
            t.is(resource.id, 'ambientTemperature');
            t.is(resource.rt[0], 'oic.r.temperature');
            t.true(resource.temperature !== undefined);

            console.log('*** GetPlatformExpanded::response: \n' + JSON.stringify(response, null, 2));
        });
});

test.serial('GetAmbientTemperature', t => {
    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.thermostat', 'getDevicesAmbientTemperature', [controlId])
        .then((response) => {
            t.is(response.rt[0], 'oic.r.temperature');

            console.log('*** GetAmbientTemperature::response: \n' + JSON.stringify(response, null, 2));
        });
});

test.serial('GetTargetTemperature', t => {
    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.thermostat', 'getDevicesTargetTemperature', [controlId])
        .then((response) => {
            t.is(response.rt[0], 'oic.r.temperature');

            console.log('*** GetTargetTemperature::response: \n' + JSON.stringify(response, null, 2));
        });
});

test.serial('GetHumidity', t => {

    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.thermostat', 'getDevicesHumidity', [controlId])
       .then((response) => {
           t.is(response.rt[0], 'oic.r.humidity');

           console.log('*** GetHumidity::response: \n' + JSON.stringify(response, null, 2));
       });
});

test.serial('SetAwayMode', t => {
    var awayMode = {'modes': ['away']};

    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.thermostat', 'postDevicesAwayMode', [controlId, awayMode])
        .then((response) => {
            t.is(response.rt[0], 'oic.r.mode');
            t.is(response.modes, 'away');

            console.log('*** SetAwayMode::response: \n' + JSON.stringify(response, null, 2));
        });
});


test.serial('SetTargetTemperatureHigh', t => {
    var targetTemperatureHigh = { 'temperature': 82 };

    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.thermostat', 'postDevicesTargetTemperatureHigh', [controlId, targetTemperatureHigh])
      .then((response) => {
          t.is(response.rt[0], 'oic.r.temperature');
          t.is(response.temperature, 82);

          console.log('*** SetTargetTemperatureHigh::response: \n' + JSON.stringify(response, null, 2));
      });
});

test.serial('PostAwayTemperatureHigh_Fails', t => {
    var awayTemperatureHigh = { 'temperature': 20 };

    t.throws(OpenT2T.invokeMethodAsync(translator, 'opent2t.p.thermostat', 'postDevicesAwayTemperatureHigh', [controlId, awayTemperatureHigh]),
        'NotImplemented');

    console.log('PostAwayTemperatureHigh_Fails::PostAwayTemperatureHigh failed - Expected');
});

test.serial('GetTargetTemperatureForNonexistentDevice_Fails', t => {
    t.throws(OpenT2T.invokeMethodAsync(translator, 'opent2t.p.thermostat', 'getDevicesTargetTemperature', ['00000000-0000-0000-0000-000000000000']),
        'NotFound');

    console.log('GetTargetTemperatureForNonexistentDevice_Fails::GetTargetTemperature for nonexistent device failed - Expected');
});

test.serial('SetAwayModeForNonexistentDevice_Fails', t => {
    var awayMode = {'modes': ['away']};

    t.throws(OpenT2T.invokeMethodAsync(translator, 'opent2t.p.thermostat', 'postDevicesAwayMode', ['00000000-0000-0000-0000-000000000000', awayMode]),
        'NotFound');

    console.log('SetAwayModeForNonexistentDevice_Fails::SetAwayMode for nonexistent device failed - Expected');
});

/**
 * Verifies that realtime notifications can be subscribed to for the device.
 * Please check the "live logging" section for your SmartApp to see if the notification was send or not.
 */
test.serial('Notifications - Subscribe', t => {
    var deferred = q.defer();

    console.log("Subscripting...");
    return translator.postSubscribe().then((response) => {
        t.is(response[0], 'succeed');

        var targetTemperatureHigh = { 'temperature': 85 };
        return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.thermostat', 'postDevicesTargetTemperatureHigh', [controlId, targetTemperatureHigh])
          .then((response) => {
              t.is(response.rt[0], 'oic.r.temperature');
              t.is(response.temperature, 85);
              
              // Unsubscribe and end the test
              console.log("Unsubscribing...");
              return translator.deleteSubscribe().then((response) => {
                  t.is(response, 'succeed');
              });
          });
    });
});