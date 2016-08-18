'user strict';

var q = require('q');
var helper = require('./index');

var testConfig = {
    accessToken: 'ACCESS_TOKEN',
    deviceType: 'thermostats',
    deviceId: 127415
};

helper.init(testConfig.accessToken);

helper.setDesiredState(testConfig.deviceType, testConfig.deviceId, 'min_set_point', 21)
    .then(result => {
        console.log('setDesiredState result: ' + result);

        helper.getDesiredState(testConfig.deviceType, testConfig.deviceId, 'min_set_point')
            .then(result => {
                console.log('getDesiredState result: ' + result);

                helper.getLastReading(testConfig.deviceType, testConfig.deviceId, 'temperature')
                    .then(result => {
                        console.log('getLastReading result: ' + result);
                    })
            });
    })
    .catch(error => {
        console.log('Error: ' + error);
    });

