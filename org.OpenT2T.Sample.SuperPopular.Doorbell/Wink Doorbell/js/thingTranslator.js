'use strict';

var https = require('https');
var wh = require("opent2t-translator-helper-wink"); //link locally for now

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

function logPromise(p) {
    return p.then(result => {
        console.log(result);
        return result;
    }).catch(error => {
        console.log(error.message);
        throw error;
    });
}

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
var props;
// module exports, implementing the schema
module.exports = {

    initDevice: function(dev) {
        console.log('Initializing device.');

        device = dev;
        validateArgumentType(device, 'device', 'object');
        validateArgumentType(device.props, 'device.props', 'string');

        props = JSON.parse(device.props);
        validateArgumentType(props.access_token, 'device.props.access_token', 'string');
        validateArgumentType(props.id, 'device.props.id', 'string');
       
        deviceId = props.id; 
        accessToken = props.access_token;

        //use the winkHub device and initialize
        wh.initWinkApi("door_bells",deviceId,accessToken);
        console.log('Javascript and Wink Helper initialized');
        logDeviceState(device);
    },

    isButtonPressed: function() {
        console.log('getting if doorbell Pressed');
        return logPromise(wh.getLastReading('button_pressed')); 
    },   

    getBatteryLevel: function() {
        console.log('getting batteryLevel');
        return logPromise(wh.getLastReading('battery'));
    },   

    disconnect: function() {
        console.log('disconnect called.');
        logDeviceState(device);
    }  
};