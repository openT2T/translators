'use strict';
var OpenT2TError = require('opent2t').OpenT2TError;
var OpenT2TConstants = require('opent2t').OpenT2TConstants;

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

var deviceType = 'light_bulbs';

// Each device in the platform has is own unique static identifier
const lightDeviceDi = 'F8CFB903-58BB-4753-97E0-72BD7DBC7933';

// This translator class implements the 'org.opent2t.sample.lamp.superpopular' interface.
class Translator {

    constructor(logger, deviceInfo) {
        this.name = "opent2t-translator-com-contosothings-lightbulb";
        this.logger = logger;
        this.logger.verbose('Wink Lamp initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
       
        this.deviceId = deviceInfo.deviceInfo.opent2t.controlId;
        this.contosothingsHub = deviceInfo.hub;

        this.logger.verbose('Contoso Lamp initializing...Done');
    }

    // exports for the entire schema object

    /**
     * Queries the entire state of the lamp
     * and returns an object that maps to the json schema org.opent2t.sample.lamp.superpopular
     */
    get(expand, payload) {
        if (payload) {
            return this.providerSchemaToPlatformSchema(payload, expand);
        } else {
            return this.contosothingsHub.getDeviceDetailsAsync(deviceType, this.deviceId)
                .then((response) => {
                    return this.providerSchemaToPlatformSchema(response, expand);
                });
        }
    }

    /**
     * Finds a resource on a platform by the id
     */
    getDeviceResource(di, resourceId) {
        switch (resourceId) {
            case 'colourMode':
            case 'colourRgb':
            case 'colourChroma':
                throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
        }
        
        return this.get(true)
            .then(response => {
                return this.findResource(response, di, resourceId);
        });
    }

    /**
     * Updates the specified resource with the provided payload.
     */
    postDeviceResource(di, resourceId, payload) {
        var putPayload = this.resourceSchemaToProviderSchema(resourceId, payload);
        return this.contosothingsHub.putDeviceDetailsAsync(deviceType, this.deviceId, putPayload)
            .then((response) => {
                var schema = this.providerSchemaToPlatformSchema(response, true);

                return this.findResource(schema, di, resourceId);
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

    postSubscribeLight(callbackUrl, verificationRequest, verificationResponse) {
        return this.contosothingsHub._subscribe(deviceType, this.deviceId, callbackUrl, verificationRequest, verificationResponse);
    }

    deleteSubscribeLight(callbackUrl) {
        return this.contosothingsHub._unsubscribe(deviceType, this.deviceId, callbackUrl);
    }

    /**
     * Finds a resource for an entity in a schema
     */
    findResource(schema, di, resourceId) {
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

    /***
     * Converts an OCF platform/resource schema for calls to the contosothings API
     */
    resourceSchemaToProviderSchema(resourceId, resourceSchema) {
        // build the object
        var result = { };
        result.deviceId = this.deviceId;

        switch(resourceId) {
            case 'power':
                result.propertyName = "Switch";
                result.value = resourceSchema.value;
                break;
            case 'dim':
                result.propertyName = "Dim";
                result.value = resourceSchema.dimmingSetting;
                break;
            case 'colourMode':
            case 'colourRgb':
            case 'colourChroma':
                throw new OpenT2TError(501, OpenT2TConstants.NotImplemented);
            default:
                // Error case
                throw new OpenT2TError(400, OpenT2TConstants.InvalidResourceId);
        }

        return result;    
    }

    /**
     * Converts a representation of a platform from the contosothings API into an OCF representation.
     */
    providerSchemaToPlatformSchema(providerSchema, expand) {
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
            power.value = providerSchema.Switch;

            // only if the light is dimmable
            if (providerSchema.Dim != undefined) {
                dim.id = 'dim';
                dim.dimmingSetting = providerSchema.Dim;
                dim.range = [0,100];
            }
        }

        var toReturn = {
            opent2t: {
                schema: 'org.opent2t.sample.lamp.superpopular',
                translator: 'opent2t-translator-com-contosothings-lightbulb',
                controlId: providerSchema["Id"]
            },
            availability: 'online',
            pi: providerSchema["Id"],
            mnmn: "ContosoThings",
            mnmo: "ctLight1",
            n: providerSchema['Name'],
            rt: ['org.opent2t.sample.lamp.superpopular'],
            entities: [
                {
                    n: providerSchema['Name'],
                    rt: ['opent2t.d.light'],
                    di: lightDeviceDi,
                    icv: 'core.1.1.0',
                    dmv: 'res.1.1.0',
                    resources: [
                        power
                    ]
                }
            ]
        };

        // only if the light is dimmable
        if (providerSchema.Dim != undefined) {
            toReturn.entities[0].resources.push(dim);
        }

        return toReturn;
    }

}

// Export the translator from the module.
module.exports = Translator;