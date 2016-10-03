var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');

console.log("Config:");
console.log(JSON.stringify(config, null, 2));

var translatorPath = require('path').join(__dirname, '..');
var hubPath = require('path').join(__dirname, '../../../../org.opent2t.sample.hub.superpopular/com.wink.hub/js');

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
test.before(async () => {
    var hubTranslator = await OpenT2T.createTranslatorAsync(hubPath, 'thingTranslator', config);
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

    return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'ambientTemperature')
        .then((ambientTemperature) => {

            // TEST: some ambient temperature was returned
            console.log('*** ambientTemperature: ' + ambientTemperature);
            t.truthy(ambientTemperature);
        });
});

// Set/Get TargetTemperatureHigh via setters for individual properties
test.serial('TargetTemperatureHigh', t => {

    return OpenT2T.getPropertyAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'targetTemperatureHigh')
        .then((targetTemperatureHighBefore) => {

            console.log('*** targetTemperatureHighBefore: ' + targetTemperatureHighBefore);

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

// Set/Get TargetTemperatureHigh + TargetTemperatureLow via POST/GET of the entire schema object
test.serial('TargetTemperatureHigh_TargetTemperatureLow_Post_Get', t => {

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

// Get the entire Thermostat schema object
test.serial('GetThermostatResURI', t => {

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

test.serial('PostThermostatResURI_Set_AwayMode', t => {

    var value = {};
    value['awayMode'] = true;

    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value])
        .then((response) => {
            t.truthy(response.awayMode);

            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

test.serial('PostThermostatResURI_Set_HvacMode', t => {

    var value = {};
    value['hvacMode'] = { 'modes': ['auto'] };

    return OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value])
        .then((response) => {
            t.is(response.hvacMode.modes[0], 'auto');

            console.log('*** response: \n' + JSON.stringify(response, null, 2));
        });
});

test.serial('PostThermostatResURI_Set_HvacMode_Off_Then_HeatOnly', async t => {

    var value = {};
    value['hvacMode'] = { 'modes': ['off'] };

    var offResponse = await OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value]);
    t.is(offResponse.hvacMode.modes[0], 'off');

    console.log('*** offResponse: \n' + JSON.stringify(offResponse, null, 2));

    value['hvacMode'] = { 'modes': ['heatOnly'] };

    var heatOnlyResponse = await OpenT2T.invokeMethodAsync(translator, 'org.opent2t.sample.thermostat.superpopular', 'postThermostatResURI', [value]);
    t.is(heatOnlyResponse.hvacMode.modes[0], 'heatOnly');

    console.log('*** heatOnlyresponse: \n' + JSON.stringify(heatOnlyResponse, null, 2));
});
