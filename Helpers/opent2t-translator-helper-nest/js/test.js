'user strict';

var NestHelper = require('./index');

var testConfig = {
    accessToken: 'ACCESS_TOKEN',
    deviceType: 'thermostats',
    deviceId: 'DEVICE_ID'
};

var helper = new NestHelper(testConfig.accessToken);

// set a single field
helper.setFieldAsync(testConfig.deviceType, testConfig.deviceId, 'target_temperature_high_c', 23)
    .then(result1 => {
        console.log('set single result: ' + JSON.stringify(result1));

        // get a single field
        return helper.getFieldAsync(testConfig.deviceType, testConfig.deviceId, 'target_temperature_high_c')
            .then(result2 => {
                console.log('get single result: ' + JSON.stringify(result2));

                // set multiple fields at the same time
                var putPayload = {};
                putPayload['target_temperature_high_c'] = 22;
                putPayload['target_temperature_low_c'] = 20;

                return helper.putDeviceDetailsAsync(testConfig.deviceType, testConfig.deviceId, putPayload)
                    .then(result3 => {
                        console.log('set multiple result: ' + JSON.stringify(result3));

                        // get all fields at the same time
                        return helper.getDeviceDetailsAsync(testConfig.deviceType, testConfig.deviceId)
                            .then(result4 => {
                                console.log('get all result: ' + JSON.stringify(result4));
                            });
                    });
            });
    })
    .catch(error => {
        console.log('Error: ' + error);
    });
