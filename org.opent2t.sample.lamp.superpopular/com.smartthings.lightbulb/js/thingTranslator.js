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

/**
 * Converts a representation of a platform from the Wink API into an OCF representation.
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
        power.value = providerSchema['attributes'].switch == 'on';

        dim.id = 'dim';
        dim.dimmingSetting = providerSchema['attributes'].level;
        dim.range = [0, 100];
    }

    return {
        opent2t: {
            schema: 'org.opent2t.sample.lamp.superpopular',
            translator: 'opent2t-translator-com-smartthings-lightbulb',
            controlId: deviceId
        },
        pi: providerSchema['id'],
        mnmn: providerSchema['manufacturer'],
        mnmo: providerSchema['model'],
        n: providerSchema['name'],
        rt: ['org.opent2t.sample.lamp.superpopular'],
        entities: [
            {
                rt: ['opent2t.d.light'],
                di: providerSchema['id'],
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
 * Converts an OCF platform/resource schema for calls to the SmartThings API
 */
function resourceSchemaToProviderSchema(resourceId, resourceSchema) {

    // build the object with desired state
    var result = {};  

    switch (resourceId) {
        case 'power':
            result['switch'] = resourceSchema.value ? 'on' : 'off';
            break;
        case 'dim':
            result['level'] = resourceSchema.dimmingSetting;
            break;
        default:
            // Error case
            throw new Error("Invalid resourceId");
    }
    return result;
}

var deviceId;
var smartthingsHub;

// This translator class implements the 'opent2t.d.light' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('SmartThings Lightbulb initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
        
        deviceId = deviceId = deviceInfo.deviceInfo.opent2t.controlId;
        smartthingsHub = deviceInfo.hub;

        console.log('SmartThings Lightbulb initializing...Done');
    }

    // exports for the entire schema object

    /**
     * Queries the entire state of the lamp
     * and returns an object that maps to the json schema opent2t.d.light
     */
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        }
        else {
            return smartthingsHub.getDeviceDetailsAsync(deviceId)
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
        var putPayload = resourceSchemaToProviderSchema(resourceId, payload);

        return smartthingsHub.putDeviceDetailsAsync(deviceId, putPayload)
            .then((response) => {
                var schema = providerSchemaToPlatformSchema(response, true);

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

    /*jslint unparam: true*/
    postSubscribe(callbackUrl, verificationRequest) {
        return smartThingsHub._subscribe(controlId);
    }

    deleteSubscribe(callbackUrl) {
        return smartThingsHub._unsubscribe(controlId);
    }
    /*jslint unparam: false*/
}

// Export the translator from the module.
module.exports = Translator;
