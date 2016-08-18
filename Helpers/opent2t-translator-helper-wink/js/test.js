'user strict';

var q = require('q');
var WinkHelper = require('./index');

var testConfig = {
    accessToken: 'qbKJyjJrutPV5Vu4AuU6yGdw9T_l4Qwj',
    deviceType: 'thermostats',
    deviceId: '137418'
};

var helper = new WinkHelper(testConfig.accessToken);

// set a single field (desired state)
helper.setDesiredStateAsync(testConfig.deviceType, testConfig.deviceId, 'min_set_point', 21)
    .then(result1 => {
        console.log('set desired state result: ' + JSON.stringify(result1));

        // get a single field (desired state)
        return helper.getDesiredStateAsync(testConfig.deviceType, testConfig.deviceId, 'min_set_point')
            .then(result2 => {
                console.log('get desired state result: ' + JSON.stringify(result2));

                // get a single field (last reading)
                return helper.getLastReadingAsync(testConfig.deviceType, testConfig.deviceId, 'temperature')
                    .then(result3 => {
                        console.log('get last reading result: ' + result3);

                        // set multiple fields at the same time
                        var putPayload = {};
                        putPayload['min_set_point'] = 21;
                        putPayload['max_set_point'] = 22;

                        return helper.putDeviceDetailsAsync(testConfig.deviceType, testConfig.deviceId, putPayload)
                            .then(result4 => {
                                console.log('set multiple result: ' + JSON.stringify(result4));

                                // get all fields at the same time
                                return helper.getDeviceDetailsAsync(testConfig.deviceType, testConfig.deviceId)
                                    .then(result5 => {
                                        console.log('get all result: ' + JSON.stringify(result5));
                                    });
                            });
                    });
            });
    })
    .catch(error => {
        console.log('Error: ' + error);
    });