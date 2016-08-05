"use strict";

var q = require('q');
var wh = require("opent2t-translator-helper-wink");

// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

const EventEmitter = require("events");

function validateArgumentType(arg, argName, expectedType) {
    if (typeof arg === 'undefined') {
        throw new Error('Missing argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + '.');
    } else if (typeof arg !== expectedType) {
        throw new Error('Invalid argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + ', got: ' + (typeof arg));
    }
}

/**
 * This translator class implements the "InterfaceA" interface.
 * Since the interface includes a signal (notifiable property), this class
 * extends from the node's built-in event-emitter class.
 */
class WinkThermostat extends EventEmitter {

    constructor(deviceInfo) {
        super(); // Construct EventEmitter base
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

    getPowerStatus() {
        console.log('Get PowerStatus.');
        return wh.getValueOfDesiredState('powered').then(isPowered => {
            return new Promise((resolve, reject) => {
                validateArgumentType(isPowered, "powered property", 'boolean');
                resolve(isPowered ? "on" : "off");
            });
        });
    }
    
    setPowerStatus(status) {
        console.log('Set PowerStatus.');
        validateArgumentType(status, 'Power status', 'string');

        if(status.toUpperCase() === 'ON')
            return wh.sendDesiredStateCommand('powered', true);
        else
            return wh.sendDesiredStateCommand('powered', false);
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
        var deferred = q.defer();   // Take a deferral
       deferred.resolve(["cool_only", "heat_only", "auto", "aux"]);
       return deferred.promise; // return the promise
    }
}

// Export the translator from the module.
module.exports = WinkThermostat;
