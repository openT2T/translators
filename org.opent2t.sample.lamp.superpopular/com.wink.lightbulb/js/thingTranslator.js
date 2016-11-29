/* jshint esversion: 6 */
/* jshint node: true */
'use strict';

// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

/**
 * Validates an argument matches the expected type.
 */
function validateArgumentType(arg, argName, expectedType) {
    if (typeof arg === 'undefined') {
        throw new Error('Missing argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + '.');
    } else if (typeof arg !== expectedType) {
        throw new Error('Invalid argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + ', got: ' + (typeof arg));
    }
}

/**
 * Wink does not always populate every desired_state property, but last_reading doesn't necessarily
 * update as soon as we send our PUT request. Instead of relying just on one state or the other,
 * we use this StateReader class to read from desired_state if it is there, and fall back to last_reading
 * if it is not.
 */
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
}

/**
 * Helper method to convert Wink's 0.0-1.0 brightness scale to a 0-100 scale  
 */ 
function scaleDeviceBrightnessToTranslatorBrightness(brightnessValue) {
    return Math.floor(brightnessValue * 100);
}

/**
 * Helper method to convert a 0-100 scale to Wink's 0.0-1.0 brightness scale
 */
function scaleTranslatorBrightnessToDeviceBrightness(dimmingValue) {
    return dimmingValue / 100;
}

/**
 * Finds a resource for an entity in a schema
 */
function findResource(schema, di, resourceId) {
    // Find the entity by the unique di
    var entity = schema.entities.find((d) => {
        return d.di === di;
    });

    // Find the resource
    var resource = entity.resources.find((r) => {
        return r.id === resourceId;
    });

    return resource;
}

/***
 * Converts an OCF platform/resource schema for calls to the Wink API
 */
function resourceSchemaToProviderSchema(resourceId, resourceSchema) {
    // build the object with desired state
    var result = { 'desired_state': {} };
    var desired_state = result.desired_state;

    switch(resourceId) {
        case 'power':
            desired_state['powered'] = resourceSchema.value;
            break;
        case 'dim':
            desired_state['brightness'] = scaleTranslatorBrightnessToDeviceBrightness(resourceSchema.dimmingSetting);
            break;
        default:
            // Error case
            throw new Error("Invalid resourceId");
    }

    return result;
}

/**
 * Converts a representation of a platform from the Wink API into an OCF representation.
 */
function providerSchemaToPlatformSchema(providerSchema, expand) {
    var stateReader = new StateReader(providerSchema.desired_state, providerSchema.last_reading);

    // Build the oic.r.switch.binary resource
    var power = {
        "href": "/power",
        "rt": ["oic.r.switch.binary"],
        "if": ["oic.if.a", "oic.if.baseline"]
    }

    // Build the oic.r.dimming resource
    var dim = {
         "href": "/dim",
         "rt": ["oic.r.light.dimming"],
         "if": ["oic.if.a", "oic.if.baseline"]
    }

    // Include the values is expand is specified
    if (expand) {
        power.id = 'power';
        power.value = stateReader.get('powered');

        dim.id = 'dim';
        dim.dimmingSetting = scaleDeviceBrightnessToTranslatorBrightness(stateReader.get('brightness'));
        dim.range = [0,100];
    }

    return {
        opent2t: {
            schema: 'org.opent2t.sample.lamp.superpopular',
            translator: 'opent2t-translator-com-wink-lightbulb',
            controlId: providerSchema['object_id']
        },
        pi: providerSchema['uuid'],
        mnmn: providerSchema['device_manufacturer'],
        mnmo: providerSchema['manufacturer_device_model'],
        n: providerSchema['name'],
        rt: ['org.opent2t.sample.lamp.superpopular'],
        entities: [
            {
                rt: ['opent2t.d.light'],
                di: lightDeviceDi,
                icv: 'core.1.1.0',
                dmv: 'res.1.1.0',
                resources: [
                    power,
                    dim
                ]
            }
        ]
    };
}

var deviceId;
var deviceType = 'light_bulbs';
var winkHub;

// Each device in the platform has is own unique static identifier
const lightDeviceDi = 'F8CFB903-58BB-4753-97E0-72BD7DBC7933';

// This translator class implements the 'org.opent2t.sample.lamp.superpopular' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('Wink Lightbulb initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
       
        deviceId = deviceInfo.deviceInfo.opent2t.controlId;
        winkHub = deviceInfo.hub;

        console.log('Wink Lightbulb initializing...Done');
    }

    // exports for the entire schema object

    /**
     * Queries the entire state of the lamp
     * and returns an object that maps to the json schema org.opent2t.sample.lamp.superpopular
     */
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        }
        else {
            return winkHub.getDeviceDetailsAsync(deviceType, deviceId)
                .then((response) => {
                    return providerSchemaToPlatformSchema(response.data, expand);
                });
        }
    }

    /**
     * Finds a resource on a platform by the id
     */
    getDeviceResource(di, resourceId) {
        return this.get(true)
            .then(response => {
                return findResource(response, di, resourceId);
        });
    }

    /**
     * Updates the specified resource with the provided payload.
     */
    postDeviceResource(di, resourceId, payload) {
        var putPayload = resourceSchemaToProviderSchema(resourceId, payload);

        return winkHub.putDeviceDetailsAsync(deviceType, deviceId, putPayload)
            .then((response) => {
                var schema = providerSchemaToPlatformSchema(response.data, true);

                return findResource(schema, di, resourceId);
            });
    }

    getDevicesPower(deviceId) {
        return this.getDeviceResource(deviceId, "power");
    }

    postDevicesPower(deviceId, payload) {
        return this.postDeviceResource(deviceId, "power", payload)
    }

    getDevicesColourMode(deviceId) {
        return this.getDeviceResource(deviceId, "colourMode");
    }

    getDevicesColourRGB(deviceId) {
        return this.getDeviceResource(deviceId, "colourRgb");
    }

    postDevicesColourRGB(deviceId, payload) {
        return this.postDeviceResource(deviceId, "colourRgb", payload);
    }

    getDevicesDim(deviceId) {
        return this.getDeviceResource(deviceId, "dim");
    }

    postDevicesDim(deviceId, payload) {
        return this.postDeviceResource(deviceId, "dim", payload);
    }

    getDevicesColourChroma(deviceId) {
        return this.getDeviceResource(deviceId, "colourChroma");
    }

    postDevicesColourChroma(deviceId, payload) {
        return this.postDeviceResource(deviceId, "colourChroma", payload);
    }

    postSubscribe(callbackUrl, verificationRequest) {
        return winkHub._subscribe(deviceType, deviceId, callbackUrl, verificationRequest);
    }

    deleteSubscribe(callbackUrl) {
        return winkHub._unsubscribe(deviceType, deviceId, callbackUrl);
    }
}

// Export the translator from the module.
module.exports = Translator;