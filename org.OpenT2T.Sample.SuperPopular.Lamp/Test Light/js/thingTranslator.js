'use strict';

// logs device state
function logDeviceState(device) {
    if (typeof (device) !== 'undefined') {
        console.log('  device.name          : ' + device.name);
        console.log('  device.props         : ' + device.props);
    } else {
        console.log('device is undefined');
    }
};

// module exports, implementing the schema
module.exports = {
    
    device: null,
    
    initDevice: function(dev) {
        this.device = dev;

        console.log('Javascript initialized.');
        logDeviceState(this.device);
    },

    turnOn: function() {
        console.log('turnOn called.');
    },

    turnOff: function() {
        console.log('turnOff called.');
    },

    setBrightness: function(brightness) {
        console.log('setBrightness called with value: ' + brightness);
    },

    disconnect: function() {
        console.log('disconnect called.');
        logDeviceState(this.device);
    }
};