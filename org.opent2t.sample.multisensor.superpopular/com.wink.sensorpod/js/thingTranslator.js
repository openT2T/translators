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

function createSensor(key, value, resourceType) {
    return {
        id: key,
        rt: resourceType || 'oic.r.sensor',
        value: value
    };
}

function createMotionSensor(key, value) {
    return createSensor(key, value, 'oic.r.sensor.motion');
}

function createContactSensor(key, value) {
    return createSensor(key, value, 'oic.r.sensor.contact');
}

function createTemperature(key, value) {
    return {
        id: key,
        rt: 'oic.r.temperature',
        temperature: value,
        units: "C"
    };
}

function createHumidity(key, value) {
    return {
        id: key,
        rt: 'oic.r.humidity',
        humidity: scaleDeviceHumidityToTranslatorHumidity(value)
    };
}

function readSensorsArray(stateReader) {
    var sensors = [];

    var winkSensors = {
        'motion': createMotionSensor,
        'opened': createContactSensor,
        'temperature': createTemperature,
        'humidity': createHumidity,
        'brightness': createSensor,
        'loudness': createSensor,
        'vibration': createSensor,
        'locked': createSensor,
        'liquid_detected': createSensor,
        'occupied': createSensor
    };

    Object.keys(winkSensors).forEach(key => {
        if (stateReader.containsKey(key)) {
            var sensor = winkSensors[key](key, stateReader.get(key));
            sensors.push(sensor);
        }
    });

    return sensors;
}

// Helper method to convert the device schema to the translator schema.
function deviceSchemaToTranslatorSchema(deviceSchema) {

    var stateReader = new StateReader(deviceSchema.desired_state, deviceSchema.last_reading);

    return {
        id: deviceSchema['object_type'] + '.' + deviceSchema['object_id'],
        n: deviceSchema['name'],
        rt: 'org.opent2t.sample.multisensor.superpopular',
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

// This translator class implements the 'org.opent2t.sample.multisensor.superpopular' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('Wink Sensor Pod initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
        
        deviceId = deviceInfo.deviceInfo.id;
        winkHub = deviceInfo.hub;

        console.log('Wink Sensor Pod initializing...Done');
    }

    // exports for the entire schema object

    // Queries the entire state of the multisensor
    // and returns an object that maps to the json schema org.opent2t.sample.multisensor.superpopular
    getMultisensorResURI() {
        return winkHub.getDeviceDetailsAsync(deviceType, deviceId)
            .then((response) => {
                return deviceSchemaToTranslatorSchema(response.data);
            });
    }

    // Updates the current state of the multisensor with the contents of postPayload
    // postPayload is an object that maps to the json schema org.opent2t.sample.multisensor.superpopular
    //
    // For a multisensor, this should only be used to update the name field
    //
    // In addition, returns the updated state (see sample in RAML)
    postMultisensorResURI(postPayload) {

        console.log('postMultisensorResURI called with payload: ' + JSON.stringify(postPayload, null, 2));

        var putPayload = translatorSchemaToDeviceSchema(postPayload);
        return winkHub.putDeviceDetailsAsync(deviceType, deviceId, putPayload)
            .then((response) => {
                return deviceSchemaToTranslatorSchema(response.data);
            });
    }
}

// Export the translator from the module.
module.exports = Translator;