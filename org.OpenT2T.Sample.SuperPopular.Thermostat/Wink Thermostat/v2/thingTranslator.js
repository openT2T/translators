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
        this.initDevice(deviceInfo);
    }

    initDevice(deviceProps) {
        console.log('Initializing device.');
        var device = deviceProps;

        validateArgumentType(device, 'device', 'object');
        validateArgumentType(device.props, 'device.props', 'string');

        var props = JSON.parse(device.props);
        validateArgumentType(props.access_token, 'device.props.access_token', 'string');
        validateArgumentType(props.id, 'device.props.id', 'string');
       
        var deviceId = props.id; 
        var accessToken = props.access_token;

        //use the winkHub device and initialize
        wh.initWinkApi("thermostats",deviceId,accessToken);
        console.log('Javascript and Wink Helper initialized : ' + deviceId + accessToken);
    }

    get CurrentTemperature() {
        console.log('Get current temperature.');
        return wh.getLastReading('temperature'); 
    }

    get HeatingSetpoint() {
        console.log('Get heating point.');
        return wh.getValueOfDesiredState('min_set_point');
    }

    set HeatingSetpoint(targetValue) {
         console.log("Set Heating Setpoint");
        return wh.sendDesiredStateCommand('min_set_point',targetValue);
    }

    get CoolingSetpoint() {
        console.log('Get cooling point');
        return wh.getValueOfDesiredState('max_set_point');
    }

    set CoolingSetpoint(targetValue) {
        console.log("Set Cooling Setpoint");
        return wh.sendDesiredStateCommand('max_set_point',targetValue);
    }

    get Mode() {
        console.log('Get current mode.');
        return wh.getValueOfDesiredState('mode');
    }

    // Allowed value depends in mode.choices in capabilities
    set Mode(mode) {
        console.log('Set mode.');
        return wh.sendDesiredStateCommand('mode',mode); 
    }

    get AvailableModes() {
       console.log('Get supported modes. But Allowed value depends on mode.choices in capabilities.');
       return ["cool_only", "heat_only", "auto", "aux"];
    }
}

// Export the translator from the module.
module.exports = WinkThermostat;
