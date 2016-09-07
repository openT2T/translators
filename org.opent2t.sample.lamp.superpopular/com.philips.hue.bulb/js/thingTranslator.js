/* jshint esversion: 6 */
/* jshint node: true */
'use strict';
const HueHelper = require('opent2t-translator-helper-hue');

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

// Helper method to convert the device schema to the translator schema.
function deviceSchemaToTranslatorSchema(deviceSchema) {

	var deviceState = deviceSchema.state;
    var result = {
        id:  'lights.' + deviceId,
        n: deviceSchema['name'],
        rt: 'org.opent2t.sample.lamp.superpopular',
    }
    
	if(typeof deviceState != 'undefined'){
        result.power = { value: deviceState['on'] };
        result.dim = { dimmingSetting: deviceState['bri'], range: [1, 254]};
    }else{
        for (var i = 0; i < deviceSchema.length; i++)
        {
            var changeResult = deviceSchema[i].success;
            if(typeof changeResult != 'undefined')
            {
                var key = Object.keys(changeResult)[0];
                var parseKey = key.split("/");
                var attribute = parseKey[parseKey.length-1];
                if( attribute == 'on')
                {
                    result.power = { value: changeResult[key] };
                }
                else if ( attribute == 'bri')
                {
                    result.dim = { dimmingSetting: changeResult[key], range: [1, 254]};
                }else if ( attribute == 'name')
                {
                    result.n = changeResult[key];
                }
            }
        }
    }
    return result;
}

// Helper method to convert the translator schema to the device schema.
function translatorSchemaToDeviceSchema(translatorSchema) {

    // build the object with desired state
    var result = { };

    if (translatorSchema.n !== undefined) {
        result['name'] = translatorSchema.n;
    }

    if (translatorSchema.power!== undefined) {
        result['on'] = translatorSchema.power.value;
    }

    if (translatorSchema.dim!== undefined) {
        result['bri'] = translatorSchema.dim.dimmingSetting;
    }

    return result;
}

var deviceId;
var deviceType = 'lights';
var hueHelper;

// This translator class implements the 'org.opent2t.sample.light.superpopular' schema.
class Translator {

    constructor(device) {
        console.log('Initializing device.');

        validateArgumentType(device, 'device', 'object');
        validateArgumentType(device.props, 'device.props', 'object');

        validateArgumentType(device.props.access_token, 'device.props.access_token', 'string');
        validateArgumentType(device.props.device_id, 'device.props.device_id', 'string');
		validateArgumentType(device.props.bridge_id, 'device.props.bridge_id', 'string');
        validateArgumentType(device.props.whitelist_id, 'device.props.whitelist_id', 'string');

        deviceId = device.props.device_id;

        // Initialize Hue Helper
        hueHelper = new HueHelper(device.props.access_token, device.props.bridge_id, device.props.whitelist_id);
        console.log('Javascript and Hue Helper initialized.');
    }

    // exports for the entire schema object

    // Queries the entire state of the lamp
    // and returns an object that maps to the json schema org.opent2t.sample.lamp.superpopular
    getLampResURI() {
        return hueHelper.getDeviceDetailsAsync(deviceType, deviceId)
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
        return hueHelper.putDeviceDetailsAsync(deviceType, deviceId, putPayload)
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
