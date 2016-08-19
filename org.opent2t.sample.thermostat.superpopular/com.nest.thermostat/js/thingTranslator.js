/* jshint esversion: 6 */
/* jshint node: true */
'use strict';
const NestHelper = require('opent2t-translator-helper-nest');

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
var nestHelper;

// This translator class implements the 'org.opent2t.sample.thermostat.superpopular' interface.
class NestThermostat {

    constructor(device) {
        console.log('Initializing device.');

        validateArgumentType(device, 'device', 'object');
        validateArgumentType(device.props, 'device.props', 'object');

        validateArgumentType(device.props.access_token, 'device.props.access_token', 'string');
        validateArgumentType(device.props.id, 'device.props.id', 'string');

        deviceId = device.props.id;

        // Initialize Nest Helper
        nestHelper = new NestHelper(device.props.access_token);
        console.log('Javascript and Nest Helper initialized : ');
    }

    // exports for the OCF schema

    // Queries the entire state of the thermostat
    // and returns an object that maps to the json schema org.opent2t.sample.thermostat.superpopular
    getThermostatResURI() {
        return nestHelper.getDeviceDetailsAsync(deviceType, deviceId)
            .then((response) => {

                // map to opent2t schema to return
                return {
                    targetTemperature: response['target_temperature_c'],
                    targetTemperatureHigh: response['target_temperature_high_c'],
                    targetTemperatureLow: response['target_temperature_low_c'],
                    ambientTemperature: response['ambient_temperature_c']
                }
            });
    }

    // Updates the current state of the thermostat with the contents of value
    // value is an object that maps to the json schema org.opent2t.sample.thermostat.superpopular
    //
    // In addition, returns the updated state (see sample in RAML)
    postThermostatResURI(value) {
        // build the post format Nest depends on
        var putPayload = {};
        putPayload['target_temperature_c'] = value.targetTemperature;
        putPayload['target_temperature_high_c'] = value.targetTemperatureHigh;
        putPayload['target_temperature_low_c'] = value.targetTemperatureLow;
        putPayload['ambient_temperature_c'] = value.ambientTemperature;

        return nestHelper.putDeviceDetailsAsync(deviceType, deviceId, putPayload)
            .then((response) => {

                // map to opent2t schema to return
                return {
                    targetTemperature: response['target_temperature_c'],
                    targetTemperatureHigh: response['target_temperature_high_c'],
                    targetTemperatureLow: response['target_temperature_low_c'],
                    ambientTemperature: response['ambient_temperature_c']
                }
            });
    }

    // exports for the AllJoyn schema
    getAmbientTemperature() {
        console.log('getAmbientTemperature called');
        return nestHelper.getFieldAsync(deviceType, deviceId, 'ambient_temperature_c');
    }

    getTargetTemperature() {
        console.log('getTargetTemperature called');
        return nestHelper.getFieldAsync(deviceType, deviceId, 'target_temperature_c');
    }

    getTargetTemperatureHigh() {
        console.log('getTargetTemperatureHigh called');
        return nestHelper.getFieldAsync(deviceType, deviceId, 'target_temperature_high_c');
    }

    setTargetTemperatureHigh(value) {
        console.log('setTargetTemperatureHigh called');
        return nestHelper.setFieldAsync(deviceType, deviceId, 'target_temperature_high_c', value);
    }

    getTargetTemperatureLow() {
        console.log('getTargetTemperatureLow called');
        return nestHelper.getFieldAsync(deviceType, deviceId, 'target_temperature_low_c');
    }

    setTargetTemperatureLow(value) {
        console.log('setTargetTemperatureLow called');
        return nestHelper.setFieldAsync(deviceType, deviceId, 'target_temperature_low_c', value);
    }
}

// Export the translator from the module.
module.exports = NestThermostat;
