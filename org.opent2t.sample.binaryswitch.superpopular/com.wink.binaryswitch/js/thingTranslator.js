'use strict';
var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TLogger = require('opent2t').Logger;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;

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
        throw new OpenT2TError(404, 'Entity - ' + di + ' not found.');
    }

    var resource = entity.resources.find((r) => {
        return r.id === resourceId;
    });

    if (!resource) {
        throw new OpenT2TError(404, 'Resource with resourceId \"' + resourceId + '\" not found.');
    }
    return resource;
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
    var stateReader = new StateReader(providerSchema.desired_state, providerSchema.last_reading);

    var powered = stateReader.get('powered');

    var power = {
        href: '/power',
        rt: ['oic.r.switch.binary'],
        if: ['oic.if.a', 'oic.if.baseline']
    };

    // Build the availability resource (read-only)
    var availability = {
        "href": "/availability",
        "rt": ["oic.r.mode"],
        "if": ["oic.if.s", "oic.if.baseline"]
    }
    
    if (expand) {
        power.id = 'power';
        power.value = powered;
        
        availability.id = 'availability';
        availability.supportedModes = ['online', 'offline', 'hidden', 'deleted'],
        availability.modes = [ stateReader.get('connection') ? 'online' : 'offline' ];
    }

    return {
        opent2t: {
            schema: 'org.opent2t.sample.binaryswitch.superpopular',
            translator: 'opent2t-translator-com-wink-binaryswitch',
            controlId: providerSchema.binary_switch_id
        },
        pi: providerSchema['uuid'],
        mnmn: defaultValueIfEmpty(providerSchema['device_manufacturer'], "Wink"),
        mnmo: defaultValueIfEmpty(providerSchema['manufacturer_device_model'], "Binary Switch (Generic)"),
        n: providerSchema['name'],
        rt: ['org.opent2t.sample.binaryswitch.superpopular'],
        entities: [
            {
                n: providerSchema['name'],
                icv: "core.1.1.0",
                dmv: "res.1.1.0",
                rt: ['oic.d.smartplug'],
                di: smartplugDeviceDi,
                resources: [
                    power,
                    availability
                ]
            }
        ]
    };
}

// Helper method to convert the translator schema to the device schema.
function resourceSchemaToProviderSchema(resourceId, resourceSchema) {

    // build the object with desired state
    var result = { 'desired_state': {} };
    var desired_state = result.desired_state;

    if ('power' === resourceId) {
        desired_state['powered'] = resourceSchema.value;
    }else{
        throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
    }

    return result;
}

// Each device in the platform has its own static identifier
const smartplugDeviceDi = 'F85B0738-6EC0-4A8B-A95A-503B6F2CA0D8';

// This translator class implements the 'org.opent2t.sample.binaryswitch.superpopular' interface.
class Translator {

    constructor(deviceInfo, logLevel = "info") {
        this.ConsoleLogger = new OpenT2TLogger(logLevel); 
        this.ConsoleLogger.verbose('Wink Binary Switch initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
        
        this.controlId = deviceInfo.deviceInfo.opent2t.controlId;
        this.deviceType = 'binary_switches';
        this.winkHub = deviceInfo.hub;

        this.ConsoleLogger.verbose('Wink Binary Switch initializing...Done');
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
        return this.get(true)
            .then(response => {
                return findResource(response, di, resourceId);
            });
    }

    /**
     * Updates the specified resource with the provided payload.
     */
    postDeviceResource(di, resourceId, payload) {
        if (di === smartplugDeviceDi) {
            var putPayload = resourceSchemaToProviderSchema(resourceId, payload);

            return this.winkHub.putDeviceDetailsAsync(this.deviceType, this.controlId, putPayload)
                .then((response) => {
                    var schema = providerSchemaToPlatformSchema(response.data, true);

                    return findResource(schema, di, resourceId);
                });
        }
    }


    getDevicesPower(di) {
        return this.getDeviceResource(di, 'power');
    }

    postDevicesPower(di, payload) {
        return this.postDeviceResource(di, 'power', payload);
    }

    getDevicesAvailability(di) {
        return this.getDeviceResource(di, "availability");
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
