'use strict';
var crypto = require('crypto');

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

/**
 * Return the string "Undefined" if the value is undefined and null.
 * Otherwise, return the value itself.
 */
function validateValue(value) {
    if (value === undefined || value === null) {
        return 'Undefined';
    }
    return value;
}

/**
 * Finds a resource for an entity in a schema
 */
function findResource(schema, di, resourceId) {
    // Find the entity by the unique di
    var expectedDI = generateGUID(di);          //TODO: check expected device ID value.
    var entity = schema.entities.find((d) => {
        return d.di === expectedDI;
    });

    // Find the resource
    var resource = entity.resources.find((r) => {
        return r.id === resourceId;
    });

    return resource;
}

/**
 * Generate a GUID for given an ID.
 */
function generateGUID(stringID) {
    var guid = crypto.createHash('md5').update('PhilipsHue.' + stringID).digest('hex');
    return guid.substr(0, 8) + '-' + guid.substr(8, 4) + '-' + guid.substr(12, 4) + '-' + guid.substr(16, 4) + '-' + guid.substr(20, 12);
}

/**
 * Converts a representation of a platform from the Hue API into an OCF representation.
 */
function providerSchemaToPlatformSchema(providerSchema, expand) {

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
    if (expand && providerSchema.state !== undefined) {
        power.id = 'power';
        power.value = providerSchema.state['on'];

        dim.id = 'dim';
        dim.dimmingSetting = Math.round((providerSchema.state['bri'] - 1) * 100 / 253);
        dim.range = [0, 100];
    }

    var guid = generateGUID(providerSchema['deviceid']);

    return {
        opent2t: {
            schema: 'org.opent2t.sample.lamp.superpopular',
            translator: 'opent2t-translator-com-hue-bulb',
            controlId: providerSchema['deviceid']
        },
        pi: guid,
        mnmn: validateValue(providerSchema['manufacturername']),
        mnmo: validateValue(providerSchema['modelid']),
        n:    validateValue(providerSchema['name']),
        rt: ['org.opent2t.sample.lamp.superpopular'],
        entities: [
            {
                rt: ['opent2t.d.light'],
                di: guid,
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

/*
 * Converts an OCF platform/resource schema for calls to the Hue API
 */
function resourceSchemaToProviderSchema(resourceId, resourceSchema) {

    // build the object with desired state
    var result = {};

    switch (resourceId) {
        case 'n':
            result['name'] = resourceSchema.n;
            break;
        case 'power':
            result['on'] = resourceSchema.value;
            break;
        case 'dim':
            var bri = Math.round((resourceSchema.dimmingSetting * 2.53) + 1);
            result['bri'] = bri;
            break;
        default:
            // Error case
            throw new Error("Invalid resourceId");
    }
    return result;
}

var controlId;
var deviceType = 'lights';
var hueHub;

// This translator class implements the 'org.opent2t.sample.lamp.superpopular' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('Hue Lightbulb initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");

        controlId = deviceInfo.deviceInfo.opent2t.controlId;
        hueHub = deviceInfo.hub;

        console.log('Hue Lightbulb initializing...Done');
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
            return hueHub.getDeviceDetailsAsync(deviceType, controlId)
                .then((response) => {
                    return providerSchemaToPlatformSchema(response, expand);
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
        //TODO: check di
        var putPayload = resourceSchemaToProviderSchema(resourceId, payload);
        return hueHub.putDeviceDetailsAsync(deviceType, controlId, putPayload)
            .then((response) => {
                var schema = providerSchemaToPlatformSchema(response[0], true);
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
}

// Export the translator from the module.
module.exports = Translator;