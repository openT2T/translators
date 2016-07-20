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

// Helper method to send power state commands to Wink
function sendPowerStateCommandToDevice(powerState) {

    var postData = JSON.stringify({
        'desired_state': {
            'powered': powerState
        }
    });
    var options = {
        protocol: 'https:',
        host: 'api.wink.com',
        path: '/light_bulbs/' + deviceId,
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-length': postData.length
        },
        method: 'PUT'
    };

    var req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
        });
        res.on('end', () => {
        });
        res.on('error', (e) => {
            console.log('problem with response:' + e.message);
        });
    });

    req.on('error', (e) => {
        console.log('problem with request:' + e.message);
    });

    req.write(postData);
    req.end();
}

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

        console.log('Javascript initialized.');
        logDeviceState(this.device);
    },

    turnOn: function () {
        console.log('turnOn called.');
        sendPowerStateCommandToDevice(true);
    },

    turnOff: function () {
        console.log('turnOff called.');
        sendPowerStateCommandToDevice(false);
    },

    setBrightness: function (brightness) {
        console.log('setBrightness called with value: ' + brightness);
        console.log(' *** NOT YET IMPLEMENTED');
    },

    disconnect: function () {
        console.log('disconnect called.');
        logDeviceState(this.device);
    }
};
