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
        wh.initWinkApi("smoke_detectors",deviceId,accessToken);
        console.log('Javascript and Wink Helper initialized');
        logDeviceState(device);
    },

    getSmokeDetected: function() {
        console.log('checking for smoke:');
    
    wh.getSubscription().then(result => {
        //get details
        var PubNubkey =  result.pubnub.subscribe_key;
        var PubNubchannel =  result.pubnub.channel;

        console.log("key is " + PubNubkey);
        var pubnub = require("pubnub")({
            ssl           : true,  // <- enable TLS Tunneling over TCP
            subscribe_key : PubNubkey
        });
        //call this whenever a change happens
        pubnub.subscribe({
        channel  : PubNubchannel,
   	    message : function(message) {
        console.log( " > Smoke State Changed!");
        console.log( " > ", message);
        }
    });
    }).catch(error => {
        console.log(error.message);
        throw error;
    });;

        return logPromise(wh.getLastReading('smoke_detected')); 
    },

    getBatteryLevel: function()
    {
        return logPromise(wh.getLastReading('battery')); 

    }
}

global.getBatteryLevel = module.exports.getBatteryLevel;
global.getSmokeDetected = module.exports.getSmokeDetected;
global.disconnect = module.exports.disconnect;