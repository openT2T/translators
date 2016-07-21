'use strict';

var https = require('https');
var q = require('q');

var lightifyBaseUrl = "us.lightify-api.org";
var lightifySetDeviceUrl = "/lightify/services/device/set?";

// logs device state
function logDeviceState(device) {
    if (typeof (device) !== 'undefined') {
        console.log('  device.name          : ' + device.name);
        console.log('  device.props         : ' + device.props);
    } else {
        console.log('device is undefined');
    }
};

// Helper method to send power state commands to Vera
function sendCommandToDevice(method, securityToken, command, deviceId) {
    var deferred = q.defer();

    var path = lightifySetDeviceUrl + "idx=" + deviceId + "&" + command;

    var options = {
        protocol: 'https:',
        host: lightifyBaseUrl,
        path: path,
        headers: {
            'Authorization': securityToken
        },
        method: method
    };

    var req = https.request(options);

    req.on('error', (e) => {
        console.log('problem with request:' + e.message);
        deferred.reject(e);
    });

    req.on('response', (res) => {
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
        });

        res.on('end', () => {
            if (res.statusCode != 200) {
                deferred.reject(new Error("Invalid HTTP response: " + res.statusCode + " - " + res.statusMessage));
            }
            else {
                deferred.resolve(res);
            }
        });

        res.on('error', (e) => {
            console.log('problem with response:' + e.message);
            deferred.reject(e);
        });
    });

    req.end();

    return deferred.promise;
}

// simple argument validation for the exported methods below
function validateArgumentType(arg, argName, expectedType) {
    if (typeof arg === 'undefined') {
        throw new Error('Missing argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + '.');
    } else if (typeof arg !== expectedType) {
        throw new Error('Invalid argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + ', got: ' + (typeof arg));
    }
}

// module exports, implementing the schema
module.exports = {

    // numeric int device id
    deviceId: null,

    // session token for the relay server
    securityToken: null,

    // data structure which represents the device targetted by this translator
    device: null,

    initDevice: function (dev) {
        this.device = dev;

        validateArgumentType(this.device, 'device', 'object');
        validateArgumentType(this.device.props, 'device.props', 'string');

        var props = JSON.parse(this.device.props);
        validateArgumentType(props.security_token, 'device.props.security_token', 'string');
        validateArgumentType(props.id, 'device.props.id', 'string');
        this.securityToken = props.security_token;
        this.deviceId = props.id;

        console.log('Javascript initialized.');
        logDeviceState(this.device);
    },

    turnOn: function () {
        console.log('[' + this.deviceId + '] turnOn called.');

        var command = "onoff=1";
        return sendCommandToDevice('GET', this.securityToken, command, this.deviceId);
    },

    turnOff: function () {
        console.log('[' + this.deviceId + '] turnOff called.');

        var command = "onoff=0";
        return sendCommandToDevice('GET', this.securityToken, command, this.deviceId);
    },

    // sets the dimmable bulb to the desired brightness, valid values: integer 0-100
    setBrightness: function (brightness) {
        console.log('[' + this.deviceId + '] setBrightness called with value: ' + brightness);

        // Lightify accepts values between 0.000-1.000
        var doubleBrightness = brightness / 100.0;
        var command = "level=" + doubleBrightness;
        return sendCommandToDevice('GET', this.securityToken, command, this.deviceId);
    },

    disconnect: function () {
        console.log('disconnect called.');
        logDeviceState(this.device);
    }
};
