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
            controlId: controlId
        },
        pi: providerSchema['id'],
        mnmn: validateValue(providerSchema['manufacturer']),
        mnmo: validateValue(providerSchema['model']),
        n: providerSchema['name'],
        rt: ['org.opent2t.sample.binaryswitch.superpopular'],
        entities: [
            {
                rt: ['oic.d.smartplug'],
                di: providerSchema['id'],
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
    if (di === controlId){
        var putPayload = resourceSchemaToProviderSchema(resourceId, payload);

        return smartThingsHub.putDeviceDetailsAsync(controlId, putPayload)
            .then((response) => {
                var schema = providerSchemaToPlatformSchema(response, true);

                return findResource(schema, di, resourceId);
            });
    } else {
        throw new Error('NotFound');
    }
}

var controlId;
var smartThingsHub;

// This translator class implements the 'org.opent2t.sample.binaryswitch.superpopular' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('SmartThings Binary Switch initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
        
        controlId = deviceInfo.deviceInfo.opent2t.controlId;
        smartThingsHub = deviceInfo.hub;

        console.log('SmartThings Binary Switch initializing...Done');
    }

    // exports for the entire schema object

    // Queries the entire state of the outlet
    // and returns an object that maps to the json schema org.opent2t.sample.binaryswitch.superpopular
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        }
        else {
            return smartThingsHub.getDeviceDetailsAsync(controlId)
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
    
    /* eslint no-unused-vars: "off" */
    postSubscribe(callbackUrl, verificationRequest) {
        return smartThingsHub._subscribe(controlId);
    }

    deleteSubscribe(callbackUrl) {
        return smartThingsHub._unsubscribe(controlId);
    }
    /* eslint no-unused-vars: "warn" */
}

// Export the translator from the module.
module.exports = Translator;
