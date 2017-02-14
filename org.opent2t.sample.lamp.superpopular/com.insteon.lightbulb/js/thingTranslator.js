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
 * Finds a resource for an entity in a schema
 */
function findResource(schema, di, resourceId) {
    // Find the entity by the unique di
    var entity = schema.entities.find((d) => {
        return d.di === di;
    });

    if (!entity) {
        throw new Error('Entity - '+ di +' not found.');
    }

    var resource = entity.resources.find((r) => {
        return r.id === resourceId;
    });

    if (!resource) throw new Error('Resource with resourceId \"' +  resourceId + '\" not found.');
    return resource;
}

/**
 * Generate a GUID for a given ID.
 */
function generateGUID(stringID) {
    var guid = crypto.createHash('sha1').update('Insteon' + stringID).digest('hex');
    return guid.substr(0, 8) + '-' + guid.substr(8, 4) + '-' + guid.substr(12, 4) + '-' + guid.substr(16, 4) + '-' + guid.substr(20, 12);
}

/**
 * Converts a representation of a platform from the Insteon API into an OCF representation.
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
    if (expand) {
        power.id = 'power';
        power.value = providerSchema['Power'] === 'on';

        dim.id = 'dim';
        dim.dimmingSetting = providerSchema['Level'];
        dim.range = [0, 100];
    }

    return {
        opent2t: {
            schema: 'org.opent2t.sample.lamp.superpopular',
            translator: 'opent2t-translator-com-insteon-lightbulb',
            controlId: providerSchema['DeviceID']
        },
        pi: generateGUID(providerSchema['DeviceID']),
        mnmn: 'Undefined',
        mnmo: 'Undefined',
        n: providerSchema['DeviceName'],
        rt: ['org.opent2t.sample.lamp.superpopular'],
        entities: [
            {
                rt: ['opent2t.d.light'],
                di: lightbulbDeviceDi,
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

/***
 * Converts an OCF platform/resource schema for calls to the Insteon API
 */
function resourceSchemaToProviderSchema(resourceId, resourceSchema) {

    // build the object with desired state
    var result = {};
    switch (resourceId) {
        case 'power':
            result['command'] = resourceSchema.value ? 'on' : 'off';
            break;
        case 'dim':
            result['command'] = resourceSchema.dimmingSetting > 0 ? 'on' : 'off';
            result['level'] = resourceSchema.dimmingSetting;
            break;
        case 'n':
            result['DeviceName'] = resourceSchema.n;
            break;
        default:
            // Error case
            throw new Error("Invalid resourceId");
    }
    return result;
}

const lightbulbDeviceDi = "882b5bb8-5522-4c77-b09a-e761842eb1e2";

// This translator class implements the 'org.opent2t.sample.lamp.superpopular' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('Insteon Lightbulb initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");

        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.insteonHub = deviceInfo.hub;

        console.log('Insteon Lightbulb initializing...Done');
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
            return this.insteonHub.getDeviceDetailsAsync(this.controlId)
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
        if (di === lightbulbDeviceDi) {
            var putPayload = resourceSchemaToProviderSchema(resourceId, payload);

            return this.insteonHub.putDeviceDetailsAsync(this.controlId, putPayload)
                .then((response) => {
                    var schema = providerSchemaToPlatformSchema(response, true);
                    return findResource(schema, di, resourceId);
                });
        }
    }

    // exports for individual properties

    getDevicesPower(di) {
        return this.getDeviceResource(di, "power");
    }

    postDevicesPower(di, payload) {
        return this.postDeviceResource(di, "power", payload)
    }

    getDevicesColourMode(di) {
        return this.getDeviceResource(di, "colourMode");
    }

    getDevicesColourRGB(di) {
        return this.getDeviceResource(di, "colourRgb");
    }

    postDevicesColourRGB(di, payload) {
        return this.postDeviceResource(di, "colourRgb", payload);
    }

    getDevicesDim(di) {
        return this.getDeviceResource(di, "dim");
    }

    postDevicesDim(di, payload) {
        return this.postDeviceResource(di, "dim", payload);
    }

    getDevicesColourChroma(di) {
        return this.getDeviceResource(di, "colourChroma");
    }

    postDevicesColourChroma(di, payload) {
        return this.postDeviceResource(di, "colourChroma", payload);
    }

    postSubscribe(subscriptionInfo) {
        return this.insteonHub.postSubscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        return this.insteonHub._unsubscribe(subscriptionInfo);
    }
}

// Export the translator from the module.
module.exports = Translator;