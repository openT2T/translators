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

// Wink does not always populate every desired_state property, but last_reading doesn't necessarily
// update as soon as we send our PUT request. Instead of relying just on one state or the other,
// we use this StateReader class to read from desired_state if it is there, and fall back to last_reading
// if it is not.
class StateReader {
    constructor(desired_state, last_reading) {
        this.desired_state = desired_state;
        this.last_reading = last_reading;
    }

    get(state) {
        if (this.desired_state[state] !== undefined) {
            return this.desired_state[state];
        }
        else {
            return this.last_reading[state];
        }
    }

    containsKey(state) {
        return (state in this.desired_state ||
                state in this.last_reading); 
    }
}

// Helper method to convert Wink's 0.0-1.0 humidity scale to a 0-100 scale
function scaleDeviceHumidityToTranslatorHumidity(humidity) {
    return Math.floor(humidity * 100);
}

function readSensorsArray(stateReader) {
    var sensors = [];

    if (stateReader.containsKey('motion')) {
        sensors.push({
            id: 'motion',
            rt: 'oic.r.sensor.motion',
            value: stateReader.get('motion')
        });
    }

    if (stateReader.containsKey('opened')) {
        sensors.push({
            id: 'opened',
            rt: 'oic.r.sensor.contact',
            value: stateReader.get('opened')
        });
    }

    if (stateReader.containsKey('temperature')) {
        sensors.push({
            id: 'temperature',
            rt: 'oic.r.temperature',
            temperature: stateReader.get('temperature'),
            units: "C"
        });
    }

    if (stateReader.containsKey('humidity')) {
        sensors.push({
            id: 'humidity',
            rt: 'oic.r.humidity',
            humidity: scaleDeviceHumidityToTranslatorHumidity(stateReader.get('humidity'))
        });
    }

    if (stateReader.containsKey('brightness')) {
        sensors.push({
            id: 'brightness',
            rt: 'oic.r.sensor',
            value: stateReader.get('brightness')
        });
    }

    if (stateReader.containsKey('loudness')) {
        sensors.push({
            id: 'loudness',
            rt: 'oic.r.sensor',
            value: stateReader.get('loudness')
        });
    }

    if (stateReader.containsKey('vibration')) {
        sensors.push({
            id: 'loudness',
            rt: 'oic.r.sensor',
            value: stateReader.get('vibration')
        });
    }

    if (stateReader.containsKey('locked')) {
        sensors.push({
            id: 'locked',
            rt: 'oic.r.sensor',
            value: stateReader.get('locked')
        });
    }

    if (stateReader.containsKey('liquid_detected')) {
        sensors.push({
            id: 'liquidDetected',
            rt: 'oic.r.sensor',
            value: stateReader.get('liquid_detected')
        });
    }

    if (stateReader.containsKey('occupied')) {
        sensors.push({
            id: 'occupied',
            rt: 'oic.r.sensor',
            value: stateReader.get('occupied')
        });
    }

    return sensors;
}

// Helper method to convert the device schema to the translator schema.
function deviceSchemaToTranslatorSchema(deviceSchema) {

    var stateReader = new StateReader(deviceSchema.desired_state, deviceSchema.last_reading);

    return {
        id: deviceSchema['object_type'] + '.' + deviceSchema['object_id'],
        n: deviceSchema['name'],
        rt: 'org.opent2t.sample.sensorpod.superpopular',
        sensors: readSensorsArray(stateReader)
    };
}

// Helper method to convert the translator schema to the device schema.
function translatorSchemaToDeviceSchema(translatorSchema) {

    // build the object with desired state
    var result = { 'desired_state': {} };

    if (translatorSchema.n) {
        result['name'] = translatorSchema.n;
    }

    return result;
}

var deviceId;
var deviceType = 'sensor_pods';
var winkHub;

// This translator class implements the 'org.opent2t.sample.sensorpod.superpopular' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('Wink Sensor Pod initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
        
        deviceId = deviceInfo.deviceInfo.id;
        winkHub = deviceInfo.hub;

        console.log('Wink Sensor Pod initializing...Done');
    }

    // exports for the entire schema object

    // Queries the entire state of the sensorpod
    // and returns an object that maps to the json schema org.opent2t.sample.sensorpod.superpopular
    getSensorpodResURI() {
        return winkHub.getDeviceDetailsAsync(deviceType, deviceId)
            .then((response) => {
                return deviceSchemaToTranslatorSchema(response.data);
            });
    }

    // Updates the current state of the sensorpod with the contents of postPayload
    // postPayload is an object that maps to the json schema org.opent2t.sample.sensorpod.superpopular
    //
    // In addition, returns the updated state (see sample in RAML)
    postSensorpodResURI(postPayload) {

        console.log('postSensorpodResURI called with payload: ' + JSON.stringify(postPayload, null, 2));

        var putPayload = translatorSchemaToDeviceSchema(postPayload);
        return winkHub.putDeviceDetailsAsync(deviceType, deviceId, putPayload)
            .then((response) => {
                return deviceSchemaToTranslatorSchema(response.data);
            });
    }
}

// Export the translator from the module.
module.exports = Translator;