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
        wh.initWinkApi("thermostats",deviceId,accessToken);
        console.log('Javascript and Wink Helper initialized');
        logDeviceState(device);
    },

    turnOn: function() {
        console.log('turnOn called.');
        return logPromise(wh.sendDesiredStateCommand('powered', true));
    },

    turnOff: function() {
        console.log('turnOff called.');

       return logPromise(wh.sendDesiredStateCommand('powered',false));
    },

    getCurrentTemperature: function() {
        console.log('getting current temp');

        return logPromise(wh.getLastReading('temperature'));
    },
    
    getCoolingSetpoint: function()
    {
        console.log('getting cooling point');

        return logPromise(wh.getValueOfDesiredState('max_set_point'));
    },
    
    getHeatingSetpoint:function()
    {
        console.log('getting heating point');

        return logPromise(wh.getValueOfDesiredState('min_set_point'));
    },
    
    getMode:function()
    {
        console.log('getting mode.');

       return logPromise(wh.getValueOfDesiredState('mode'));
    
    },
    
    setMode:function(value)
    {
       console.log("Trying to set Mode");
        
       return logPromise(wh.sendDesiredStateCommand('mode',value)); 
    },
    
    setHeatingSetpoint:function(temp)
    {
        console.log("Changing Heating Setpoint");

        return logPromise(wh.sendDesiredStateCommand('min_set_point',temp));
    },
    
    setCoolingSetpoint:function(temp)
    {
        console.log("Changing Cooling Setpoint");
        return logPromise(wh.sendDesiredStateCommand('max_set_point',temp)); 
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
