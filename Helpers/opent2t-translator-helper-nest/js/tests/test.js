'user strict';

var NestHelper = require('../index');
var testConfig = require('./testConfig');

var helper = new NestHelper(testConfig.accessToken);

// set multiple fields at the same time
var putPayload = {};
putPayload['target_temperature_high_c'] = 22;
putPayload['target_temperature_low_c'] = 20;

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
