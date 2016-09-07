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

// Helper method to convert the device schema to the translator schema.
function deviceSchemaToTranslatorSchema(deviceSchema) {

    var stateReader = new StateReader(deviceSchema.desired_state, deviceSchema.last_reading);

    // Quirks:
    // - Wink does not have a target temperature field, so returning the average of min and max setpoint

    var max = stateReader.get('max_set_point');
    var min = stateReader.get('min_set_point');
    var temperatureUnits = stateReader.get('units').temperature;

    var result = {
        id: deviceSchema['object_type'] + '.' + deviceSchema['object_id'],
        n: deviceSchema['name'],
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

// Helper method to convert the translator schema to the device schema.
function translatorSchemaToDeviceSchema(translatorSchema) {

    // build the object with desired state
    var result = { 'desired_state': {} };
    var desired_state = result.desired_state;

    // Quirks:
    // Wink does not have a target temperature field, so ignoring that field in translatorSchema.
    // See: http://docs.winkapiv2.apiary.io/#reference/device/thermostats
    // Instead, we infer it from the max and min setpoint

    if (translatorSchema.n !== undefined) {
        result['name'] = translatorSchema.n;
    }

    if (translatorSchema.targetTemperatureHigh !== undefined) {
        desired_state['max_set_point'] = translatorSchema.targetTemperatureHigh.temperature;
    }

    if (translatorSchema.targetTemperatureLow !== undefined) {
        desired_state['min_set_point'] = translatorSchema.targetTemperatureLow.temperature;
    }

    if (translatorSchema.awayMode !== undefined) {
        desired_state['users_away'] = translatorSchema.awayMode;
    }

    if (translatorSchema.hvacMode !== undefined) {
        desired_state['mode'] = translatorSchema.hvacMode.modes[0];
    }

    return result;
}

var deviceId;
var deviceType = 'thermostats';
var winkHelper;

// This translator class implements the 'org.opent2t.sample.thermostat.superpopular' schema.
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
        console.log('Javascript and Wink Helper initialized.');
    }

    // exports for the entire schema object

    // Queries the entire state of the thermostat
    // and returns an object that maps to the json schema org.opent2t.sample.thermostat.superpopular
    getThermostatResURI() {
        return winkHelper.getDeviceDetailsAsync(deviceType, deviceId)
            .then((response) => {
                return deviceSchemaToTranslatorSchema(response.data);
            });
    }

    // Updates the current state of the thermostat with the contents of postPayload
    // postPayload is an object that maps to the json schema org.opent2t.sample.thermostat.superpopular
    //
    // In addition, returns the updated state (see sample in RAML)
    postThermostatResURI(postPayload) {
        console.log('postThermostatResURI called with payload: ' + JSON.stringify(postPayload, null, 2));

        var putPayload = translatorSchemaToDeviceSchema(postPayload);
        return winkHelper.putDeviceDetailsAsync(deviceType, deviceId, putPayload)
            .then((response) => {
                return deviceSchemaToTranslatorSchema(response.data);
            });
    }

    // exports for individual properties

    getAmbientTemperature() {
        console.log('getAmbientTemperature called');

        return this.getThermostatResURI()
            .then(response => {
                return response.ambientTemperature.temperature;
            });
    }

    getTargetTemperature() {
        console.log('getTargetTemperature called');

        return this.getThermostatResURI()
            .then(response => {
                return response.targetTemperature.temperature;
            });
    }

    getTargetTemperatureHigh() {
        console.log('getTargetTemperatureHigh called');

        return this.getThermostatResURI()
            .then(response => {
                return response.targetTemperatureHigh.temperature;
            });
    }

    setTargetTemperatureHigh(value) {
        console.log('setTargetTemperatureHigh called with value: ' + value);

        var postPayload = {};
        postPayload.targetTemperatureHigh = { temperature: value, units: 'C' };

        return this.postThermostatResURI(postPayload)
            .then(response => {
                return response.targetTemperatureHigh.temperature;
            });
    }

    getTargetTemperatureLow() {
        console.log('getTargetTemperatureLow called');

        return this.getThermostatResURI()
            .then(response => {
                return response.targetTemperatureLow.temperature;
            });
    }

    setTargetTemperatureLow(value) {
        console.log('setTargetTemperatureLow called with value: ' + value);

        var postPayload = {};
        postPayload.targetTemperatureLow = { temperature: value, units: 'C' };

        return this.postThermostatResURI(postPayload)
            .then(response => {
                return response.targetTemperatureLow.temperature;
            });
    }

    subscribe(postbackUrl) {
        console.log('thingTranslator subscribe to "%s", %d, %s', deviceType, deviceId, postbackUrl);
        return this.commonsubscribe(deviceType, deviceId, postbackUrl);
    }

    unsubscribe(subscriptionId) {
        console.log('thingTranslator un-subscribe');
        return this.commonunsubscribe(deviceType, deviceId, subscriptionId);
    }

    // Subscribe to Wink notifications
    // serviceurl - The url endpoint set up to receive postbacks and manage verification
    // secret - Subscriber generated secret for HMAC computation (if omitted, HMAC digest will
    //      not be present on callbacks)
    // This method passes the PubSubHubbub a subscriber URL to the Wink device so that the subscriber
    // will receive postbacks.  This subscription needs to be refreshed or it will expire (currently 24 hrs).
    commonsubscribe(deviceType, deviceId, serviceUrl) {
        var requestUri = 'https://api.wink.com/' + deviceType + '/' + deviceId + '/subscriptions';

        // Winks implementation of PubSubHubbub differs from the standard in that we do not need to provide
        // the topic, or mode on this request.  Topic is implicit from the URL (deviceType/deviceId), and
        // separate requests exist for mode (subscribe and unsubscribe vis POST/DELETE).
        var putPayload = {
            'callback': serviceUrl
        }

        var putPayloadString = JSON.stringify(putPayload);

        console.log("Attempting to subscribe to %s with %s", requestUri, JSON.stringify(putPayload));

        var headers = {
            'Authorization': 'Bearer ' + bearerToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-length': putPayloadString.length
        }

        var options = {
            url: requestUri,
            method: 'POST',
            headers: headers,
            followAllRedirects: true,
            body: putPayloadString
        }

        return request(options)
            .then(function (body) {
                // The request succeeded.
                // The hub response will be 202 "Accepted", and now validation with the service url
                // will proceed.
                console.log(body);
                return JSON.parse(body);
            });
    }

    // Unsubscribes a subscription id from the device.  This will need to be put in a common location or all wink device.
    commonunsubscribe(deviceType, deviceId, subscriptionid)
    {
        var requestUri = 'https://api.wink.com/' + deviceType + '/' + deviceId + '/subscriptions/' + subscriptionid;

        console.log("Attempting to unsubscribe from %s", requestUri)
        
        var headers = {
            'Authorization': 'Bearer ' + bearerToken,
        }

        var options = {
            url: requestUri,
            method: 'DELETE',
            header: headers,
            followAllRedirects: true
        }

        return request(options)
            .then(function (body) {
                return JSON.parse(body);
            });
    }
}

// Export the translator from the module.
module.exports = Translator;
