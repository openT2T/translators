'user strict';

var q = require('q');
var NestHelper = require('./index');

var testConfig = {
    accessToken: 'c.qptzX0zoVN4ISpGvjL9rloyR6VnycNHRZp0Iftm0seBv5EScN1iEcH6D3M0qqqEfierIMNixmXWDVB0RmpICVS3blgY3PlvlTVbVzBjkEKQTRjxCnMlqiWlKtScbwMycTrY6RsUsV6GWv7tR',
    deviceType: 'thermostats',
    deviceId: 'unZG6J9hRgJLuaxpiaPtiI8FK55hfM7g'
};

var helper = new NestHelper(testConfig.accessToken);

// set a single field
helper.setFieldAsync(testConfig.deviceType, testConfig.deviceId, 'target_temperature_high_c', 23)
    .then(result1 => {
        console.log('set single result: ' + JSON.stringify(result1));

        // get a single field
        helper.getFieldAsync(testConfig.deviceType, testConfig.deviceId, 'target_temperature_high_c')
            .then(result2 => {
                console.log('get single result: ' + JSON.stringify(result2));

                // set multiple fields at the same time
                var putPayload = {};
                putPayload['target_temperature_high_c'] = 22;
                putPayload['target_temperature_low_c'] = 20;

                helper.putDeviceDetailsAsync(testConfig.deviceType, testConfig.deviceId, putPayload)
                    .then(result3 => {
                        console.log('set multiple result: ' + JSON.stringify(result3));

                        // get all fields at the same time
                        helper.getDeviceDetailsAsync(testConfig.deviceType, testConfig.deviceId)
                            .then(result4 => {
                                console.log('get all result: ' + JSON.stringify(result4));
                            });
                    });
            });
    })
    .catch(error => {
        console.log('Error: ' + error);
    });
