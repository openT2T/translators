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

    initDevice: function (dev) {
        this.device = dev;

        console.log('Javascript initialized.');
        logDeviceState(this.device);
    },

    open: function () {
        console.log('open called.');
    },

    close: function () {
        console.log('close called.');
    },

    disconnect: function () {
        console.log('disconnect called.');
        logDeviceState(this.device);
    }
};
