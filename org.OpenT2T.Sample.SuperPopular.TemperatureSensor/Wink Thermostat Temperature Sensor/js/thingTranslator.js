'use strict';

var https = require('https');

// logs device state
function logDeviceState(device) {
    if (typeof (device) !== 'undefined') {
        console.log('  device.name          : ' + device.name);
        console.log('  device.props         : ' + device.props);
    } else {
        console.log('device is undefined');
    }
};

var deviceId, accessToken;

// module exports, implementing the schema
module.exports = {

    device: null,

    initDevice: function (dev) {
        this.device = dev;

        if (typeof this.device != 'undefined') {
            if (typeof (this.device.props) !== 'undefined') {
                var props = JSON.parse(this.device.props);

                if (typeof (props.access_token) !== 'undefined') {
                    accessToken = props.access_token;
                } else {
                    console.log('props.access_token is undefined.');
                }

                if (typeof (props.id) !== 'undefined') {
                    deviceId = props.id;
                } else {
                    console.log('props.id is undefined.');
                }
            } else {
                console.log('props is undefined.');
            }
        } else {
            console.log('device is undefined.');
        }

        console.log('javascript initialized.');
        logDeviceState(this.device);
    },

    disconnect: function () {
        console.log('disconnect called.');
        logDeviceState(this.device);
    },

    getCurrentTemperature: function (callback) {
        console.log('getCurrentTemperature called.');

        var options = {
            'protocol': 'https:',
            'host': 'api.wink.com',
            'path': '/thermostats/' + deviceId,
            'headers': {
                'authorization': 'Bearer ' + accessToken,
                'Accept': 'application/json'
            },
            'method': 'GET'
        };

        var req = https.get(options, function (res) {
            var body = '';
            res.setEncoding('utf8');
            res.on('data', function (data) {
                body += data;
            });

            res.on('end', function () {
                if (res.statusCode != 200) {
                    callback('error: ' + res.statusCode);
                } else {
                    var data = JSON.parse(body).data;

                    if (!!data.last_reading && !!data.last_reading.temperature) {
                        callback(data.last_reading.temperature);
                    }
                }
            });

            res.on('error', function (e) {
                callback('error');
            });
        });

        req.end();
    },

    getTemperatureTrend: function (callback) {
        console.log('getTemperatureTrend called.');
    }
}
