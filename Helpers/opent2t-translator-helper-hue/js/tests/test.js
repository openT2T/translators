'user strict';

var HueHelper = require('../index');
var testConfig = require('./testConfig');

var helper = new HueHelper(testConfig.accessToken, testConfig.bridgeId, testConfig.whitelistId);


// set multiple fields at the same time
var putPayload = {};
putPayload['on'] = true;
putPayload['bri'] = 20;
putPayload['name'] = "Hue Color Lamp";

return helper.putDeviceDetailsAsync(testConfig.deviceType, testConfig.deviceId, putPayload)
    .then(result => {
        console.log('set multiple result: ' + JSON.stringify(result, null, 2));

        // get all fields at the same time
        return helper.getDeviceDetailsAsync(testConfig.deviceType, testConfig.deviceId)
            .then(result2 => {
                console.log('get all result: ' + JSON.stringify(result2, null, 2));
            });
    })
    .catch(error => {
        console.log('Error: ' + error);
    });