/* jshint esversion: 6 */
/* jshint node: true */
'use strict';
var wh = require('opent2t-translator-helper-wink');

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

var deviceId;
var deviceType = 'thermostats';

// This translator class implements the 'org.opent2t.sample.thermostat.superpopular' interface.
class WinkThermostat {

    constructor(device) {
        console.log('Initializing device.');

        validateArgumentType(device, 'device', 'object');
        validateArgumentType(device.props, 'device.props', 'object');

        validateArgumentType(device.props.access_token, 'device.props.access_token', 'string');
        validateArgumentType(device.props.id, 'device.props.id', 'string');

        deviceId = device.props.id;

        // Initialize Wink Helper
        wh.init(device.props.access_token);
        console.log('Javascript and Wink Helper initialized : ');
    }

    // exports for the OCF schema
    getThermostatResURI() {
        // TODO.
        // We need to essentially query the entire state of the thermostat
        // and return a json object that maps to the json schema org.opent2t.sample.thermostat.superpopular
        // (we may need to modify the wink helper to return this)
    }

    postThermostatResURI(value) {
        // TODO.
        // We need to essentially update the current state of the thermostat with the contents of value
        // value is a json object that maps to the json schema org.opent2t.sample.thermostat.superpopular
        // (we may need to modify the wink helper to do this update operation)
        // In addition, this should return the updated state (see sample in RAML)
    }

    // exports for the AllJoyn schema
    getAmbientTemperature() {
        console.log('ambientTemperature_read called');
        return wh.getLastReading(deviceType, deviceId, 'temperature');
    }

    getTargetTemperature() {
        // TODO: Not sure what this maps to for Wink.
        // See: http://docs.wink.apiary.io/#reference/device/thermostats
        return null;
    }

    getTargetTemperatureHigh() {
        console.log('targetTemperature_read called');

        return wh.getLastReading(deviceType, deviceId, 'max_set_point');
    }

    setTargetTemperatureHigh(value) {
        console.log('targetTemperature_write called');
        return wh.setDesiredState(deviceType, deviceId, 'max_set_point', value);
    }

    getTargetTemperatureLow() {
        console.log('targetTemperatureLow_read called');
        return wh.getLastReading(deviceType, deviceId, 'min_set_point');
    }

    setTargetTemperatureLow(value) {
        console.log('targetTemperatureLow_write called');
        return wh.setDesiredState(deviceType, deviceId, 'min_set_point', value);
    }
}

// Export the translator from the module.
module.exports = WinkThermostat;
