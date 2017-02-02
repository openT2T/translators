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
 * Generate a GUID for given an ID.
 */
function generateGUID(stringID) {
    var guid = crypto.createHash('sha1').update('Nest' + stringID).digest('hex');
    return guid.substr(0, 8) + '-' + guid.substr(8, 4) + '-' + guid.substr(12, 4) + '-' + guid.substr(16, 4) + '-' + guid.substr(20, 12);
}

var deviceHvacModeToTranslatorHvacModeMap = {
    'cool': 'coolOnly',
    'heat': 'heatOnly',
    'heat-cool': 'auto',
    'off': 'off'
}

var translatorHvacModeToDeviceHvacModeMap = {
    'coolOnly': 'cool',
    'heatOnly': 'heat',
    'auto': 'heat-cool',
    'off': 'off'
}

function deviceHvacModeToTranslatorHvacMode(mode) {
    return deviceHvacModeToTranslatorHvacModeMap[mode];
}

function translatorHvacModeToDeviceHvacMode(mode) {
    return translatorHvacModeToDeviceHvacModeMap[mode];
}

function readHvacMode(deviceSchema) {
    // Assume 'auto' and 'off' are always supported
    var supportedHvacModes = [
        'auto',
        'off'
    ];

    if (deviceSchema['can_cool']) {
        supportedHvacModes.push('coolOnly');
    }
    if (deviceSchema['can_heat']) {
        supportedHvacModes.push('heatOnly');
    }

    var hvacMode = deviceHvacModeToTranslatorHvacMode(deviceSchema['hvac_mode']);
    if (hvacMode === undefined) deviceHvacModeToTranslatorHvacMode(deviceSchema['hvac_state']);

    return {
        supportedModes: supportedHvacModes,
        modes: [hvacMode]
    };
}

function createResource(resourceType, accessLevel, id, expand, state) {
    var resource = {
        href: '/' + id,
        rt: [resourceType],
        if: [accessLevel, 'oic.if.baseline']
    }

    if (expand) {
        resource.id = id;
        Object.assign(resource, state);
    }

    return resource;
}

// Helper method to convert the provider schema to the platform schema.
function providerSchemaToPlatformSchema(providerSchema, expand) {

    // Quirks:
    // - Nest does not have an external temperature field, so that is left out.
    // - Away Mode is not implemented at this time.
    
    // Get temperature scale
    var ts = providerSchema['temperature_scale'] !== undefined ? providerSchema['temperature_scale'].toLowerCase() : undefined;

    var ambientTemperature = createResource('oic.r.temperature', 'oic.if.s', 'ambientTemperature', expand, {
        temperature: providerSchema['ambient_temperature_' + ts],
        units: ts
    });

    var targetTemperature = createResource('oic.r.temperature', 'oic.if.a', 'targetTemperature', expand, {
        temperature: providerSchema['target_temperature_' + ts],
        units: ts
    });

    var targetTemperatureHigh = createResource('oic.r.temperature', 'oic.if.a', 'targetTemperatureHigh', expand, {
        temperature: providerSchema['target_temperature_high_' + ts],
        units: ts
    });

    var targetTemperatureLow = createResource('oic.r.temperature', 'oic.if.a', 'targetTemperatureLow', expand, {
        temperature: providerSchema['target_temperature_low_' + ts],
        units: ts
    });

    var awayTemperatureHigh = createResource('oic.r.temperature', 'oic.if.s', 'awayTemperatureHigh', expand, {
        temperature: providerSchema['away_temperature_high_' + ts],
        units: ts
    });

    var awayTemperatureLow = createResource('oic.r.temperature', 'oic.if.s', 'awayTemperatureLow', expand, {
        temperature: providerSchema['away_temperature_low_' + ts],
        units: ts
    });

    var humidity = createResource('oic.r.humidity', 'oic.if.s', 'humidity', expand, {
        humidity: providerSchema['humidity']
    });

    var awayMode = createResource('oic.r.mode', 'oic.if.a', 'awayMode', expand, {
        modes:  providerSchema['away'],
        supportedModes: ['home', 'away']
    });
    
    var ecoMode = createResource('oic.r.sensor', 'oic.if.s', 'ecoMode', expand, {
        value: providerSchema['has_leaf']
    });

    var hvacMode = createResource('oic.r.mode', 'oic.if.a', 'hvacMode', expand, readHvacMode(providerSchema));

    var hasFan = createResource('oic.r.sensor', 'oic.if.s', 'hasFan', expand, {
        value: providerSchema['has_fan']
    });

    var fanActive = createResource('oic.r.sensor', 'oic.if.a', 'fanActive', expand, {
        value: providerSchema['fan_timer_active']
    });

    var fanTimerActive = createResource('oic.r.sensor', 'oic.if.a', 'fanTimerActive', expand, {
        value: providerSchema['fan_timer_active']
    });

    var guid = generateGUID(providerSchema['device_id']);

    return {
        opent2t: {
            schema: 'org.opent2t.sample.thermostat.superpopular',
            translator: 'opent2t-translator-com-nest-thermostat',
            controlId: providerSchema['device_id'],
            structureId: providerSchema['structure_id']
        },
        pi: guid,
        mnmn: 'Nest',
        mnmo: 'Undefined',
        n: providerSchema['name_long'],
        rt: ['org.opent2t.sample.thermostat.superpopular'],
        entities: [
            {
                rt: ['opent2t.d.thermostat'],
                di: guid,
                resources: [
                    ambientTemperature,
                    targetTemperature,
                    targetTemperatureHigh,
                    targetTemperatureLow,
                    awayTemperatureHigh,
                    awayTemperatureLow,
                    humidity,
                    awayMode,
                    ecoMode,
                    hvacMode,
                    hasFan,
                    fanActive,
                    fanTimerActive
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
        case 'targetTemperature':
            if (resourceSchema.units === undefined) throw new Error('Resource Schema missing temperature units.');
            result['target_temperature_' + resourceSchema.units.toLowerCase()] = resourceSchema.temperature;
            break;
        case 'targetTemperatureHigh':
            if (resourceSchema.units === undefined) throw new Error('Resource Schema missing temperature units.');
            result['target_temperature_high_' + resourceSchema.units.toLowerCase()] = resourceSchema.temperature;
            break;
        case 'targetTemperatureLow':
            if (resourceSchema.units === undefined) throw new Error('Resource Schema missing temperature units.');
            result['target_temperature_low_' + resourceSchema.units.toLowerCase()] = resourceSchema.temperature;
            break;
        case 'hvacMode':
            result['hvac_mode'] = translatorHvacModeToDeviceHvacMode(resourceSchema.modes[0]);
            break;
        case 'fanActive':
        case 'fanTimerActive':
            result['fan_timer_active'] = resourceSchema.value;
            break;
        case 'awayMode':
            result['away'] = resourceSchema.modes[0];
            break;
        case 'ambientTemperature':
        case 'awayTemperatureHigh':
        case 'awayTemperatureLow':
        case 'humidity':
        case 'ecoMode':
        case 'fanTimerTimeout':
            throw new Error('NotMutable');
        default:
            throw new Error('NotFound');
    }

    return result;
}

function validateResourceGet(resourceId) {
    switch (resourceId) {
        case 'heatingFuelSource':
        case 'fanMode':
        case 'fanTimerTimeout':
            throw new Error('NotImplemented');
    }
}

function findResource(schema, di, resourceId) {
    var entity = schema.entities.find((d) => {
        return d.di === di;
    });

    if (!entity) {
        throw new Error('NotFound');
    }

    var resource = entity.resources.find((r) => {
        return r.id === resourceId;
    });

    if (!resource) {
        throw new Error('NotFound');
    }

    return resource;
}

function getDeviceResource(translator, di, resourceId) {
    validateResourceGet(resourceId);

    return translator.get(true)
        .then(response => {
            return findResource(response, di, resourceId);
        });
}

function postDeviceResource(di, resourceId, payload) {
    if (di === generateGUID(controlId))
    {
        var putPayload = resourceSchemaToProviderSchema(resourceId, payload);

        if (resourceId === 'awayMode') {
            return nestHub.setAwayMode(structureId, controlId, putPayload)
                .then((response) => {
                    var schema = providerSchemaToPlatformSchema(response, true);
                    return findResource(schema, di, resourceId);
                });
        } else {
            return nestHub.putDeviceDetailsAsync(deviceType, controlId, putPayload)
                .then((response) => {
                    var schema = providerSchemaToPlatformSchema(response, true);
                    return findResource(schema, di, resourceId);
                });
        }
    } else {
        throw new Error('NotFound');
    }
}

var structureId;
var controlId;
var deviceType = 'thermostats';
var nestHub;

// This translator class implements the 'org.opent2t.sample.thermostat.superpopular' interface.
class Translator {

    constructor(deviceInfo) {
        console.log('Nest Thermostat initializing...');

        validateArgumentType(deviceInfo, "deviceInfo", "object");
        controlId = deviceInfo.deviceInfo.opent2t.controlId;
        structureId = deviceInfo.deviceInfo.opent2t.structureId;
        nestHub = deviceInfo.hub;

        console.log('Nest Thermostat initializing...Done');
    }

    // Queries the entire state of the binary switch
    // and returns an object that maps to the json schema opent2t.p.thermostat
    get(expand, payload) {
        if (payload) {
            return providerSchemaToPlatformSchema(payload, expand);
        } else {
            return nestHub.getDeviceDetailsAsync(deviceType, controlId)
                .then((response) => {
                    return providerSchemaToPlatformSchema(response, expand);
                });
        }
    }

    getDevicesAmbientTemperature(di) {
        return getDeviceResource(this, di, 'ambientTemperature');
    }

    getDevicesTargetTemperature(di) {
        return getDeviceResource(this, di, 'targetTemperature');
    }

    postDevicesTargetTemperature(di, payload) {
        return postDeviceResource(di, 'targetTemperature', payload);
    }

    getDevicesHumidity(di) {
        return getDeviceResource(this, di, 'humidity');
    }

    getDevicesTargetTemperatureHigh(di) {
        return getDeviceResource(this, di, 'targetTemperatureHigh');
    }

    postDevicesTargetTemperatureHigh(di, payload) {
        return postDeviceResource(di, 'targetTemperatureHigh', payload);
    }

    getDevicesTargetTemperatureLow(di) {
        return getDeviceResource(this, di, 'targetTemperatureLow');
    }

    postDevicesTargetTemperatureLow(di, payload) {
        return postDeviceResource(di, 'targetTemperatureLow', payload);
    }

    getDevicesAwayMode(di) {
        return getDeviceResource(this, di, 'awayMode');
    }

    postDevicesAwayMode(di, payload) {
        return postDeviceResource(di, 'awayMode', payload);
    }

    getDevicesAwayTemperatureHigh(di) {
        return getDeviceResource(this, di, 'awayTemperatureHigh');
    }

    postDevicesAwayTemperatureHigh(di, payload) {
        return postDeviceResource(di, 'awayTemperatureHigh', payload);
    }

    getDevicesAwayTemperatureLow(di) {
        return getDeviceResource(this, di, 'awayTemperatureLow');
    }

    postDevicesAwayTemperatureLow(di, payload) {
        return postDeviceResource(di, 'awayTemperatureLow', payload);
    }

    getDevicesEcoMode(di) {
        return getDeviceResource(this, di, 'ecoMode');
    }

    getDevicesHvacMode(di) {
        return getDeviceResource(this, di, 'hvacMode');
    }

    postDevicesHvacMode(di, payload) {
        return postDeviceResource(di, 'hvacMode', payload);
    }

    getDevicesHeatingFuelSource(di) {
        return getDeviceResource(this, di, 'heatingFuelSource');
    }

    getDevicesHasFan(di) {
        return getDeviceResource(this, di, 'hasFan');
    }

    getDevicesFanActive(di) {
        return getDeviceResource(this, di, 'fanActive');
    }

    getDevicesFanTimerActive(di) {
        return getDeviceResource(this, di, 'fanTimerActive');
    }

    getDevicesFanTimerTimeout(di) {
        return getDeviceResource(this, di, 'fanTimerTimeout');
    }

    postDevicesFanTimerTimeout(di, payload) {
        return postDeviceResource(di, 'fanTimerTimeout', payload);
    }

    getDevicesFanMode(di) {
        return getDeviceResource(this, di, 'fanMode');
    }

    postDevicesFanMode(di, payload) {
        return postDeviceResource(di, 'fanMode', payload);
    }

    postSubscribe(subscriptionInfo) {
        subscriptionInfo.controlId = controlId;
        return nestHub.postSubscribe(subscriptionInfo);
    }

    deleteSubscribe(subscriptionInfo) {
        subscriptionInfo.controlId = controlId;
        return nestHub._unsubscribe(subscriptionInfo);
    }
}

// Export the translator from the module.
module.exports = Translator;
