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

    var powered = stateReader.get('powered');

    return {
        id: deviceSchema['object_type'] + '.' + deviceSchema['object_id'],
        n: deviceSchema['name'],
        rt: 'org.opent2t.sample.thermostat.superpopular',
        power: { 'value': powered }
    };
}

// Helper method to convert the translator schema to the device schema.
function translatorSchemaToDeviceSchema(translatorSchema) {

    // build the object with desired state
    var result = { 'desired_state': {} };
    var desired_state = result.desired_state;

    if (translatorSchema.n) {
        result['name'] = translatorSchema.n;
    }

    if (translatorSchema.power) {
        desired_state['powered'] = translatorSchema.power.value;
    }

    return result;
}

var deviceId;
var deviceType = 'binary_switches';
var winkHelper;

// This translator class implements the 'org.opent2t.sample.binaryswitch.superpopular' interface.
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

    // Queries the entire state of the binary switch
    // and returns an object that maps to the json schema org.opent2t.sample.binaryswitch.superpopular
    getBinarySwitchResURI() {
        return winkHelper.getDeviceDetailsAsync(deviceType, deviceId)
            .then((response) => {
                return deviceSchemaToTranslatorSchema(response.data);
            });
    }

    // Updates the current state of the binary switch with the contents of postPayload
    // postPayload is an object that maps to the json schema org.opent2t.sample.binaryswitch.superpopular
    //
    // In addition, returns the updated state (see sample in RAML)
    postBinarySwitchResURI(postPayload) {

        console.log('postBinarySwitchResURI called with payload: ' + JSON.stringify(postPayload, null, 2));

        var putPayload = translatorSchemaToDeviceSchema(postPayload);
        return winkHelper.putDeviceDetailsAsync(deviceType, deviceId, putPayload)
            .then((response) => {
                return deviceSchemaToTranslatorSchema(response.data);
            });
    }

    // exports for individual properties

    getPower() {
        console.log('getPower called');

        return this.getBinarySwitchResURI()
            .then(response => {
                return response.power.value;
            });
    }

    setPower(value) {
        console.log('setPower called with value: ' + value);

        var postPayload = {};
        postPayload.power = { value: value };

        return this.postBinarySwitchResURI(postPayload)
            .then(response => {
                return response.power.value;
            });
    }

    subscribe(callbackUrl, verificationRequest, verificationResponse) {
        return winkHub._subscribe(deviceType, deviceId, callbackUrl, verificationRequest, verificationResponse);
    }

    unsubscribe(callbackUrl) {
        return winkHub._unsubscribe(deviceType, deviceId, callbackUrl);
    }
}

// Export the translator from the module.
module.exports = Translator;
