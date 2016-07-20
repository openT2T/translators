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
};

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
var homeId = null;

// module exports, implementing the schema
module.exports = {

   initDevice:function (dev) {

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


                homeId = props.id.homeId;
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


    open: function() {
        console.log("open called.");

        // {node_id:device.nodeId,	class_id: 37,	instance:1,	index:0}, true (=shade up)
        if (nodeId !== 'undefined') {
            zwave.setValue(nodeId, 37, 1, 0, true);
        } else {
            console.log('undefined nodeId');
            return;
        }
    },

    close: function() {
        console.log("close called.");

        console.log(nodeId);

        // {node_id:device.nodeId,	class_id: 37,	instance:1,	index:0}, false (=shade down)
        if (nodeId !== 'undefined') {
            zwave.setValue(nodeId, 37, 1, 0, false);
        } else {
            console.log('undefined nodeId');
            return;
        }
    },
};