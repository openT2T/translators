'use strict';

var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;
var crypto = require('crypto');

// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

/**
 * Generate a GUID for given an ID.
 */
function generateGUID(stringID) {
    var guid = crypto.createHash('sha1').update('SmartThings' + stringID).digest('hex');
    return `${guid.substr(0, 8)}-${guid.substr(8, 4)}-${guid.substr(12, 4)}-${guid.substr(16, 4)}-${guid.substr(20, 12)}`;
}

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
 * Returns a default value if the specified property is null, undefined, or an empty string
 */
function defaultValueIfEmpty(property, defaultValue) {
    if (property === undefined || property === null || property === "") {
        return defaultValue;
    } else {
        return property;
    }
}

// Helper method to convert the device schema to the translator schema.
function providerSchemaToPlatformSchema(providerSchema, expand) {

    var power = {
        href: '/power',
        rt: ['oic.r.switch.binary'],
        if: ['oic.if.a', 'oic.if.baseline']
    };

    if (expand) {
        power.id = 'power';
        power.value = providerSchema['attributes'].switch == 'on';
    }

    return {
        opent2t: {
            schema: 'org.opent2t.sample.binaryswitch.superpopular',
            translator: 'opent2t-translator-com-smartthings-binaryswitch',
            controlId: providerSchema['id'],
            endpointUri: providerSchema['endpointUri']
        },
        availability: providerSchema['status'] === 'ONLINE' || providerSchema['status'] === 'ACTIVE' ? 'online' : 'offline',
        pi: providerSchema['id'],
        mnmn: defaultValueIfEmpty(providerSchema['manufacturer'], "SmartThings"),
        mnmo: defaultValueIfEmpty(providerSchema['model'], "Binary Switch (Generic)"),
        n: providerSchema['name'],
        rt: ['org.opent2t.sample.binaryswitch.superpopular'],
        entities: [
            {
                n: providerSchema['name'],
                icv: "core.1.1.0",
                dmv: "res.1.1.0",
                rt: ['oic.d.smartplug'],
                di: generateGUID( providerSchema['id'] + 'oic.d.smartplug' ),
                resources: [ power ]
            }
        ]
    };
}

// Helper method to convert the translator schema to the device schema.
function resourceSchemaToProviderSchema(resourceId, resourceSchema) {

    // build the object with desired state
    var result = {};

    if ('power' === resourceId) {
        result['switch'] = resourceSchema.value ? 'on' : 'off';
    } else {
        throw new OpenT2TError(400, OpenT2TConstants.InvalidResourceId);
    }

    return result;
}

// This translator class implements the 'org.opent2t.sample.binaryswitch.superpopular' interface.
class Translator {

    constructor(deviceInfo, logger) {
        this.name = "opent2t-translator-com-smartthings-binaryswitch";
        this.logger = logger;

        validateArgumentType(deviceInfo, "deviceInfo", "object");
        
        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.endpointUri = deviceInfo.deviceInfo.opent2t.endpointUri;
        this.smartThingsHub = deviceInfo.hub;

        this.logger.info('SmartThings Binary Switch initializing...Done');
    }

    /**
     * Queries the entire state of the binary switch
     * and returns an object that maps to the json schema org.opent2t.sample.binaryswitch.superpopular
     */
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        } else {
            return this.smartThingsHub.getDeviceDetailsAsync(this.endpointUri, this.controlId)
                .then((response) => {
                    return providerSchemaToPlatformSchema(response, expand);
                });
        }
    }

    getDeviceResource(di, resourceId) {
        return this.get(true)
            .then(response => {
                return findResource(response, di, resourceId);
            });
    }

    postDeviceResource(di, resourceId, payload) {
        if (di === generateGUID( this.controlId + 'oic.d.smartplug' )) {
            var putPayload = resourceSchemaToProviderSchema(resourceId, payload);

            return this.smartThingsHub.putDeviceDetailsAsync(this.endpointUri, this.controlId, putPayload)
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
        subscriptionInfo.controlId = this.controlId;
        subscriptionInfo.endpointUri = this.endpointUri;
        return this.smartThingsHub._subscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        subscriptionInfo.controlId = this.controlId;
        subscriptionInfo.endpointUri = this.endpointUri;
        return this.smartThingsHub._unsubscribe(subscriptionInfo);
    }
}

// Export the translator from the module.
module.exports = Translator;