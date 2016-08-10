/*jshint esversion: 6 */
/* jshint node: true */
"use strict";
var wh = require("opent2t-translator-helper-wink");

// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

function validateArgumentType(arg, argName, expectedType) {
    if (typeof arg === 'undefined') {
        throw new Error('Missing argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + '.');
    } else if (typeof arg !== expectedType) {
        throw new Error('Invalid argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + ', got: ' + (typeof arg));
    }
}

// This translator class implements the "org.OpenT2T.Sample.SuperPopular.Thermostat" interface.
class WinkThermostat {

    constructor(deviceInfo) {
        console.log('Initializing device.');
        var device = deviceInfo;

        validateArgumentType(device, 'device', 'object');
        validateArgumentType(device.props, 'device.props', 'object');

        validateArgumentType(device.props.access_token, 'device.props.access_token', 'string');
        validateArgumentType(device.props.id, 'device.props.id', 'string');
       
        var deviceId = device.props.id; 
        var accessToken = device.props.access_token;

        //use the winkHub device and initialize
        wh.initWinkApi("thermostats",deviceId,accessToken);
        console.log('Javascript and Wink Helper initialized : ' + deviceId + accessToken);
    }

    getCurrentTemperature() {
        console.log('Get current temperature.');
        return wh.getLastReading('temperature'); 
    }

    getHeatingSetpoint() {
        console.log('Get heating point.');
        return wh.getValueOfDesiredState('min_set_point');
    }

    setHeatingSetpoint(targetValue) {
         console.log("Set Heating Setpoint");
        return wh.sendDesiredStateCommand('min_set_point',targetValue);
    }

    getCoolingSetpoint() {
        console.log('Get cooling point');
        return wh.getValueOfDesiredState('max_set_point');
    }

    setCoolingSetpoint(targetValue) {
        console.log("Set Cooling Setpoint");
        return wh.sendDesiredStateCommand('max_set_point',targetValue);
    }

    getMode() {
        console.log('Get current mode.');
        return wh.getValueOfDesiredState('mode');
    }

    // Allowed value depends in mode.choices in capabilities
    setMode(mode) {
        console.log('Set mode.');
        return wh.sendDesiredStateCommand('mode',mode); 
    }

    getAvailableModes() {
       console.log('Get supported modes. But Allowed value depends on mode.choices in capabilities.');
       return ["cool_only", "heat_only", "auto", "aux"];
    }
}

// Export the translator from the module.
module.exports = WinkThermostat;
