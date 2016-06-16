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

// module exports, implementing the schema
module.exports = {

    device: null,

    initDevice: function(dev) {
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
        //use the winkHub device and initialize
        wh.initWinkApi("smoke_detectors",deviceId,accessToken);
        console.log('Javascript and Wink Helper initialized.');
        logDeviceState(this.device);
    },

    getSmokeDetected: function() {
        console.log('checking for smoke:');

        wh.getLastReading('smoke_detected').then(result => {
        console.log(result); return result; }).catch(error => {console.log(error.message); throw error;}); 
    },

    getBatteryLevel: function()
    {
        wh.getLastReading('battery').then(result => {
        console.log(result); return result; }).catch(error => {console.log(error.message); throw error;}); 

    }

}

global.getBatteryLevel = module.exports.getBatteryLevel;
global.getSmokeDetected = module.exports.getSmokeDetected;
global.disconnect = module.exports.disconnect;