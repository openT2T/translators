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
        wh.initWinkApi("thermostats",deviceId,accessToken);
        console.log('Javascript and Wink Helper initialized.');
        logDeviceState(this.device);
    },

    turnOn: function() {
        console.log('turnOn called.');

        wh.sendDesiredStateCommand('powered',true).then(result => {
        console.log(result);}).catch(error => {console.log(error.message);}); 
    },

    turnOff: function() {
        console.log('turnOff called.');

        wh.sendDesiredStateCommand('powered',false).then(result => {
        console.log(result);}).catch(error => {console.log(error.message);}); 
    },

    getCurrentTemperature: function() {
        console.log('getting current temp');

        wh.getValueOfDesiredState('temperature').then(result => {
        console.log(result); return result; }).catch(error => {console.log(error.message); throw error; });
    },
    
    getCoolingSetpoint: function()
    {
        console.log('getting cooling point');

        wh.getValueOfDesiredState('max_set_point').then(result => {
        console.log(result); return result; }).catch(error => {console.log(error.message); throw error; });
    },
    
    getHeatingSetpoint:function()
    {
        console.log('getting heating point');

         wh.getValueOfDesiredState('min_set_point').then(result => {
        console.log(result); return result; }).catch(error => {console.log(error.message); throw error; });
    },
    
    getMode:function()
    {
        console.log('getting mode.');

        wh.getValueOfDesiredState('mode').then(result => {
        console.log(result); return result; }).catch(error => {console.log(error.message); throw error; });
    
    },
    
    setMode:function(value)
    {
       console.log("Trying to set Mode");
        
        wh.sendDesiredStateCommand('mode',value).then(result => {
        console.log(result);}).catch(error => {console.log(error.message);}); 
    },
    
    setHeatingSetpoint:function(temp)
    {
        console.log("Changing Heating Setpoint");

        wh.sendDesiredStateCommand('min_set_point',temp).then(result => {
        console.log(result);}).catch(error => {console.log(error.message);}); 
    },
    
    setCoolingSetpoint:function(temp)
    {
        console.log("Changing Cooling Setpoint");
        wh.sendDesiredStateCommand('max_set_point',temp).then(result => {
        console.log(result);}).catch(error => {console.log(error.message);}); 
    },

    disconnect: function() {
        console.log('disconnect called.');
        logDeviceState(this.device);
    }
    
};

// globals for JxCore host
global.getCoolingSetpoint = module.exports.getCoolingSetpoint;
global.getHeatingSetpoint= module.exports.getHeatingSetpoint;
global.turnOff = module.exports.turnOff;
global.turnOn = module.exports.turnOn;
global.disconnect = module.exports.disconnect;
global.setCoolingSetpoint = module.exports.setCoolingSetpoint;
global.setHeatingSetpoint = module.exports.setHeatingSetpoint;
global.getCurrentTemperature = module.exports.getCurrentTemperature;
global.getMode = module.exports.getMode;
