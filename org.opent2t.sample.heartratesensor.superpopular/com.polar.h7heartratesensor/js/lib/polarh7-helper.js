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
            if (peripheral.id == sensorId) {
                console.log('Found sensor');
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

        if (services.length != 1) {
            console.log('Unexpected number of services found: ' + services.length);
            callback(null);
            return;
        }
        
        console.log('service found');
        services[0].discoverCharacteristics(['2a37'], function(error, characteristics) {
            
            if (characteristics.length != 1) {
                console.log('Unexpected number of services found: ' + services.length);
                callback(null);
                return;
            }
            
            console.log('characteristic found');
            characteristics[0].notify(true);
            characteristics[0].on('read', function(value, isNotification) {
                
                // all done
                var rate = value.readUInt8(1);                
                callback(rate);
            });
        });
    });
};

module.exports['PolarH7'] = PolarH7;