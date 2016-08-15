'use strict';

// helper library for interacting with this heart rate sensor
var PolarH7 = require('./lib/polarh7-helper').PolarH7;

// logs device state
function logDeviceState(device) {
    if (typeof device != 'undefined') {
        console.log('  device.name          : ' + device.name);
        console.log('  device.props         : ' + device.props);
    } else {
        console.log('device is undefined');
    }
};

var sensor;

// module exports, implementing the schema
module.exports = {
    device: null,

    initDevice: function (dev) {

        this.device = dev;

        if (typeof this.device != 'undefined') {
            if (typeof (this.device.props) !== 'undefined') {
                var props = JSON.parse(this.device.props);
                if (typeof (props.id) !== 'undefined') {
                    PolarH7.getSensor(props.id, function (s) {
                        sensor = s;
                        console.log('discovered, now connecting...');
                        sensor.connect(function () {
                            console.log('Javascript initialized.');
                            logDeviceState(dev);
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
    },

    disconnect: function () {
        console.log('disconnect called.');
        logDeviceState(this.device);

        if (typeof sensor != 'undefined') {
            sensor.disconnect(function () {
                console.log('device disconnected');
            });
        } else {
            console.log('disconnect failed: no sensor defined');
        }
    },

    getBeatsPerMinute: function (callback) {
        console.log('getBeatsPerMinute called.');

        if (typeof sensor != 'undefined') {
            sensor.getBeatsPerMinute((bpm) => {
                callback(bpm);
            });
        } else {
            console.log('getBeatsPerMinute failed: no sensor defined');
        }
    },

    getRRInterval: function () {
        console.log('getRRInterval called.');

        if (typeof sensor != 'undefined') {
            console.log('*** Not yet implemented.');
        } else {
            console.log('getRRInterval failed: no sensor defined.');
        }
    },

    getEnergyExpended: function () {
        console.log('getEnergyExpended called.');

        if (typeof sensor != 'undefined') {
            console.log('*** Not yet implemented.');
        } else {
            console.log('getEnergyExpended failed: no sensor defined.');
        }
    },

    getContactStatus: function () {
        console.log('getContactStatus called.');

        if (typeof sensor != 'undefined') {
            console.log('*** Not yet implemented.');
        } else {
            console.log('getContactStatus failed: no sensor defined.');
        }
    },
};
