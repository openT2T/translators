'use strict';

var ZWave = require('openzwave-shared');
var os = require('os');

// logs device state
function logDeviceState(device) {
    if (typeof device != 'undefined') {
        console.log('  device.name          : ' + device.name);
        console.log('  device.props         : ' + device.props);
    } else {
        console.log('device is undefined');
    }
}

var zwave = new ZWave({
    ConsoleOutput: false
});

zwave.on('driver failed', function () {
    console.log('failed to start driver');
    zwave.disconnect();
    process.exit();
});

var device = null;
var nodeId = null;

// module exports, implementing the schema
module.exports = {

    initDevice: function (dev) {

        device = dev;

        if (typeof device != 'undefined') {
            if (typeof (device.props) !== 'undefined') {
                var props;
                try {
                    props = JSON.parse(device.props);
                } catch (ex) {
                    console.log("invalid address string: %s", props.id);
                    return;
                }


                nodeId = props.id.nodeId;

                var zwavedriverroot = {
                    "darwin": '/dev/',
                    "linux": '/dev/',
                    "win32": '\\\\.\\'
                }
                var deviceAddress = zwavedriverroot[os.platform()] + props.serialPort;
                console.log("connecting to " + deviceAddress);
                zwave.connect(zwavedriverroot[os.platform()] + deviceAddress);
            } else {
                console.log('props is undefined');
                return;
            }
        } else {
            console.log('device is undefined');
            return;
        }
    },

    disconnect: function () {
        console.log('disconnect called.');

        logDeviceState(device);

        zwave.disconnect(function () {
            console.log('device disconnected');
        });
    },


    turnOn: function () {
        console.log("turnOn called.");

        // {node_id:nodeId,	class_id: 38,	instance:1,	index:0}
        if (nodeId !== 'undefined') {
            zwave.setValue(nodeId, 38, 1, 0, 99);
        } else {
            console.log('undefined nodeId');
            return;
        }
    },

    turnOff: function () {
        console.log("turnOff called.");

        // {node_id:device.nodeId,	class_id: 38,	instance:1,	index:0}
        if (nodeId !== 'undefined') {
            zwave.setValue(nodeId, 38, 1, 0, 0);
        } else {
            console.log('undefined nodeId');
            return;
        }
    },

    setBrightness: function (brightness) {
        console.log('setBrightness called with value: ' + brightness);

        // {node_id:device.nodeId,	class_id: 38,	instance:1,	index:0}
        if (nodeId !== 'undefined') {
            zwave.setValue(nodeId, 38, 1, 0, brightness);
        } else {
            console.log('undefined nodeId');
            return;
        }
    }
};
