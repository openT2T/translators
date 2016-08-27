
/* jshint esversion: 6 */
/* jshint node: true */
'use strict';

// helper library for interacting with this lamp
var fluxHelper = require('./flux');
const PAIR_KEY = 0x01;

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

var bulb = null;
var deviceId = null;

// in memory state of bulb
var powered = false;
var r = 0;
var g = -0
var b = 0;

// This translator class implements the 'org.opent2t.sample.lamp.superpopular' schema.
class Translator {

    constructor(device) {
        console.log('Initializing device.');

        validateArgumentType(device, 'device', 'object');
        validateArgumentType(device.props, 'device.props', 'object');
        validateArgumentType(device.props.id, 'device.props.id', 'string');

        deviceId = device.props.id;
    }

    connect() {
        console.log('connect called.');

        console.log('Starting discovery for: ' + deviceId);
        return fluxHelper.discover(deviceId).then(b => {
            console.log('Discovery returned, now connecting');
            return b.connect().then(() => {
                console.log('Connect returned, now pairing');
                return b.pair(PAIR_KEY).then(() => {
                    bulb = b
                    console.log('Pairing complete');
                });
            });
        });
    }

    disconnect() {
        console.log('disconnect called.');

        return new Promise(function (resolve, reject) {
            if (!!bulb) {
                return bulb.disconnect(function () {
                    if (!!error) {
                        throw new Error(error);
                    } else {
                        console.log('disconnected');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // exports for the entire schema object

    // Queries the entire state of the lamp
    // and returns an object that maps to the json schema org.opent2t.sample.lamp.superpopular
    getLampResURI() {

        // QUIRKS:
        // - At this time we don't have the ability to query the current state of the bulb
        // so we are just returning the last set value. This will need some more inspection
        // of the underlying BLE services and characteristics of the bulb to read the current state.
        // - Also, dimming is not supported at this time

        if (!!bulb) {
            return Promise.resolve({
                id: deviceId,
                rt: 'org.opent2t.sample.lamp.superpopular',
                power: { value: powered },
                color: {
                    rgbValue: [r, g, b],
                    range: [0, 255]
                }
            });
        }
        else {
            throw new Error('No Bulb found (Please check if it is on?)');
        }
    }

    // Updates the current state of the lamp with the contents of postPayload
    // postPayload is an object that maps to the json schema org.opent2t.sample.lamp.superpopular
    //
    // In addition, returns the updated state (see sample in RAML)
    postLampResURI(postPayload) {
        console.log('postLampResURI called with payload: ' + JSON.stringify(postPayload, null, 2));

        // QUIRK:
        // - At this time we don't have the ability to set multiple things at the same time
        // this can be added here easily later.
        // - Also, dimming is not supported at this time.

        if (!!bulb) {

            // process power
            if (!!postPayload.power) {
                return bulb.setPowerState(postPayload.power.value).then(result => {

                    // update in-memory state
                    powered = postPayload.power.value;

                    // return
                    return Promise.resolve({
                        power: {
                            value: postPayload.power.value
                        }
                    });
                });
            }

            // process color
            if (!!postPayload.color) {

                return bulb.setColor(
                    postPayload.color.colorRGB.R,
                    postPayload.color.colorRGB.G,
                    postPayload.color.colorRGB.B)
                    .then(result => {

                        // update in-memory state
                        r = postPayload.color.colorRGB.R;
                        g = postPayload.color.colorRGB.G;
                        b = postPayload.color.colorRGB.B;

                        // return
                        return Promise.resolve(postPayload);
                    });
            }
        }
        else {
            throw new Error('No Bulb found (Please check if it is on?)');
        }
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
