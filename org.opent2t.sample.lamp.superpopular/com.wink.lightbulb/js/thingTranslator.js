'use strict';
var OpenT2TError = require('opent2t').OpenT2TError;

// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

/**
 * Validates an argument matches the expected type.
 */
function validateArgumentType(arg, argName, expectedType) {
    if (typeof arg === 'undefined') {
        throw new OpenT2TError(400, 'Missing argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + '.');
    } else if (typeof arg !== expectedType) {
        throw new OpenT2TError(400, 'Invalid argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + ', got: ' + (typeof arg));
    }
}

/**
 * Finds a resource for an entity in a schema
 */
function findResource(schema, di, resourceId) {
    // Find the entity by the unique di 
    var entity = schema.entities.find((d) => {
        return d.di === di;
    });

    if (!entity) throw new Error('Entity - ' + di + ' not found.');

    var resource = entity.resources.find((r) => {
        return r.id === resourceId;
    });

    if (!resource) throw new Error('Resource with resourceId \"' + resourceId + '\" not found.');
    return resource;
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
        case 'colourMode':
        case 'colourRgb':
        case 'colourChroma':
            throw new Error('NotImplemented');
        default:
            // Error case
            throw new OpenT2TError(400, "Invalid resourceId");
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

function validateResourceGet(resourceId) {
    switch (resourceId) {
        case 'colourMode':
        case 'colourRgb':
        case 'colourChroma':
            throw new Error('NotImplemented');
    }
}

// Each device in the platform has is own unique static identifier
const lightDeviceDi = 'F8CFB903-58BB-4753-97E0-72BD7DBC7933';

// This translator class implements the 'org.opent2t.sample.lamp.superpopular' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('Wink Lightbulb initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
       
        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.winkHub = deviceInfo.hub;
        this.deviceType = 'light_bulbs';

        console.log('Wink Lightbulb initializing...Done');
    }

    /**
     * Queries the entire state of the lamp
     * and returns an object that maps to the json schema org.opent2t.sample.lamp.superpopular
     */
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        }
        else {
            return this.winkHub.getDeviceDetailsAsync(this.deviceType, this.controlId)
                .then((response) => {
                    return providerSchemaToPlatformSchema(response.data, expand);
                });
        }
    }

    /**
     * Finds a resource on a platform by the id
     */
    getDeviceResource(di, resourceId) {
        validateResourceGet(resourceId);

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

        return this.winkHub.putDeviceDetailsAsync(this.deviceType, this.controlId, putPayload)
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

    postSubscribe(subscriptionInfo) {
        subscriptionInfo.deviceId = this.controlId;
        subscriptionInfo.deviceType = this.deviceType;
        return this.winkHub.postSubscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        subscriptionInfo.deviceId = this.controlId;
        subscriptionInfo.deviceType = this.deviceType;
        return this.winkHub._unsubscribe(subscriptionInfo);
    }
}

// Export the translator from the module.
module.exports = Translator;