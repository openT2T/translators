// helper library for interacting with this lamp
var SensorTag = require('sensortag');

// logs device state
function logDeviceState(device) {
    if (typeof device != 'undefined') {
        console.log('  device.name          : ' + device.name);
        console.log('  device.props         : ' + device.props);
    } else {
        console.log('device is undefined');
    }
};

var tag = null;

// module exports, implementing the schema
module.exports = {
    device: null,

    initDevice: function(dev) {
        this.device = dev;

        if (typeof this.device != 'undefined') {
            if (typeof (this.device.props) !== 'undefined') {
                var props = JSON.parse(this.device.props);
                if (typeof (props.id) !== 'undefined') {
                    SensorTag.discoverById(props.id, function(sensorTag) {

                        console.log('discovered');

                        tag = sensorTag;
                        tag.connectAndSetup(function(conn_error) {
                            console.log('connected');

                            if (conn_error != null) {
                                console.log(conn_error);
                                return;
                            } else {
                                tag.enableIrTemperature(function(enable_error) {

                                    setTimeout(function() {
                                        if (enable_error != null) {
                                            console.log(enable_error);
                                            return;
                                        } else {
                                            return;
                                        };
                                    }, 1000);	// wait is neccessary for hardware to startup
                                });
                            }
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

        if (tag != null) {
            tag.disconnect(function(err) {
                console.log('disconnected');
            });
        }
    },

    getCurrentTemperature: function(callback) {

        console.log('getCurrentTemperature called.');

        if (tag == null) {
            console.log('initDevice not complete (Is tag awake?)');
            callback('(unknown)');
            return;
        }

        tag.readIrTemperature(function(temp_error, objectTemperature, ambient_temp) {
            if (temp_error != null) {
                console.log(temp_error);
            } else {
                callback(ambient_temp);
            }
            return;
        });
    },
};

// globals for JxCore host
global.initDevice = module.exports.initDevice;
global.getCurrentTemperature = module.exports.getCurrentTemperature;
global.disconnect = module.exports.disconnect;

