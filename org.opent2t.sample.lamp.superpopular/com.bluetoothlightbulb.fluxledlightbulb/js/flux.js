
'use strict';
const noble = require('noble');
const PAIR_KEY_HANDLE = 0x0027; // Magic number unique to this hardware

var bluetoothDevice;

// Helper class for interacting with the Flux LED lamp via noble
// See https://github.com/sandeepmistry/noble for more information
class Flux {

    static discover(id) {
        return new Promise(function (resolve, reject) {
            noble.on('stateChange', function () {
                noble.on('discover', function (foundBluetoothDevice) {
                    if (foundBluetoothDevice.id === id) {
                        noble.stopScanning();
                        var foundBulb = new Flux(foundBluetoothDevice);
                        resolve(foundBulb);
                    }
                });

                if (noble.state === 'poweredOn') {
                    noble.startScanning();
                }
            });
        });
    }

    constructor(device) {
        bluetoothDevice = device;
    }

    connect() {
        return new Promise(function (resolve, reject) {
            bluetoothDevice.connect(function (error) {
                if (!!error) {
                    throw new Error(error);
                } else {
                    resolve();
                }
            });
        });
    }

    disconnect() {
        return new Promise(function (resolve, reject) {
            bluetoothDevice.disconnect(function (error) {
                if (!!error) {
                    throw new Error(error);
                } else {
                    resolve();
                }
            });
        });
    }

    pair(key) {
        return new Promise(function (resolve, reject) {
            bluetoothDevice.writeHandle(PAIR_KEY_HANDLE, new Buffer([key]), true, function (error) {
                if (!!error) {
                    throw new Error(error);
                } else {
                    resolve();
                }
            });
        });
    }

    discoverCharecteristic(serviceId, characteristicId) {
        return new Promise(function (resolve, reject) {
            // first, discover the appropriate service (via magic number unique to this hardware)
            bluetoothDevice.discoverServices([serviceId], function (error, services) {

                if (!!error) {
                    throw new Error(error);
                } else {
                    // next, discover the appropriate characteristic (via magic number unique to this hardware)
                    services[0].discoverCharacteristics([characteristicId], function (error, characteristics) {
                        if (!!error) {
                            throw new Error(error);
                        } else {
                            // return the first matching characteristic
                            resolve(characteristics[0]);
                        }
                    });
                }
            });
        });
    }

    setColor(R, G, B) {
        // discover the color characterstic for this bulb, using magic numbers unique to this hardware
        return this.discoverCharecteristic('ffe5', 'ffe9').then(characteristic => {
            return new Promise(function (resolve, reject) {
                // write the required characteristic to set the value we need
                characteristic.write(new Buffer([0x56, R, G, B, 0x00, 0xF0, 0xAA]), true, function (error) {
                    if (!!error) {
                        throw new Error(error);
                    } else {
                        resolve();
                    }
                });
            });
        });
    }

    setPowerState(state) {
        // discover the power state characterstic for this bulb, using magic numbers unique to this hardware
        return this.discoverCharecteristic('ffe5', 'ffe9').then(characteristic => {
            return new Promise(function (resolve, reject) {
                // pick the right command (on or off) to send to the bulb
                var powerStateCommand = state ? 0x23 : 0x24;

                characteristic.write(new Buffer([0xcc, powerStateCommand, 0x33]), true, function (error) {
                    if (!!error) {
                        throw new Error(error);
                    } else {
                        resolve();
                    }
                });
            });
        });
    }
}

module.exports = Flux;