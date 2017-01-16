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
        throw new Error('NotFound');
    }

    var resource = entity.resources.find((r) => {
        return r.id === resourceId;
    });

    if (!resource) throw new Error('NotFound');
    return resource;
}

/**
 * Generate a GUID for given an ID.
 */
function generateGUID(stringID) {
    var guid = crypto.createHash('sha1').update('Insteon' + stringID).digest('hex');
    return guid.substr(0, 8) + '-' + guid.substr(8, 4) + '-' + guid.substr(12, 4) + '-' + guid.substr(16, 4) + '-' + guid.substr(20, 12);
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

    var guid = generateGUID(providerSchema['DeviceID']);

    return {
        opent2t: {
            schema: 'org.opent2t.sample.binaryswitch.superpopular',
            translator: 'opent2t-translator-com-insteon-binaryswitch',
            controlId: providerSchema['DeviceID']
        },
        pi: guid,
        mnmn: providerSchema['device_manufacturer'],
        mnmo: providerSchema['manufacturer_device_model'],
        n: providerSchema['DeviceName'],
        rt: ['org.opent2t.sample.binaryswitch.superpopular'],
        entities: [
            {
                rt: ['oic.d.smartplug'],
                di: guid,
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
            throw new Error("Invalid resourceId");
    }
    return result;
}

function getDeviceResource(translator, di, resourceId) {
    return translator.get(true)
        .then(response => {
            return findResource(response, di, resourceId);
        });
}

function postDeviceResource(di, resourceId, payload) {
    if (di === generateGUID(controlId)) {
        var putPayload = resourceSchemaToProviderSchema(resourceId, payload);

        return insteonHub.putDeviceDetailsAsync(controlId, putPayload)
            .then((response) => {
                var schema = providerSchemaToPlatformSchema(response, true);
                return findResource(schema, di, resourceId);
            });
    }
}

var controlId;
var deviceType = 'binary_switches';
var insteonHub;

// This translator class implements the 'org.opent2t.sample.binaryswitch.superpopular' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('Insteon Binary Switch initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
        
        controlId = deviceInfo.deviceInfo.opent2t.controlId;
        insteonHub = deviceInfo.hub;

        console.log('Insteon Binary Switch initializing...Done');
    }

    // exports for the entire schema object

    // Queries the entire state of the binary switch
    // and returns an object that maps to the json schema org.opent2t.sample.binaryswitch.superpopular
    get(expand, payload) {
        if (payload) {
            return  providerSchemaToPlatformSchema(payload, expand);
        }
        else {
            return insteonHub.getDeviceDetailsAsync(controlId)
                .then((response) => {
                    return providerSchemaToPlatformSchema(response, expand);
                });
        }
    }

    getDevicesPower(di) {
        return getDeviceResource(this, di, 'power');
    }

    postDevicesPower(di, payload) {
        return postDeviceResource(di, 'power', payload);
    }

    postSubscribe(subscriptionInfo) {
        return insteonHub._subscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        return insteonHub._unsubscribe(subscriptionInfo);
    }
}

// Export the translator from the module.
module.exports = Translator;
