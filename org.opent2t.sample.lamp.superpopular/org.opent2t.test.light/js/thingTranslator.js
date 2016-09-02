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

var powered = false;
var dimmingSetting = 30;
var r = 255;
var g = 255;
var b = 255;

// This translator class implements the 'org.opent2t.sample.lamp.superpopular' schema.
class Translator {

    constructor(device) {
        console.log('Initializing device.');

        validateArgumentType(device, 'device', 'object');
        validateArgumentType(device.props, 'device.props', 'object');
        validateArgumentType(device.props.token, 'device.props.token', 'string');

        console.log('Javascript initialized.');
    }

    // exports for the entire schema object

    // Queries the entire state of the lamp
    // and returns an object that maps to the json schema org.opent2t.sample.lamp.superpopular
    getLampResURI() {
        return Promise.resolve({
            id: 'some_test_id',
            rt: 'org.opent2t.sample.lamp.superpopular',
            power: { value: powered },
            dim: {
                dimmingSetting: dimmingSetting,
                step: 5,
                range: [0, 100]
            },
            color: {
                rgbValue: [r, g, b],
                range: [0, 255]
            }
        });
    };

    // Updates the current state of the lamp with the contents of postPayload
    // postPayload is an object that maps to the json schema org.opent2t.sample.lamp.superpopular
    //
    // In addition, returns the updated state (see sample in RAML)
    postLampResURI(postPayload) {
        console.log('postLampResURI called with payload: ' + JSON.stringify(postPayload, null, 2));

        // set in memory state
        if (postPayload.power) {
            powered = postPayload.power.value;
        }

        if (postPayload.dim) {
            dimmingSetting = postPayload.dim.dimmingSetting;
        }

        if (!!postPayload.color && !!postPayload.color.rgbValue && postPayload.color.rgbValue.length == 3) {
            r = postPayload.color.rgbValue[0];
            g = postPayload.color.rgbValue[1];
            b = postPayload.color.rgbValue[2];
        }

        // return updated state
        return this.getLampResURI();
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

    getDim() {
        console.log('getDim called');

        return this.getLampResURI()
            .then(response => {
                return response.dim.dimmingSetting;
            });
    }

    setDim(value) {
        console.log('setDim called with value: ' + value);

        var postPayload = {};
        postPayload.dim = { dimmingSetting: value };

        return this.postLampResURI(postPayload)
            .then(response => {
                return response.dim.dimmingSetting;
            });
    }

    getColor() {
        console.log('getColor called');

        return this.getLampResURI()
            .then(response => {
                return response.color.rgbValue;
            });
    }

    setColor(value) {
        console.log('setColor called with value: ' + JSON.stringify(value));

        var postPayload = {};
        postPayload.color = { rgbValue: value };

        return this.postLampResURI(postPayload)
            .then(response => {
                return response.color.rgbValue;
            });
    }
}

// Export the translator from the module.
module.exports = Translator;
