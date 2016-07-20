'use strict';

var hue = require('node-hue-api'),
    HueApi = hue.HueApi,
    lightState = hue.lightState;


// logs device state
function logDeviceState(device) {
    if (typeof (device) !== 'undefined') {
        console.log('  device.name          : ' + device.name);
        console.log('  device.props         : ' + device.props);
    } else {
        console.log('device is undefined');
    }
};


// gets a light index, given a unique id for a light
function getLightIndexFromId(uniqueid) {
    return api.lights().then(result => {
        for (var light of result.lights) {
            if (light.uniqueid == uniqueid) {
                return light.id;
            }
        }
        throw new Error('Light not found: ' + uniqueid);
    });
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


var device;
var deviceProps;
var api;

// module exports, implementing the schema
module.exports = {

    initDevice: function(dev) {
        console.log('Initializing device.');

        device = dev;
        validateArgumentType(device, 'device', 'object');
        validateArgumentType(device.props, 'device.props', 'string');

        deviceProps = JSON.parse(device.props);
        validateArgumentType(deviceProps.ipAddress, 'device.props.ipAddress', 'string');
        validateArgumentType(deviceProps.userId, 'device.props.userId', 'string');
        validateArgumentType(deviceProps.uniqueId, 'device.props.uniqueId', 'string');

        api = new HueApi(deviceProps.ipAddress, deviceProps.userId);
    },

    turnOn: function() {
        console.log('turnOn called.');
        return getLightIndexFromId(deviceProps.uniqueId).then(index => {
            var state = lightState.create().on();
            return api.setLightState(index, state);
        });
    },

    turnOff: function() {
        console.log('turnOff called.');
        return getLightIndexFromId(deviceProps.uniqueId).then(index => {
            var state = lightState.create().off();
            return api.setLightState(index, state);
        });
    },

    setBrightness: function(brightness) {
        console.log('setBrightness(' + brightness + ') called.');
        validateArgumentType(brightness, 'brightness', 'number');
        return getLightIndexFromId(deviceProps.uniqueId).then(index => {
            var state = lightState.create().brightness(brightness);
            return api.setLightState(index, state);
        });
    },

    disconnect: function() {
        console.log('disconnect called.');
        logDeviceState(device);
    }
};