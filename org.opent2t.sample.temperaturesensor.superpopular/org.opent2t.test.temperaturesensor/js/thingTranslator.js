/* jshint esversion: 6 */
/* jshint node: true */
'use strict';

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

// generate random test temperature data
function generateTestData() {
    // random int value in [0, 43] range
    var randomTemperature = Math.floor(0 + Math.random() * 43);

    return {
        id: 'some_test_id',
        rt: 'org.opent2t.sample.temperaturesensor.superpopular',
        ambientTemperature: { temperature: randomTemperature, units: 'C' }
    }
}

// This translator class implements the 'org.opent2t.sample.temperaturesensor.superpopular' schema.
class Translator {

    constructor(device) {
        console.log('Initializing device.');

        validateArgumentType(device, 'device', 'object');
        validateArgumentType(device.props, 'device.props', 'object');
        validateArgumentType(device.props.token, 'device.props.token', 'string');

        console.log('Javascript initialized.');
    }

    // exports for the entire schema object

    // Queries the entire state of the sensor
    // and returns an object that maps to the json schema org.opent2t.sample.temperaturesensor.superpopular
    getTemperatureSensorResURI() {
        return Promise.resolve(generateTestData());
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
