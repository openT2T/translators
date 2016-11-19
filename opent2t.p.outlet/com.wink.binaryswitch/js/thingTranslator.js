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
    
    if (expand) {
        power.id = 'power';
        power.value = powered;
    }

    return {
        opent2t: {
            schema: 'opent2t.p.outlet',
            translator: 'opent2t-translator-com-wink-binaryswitch',
            controlId: deviceId
        },
        pi: providerSchema['uuid'],
        mnmn: providerSchema['device_manufacturer'],
        mnmo: providerSchema['manufacturer_device_model'],
        n: providerSchema['name'],
        rt: ['opent2t.p.outlet'],
        entities: [
            {
                rt: ['oic.d.smartplug'],
                di: smartplugDeviceDi,
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
    var result = { 'desired_state': {} };
    var desired_state = result.desired_state;

    if ('power' === resourceId) {
        desired_state['powered'] = resourceSchema.value;
    }

    return result;
}

function findResource(schema, di, resourceId) {
    var entity = schema.entities.find((d) => {
        return d.di === di;
    });

    var resource = entity.resources.find((r) => {
        return r.id === resourceId;
    });

    return resource;
}

function getDeviceResource(translator, di, resourceId) {
    return translator.get(true)
        .then(response => {
            return findResource(response, di, resourceId);
        });
}

function postDeviceResource(di, resourceId, payload) {
    if (di === smartplugDeviceDi) {
        var putPayload = resourceSchemaToProviderSchema(resourceId, payload);

        return winkHub.putDeviceDetailsAsync(deviceType, deviceId, putPayload)
            .then((response) => {
                var schema = providerSchemaToPlatformSchema(response.data, true);

                return findResource(schema, di, resourceId);
            });
    }
}

var deviceId;
var deviceType = 'binary_switches';
var winkHub;

// Each device in the platform has its own static identifier
const smartplugDeviceDi = 'F85B0738-6EC0-4A8B-A95A-503B6F2CA0D8';

// This translator class implements the 'opent2t.p.outlet' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('Wink Binary Switch initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
        
        deviceId = deviceInfo.deviceInfo.opent2t.controlId;
        winkHub = deviceInfo.hub;

        console.log('Wink Binary Switch initializing...Done');
    }

    // exports for the entire schema object

    // Queries the entire state of the binary switch
    // and returns an object that maps to the json schema opent2t.p.outlet
    get(expand, payload) {
        if (payload) {
            return  providerSchemaToPlatformSchema(payload, expand);
        }
        else {
            return winkHub.getDeviceDetailsAsync(deviceType, deviceId)
                .then((response) => {
                    return providerSchemaToPlatformSchema(response.data, expand);
                });
        }
    }

    getDevicesPower(di) {
        return getDeviceResource(this, di, 'power');
    }

    postDevicesPower(di, payload) {
        return postDeviceResource(di, 'power', payload);
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
