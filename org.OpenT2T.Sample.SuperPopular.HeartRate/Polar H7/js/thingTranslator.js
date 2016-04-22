'use strict';

// helper library for interacting with this lamp
var LEDBlue = require('./lib/ledblue-helper').LEDBlue;

// logs device state
function logDeviceState(device) {
    if (typeof device != 'undefined') {
        console.log('  device.name          : ' + device.name);
        console.log('  device.props         : ' + device.props);
    } else {
        console.log('device is undefined');
    }
};

var pairKey = 0x01;
var bulb = null;

// module exports, implementing the schema
module.exports = {
    device: null,

    initDevice: function(dev) {

        this.device = dev;

        if (typeof this.device != 'undefined') {
            if (typeof (this.device.props) !== 'undefined') {
                var props = JSON.parse(this.device.props);
                if (typeof (props.id) !== 'undefined') {
                    LEDBlue.getBulb(props.id, function(b) {
                        bulb = b;
                        bulb.connect(function() {
                            console.log('connected');
                            bulb.pair(pairKey, function() {
                                console.log('paired');
                            });
                        });
                    });
                } else {
                    console.log('props.id is undefined');
                }
            } else {
                console.log('props is undefined');
            }
        } else {
            console.log('device is undefined');
        }

        console.log('Javascript initialized.');
        logDeviceState(this.device);
    },

    disconnect: function() {
        console.log('disconnect called.');
        logDeviceState(this.device);

        if (typeof bulb != 'undefined') {
            bulb.disconnect(function() {
                console.log('device disconnected');
            });
        } else {
            console.log('disconnect failed: no bulb defined');
        }
    },

    turnOn: function() {
        console.log('turnOn called.');

        if (typeof bulb != 'undefined') {
            bulb.turnOn(function() {
                console.log('turnOn done');
            });
        } else {
            console.log('turnOn failed: no bulb defined');
        }
    },

    turnOff: function() {
        console.log('turnOff called.');

        if (typeof bulb != 'undefined') {
            bulb.turnOff(function() {
                console.log('turnOff done');
            });
        } else {
            console.log('turnOff failed: no bulb defined');
        }
    },

    setBrightness: function(brightness) {
        console.log('setBrightness called with value: ' + brightness);

        if (typeof bulb != 'undefined') {
            // convert 0-100 range to 1-255
            var b = ((brightness * 254) / 100) + 1;
            bulb.setColor(brightness, brightness, brightness, function() {
                console.log('brightness changed');
            });
        } else {
            console.log('setBrightness failed: no bulb defined');
        }
    }
};

// globals for JxCore host
global.initDevice = module.exports.initDevice;
global.turnOn = module.exports.turnOn;
global.turnOff = module.exports.turnOff;
global.setBrightness = module.exports.setBrightness;
global.disconnect = module.exports.disconnect;
