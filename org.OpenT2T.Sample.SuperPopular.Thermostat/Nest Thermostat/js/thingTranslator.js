'use strict';
var helper = require('opent2t-translator-helper-nest');
var q = require('q');

// logs device state
function logDeviceState(device) {
    if (typeof (device) !== 'undefined') {
        console.log('  device.name          : ' + device.name);
        console.log('  device.props         : ' + device.props);
    } else {
        console.log('device is undefined');
    }
};

function validateArgumentType(arg, argName, expectedType) {
    if (typeof arg === 'undefined') {
        throw new Error('Missing argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + '.');
    } else if (typeof arg !== expectedType) {
        throw new Error('Invalid argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + ', got: ' + (typeof arg));
    }
}

var device, props;

// module exports, implementing the schema
module.exports = {

    initDevice : function(dev) {
        device = dev;
        console.log('Initializing device.');

        device = dev;
        validateArgumentType(device, 'device', 'object');
        validateArgumentType(device.props, 'device.props', 'string');

        props = JSON.parse(device.props);
        validateArgumentType(props.access_token, 'device.props.access_token', 'string');
        validateArgumentType(props.id, 'device.props.id', 'string');
       
        helper.init('thermostats',  props.id, props.access_token)
        logDeviceState(device);
	    console.log('Initialized.');
    },

    disconnect : function() {
        console.log('disconnect called.');
        logDeviceState(this.device);
    },
    
    isTurnedOn : function() {
        console.log('isTurnedOn called.');
        return helper.getProperty('hvac_mode').then(state => {
            console.log("state: "+ state);
            return state != 'off';
        });
    },
    
    // Default to Heating. THe call must be followed by setMode(heating/cooling), as desired.
    turnOn : function() {
        console.log('turnOn called.');
        return getMode().then( mode => {
            if(mode == 'off')
            {
                return helper.setProperty({'hvac_mode' : 'heat-cool'});
            }
        });
    },

    turnOff : function() {
        console.log('turnOff called.');
        return helper.setProperty({'hvac_mode' : 'off'});
    },

    getCurrentTemperature : function() {
        console.log('getCurrentTemperature called.');
        return helper.getProperty('ambient_temperature_c');
    },

    getHeatingSetpoint : function() {
        console.log('getHeatingSetpoint called.');
        return helper.getProperty('target_temperature_high_c');
    },

    setHeatingSetpoint : function(value) {
        console.log("setHeatingSetpoint called");
         return helper.setProperty({'target_temperature_high_c' : value});
    },

     getCoolingSetpoint : function() {
        console.log('getCoolingSetpoint called.');
        return helper.getProperty('target_temperature_low_c');
    },

    setCoolingSetpoint : function(value) {
        console.log("setCoolingSetpoint called.");
        return helper.setProperty({'target_temperature_low_c' : value});
    },

    getMode : function() {
        console.log('getMode called.');
        return helper.getProperty('hvac_mode', 'off');
    },   

    setMode : function(value) {
       console.log("setMode called."); 
       return helper.setProperty({'hvac_mode' : value});
    },
    
    getAvailableModes: function(value) {
       var deferred = q.defer();   // Take a deferral
       deferred.resolve(['heat', 'cool', 'heat-cool','off']);
       return deferred.promise; // return the promise
    },
}

// globals for JxCore host
global.initDevice = module.exports.initDevice;
global.isTurnedOn = module.exports.isTurnedOn;
global.turnOn = module.exports.turnOn;
global.turnOff = module.exports.turnOff;
global.getCurrentTemperature = module.exports.getCurrentTemperature;
global.getHeatingSetpoint = module.exports.getHeatingSetpoint;
global.setHeatingSetpoint = module.exports.setHeatingSetpoint;
global.getCoolingSetpoint = module.exports.getCoolingSetpoint;
global.setCoolingSetpoint = module.exports.setCoolingSetpoint;
global.getMode = module.exports.getMode;
global.setMode = module.exports.setMode;
global.getAvailableModes = module.exports.getAvailableModes;
global.disconnect = module.exports.disconnect;
