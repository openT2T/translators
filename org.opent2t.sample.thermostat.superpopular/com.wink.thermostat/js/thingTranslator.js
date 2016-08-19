/* jshint esversion: 6 */
/* jshint node: true */
'use strict';
const WinkHelper = require('opent2t-translator-helper-wink');

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
var winkHelper;

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
        winkHelper = new WinkHelper(device.props.access_token);
        console.log('Javascript and Wink Helper initialized : ');
    }

    // exports for the OCF schema

    // Queries the entire state of the thermostat
    // and returns an object that maps to the json schema org.opent2t.sample.thermostat.superpopular
    getThermostatResURI() {
        return winkHelper.getDeviceDetailsAsync(deviceType, deviceId)
            .then((response) => {

                // Wink does not have a target temperature field, so returning the average of min and max setpoint
                var max = response.data.desired_state['max_set_point'];
                var min = response.data.desired_state['min_set_point'];

                // map to opent2t schema to return
                return {
                    targetTemperature: (max + min) / 2,
                    targetTemperatureHigh: max,
                    targetTemperatureLow: min,
                    ambientTemperature: response['temperature']
                }
            });
    }

    // Updates the current state of the thermostat with the contents of value
    // value is an object that maps to the json schema org.opent2t.sample.thermostat.superpopular
    //
    // In addition, returns the updated state (see sample in RAML)
    postThermostatResURI(value) {

        // build the object with desired state
        var putPayload = { 'data': { 'desired_state': {} } };

        // Wink does not have a target temperature field, so ignoring that field in value.
        // See: http://docs.winkapiv2.apiary.io/#reference/device/thermostats
        // Instead, we infer it from the max and min setpoint

        putPayload.data.desired_state['max_set_point'] = value.targetTemperatureHigh;
        putPayload.data.desired_state['min_set_point'] = value.targetTemperatureLow;

        return winkHelper.putDeviceDetailsAsync(deviceType, deviceId, putPayload)
            .then((response) => {

                // Wink does not have a target temperature field, so returning the average of min and max setpoint
                var max = response.data.desired_state['max_set_point'];
                var min = response.data.desired_state['min_set_point'];

                // map to opent2t schema to return
                return {
                    targetTemperature: (max + min) / 2,
                    targetTemperatureHigh: max,
                    targetTemperatureLow: min,
                    ambientTemperature: response['temperature']
                }
            });;
    }

    // exports for the AllJoyn schema
    getAmbientTemperature() {
        console.log('getAmbientTemperature called');
        return winkHelper.getLastReadingAsync(deviceType, deviceId, 'temperature');
    }

    getTargetTemperature() {
        console.log('getTargetTemperature called');

        // Wink does not have a target temperature field, so returning the average of min and max setpoint
        return this.getTargetTemperatureHigh()
            .then(high => {
                return this.getTargetTemperatureLow()
                    .then(low => {
                        return (high + low) / 2;
                    });
            });
    }

    getTargetTemperatureHigh() {
        console.log('getTargetTemperatureHigh called');

        return winkHelper.getLastReadingAsync(deviceType, deviceId, 'max_set_point');
    }

    setTargetTemperatureHigh(value) {
        console.log('setTargetTemperatureHigh called');
        return winkHelper.setDesiredStateAsync(deviceType, deviceId, 'max_set_point', value);
    }

    getTargetTemperatureLow() {
        console.log('getTargetTemperatureLow called');
        return winkHelper.getLastReadingAsync(deviceType, deviceId, 'min_set_point');
    }

    setTargetTemperatureLow(value) {
        console.log('setTargetTemperatureLow called');
        return winkHelper.setDesiredStateAsync(deviceType, deviceId, 'min_set_point', value);
    }
}

// Export the translator from the module.
module.exports = WinkThermostat;
