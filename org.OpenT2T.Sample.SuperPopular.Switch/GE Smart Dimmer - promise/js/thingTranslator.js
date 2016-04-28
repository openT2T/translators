'use strict';

var ZWave = require('openzwave-shared');
var os = require('os');
var Q = require('q');

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
var comport = null;

// module exports, implementing the schema
module.exports = {

    initDevice:function (dev) {
        var deferred = Q.defer();
        device = dev;

        if (typeof device != 'undefined') {
            if (typeof (device.props) !== 'undefined') {
                var props;
                try {
                    props = JSON.parse(device.props);
                } catch (ex) {
                    console.log("invalid address string: %s", props.id);
                    setImmediate(deferred.reject);
                    return deferred.promise;
                }

                homeId = props.id.homeId;
                nodeId = props.id.nodeId;

                var zwavedriverroot = {
                    "darwin": '/dev/',
                    "linux": '/dev/',
                    "win32": '\\\\.\\'
                }
                comport = zwavedriverroot[os.platform()] + props.serialPort;
                console.log("connecting to " + comport);
                
                zwave.on('scan complete', function() {
                    // fulfill the promise to indicate it is ready
                    console.log('scan complete');
                    deferred.resolve();
                });
                              
                zwave.connect(comport);
            } else {
                console.log('props is undefined');
                setImmediate(deferred.reject);
            }
        } else {
            console.log('device is undefined');
            setImmediate(deferred.reject);
        }
        return deferred.promise;
    },

    disconnect: function () {
        console.log('disconnect called.');
        var deferred = Q.defer();

        logDeviceState(device);

        zwave.disconnect(comport);
        setImmediate(deferred.resolve);

        return deferred.promise;
    },


    turnOn: function() {
        console.log("turnOn called.");
    	var deferred = Q.defer();

        // {node_id:nodeId,	class_id: 38,	instance:1,	index:0}
        if (nodeId !== 'undefined') {
            zwave.setValue(nodeId, 38, 1, 0, 99);
        	setImmediate(deferred.resolve);
        } else {
            console.log('undefined nodeId');
        	setImmediate(deferred.reject);
        }
        return deferred.promise;
    },

    turnOff: function() {
        console.log("turnOff called.");
    	var deferred = Q.defer();

        // {node_id:device.nodeId,	class_id: 38,	instance:1,	index:0}
        if (nodeId !== 'undefined') {
            zwave.setValue(nodeId, 38, 1, 0, 0);
        	setImmediate(deferred.resolve);
        } else {
            console.log('undefined nodeId');
        	setImmediate(deferred.reject);
        }
        return deferred.promise;
    },

    setBrightness: function(brightness) {
        console.log('setBrightness called with value: ' + brightness);
    	var deferred = Q.defer();

        // {node_id:device.nodeId,	class_id: 38,	instance:1,	index:0}
        if (nodeId !== 'undefined') {
            zwave.setValue(nodeId, 38, 1, 0, brightness);
        	setImmediate(deferred.resolve);
        } else {
            console.log('undefined nodeId');
        	setImmediate(deferred.reject);
        }
        return deferred.promise;
    }
};

// globals for JxCore host
global.initDevice = module.exports.initDevice;
global.turnOn = module.exports.turnOn;
global.turnOff = module.exports.turnOff;
global.setBrightness = module.exports.setBrightness;
global.disconnect = module.exports.disconnect;
