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

// This translator class implements the "org.opent2t.sample.thermostat.superpopular" interface.
class WinkThermostat {

    init(deviceInfo) {
        console.log('Initializing device.');
        var device = deviceInfo;

        validateArgumentType(device, 'device', 'object');
        validateArgumentType(device.props, 'device.props', 'object');

        validateArgumentType(device.props.access_token, 'device.props.access_token', 'string');
        validateArgumentType(device.props.id, 'device.props.id', 'string');

        var deviceId = device.props.id;
        var accessToken = device.props.access_token;

        //use the winkHub device and initialize
        wh.initWinkApi("thermostats", deviceId, accessToken);
        console.log('Javascript and Wink Helper initialized : ' + deviceId + accessToken);
    }

    // exports for the OCF schema
    openT2TThermostatResURI_get() {
        // TODO.
        // We need to essentially query the entire state of the thermostat
        // and return a json object that maps to the json schema org.opent2t.sample.thermostat.superpopular
        // (we may need to modify the wink helper to return this)
    }

    openT2TThermostatResURI_post(value) {
        // TODO.
        // We need to essentially update the current state of the thermostat with the contents of value
        // value is a json object that maps to the json schema org.opent2t.sample.thermostat.superpopular
        // (we may need to modify the wink helper to do this update operation)
    }

    // exports for the AllJoyn schema
    ambientTemperature_read() {
        console.log('ambientTemperature_read called');
        return wh.getLastReading('temperature');
    }

    targetTemperature_read() {
        // TODO: Not sure what this maps to for Wink.
        // See: http://docs.wink.apiary.io/#reference/device/thermostats
        return null;
    }

    targetTemperatureHigh_readwrite(value) {
        console.log("targetTemperature_readwrite called with value: " + value);

        if (!!value) {
            return wh.sendDesiredStateCommand('max_set_point', value);
        } else {
            return wh.getValueOfDesiredState('max_set_point');
        }
    }

    targetTemperatureLow_readwrite(value) {
        console.log("targetTemperatureLow_readwrite called with value: " + value);

        if (!!value) {
            return wh.sendDesiredStateCommand('min_set_point', value);
        } else {
            return wh.getValueOfDesiredState('min_set_point');
        }
    }
}

// Export the translator from the module.
module.exports = WinkThermostat;
