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
var deviceType = 'binary_switches';
var winkHelper;

// This translator class implements the 'oic.r.switch.binary' interface.
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

    // Queries the entire state of the binary switch
    // and returns an object that maps to the json schema oic.r.switch.binary
    getBinarySwitchResURI() {
        return winkHelper.getDeviceDetailsAsync(deviceType, deviceId)
            .then((response) => {

                var powered = response.data.desired_state['powered'];

                // map to opent2t schema to return
                return {
                    value: powered
                }
            });
    }

    // Updates the current state of the binary switch with the contents of postPayload
    // postPayload is an object that maps to the json schema oic.r.switch.binary
    //
    // In addition, returns the updated state (see sample in RAML)
    postBinarySwitchResURI(postPayload) {

        console.log('postBinarySwitchResURI called with payload: ' + JSON.stringify(postPayload));

        // build the object with desired state
        var putPayload = { 'desired_state': {} };

        putPayload.desired_state['powered'] = postPayload.value;

        return winkHelper.putDeviceDetailsAsync(deviceType, deviceId, putPayload)
            .then((response) => {

                var powered = response.data.desired_state['powered'];

                // map to opent2t schema to return
                return {
                    value: powered
                }
            });
    }

    // exports for individual properties

    getValue() {
        console.log('getValue called');
        return winkHelper.getLastReadingAsync(deviceType, deviceId, 'powered');
    }

    setValue(value) {
        console.log('setValue called with value: ' + value);
        return winkHelper.setDesiredStateAsync(deviceType, deviceId, 'powered', value);
    }
}

// Export the translator from the module.
module.exports = Translator;
