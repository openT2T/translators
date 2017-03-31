'use strict';
var OpenT2TError = require('opent2t').OpenT2TError;
var crypto = require('crypto');

/**
 * Generate a GUID for a given ID.
 */
function generateGUID(stringID) {
    var guid = crypto.createHash('sha1').update('Contoso' + stringID).digest('hex');
    return `${guid.substr(0, 8)}-${guid.substr(8, 4)}-${guid.substr(12, 4)}-${guid.substr(16, 4)}-${guid.substr(20, 12)}`;
}

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

var deviceType = 'binary_switches';

// This translator class implements the 'opent2t.p.outlet' interface.
class Translator {

    constructor(deviceInfo) {
        validateArgumentType(deviceInfo, "deviceInfo", "object");
        
        this.deviceId = deviceInfo.deviceInfo.opent2t.controlId;
        this.contosothingsHub = deviceInfo.hub;
    }

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
        return this.get(true)
            .then(response => {
                return this.findResource(response, di, resourceId);
        });
    }

    postDeviceResource(di, resourceId, payload) {
        if (di === generateGUID( this.deviceId + 'oic.d.smartplug' )) {
            var putPayload = this.resourceSchemaToProviderSchema(resourceId, payload);

            return this.contosothingsHub.putDeviceDetailsAsync(deviceType, this.deviceId, putPayload)
                .then((response) => {
                    var schema = this.providerSchemaToPlatformSchema(response, true);

                    return this.findResource(schema, di, resourceId);
                });
        }
    }

    getDevicesPower(di) {
        return this.getDeviceResource(di, 'power');
    }

    postDevicesPower(di, payload) {
        return this.postDeviceResource(di, 'power', payload);
    }

    // Helper method to convert the provider schema to the platform schema.
    providerSchemaToPlatformSchema(providerSchema, expand) {
        var powered = providerSchema.Switch;

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
                schema: 'org.opent2t.sample.binaryswitch.superpopular',
                translator: 'opent2t-translator-com-contosothings-binaryswitch',
                controlId: this.deviceId
            },
            availability: 'online',
            pi: providerSchema["Id"],
            mnmn: "ContosoThings",
            mnmo: "ctSwitch1",
            n: providerSchema['Name'],
            rt: ['org.opent2t.sample.binaryswitch.superpopular'],
            entities: [
                {
                    n: providerSchema['Name'],
                    rt: ['oic.d.smartplug'],
                    di: generateGUID( this.deviceId + 'oic.d.smartplug' ),
                    icv: 'core.1.1.0',
                    dmv: 'res.1.1.0',
                    resources: [
                        power
                    ]
                }
            ]
        };
    }

    // Helper method to convert the translator schema to the device schema.
    resourceSchemaToProviderSchema(resourceId, resourceSchema) {
        var result = {};
        result.deviceId = this.deviceId;
        if ('power' === resourceId) {
            result.propertyName = "Switch";
            result.value = resourceSchema.value;
        }

        return result;
    }

    findResource(schema, di, resourceId) {
        var entity = schema.entities.find((d) => {
            return d.di === di;
        });

        var resource = entity.resources.find((r) => {
            return r.id === resourceId;
        });

        return resource;
    }
}

// Export the translator from the module.
module.exports = Translator;
