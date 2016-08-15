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

// Helper method to send start command to zone
function sendStartCommandToZone(accessToken, zoneId, duration) {

    var postData = JSON.stringify({
        "id": zoneId,
        "duration": duration
    });
    var options = {
        protocol: 'https:',
        host: 'api.rach.io',
        path: '/1/public/zone/start',
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

// Helper method to send stop command to device
function sendStopCommandToDevice(accessToken, deviceId) {

    var postData = JSON.stringify({
        "id": deviceId
    });
    var options = {
        protocol: 'https:',
        host: 'api.rach.io',
        path: '/1/public/device/stop_water',
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

var device, token;
var deviceId, zoneId;

// module exports, implementing the schema
module.exports = {

    device: null,

    initDevice: function (dev) {
        this.device = dev;

        if (typeof this.device != 'undefined') {
            if (typeof (this.device.props) !== 'undefined') {
                var props = JSON.parse(this.device.props);

                if (typeof (props.token) !== 'undefined') {
                    token = props.token;

                    // we have the access token, now query the device and zone IDs
                    https.get({
                        host: 'api.rach.io',
                        path: '/1/public/person/info',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Content-Type': 'application/json'
                        }
                    }, function (response) {
                        // Continuously update stream with data
                        var body = '';
                        response.on('data', function (d) {
                            body += d;
                        });
                        response.on('end', function () {
                            // Done, now we should have the current user Id
                            var userId = JSON.parse(body).id;

                            // Now get the profile data for this user, which
                            // includes the device and zone Ids.
                            https.get({
                                host: 'api.rach.io',
                                path: '/1/public/person/' + userId,
                                headers: {
                                    'Authorization': 'Bearer ' + token,
                                    'Content-Type': 'application/json'
                                }
                            }, function (response2) {
                                // Continuously update stream with data
                                var body2 = '';
                                response2.on('data', function (d2) {
                                    body2 += d2;
                                });
                                response2.on('end', function () {

                                    // Data reception done
                                    var firstSprinklerDevice = JSON.parse(body2).devices[0];
                                    deviceId = firstSprinklerDevice.id;

                                    console.log('Discovered device Id: ' + deviceId);

                                    var zones = firstSprinklerDevice.zones;

                                    // search for the zone that matches the given name.
                                    // TODO: this is currently fixed, and needs to be parameterized
                                    zones = zones.filter(function (zone) {
                                        return zone.name.toLowerCase().includes('back lawn');
                                    });

                                    zoneId = zones[0].id;
                                    console.log('Discovered zone Id: ' + zoneId);
                                });
                            });
                        });
                    });
                } else {
                    console.log('props.token is undefined.');
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

    start: function (duration) {

        sendStartCommandToZone(token, zoneId, duration);

        console.log('start called for duration: ' + duration);
    },

    stop: function () {

        sendStopCommandToDevice(token, deviceId);

        console.log('stop called');
    },

    disconnect: function () {
        console.log('disconnect called.');
        logDeviceState(this.device);
    }
}