'use strict';

var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;

var crypto = require('crypto');

// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

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

    if (!entity) {
        throw new OpenT2TError(404, 'Entity - '+ di +' not found.');
    }

    var resource = entity.resources.find((r) => {
        return r.id === resourceId;
    });

    if (!resource) {
        throw new OpenT2TError(404, 'Resource with resourceId \"' +  resourceId + '\" not found.');
    }
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
 * Returns a default value if the specified property is null, undefined, or an empty string
 */
function defaultValueIfEmpty(property, defaultValue) {
    if (property === undefined || property === null || property === "") {
        return defaultValue;
    } else {
        return property;
    }
}

// Helper method to convert the provider schema to the platform schema.
function providerSchemaToPlatformSchema(providerSchema, expand) {

    var power = {
        href: '/power',
        rt: ['oic.r.switch.binary'],
        if: ['oic.if.a', 'oic.if.baseline']
    };
    
    if (expand) {
        power.id = 'power';
        power.value = providerSchema['Power'] === 'on';
    }

    return {
        opent2t: {
            schema: 'org.opent2t.sample.binaryswitch.superpopular',
            translator: 'opent2t-translator-com-insteon-binaryswitch',
            controlId: providerSchema['DeviceID']
        },
        pi: generateGUID(providerSchema['DeviceID']),
        mnmn: defaultValueIfEmpty(providerSchema['device_manufacturer'], "Insteon"),
        mnmo: defaultValueIfEmpty(providerSchema['manufacturer_device_model'], "Binary Switch (Generic)"),
        n: providerSchema['DeviceName'],
        rt: ['org.opent2t.sample.binaryswitch.superpopular'],
        entities: [
            {
                n: providerSchema['DeviceName'],
                icv: "core.1.1.0",
                dmv: "res.1.1.0",
                rt: ['oic.d.smartplug'],
                di: switchDeviceDi,
                resources: [
                    power
                ]
            }
        ]
    };
}

// Helper method to convert the translator schema to the device schema.
function resourceSchemaToProviderSchema(resourceId, resourceSchema) {

    // build the object with desired state
    var result = {};
    switch (resourceId) {
        case 'power':
            result['command'] = resourceSchema.value ? 'on' : 'off';
            break;
        case 'n':
            result['DeviceName'] = resourceSchema.n;
            break;
        default:
            // Error case
            throw new OpenT2TError(400, OpenT2TConstants.InvalidResourceId);
    }
    return result;
}

const switchDeviceDi = "f9604075-1a64-498b-ae9b-7436a63721ba";

// This translator class implements the 'org.opent2t.sample.binaryswitch.superpopular' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('Insteon Binary Switch initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
        
        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.insteonHub = deviceInfo.hub;

        console.log('Insteon Binary Switch initializing...Done');
    }

    /**
     * Queries the entire state of the binary switch
     * and returns an object that maps to the json schema org.opent2t.sample.binaryswitch.superpopular
     */
    get(expand, payload) {
        if (payload) {
            return  providerSchemaToPlatformSchema(payload, expand);
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
        if (di === switchDeviceDi) {
            var putPayload = resourceSchemaToProviderSchema(resourceId, payload);

            return this.insteonHub.putDeviceDetailsAsync(this.controlId, putPayload)
                .then((response) => {
                    var schema = providerSchemaToPlatformSchema(response, true);
                    return findResource(schema, di, resourceId);
                });
        } else {
            throw new OpenT2TError(404, OpenT2TConstants.DeviceNotFound);
        }
    }

    getDevicesPower(di) {
        return this.getDeviceResource(di, 'power');
    }

    postDevicesPower(di, payload) {
        return this.postDeviceResource(di, 'power', payload);
    }

    postSubscribe(subscriptionInfo) {
        return this.insteonHub._subscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        return this.insteonHub._unsubscribe(subscriptionInfo);
    }
}

// Export the translator from the module.
module.exports = Translator;
