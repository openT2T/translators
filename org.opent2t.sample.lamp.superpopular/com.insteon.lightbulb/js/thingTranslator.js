/* jshint esversion: 6 */
/* jshint node: true */
'use strict';

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

function isValidArgument(arg) {
    return !(typeof arg === 'undefined');
}

// Helper method to convert the device schema to the translator schema.
function deviceSchemaToTranslatorSchema(deviceSchema) {

    var device = {
        id: deviceId,
        rt: 'org.opent2t.sample.lamp.superpopular'
    }

    if (isValidArgument(deviceSchema['DeviceName']))
    {
        device.n = deviceSchema['DeviceName'];
    }

    if (isValidArgument(deviceSchema['Power']))
    {
        device.power = { 'value': deviceSchema['Power'] === 'on' };
    }

    if (isValidArgument(deviceSchema['Level'])) {
        device.dim = { 'dimmingSetting': deviceSchema['Level'], 'range': [0, 100] };
    }

    return device;
}

// Helper method to convert the translator schema to the device schema.
function translatorSchemaToDeviceSchema(translatorSchema) {

    // build the object with desired state
    var result = {};

    if (translatorSchema.n) {
        result['DeviceName'] = translatorSchema.n ;
    }

    if (translatorSchema.power) {
        result['command'] = translatorSchema.power.value ? 'on' : 'off';
    }

    if (translatorSchema.dim) {
        result['command'] = translatorSchema.dim.dimmingSetting > 0 ? 'on' : 'off';
        result['level'] = translatorSchema.dim.dimmingSetting;
    }

    return result;
}

var deviceId;
var insteonHub;

// This translator class implements the 'org.opent2t.sample.lamp.superpopular' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('Insteon Lightbulb initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");

        deviceId = deviceInfo.deviceInfo.id;
        insteonHub = deviceInfo.hub;

        console.log('Insteon Lightbulb initializing...Done');
    }

    // exports for the entire schema object

    // Queries the entire state of the lamp
    // and returns an object that maps to the json schema org.opent2t.sample.lamp.superpopular
    getLampResURI() {
        return insteonHub.getDeviceDetailsAsync(deviceId)
            .then((response) => {
                return deviceSchemaToTranslatorSchema(response);
            });
    }

    // Updates the current state of the lamp with the contents of postPayload
    // postPayload is an object that maps to the json schema org.opent2t.sample.lamp.superpopular
    //
    // In addition, returns the updated state (see sample in RAML)
    postLampResURI(postPayload) {

        console.log('postLampResURI called with payload: ' + JSON.stringify(postPayload, null, 2));

        var putPayload = translatorSchemaToDeviceSchema(postPayload);
        return insteonHub.putDeviceDetailsAsync(deviceId, putPayload)
            .then((response) => {
                return deviceSchemaToTranslatorSchema(response);
            });
    }

    // exports for individual properties

    getPower() {
        console.log('getPower called');

        return this.getLampResURI()
            .then(response => {
                return response.power.value;
            });
    }

    setPower(value) {
        console.log('setPower called with value: ' + value);

        var postPayload = {};
        postPayload.power = { value: value };

        return this.postLampResURI(postPayload)
            .then(response => {
                return response.power.value;
            });
    }
}

// Export the translator from the module.
module.exports = Translator;