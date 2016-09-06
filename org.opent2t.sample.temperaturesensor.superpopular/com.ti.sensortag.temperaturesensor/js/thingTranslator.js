/* jshint esversion: 6 */
/* jshint node: true */
'use strict';
// helper library for interacting with this sensor
const SensorTag = require('sensortag');

// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

function validateArgumentType(arg, argName, expectedType) {
    if (typeof arg === 'undefined') {
        throw new Error('Missing argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + '.');
    } else if (typeof arg !== expectedType) {
        throw new Error('Invalid argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + ', got: ' + (typeof arg));
    }
}

var deviceId;
var sensorTag = null;

// This translator class implements the 'org.opent2t.sample.temperaturesensor.superpopular' schema.
class Translator {

    constructor(device) {
        console.log('Initializing device.');

        validateArgumentType(device, 'device', 'object');
        validateArgumentType(device.props, 'device.props', 'object');
        validateArgumentType(device.props.id, 'device.props.id', 'string');

        deviceId = device.props.id;
    }

    connect() {
        console.log('connect called.');
        return new Promise(function (resolve) {

            console.log('Starting SensorTag Discovery for ID: ' + deviceId);

            SensorTag.discoverById(deviceId, function (tag) {

                console.log('Discovered SensorTag');

                sensorTag = tag;
                sensorTag.connectAndSetup(function (conn_error) {

                    console.log('Connected to SensorTag');

                    if (conn_error != null) {
                        throw new Error(conn_error);
                    } else {
                        sensorTag.enableIrTemperature(function (enable_error) {

                            setTimeout(function () {
                                if (enable_error != null) {
                                    throw new Error(enable_error);
                                } else {
                                    resolve();
                                }
                            }, 1000);	// slight wait is neccessary for hardware to start up
                        });
                    }
                });
            });
        });
    }

    disconnect() {
        console.log('disconnect called.');

        return new Promise(function (resolve) {
            if (sensorTag) {
                sensorTag.disconnect(function (error) {
                    if (error != null) {
                        throw new Error(error);
                    } else {
                        console.log('disconnected');
                        resolve();
                    }
                });
            }
        });
    }

    // exports for the entire schema object

    // Queries the entire state of the sensor
    // and returns an object that maps to the json schema org.opent2t.sample.temperaturesensor.superpopular
    getTemperatureSensorResURI() {
        return new Promise(function (resolve) {

            if (!sensorTag) {
                throw new Error('No SensorTag found (Please check if SensorTag is awake?)');
            }

            sensorTag.readIrTemperature(function (temp_error, objectTemperature, ambient_temp) {
                if (temp_error != null) {
                    throw new Error(temp_error);
                } else {
                    resolve({
                        id: sensorTag.type + '-' + sensorTag.id,
                        rt: 'org.opent2t.sample.temperaturesensor.superpopular',
                        ambientTemperature: { temperature: ambient_temp, units: 'C' }
                    });
                }
            });
        });
    }

    // exports for individual properties

    getAmbientTemperature() {
        console.log('getAmbientTemperature called');

        return this.getTemperatureSensorResURI()
            .then(response => {
                return response.ambientTemperature.temperature;
            });
    }
}

// Export the translator from the module.
module.exports = Translator;
