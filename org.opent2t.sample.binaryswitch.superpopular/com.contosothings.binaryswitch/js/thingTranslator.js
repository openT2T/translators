'use strict';

/**
 * Validates an argument matches the expected type.
 */
function validateArgumentType(arg, argName, expectedType) {
    if (typeof arg === 'undefined') {
        throw new Error('Missing argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + '.');
    } else if (typeof arg !== expectedType) {
        throw new Error('Invalid argument: ' + argName + '. ' +
            'Expected type: ' + expectedType + ', got: ' + (typeof arg));
    }
}

var deviceType = 'binary_switches';

// Each device in the platform has its own static identifier
const lightDeviceDi = 'F85B0738-6EC0-4A8B-A95A-503B6F2CA0D8';

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
        }
        else {
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
        if (di === lightDeviceDi) {
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
            pi: providerSchema["Id"],
            mnmn: "ContosoThings",
            mnmo: "ctSwitch1",
            n: providerSchema['Name'],
            rt: ['org.opent2t.sample.binaryswitch.superpopular'],
            entities: [
                {
                    rt: ['oic.d.smartplug'],
                    di: lightDeviceDi,
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
