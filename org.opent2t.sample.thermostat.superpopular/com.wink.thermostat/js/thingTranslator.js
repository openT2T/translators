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

// Wink does not always populate every desired_state property, but last_reading doesn't necessarily
// update as soon as we send our PUT request. Instead of relying just on one state or the other,
// we use this StateReader class to read from desired_state if it is there, and fall back to last_reading
// if it is not.
class StateReader {
    constructor(desired_state, last_reading) {
        this.desired_state = desired_state;
        this.last_reading = last_reading;
    }

    get(state) {
        if (this.desired_state[state] !== undefined) {
            return this.desired_state[state];
        }
        else {
            return this.last_reading[state];
        }
    }
}

function winkSchemaToOcfSchema(winkSchema) {
    var last_reading = winkSchema.last_reading;

    var stateReader = new StateReader(winkSchema.desired_state, winkSchema.last_reading);

    // Wink does not have a target temperature field, so returning the average of min and max setpoint
    var max = stateReader.get('max_set_point');
    var min = stateReader.get('min_set_point');
    var temperatureUnits = stateReader.get('units').temperature;

    // map to opent2t schema to return
    var result = {
        id: winkSchema['object_type'] + '.' + winkSchema['object_id'],
        n: winkSchema['name'],
        rt: 'org.opent2t.sample.thermostat.superpopular',
        targetTemperature: { temperature: (max + min) / 2, units: temperatureUnits },
        targetTemperatureHigh: { temperature: max, units: temperatureUnits },
        targetTemperatureLow: { temperature: min, units: temperatureUnits },
        ambientTemperature: { temperature: stateReader.get('temperature'), units: temperatureUnits },
        awayMode: stateReader.get('users_away'),
        hasFan: stateReader.get('has_fan'),
        ecoMode: stateReader.get('eco_target'),
        hvacMode: { supportedModes: stateReader.get('modes_allowed'), modes: [stateReader.get('mode')] },
        fanTimerActive: stateReader.get('fan_timer_active')
    };

    if (stateReader.get('external_temperature') !== null) {
        result.externalTemperature = { temperature: stateReader.get('external_temperature'), units: temperatureUnits };
    }

    return result;
}

function ocfSchemaToWinkSchema(ocfSchema) {
    // build the object with desired state
    var result = { 'desired_state': {} };
    var desired_state = result.desired_state;

    // Wink does not have a target temperature field, so ignoring that field in ocfSchema.
    // See: http://docs.winkapiv2.apiary.io/#reference/device/thermostats
    // Instead, we infer it from the max and min setpoint

    if (ocfSchema.n !== undefined) {
        result['name'] = ocfSchema.n;
    }
    if (ocfSchema.targetTemperatureHigh !== undefined) {
        desired_state['max_set_point'] = ocfSchema.targetTemperatureHigh.temperature;
    }
    if (ocfSchema.targetTemperatureLow !== undefined) {
        desired_state['min_set_point'] = ocfSchema.targetTemperatureLow.temperature;
    }
    if (ocfSchema.awayMode !== undefined) {
        desired_state['users_away'] = ocfSchema.awayMode;
    }
    if (ocfSchema.hvacMode !== undefined) {
        desired_state['mode'] = ocfSchema.hvacMode.modes[0];
    }

    return result;
}

var deviceId;
var deviceType = 'thermostats';
var winkHelper;

// This translator class implements the 'org.opent2t.sample.thermostat.superpopular' interface.
class Translator {

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

    // exports for the entire schema object

    // Queries the entire state of the thermostat
    // and returns an object that maps to the json schema org.opent2t.sample.thermostat.superpopular
    getThermostatResURI() {
        return winkHelper.getDeviceDetailsAsync(deviceType, deviceId)
            .then((response) => {
                return winkSchemaToOcfSchema(response.data);
            });
    }

    // Updates the current state of the thermostat with the contents of postPayload
    // postPayload is an object that maps to the json schema org.opent2t.sample.thermostat.superpopular
    //
    // In addition, returns the updated state (see sample in RAML)
    postThermostatResURI(value) {
        console.log('postThermostatResURI called with payload: ' + JSON.stringify(postPayload));

        var putPayload = ocfSchemaToWinkSchema(value);
        return winkHelper.putDeviceDetailsAsync(deviceType, deviceId, putPayload)
            .then((response) => {
                return winkSchemaToOcfSchema(response.data);
            });
    }

    // exports for individual properties

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
module.exports = Translator;
