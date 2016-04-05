// Helper library for interacting with this lamp
'use strict';

var noble = require('noble');

var PAIR_KEY_HANDLE = 0x0027;

function LEDBlue(peripheral) {
    this._peripheral = peripheral;
    this._command = null;
}

LEDBlue.getBulb = function(bulbId, callback) {
    noble.on('stateChange', function() {
        noble.on('discover', function(peripheral) {
            if (peripheral.id == bulbId) {
                noble.stopScanning();
                var bulb = new LEDBlue(peripheral);
                callback(bulb);
            }
        });

        if (noble.state === 'poweredOn') {
            noble.startScanning();
        }
    });
};

LEDBlue.prototype.disconnect = function(callback) {
    this._peripheral.disconnect(callback);
};

LEDBlue.prototype.pair = function(key, callback) {
    this._peripheral.writeHandle(PAIR_KEY_HANDLE, new Buffer([key]), true, callback);
};

LEDBlue.prototype.connect = function(callback) {
    this._peripheral.connect(callback);
};

LEDBlue.prototype.setColor = function(R, G, B, callback) {
    this._peripheral.discoverServices(['ffe5'], function(error, services) {
        services[0].discoverCharacteristics(['ffe9'], function(error, characteristics) {
            characteristics[0].write(new Buffer([0x56, R, G, B, 0x00, 0xF0, 0xAA]), true, callback);
        });
    });
};

LEDBlue.prototype.turnOn = function(callback) {
    this._peripheral.discoverServices(['ffe5'], function(error, services) {
        services[0].discoverCharacteristics(['ffe9'], function(error, characteristics) {
            characteristics[0].write(new Buffer([0xcc, 0x23, 0x33]), true, callback);
        });
    });

};

LEDBlue.prototype.turnOff = function(callback) {
    this._peripheral.discoverServices(['ffe5'], function(error, services) {
        services[0].discoverCharacteristics(['ffe9'], function(error, characteristics) {
            characteristics[0].write(new Buffer([0xcc, 0x24, 0x33]), true, callback);
        });
    });
};

module.exports['LEDBlue'] = LEDBlue;