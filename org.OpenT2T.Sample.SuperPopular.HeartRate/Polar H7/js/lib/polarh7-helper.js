// Helper library for interacting with this heart rate sensor
'use strict';

var noble = require('noble');

var PAIR_KEY_HANDLE = 0x0027;

function PolarH7(peripheral) {
    this._peripheral = peripheral;
    this._command = null;
}

PolarH7.getSensor = function(sensorId, callback) {
    noble.on('stateChange', function() {
        noble.on('discover', function(peripheral) {
            console.log("discoverCallback: " + peripheral);
            if (peripheral.id == sensorId) {
                console.log("discoverCallback: found");
                noble.stopScanning();
                var sensor = new PolarH7(peripheral);
                callback(sensor);
            }
        });

        if (noble.state === 'poweredOn') {
            noble.startScanning();
        }
    });
};

PolarH7.prototype.disconnect = function(callback) {
    this._peripheral.disconnect(callback);
};

PolarH7.prototype.pair = function(key, callback) {
    this._peripheral.writeHandle(PAIR_KEY_HANDLE, new Buffer([key]), true, callback);
};

PolarH7.prototype.connect = function(callback) {
    this._peripheral.connect(callback);
};

PolarH7.prototype.getBeatsPerMinute = function(callback) {
    this._peripheral.discoverServices(['180d'], function(error, services) {
        services[0].discoverCharacteristics(['2a37'], function(error, characteristics) {
            characteristics[0].notify(true , [callback(1234)]);
        });
    });
};

module.exports['PolarH7'] = PolarH7;