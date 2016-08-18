'user strict';

var q = require('q');
var WinkHelper = require('./index');

var testConfig = {
    accessToken: 'ACCESS_TOKEN',
    deviceType: 'thermostats',
    deviceId: 'DEVICE_ID'
};

var helper = new WinkHelper(testConfig.accessToken);

helper.setDesiredStateAsync(testConfig.deviceType, testConfig.deviceId, 'min_set_point', 21)
    .then(result1 => {
        console.log('set desired state result: ' + JSON.stringify(result1));

        helper.getDesiredStateAsync(testConfig.deviceType, testConfig.deviceId, 'min_set_point')
            .then(result2 => {
                console.log('get desired state result: ' + JSON.stringify(result2));

                helper.getLastReadingAsync(testConfig.deviceType, testConfig.deviceId, 'temperature')
                    .then(result3 => {
                        console.log('get last reading result: ' + result3);
                    })
            });
    })
    .catch(error => {
        console.log('Error: ' + error);
    });